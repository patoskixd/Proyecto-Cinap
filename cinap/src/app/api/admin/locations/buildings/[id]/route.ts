import { NextResponse } from "next/server";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const r = await fetch(`${BASE}/admin/locations/buildings/${params.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await fetch(`${BASE}/admin/locations/buildings/${params.id}`, { method: "DELETE" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
