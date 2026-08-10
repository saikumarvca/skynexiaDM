"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Archive,
  ExternalLink,
  FileText,
  Image,
  Video,
  File,
  Search,
  X,
  Plus,
} from "lucide-react";

type FileCategory =
  | "LOGO"
  | "IMAGE"
  | "VIDEO"
  | "BANNER"
  | "CREATIVE"
  | "DOC"
  | "OTHER";

interface FileAsset {
  _id: string;
  fileName: string;
  fileType: string;
  url: string;
  size?: number;
  category: FileCategory;
  tags?: string[];
  uploadedAt: string;
}

interface Props {
  clientId: string;
  initialFiles: FileAsset[];
}

const CATEGORIES: FileCategory[] = [
  "LOGO",
  "IMAGE",
  "VIDEO",
  "BANNER",
  "CREATIVE",
  "DOC",
  "OTHER",
];

const CATEGORY_COLORS: Record<FileCategory, string> = {
  LOGO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  IMAGE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  VIDEO: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  BANNER:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  CREATIVE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  DOC: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function fileIcon(fileType: string) {
  if (fileType.startsWith("image/"))
    return <Image className="h-8 w-8 text-blue-400" />;
  if (fileType.startsWith("video/"))
    return <Video className="h-8 w-8 text-pink-400" />;
  if (fileType.includes("pdf") || fileType.includes("doc"))
    return <FileText className="h-8 w-8 text-yellow-400" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesManager({ clientId, initialFiles }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<FileAsset[]>(initialFiles);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FileCategory | "ALL">(
    "ALL",
  );
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<FileAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // form state
  const [form, setForm] = useState({
    fileName: "",
    url: "",
    fileType: "image/jpeg",
    category: "IMAGE" as FileCategory,
    tags: "",
    size: "",
  });

  const filtered = files.filter((f) => {
    const matchCat = activeCategory === "ALL" || f.category === activeCategory;
    const matchSearch =
      !search ||
      f.fileName.toLowerCase().includes(search.toLowerCase()) ||
      f.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((p) => ({
      ...p,
      fileName: file.name,
      fileType: file.type,
      url,
      size: String(file.size),
      category: file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
          ? "VIDEO"
          : "DOC",
    }));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileName || !form.url) return;
    setUploading(true);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          fileName: form.fileName,
          fileType: form.fileType,
          url: form.url,
          category: form.category,
          size: form.size ? Number(form.size) : undefined,
          tags: form.tags
            ? form.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        }),
      });
      const created = await res.json();
      setFiles((p) => [created, ...p]);
      setShowForm(false);
      setForm({
        fileName: "",
        url: "",
        fileType: "image/jpeg",
        category: "IMAGE",
        tags: "",
        size: "",
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this file?")) return;
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    if (res.ok) {
      setFiles((p) => p.filter((f) => f._id !== id));
      if (preview?._id === id) setPreview(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload file
        </Button>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add by URL
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("ALL")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === "ALL"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({files.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = files.filter((f) => f.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  File Name *
                </label>
                <Input
                  value={form.fileName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileName: e.target.value }))
                  }
                  placeholder="logo.png"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  URL *
                </label>
                <Input
                  value={form.url}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, url: e.target.value }))
                  }
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      category: e.target.value as FileCategory,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  File Type
                </label>
                <Input
                  value={form.fileType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fileType: e.target.value }))
                  }
                  placeholder="image/jpeg"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tags (comma separated)
                </label>
                <Input
                  value={form.tags}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tags: e.target.value }))
                  }
                  placeholder="logo, brand, 2024"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Size (bytes)
                </label>
                <Input
                  value={form.size}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, size: e.target.value }))
                  }
                  placeholder="102400"
                  type="number"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Saving..." : "Save File"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* File grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <File className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No files found.</p>
          <p className="text-xs mt-1">Upload a file or add one by URL.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((file) => (
            <Card
              key={file._id}
              className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setPreview(file)}
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-muted flex items-center justify-center overflow-hidden">
                {file.fileType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.url}
                    alt={file.fileName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    {fileIcon(file.fileType)}
                    <span className="text-xs text-muted-foreground uppercase">
                      {file.fileType.split("/")[1]}
                    </span>
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-white" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file._id);
                    }}
                    className="rounded-full bg-white/20 p-2 hover:bg-amber-500/80 transition-colors"
                    title="Archive file"
                  >
                    <Archive className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <CardContent className="p-3">
                <p
                  className="text-sm font-medium truncate"
                  title={file.fileName}
                >
                  {file.fileName}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[file.category]}`}
                  >
                    {file.category}
                  </span>
                  {formatSize(file.size) && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                  )}
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {file.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <p className="font-medium truncate max-w-[80%]">
                {preview.fileName}
              </p>
              <button
                onClick={() => setPreview(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-muted min-h-[300px] max-h-[60vh] overflow-hidden">
              {preview.fileType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.fileName}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              ) : preview.fileType.startsWith("video/") ? (
                <video
                  src={preview.url}
                  controls
                  className="max-h-[60vh] max-w-full"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  {fileIcon(preview.fileType)}
                  <p className="text-sm">Preview not available</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[preview.category]}`}
                  >
                    {preview.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="mt-1 font-medium">{preview.fileType}</p>
                </div>
                {preview.size && (
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="mt-1 font-medium">
                      {formatSize(preview.size)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="mt-1 font-medium">
                    {new Date(preview.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {preview.tags && preview.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {preview.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open file
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(preview._id)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
