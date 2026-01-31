"use client";

import { useEffect, useState } from "react";
import { allowedImageTypes, allowedVideoTypes } from "@/lib/media";

const maxFiles = 6;
const maxSizeMb = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 20);

export function PostComposer({ onPosted }: { onPosted: () => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateFiles(nextFiles: File[]) {
    if (nextFiles.length > maxFiles) {
      return `You can upload up to ${maxFiles} files.`;
    }
    for (const file of nextFiles) {
      if (![...allowedImageTypes, ...allowedVideoTypes].includes(file.type)) {
        return "Unsupported file type.";
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        return `File ${file.name} is too large.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!text.trim() && files.length === 0) {
      setError("Add some text or media to post.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("text", text);
    files.forEach((file) => formData.append("media", file));

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Unable to post.");
      return;
    }
    setText("");
    setFiles([]);
    onPosted();
  }

  useEffect(() => {
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(nextPreviews);
    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Share your campaign update..."
        className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm"
        rows={3}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          multiple
          accept={[...allowedImageTypes, ...allowedVideoTypes].join(",")}
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            const nextFiles = [...files, ...selected];
            const validationError = validateFiles(nextFiles);
            if (validationError) {
              setError(validationError);
              return;
            }
            setFiles(nextFiles);
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
      {previews.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {previews.map((preview) => (
            <div key={preview.url} className="rounded-xl border border-slate-200 p-2 text-xs">
              {preview.file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="" className="h-32 w-full rounded-lg object-cover" />
              ) : (
                <video className="h-32 w-full rounded-lg object-cover" controls>
                  <source src={preview.url} type={preview.file.type} />
                </video>
              )}
              <div className="mt-2 font-medium">{preview.file.name}</div>
              <div className="text-slate-500">{Math.round(preview.file.size / 1024)} KB</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
