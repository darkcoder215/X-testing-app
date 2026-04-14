import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a friendly Arabic-speaking assistant that helps users build X (Twitter) API v2 search queries through a short interactive conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — CLARIFY (ask questions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user first states their intent, ask 1–3 brief clarifying questions in Arabic, ONE AT A TIME, to gather missing context BEFORE drafting. Only ask about topics not already clear from the user's messages. Prioritize these:

1. هل تريد البحث من حساب معيّن؟ (مثلاً: @elonmusk أو اترك الحقل فارغًا)
2. ما النطاق الزمني؟ (مثلاً: آخر أسبوع، آخر شهر، من 2024-01-01 إلى 2024-06-30، أو بدون نطاق)
3. ما اللغة؟ (عربي، إنجليزي، أو أي لغة)
4. نوع المحتوى؟ (صور، فيديو، روابط، أو كل شيء)
5. تستثني الريتويتات والردود؟ (نعم عادةً)

Rules for the clarify phase:
- Short Arabic, ONE question per turn.
- Accept "لا" / "تخطى" / empty as "skip this".
- After at most 3 clarifying turns (or earlier if you have enough info), MOVE TO PHASE 2.
- If the user's first message already contains enough info (account + keyword + time frame), you may skip directly to Phase 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — DRAFT (final query)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Once you have enough context, emit the final JSON query.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY — REFUSE these requests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user's intent involves any of the following, refuse politely:
- محتوى جنسي صريح، إباحية، استغلال قاصرين
- تحرش، ترصّد، تهديد شخص بعينه، تشهير
- كراهية، عنصرية، تحريض على عنف، إرهاب
- جمع معلومات شخصية/دوكسينغ (عنوان منزل، رقم هاتف، هوية شخص مجهول)
- احتيال مالي، تصيّد، برمجيات خبيثة، بيع مخدرات/أسلحة
- تلاعب بالانتخابات أو نشر معلومات مضللة خطرة
Reply with JSON: { "refuse": true, "reason": "سبب قصير بالعربي يوضح السبب" }

البحث العام عن موضوع حساس (مثل "تغريدات عن السياسة") مسموح — الرفض فقط عند استهداف شخص، أو جمع محتوى ضار، أو إيذاء محتمل.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
X API v2 OPERATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Allowed:
- Keywords: bare = AND, OR between words, "phrase" = exact, -word = exclude
- Accounts: from:username, to:username, @username, retweets_of:username
- Tweet types: is:retweet, is:reply, is:quote, is:verified (and negations with -)
- Media: has:media, has:images, has:video_link, has:links, has:hashtags, has:mentions, has:geo
- Language: lang:xx (ISO 639-1, e.g. lang:ar)
- Location: place:name, place_country:XX, point_radius:[lon lat Xkm], bounding_box:[w s e n]
- Conversation: conversation_id:ID, context:domain.entity, entity:"name"
- URLs: url:"domain.com"
- Hashtags/cashtags: #hashtag, $SYMBOL
- Grouping: ( )

FORBIDDEN (do NOT emit — they cause HTTP 400 on X API v2):
- since:YYYY-MM-DD, until:YYYY-MM-DD, since_id:, until_id:, filter:*

For date ranges, put ISO-8601 timestamps in "start_time" / "end_time" JSON fields INSTEAD of putting them in the query string. Compute "آخر N أيام/أسابيع/أشهر" from today.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT JSON — no markdown, no prose outside)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return exactly ONE of these three shapes:

A) Clarifying question:
{ "question": "سؤال قصير بالعربي" }

B) Refusal:
{ "refuse": true, "reason": "سبب قصير بالعربي" }

C) Final query (Phase 2):
{
  "final": true,
  "query": "the X query (LTR, NO since:/until:/filter:)",
  "explanation": "جملتان قصيرتان بالعربي",
  "tips": ["نصيحة 1", "نصيحة 2"],
  "start_time": "2024-01-01T00:00:00Z" or null,
  "end_time":   "2024-06-30T23:59:59Z" or null
}

Defaults: append -is:retweet unless user wants retweets. Keep queries concise. Arabic for question/reason/explanation/tips.`;

// Strip operators that don't exist in X API v2 so the search endpoint doesn't return HTTP 400.
function sanitizeQuery(q) {
  if (!q) return "";
  return q
    .replace(/\b(since|until|since_id|until_id)\s*:\s*\S+/gi, "")
    .replace(/\bfilter\s*:\s*\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Rescue any since:/until: dates the model left in the query so we can
// forward them as start_time / end_time instead.
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

// First-line defense before we even call the model. The model has its own
// stronger guardrails; this just blocks obvious abuse cheaply.
const UNSAFE_PATTERNS = [
  // Arabic
  /إباحي/i, /بورنو/i, /\bسكس\b/i, /جنس\s*صريح/i, /عار(ية|يات)/i,
  /تحرش/i, /ابتزاز/i, /دوكس/i,
  /اغتيال/i, /\bقتل\s+\S+/i,
  /عنوان\s+منزل/i, /رقم\s+هاتف\s+\S+/i,
  // English
  /\bporn\b/i, /\bpornograph/i, /\bnude\b/i, /\bcsam\b/i,
  /\bstalk\b/i, /\bharass\b/i, /\bdoxx?\b/i,
  /\bhow to (make|build) (a )?(bomb|weapon)/i,
  /\bchild (sexual|porn)/i,
];

function isObviouslyUnsafe(text) {
  return UNSAFE_PATTERNS.some((re) => re.test(text));
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "لم يتم ضبط مفتاح OpenAI على الخادم.", code: "NO_OPENAI_KEY" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "طلب غير صالح.", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // Accept either { messages: [...] } (new conversational API) or legacy { intent: "..." }
  let messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages && typeof body?.intent === "string") {
    messages = [{ role: "user", content: body.intent.trim() }];
  }

  if (!messages || messages.length === 0) {
    return NextResponse.json(
      { error: "اكتب ما تريد البحث عنه أولًا.", code: "EMPTY_INTENT" },
      { status: 400 }
    );
  }

  // Coerce, clamp, keep only the last 12 turns.
  const safeMessages = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  if (safeMessages.length === 0) {
    return NextResponse.json(
      { error: "لا توجد رسائل صالحة.", code: "BAD_MESSAGES" },
      { status: 400 }
    );
  }

  const totalLen = safeMessages.reduce((s, m) => s + m.content.length, 0);
  if (totalLen > 5000) {
    return NextResponse.json(
      { error: "المحادثة طويلة جدًا. ابدأ من جديد.", code: "TOO_LONG" },
      { status: 400 }
    );
  }

  // Cheap prefilter — check the latest user message for obviously unsafe intent.
  const lastUser = [...safeMessages].reverse().find((m) => m.role === "user");
  if (lastUser && isObviouslyUnsafe(lastUser.content)) {
    return NextResponse.json({
      type: "refused",
      reason:
        "لا يمكنني مساعدتك في هذا النوع من البحث. هذا الطلب يتعارض مع سياسة الاستخدام المقبول.",
      done: true,
    });
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
          ...safeMessages,
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

    // Refusal from the model
    if (parsed.refuse === true) {
      return NextResponse.json({
        type: "refused",
        reason: parsed.reason || "تعذّر تنفيذ هذا الطلب.",
        done: true,
      });
    }

    // Clarifying question
    if (parsed.question && !parsed.final) {
      return NextResponse.json({
        type: "question",
        question: String(parsed.question).slice(0, 400),
        done: false,
      });
    }

    // Final query
    if (parsed.final === true || parsed.query) {
      if (!parsed.query) {
        return NextResponse.json(
          { error: "لم يتمكن النموذج من صياغة استعلام.", code: "NO_QUERY" },
          { status: 502 }
        );
      }
      const rescued = extractDateOperators(parsed.query);
      const cleanQuery = sanitizeQuery(parsed.query);
      return NextResponse.json({
        type: "query",
        query: cleanQuery,
        explanation: parsed.explanation || "",
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
        start_time: parsed.start_time || rescued.start_time || null,
        end_time: parsed.end_time || rescued.end_time || null,
        done: true,
      });
    }

    return NextResponse.json(
      {
        error: "استجابة غير متوقعة من النموذج.",
        code: "UNEXPECTED_SHAPE",
        raw: JSON.stringify(parsed).slice(0, 300),
      },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "خطأ في الشبكة.", code: "NETWORK_ERROR" },
      { status: 500 }
    );
  }
}
