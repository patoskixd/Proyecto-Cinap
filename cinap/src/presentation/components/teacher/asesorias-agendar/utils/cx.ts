export function cx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
