import React from "react";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; lines: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; code: string }
  | { type: "image"; alt: string; src: string; title?: string };

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  const isSpecialLine = (line: string): boolean =>
    /^#{1,3}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^```/.test(line) ||
    /^!\[[^\]]*]\([^)]+\)/.test(line);

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", code: codeLines.join("\n") });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)]\((\S+?)(?:\s+"([^"]+)")?\)$/);
    if (imageMatch) {
      blocks.push({
        type: "image",
        alt: imageMatch[1],
        src: imageMatch[2],
        title: imageMatch[3],
      });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isSpecialLine(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export default function MarkdownRenderer({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const className =
            block.level === 1
              ? "md-h1"
              : block.level === 2
                ? "md-h2"
                : "md-h3";
          return (
            <React.Fragment key={`h-${idx}`}>
              {block.level === 1 && <h1 className={className}>{block.text}</h1>}
              {block.level === 2 && <h2 className={className}>{block.text}</h2>}
              {block.level === 3 && <h3 className={className}>{block.text}</h3>}
            </React.Fragment>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p className="md-paragraph" key={`p-${idx}`}>
              {block.text}
            </p>
          );
        }
        if (block.type === "blockquote") {
          return (
            <blockquote className="md-blockquote" key={`q-${idx}`}>
              {block.lines.join(" ")}
            </blockquote>
          );
        }
        if (block.type === "unordered-list") {
          return (
            <ul className="md-list" key={`ul-${idx}`}>
              {block.items.map((item, itemIdx) => (
                <li key={`ul-item-${itemIdx}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ordered-list") {
          return (
            <ol className="md-list" key={`ol-${idx}`}>
              {block.items.map((item, itemIdx) => (
                <li key={`ol-item-${itemIdx}`}>{item}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "code") {
          return (
            <pre className="md-code" key={`c-${idx}`}>
              <code>{block.code}</code>
            </pre>
          );
        }
        return (
          <figure className="md-figure" key={`img-${idx}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="md-image" src={block.src} alt={block.alt || "Article image"} />
            {(block.alt || block.title) && (
              <figcaption className="md-caption">
                {block.title ?? block.alt}
              </figcaption>
            )}
          </figure>
        );
      })}
    </>
  );
}
