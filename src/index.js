export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === "OPTIONS") {
      return corsResponse("");
    }

    // Chat endpoint
    if (url.pathname === "/chat" && request.method === "POST") {
      const { message } = await request.json();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: env.SYSTEM_PROMPT || "You are a helpful support assistant.",
          messages: [{ role: "user", content: message }],
        }),
      });

      const data = await response.json();
      const reply = data.content[0].text;

      return corsResponse(JSON.stringify({ reply }), "application/json");
    }

    // Serve the chat widget UI
    if (url.pathname === "/" || url.pathname === "/widget") {
      return new Response(getWidget(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

function corsResponse(body, contentType = "text/plain") {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getWidget() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Repo Mind — AI Support</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; }
    #chat-box { background: white; width: 380px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); display: flex; flex-direction: column; overflow: hidden; height: 520px; }
    #chat-header { background: #1a1a2e; color: white; padding: 16px 20px; font-size: 16px; font-weight: 600; }
    #chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .msg { padding: 10px 14px; border-radius: 12px; max-width: 80%; font-size: 14px; line-height: 1.5; }
    .msg.user { background: #1a1a2e; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .msg.bot { background: #f0f0f0; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; }
    #chat-input-area { display: flex; padding: 12px; border-top: 1px solid #eee; gap: 8px; }
    #chat-input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; font-size: 14px; outline: none; }
    #send-btn { background: #1a1a2e; color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px; }
    #send-btn:hover { background: #16213e; }
  </style>
</head>
<body>
  <div id="chat-box">
    <div id="chat-header">🤖 Repo Mind Support</div>
    <div id="chat-messages">
      <div class="msg bot">Hi! How can I help you today?</div>
    </div>
    <div id="chat-input-area">
      <input id="chat-input" type="text" placeholder="Type your message..." />
      <button id="send-btn">Send</button>
    </div>
  </div>
  <script>
    const messages = document.getElementById("chat-messages");
    const input = document.getElementById("chat-input");
    const btn = document.getElementById("send-btn");

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";

      messages.innerHTML += \`<div class="msg user">\${text}</div>\`;
      messages.innerHTML += \`<div class="msg bot" id="typing">Thinking...</div>\`;
      messages.scrollTop = messages.scrollHeight;

      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      document.getElementById("typing").remove();
      messages.innerHTML += \`<div class="msg bot">\${data.reply}</div>\`;
      messages.scrollTop = messages.scrollHeight;
    }

    btn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
  </script>
</body>
</html>`;
}
