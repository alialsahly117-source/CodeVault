import { nanoid } from "nanoid";

export function slugify(input: string): string {
  const base = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `${base || "item"}-${nanoid(6)}`;
}
