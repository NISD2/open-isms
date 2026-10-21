Every instance serves an MCP endpoint at `/api/mcp`, nisd2.eu and each self-hosted one alike. An AI assistant connected there reads the company's NIS 2 walkthrough and fills in what its items ask for (fields, registers, the asset list, ratings, agreements, sign-ins, backups, critical processes and policies), as the person who connected it and with that person's rights. It can also send suppliers on the company's list the security questionnaire. It never finishes an item, never decides one (not applicable, or deliberately not done) and never signs anything. The person finishes each item in the app, and management signs it there.

Whether a company's people may connect assistants at all is the company's decision: an admin turns it on in Settings, under *Allow AI assistants for this company*, and it is off until they do. It is checked when a key is made or an assistant allowed, and on every call, so turning it off stops every connected assistant at once and also ends their keys and sign-ins.

Settings is in the profile menu at the bottom of the sidebar:

![The profile menu opened over the walkthrough, with Settings highlighted](/images/wiki/mcp/en-settings-menu.webp)

The switch is the first thing on the page. Below it each person connects their own assistant and sees the ones they connected:

![Settings with Allow AI assistants for this company turned on, and the card to connect an assistant below it](/images/wiki/mcp/en-settings.webp)

An assistant works only for a person who may open the walkthrough: on nisd2.eu an account whose order includes it, on a self-hosted instance, where new accounts do not get the walkthrough, the addresses in `PLATFORM_ADMIN_EMAILS`. Anyone else gets a refusal on every call, and Settings and the sign-in page show them the way to the walkthrough instead of a key or an *Allow* button.

## Setting it up on your own server

Nothing to install: the endpoint is part of the app, so a self-hosted instance that runs a release with it already serves it. Five steps.

1. **Tell the instance its public address.** Set `NEXT_PUBLIC_APP_URL` in `.env` to the address your people type, with `https://` and no path, for example `https://isms.example.com`. The endpoint, the sign-in and the metadata an assistant reads are all built from it. Left unset, the shipped `compose.yaml` fills in `http://localhost:3026`, and an assistant would be sent there. `AUTH_URL` does not do this job.
2. **Name who may use it.** Put the sign-in addresses in `PLATFORM_ADMIN_EMAILS` (comma separated). A self-hosted instance does not give new accounts the walkthrough, and an assistant works only for someone who has it. Then apply both settings with `docker compose up -d`.
3. **Create the organisation and sign in as its admin.** The person who creates the organisation is its admin.
4. **Turn it on.** In Settings, switch on *Allow AI assistants for this company*. It is off until an admin does.
5. **Connect an assistant.** Use the endpoint `https://isms.example.com/api/mcp`, with your own address, and the steps for your client below.

To check it before connecting anything, two requests from any machine. The first answers with your own address in `authorization_servers`; if it names another address, step 1 is not applied yet. The second answers `401`, since it carries no key.

```bash
curl -s https://isms.example.com/.well-known/oauth-protected-resource/api/mcp
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://isms.example.com/api/mcp \
  -H 'content-type: application/json' -d '{}'
```

With your own reverse proxy, pass `/.well-known/` through to the app as well as `/api/`: an assistant finds the sign-in there. The bundled Caddy profile passes everything. Claude on the web, ChatGPT and Copilot Studio also need the instance reachable from the internet, as described under each client below.

## What an assistant can do

Five tools.

- `get_walkthrough` lists every item of the company's walkthrough with where it stands. With a code, for example `5.1`, it returns that item in full: the walkthrough's own words, its fields with their JSON Schema and current answers, its register with the rows already in it, and for each of its other screens the JSON Schema of what it takes and what it shows now (the assets, suppliers and ratings, with their ids).
- `fill_walkthrough_item` saves answers to an item's fields, adds rows to its register, corrects rows already in it, and fills its other screens: it adds assets and says what each is and who provides it, rates assets and suppliers, records what supplier contracts settle, which sign-ins take a second factor, how often backups run, which processes are critical, writes the item's policy from its clauses and sets the crypto list. The crypto list is sent whole, as the screen saves it, so an entry the assistant leaves out is removed from it. It also attaches files uploaded with `upload_file`. Answers are checked the way the app checks them, and everything goes through the same procedures the app's screens call, with the same schemas.
- `upload_file` gives an upload request for one file: a document as an item's evidence, or a training certificate. The assistant sends the file's bytes with it straight to storage, then attaches the file with `fill_walkthrough_item`. The app only signs the address, for the company's own storage and that size, and a file counts as evidence only once it is stored at that size. This works for an assistant that can send the bytes itself, such as Claude Code; with a chat app that cannot, the person uploads in the app.
- `send_supplier_questionnaire` sends suppliers on the company's list the security questionnaire, through the same invite the button on each supplier in the walkthrough sends. It goes to the contact email on the supplier's row and to no other address, so every recipient stands in the supplier register. A row without a contact email, a supplier already linked to its own company in the supplier portal, and the operator's own row are refused. The app's mail limits hold: the same address is not sent it again within 24 hours, and a company sends at most 100 invites an hour and mails at most 200 new addresses a day. The invite link never reaches the assistant, since whoever holds it can answer as the supplier. The mail leaves the company, so the tool tells the assistant to send it only when the person asked for it.
- `read_records` reads the company's records exactly as the export file holds them, one part at a time: the master data, each requirement's status and sign-off, the answers typed per category, the documents the walkthrough wrote (one per call, as each holds a whole policy), and every register, 50 rows a page with a flag for whether another page follows. It reads the same fields as the export, through the same code, so a column the export leaves out, such as a supplier's access token, never reaches the assistant. Only someone who may export the records (an admin, a reviewer or management) gets an answer, and only on the walkthrough's plan. Within the money back of a new order, reading is an export and ends it (terms B7), so the assistant is refused with a link to the export page, where the person confirms it; an assistant never confirms it. Settings and the consent card say so to whoever may export.

The two tools that fill an item work only on items still open or set aside as waiting (and pick a waiting item up again, as the app does). A finished, declined or signed item is changed in the app, so the assistant never takes back the person's word or management's signature. An empty answer to a field is refused rather than taken to clear it. A screen's rows are saved as sent, as the app's screen saves them, so `get_walkthrough` shows each stored value for the assistant to send back what it does not mean to change. The tools fill only items in the person's own areas, or in any area for an admin, and an assistant of someone in a reviewer's role reads but fills and sends nothing.

A change to a register (a new row, an asset added or rated, a sign-in or a backup recorded) sends every signed item that relies on that register back to management, in the app as well: the signed item now rests on a register that changed. An assistant is refused that: the tools check before the first write and again right before each one, and while an item relying on a register is signed, the change is refused and made in the app, which names the items. One narrow case remains: a signature given within the few milliseconds of a single write is taken back by that write, as a person's save would take it back, and the audit entry names the assistant. A policy management approved is rewritten only in the app too, since a changed text loses its approval. The same goes for the management reviews on the approval item: a review recorded there puts the item before management, which only the person does.

What stays with a person is the decision and the signature: finishing an item, deciding it is not applicable or not done, the management reviews and open points on the approval item, and management's approval itself. An assistant also never deletes a register row and never invites a colleague: a wrong row is removed, and a colleague invited, in the app. `get_walkthrough` says for each item which of its screens are filled where, and links to the item in the app.

## Connecting

Two ways, on every instance.

**Sign in through the browser.** Give the assistant the endpoint URL. It opens the instance's sign-in page, the person signs in, sees which assistant asks for which company and where the browser returns to, and allows it. The instance is its own authorization server (OAuth 2.1 with PKCE and dynamic client registration), so this works on a self-hosted instance with no third party and nothing to configure. An access token lasts an hour. The assistant renews it with a refresh token that lasts 30 days and works once: every renewal hands out a new one. Presented again within a minute (two renewals at once, or an answer lost on the way) it still works; presented again later, it was copied, and every assistant of that person is disconnected. A copy renewed within that minute is caught the same way, as soon as it or the real one is renewed again after the other. However often it renews, a sign-in ends 90 days after the person allowed it, and the person allows it again. Before allowing, check where the browser returns to; the assistant's name on that page is the one it gave itself.

**Paste a key.** In Settings, *Create key* shows a key once. It works for 90 days, in the company that was open when it was made. Use it for a client that cannot open a browser, or for a script.

Both stay connected when the person signs out of the browser, so allowing an assistant and creating a key each ask for a sign-in from the last 15 minutes; an older session is sent to sign in again and comes back to the same page.

### Claude Code

```bash
claude mcp add --transport http nisd2 https://isms.example.com/api/mcp
```

Then run `/mcp` inside Claude Code and sign in. With a key instead:

```bash
claude mcp add --transport http nisd2 https://isms.example.com/api/mcp \
  --header "Authorization: Bearer $NISD2_MCP_KEY"
```

Claude Code connects from the person's own computer, so it also reaches an instance inside the company network.

### Claude on the web and desktop

Add a custom connector with the endpoint URL and choose *Register automatically*: the instance registers assistants dynamically and does not read Claude's published identity (a Client ID Metadata Document). Claude opens the sign-in. Claude connects from Anthropic's cloud, not from the person's computer, on the web, on desktop and on mobile alike, so the instance has to be reachable from the internet over https.

### Copilot Studio

Add the endpoint as an MCP server over Streamable HTTP and choose OAuth 2.0 with dynamic discovery. Copilot Studio runs in Microsoft's cloud, so here too the instance has to be reachable from the internet over https.

### ChatGPT

Add the endpoint as a custom MCP server and sign in through the browser. ChatGPT cannot send a pasted key (OpenAI's own documentation), so the sign-in is the only way, and like Claude it connects from its vendor's cloud: the instance has to be reachable from the internet over https.

### VS Code, Cursor and Gemini CLI

Each takes a remote server over HTTP with an `Authorization: Bearer` header carrying the key; VS Code and Gemini CLI also run the browser sign-in. They run on the person's computer, so, like Claude Code, they also reach an instance inside the company network.

### What has been tested

Claude Code, with both the browser sign-in and a pasted key, has been run end to end against an instance. The other clients above follow their vendors' documentation and have not yet been tested against one.

## Disconnecting

Settings lists the person's connected assistants in the company open: the pasted key and every browser sign-in, each with when it was connected and last used, and each with its own *Disconnect*, which ends that one at its next call and leaves the others. Creating a new key ends the previous key only. *Disconnect all assistants* ends the key and every browser sign-in at once, and so does any change to the person's password (a reset, a first password, or removing it for Google sign-in). Signing out of the browser does not: the assistants stay connected. Removing a person from the company ends their key and every browser sign-in for good, so inviting them back later brings none of them back.

All of these except a single *Disconnect* and a new key work through one counter on the person's account, so for someone in several companies they end the assistants in every company, not only in the one open. The same holds when an admin turns assistants off: every member of that company loses their assistants in all their companies.

## What every call checks

- The key's signature, expiry, the person's key version and that its connection has not been ended. Keys are signed with a key derived from `AUTH_SECRET`, so rotating that secret ends every key and every assistant registration; assistants then connect again.
- The person's membership in the company, their role, the plan and their area assignments, the same gates the app applies.
- A browser `Origin` other than the instance's own host or localhost is refused, so a web page cannot reach a local instance through the person's browser.
- A limit of 300 tool calls per person per hour, counted in hourly windows.

Changes land in the audit log like any other change, under the person's name. The row each change writes has a client column starting with `mcp:`, followed by the assistant's name for a browser sign-in or the user agent it sends for a pasted key (its first 100 printable characters, `key` when it sends none), so an assistant's change never reads as one made in the browser. The activity log shows it under the person's name as made through that assistant, and so do the rows that record what a change caused: an item picked up again, or a signature taken back on an item management sent back for rework. A browser that sends such a user agent itself has it stored behind a marker, so only a change through a key or a sign-in reads as an assistant's. In the walkthrough, each screen an assistant wrote shows that assistant's name and the day, for the person and management to check before the item is finished. The mark records that day's change and stays when a person changes the screen later. Every row an assistant's key wrote also carries `via = 'mcp'` in a column of its own, which the activity log marks with MCP and which a filter reads without parsing the client column; erasing a person clears the client column and keeps `via`. A read, and a call the server refused, leave a row too (`mcp.read`, and `mcp.refused` with the reason), at most one an hour per person, assistant and tool, so an assistant that pages or retries does not push other entries off the activity log. What was read is never stored.

## Where the data goes

The assistant is the company's own choice. What it reads goes to that assistant's vendor, under the company's own agreement with them. With an assistant and a model that run on the company's own hardware, nothing leaves its network.

Answers and rows were written by people, and a supplier row linked to the supplier's own company carries that supplier's statements, set apart under `writtenBySupplier`. The server's instructions, and the description of `get_walkthrough`, the tool that returns it, tell the assistant to read all of it as data, never as instructions, and `fill_walkthrough_item` is marked as a tool that changes data, so a client that asks before such calls asks here. An assistant that acts on its own should still be one whose actions the person approves.

## In plain words

The wiki answers the questions a company asks before it connects an assistant (what it fills, who answers for its entries, data protection, prompt injection, each client's setup) under [AI assistants and MCP](/en/wiki/ai-assistants).
