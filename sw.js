/* Vitalspur 1.9.4: Service Worker. Diese Datei als sw.js neben die index.html legen.
   Die Seite kommt immer frisch aus dem Netz, wenn es eins gibt; sonst aus dem Zwischenspeicher.
   Manifest und Symbol liefert der Worker selbst, damit nur zwei Dateien nötig sind. */
const CACHE = "vitalspur-2.1";
const MAN = { name: "Vitalspur", short_name: "Vitalspur", start_url: "./", scope: "./", display: "standalone", background_color: "#fafaf7", theme_color: "#2d6a4f",
  icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#2d6a4f"/><path d="M40 300h110l40-120 60 220 50-170 30 70h142" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>';
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.add("./")).catch(() => {})); });
self.addEventListener("activate", e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Zeit")), ms))]);
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (u.pathname.endsWith("/manifest.webmanifest")) { e.respondWith(new Response(JSON.stringify(MAN), { headers: { "Content-Type": "application/manifest+json" } })); return; }
  if (u.pathname.endsWith("/icon.svg")) { e.respondWith(new Response(ICON, { headers: { "Content-Type": "image/svg+xml" } })); return; }
  const page = r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html");
  if (!page) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try { const res = await timeout(fetch(r), 6000); if (res.ok) { await c.put(r, res.clone()); if (r.mode === "navigate") await c.put("./", res.clone()); } return res; }
    catch (err) { return (await c.match(r, { ignoreSearch: true })) || (await c.match("./")) || new Response("Vitalspur ist offline noch nicht gespeichert. Einmal mit Netz öffnen.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
  })());
});
