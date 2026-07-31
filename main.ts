// ============================================================
// Shadow Dungeon — Deno Deploy 版（修复静态文件路径）
// ============================================================

const AI_API = "https://token.sensenova.cn/v1/chat/completions";
const AI_MODEL = "deepseek-v4-flash";
const AI_KEY = Deno.env.get("AI_KEY") ?? "";

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

// ---------- 静态文件服务 (已修复) ----------

async function serveStatic(pathname: string): Promise<Response> {
  // 1. 确定文件路径
  let filePath = pathname === "/" ? "/roguelike.html" : pathname;

  // 2. 安全检查：防止路径遍历攻击
  if (filePath.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    // 3. 核心修复：使用 Deno.open 读取文件
    // 这种方式在 Deno Deploy 上最可靠，直接以项目根目录为基准查找文件
    const file = await Deno.open(`.${filePath}`);
    
    // 4. 根据文件后缀名设置正确的 Content-Type
    const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    return new Response(file.readable, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (e) {
    // 5. 如果文件不存在或读取出错，返回 404
    return new Response(`404 Not Found: ${pathname}`, {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
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

  // 其余全部走静态文件服务
  return serveStatic(pathname);
};

// ---------- 启动 ----------

Deno.serve(handler);
