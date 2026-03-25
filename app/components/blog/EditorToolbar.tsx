"use client";

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

const ACTIONS = [
  { label: "B", before: "**", after: "**", title: "Bold" },
  { label: "I", before: "_", after: "_", title: "Italic" },
  { label: "H1", before: "# ", after: "", title: "Heading 1" },
  { label: "H2", before: "## ", after: "", title: "Heading 2" },
  { label: "H3", before: "### ", after: "", title: "Heading 3" },
  { label: "Link", before: "[", after: "](url)", title: "Link" },
  { label: "UL", before: "- ", after: "", title: "Unordered List" },
  { label: "OL", before: "1. ", after: "", title: "Ordered List" },
  { label: "`Code`", before: "`", after: "`", title: "Inline Code" },
  { label: "```", before: "```\n", after: "\n```", title: "Code Block" },
  { label: "Quote", before: "> ", after: "", title: "Blockquote" },
  { label: "Img", before: "![alt](", after: ")", title: "Image" },
  { label: "---", before: "\n---\n", after: "", title: "Divider" },
];

export function EditorToolbar({ onInsert }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-surface-border bg-surface-raised px-3 py-2">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.title}
          onClick={() => onInsert(action.before, action.after)}
          className="rounded-sm px-2 py-1 font-mono text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
