const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const TAGS_REGEX = /<\/?[^>]+>/g;

export function toPlainText(input: unknown, fallback = ""): string {
  if (input === null || input === undefined) return fallback;
  const raw = String(input);
  const cleaned = raw
    .replace(CONTROL_CHARS, " ")
    .replace(TAGS_REGEX, " ")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}
