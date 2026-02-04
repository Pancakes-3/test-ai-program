export const TAGS = ["BREAKING_NEWS", "CANDIDATE", "PRESIDENT"] as const;
export type Tag = (typeof TAGS)[number];

export const ROLES = ["ADMIN", "USER", "MOD"] as const;
export type Role = (typeof ROLES)[number];

const delimiter = "|";

export function serializeTags(tags: string[]) {
  if (tags.length === 0) return "";
  const unique = Array.from(new Set(tags));
  return `${delimiter}${unique.join(delimiter)}${delimiter}`;
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(delimiter)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function tagToken(tag: string) {
  return `${delimiter}${tag}${delimiter}`;
}
