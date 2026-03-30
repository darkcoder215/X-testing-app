/**
 * X API v2 Endpoint Registry — Arabic
 *
 * سجل واجهات X API v2 المدعومة مع وصف عربي مبسّط.
 */

const ENDPOINTS = {
  // =========================================================================
  // التغريدات — البحث والاستعراض
  // =========================================================================

  "post-lookup": {
    name: "عرض تغريدة",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id",
    description: "اعرض تغريدة واحدة عبر معرّفها",
    explanation:
      "تجلب تغريدة واحدة بمعرّفها الرقمي. تحصل على النص، الكاتب، التفاعلات، الهاشتاقات، والمزيد حسب الحقول المطلوبة. المعرّف هو الرقم بعد /status/ في رابط التغريدة.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "معرّف التغريدة (الرقم من الرابط)",
        placeholder: "1234567890123456789",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        description: "حقول إضافية للتغريدة",
        default: "author_id,created_at,public_metrics,entities,lang,source,conversation_id",
        options: "attachments,author_id,context_annotations,conversation_id,created_at,edit_controls,entities,geo,id,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,reply_settings,source,text,withheld",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        description: "توسعة عناصر مرتبطة (مثل بيانات الكاتب)",
        default: "author_id",
        options: "attachments.poll_ids,attachments.media_keys,author_id,edit_history_tweet_ids,entities.mentions.username,geo.place_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        description: "حقول المستخدم عند توسعة الكاتب",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "media.fields",
        type: "query",
        required: false,
        description: "حقول الوسائط عند توسعة المرفقات",
        default: "url,preview_image_url,type,width,height",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "search-recent": {
    name: "بحث في التغريدات",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/search/recent",
    description: "ابحث في تغريدات آخر 7 أيام",
    explanation:
      "ابحث عن تغريدات نُشرت خلال الأسبوع الأخير. يدعم الكلمات المفتاحية، الهاشتاقات، from:، lang: وغيرها. النتائج الأحدث أولًا.",
    params: [
      {
        name: "query",
        type: "query",
        required: true,
        description: "نص البحث (يدعم عوامل التصفية مثل lang:ar أو from:username)",
        placeholder: '#AI lang:en -is:retweet',
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "عدد النتائج (10-100)",
        default: "10",
        placeholder: "10",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "author_id,created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "sort_order",
        type: "query",
        required: false,
        description: "ترتيب النتائج: recency (الأحدث) أو relevancy (الأكثر صلة)",
        default: "recency",
      },
      {
        name: "pagination_token",
        type: "query",
        required: false,
        description: "رمز التنقل للصفحة التالية من النتائج",
        placeholder: "",
      },
    ],
    rateLimit: "450 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "tweet-counts": {
    name: "عدد التغريدات",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/counts/recent",
    description: "كم تغريدة تطابق بحثك خلال 7 أيام (بدون جلب التغريدات)",
    explanation:
      "يُرجع عدد التغريدات المطابقة مقسّمًا حسب الوقت (دقيقة، ساعة، يوم). لا يُرجع التغريدات نفسها — فقط الأعداد.",
    params: [
      {
        name: "query",
        type: "query",
        required: true,
        description: "نص البحث",
        placeholder: "#AI lang:en",
      },
      {
        name: "granularity",
        type: "query",
        required: false,
        description: "حجم الفترة: minute أو hour أو day",
        default: "hour",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  // =========================================================================
  // الحسابات — استعراض المستخدمين
  // =========================================================================

  "user-by-username": {
    name: "بحث عن حساب",
    category: "Users",
    method: "GET",
    path: "/2/users/by/username/:username",
    description: "ابحث عن حساب بمعرّفه (@)",
    explanation:
      "اجلب بيانات حساب عبر اسم المستخدم (@). يُرجع الاسم، النبذة، الصورة، عدد المتابعين، حالة التوثيق، والمعرّف الرقمي الذي تحتاجه لبقية الواجهات.",
    params: [
      {
        name: "username",
        type: "path",
        required: true,
        description: "اسم المستخدم بدون @",
        placeholder: "elonmusk",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        description: "حقول إضافية للحساب",
        default: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        description: "توسعة عناصر مرتبطة",
        default: "pinned_tweet_id",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        description: "حقول التغريدة المثبّتة",
        default: "created_at,public_metrics,text",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "user-tweets": {
    name: "تغريدات حساب",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/tweets",
    description: "اعرض آخر تغريدات حساب معيّن",
    explanation:
      "يجلب آخر تغريدات حساب حسب معرّفه الرقمي. يشمل التغريدات الأصلية والريتويت والردود. ابحث عن الحساب أولًا للحصول على المعرّف.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "المعرّف الرقمي للحساب (احصل عليه من بحث الحسابات)",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "عدد التغريدات (5-100)",
        default: "10",
      },
      {
        name: "exclude",
        type: "query",
        required: false,
        description: "استبعاد الريتويت و/أو الردود",
        default: "retweets",
        options: "retweets,replies",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "1500 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "user-followers": {
    name: "متابعو حساب",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/followers",
    description: "اعرض قائمة متابعي حساب",
    explanation:
      "يُرجع قائمة الحسابات التي تتابع الحساب المحدد. مفيد لتحليل الجمهور.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "المعرّف الرقمي للحساب",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "عدد النتائج (1-1000)",
        default: "20",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "15 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  // =========================================================================
  // حسابك — الحساب المُصادق عليه
  // =========================================================================

  "me": {
    name: "حسابي",
    category: "Account",
    method: "GET",
    path: "/2/users/me",
    description: "اعرض بيانات حسابك المُصادق عليه",
    explanation:
      "يُرجع بيانات الحساب صاحب المفتاح. يعمل فقط مع مفاتيح OAuth 2.0 الشخصية. إذا كان مفتاحك من نوع App-only فسيُرجع خطأ 403.",
    params: [
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "created_at,description,id,name,profile_image_url,public_metrics,username,verified,verified_type",
      },
    ],
    rateLimit: "75 طلب / 15 دقيقة",
    accessLevel: "يتطلب OAuth 2.0 شخصي",
  },
};

export default ENDPOINTS;

/**
 * Get all endpoints grouped by category.
 */
export function getEndpointsByCategory() {
  const categories = {};
  for (const [key, endpoint] of Object.entries(ENDPOINTS)) {
    const cat = endpoint.category;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ key, ...endpoint });
  }
  return categories;
}

/**
 * Build the actual URL for an endpoint given its parameter values.
 */
export function buildEndpointUrl(endpointKey, paramValues) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointKey}`);

  // Substitute path parameters
  let path = endpoint.path;
  for (const param of endpoint.params || []) {
    if (param.type === "path" && paramValues[param.name]) {
      path = path.replace(`:${param.name}`, encodeURIComponent(paramValues[param.name]));
    }
  }

  return path;
}
