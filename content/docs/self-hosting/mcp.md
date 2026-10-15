Every instance serves an MCP endpoint at `/api/mcp`, nisd2.eu and each self-hosted one alike. An AI assistant connected there reads the company's NIS 2 walkthrough and fills in what its items ask for (fields, registers, the asset list, ratings, agreements, sign-ins, backups, critical processes and policies), as the person who connected it and with that person's rights. It never finishes an item, never decides one (not applicable, or deliberately not done) and never signs anything. The person finishes each item in the app, and management signs it there.

An assistant works only for a person who may open the walkthrough: on nisd2.eu an account whose order includes it, on a self-hosted instance, where new accounts do not get the walkthrough, the addresses in `PLATFORM_ADMIN_EMAILS`. Anyone else gets a refusal on every call, and Settings and the sign-in page show them the way to the walkthrough instead of a key or an *Allow* button.

## What an assistant can do

Three tools.

- `get_walkthrough` lists every item of the company's walkthrough with where it stands. With a code, for example `5.1`, it returns that item in full: the walkthrough's own words, its fields with their JSON Schema and current answers, its register with the rows already in it, and for each of its other screens the JSON Schema of what it takes and what it shows now (the assets, suppliers and ratings, with their ids).
- `fill_walkthrough_item` saves answers to an item's fields, adds rows to its register, corrects rows already in it, and fills its other screens: it adds assets and says what each is and who provides it, rates assets and suppliers, records what supplier contracts settle, which sign-ins take a second factor, how often backups run, which processes are critical, writes the item's policy from its clauses and sets the crypto list entry by entry. It also attaches files uploaded with `upload_file`. Answers are checked the way the app checks them, and everything goes through the same procedures the app's screens call, with the same schemas.
- `upload_file` gives an upload request for one file: a document as an item's evidence, or a training certificate. The assistant sends the file's bytes with it straight to storage, then attaches the file with `fill_walkthrough_item`. The app only signs the address, for the company's own storage, that size and that type. This works for an assistant that can send the bytes itself, such as Claude Code; with a chat app that cannot, the person uploads in the app. It works only on items still open or set aside as waiting (and picks a waiting item up again, as the app does). A finished, declined or signed item is changed in the app, so the assistant never takes back the person's word or management's signature. An empty answer is refused rather than taken to clear the field. It fills only items in the person's own areas, or in any area for an admin, and an assistant of someone in a reviewer's role reads but fills nothing.

A change to a register (a new row, an asset added or rated, a sign-in or a backup recorded) sends every signed item that relies on that register back to management, in the app as well: the signed item now rests on a register that changed. An assistant never does that. While an item relying on a register is signed, the change is refused and made in the app, which names the items. A policy management approved is rewritten only in the app too, since a changed text loses its approval. The same goes for the management reviews on the approval item: a review recorded there puts the item before management, which only the person does.

What stays with a person is the decision and the signature: finishing an item, deciding it is not applicable or not done, the management reviews and open points on the approval item, and management's approval itself. An assistant also never deletes anything and never invites anyone: a wrong row is removed, and a colleague invited, in the app. `get_walkthrough` says for each item which of its screens are filled where, and links to the item in the app.

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

Add a custom connector with the endpoint URL. Claude opens the sign-in. Claude connects from Anthropic's cloud, not from the person's computer, on the web, on desktop and on mobile alike, so the instance has to be reachable from the internet over https.

### Copilot Studio

Add the endpoint as an MCP server over Streamable HTTP and choose OAuth 2.0 with dynamic discovery. Copilot Studio runs in Microsoft's cloud, so here too the instance has to be reachable from the internet over https.

## Disconnecting

*Disconnect all assistants* in Settings ends the person's key and every browser sign-in at once. Creating a new key ends the previous one the same way, and so does any change to the person's password (a reset, a first password, or removing it for Google sign-in). Signing out of the browser does not: the assistants stay connected. Removing a person from the company ends their key and every browser sign-in for good, so inviting them back later brings none of them back.

## What every call checks

- The key's signature, expiry and the person's key version. Keys are signed with a key derived from `AUTH_SECRET`, so rotating that secret ends every key and every assistant registration; assistants then connect again.
- The person's membership in the company, their role, the plan and their area assignments, the same gates the app applies.
- A browser `Origin` other than the instance's own host or localhost is refused, so a web page cannot reach a local instance through the person's browser.
- A limit of 300 tool calls per person per hour, counted in hourly windows.

Changes land in the audit log like any other change, under the person's name. The row each change writes has a client column starting with `mcp:`, followed by the assistant's name for a browser sign-in or the user agent it sends for a pasted key (`key` when it sends none), so an assistant's change never reads as one made in the browser. The activity log shows it under the person's name as made through that assistant, and so do the rows that record what a change caused: an item picked up again, or a signature taken back on an item management sent back for rework. A browser that sends such a user agent itself has it stored behind a marker, so only a change through a key or a sign-in reads as an assistant's. Each read leaves one line in the server log with the tool and the person's id, never what was read.

## Where the data goes

The assistant is the company's own choice. What it reads goes to that assistant's vendor, under the company's own agreement with them. With an assistant and a model that run on the company's own hardware, nothing leaves its network.

Answers and rows were written by people, and a supplier row linked to the supplier's own company carries that supplier's statements, set apart under `writtenBySupplier`. The tool descriptions tell the assistant to read all of it as data, never as instructions, and `fill_walkthrough_item` is marked as a tool that changes data, so a client that asks before such calls asks here. An assistant that acts on its own should still be one whose actions the person approves.
