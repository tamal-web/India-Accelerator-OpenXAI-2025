// components/MarkdownRenderer.tsx
import React, { useState, DetailedHTMLProps, HTMLAttributes, AnchorHTMLAttributes, ImgHTMLAttributes, LiHTMLAttributes, OlHTMLAttributes, TableHTMLAttributes, BlockquoteHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import Image from 'next/image';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button } from '@/components/ui/button';

interface MarkdownRendererProps {
  content: string;
}

interface ContentPart {
  type: 'text' | 'think';
  content: string;
}

// Additional props for our custom components beyond the standard HTML attributes
interface MarkdownExtendedProps {
  inline?: boolean; 
}

// Various specialized component props that match exactly what React-Markdown expects
type HeadingProps = DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> & MarkdownExtendedProps;
type ParagraphProps = DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> & MarkdownExtendedProps;
type UListProps = DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement> & MarkdownExtendedProps;
type OListProps = DetailedHTMLProps<OlHTMLAttributes<HTMLOListElement>, HTMLOListElement> & MarkdownExtendedProps;
type ListItemProps = DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement> & MarkdownExtendedProps;
type BlockquoteProps = DetailedHTMLProps<BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement> & MarkdownExtendedProps;
type TableProps = DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement> & MarkdownExtendedProps;
type ThProps = DetailedHTMLProps<ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement> & MarkdownExtendedProps;
type TdProps = DetailedHTMLProps<TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement> & MarkdownExtendedProps;
type CodeProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & MarkdownExtendedProps;
type PreProps = DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement> & MarkdownExtendedProps;
type AnchorProps = DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & MarkdownExtendedProps;
type ImageProps = DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & MarkdownExtendedProps;

// Note: We now use specific types for each component, no generic fallback needed

// Helper function to get the last N lines of text
const getLastLines = (text: string, lineCount: number): string => {
  const lines = text.split('\n');
  if (lines.length <= lineCount) return text;
  
  return lines.slice(-lineCount).join('\n');
};

// Helper function to format content for markdown rendering
const formatContent = (text: string): string => {
  return text
    .replace(/^(#{1,6})([^#\s])/gm, '$1 $2') // Ensure space after # for headings
    .trim();
};

// Thinking block component with preview
const ThinkingBlock: React.FC<{ content: string; index: number }> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const previewContent = getLastLines(content.trim(), 3);
  
  return (
    <div className="my-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden max-w-[50%]">
        {/* Custom header with preview */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-3 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">Thinking Process</span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </button>
        
        {/* Preview when collapsed */}
        {!isOpen && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm italic opacity-75 overflow-hidden text-ellipsis">
            <div className="line-clamp-3">
              {previewContent}
            </div>
          </div>
        )}
        
        {/* Full content when expanded */}
        {isOpen && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {formatContent(content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

// Main MarkdownRenderer component
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Process content to detect and handle <think> tags
  const processThinkTags = (contentStr: string): ContentPart[] => {
    // Regular expression to match <think> tags and their content
    const thinkTagRegex = /<think>([\s\S]*?)<\/think>/g;
    
    // Array to hold parts (regular text and think blocks)
    const contentParts: ContentPart[] = [];
    
    let lastIndex = 0;
    let match;
    
    // Find all <think> tags and split the content
    while ((match = thinkTagRegex.exec(contentStr)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        contentParts.push({
          type: 'text',
          content: contentStr.substring(lastIndex, match.index)
        });
      }
      
      // Add the think tag content
      contentParts.push({
        type: 'think',
        content: match[1].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining content after the last match
    if (lastIndex < contentStr.length) {
      contentParts.push({
        type: 'text',
        content: contentStr.substring(lastIndex)
      });
    }
    
    return contentParts;
  };

  // Split content into text and think blocks
  const contentParts = processThinkTags(content);
  
  // Code block with language header and copy button component
  const CodeBlock: React.FC<CodeProps> = ({ className, children }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match && match[1] ? match[1] : '';
    
    // Clean and prepare the code string for copying
    const code = children ? String(children).trim() : '';
    
    // Handle copy button click
    const handleCopy = () => {
      if (code) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };
    
    // Render code block with header and syntax highlighting
    return (
      <div className="code-block rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 my-4">
        {/* Add custom styles to override the line number colors */}
        <style jsx global>{
          `
            /* Override syntax highlighter line numbers to be light gray instead of green */
            /* Target all possible class names that might be used for line numbers */
            .custom-syntax-highlighter .react-syntax-highlighter-line-number,
            .custom-syntax-highlighter span.linenumber,
            .custom-syntax-highlighter .line-numbers-rows > span:before,
            .custom-syntax-highlighter code[class*="language-"] .token.linenumber,
            .custom-syntax-highlighter .token.linenumber,
            .custom-syntax-highlighter span[style*="user-select: none"] {
              color: #94A3B8 !important; /* slate-400 */
              text-shadow: none !important;
            }
          `
        }</style>
        {/* Language header with copy button - matching dark theme for consistency */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-700 dark:bg-gray-800 border-b border-gray-600 dark:border-gray-700">
          <span className="text-xs font-mono text-gray-200 dark:text-gray-300">
            {language.toLowerCase()}
          </span>
          <Button 
            onClick={handleCopy} 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 mr-1" /> Copied</>
            ) : (
              <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
            )}
          </Button>
        </div>
        
        {/* Code with syntax highlighting - using dark background for better readability in both themes */}
        {/* Custom styled code block with proper line number coloring */}
        <div 
          className="overflow-auto rounded-b-md" 
          style={{
            backgroundColor: '#1E293B',
            margin: 0,
            padding: 0,
            fontSize: '0.9rem',
          }}
        >
          <div className="relative">
            {/* Line numbers column */}
            <div 
              className="absolute left-0 top-0 bottom-0 py-4 pl-4 pr-2 select-none"
              style={{ color: '#94A3B8' }} // Light gray line numbers
            >
              {code.split('\n').map((_, i) => (
                <div key={i} className="text-right">
                  {i + 1}
                </div>
              ))}
            </div>
            
            {/* Actual code with syntax highlighting */}
            <div className="pl-12 py-4 pr-4 overflow-x-auto">
              <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  fontSize: '0.9rem',
                }}
                showLineNumbers={false}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Define properly typed markdown components  
  const markdownComponents: Partial<Components> = {
    h1: ({ className, ...props }: HeadingProps) => (
      <h1 className={`text-3xl font-semibold my-6 pb-2 border-b border-gray-200 dark:border-gray-700 ${className || ''}`} {...props} />
    ),
    h2: ({ className, ...props }: HeadingProps) => (
      <h2 className={`text-2xl font-semibold my-5 pb-1 border-b border-gray-200 dark:border-gray-700 ${className || ''}`} {...props} />
    ),
    h3: ({ className, ...props }: HeadingProps) => (
      <h3 className={`text-xl font-semibold my-4 ${className || ''}`} {...props} />
    ),
    h4: ({ className, ...props }: HeadingProps) => (
      <h4 className={`text-lg font-semibold my-3 ${className || ''}`} {...props} />
    ),
    h5: ({ className, ...props }: HeadingProps) => (
      <h5 className={`text-base font-semibold my-2 ${className || ''}`} {...props} />
    ),
    h6: ({ className, ...props }: HeadingProps) => (
      <h6 className={`text-sm font-semibold my-2 ${className || ''}`} {...props} />
    ),
    p: ({ className, children, ...props }: ParagraphProps) => {
      // Simple solution: Always use div instead of p to avoid hydration errors completely
      return (
        <div className={`mb-4 leading-relaxed ${className || ''}`} {...props}>
          {children}
        </div>
      );
    },
    ul: ({ className, ...props }: UListProps) => (
      <ul className={`pl-6 mb-5 list-disc ${className || ''}`} {...props} />
    ),
    ol: ({ className, ...props }: OListProps) => (
      <ol className={`pl-6 mb-5 list-decimal ${className || ''}`} {...props} />
    ),
    li: ({ className, ...props }: ListItemProps) => (
      <li className={`mb-1 ${className || ''}`} {...props} />
    ),
    blockquote: ({ className, ...props }: BlockquoteProps) => (
      <blockquote className={`pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic my-4 py-1 ${className || ''}`} {...props} />
    ),
    table: ({ className, ...props }: TableProps) => (
      <div className="overflow-x-auto my-4">
        <table className={`min-w-full border border-gray-300 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700 ${className || ''}`} {...props} />
      </div>
    ),
    th: ({ className, ...props }: ThProps) => (
      <th className={`px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left font-medium ${className || ''}`} {...props} />
    ),
    td: ({ className, ...props }: TdProps) => (
      <td className={`px-4 py-2 border-t border-gray-300 dark:border-gray-700 ${className || ''}`} {...props} />
    ),
    img: ({ alt, src, className }: ImageProps) => {
      // When src is available and is a string, use Next.js Image component
      if (src && typeof src === 'string') {
        return (
          <div className="relative max-w-full my-4 rounded-md overflow-hidden">
            <Image 
              src={src}
              alt={alt || ''}
              width={700}
              height={350}
              className={`rounded-md ${className || ''}`}
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </div>
        );
      }
      
      // Fallback when src is not available or not a string, 
      // Use a placeholder image with Next.js Image when possible
      return (
        <div className="relative max-w-full my-4 rounded-md overflow-hidden">
          <Image 
            src="/placeholder.png" 
            alt={alt || 'Placeholder image'}
            width={400}
            height={225}
            className={`rounded-md ${className || ''}`}
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      );
    },
    hr: () => (
      <hr className="my-8 border-t border-gray-300 dark:border-gray-700" />
    ),
    code: ({ className, inline, children, ...props }: CodeProps) => {
      // Inline code vs code block
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }

      // Use custom CodeBlock component for code blocks
      return (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      );
    },
    pre: ({ className, ...props }: PreProps) => {
      return <pre className={`relative my-4 overflow-hidden rounded-md ${className || ''}`} {...props} />;
    },
    a: ({ href, className, ...props }: AnchorProps) => {
      return <a href={href || '#'} className={`text-blue-500 hover:underline ${className || ''}`} target="_blank" rel="noopener noreferrer" {...props} />;
    },
  };
  
  // Render the markdown content
  return (
    <div className="markdown-content font-sans text-base break-words" style={{ width: '100%', maxWidth: '100%', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
      {contentParts.map((part, index) => {
        if (part.type === 'think') {
          return <ThinkingBlock key={`think-${index}`} content={part.content} index={index} />;
        } else {
          return (
            <ReactMarkdown
              key={`text-${index}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              unwrapDisallowed={true}
              skipHtml={true}
              components={markdownComponents}
            >
              {formatContent(part.content)}
            </ReactMarkdown>
          );
        }
      })}
    </div>
  );
};

// Create a wrapper with the ThinkingBlock attached
const MarkdownRendererWithThinkingBlock = Object.assign(MarkdownRenderer, {
  ThinkingBlock: ThinkingBlock
});

export default MarkdownRendererWithThinkingBlock;