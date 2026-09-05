import { z } from "zod";

/**
 * A user-supplied URL that will later be rendered in the browser (an avatar,
 * a preview image). zod's .url() only checks that `new URL()` parses, which
 * happily accepts `javascript:alert(1)`, `data:text/html,...` and plain
 * `http://` — so every stored URL is pinned to https here instead.
 *
 * An empty string means "clear this field" and becomes null, which the
 * routes pass straight to Prisma; omitting the key entirely leaves the
 * stored value alone. Those two cases have to stay distinguishable, which
 * is why "" doesn't collapse to undefined.
 */
export const optionalHttpsUrl = z
  .string()
  .trim()
  .max(2000, "الرابط طويل جدًا")
  .refine((value) => {
    if (value === "") return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "يجب أن يكون رابطًا صحيحًا يبدأ بـ https://")
  .transform((value): string | null => (value === "" ? null : value))
  .optional();
