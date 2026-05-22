import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./CopyButton";

function extractCodeText(children: React.ReactNode): string {
  const child = React.Children.toArray(children).find(
    (c): c is React.ReactElement<{ children?: React.ReactNode }> =>
      React.isValidElement(c) && (c.type === "code" || (typeof c.type === "string" && c.type === "code")),
  );
  const raw = child?.props.children ?? children;
  return String(raw ?? "").replace(/\n$/, "");
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const code = extractCodeText(children);
  return (
    <div className="group relative my-5 overflow-hidden rounded-md border bg-muted/40">
      <CopyButton
        value={code}
        label="Copy"
        copiedLabel="Copied"
        size="sm"
        variant="secondary"
        className="absolute right-2 top-2 z-10 h-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
      />
      <pre {...props} className="overflow-x-auto p-4 pr-20 text-sm">
        {children}
      </pre>
    </div>
  );
}

function Code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: Pre,
          code: Code,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
