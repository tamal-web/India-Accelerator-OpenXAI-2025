/* Web Worker for markdown processing */

// Handle messages from main thread
self.onmessage = async (event) => {
  const { id, content, type } = event.data;
  
  if (type === 'process') {
    try {
      // Process in chunks if content is large
      const processedContent = processMarkdown(content);
      
      // Send the result back to the main thread
      self.postMessage({ id, processedContent, success: true });
    } catch (error) {
      // Properly typed error handling
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      
      self.postMessage({ 
        id, 
        processedContent: `Error processing markdown: ${errorMessage}`, 
        success: false 
      });
    }
  }
};

// Simple markdown processing - in a real implementation, you would 
// import a markdown library here or implement more sophisticated parsing
function processMarkdown(content: string): string {
  // This is a simplified example
  // Replace code blocks with placeholder
  const processedContent = content
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .split('\n').map(line => {
      if (line.startsWith('# ')) {
        return `<h1>${line.slice(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        return `<h2>${line.slice(3)}</h2>`;
      } else if (line.startsWith('### ')) {
        return `<h3>${line.slice(4)}</h3>`;
      } else if (line.trim() === '') {
        return '<br/>';
      }
      return `<p>${line}</p>`;
    }).join('');

  return processedContent;
}
