import { NextResponse } from "next/server";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const r = await fetch(`${BASE}/admin/locations/campus/${params.id}/reactivate`, { method: "POST" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
