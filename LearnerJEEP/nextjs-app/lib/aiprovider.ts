
// app/providers.ts
import {
    createProviderRegistry,
  } from "ai";
//   import { openai } from "@ai-sdk/openai";
  import { createOpenAI } from "@ai-sdk/openai";
  import { createAnthropic } from "@ai-sdk/anthropic";
  import { createMistral } from "@ai-sdk/mistral";    
  export const providerRegistry = createProviderRegistry({
    openai:  createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    //   baseURL: process.env.OPENAI_API_BASE_URL,
    }),
    anthropic: createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    //   baseURL: process.env.ANTHROPIC_API_BASE_URL,
    }),
    mistral: createMistral({
      apiKey: process.env.MISTRAL_API_KEY,
    //   baseURL: process.env.MISTRAL_API_BASE_URL,
    }),
    
    
  });
  
  // In your component or API route:
//   import { providerRegistry } from "./providers";
  
//   const allProviders = Object.entries(providerRegistry.providers);
//   // allProviders is [ ["openai", { client, models }], ... ]
  
//   for (const [providerName, { models }] of allProviders) {
//     console.log(providerName, models);
//     // e.g. "openai", ["gpt-4", "gpt-3.5-turbo"]
//   }
  