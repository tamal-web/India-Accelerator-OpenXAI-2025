import { useState, useEffect, useRef } from 'react';
import RealtimeThinkTagProcessor from './RealtimeThinkTagProcessor';

interface OptimizedStreamingMessageProps {
  content: string;
  isStreaming: boolean;
  // Option to disable batching entirely for immediate rendering
  immediateMdRendering?: boolean;
}

/**
 * OptimizedStreamingMessage - A component that renders markdown during streaming
 * with minimal batching for better user experience
 */
export default function OptimizedStreamingMessage({ 
  content, 
  isStreaming, 
  immediateMdRendering = true // Default to immediate rendering for better UX
}: OptimizedStreamingMessageProps) {
  // Store the rendered content separately from the raw incoming content
  const [renderedContent, setRenderedContent] = useState('');
  const pendingContentRef = useRef('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use an updatePending ref to track if we have pending updates
  const updatePendingRef = useRef(false);
  
  // Track streaming frequency for adaptive rendering
  const [isHighFrequency, setIsHighFrequency] = useState(false);
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  // Clear any existing timers when unmounting
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Update rendered content during streaming
  useEffect(() => {
    // If immediate rendering is enabled, update the content immediately
    if (immediateMdRendering && isStreaming && content && content !== renderedContent) {
      setRenderedContent(content);
      return;
    }
    
    // Otherwise use minimal batching for performance
    if (isStreaming && content && content !== pendingContentRef.current) {
      // Store the latest content
      pendingContentRef.current = content;
      
      // Update timestamp for analytics
      lastUpdateTimeRef.current = Date.now();
      
      // Very minimal batching to prevent excessive rendering
      if (!updatePendingRef.current) {
        updatePendingRef.current = true;
        
        // Use a very short delay for minimal batching
        const minimalDelay = 20; // Even shorter delay for better responsiveness
        
        timerRef.current = setTimeout(() => {
          // Apply the pending content update
          setRenderedContent(pendingContentRef.current);
          updatePendingRef.current = false;
        }, minimalDelay);
      }
    } else if (!isStreaming && content !== renderedContent) {
      // When streaming stops, ensure we show the final content
      setRenderedContent(content);
      updateCountRef.current = 0;
      setIsHighFrequency(false);
    }
  }, [content, isStreaming, renderedContent, isHighFrequency, immediateMdRendering]);
  
  // Immediately update content for the first tokens to show instant feedback
  useEffect(() => {
    if (isStreaming && content && renderedContent === '') {
      setRenderedContent(content);
    }
  }, [isStreaming, content, renderedContent]);

  // Use RealtimeThinkTagProcessor for immediate rendering of <think> tags during streaming
  // and normal markdown rendering for regular content
  return (
    <div className="w-full">
      <div className="markdown-preview overflow-hidden break-words">
        <RealtimeThinkTagProcessor 
          content={renderedContent} 
          isStreaming={isStreaming} 
        />
        {isStreaming && <span className="animate-pulse">▌</span>}
      </div>
    </div>
  );
}
