import fs from "fs/promises";
import path from "path";

export type StoredFile = {
  filename: string;
  publicPath: string;
};

export interface StorageProvider {
  save(file: File, prefix: string): Promise<StoredFile>;
}

class LocalStorage implements StorageProvider {
  private uploadDir = process.env.UPLOAD_DIR ?? "./public/uploads";

  async save(file: File, prefix: string) {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname(file.name) || "";
    const filename = `${prefix}-${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    const publicPath = filePath.startsWith("public/")
      ? filePath.replace("public", "")
      : `/uploads/${filename}`;
    return { filename, publicPath };
  }
}

export function getStorageProvider(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") {
    throw new Error("S3 storage is not configured. Set STORAGE_DRIVER=local for dev.");
  }
  return new LocalStorage();
}
