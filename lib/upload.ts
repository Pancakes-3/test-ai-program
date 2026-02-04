import { getStorageProvider } from "@/lib/storage";

export async function saveFile(file: File, prefix: string) {
  const storage = getStorageProvider();
  return storage.save(file, prefix);
}
