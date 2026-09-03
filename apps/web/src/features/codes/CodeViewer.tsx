import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Select, Button } from "@codevault/ui";

const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  php: "php",
  java: "java",
  "c#": "csharp",
  "c++": "cpp",
  dart: "dart",
  sql: "sql",
  html: "html",
  css: "css",
};

const MONACO_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "php", label: "PHP" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "dart", label: "Dart" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "plaintext", label: "نص عادي" },
];

function detectLanguage(language: string): string {
  return LANGUAGE_MAP[language.toLowerCase()] || "plaintext";
}

export function CodeViewer({ code, language }: { code: string; language: string }) {
  const [lang, setLang] = useState(detectLanguage(language));
  const [fullscreen, setFullscreen] = useState(false);
  const lineCount = code.split("\n").length;

  const editor = (
    <Editor
      height={fullscreen ? "calc(100vh - 60px)" : Math.min(600, Math.max(220, lineCount * 20 + 40))}
      language={lang}
      value={code}
      theme="vs-dark"
      options={{
        readOnly: true,
        minimap: { enabled: fullscreen },
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
      }}
    />
  );

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-bg"
          : "overflow-hidden rounded-xl border border-border bg-bg-elevated"
      }
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-card px-3 py-2">
        <Select value={lang} onChange={(e) => setLang(e.target.value)} className="h-8 w-40 text-xs">
          {MONACO_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setFullscreen((v) => !v)}>
          {fullscreen ? "إغلاق ملء الشاشة" : "ملء الشاشة"}
        </Button>
      </div>
      <div className="flex-1">{editor}</div>
    </div>
  );
}
