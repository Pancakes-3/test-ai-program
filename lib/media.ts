export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const allowedVideoTypes = ["video/mp4", "video/webm"];

export function getMediaType(mimeType: string) {
  if (allowedImageTypes.includes(mimeType)) return "image";
  if (allowedVideoTypes.includes(mimeType)) return "video";
  return null;
}

export function isValidMediaType(mimeType: string) {
  return Boolean(getMediaType(mimeType));
}
