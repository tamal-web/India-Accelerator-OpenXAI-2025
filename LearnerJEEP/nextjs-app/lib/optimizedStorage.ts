import { UIMessage as msg } from "ai";
import { chatDB, ChatMessage3, MSG3, msgDB } from "./db3";

// Create a message cache to avoid repeated database lookups
const messageCache = new Map<string, undefined[]>();
const modelCache = new Map<string, string>();

// Function to load messages in chunks with pagination
export async function loadMessagesPaginated(
  chatId: string | undefined, 
  page: number = 0, 
  pageSize: number = 20
): Promise<{ messages: undefined[], hasMore: boolean }> {
  if (!chatId) return { messages: [], hasMore: false };
  
  // Check cache first
  const cacheKey = `${chatId}-${page}-${pageSize}`;
  if (messageCache.has(cacheKey)) {
    return { 
      messages: messageCache.get(cacheKey) || [],
      hasMore: (await countRemainingMessages(chatId, page, pageSize)) > 0
    };
  }
  
  try {
    // Use offset-based pagination
    const offset = page * pageSize;
    
    // Query with pagination and sorting
    const chatMsgs = await msgDB.msgs3
      .where("chatId")
      .equals(chatId)
      .sortBy("createdAt"); // Ensure consistent ordering
    
    // Apply pagination in memory (Dexie doesn't support LIMIT/OFFSET directly)
    const paginatedMsgs = chatMsgs.slice(offset, offset + pageSize);
    
    // Convert to message format
    const msgs = paginatedMsgs.map(dbMsg => ({
      id: dbMsg.MsgId,
      role: dbMsg.role,
      content: dbMsg.content,
      createdAt: dbMsg.createdAt,
    }));
    
    // Cache the result
    messageCache.set(cacheKey, msgs);
    
    // Cache models for each message to avoid individual lookups
    paginatedMsgs.forEach(msg => {
      if (msg.model) {
        modelCache.set(msg.MsgId, msg.model);
      }
    });
    
    // Return messages with flag indicating if there are more messages
    return { 
      messages: msgs, 
      hasMore: chatMsgs.length > offset + pageSize 
    };
  } catch (error) {
    console.error("Error loading paginated messages:", error);
    return { messages: [], hasMore: false };
  }
}

// Count remaining messages for pagination
async function countRemainingMessages(
  chatId: string, 
  currentPage: number, 
  pageSize: number
): Promise<number> {
  try {
    const totalCount = await msgDB.msgs3
      .where("chatId")
      .equals(chatId)
      .count();
    
    const viewed = (currentPage + 1) * pageSize;
    return Math.max(0, totalCount - viewed);
  } catch (error) {
    console.error("Error counting messages:", error);
    return 0;
  }
}

// Load all messages (fallback for compatibility)
export async function loadMessages3(chatId: string | undefined): Promise<undefined[]> {
  if (!chatId) return [];
  
  // Check cache first
  const cacheKey = `${chatId}-all`;
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey) || [];
  }
  
  try {
    // If the chat has too many messages, consider loading only the most recent ones
    const messageCount = await msgDB.msgs3
      .where("chatId")
      .equals(chatId)
      .count();
    
    let chat;
    if (messageCount > 100) {
      // For very large chats, load messages in batches
      // This is just a fallback - ideally use the paginated function instead
      console.warn("Loading large chat with", messageCount, "messages. Consider using pagination.");
      
      // Get the most recent 100 messages
      chat = await msgDB.msgs3
        .where("chatId")
        .equals(chatId)
        .sortBy("createdAt");
      
      chat = chat.slice(-100);
    } else {
      chat = await msgDB.msgs3
        .where("chatId")
        .equals(chatId)
        .toArray();
    }
    
    // Convert to message format
    const msgs = chat.map(msg => ({
      id: msg.MsgId,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    }));
    
    // Cache the results
    messageCache.set(cacheKey, msgs);
    
    // Cache models for each message
    chat.forEach(msg => {
      if (msg.model) {
        modelCache.set(msg.MsgId, msg.model);
      }
    });
    
    return msgs;
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
}

// Function to get model info without triggering a separate DB query
export async function getModelForMessage(messageId: string): Promise<string> {
  // Check cache first
  if (modelCache.has(messageId)) {
    return modelCache.get(messageId) || "";
  }
  
  try {
    // Fetch from DB if not in cache
    const msg = await msgDB.msgs3.get(messageId);
    const model = msg?.model || "";
    
    // Cache the result
    modelCache.set(messageId, model);
    
    return model;
  } catch (error) {
    console.error("Error fetching model:", error);
    return "";
  }
}

// Clear cache for a specific chat
export function clearChatCache(chatId: string): void {
  for (const key of messageCache.keys()) {
    if (key.startsWith(chatId)) {
      messageCache.delete(key);
    }
  }
}

// Optimized function to save messages in a non-blocking way
export async function saveRequestWithResponse3(
  chatId: string, 
  request: undefined, 
  response: undefined, 
  modelName: string | null
): Promise<void> {
  const RequestMSG: MSG3 = {
    MsgId: request.id,
    chatId: chatId,
    role: request.role,
    createdAt: request.createdAt!,
    model: null,
    content: request.content,
  };
  
  const ResponseMSG: MSG3 = {
    MsgId: response.id,
    chatId: chatId,
    role: response.role,
    createdAt: response.createdAt!,
    model: modelName,
    content: response.content,
  };

  try {
    // Check if chat exists using a cached approach
    const chatExists = await chatDB.chats3.get(chatId);
    
    if (chatExists) {
      // Update cache before DB to improve perceived performance
      const cacheKey = `${chatId}-all`;
      if (messageCache.has(cacheKey)) {
        const cachedMessages = messageCache.get(cacheKey) || [];
        messageCache.set(cacheKey, [
          ...cachedMessages,
          {
            id: request.id,
            role: request.role,
            content: request.content,
            createdAt: request.createdAt
          },
          {
            id: response.id,
            role: response.role,
            content: response.content,
            createdAt: response.createdAt
          }
        ]);
      }
      
      // Use a web worker or requestIdleCallback to save in background
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          msgDB.msgs3.bulkAdd([RequestMSG, ResponseMSG])
            .catch(error => console.error("Error saving messages:", error));
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          msgDB.msgs3.bulkAdd([RequestMSG, ResponseMSG])
            .catch(error => console.error("Error saving messages:", error));
        }, 0);
      }
    } else {
      // If chat doesn't exist, create it with default title
      const newChat: ChatMessage3 = {
        chatId,
        title: "New Chat",
        createdAt: new Date(),
        pinned: false,
      };
      
      // Create chat and add messages
      await chatDB.chats3.add(newChat);
      await msgDB.msgs3.bulkAdd([RequestMSG, ResponseMSG]);
      
      // Generate a title in the background
      setTimeout(() => {
        generateChatTitle(chatId, request, response, modelName)
          .catch(error => console.error("Error generating title:", error));
      }, 100);
    }
  } catch (error) {
    console.error("Error in saveRequestWithResponse3:", error);
    
    // Fallback: Try to save messages even if there was an error
    try {
      await msgDB.msgs3.bulkAdd([RequestMSG, ResponseMSG]);
    } catch (fallbackError) {
      console.error("Fallback save also failed:", fallbackError);
    }
  }
}

// Function to generate chat title in the background
async function generateChatTitle(
  chatId: string,
  request: undefined,
  response: undefined,
  modelName: string | null
): Promise<void> {
  try {
    const title = await fetch("/api/title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [request, response],
        model: modelName || "mistral-7b-instruct-v0.3"
      }),
    }).then(res => res.text());
    
    // Update chat title
    await chatDB.chats3.update(chatId, { title });
  } catch (error) {
    console.error("Error generating title:", error);
    
    // Use a simple title based on the first message if API fails
    const fallbackTitle = request.content.substring(0, 30) + 
      (request.content.length > 30 ? "..." : "");
    
    await chatDB.chats3.update(chatId, { title: fallbackTitle });
  }
}

// New chat creation with optimized background processing
export async function newChatRequestWithResponse3(
  chatId: string,
  request: undefined,
  response: undefined,
  modelName: string | null
): Promise<void> {
  const RequestMSG: MSG3 = {
    MsgId: request.id,
    chatId: chatId,
    role: request.role,
    createdAt: request.createdAt!,
    model: null,
    content: request.content,
  };
  
  const ResponseMSG: MSG3 = {
    MsgId: response.id,
    chatId: chatId,
    role: response.role,
    createdAt: response.createdAt!,
    model: modelName,
    content: response.content,
  };
  
  // Create chat first with temporary title
  const tempTitle = request.content.substring(0, 30) + 
    (request.content.length > 30 ? "..." : "");
  
  const newChatObj: ChatMessage3 = {
    chatId: chatId,
    title: tempTitle,
    createdAt: new Date(),
    pinned: false,
  };
  
  try {
    // Save chat and messages
    await chatDB.chats3.add(newChatObj);
    await msgDB.msgs3.bulkAdd([RequestMSG, ResponseMSG]);
    
    // Update cache
    const cacheKey = `${chatId}-all`;
    messageCache.set(cacheKey, [
      {
        id: request.id,
        role: request.role,
        content: request.content,
        createdAt: request.createdAt
      },
      {
        id: response.id,
        role: response.role,
        content: response.content,
        createdAt: response.createdAt
      }
    ]);
    
    // Generate title in background
    setTimeout(() => {
      generateChatTitle(chatId, request, response, modelName)
        .catch(error => console.error("Error generating title:", error));
    }, 100);
  } catch (error) {
    console.error("Error in newChatRequestWithResponse3:", error);
    throw error;
  }
}
