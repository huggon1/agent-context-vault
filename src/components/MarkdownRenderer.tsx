import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "./CopyButton";

function CodeBlock({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const code = String(children ?? "").replace(/\n$/, "");

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

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
      <pre className="overflow-x-auto p-4 pr-20 text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
