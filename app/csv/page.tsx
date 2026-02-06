"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadCsv } from "@/lib/apiClient";

type Preview = {
  headers: string[];
  rows: string[][];
};

function buildPreview(text: string): Preview {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
    .slice(0, 11); // header + 10 rows

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => line.split(",").map((v) => v.trim());
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export default function CsvPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) router.replace("/login");
  }, [router]);

  const preview = useMemo(() => {
    if (!previewText) return { headers: [], rows: [] };
    return buildPreview(previewText);
  }, [previewText]);

  const onChangeFile = async (f: File | null) => {
    setError(null);
    setFile(f);
    setPreviewText("");

    if (!f) return;

    try {
      const text = await f.text();
      setPreviewText(text);
    } catch {
      setError("ファイルの読み込みに失敗しました");
    }
  };

  const onUpload = async () => {
    setError(null);
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lightbi_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!file) {
      setError("CSVファイルを選択してください");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadCsv(token, file);
      router.push(`/dashboard/${result.dashboardId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">CSVアップロード</h1>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onChangeFile(e.target.files?.[0] ?? null)}
              className="text-sm text-zinc-700 dark:text-zinc-200"
            />
            <button
              type="button"
              onClick={onUpload}
              disabled={isUploading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isUploading ? "アップロード中..." : "アップロード"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {preview.headers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">プレビュー（先頭10行）</p>
              <div className="overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      {preview.headers.map((h, idx) => (
                        <th
                          key={idx}
                          className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                        >
                          {h || `col_${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                    {preview.rows.map((r, ridx) => (
                      <tr key={ridx}>
                        {preview.headers.map((_, cidx) => (
                          <td key={cidx} className="whitespace-nowrap px-3 py-2 text-zinc-900 dark:text-zinc-50">
                            {r[cidx] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                注意: プレビューは簡易表示（カンマ区切り前提）です。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
