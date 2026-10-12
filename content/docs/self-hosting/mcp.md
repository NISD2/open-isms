Every instance serves an MCP endpoint at `/api/mcp`, nisd2.eu and each self-hosted one alike. An AI assistant connected there reads the company's NIS 2 walkthrough and fills in the fields and registers its items ask for, as the person who connected it and with that person's rights. It never finishes an item, never decides one (not applicable, or deliberately not done) and never signs anything. The person finishes each item in the app, and management signs it there.

## What an assistant can do

Two tools.

- `get_walkthrough` lists every item of the company's walkthrough with where it stands. With a code, for example `5.1`, it returns that item in full: the walkthrough's own words, its fields with their JSON Schema and current answers, and its register with the rows already in it.
- `fill_walkthrough_item` saves answers to an item's fields and adds rows to its register. Answers are checked the way the app checks them, and rows go through the same procedures the app's screens call. It refuses an item management has already signed, because changing it would take that signature back.

Fields and the three registers (suppliers, trainings, management reviews) are open to an assistant. The rest of the walkthrough takes input only in the app: the asset lists, the ratings, the sign-ins, the backups, the policies and the approval. `get_walkthrough` says for each item which of its screens are which, and links to the item in the app.

## Connecting

Two ways, on every instance.

**Sign in through the browser.** Give the assistant the endpoint URL. It opens the instance's sign-in page, the person signs in, sees which assistant asks for which company and where the browser returns to, and allows it. The instance is its own authorization server (OAuth 2.1 with PKCE and dynamic client registration), so this works on a self-hosted instance with no third party and nothing to configure. An access token lasts an hour. The assistant renews it with a refresh token that lasts 30 days and is replaced at every renewal.

**Paste a key.** In Settings, *Create key* shows a key once. It works for 90 days, in the company that was open when it was made. Use it for a client that cannot open a browser, or for a script.

### Claude Code

```bash
claude mcp add --transport http nisd2 https://isms.example.com/api/mcp
```

Then run `/mcp` inside Claude Code and sign in. With a key instead:

```bash
claude mcp add --transport http nisd2 https://isms.example.com/api/mcp \
  --header "Authorization: Bearer $NISD2_MCP_KEY"
```

### Claude on the web and desktop

Add a custom connector with the endpoint URL. Claude opens the sign-in.

### Copilot Studio

Add the endpoint as an MCP server over Streamable HTTP and choose OAuth 2.0 with dynamic discovery.

## Disconnecting

*Disconnect all assistants* in Settings ends the person's key and every browser sign-in at once. Creating a new key ends the previous one the same way. Removing a person from the company ends their access too, because every call checks the membership.

## What every call checks

- The key's signature, expiry and the person's key version. Keys are signed with a key derived from `AUTH_SECRET`, so rotating that secret ends every key and every assistant registration; assistants then connect again.
- The person's membership in the company, their role, the plan and their area assignments, the same gates the app applies.
- A browser `Origin` other than the instance's own host or localhost is refused, so a web page cannot reach a local instance through the person's browser.
- At most 300 tool calls per person per hour.

Changes land in the audit log like any other change, under the person's name. The client column holds the assistant's name for a browser sign-in, and the user agent it sends for a pasted key. Each read leaves one line in the server log with the tool and the person's id, never what was read.

## Where the data goes

The assistant is the company's own choice. What it reads goes to that assistant's vendor, under the company's own agreement with them. With an assistant and a model that run on the company's own hardware, nothing leaves its network.
