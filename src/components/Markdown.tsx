"use client";

import React from "react";

type Props = {
  content?: string | null;
  className?: string;
};

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = text;

  // Simple link pattern: [label](url)
  const linkRe = /\[([^\]]+)\]\(([^\s)]+)\)/g;

  // Process backticks first to avoid formatting inside code
  const codeSplit = rest.split(/`/);
  for (let i = 0; i < codeSplit.length; i++) {
    const segment = codeSplit[i];
    if (i % 2 === 1) {
      nodes.push(<code key={`code-${i}`}>{segment}</code>);
    } else {
      // Within non-code segment apply bold, italic, links
      let parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(segment))) {
        if (m.index > lastIndex) parts.push(segment.slice(lastIndex, m.index));
        parts.push(
          <a key={`lnk-${i}-${m.index}`} href={m[2]} className="underline text-blue-600 hover:text-blue-800">
            {m[1]}
          </a>
        );
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < segment.length) parts.push(segment.slice(lastIndex));

      // Now apply bold and italics inside remaining strings
      const fmtParts: React.ReactNode[] = [];
      parts.forEach((p, idx) => {
        if (typeof p !== "string") { fmtParts.push(p); return; }
        // bold: **text**
        const boldSplit = p.split(/\*\*(.+?)\*\*/g);
        for (let b = 0; b < boldSplit.length; b++) {
          const bseg = boldSplit[b];
          if (b % 2 === 1) {
            fmtParts.push(<strong key={`b-${i}-${idx}-${b}`}>{bseg}</strong>);
          } else {
            // italics: *text*
            const italSplit = bseg.split(/\*(.+?)\*/g);
            for (let s = 0; s < italSplit.length; s++) {
              const iseg = italSplit[s];
              if (s % 2 === 1) fmtParts.push(<em key={`i-${i}-${idx}-${b}-${s}`}>{iseg}</em>);
              else fmtParts.push(iseg);
            }
          }
        }
      });

      nodes.push(<React.Fragment key={`t-${i}`}>{fmtParts}</React.Fragment>);
    }
  }

  return nodes;
}

export default function Markdown({ content, className }: Props) {
  const text = (content ?? "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  type Block = { type: "p"; text: string[] } | { type: "ul"; items: string[] } | { type: "code"; lang: string | null; lines: string[] } | { type: `h${1|2|3|4|5|6}`; text: string };
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  let code: { lang: string | null; lines: string[] } | null = null;

  const flushPara = () => { if (para.length) { blocks.push({ type: "p", text: para }); para = []; } };
  const flushList = () => { if (list && list.length) { blocks.push({ type: "ul", items: list }); } list = null; };
  const flushCode = () => { if (code) { blocks.push({ type: "code", lang: code.lang, lines: code.lines }); } code = null; };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "  ");

    if (code) {
      if (/^```/.test(line)) { flushCode(); continue; }
      code.lines.push(raw);
      continue;
    }

    if (/^```/.test(line)) {
      flushPara(); flushList();
      const lang = line.replace(/^```+\s*/, "").trim() || null;
      code = { lang, lines: [] };
      continue;
    }

    if (!line.trim()) { flushPara(); flushList(); continue; }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushPara(); flushList();
      const level = heading[1].length as 1|2|3|4|5|6;
      blocks.push({ type: `h${level}`, text: heading[2] });
      continue;
    }

    const li = line.match(/^\s*[-*]\s+(.+)$/);
    if (li) { flushPara(); (list ||= []).push(li[1]); continue; }

    // paragraph text
    if (list) flushList();
    para.push(line);
  }

  flushCode(); flushList(); flushPara();

  return (
    <div className={(className ? className + " " : "") + "break-words"}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i} className="whitespace-pre-wrap break-words">{b.text.map((t, j) => <React.Fragment key={j}>{renderInline(t)}{j < b.text.length - 1 ? "\n" : null}</React.Fragment>)}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5 space-y-1">
                {b.items.map((it, j) => <li key={j} className="break-words">{renderInline(it)}</li>)}
              </ul>
            );
          case "code":
            return (
              <pre key={i} className="rounded-md bg-gray-100 p-3 overflow-x-auto"><code>{b.lines.join("\n")}</code></pre>
            );
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6": {
            const L = b.type;
            const Tag = L as any;
            const size = L === "h1" ? " text-2xl" : L === "h2" ? " text-xl" : L === "h3" ? " text-lg" : "";
            const spacing = L === "h1" ? " mt-4 mb-2" : L === "h2" ? " mt-3 mb-2" : " mt-2 mb-1";
            const cls = "text-gray-900 font-semibold" + size + spacing + " break-words";
            return <Tag key={i} className={cls}>{renderInline(b.text)}</Tag>;
          }
        }
      })}
    </div>
  );
}
