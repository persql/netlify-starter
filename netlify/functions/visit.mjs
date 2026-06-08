import { PerSQL } from "@persql/sdk";

// PerSQL connection — the three vars come from https://netlify.persql.com/connect
// and are set under Site configuration -> Environment variables (or prompted by
// the Deploy to Netlify button).
const { PERSQL_TOKEN, PERSQL_DATABASE, PERSQL_API_URL } = process.env;

const configured = Boolean(PERSQL_TOKEN && PERSQL_DATABASE);
const db = configured
  ? new PerSQL({ token: PERSQL_TOKEN, baseURL: PERSQL_API_URL }).database(PERSQL_DATABASE)
  : null;

// Run-once schema setup. IF NOT EXISTS keeps this idempotent across the
// warm invocations that reuse this module instance.
let ready = configured
  ? db
      .query(
        "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .then(() => true)
  : Promise.resolve(false);

export default async () => {
  if (!configured) {
    return page(
      500,
      "Not connected yet",
      'Set <code>PERSQL_TOKEN</code> and <code>PERSQL_DATABASE</code> (and optionally <code>PERSQL_API_URL</code>) on this Netlify site. Get them at <a href="https://netlify.persql.com/connect">netlify.persql.com/connect</a>.',
    );
  }

  try {
    await ready;
    await db.query("INSERT INTO visits DEFAULT VALUES");
    const result = await db.query("SELECT count(*) AS n FROM visits");
    const n = result.data[0]?.n ?? 0;
    return page(
      200,
      `${n} visit${n === 1 ? "" : "s"}`,
      `This page is backed by an isolated PerSQL SQLite database (<code>${escapeHtml(
        PERSQL_DATABASE,
      )}</code>). Every load writes one row and reads the count &mdash; that round trip is the whole integration.`,
    );
  } catch (err) {
    return page(500, "Query failed", escapeHtml(String(err?.message ?? err)));
  }
};

function page(status, title, body) {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PerSQL on Netlify</title>
<body style="font:15px/1.6 ui-sans-serif,system-ui;max-width:640px;margin:64px auto;padding:0 24px">
<h1 style="font-size:28px;margin:0 0 8px">${title}</h1>
<p style="color:#525252">${body}</p>
<p style="color:#a3a3a3;font-size:13px">PerSQL netlify starter &middot; <a href="https://persql.com">persql.com</a></p>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
