import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";


export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const body = await req.json().catch(() => ({}));
  const upstream = await fetch(`${BACKEND}/slots/find`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const text = await upstream.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}
  return NextResponse.json(data, { status: upstream.status });
}


export async function GET(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";
  const { searchParams } = new URL(req.url);


  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const recursoId = searchParams.get("recursoId");

  const query = new URLSearchParams();
  if (date) query.set("date", date);
  if (serviceId) query.set("serviceId", serviceId);
  if (recursoId) query.set("recursoId", recursoId);

  const res = await fetch(`${BACKEND}/slots/find?${query.toString()}`, {
    method: "GET",
    headers: { cookie },
    credentials: "include",
    cache: "no-store",
  });

  const text = await res.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {}
  return NextResponse.json(body, { status: res.status });
}
