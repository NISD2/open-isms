#!/usr/bin/env bash
#
# open-isms installer.
#
#   curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh | bash
#
# Downloads the compose file, writes a .env with generated secrets, starts the
# stack, waits for it to be healthy, and loads the NIS 2 framework data. No
# clone, no fork, no build, and nothing to install beyond Docker.
#
# Written for someone who has never used Docker. Every step says what it is
# doing, every failure says what to do about it, and nothing is destructive: a
# second run reuses the .env it already wrote rather than generating new
# secrets, because regenerating POSTGRES_PASSWORD would lock the database out
# of its own data. If the .env is gone but the database is not, it stops and
# says so rather than writing a password the database will refuse.
#
# Options (all optional):
#   --dir <path>    where to install            (default: ./open-isms)
#   --url <url>     the address people will type (default: http://localhost:3026)
#   --domain <name> shorthand for a public HTTPS install with automatic
#                   certificates; implies --url https://<name>
#   --no-start      write the files, start nothing
#
set -euo pipefail

# Overridable so the installer can be tested against a checkout before the
# files it downloads exist on main: REPO_RAW=file:///path/to/repo ./install.sh
REPO_RAW="${REPO_RAW:-https://raw.githubusercontent.com/NISD2/open-isms/main}"
DIR="./open-isms"
URL=""
DOMAIN=""
START=1

# ---------------------------------------------------------------- output ----

if [ -t 1 ]; then
  BOLD=$(printf '\033[1m') DIM=$(printf '\033[2m') RESET=$(printf '\033[0m')
  RED=$(printf '\033[31m') GREEN=$(printf '\033[32m') YELLOW=$(printf '\033[33m')
else
  BOLD="" DIM="" RESET="" RED="" GREEN="" YELLOW=""
fi

step()  { printf '\n%s==>%s %s%s\n' "$BOLD" "$RESET" "$1" "$RESET"; }
info()  { printf '    %s\n' "$1"; }
note()  { printf '    %s%s%s\n' "$DIM" "$1" "$RESET"; }
warn()  { printf '    %s%s%s\n' "$YELLOW" "$1" "$RESET"; }
ok()    { printf '    %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
die()   { printf '\n%serror:%s %s\n\n' "$RED" "$RESET" "$1" >&2; exit 1; }

# ------------------------------------------------------------- arguments ----

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)      DIR="${2:?--dir needs a path}"; shift 2 ;;
    --url)      URL="${2:?--url needs a URL}"; shift 2 ;;
    --domain)   DOMAIN="${2:?--domain needs a hostname}"; shift 2 ;;
    --no-start) START=0; shift ;;
    -h|--help)  sed -n '3,24p' "$0"; exit 0 ;;
    *)          die "unknown option: $1" ;;
  esac
done

if [ -n "$DOMAIN" ] && [ -z "$URL" ]; then
  URL="https://$DOMAIN"
fi

# ----------------------------------------------------------------- ports ----

# Something else on the machine listening on 3026, 5432 or 9000 is common
# enough that it is worth handling rather than reporting. Docker's own message
# for it ("Bind for 0.0.0.0:9000 failed: port is already allocated") names a
# port and nothing else, and the fix requires knowing that MINIO_PORT and
# AWS_S3_ENDPOINT have to move together.
#
# bash's /dev/tcp is used instead of lsof, nc or ss: none of those are present
# on every machine this has to run on, and this one is built in.
port_in_use() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null || return 1
  exec 3>&-
  return 0
}

# Reads a value out of .env, falling back to a default. The `|| true` is
# load-bearing: under `set -e`, a grep that matches nothing exits 1 and takes
# the whole script down mid-step. POSTGRES_USER is not in the example .env at
# all, which is how that bug got in here in the first place.
env_value() {
  value=$(grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- || true)
  printf '%s' "${value:-$2}"
}

next_free_port() {
  port="$1"
  while port_in_use "$port"; do
    port=$((port + 1))
  done
  printf '%s' "$port"
}

# The compose project name, which is what namespaces the volumes. Compose
# derives it from the directory name: lowercased, anything outside [a-z0-9_-]
# DROPPED (not replaced, which is the version of this that shipped in review
# and silently missed every directory with a dot or a space in it), leading
# separators removed. Verified against `docker compose config` for
# "open-isms.v2", "Open ISMS" and "_weird+name".
#
# Reimplemented rather than read back from compose itself, because
# `docker compose config` interpolates POSTGRES_PASSWORD and so fails at
# exactly the moment this is needed: before there is a .env.
#
# COMPOSE_PROJECT_NAME wins, and compose reads it from the .env file as well
# as from the environment, so both are checked. Someone running two instances
# on one host sets it there.
project_name() {
  if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
    printf '%s' "$COMPOSE_PROJECT_NAME"
    return 0
  fi
  from_env=$(env_value COMPOSE_PROJECT_NAME "")
  if [ -n "$from_env" ]; then
    printf '%s' "$from_env"
    return 0
  fi
  basename "$(pwd)" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9_-]//g; s/^[_-]*//'
}

# Is there already a database on this machine that this install would attach
# to? Volumes outlive both `docker compose down` and `rm -rf` of this
# directory, so "starting over" usually does not start over.
postgres_volume_exists() {
  [ -n "$(docker volume ls -q \
    --filter "label=com.docker.compose.project=$(project_name)" \
    --filter "label=com.docker.compose.volume=postgres-data" 2>/dev/null)" ]
}

# ------------------------------------------------------------- preflight ----

step "Checking what is installed"

if ! command -v docker >/dev/null 2>&1; then
  die "Docker is not installed.

  open-isms runs in Docker, which is the standard way to run server software
  without installing its parts one by one.

    macOS or Windows   https://www.docker.com/products/docker-desktop/
    Linux              https://docs.docker.com/engine/install/
    Synology NAS       Package Center, install \"Container Manager\"

  Install it, then run this script again."
fi

if ! docker info >/dev/null 2>&1; then
  die "Docker is installed but not running.

  Start Docker Desktop (or 'sudo systemctl start docker' on Linux), wait for it
  to say it is running, then run this script again."
fi

if ! docker compose version >/dev/null 2>&1; then
  die "Your Docker is too old: it has no 'docker compose' command.

  Update Docker to a version from 2022 or later and run this again."
fi
ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'is ready')"

command -v curl >/dev/null 2>&1 || die "curl is not installed. Install curl and run this again."

# ------------------------------------------------------------- directory ----

step "Setting up $DIR"

mkdir -p "$DIR"
cd "$DIR"
ok "Working in $(pwd)"

fetch() {
  # $1 remote name, $2 local name. Never overwrites a local edit silently.
  if [ -f "$2" ] && [ "$2" != "compose.yaml" ]; then
    note "$2 already exists, keeping yours"
    return 0
  fi
  curl -fsSL "$REPO_RAW/$1" -o "$2" \
    || die "could not download $1 from GitHub. Check the machine's internet connection."
  ok "$2"
}

fetch "compose.self-host.yml" "compose.yaml"
fetch "Caddyfile.self-host.example" "Caddyfile"
fetch "db/framework-seed.sql" "framework-seed.sql"

# ----------------------------------------------------------------- .env -----

# Secrets are generated once and never regenerated. POSTGRES_PASSWORD is the
# credential the database was created with: a new one on the second run locks
# the stack out of its own data with an authentication error that looks like a
# bug in the software.
random_b64() { openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d '\n'; }
random_hex() { openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

if [ -f .env ]; then
  step "Keeping the .env that is already here"
  note "Delete it and re-run only if you are starting over from an empty database."
  APP_PORT=$(env_value APP_PORT 3026)
  [ -n "$URL" ] || URL="http://localhost:${APP_PORT}"
else
  # No .env, so the next block would generate a new POSTGRES_PASSWORD. That is
  # correct for a first install and fatal for a second one: initdb sets the
  # password once, when it first creates the data directory, and a surviving
  # volume keeps that password forever. Carrying on here produces a stack that
  # starts, crash-loops on 28P01, and looks like a broken release.
  if postgres_volume_exists; then
    die "there is already an open-isms instance on this machine, and no .env to open it with.

  Its data lives in Docker volumes named after $(project_name), which survived
  whatever removed the .env: neither 'docker compose down' nor deleting this
  directory deletes them. Generating new secrets now would lock the stack out
  of its own data, so this installer stops instead.

  If you still have the old .env, put it back next to compose.yaml and run this
  again. That is the only thing that opens this instance as it stands, and it is
  by far the best outcome: every secret in it is unrecoverable otherwise.

  If nothing in there matters, delete it and start genuinely fresh. This throws
  away the database AND any uploaded evidence AND any local backup archives, and
  it cannot be undone:

      cd $(pwd) && docker compose down -v

  Then run this installer again.

  If the data matters and the old .env is gone, some of it can still be saved
  and some of it cannot. Read this before doing anything else:
  https://www.nisd2.eu/docs/self-hosting/troubleshooting"
  fi

  step "Choosing ports"

  APP_PORT=$(next_free_port 3026)
  POSTGRES_PORT=$(next_free_port 5432)
  MINIO_PORT=$(next_free_port 9000)

  for pair in "3026:$APP_PORT:the app" "5432:$POSTGRES_PORT:the database" "9000:$MINIO_PORT:file storage"; do
    want="${pair%%:*}"; rest="${pair#*:}"; got="${rest%%:*}"; what="${rest#*:}"
    if [ "$want" = "$got" ]; then
      ok "$what on $got"
    else
      warn "$what: port $want is in use on this machine, using $got instead"
    fi
  done

  [ -n "$URL" ] || URL="http://localhost:${APP_PORT}"

  step "Writing .env with freshly generated secrets"

  curl -fsSL "$REPO_RAW/.env.self-host.example" -o .env.example \
    || die "could not download the example configuration."

  set_env() {
    if grep -q "^$1=" .env; then
      # A portable in-place edit: sed -i differs between GNU and BSD.
      sed "s|^$1=.*|$1=$2|" .env > .env.tmp && mv .env.tmp .env
    else
      printf '%s=%s\n' "$1" "$2" >> .env
    fi
  }

  cp .env.example .env

  set_env POSTGRES_PASSWORD "$(random_hex)"
  set_env AUTH_SECRET "$(random_b64)"
  set_env ERASURE_EMAIL_HASH_SALT "$(random_b64)"
  set_env AWS_SECRET_ACCESS_KEY "$(random_hex)"
  set_env MINIO_KMS_KEY "$(random_b64)"
  set_env AUTH_URL "$URL"
  set_env NEXT_PUBLIC_APP_URL "$URL"
  set_env APP_PORT "$APP_PORT"
  set_env POSTGRES_PORT "$POSTGRES_PORT"
  set_env MINIO_PORT "$MINIO_PORT"

  if [ -n "$DOMAIN" ]; then
    set_env COMPOSE_PROFILES "minio,proxy"
    set_env APP_DOMAIN "$DOMAIN"
    set_env STORAGE_DOMAIN "storage.$DOMAIN"
    set_env AWS_S3_ENDPOINT "https://storage.$DOMAIN"
  else
    # No proxy profile: it orders real certificates on first start and would
    # fail for a hostname that does not resolve here yet.
    set_env COMPOSE_PROFILES "minio"
    # Presigned upload URLs are signed for exactly this address and the browser
    # has to reach it, so it has to follow MINIO_PORT.
    set_env AWS_S3_ENDPOINT "http://localhost:${MINIO_PORT}"
  fi

  chmod 600 .env
  ok ".env written, readable only by you"
  note "It holds every secret for this instance. Back it up somewhere else:"
  note "without it a restored database cannot be read."
fi

if [ "$START" -eq 0 ]; then
  step "Done, nothing started"
  info "Start it yourself with:  cd $(pwd) && docker compose up -d"
  exit 0
fi

# ---------------------------------------------------------------- start -----

step "Starting open-isms"
note "The first run pulls four images, a few hundred megabytes, and takes a few minutes."
docker compose up -d || die "docker compose could not start the stack.

  The output above says why. The most common cause is a port that another
  program on this machine is already using; if the message mentions one, stop
  that program or change APP_PORT, POSTGRES_PORT or MINIO_PORT in
  $(pwd)/.env and run this script again."

step "Waiting for it to be ready"
note "It applies its database migrations before it serves anything."

READY=0
for _ in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" -eq 0 ]; then
  # Read the log before guessing at the cause. Naming the wrong two suspects is
  # worse than naming none: it sends someone to check ports and migrations when
  # the answer is sitting in the log they were not told to read.
  APP_LOG=$(docker compose logs app 2>&1 | tail -200 || true)

  case "$APP_LOG" in
    *28P01*|*"password authentication failed"*)
      # The recovery for an instance with data is deliberately NOT repeated
      # here. It is a long pipeline whose escaping differs in every language it
      # is written in, and three hand-kept copies had already drifted apart
      # once. The app's own log carries it, and so does the doc.
      die "the database refused the app's password.

  The data directory in the Docker volume $(project_name)_postgres-data was
  created with a different POSTGRES_PASSWORD than the one in $(pwd)/.env.
  Postgres sets that password once, when it first creates the directory.

  If this instance is empty, throw it away and let it be created again. Note
  that this deletes the database, any uploaded evidence and any local backup
  archives, and cannot be undone:

      cd $(pwd) && docker compose down -v && docker compose up -d

  If it holds data, keep it and change the password instead. The exact command
  is in the app's log, and here:
  https://www.nisd2.eu/docs/self-hosting/troubleshooting

      cd $(pwd) && docker compose logs app | tail -40"
      ;;
    *"[migrate"*FAILED*)
      die "a database migration failed, so the app refuses to serve.

  Your data is untouched: a failed migration rolls back whole.

  Read which one, and why:   cd $(pwd) && docker compose logs app | grep -A5 FAILED

  Report it at https://github.com/NISD2/open-isms/issues with those lines."
      ;;
    *)
      die "it did not come up within three minutes, and the log does not name a
  cause this installer recognises.

  See what it says:   cd $(pwd) && docker compose logs app | tail -50

  Troubleshooting: https://www.nisd2.eu/docs/self-hosting/troubleshooting"
      ;;
  esac
fi
ok "Running, and the database answered"

# ----------------------------------------------------------------- seed -----

# Migrations create the tables; they do not fill them. Versions from 0.2.9 do
# this themselves at startup, so this step usually finds the work already done;
# it stays because it is also what makes the installer work against the older
# images someone may have pinned.
step "Checking the NIS 2 framework data"

POSTGRES_USER=$(env_value POSTGRES_USER openisms)
POSTGRES_DB=$(env_value POSTGRES_DB openisms)

count_requirements() {
  docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -tAc "select count(*) from requirement" 2>/dev/null | tr -d '\r' || printf '0'
}

COUNT=$(count_requirements)

if [ "${COUNT:-0}" -gt 0 ]; then
  ok "${COUNT} requirements already loaded"
elif docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -v ON_ERROR_STOP=1 -q < framework-seed.sql; then
  ok "$(count_requirements) requirements loaded"
else
  warn "The framework data could not be loaded. The instance runs, but the"
  warn "portal will look empty. Try again with:"
  warn "  cd $(pwd) && docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < framework-seed.sql"
fi

# --------------------------------------------------------------- finish -----

step "Done"
printf '\n    Open %s%s%s\n\n' "$BOLD" "$URL" "$RESET"

info "Nobody has an account yet: signing up sends a code by email, and no"
info "mail transport is configured. Two lines in .env create the first account"
info "at startup instead, with no mail at all:"
note "  BOOTSTRAP_ADMIN_EMAIL=you@example.com"
note "  BOOTSTRAP_ADMIN_PASSWORD=a-password-you-choose"
note "  docker compose up -d      then sign in, and remove the password line"
printf '\n'
info "The second person needs an invitation, and that is an email. Either"
info "transport works, and SMTP_HOST wins when both are set:"
note "  SMTP_HOST=smtp.example.com, SMTP_PORT=587, SMTP_USER=..., SMTP_PASSWORD=..."
note "  RESEND_API_KEY=...        from resend.com, with your own domain verified"
note "  MAIL_FROM_EMAIL=isms@yourdomain.example    required for SMTP"
printf '\n'
info "You can also read a sign-in code straight out of the log, which needs"
info "no account and no transport:"
note "  docker compose logs app | grep 'sign-in code'"
printf '\n'
info "Everyday commands, run from $(pwd):"
note "  docker compose logs -f app     watch what it is doing"
note "  docker compose pull && docker compose up -d    update"
note "  docker compose down            stop it (your data stays)"
printf '\n'
info "Full documentation: https://www.nisd2.eu/docs"
printf '\n'
