import { NextRequest, NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ContentItem from "@/models/ContentItem";

type ContentType = "CAPTION" | "HASHTAGS" | "AD_COPY" | "CTA" | "HOOK";

interface GenerateContentBody {
  type: ContentType;
  platform: string;
  topic: string;
  tone?: string;
  clientId?: string;
  saveToBank?: boolean;
}

function buildPrompt(
  type: ContentType,
  platform: string,
  topic: string,
  tone?: string,
): string {
  const toneStr = tone ? ` The tone should be ${tone.toLowerCase()}.` : "";
  const platformStr = platform ? ` optimized for ${platform}` : "";

  const typeInstructions: Record<ContentType, string> = {
    CAPTION: `Write a compelling social media caption${platformStr} about: ${topic}.${toneStr} Keep it engaging and include a call to action. Return only the caption text, no additional explanation.`,
    HASHTAGS: `Generate 15–20 relevant hashtags${platformStr} for the following topic: ${topic}.${toneStr} Include a mix of popular and niche hashtags. Return only the hashtags separated by spaces, starting each with #.`,
    AD_COPY: `Write persuasive advertising copy${platformStr} for: ${topic}.${toneStr} Include a headline, body copy (2–3 sentences), and a clear call to action. Return only the ad copy text.`,
    CTA: `Write 5 compelling call-to-action phrases${platformStr} for: ${topic}.${toneStr} Make them action-oriented and conversion-focused. Return only the CTAs, one per line.`,
    HOOK: `Write 5 attention-grabbing opening hooks${platformStr} for content about: ${topic}.${toneStr} These should stop the scroll and make people want to read more. Return only the hooks, one per line.`,
  };

  return typeInstructions[type];
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text: string }>;
  };
  const block = data.content?.find((b) => b.type === "text");
  if (!block) throw new Error("No text content in Anthropic response");
  return block.text.trim();
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message: { content: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");
  return content.trim();
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUserFromRequest(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    return NextResponse.json(
      { error: "AI not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY." },
      { status: 503 },
    );
  }

  let body: GenerateContentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, platform, topic, tone, clientId, saveToBank } = body;

  const validTypes: ContentType[] = [
    "CAPTION",
    "HASHTAGS",
    "AD_COPY",
    "CTA",
    "HOOK",
  ];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "type must be one of: CAPTION, HASHTAGS, AD_COPY, CTA, HOOK" },
      { status: 400 },
    );
  }
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  if (!platform || typeof platform !== "string") {
    return NextResponse.json(
      { error: "platform is required" },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(type, platform, topic.trim(), tone);

  let content: string;
  try {
    if (anthropicKey) {
      content = await callAnthropic(prompt, anthropicKey);
    } else {
      content = await callOpenAI(prompt, openaiKey!);
    }
  } catch (err) {
    console.error("[ai/generate-content] Generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI generation failed" },
      { status: 500 },
    );
  }

  // Optionally save to content bank
  if (saveToBank && clientId) {
    try {
      await dbConnect();
      const titleParts = [
        type.toLowerCase().replace("_", " "),
        platform,
        topic.slice(0, 40),
      ];
      const title = titleParts.filter(Boolean).join(" — ");
      await ContentItem.create({
        clientId,
        title,
        content,
        platform,
        category: type,
        source: "AI",
        status: "DRAFT",
        createdBy: null,
      });
    } catch (err) {
      // Non-fatal: log but don't fail the request
      console.error(
        "[ai/generate-content] Failed to save to content bank:",
        err,
      );
    }
  }

  return NextResponse.json({ content, type, platform });
}
