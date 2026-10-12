// Health check dla Dockera i Caddy'ego. Demo nie ma bazy ani sekretów.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, demo: "rewards" });
}
