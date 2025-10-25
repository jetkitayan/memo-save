export interface Env { DB: D1Database; }

function json(body: unknown, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return json(null);

    if (url.pathname === "/api/items" && req.method === "POST") {
      const data = await req.json().catch(() => ({}));
      const text = String(data?.text ?? "").trim();
      if (!text) return json({ ok:false, error:"text is required" }, 400);

      const now = new Date().toISOString();
      await env.DB.prepare("INSERT INTO items(text, created_at) VALUES(?, ?)").bind(text, now).run();
      return json({ ok:true });
    }

    if (url.pathname === "/api/items" && req.method === "GET") {
      const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
      const { results } = await env.DB.prepare(
        "SELECT id, text, created_at FROM items ORDER BY id DESC LIMIT ?"
      ).bind(limit).all();
      return json({ ok:true, items: results ?? [] });
    }

    return json({ error: "Not Found" }, 404);
  },
};

