/**
 * X API v2 Endpoint Registry — Arabic
 *
 * سجل واجهات X API v2 المدعومة مع وصف عربي مبسّط.
 *
 * inputType controls how the param renders in the UI:
 *   "text"    — free text input (default)
 *   "chips"   — multi-select toggleable chips from `options`
 *   "select"  — single-select button group from `choices`
 *   "number"  — number input with preset buttons from `presets`
 *   "date"    — date/time picker
 *   "hidden"  — sent with request but not shown in main form
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
      "تجلب تغريدة واحدة بمعرّفها الرقمي. المعرّف هو الرقم بعد /status/ في رابط التغريدة.",
    searchPlaceholder: "معرّف التغريدة (مثال: 1234567890123456789)",
    searchParam: "id",
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
        inputType: "chips",
        label: "حقول التغريدة",
        default: "author_id,created_at,public_metrics,entities,lang,source,conversation_id",
        options: "attachments,author_id,context_annotations,conversation_id,created_at,edit_controls,entities,geo,id,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,reply_settings,source,text,withheld",
        chipLabels: {
          attachments: "المرفقات",
          author_id: "الكاتب",
          context_annotations: "تصنيفات",
          conversation_id: "سلسلة المحادثة",
          created_at: "التاريخ",
          edit_controls: "التعديلات",
          entities: "الكيانات",
          geo: "الموقع",
          id: "المعرّف",
          in_reply_to_user_id: "ردّ على",
          lang: "اللغة",
          possibly_sensitive: "حساس",
          public_metrics: "التفاعلات",
          referenced_tweets: "تغريدات مرتبطة",
          reply_settings: "إعدادات الرد",
          source: "المصدر",
          text: "النص",
          withheld: "محجوب",
        },
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "chips",
        label: "التوسعات",
        default: "author_id",
        options: "attachments.poll_ids,attachments.media_keys,author_id,edit_history_tweet_ids,entities.mentions.username,geo.place_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id",
        chipLabels: {
          "attachments.poll_ids": "تصويتات",
          "attachments.media_keys": "وسائط",
          "author_id": "الكاتب",
          "edit_history_tweet_ids": "سجل التعديل",
          "entities.mentions.username": "الإشارات",
          "geo.place_id": "المكان",
          "in_reply_to_user_id": "المردود عليه",
          "referenced_tweets.id": "التغريدة الأصلية",
          "referenced_tweets.id.author_id": "كاتب الأصلية",
        },
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "media.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "url,preview_image_url,type,width,height",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "post-lookup-multiple": {
    name: "عرض عدة تغريدات",
    category: "Posts",
    method: "GET",
    path: "/2/tweets",
    description: "اجلب حتى 100 تغريدة دفعة واحدة",
    explanation:
      "اجلب عدة تغريدات بطلب واحد بدل طلب لكل تغريدة. التغريدات المحذوفة أو المحمية لن تظهر في النتائج.",
    searchPlaceholder: "معرّفات التغريدات مفصولة بفاصلة (مثال: 123,456,789)",
    searchParam: "ids",
    params: [
      {
        name: "ids",
        type: "query",
        required: true,
        description: "معرّفات التغريدات مفصولة بفاصلة (حتى 100)",
        placeholder: "1234567890,9876543210",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "chips",
        label: "حقول التغريدة",
        default: "author_id,created_at,public_metrics,entities,lang,source",
        options: "attachments,author_id,context_annotations,conversation_id,created_at,edit_controls,entities,geo,id,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,reply_settings,source,text,withheld",
        chipLabels: {
          attachments: "المرفقات",
          author_id: "الكاتب",
          context_annotations: "تصنيفات",
          conversation_id: "سلسلة المحادثة",
          created_at: "التاريخ",
          edit_controls: "التعديلات",
          entities: "الكيانات",
          geo: "الموقع",
          id: "المعرّف",
          in_reply_to_user_id: "ردّ على",
          lang: "اللغة",
          possibly_sensitive: "حساس",
          public_metrics: "التفاعلات",
          referenced_tweets: "تغريدات مرتبطة",
          reply_settings: "إعدادات الرد",
          source: "المصدر",
          text: "النص",
          withheld: "محجوب",
        },
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type",
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
      "ابحث عن تغريدات الأسبوع الأخير بالكلمات المفتاحية والهاشتاقات وعوامل التصفية.",
    searchPlaceholder: "ابحث... (مثال: #AI lang:en -is:retweet)",
    searchParam: "query",
    params: [
      {
        name: "query",
        type: "query",
        required: true,
        description: "نص البحث",
        placeholder: '#AI lang:en -is:retweet',
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        inputType: "number",
        label: "عدد النتائج",
        default: "10",
        presets: ["10", "25", "50", "100"],
      },
      {
        name: "sort_order",
        type: "query",
        required: false,
        inputType: "select",
        label: "الترتيب",
        default: "recency",
        choices: [
          { value: "recency", label: "الأحدث" },
          { value: "relevancy", label: "الأكثر صلة" },
        ],
      },
      {
        name: "start_time",
        type: "query",
        required: false,
        inputType: "date",
        label: "من تاريخ",
        description: "بداية فترة البحث",
      },
      {
        name: "end_time",
        type: "query",
        required: false,
        inputType: "date",
        label: "إلى تاريخ",
        description: "نهاية فترة البحث",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "chips",
        label: "حقول التغريدة",
        default: "author_id,created_at,public_metrics,entities,lang,source",
        options: "attachments,author_id,context_annotations,conversation_id,created_at,edit_controls,entities,geo,id,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,reply_settings,source,text,withheld",
        chipLabels: {
          attachments: "المرفقات",
          author_id: "الكاتب",
          context_annotations: "تصنيفات",
          conversation_id: "سلسلة المحادثة",
          created_at: "التاريخ",
          edit_controls: "التعديلات",
          entities: "الكيانات",
          geo: "الموقع",
          id: "المعرّف",
          in_reply_to_user_id: "ردّ على",
          lang: "اللغة",
          possibly_sensitive: "حساس",
          public_metrics: "التفاعلات",
          referenced_tweets: "تغريدات مرتبطة",
          reply_settings: "إعدادات الرد",
          source: "المصدر",
          text: "النص",
          withheld: "محجوب",
        },
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "chips",
        label: "التوسعات",
        default: "author_id",
        options: "attachments.poll_ids,attachments.media_keys,author_id,edit_history_tweet_ids,entities.mentions.username,geo.place_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id",
        chipLabels: {
          "attachments.poll_ids": "تصويتات",
          "attachments.media_keys": "وسائط",
          "author_id": "الكاتب",
          "edit_history_tweet_ids": "سجل التعديل",
          "entities.mentions.username": "الإشارات",
          "geo.place_id": "المكان",
          "in_reply_to_user_id": "المردود عليه",
          "referenced_tweets.id": "التغريدة الأصلية",
          "referenced_tweets.id.author_id": "كاتب الأصلية",
        },
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "pagination_token",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "",
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
    description: "كم تغريدة تطابق بحثك خلال 7 أيام",
    explanation:
      "يُرجع عدد التغريدات المطابقة مقسّمًا حسب الوقت. لا يُرجع التغريدات — فقط الأعداد.",
    searchPlaceholder: "نص البحث (مثال: #AI lang:en)",
    searchParam: "query",
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
        inputType: "select",
        label: "تقسيم الوقت",
        default: "hour",
        choices: [
          { value: "minute", label: "دقيقة" },
          { value: "hour", label: "ساعة" },
          { value: "day", label: "يوم" },
        ],
      },
      {
        name: "start_time",
        type: "query",
        required: false,
        inputType: "date",
        label: "من تاريخ",
      },
      {
        name: "end_time",
        type: "query",
        required: false,
        inputType: "date",
        label: "إلى تاريخ",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "quote-tweets": {
    name: "اقتباسات تغريدة",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/quote_tweets",
    description: "التغريدات التي اقتبست تغريدة معيّنة",
    explanation:
      "شوف كيف الناس تتفاعل مع تغريدة عبر اقتباسها وإضافة تعليقاتهم.",
    searchPlaceholder: "معرّف التغريدة (مثال: 1234567890123456789)",
    searchParam: "id",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "معرّف التغريدة",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        inputType: "number",
        label: "عدد النتائج",
        default: "10",
        presets: ["10", "25", "50", "100"],
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id,created_at,public_metrics,entities",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "75 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "liking-users": {
    name: "المُعجبون بتغريدة",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/liking_users",
    description: "من أعجب بتغريدة معيّنة",
    explanation:
      "قائمة الحسابات التي ضغطت إعجاب على التغريدة. قد لا تظهر جميع الحسابات بسبب إعدادات الخصوصية.",
    searchPlaceholder: "معرّف التغريدة (مثال: 1234567890123456789)",
    searchParam: "id",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "معرّف التغريدة",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        inputType: "number",
        label: "عدد النتائج",
        default: "10",
        presets: ["10", "25", "50", "100"],
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "75 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "retweeted-by": {
    name: "من أعاد التغريد",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/retweeted_by",
    description: "من أعاد تغريدة معيّنة (ريتويت)",
    explanation:
      "قائمة الحسابات التي أعادت نشر التغريدة بدون تعليق.",
    searchPlaceholder: "معرّف التغريدة (مثال: 1234567890123456789)",
    searchParam: "id",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "معرّف التغريدة",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        inputType: "number",
        label: "عدد النتائج",
        default: "10",
        presets: ["10", "25", "50", "100"],
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
    ],
    rateLimit: "75 طلب / 15 دقيقة",
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
      "اجلب بيانات حساب عبر اسم المستخدم. يُرجع الاسم، النبذة، الصورة، المتابعين، والمعرّف الرقمي.",
    searchPlaceholder: "اسم المستخدم بدون @ (مثال: elonmusk)",
    searchParam: "username",
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
        inputType: "chips",
        label: "حقول الحساب",
        default: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
        options: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
        chipLabels: {
          created_at: "تاريخ الإنشاء",
          description: "النبذة",
          entities: "الكيانات",
          id: "المعرّف",
          location: "الموقع",
          name: "الاسم",
          pinned_tweet_id: "التغريدة المثبتة",
          profile_image_url: "الصورة",
          protected: "محمي",
          public_metrics: "الإحصائيات",
          url: "الرابط",
          username: "اسم المستخدم",
          verified: "موثّق",
          verified_type: "نوع التوثيق",
        },
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "pinned_tweet_id",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "created_at,public_metrics,text",
      },
    ],
    rateLimit: "300 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "user-by-id": {
    name: "بحث عن حساب بالمعرّف",
    category: "Users",
    method: "GET",
    path: "/2/users/:id",
    description: "ابحث عن حساب بمعرّفه الرقمي",
    explanation:
      "مثل البحث بالاسم لكن بالمعرّف الرقمي. المعرّف ثابت حتى لو تغيّر اسم المستخدم.",
    searchPlaceholder: "المعرّف الرقمي للحساب (مثال: 44196397)",
    searchParam: "id",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "المعرّف الرقمي للحساب",
        placeholder: "44196397",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "chips",
        label: "حقول الحساب",
        default: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
        options: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
        chipLabels: {
          created_at: "تاريخ الإنشاء",
          description: "النبذة",
          entities: "الكيانات",
          id: "المعرّف",
          location: "الموقع",
          name: "الاسم",
          pinned_tweet_id: "التغريدة المثبتة",
          profile_image_url: "الصورة",
          protected: "محمي",
          public_metrics: "الإحصائيات",
          url: "الرابط",
          username: "اسم المستخدم",
          verified: "موثّق",
          verified_type: "نوع التوثيق",
        },
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
      "يجلب آخر تغريدات حساب حسب معرّفه الرقمي. ابحث عن الحساب أولًا للحصول على المعرّف.",
    searchPlaceholder: "المعرّف الرقمي للحساب (مثال: 44196397)",
    searchParam: "id",
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
        inputType: "number",
        label: "عدد التغريدات",
        default: "10",
        presets: ["5", "10", "25", "50", "100"],
      },
      {
        name: "exclude",
        type: "query",
        required: false,
        inputType: "chips",
        label: "استبعاد",
        default: "retweets",
        options: "retweets,replies",
        chipLabels: {
          retweets: "الريتويت",
          replies: "الردود",
        },
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
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
    searchPlaceholder: "المعرّف الرقمي للحساب (مثال: 44196397)",
    searchParam: "id",
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
        inputType: "number",
        label: "عدد النتائج",
        default: "20",
        presets: ["10", "20", "50", "100", "1000"],
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "15 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "user-following": {
    name: "يتابع من؟",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/following",
    description: "من يتابعهم حساب معيّن",
    explanation:
      "قائمة الحسابات التي يتابعها الحساب المحدد. مفيد لفهم اهتمامات الشخص.",
    searchPlaceholder: "المعرّف الرقمي للحساب (مثال: 44196397)",
    searchParam: "id",
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
        inputType: "number",
        label: "عدد النتائج",
        default: "20",
        presets: ["10", "20", "50", "100", "1000"],
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "15 طلب / 15 دقيقة",
    accessLevel: "الباقة المدفوعة وأعلى",
  },

  "user-mentions": {
    name: "إشارات لحساب",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/mentions",
    description: "التغريدات التي أشارت (@) لحساب معيّن",
    explanation:
      "شوف ماذا يقول الآخرون عن حساب معيّن أو له. هذه تغريدات الآخرين، ليست تغريدات الحساب نفسه.",
    searchPlaceholder: "المعرّف الرقمي للحساب (مثال: 44196397)",
    searchParam: "id",
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
        inputType: "number",
        label: "عدد النتائج",
        default: "10",
        presets: ["10", "25", "50", "100"],
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id,created_at,public_metrics,entities,lang",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "450 طلب / 15 دقيقة",
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
      "يُرجع بيانات حسابك. يعمل فقط مع مفاتيح OAuth 2.0 الشخصية.",
    searchPlaceholder: null,
    searchParam: null,
    params: [
      {
        name: "user.fields",
        type: "query",
        required: false,
        inputType: "hidden",
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

  let path = endpoint.path;
  for (const param of endpoint.params || []) {
    if (param.type === "path" && paramValues[param.name]) {
      path = path.replace(`:${param.name}`, encodeURIComponent(paramValues[param.name]));
    }
  }

  return path;
}
