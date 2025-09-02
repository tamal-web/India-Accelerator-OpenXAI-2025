![Alt text](/LearnerJEEP/nextjs-app/public/lj.png)
# LearnerJEEP

An AI-powered learning app that builds interactive roadmaps and mind maps tailored to what you want to learn. Explore each topic through visuals, earn points as you progress, and test your knowledge with quizzes and projects.<br><br>
**LearnerJEEP**- a Next.js + Node.js app that talks to a locally-hosted AI model running on **Ollama**.
This README keeps setup short and easy - get the app running in a few steps, and learn how to point it at your local Ollama instance.

---

# Quick setup (super short)

1. **Clone the repo**

   ```bash
   git clone https://github.com/<your-org>/India-Accelerator-OpenXAI-2025.git
   cd India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app
   ```

2. **Edit the API files** — update the `baseURL` to the address/port where Ollama is reachable (see example below). Files to edit:

   * `app/api/chat/stream/route.ts`
   * `app/api/chat/mindmap/route.ts`
   * `app/api/chat/roadmap/route.ts`
   * `app/api/title/route.ts`
   * `app/api/model/route.ts`

   Replace the `createOpenAI` block in each file:

   ```ts
   const openaiProvider = createOpenAI({
     apiKey: "lmstudio",
     baseURL: "http://127.0.0.1:11434/v1", // <- change this to your Ollama host:port
   });
   ```

   > Common local default: `http://127.0.0.1:11434/v1` (but use whatever host/port you have).

3. **Start the AI model in Ollama**

   ```bash
   # make sure the model is available and running:
   ollama pull llama3       # only if you need to download it
   ollama run llama3
   ```

   (If you run a different model, use its name instead of `llama3`.)

4. **Install and run the app**

   ```bash
   npm i
   npm run dev
   ```

   Open `http://localhost:3000`.

---

# If something fails (short troubleshooting)

* **“ai model not found”** — check and match model names:

  * In your route files you might see code like:

    ```ts
    openaiProvider.chat(modelName || "some_other_model_name")
    ```

    Make sure the name (`modelName` or the fallback) matches the model you started with `ollama run <model>`. You can also hardcode the correct name:

    ```ts
    openaiProvider.chat("llama3")
    ```
  * Verify installed models with:

    ```bash
    ollama list
    ```

* **Ollama unreachable / connection refused** — verify Ollama is running and your `baseURL` host + port are correct. Quick test:

  ```bash
  curl -s -X POST 'http://127.0.0.1:11434/v1/chat/completions' \
    -H 'Content-Type: application/json' \
    -d '{"model":"llama3","messages":[{"role":"user","content":"hello"}]}'
  ```

  If connection fails, ensure Ollama is running and bound to that address.

* **Dependency warnings or errors** — try:

  ```bash
  npm audit fix --force   # optional: only if you get dependency issues
  ```

  (If that causes problems, revert or continue; it's usually optional for local development.)

---

# Where exactly to change the code (copy/paste)

Search for this block in each of:

```
India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app/app/api/chat/stream/route.ts
India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app/app/api/chat/mindmap/route.ts
India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app/app/api/chat/roadmap/route.ts
India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app/app/api/title/route.ts
India-Accelerator-OpenXAI-2025/LearnerJEEP/nextjs-app/app/api/model/route.ts
```

Replace:

```ts
const openaiProvider = createOpenAI({
  apiKey: "lmstudio",
  baseURL: "http://127.0.0.1:1234/v1",
});
```

with your Ollama URL, e.g.

```ts
const openaiProvider = createOpenAI({
  apiKey: "lmstudio",
  baseURL: "http://127.0.0.1:11434/v1",
});
```
