"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-fab">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-6 mt-10 font-heading text-3xl font-bold tracking-wide text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-8 font-heading text-2xl font-semibold tracking-wide text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 font-heading text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-base leading-relaxed text-muted">
              {children}
            </p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-gold underline decoration-gold/30 transition-colors hover:text-gold-bright hover:decoration-gold/60"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6 text-muted">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6 text-muted">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-gold/40 bg-surface/50 py-2 pl-4 italic text-muted">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-sm text-crimson-bright">
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className || ""} block overflow-x-auto rounded-sm border border-surface-border bg-surface-raised p-4 font-mono text-sm text-foreground`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-sm border border-surface-border bg-surface-raised">
              {children}
            </pre>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ""}
              className="my-4 max-w-full rounded-sm border border-surface-border"
            />
          ),
          hr: () => (
            <hr className="my-8 border-surface-border" />
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-surface-border text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-surface-border bg-surface-raised px-4 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-surface-border px-4 py-2 text-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
