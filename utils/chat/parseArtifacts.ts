export interface Artifact {
  id: string;
  filename: string;
  language: string;
  content: string;
  type: "code" | "html" | "svg";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function detectFilename(firstLine: string): string | null {
  const m = firstLine.match(/^(?:\/\/|#)\s*artifact:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    zsh: "zsh",
    sql: "sql",
    dockerfile: "dockerfile",
    svg: "svg",
  };
  return map[ext] || ext || "text";
}

export function parseArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const langTag = match[1] ?? "";
    const content = match[2];
    const lines = content.split("\n");

    const firstLine = lines[0]?.trim() ?? "";
    const filename = detectFilename(firstLine);

    const isHtmlOrSvg =
      langTag.toLowerCase() === "html" || langTag.toLowerCase() === "svg";

    if (filename) {
      const artifactContent = lines.slice(1).join("\n");
      artifacts.push({
        id: generateId(),
        filename,
        language: getLanguageFromFilename(filename),
        content: artifactContent,
        type: isHtmlOrSvg ? (langTag.toLowerCase() as "html" | "svg") : "code",
      });
    } else if (lines.length >= 20 || isHtmlOrSvg) {
      artifacts.push({
        id: generateId(),
        filename: `artifact.${langTag || "txt"}`,
        language: langTag || "text",
        content,
        type: isHtmlOrSvg ? (langTag.toLowerCase() as "html" | "svg") : "code",
      });
    }
  }

  return artifacts;
}
