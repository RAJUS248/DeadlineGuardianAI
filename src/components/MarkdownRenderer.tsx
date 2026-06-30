import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockLines: string[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  let currentListType: "bullet" | "number" | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      if (currentListType === "bullet") {
        renderedElements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2.5 space-y-1.5 text-brand-body leading-relaxed">
            {...listItems}
          </ul>
        );
      } else if (currentListType === "number") {
        renderedElements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 my-2.5 space-y-1.5 text-brand-body leading-relaxed">
            {...listItems}
          </ol>
        );
      }
      listItems = [];
      currentListType = null;
    }
  };

  const flushTable = (key: string) => {
    if (inTable && (tableHeaders.length > 0 || tableRows.length > 0)) {
      renderedElements.push(
        <div key={`table-container-${key}`} className="overflow-x-auto my-4 border border-brand-border/60 rounded-xl">
          <table className="min-w-full divide-y divide-brand-border text-sm">
            {tableHeaders.length > 0 && (
              <thead className="bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left font-bold text-brand-heading border-b border-brand-border">
                      {parseInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-brand-border">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-brand-body font-medium">
                      {parseInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    if (!text) return "";
    
    let hasCheckbox = false;
    let isChecked = false;
    let cleanText = text;
    if (text.startsWith("[ ] ")) {
      hasCheckbox = true;
      isChecked = false;
      cleanText = text.substring(4);
    } else if (text.startsWith("[x] ") || text.startsWith("[X] ")) {
      hasCheckbox = true;
      isChecked = true;
      cleanText = text.substring(4);
    }

    const parts: React.ReactNode[] = [];
    let tempText = cleanText;

    let index = 0;
    while (tempText.length > 0) {
      const boldIdx = tempText.indexOf("**");
      const codeIdx = tempText.indexOf("`");
      
      // To prevent "*" from matching inside "**", we search for standalone "*"
      let italicIdx = -1;
      let pos = 0;
      while (pos < tempText.length) {
        const found = tempText.indexOf("*", pos);
        if (found === -1) break;
        const isPartOfDouble = (found > 0 && tempText[found - 1] === "*") || (found < tempText.length - 1 && tempText[found + 1] === "*");
        if (!isPartOfDouble) {
          italicIdx = found;
          break;
        }
        pos = found + (tempText[found + 1] === "*" ? 2 : 1);
      }

      const indices = [
        { type: "bold", index: boldIdx, delim: "**" },
        { type: "italic", index: italicIdx, delim: "*" },
        { type: "code", index: codeIdx, delim: "`" }
      ].filter(item => item.index !== -1).sort((a, b) => a.index - b.index);

      if (indices.length === 0) {
        parts.push(<span key={index++}>{tempText}</span>);
        break;
      }

      const first = indices[0];
      if (first.index > 0) {
        parts.push(<span key={index++}>{tempText.substring(0, first.index)}</span>);
      }

      const rest = tempText.substring(first.index + first.delim.length);
      const closeIdx = rest.indexOf(first.delim);

      if (closeIdx === -1) {
        parts.push(<span key={index++}>{first.delim}</span>);
        tempText = rest;
      } else {
        const innerText = rest.substring(0, closeIdx);
        if (first.type === "bold") {
          parts.push(<strong key={index++} className="font-extrabold text-brand-heading">{innerText}</strong>);
        } else if (first.type === "italic") {
          parts.push(<em key={index++} className="italic text-brand-body/90">{innerText}</em>);
        } else if (first.type === "code") {
          parts.push(<code key={index++} className="px-1.5 py-0.5 font-mono text-xs bg-slate-100 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 rounded-md">{innerText}</code>);
        }
        tempText = rest.substring(closeIdx + first.delim.length);
      }
    }

    if (hasCheckbox) {
      return (
        <span className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="w-4 h-4 rounded border-brand-input-border text-brand-primary focus:ring-brand-primary focus:ring-offset-0 cursor-default"
          />
          <span>{parts}</span>
        </span>
      );
    }

    return <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      if (inCodeBlock) {
        const codeText = codeBlockLines.join("\n");
        renderedElements.push(
          <div key={`codeblock-${i}`} className="my-4 rounded-xl border border-brand-border overflow-hidden bg-slate-950 text-slate-100 p-4 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto shadow-xs">
            {codeBlockLanguage && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
                {codeBlockLanguage}
              </div>
            )}
            <pre className="whitespace-pre">{codeText}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeBlockLanguage = "";
      } else {
        flushList(`code-start-${i}`);
        flushTable(`code-start-${i}`);
        inCodeBlock = true;
        codeBlockLanguage = trimmedLine.replace("```", "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (trimmedLine.startsWith("|")) {
      flushList(`table-start-${i}`);
      const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = cells.every(c => c.match(/^:?-+:?$/));

      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable(`table-end-${i}`);
    }

    if (trimmedLine.startsWith("#")) {
      flushList(`header-${i}`);
      const hMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const hText = hMatch[2];
        const parsedText = parseInlineMarkdown(hText);

        if (level === 1) {
          renderedElements.push(
            <h1 key={`h1-${i}`} className="text-xl md:text-2xl font-black text-brand-heading tracking-tight mt-5 mb-3 leading-snug">
              {parsedText}
            </h1>
          );
        } else if (level === 2) {
          renderedElements.push(
            <h2 key={`h2-${i}`} className="text-lg md:text-xl font-extrabold text-brand-heading tracking-tight mt-4.5 mb-2.5 leading-snug">
              {parsedText}
            </h2>
          );
        } else {
          renderedElements.push(
            <h3 key={`h3-${i}`} className="text-base md:text-lg font-bold text-brand-heading mt-4 mb-2 leading-snug">
              {parsedText}
            </h3>
          );
        }
        continue;
      }
    }

    if (trimmedLine.startsWith(">")) {
      flushList(`quote-${i}`);
      const quoteText = trimmedLine.substring(1).trim();
      renderedElements.push(
        <blockquote key={`quote-${i}`} className="my-3 pl-4 border-l-4 border-indigo-500/80 italic text-brand-body/90 font-medium">
          {parseInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      if (currentListType !== "bullet") {
        flushList(`bullet-flush-${i}`);
        currentListType = "bullet";
      }
      const itemContent = trimmedLine.substring(2).trim();
      listItems.push(
        <li key={`li-${i}-${listItems.length}`} className="leading-relaxed">
          {parseInlineMarkdown(itemContent)}
        </li>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      if (currentListType !== "number") {
        flushList(`number-flush-${i}`);
        currentListType = "number";
      }
      const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
      const itemContent = numMatch ? numMatch[2] : trimmedLine;
      listItems.push(
        <li key={`li-${i}-${listItems.length}`} className="leading-relaxed">
          {parseInlineMarkdown(itemContent)}
        </li>
      );
      continue;
    }

    if (trimmedLine === "---" || trimmedLine === "***" || trimmedLine === "___") {
      flushList(`hr-${i}`);
      flushTable(`hr-${i}`);
      renderedElements.push(<hr key={`hr-${i}`} className="my-6 border-brand-border" />);
      continue;
    }

    if (trimmedLine === "") {
      flushList(`empty-${i}`);
      continue;
    }

    flushList(`para-${i}`);
    renderedElements.push(
      <p key={`p-${i}`} className="text-base text-brand-body font-medium leading-relaxed my-2.5 break-words">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  flushList("end");
  flushTable("end");

  return <div className="space-y-1 md:space-y-1.5 w-full select-text">{renderedElements}</div>;
};
