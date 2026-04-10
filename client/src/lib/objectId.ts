const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function isValidObjectId(id: string | undefined): boolean {
  return typeof id === "string" && OBJECT_ID_RE.test(id);
}
