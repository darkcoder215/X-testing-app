/**
 * /api/extract — Full-archive tweet search with pagination
 *
 * POST /api/extract
 * Body: { query, start_time?, end_time?, max_results?, next_token? }
 *
 * Uses /2/tweets/search/all (Academic/Pro access) with fallback to
 * /2/tweets/search/recent for basic access.
 *
 * Returns one page of results at a time. The client handles
 * pagination by sending next_token back.
 */

import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/x-client";

const BASE_URL = "https://api.x.com";

const TWEET_FIELDS = "author_id,created_at,public_metrics,entities,lang,source,conversation_id,in_reply_to_user_id,referenced_tweets,reply_settings,possibly_sensitive,geo";
const USER_FIELDS = "name,username,profile_image_url,verified,verified_type,public_metrics,description,location,created_at";
const EXPANSIONS = "author_id,referenced_tweets.id,referenced_tweets.id.author_id,attachments.media_keys,entities.mentions.username";
const MEDIA_FIELDS = "url,preview_image_url,type,width,height,alt_text";

export async function POST(request) {
  const startTime = Date.now();

  try {
    const bearerToken = getTokenFromRequest(request);
    if (!bearerToken) {
      return NextResponse.json(
        { error: "لم تتم إضافة مفتاح الوصول بعد.", code: "AUTH_NOT_CONFIGURED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, start_time, end_time, max_results = 100, next_token, use_recent = false } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "أدخل نص البحث.", code: "MISSING_QUERY" },
        { status: 400 }
      );
    }

    // Try full archive first, fall back to recent
    const endpoint = use_recent ? "/2/tweets/search/recent" : "/2/tweets/search/all";
    const url = new URL(`${BASE_URL}${endpoint}`);

    url.searchParams.set("query", query);
    url.searchParams.set("max_results", String(Math.min(Math.max(10, max_results), 500)));
    url.searchParams.set("tweet.fields", TWEET_FIELDS);
    url.searchParams.set("user.fields", USER_FIELDS);
    url.searchParams.set("expansions", EXPANSIONS);
    url.searchParams.set("media.fields", MEDIA_FIELDS);

    if (start_time) url.searchParams.set("start_time", start_time);
    if (end_time) url.searchParams.set("end_time", end_time);
    if (next_token) url.searchParams.set("next_token", next_token);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "User-Agent": "x-data-extractor/1.0.0",
      },
    });

    const elapsed = Date.now() - startTime;
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    // Extract rate limit info
    const rateLimit = {
      limit: response.headers.get("x-rate-limit-limit"),
      remaining: response.headers.get("x-rate-limit-remaining"),
      reset: response.headers.get("x-rate-limit-reset"),
    };

    // If full archive returns 403, suggest falling back to recent
    if (response.status === 403 && !use_recent) {
      return NextResponse.json({
        error: "ليس لديك صلاحية البحث في الأرشيف الكامل. جارٍ الانتقال للبحث في آخر 7 أيام.",
        code: "FALLBACK_TO_RECENT",
        fallback: true,
        elapsed,
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        error: data?.detail || data?.errors?.[0]?.message || `خطأ HTTP ${response.status}`,
        code: `HTTP_${response.status}`,
        status: response.status,
        rateLimit,
        elapsed,
      });
    }

    return NextResponse.json({
      data: data?.data || [],
      includes: data?.includes || {},
      meta: data?.meta || {},
      rateLimit,
      elapsed,
      endpoint,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message, code: "REQUEST_FAILED", elapsed: Date.now() - startTime },
      { status: 500 }
    );
  }
}
