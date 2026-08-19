import { renderMarkdown } from '@/lib/markdown';
import CodeCopyButtons from './CodeCopyButtons';
import MermaidDiagrams from './MermaidDiagrams';

interface Props {
  markdown: string;
  slug?: string[];
}

export default function MarkdownContent({ markdown, slug = [] }: Props) {
  const html = renderMarkdown(markdown, slug);
  const contentKey = html.length + ':' + html.slice(0, 32);
  const hasDiagram = html.includes('mermaid-diagram');

  return (
    <>
      <div
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <CodeCopyButtons contentKey={contentKey} />
      {hasDiagram && <MermaidDiagrams contentKey={contentKey} />}
    </>
  );
}
