// main.ts - Shadow Dungeon for Deno Deploy
// 替换原来的 server.js，直接部署到 Deno Deploy

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// AI 配置
const AI_API = "https://token.sensenova.cn/v1/chat/completions";
const AI_MODEL = "deepseek-v4-flash";
const AI_KEY = "sk-5UQHaMXsotPetObMiF3Z6GHOs1Kf4t1X";

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

// 读取请求体
async function readBody(req: Request): Promise<string> {
  const text = await req.text();
  return text;
}

// 代理调用 AI（用 fetch 代替 https.request）
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

// 获取 Content-Type
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || "application/octet-stream";
}

// 使用 Deno 的 path 模块
import { extname as _extname, join, normalize, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
const path = { extname: _extname, join, normalize, resolve };

// 主处理函数
const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // API: AI 对话代理
  if (pathname === "/api/chat" && req.method === "POST") {
    let payload: { messages?: unknown[] };
    try {
      payload = JSON.parse(await readBody(req) || "{}");
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

  // 静态文件托管
  let fp = pathname === "/" ? "/roguelike.html" : pathname;
  // 防止路径穿越
  fp = path.normalize(fp).replace(/^(\.\.[/\\])+/, "");
  const abs = path.join(Deno.cwd(), fp);

  try {
    const file = await Deno.open(abs, { read: true });
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

// 启动服务
serve(handler);

console.log("Shadow Dungeon 已启动（Deno Deploy 模式）");
