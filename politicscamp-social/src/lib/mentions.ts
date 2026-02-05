export function extractMentions(text: string) {
  const matches = text.match(/@([A-Za-z][A-Za-z]+)/g) ?? [];
  return matches
    .map((match) => match.slice(1))
    .map(splitCamelCase)
    .filter((item): item is { firstName: string; lastName: string } => Boolean(item));
}

function splitCamelCase(handle: string) {
  const parts = handle.match(/[A-Z][a-z]+|[a-z]+/g);
  if (!parts || parts.length < 2) return null;
  return {
    firstName: capitalize(parts[0]),
    lastName: capitalize(parts.slice(1).join(""))
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
