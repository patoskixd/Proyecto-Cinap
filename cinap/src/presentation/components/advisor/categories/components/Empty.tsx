export default function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="mb-2 text-4xl opacity-70">📭</div>
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
  );
}
