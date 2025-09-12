"use client";

export default function Toast({ msg, tone }: { msg: string; tone: "info" | "success" | "error" }) {
  return (
    <div
      className={`fixed right-4 top-24 z-[60] rounded-lg px-4 py-2 text-white shadow-lg ${tone === "success" ? "bg-emerald-600" : tone === "error" ? "bg-rose-600" : "bg-blue-600"}`}>
      {msg}
    </div>
  );
}
