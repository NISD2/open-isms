# Deployment Plan — Video Shorts Pipeline

## Overview

Extract the video pipeline from the NIS2 monorepo into a standalone repo and deploy to Hetzner via Coolify.

---

## Phase 1: Standalone Repo Extraction

### What to extract
```
videos/
├── server/          # Bun/Hono API + job queue + DB
├── src/             # Remotion compositions
├── public/          # Static assets (git-ignored runtime files)
├── uploads/         # (git-ignored, runtime volume)
├── package.json
├── remotion.config.ts
├── tsconfig.json
├── CLAUDE.md
└── DEPLOY.md
```

### Steps
1. Create new GitHub repo: `nisd2/video-pipeline` (or `cory/video-pipeline`)
2. Copy `videos/` contents to new repo root
3. Update all `import.meta.dir` paths (already relative, should be fine)
4. Verify `bun run dev` and `bun run build` work standalone

---

## Phase 2: Docker Setup

### Dockerfile
```dockerfile
FROM oven/bun:1.2 AS base
WORKDIR /app

# System deps: ffmpeg + whisper build tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    cmake \
    build-essential \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Chromium for Remotion
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

# Install Node.js for Remotion CLI
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Pre-download whisper model at build time (bakes into image, ~150MB)
# Alternative: mount as volume (see Phase 3 notes)
# RUN bun run server/lib/whisper.ts --download-model

EXPOSE 3030

CMD ["bun", "run", "server/index.ts"]
```

### .dockerignore
```
node_modules/
uploads/
public/*.mp4
public/*.json
public/*.wav
tmp/
*.db
.env*
```

---

## Phase 3: Volumes & Persistence

### Required volumes (Coolify named volumes)
| Volume | Container path | Purpose |
|--------|---------------|---------|
| `pipeline-uploads` | `/app/uploads` | Raw video uploads |
| `pipeline-public` | `/app/public` | Rendered clips + caption JSON |
| `pipeline-whisper` | `/app/whisper` | Whisper model (~150MB, download once) |
| `pipeline-tmp` | `/app/tmp` | Temp WAV files (ephemeral but needs disk) |

> **Whisper model strategy**: Download on first run (current behavior via `ensureWhisper()`). Model is stored in the whisper volume so it persists across container restarts/redeploys. No bake-in needed.

---

## Phase 4: Database

### Option A — Managed Postgres (recommended)
- Use Coolify's built-in Postgres service
- Or Hetzner Managed Databases (€15–20/mo, automatic backups)
- Set `DATABASE_URL` env var in Coolify

### Option B — Postgres sidecar in Docker Compose
```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - pipeline-db:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: videos_pipeline
      POSTGRES_USER: pipeline
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  app:
    build: .
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgres://pipeline:${POSTGRES_PASSWORD}@postgres:5432/videos_pipeline
```

### Migrations
Run on deploy (not at container start):
```bash
bun db:migrate
```
Add as a Coolify "pre-deploy command" or run manually after first deploy.

---

## Phase 5: Coolify Configuration

### Service setup
1. Create new "Docker" service in Coolify
2. Point to GitHub repo (enable auto-deploy on push to `main`)
3. Set build context to repo root
4. Port mapping: `3030:3030`

### Environment variables (set in Coolify UI)
```env
# Required
XAI_API_KEY=xai-...
DATABASE_URL=postgres://...

# Remotion
REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

# Optional
NODE_ENV=production
```

### Health check
```
GET /api/health → 200 OK
```
Add a simple health endpoint to `server/index.ts`:
```typescript
app.get("/api/health", (c) => c.json({ ok: true }));
```

---

## Phase 6: Hetzner Server Sizing

| Tier | vCPU | RAM | Storage | Price/mo | Suitable for |
|------|------|-----|---------|----------|-------------|
| CX22 | 2 | 4GB | 40GB | ~€4 | Dev/testing only |
| CX32 | 4 | 8GB | 80GB | ~€8 | Light use (1-2 jobs/day) |
| CX42 | 8 | 16GB | 160GB | ~€16 | **Recommended** production |
| CX52 | 16 | 32GB | 320GB | ~€35 | High-volume |

**Recommendation**: Start on CX32, scale to CX42 when Whisper transcription feels slow.

**Additional storage**: Attach a Hetzner Volume (€0.044/GB/mo) for uploads + renders — keeps videos off the root disk and makes it easy to detach/re-attach.

---

## Phase 7: Access & Auth

### Current state
No auth — UI is open to anyone with the URL.

### Options
| Option | Effort | Security |
|--------|--------|----------|
| Coolify HTTP basic auth | Zero code | Good for internal tool |
| VPN-only (Tailscale/WireGuard) | Low | Best for team use |
| Simple token header | Low code | Programmatic access |
| Full NextAuth | High | Overkill for internal tool |

**Recommendation**: Coolify basic auth + Hetzner firewall (whitelist office/home IPs on port 3030).

---

## Phase 8: CI/CD

### Minimal (recommended to start)
- Coolify auto-deploy on `git push main`
- Manual migration run via Coolify console after schema changes

### Full CI (later)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Coolify deploy
        run: curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

---

## Open Questions

Before implementation, answers needed:

### Repo & Auth
1. **GitHub org**: New repo under `simonorzel26/` or personal account? Private or public?
2. **Access control**: Coolify basic auth sufficient, or does Simon need his own login?

### Infrastructure
3. **Domain**: What domain/subdomain for the tool? (e.g., `clips.nisd2.com`) or access by IP?
4. **Hetzner region**: Nuremberg (nbg1) or Falkenstein (fsn1)? (Pick closest to you)
5. **Database**: Coolify-managed Postgres sidecar, or Hetzner Managed Database?
6. **Storage**: Hetzner Volume for uploads+renders, or keep on root disk?

### Uploads
7. **Video retention policy**: How long to keep source videos? Auto-delete after render? Manual only?
8. **Max upload size**: Current default is Bun's limit (~no limit). Need to cap it?

### Deployment
9. **Migration strategy**: Manual `bun db:migrate` via console, or auto-run on startup?
10. **Whisper model**: Download on first start (uses volume), or bake into Docker image (+150MB image size, faster cold start)?

---

## Deployment Order

```
1. Create standalone repo
2. Test local Docker build
3. Provision Hetzner server + Coolify
4. Configure Coolify service + volumes + env vars
5. Deploy + run migrations
6. Smoke test (upload a video end-to-end)
7. Point domain
8. Enable Coolify basic auth
```
