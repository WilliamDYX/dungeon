// main.ts - Shadow Dungeon for Deno Deploy（最小可行版本）
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

function getContentType(filePath: string): string {
  const dotIndex = filePath.lastIndexOf(".");
  if (dotIndex === -1) return "application/octet-stream";
  const ext = filePath.slice(dotIndex).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

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
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API: AI 对话代理
    if (pathname === "/api/chat" && req.method === "POST") {
      let payload: { messages?: unknown[] };
      try {
        const bodyText = await req.text();
        payload = JSON.parse(bodyText || "{}");
      } catch {
        return new Response(
          JSON.stringify({ error: true, msg: "请求体无效" }),
          { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
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

    // 静态文件托管 - 使用更安全的方式
    let fp = pathname === "/" ? "/roguelike.html" : pathname;
    
    // 防止路径穿越
    while (fp.includes("..")) {
      fp = fp.replace(/\/\.\.\/?/g, "/");
    }
    
    // 使用 Deno.readFile 代替 Deno.open，更稳定
    try {
      const content = await Deno.readFile(`.${fp}`);
      const contentType = getContentType(fp);
      return new Response(content, {
        headers: { "Content-Type": contentType },
      });
    } catch {
      // 如果文件不存在，返回 404
      return new Response(`404 Not Found: ${pathname}`, {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  } catch (error) {
    // 全局兜底：任何未捕获的异常都返回 500
    console.error("Unhandled error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
};

// 启动服务
serve(handler);
console.log("Shadow Dungeon 已启动（Deno Deploy 模式）");
