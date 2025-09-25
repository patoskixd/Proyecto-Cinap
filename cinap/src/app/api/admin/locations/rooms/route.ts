import { NextResponse } from "next/server";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get("buildingId");
  const url = new URL(`${BASE}/admin/locations/rooms`);
  if (buildingId) url.searchParams.set("buildingId", buildingId);
  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch(`${BASE}/admin/locations/rooms`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
