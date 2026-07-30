// main.ts - Shadow Dungeon for Deno Deploy
// 替换原来的 server.js，直接部署到 Deno Deploy

import { serve } from "https://deno.land/std@0.210.0/http/server.ts";

// AI 配置
const AI_API = "https://token.sensenova.cn/v1/chat/completions";
const AI_MODEL = "deepseek-v4-flash";
const AI_KEY = Deno.env.get("AI_KEY");

// MIME 类型映射
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// 获取 Content-Type（修复：不再依赖未定义的 path 变量）
function getContentType(filePath: string): string {
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return "application/octet-stream";
  const ext = filePath.slice(dotIndex).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

// 代理调用 AI
async function proxyChat(messages: unknown[]) {
  try {
    const response = await fetch(AI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { error: true, msg: `AI 返回 HTTP ${response.status}: ${text.slice(0, 200)}` };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      return { error: true, msg: "AI 返回格式异常" };
    }
    return { error: false, text };
  } catch (e) {
    return { error: true, msg: `网络错误: ${e.message}` };
  }
}

// 主处理函数 
const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // API: AI 对话代理
  if (pathname === "/api/chat" && req.method === "POST") {
    let payload: { messages?: unknown[] };
    try {
  // 先检查文件是否存在，避免 Deno.open 抛出非文件不存在的异常
  try {
  // 先检查文件是否存在，避免 Deno.open 抛出非文件不存在的异常
  try {
    const stat = await Deno.stat(`.${fp}`);
    if (!stat.isFile) {
      throw new Error("Not a file");
    }
  } catch {
    return new Response(`404 Not Found: ${pathname}`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  
  const file = await Deno.open(`.${fp}`, { read: true });
  const contentType = getContentType(fp);
  return new Response(file.readable, {
    headers: { "Content-Type": contentType },
  });
} catch (error) {
  // 兜底：任何意外错误都返回 500，保证服务不崩溃
  console.error("Static file error:", error);
  return new Response("Internal Server Error", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
  
  const file = await Deno.open(`.${fp}`, { read: true });
  const contentType = getContentType(fp);
  return new Response(file.readable, {
    headers: { "Content-Type": contentType },
  });
} catch (error) {
  // 兜底：任何意外错误都返回 500，保证服务不崩溃
  console.error("Static file error:", error);
  return new Response("Internal Server Error", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: true, msg: "缺少 messages" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const result = await proxyChat(payload.messages);
    const status = result.error ? 502 : 200;
    return new Response(
      JSON.stringify(result),
      { status, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  // 静态文件托管
  let fp = pathname === "/" ? "/roguelike.html" : pathname;
  
  // 防止路径穿越（简化版，不依赖 path 模块）
  while (fp.includes("..")) {
    fp = fp.replace(/\/\.\.\/?/g, "/");
  }
  
  try {
    const file = await Deno.open(`.${fp}`, { read: true });
    const contentType = getContentType(fp);
    return new Response(file.readable, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response(`404 Not Found: ${pathname}`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
};

// 启动服务（不指定端口和 hostname，让 Deno Deploy 自动处理）
serve(handler);

console.log("Shadow Dungeon 已启动（Deno Deploy 模式）");
