import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert on the X (Twitter) API v2 search operators. Given a user's intent in Arabic or English, draft a single valid search query using proper operators, then briefly explain it in Arabic.

Available operators you MUST use correctly:
- Keywords: bare words = AND, OR between words = OR, "phrase" = exact, -word = exclude
- Accounts: from:username, to:username, @username, retweets_of:username
- Tweet types: is:retweet, is:reply, is:quote, is:verified (and negations with -)
- Media: has:media, has:images, has:video_link, has:links, has:hashtags, has:mentions, has:geo
- Language: lang:xx (ISO 639-1, e.g. lang:ar for Arabic)
- Location: place:name, place_country:XX, point_radius:[lon lat radius_km], bounding_box:[w s e n]
- Engagement: conversation_id:ID, context:domain.entity, entity:"name"
- URLs: url:"domain.com"
- Hashtags/cashtags: #hashtag, $SYMBOL
- Grouping: use ( ) around OR groups

CRITICAL — OPERATORS THAT DO NOT EXIST IN X API v2 (never emit them):
- since:YYYY-MM-DD ❌ (v1.1 only)
- until:YYYY-MM-DD ❌ (v1.1 only)
- since_id: ❌
- until_id: ❌
- filter:* ❌ (old v1.1 syntax)

If the user wants a date range, DO NOT put it in the query string. Instead:
- Return the query WITHOUT any date operator
- Include the range as ISO-8601 timestamps in a "start_time" and/or "end_time" field of your JSON response
- The client UI will use those to populate separate API parameters

RULES:
1. Return ONLY valid JSON — no markdown, no prose outside JSON
2. Schema: { "query": "...", "explanation": "...", "tips": ["...", "..."], "start_time": "ISO8601 or null", "end_time": "ISO8601 or null" }
3. query: the actual X search query string (LTR). NEVER include since:/until:/filter: operators
4. explanation: 1-2 short Arabic sentences explaining what this query does AND mentioning the date range if set
5. tips: array of 1-3 optional short Arabic tips for refining the query
6. start_time/end_time: ISO-8601 UTC strings (e.g. "2023-04-01T00:00:00Z") or null if not applicable
7. Prefer -is:retweet by default for cleaner results unless user wants retweets
8. Keep queries concise — don't over-engineer
9. If intent is ambiguous, make a reasonable assumption and mention it in tips
10. If user says "last N days/weeks/months" compute start_time from now (assume today)`;

// Strip operators that don't exist in X API v2 (since:, until:, filter:, etc.)
// so the search endpoint doesn't return HTTP 400.
function sanitizeQuery(q) {
  if (!q) return "";
  return q
    .replace(/\b(since|until|since_id|until_id)\s*:\s*\S+/gi, "")
    .replace(/\bfilter\s*:\s*\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Pull since:/until: dates out of a query so we can forward them
// as start_time / end_time instead.
function extractDateOperators(q) {
  if (!q) return { start_time: null, end_time: null };
  const sinceMatch = q.match(/\bsince\s*:\s*(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/i);
  const untilMatch = q.match(/\buntil\s*:\s*(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?)/i);
  const toIso = (s) => {
    if (!s) return null;
    const normalized = s.includes("T") ? s : `${s}T00:00:00Z`;
    const d = new Date(normalized);
    return isNaN(d) ? null : d.toISOString();
  };
  return {
    start_time: toIso(sinceMatch?.[1]),
    end_time: toIso(untilMatch?.[1]),
  };
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "لم يتم ضبط مفتاح OpenAI على الخادم.", code: "NO_OPENAI_KEY" },
      { status: 500 }
    );
  }

  let intent;
  try {
    const body = await request.json();
    intent = (body?.intent || "").trim();
  } catch {
    return NextResponse.json(
      { error: "طلب غير صالح.", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!intent) {
    return NextResponse.json(
      { error: "اكتب ما تريد البحث عنه أولًا.", code: "EMPTY_INTENT" },
      { status: 400 }
    );
  }
  if (intent.length > 500) {
    return NextResponse.json(
      { error: "الطلب طويل جدًا. اختصره إلى أقل من 500 حرف.", code: "TOO_LONG" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: intent },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const status = res.status;
      let errMsg = "فشل الاتصال بـ OpenAI.";
      if (status === 401) errMsg = "مفتاح OpenAI غير صالح.";
      else if (status === 429) errMsg = "تم تجاوز حد الطلبات. انتظر قليلًا وأعد المحاولة.";
      else if (status >= 500) errMsg = "خدمة OpenAI غير متاحة حاليًا.";
      return NextResponse.json(
        { error: errMsg, code: `OPENAI_${status}`, detail: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "لم يُرجع النموذج إجابة.", code: "EMPTY_RESPONSE" },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "تعذّر قراءة إجابة النموذج.", code: "PARSE_ERROR", raw: content.slice(0, 300) },
        { status: 502 }
      );
    }

    if (!parsed.query) {
      return NextResponse.json(
        { error: "لم يتمكن النموذج من صياغة استعلام.", code: "NO_QUERY" },
        { status: 502 }
      );
    }

    // Rescue any since:/until: dates the model left in the query
    // so the user doesn't lose the intent when we strip them.
    const rescued = extractDateOperators(parsed.query);
    const cleanQuery = sanitizeQuery(parsed.query);

    return NextResponse.json({
      query: cleanQuery,
      explanation: parsed.explanation || "",
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
      start_time: parsed.start_time || rescued.start_time || null,
      end_time: parsed.end_time || rescued.end_time || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "خطأ في الشبكة.", code: "NETWORK_ERROR" },
      { status: 500 }
    );
  }
}
