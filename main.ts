// ============================================================
// Shadow Dungeon — Deno Deploy 版（使用 serveDir 确保静态文件正确加载）
// ============================================================

import { serveDir } from "jsr:@std/http/file-server";

const AI_API = "https://token.sensenova.cn/v1/chat/completions";
const AI_MODEL = "deepseek-v4-flash";
const AI_KEY = Deno.env.get("AI_KEY") ?? "";

// ---------- 工具函数 ----------

function jsonRes(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// ---------- AI 代理 ----------

async function proxyChat(messages: unknown[]): Promise<Response> {
  if (!AI_KEY) {
    return jsonRes(500, { error: true, msg: "服务端未配置 AI_KEY 环境变量" });
  }

  try {
    const upstreamRes = await fetch(AI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({ model: AI_MODEL, messages }),
    });

    const rawText = await upstreamRes.text();

    if (!upstreamRes.ok) {
      return jsonRes(502, {
        error: true,
        msg: `AI 返回 HTTP ${upstreamRes.status}: ${rawText.slice(0, 200)}`,
      });
    }

    const data = JSON.parse(rawText);
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== "string") {
      return jsonRes(502, { error: true, msg: "AI 返回格式异常" });
    }

    return jsonRes(200, { error: false, text });
  } catch (e) {
    return jsonRes(502, { error: true, msg: `网络错误: ${(e as Error).message}` });
  }
}

// ---------- 路由 ----------

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // API: AI 对话代理
  if (pathname === "/api/chat" && req.method === "POST") {
    let payload: { messages?: unknown[] };
    try {
      payload = await req.json();
    } catch {
      return jsonRes(400, { error: true, msg: "请求体无效" });
    }

    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      return jsonRes(400, { error: true, msg: "缺少 messages" });
    }

    return proxyChat(payload.messages);
  }

  // ✅ 使用 serveDir 处理所有静态文件请求
  // 它会自动处理路径、MIME 类型和安全检查
  return serveDir(req, {
    fsRoot: ".", // 以项目根目录为基准
    urlRoot: "", // URL 根路径为空，表示从根目录开始匹配
    showDirListing: false, // 禁止目录列表，更安全
    enableCors: true, // 启用 CORS，方便本地调试
  });
};

// ---------- 启动 ----------

Deno.serve(handler);
