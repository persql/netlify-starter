# PerSQL on Netlify — starter

A minimal Netlify Function backed by an isolated [PerSQL](https://persql.com)
SQLite database. Each page load writes a row and reads the count — that round
trip is the whole integration.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/persql/netlify-starter)

## Deploy

1. **Get a database.** Visit **[netlify.persql.com/connect](https://netlify.persql.com/connect)**,
   sign in, and provision a database. You'll get three values:

   | Var | What |
   |---|---|
   | `PERSQL_API_URL` | `https://api.persql.com` |
   | `PERSQL_DATABASE` | `<namespace>/<db-slug>` |
   | `PERSQL_TOKEN` | a token scoped to that one database |

2. **Click Deploy to Netlify** above. The Blueprint (`netlify.toml`) declares
   the three vars under `[template.environment]` — paste the values from step 1
   when Netlify prompts. To set them later, use **Site configuration →
   Environment variables** or `netlify env:set`.

3. **Open the site URL.** You should see the visit counter increment on each
   refresh.

## How it connects

```js
import { PerSQL } from "@persql/sdk";

const db = new PerSQL({
  token: process.env.PERSQL_TOKEN,
  baseURL: process.env.PERSQL_API_URL, // defaults to https://api.persql.com
}).database(process.env.PERSQL_DATABASE); // "namespace/db-slug"

export default async () => {
  await db.query("INSERT INTO visits DEFAULT VALUES");
  const { data } = await db.query("SELECT count(*) AS n FROM visits");
  return Response.json(data);
};
```

The function lives in [`netlify/functions/visit.mjs`](netlify/functions/visit.mjs),
served at the site root by the redirect in [`netlify.toml`](netlify.toml).

## A database per Deploy Preview

Point a coding agent at the Netlify MCP at `https://netlify.persql.com/mcp`
(authenticate with a PerSQL bearer token). `preview_recipe` returns the snippet
that spawns a `preview-pr-<n>` branch during a Deploy Preview build — Netlify
sets `REVIEW_ID` to the PR number — and the GitHub Action that deletes it on
close. See the [integration docs](https://docs.persql.com/integrations/netlify).
