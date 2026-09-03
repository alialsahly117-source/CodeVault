const LANGUAGE_EXTENSIONS: Record<string, string> = {
  JavaScript: "js",
  TypeScript: "ts",
  Python: "py",
  PHP: "php",
  Java: "java",
  "C#": "cs",
  "C++": "cpp",
  Dart: "dart",
  SQL: "sql",
  HTML: "html",
  CSS: "css",
};

function slugifyFilename(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCodeFile(title: string, language: string, content: string) {
  const ext = LANGUAGE_EXTENSIONS[language] || "txt";
  triggerDownload(`${slugifyFilename(title)}.${ext}`, content);
}

export function downloadPromptFile(title: string, content: string) {
  triggerDownload(`${slugifyFilename(title)}.txt`, content);
}
