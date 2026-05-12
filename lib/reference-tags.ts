export function buildReferenceTag(name: string, fallback: string): string {
  const fallbackSlug =
    fallback
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "reference";

  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || fallbackSlug;

  return `@${slug}`;
}
