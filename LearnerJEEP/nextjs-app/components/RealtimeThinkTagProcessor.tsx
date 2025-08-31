import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './markdownPreview';
import { ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface RealtimeThinkTagProcessorProps {
  content: string;
  isStreaming: boolean;
}

// Standalone ThinkingBlock component
const ThinkingBlock: React.FC<{ content: string; index: number }> = ({ content, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper function to get the last N lines of text
  const getLastLines = (text: string, lineCount: number): string => {
    const lines = text.split('\n');
    if (lines.length <= lineCount) return text;
    
    return lines.slice(-lineCount).join('\n');
  };
  
  const previewContent = getLastLines(content.trim(), 3);
  
  return (
    <div className="my-4" key={`think-${index}`}>
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
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * RealtimeThinkTagProcessor - Processes streaming content and renders <think> tag content
 * in real-time as it arrives, without waiting for the closing tag
 */
export default function RealtimeThinkTagProcessor({ content, isStreaming }: RealtimeThinkTagProcessorProps) {
  // State to track if we're currently inside a think tag
  const [insideThinkTag, setInsideThinkTag] = useState(false);
  
  // Normal and think content buffers
  const [normalContent, setNormalContent] = useState('');
  const [thinkContent, setThinkContent] = useState('');
  
  // Refs to track the last processed content length
  const lastProcessedLength = useRef(0);
  
  // History of finalized content segments
  const [contentSegments, setContentSegments] = useState<Array<{type: 'normal' | 'think', content: string}>>([]);
  
  // Process incoming content for think tags in real-time
  useEffect(() => {
    if (!content || content.length <= lastProcessedLength.current) return;
    
    // Only process new content since last update
    const newContent = content.substring(lastProcessedLength.current);
    lastProcessedLength.current = content.length;
    
    // Batch all state updates to prevent infinite update loops
    const updatedSegments = [...contentSegments];
    let shouldUpdateSegments = false;
    let updatedNormalContent = normalContent;
    let updatedThinkContent = thinkContent;
    let updatedInsideThinkTag = insideThinkTag;
    
    // Helper function to add a segment
    const addSegment = (type: 'normal' | 'think', content: string) => {
      if (content) {
        updatedSegments.push({ type, content });
        shouldUpdateSegments = true;
      }
    };
    
    if (updatedInsideThinkTag) {
      // We're inside a think tag - check if we found a closing tag
      const closeTagIndex = newContent.indexOf('</think>');
      
      if (closeTagIndex !== -1) {
        // Extract content up to the closing tag
        const newThinkContent = newContent.substring(0, closeTagIndex);
        updatedThinkContent += newThinkContent;
        
        // Finalize the think content segment
        if (updatedThinkContent) {
          addSegment('think', updatedThinkContent);
          updatedThinkContent = '';
        }
        
        // Process content after the closing tag
        const contentAfterCloseTag = newContent.substring(closeTagIndex + 8); // '</think>'.length = 8
        
        // Check if there's another opening tag after the close tag
        const nextOpenTagIndex = contentAfterCloseTag.indexOf('<think>');
        
        if (nextOpenTagIndex !== -1) {
          // There's another opening tag after this closing tag
          const normalContentBetweenTags = contentAfterCloseTag.substring(0, nextOpenTagIndex);
          
          // Add normal content between tags if any
          if (normalContentBetweenTags) {
            addSegment('normal', normalContentBetweenTags);
          }
          
          // Process content after the next open tag
          const afterNextOpenTag = contentAfterCloseTag.substring(nextOpenTagIndex + 7); // '<think>'.length = 7
          updatedThinkContent = afterNextOpenTag;
          updatedInsideThinkTag = true;
        } else {
          // No more opening tags after this closing tag
          if (contentAfterCloseTag) {
            updatedNormalContent = contentAfterCloseTag;
          }
          updatedInsideThinkTag = false;
        }
      } else {
        // No closing tag found, still inside think tag - append to think buffer
        updatedThinkContent += newContent;
      }
    } else {
      // We're not inside a think tag - check if we found an opening tag
      const openTagIndex = newContent.indexOf('<think>');
      
      if (openTagIndex !== -1) {
        // Extract normal content before the tag
        const newNormalContent = newContent.substring(0, openTagIndex);
        updatedNormalContent += newNormalContent;
        
        // Finalize the normal content segment
        if (updatedNormalContent) {
          addSegment('normal', updatedNormalContent);
          updatedNormalContent = '';
        }
        
        // Process content after the opening tag
        const contentAfterOpenTag = newContent.substring(openTagIndex + 7); // '<think>'.length = 7
        updatedThinkContent = contentAfterOpenTag;
        updatedInsideThinkTag = true;
      } else {
        // No think tags found, just normal content - append to normal buffer
        updatedNormalContent += newContent;
      }
    }
    
    // Apply all state updates in a single batch
    if (normalContent !== updatedNormalContent) {
      setNormalContent(updatedNormalContent);
    }
    
    if (thinkContent !== updatedThinkContent) {
      setThinkContent(updatedThinkContent);
    }
    
    if (insideThinkTag !== updatedInsideThinkTag) {
      setInsideThinkTag(updatedInsideThinkTag);
    }
    
    if (shouldUpdateSegments) {
      setContentSegments(updatedSegments);
    }
  }, [content, insideThinkTag, normalContent, thinkContent, contentSegments]);
  
  // When streaming completes, finalize any remaining content
  useEffect(() => {
    if (!isStreaming && (normalContent || thinkContent)) {
      if (insideThinkTag && thinkContent) {
        setContentSegments(prev => [...prev, { type: 'think', content: thinkContent }]);
        setThinkContent('');
      } else if (normalContent) {
        setContentSegments(prev => [...prev, { type: 'normal', content: normalContent }]);
        setNormalContent('');
      }
    }
  }, [isStreaming, insideThinkTag, normalContent, thinkContent]);
  
  return (
    <div className="realtime-think-processor">
      {/* Render all finalized content segments */}
      {contentSegments.map((segment, index) => (
        <div key={`segment-${index}`}>
          {segment.type === 'think' ? (
            <ThinkingBlock content={segment.content} index={index} />
          ) : (
            <div className="normal-content">
              <MarkdownRenderer content={segment.content} />
            </div>
          )}
        </div>
      ))}
      
      {/* Render current buffers */}
      {insideThinkTag && thinkContent && (
        <ThinkingBlock content={thinkContent} index={contentSegments.length} />
      )}
      
      {!insideThinkTag && normalContent && (
        <div className="normal-content-current">
          <MarkdownRenderer content={normalContent} />
        </div>
      )}
    </div>
  );
}
