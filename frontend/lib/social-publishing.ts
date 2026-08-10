/**
 * Server-only social publishing. Environment variables are read here (not exposed to the client).
 *
 * - Status: `GET /api/social/status` → Settings (Social Media card) and Scheduled posts banner
 * - Publish: `POST /api/scheduled-posts/publish` → Scheduled posts **Publish Now** button
 * - Cron: `GET /api/cron/scheduled-posts` (Bearer CRON_SECRET) → due posts
 *
 * Instagram: first line of `content` must be a **public** image URL; remaining lines are the caption.
 * Twitter/X: requires TWITTER_ACCESS_TOKEN_SECRET for OAuth 1.0a user context.
 */
import type { IScheduledPost } from "@/models/ScheduledPost";
import { TwitterApi } from "twitter-api-v2";

export interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
  platform: string;
}

async function publishToFacebook(content: string): Promise<PublishResult> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return {
      success: false,
      platform: "facebook",
      error:
        "Facebook not configured. Set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables.",
    };
  }

  const url = `https://graph.facebook.com/${pageId}/feed`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, access_token: accessToken }),
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: { message: res.statusText } }));
    return {
      success: false,
      platform: "facebook",
      error:
        (err as { error?: { message?: string } })?.error?.message ??
        "Facebook API error",
    };
  }

  const data = (await res.json()) as { id?: string };
  return { success: true, platform: "facebook", postId: data.id };
}

/**
 * Instagram Graph API: create media container, then publish.
 * Content format: line 1 = public image URL; following lines = caption.
 */
async function publishToInstagram(content: string): Promise<PublishResult> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igUserId) {
    return {
      success: false,
      platform: "instagram",
      error:
        "Instagram not configured. Set FACEBOOK_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID (Instagram Business Account id from Graph API).",
    };
  }

  const lines = content
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const first = lines[0] ?? "";
  if (!/^https?:\/\//i.test(first)) {
    return {
      success: false,
      platform: "instagram",
      error:
        "Instagram requires a public image URL on the first line of the post content, then optional caption lines below.",
    };
  }

  const imageUrl = first;
  const caption = lines.slice(1).join("\n") || ".";
  const v = "v21.0";

  const mediaParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption.slice(0, 2200),
    access_token: accessToken,
  });

  const createRes = await fetch(
    `https://graph.facebook.com/${v}/${igUserId}/media?${mediaParams.toString()}`,
    { method: "POST" },
  );

  if (!createRes.ok) {
    const err = await createRes
      .json()
      .catch(() => ({ error: { message: createRes.statusText } }));
    return {
      success: false,
      platform: "instagram",
      error:
        (err as { error?: { message?: string } })?.error?.message ??
        "Instagram media creation failed",
    };
  }

  const created = (await createRes.json()) as {
    id?: string;
    error?: { message?: string };
  };
  if (!created.id) {
    return {
      success: false,
      platform: "instagram",
      error:
        created.error?.message ??
        "Instagram did not return a media container id",
    };
  }

  const publishParams = new URLSearchParams({
    creation_id: created.id,
    access_token: accessToken,
  });

  const publishRes = await fetch(
    `https://graph.facebook.com/${v}/${igUserId}/media_publish?${publishParams.toString()}`,
    { method: "POST" },
  );

  if (!publishRes.ok) {
    const err = await publishRes
      .json()
      .catch(() => ({ error: { message: publishRes.statusText } }));
    return {
      success: false,
      platform: "instagram",
      error:
        (err as { error?: { message?: string } })?.error?.message ??
        "Instagram media_publish failed",
    };
  }

  const published = (await publishRes.json()) as { id?: string };
  return { success: true, platform: "instagram", postId: published.id };
}

async function publishToLinkedIn(content: string): Promise<PublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      success: false,
      platform: "linkedin",
      error:
        "LinkedIn not configured. Set LINKEDIN_ACCESS_TOKEN environment variable.",
    };
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: "urn:li:person:me",
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    return {
      success: false,
      platform: "linkedin",
      error: (err as { message?: string })?.message ?? "LinkedIn API error",
    };
  }

  const location = res.headers.get("X-RestLi-Id") ?? undefined;
  return { success: true, platform: "linkedin", postId: location };
}

async function publishToTwitter(content: string): Promise<PublishResult> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return {
      success: false,
      platform: "twitter",
      error:
        "Twitter/X not configured. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET.",
    };
  }

  const text = content.trim().slice(0, 280);

  try {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken,
      accessSecret: accessTokenSecret,
    });
    const { data } = await client.v2.tweet(text);
    return { success: true, platform: "twitter", postId: data.id };
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "data" in e
        ? JSON.stringify((e as { data?: unknown }).data)
        : e instanceof Error
          ? e.message
          : String(e);
    return {
      success: false,
      platform: "twitter",
      error: msg || "Twitter API error",
    };
  }
}

/**
 * Publish a scheduled post to the appropriate platform.
 */
export async function publishPost(
  post: IScheduledPost,
): Promise<PublishResult> {
  const platform = (post.platform ?? "").toLowerCase();
  const content = post.content;

  if (platform === "facebook") {
    return publishToFacebook(content);
  } else if (platform === "instagram") {
    return publishToInstagram(content);
  } else if (platform === "linkedin") {
    return publishToLinkedIn(content);
  } else if (platform === "twitter" || platform === "x") {
    return publishToTwitter(content);
  } else {
    return {
      success: false,
      platform,
      error: `Unsupported platform: "${post.platform}". Supported: facebook, instagram, linkedin, twitter.`,
    };
  }
}

/**
 * Check which social platforms are configured via environment variables.
 */
export function getSocialPlatformStatus() {
  return {
    facebook: !!(
      process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID
    ),
    instagram: !!(
      process.env.FACEBOOK_ACCESS_TOKEN &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
    ),
    linkedin: !!process.env.LINKEDIN_ACCESS_TOKEN,
    twitter: !!(
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_TOKEN_SECRET
    ),
  };
}
