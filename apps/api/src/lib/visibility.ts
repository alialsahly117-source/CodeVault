interface VisibilityFields {
  authorId: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: "PUBLISHED" | "HIDDEN" | "PENDING";
}

/**
 * Single source of truth for "can this user see this code/prompt?" — used
 * both to gate the detail GET routes and, critically, the like/save/copy/
 * report actions on the same content. Those action routes used to skip this
 * check entirely: any authenticated user could POST /codes/:id/like (or
 * /save) for a PRIVATE code/prompt they had no access to, and because
 * /users/me/saved and /users/me/liked return the full content object, that
 * was a real IDOR — enumerate or guess an id, save it, then read its full
 * title/description/content back from your own "saved" list.
 */
export function canView(item: VisibilityFields, user?: { id: string; role: string }): boolean {
  if (user && (item.authorId === user.id || user.role === "ADMIN")) return true;
  return item.visibility === "PUBLIC" && item.status === "PUBLISHED";
}
