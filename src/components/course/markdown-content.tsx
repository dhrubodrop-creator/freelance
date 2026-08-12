import ReactMarkdown from "react-markdown";

/** Styled markdown renderer for playbook/exercise/interview content — matches
 * the design system's type scale instead of react-markdown's unstyled defaults. */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground [&_strong]:font-semibold [&_em]:italic">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent-600 underline underline-offset-2 hover:text-accent-700"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="flex flex-col gap-1.5 pl-5 [&>li]:list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="flex flex-col gap-1.5 pl-5 [&>li]:list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted text-micro uppercase text-muted-foreground">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-t border-border px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
