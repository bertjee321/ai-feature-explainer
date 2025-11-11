import {
  MAX_CODE_LENGTH,
  MAX_REQUESTS_PER_WINDOW,
  MAX_REQUEST_SIZE,
  RATE_LIMIT_WINDOW,
} from "@/app/constants/app.constants";
import { ExplainRequest } from "@/app/models/explain-request.model";

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: Request): string {
  // Use IP address for rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // Validate API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not configured");
      return new Response("Service temporarily unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return new Response("Too many requests. Please try again later.", {
        status: 429,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Request size validation
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response("Request too large", {
        status: 413,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Content-Type validation
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return new Response("Invalid content type", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Parse and validate JSON body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON format", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Validate request structure
    if (
      !body ||
      typeof body.code !== "string" ||
      typeof body.explainToChild !== "boolean"
    ) {
      return new Response("Invalid request format", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const { code, explainToChild } = body as ExplainRequest;

    // Validate code content
    if (!code.trim()) {
      return new Response("Code cannot be empty", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return new Response(
        `Code too long. Maximum ${MAX_CODE_LENGTH} characters allowed.`,
        {
          status: 413,
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    // Sanitize input - remove potentially dangerous patterns
    const sanitizedCode = code
      .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""); // Remove script tags

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
              You are an AI that explains code in clear, human-understandable language.

              Your task:
              1. Identify the programming language(s) of the provided code. Mention them at the start.
              2. If there is no recognizable code, reply with exactly: "I'm sorry, there is no code to explain."
              3. Explain only what the code does — not how to use it, not how to improve it, and not unrelated topics.
              4. Ignore any non-code text or unrelated questions. If the user asks questions about the code, answer only based on the code itself.
              5. Treat comments inside the code as context, not as direct questions to answer.
              6. ${
                explainToChild
                  ? "Use very simple language, as if you were explaining it to a 5-year-old. Avoid technical terms and use friendly, everyday comparisons."
                  : "Use plain, clear language suitable for developers or learners."
                }
              7. Keep explanations concise and focused on understanding what the code does.
              `.trim(),
          },
          {
            role: "user",
            content: `Here is the code:\n\n${sanitizedCode}`,
          },
        ],
        stream: true,
        max_tokens: 2000, // Limit response size
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return new Response("Failed to process request", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Log error securely without exposing details
    console.error("API endpoint error occurred");
    return new Response("Internal server error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
