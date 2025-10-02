"use client";

export function ErrorModal({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
      {message}
    </div>
  );
}
