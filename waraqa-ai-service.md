# Waraqa — وثيقة خدمة الذكاء الاصطناعي (AI Service)

> التقنية: **DeepSeek API** + **Supabase** للتخزين الذكي (Semantic Cache)
> المبدأ: كل طلب يمر على Cache أولاً — إن وُجد رد مشابه يُعاد استخدامه، وإلا يذهب لـ DeepSeek ويُخزَّن للمستقبل.

---

## موقع الخدمة في المشروع

```
waraqa-backend/
└── apps/
    └── ai-service/           # ← الخدمة الجديدة
        ├── src/
        │   ├── index.js          # نقطة الدخول + Express
        │   ├── routes/
        │   │   └── ai.routes.js
        │   ├── controllers/
        │   │   └── ai.controller.js
        │   ├── services/
        │   │   ├── deepseek.service.js   # التواصل مع DeepSeek API
        │   │   ├── cache.service.js      # منطق Semantic Cache
        │   │   └── embedding.service.js  # توليد Embeddings للمقارنة
        │   ├── middleware/
        │   │   ├── auth.middleware.js    # التحقق من JWT + الخطة المدفوعة
        │   │   └── rateLimit.middleware.js
        │   └── config/
        │       └── supabase.js
        ├── package.json
        └── Dockerfile
```

---

## المنفذ والتكامل

```
المنفذ: 3005
الوصول: عبر API Gateway فقط
  POST /ai/*  ──► ai-service:3005  (يشترط: JWT + خطة مدفوعة)
```

---

## الميزات الأربع + نقاط النهاية

### 1. إكمال تلقائي لأوامر LaTeX

```
POST /ai/autocomplete
```

```json
// الطلب
{
  "context": "\\frac{",
  "cursorPosition": 7,
  "surroundingLines": ["\\begin{equation}", "\\frac{"]
}

// الرد
{
  "suggestions": [
    { "text": "\\frac{a}{b}", "description": "كسر بسيط" },
    { "text": "\\frac{d}{dx}", "description": "مشتقة" }
  ],
  "fromCache": true
}
```

**ملاحظة:** هذه الميزة تعتمد على Cache بشكل شبه كامل لأن أوامر LaTeX محدودة ومتكررة.

---

### 2. شرح الأخطاء واقتراح الحلول

```
POST /ai/explain-error
```

```json
// الطلب
{
  "errorLog": "! Undefined control sequence. \\maketitle l.5",
  "fileContent": "\\documentclass{article}\n\\begin{document}\n\\maketitle"
}

// الرد
{
  "explanation": "الأمر \\maketitle يحتاج تعريف العنوان أولاً بـ \\title{}",
  "suggestions": [
    {
      "description": "أضف هذا قبل \\begin{document}",
      "code": "\\title{عنوان البحث}\n\\author{اسمك}\n\\date{\\today}"
    }
  ],
  "fromCache": true
}
```

**ملاحظة:** أخطاء LaTeX متكررة جداً — نسبة Cache المتوقعة 70%+.

---

### 3. توليد كود LaTeX من وصف نصي

```
POST /ai/generate
```

```json
// الطلب
{
  "prompt": "جدول مقارنة بين ثلاث خوارزميات بمعايير الوقت والذاكرة والدقة",
  "context": "أنا في ملف chapter2.tex داخل بيئة \\section{النتائج}"
}

// الرد
{
  "code": "\\begin{table}[h]\n\\centering\n\\begin{tabular}{|l|c|c|c|}...",
  "explanation": "جدول بثلاثة أعمدة للمعايير وثلاثة صفوف للخوارزميات",
  "fromCache": false
}
```

---

### 4. تلخيص وتحرير المحتوى الأكاديمي

```
POST /ai/edit-content
```

```json
// الطلب
{
  "text": "النص الأكاديمي هنا...",
  "action": "summarize | improve | translate | simplify",
  "language": "ar | en"
}

// الرد
{
  "result": "النص المعدل أو الملخص...",
  "changes": ["تحسين الأسلوب الأكاديمي", "تصحيح الجمل المكسورة"],
  "fromCache": false
}
```

---

## منطق Semantic Cache مع Supabase

### المبدأ

```
طلب المستخدم
      │
      ▼
توليد Embedding للطلب (نص → متجه رقمي)
      │
      ▼
البحث في Supabase عن طلبات مشابهة
(تشابه cosine > 0.92)
      │
   ┌──┴──┐
  وُجد   لم يوجد
   │         │
   ▼         ▼
إرجاع    إرسال لـ DeepSeek API
الكاش        │
         تخزين الرد + Embedding في Supabase
             │
             ▼
         إرجاع الرد للمستخدم
```

### جدول Supabase

```sql
-- تفعيل إضافة pgvector في Supabase
create extension if not exists vector;

create table ai_cache (
  id            uuid primary key default gen_random_uuid(),
  feature       text not null,         -- 'autocomplete' | 'explain-error' | 'generate' | 'edit'
  input_hash    text not null,         -- SHA256 للطلب الحرفي
  input_text    text not null,         -- نص الطلب الأصلي
  embedding     vector(1536),          -- متجه التشابه الدلالي
  response      jsonb not null,        -- الرد الكامل من DeepSeek
  tokens_used   integer default 0,     -- عدد التوكنز المستهلكة
  hit_count     integer default 1,     -- كم مرة استُخدم هذا الكاش
  created_at    timestamp default now(),
  last_used_at  timestamp default now()
);

-- فهرس للبحث السريع بالتشابه
create index on ai_cache
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- فهرس للبحث الحرفي السريع
create index on ai_cache (input_hash);
create index on ai_cache (feature);
```

### جدول تتبع استهلاك المستخدمين

```sql
create table ai_usage (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  feature      text not null,
  tokens_used  integer default 0,
  from_cache   boolean default false,
  cost_usd     numeric(10, 6) default 0,
  created_at   timestamp default now()
);

-- ملخص شهري لكل مستخدم
create view ai_usage_monthly as
select
  user_id,
  date_trunc('month', created_at) as month,
  sum(tokens_used)                as total_tokens,
  sum(cost_usd)                   as total_cost,
  count(*) filter (where from_cache) as cache_hits,
  count(*) filter (where not from_cache) as api_calls
from ai_usage
group by user_id, month;
```

---

## كود الخدمة

### cache.service.js

```js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SIMILARITY_THRESHOLD = 0.92;

export async function findInCache(feature, inputText, embedding) {
  // 1. بحث حرفي أولاً (أسرع وأرخص)
  const inputHash = crypto
    .createHash('sha256')
    .update(inputText)
    .digest('hex');

  const { data: exactMatch } = await supabase
    .from('ai_cache')
    .select('response')
    .eq('feature', feature)
    .eq('input_hash', inputHash)
    .single();

  if (exactMatch) {
    await incrementHitCount(inputHash);
    return { result: exactMatch.response, fromCache: true, type: 'exact' };
  }

  // 2. بحث دلالي بالتشابه (Semantic Search)
  const { data: semanticMatch } = await supabase.rpc('match_ai_cache', {
    query_embedding: embedding,
    query_feature: feature,
    similarity_threshold: SIMILARITY_THRESHOLD,
    match_count: 1
  });

  if (semanticMatch?.length > 0) {
    return { result: semanticMatch[0].response, fromCache: true, type: 'semantic' };
  }

  return null;
}

export async function saveToCache(feature, inputText, embedding, response, tokensUsed) {
  const inputHash = crypto
    .createHash('sha256')
    .update(inputText)
    .digest('hex');

  await supabase.from('ai_cache').insert({
    feature,
    input_hash: inputHash,
    input_text: inputText,
    embedding,
    response,
    tokens_used: tokensUsed
  });
}

async function incrementHitCount(inputHash) {
  await supabase.rpc('increment_cache_hit', { hash: inputHash });
}
```

### دالة SQL للبحث الدلالي

```sql
create or replace function match_ai_cache(
  query_embedding   vector(1536),
  query_feature     text,
  similarity_threshold float,
  match_count       int
)
returns table (
  id       uuid,
  response jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    response,
    1 - (embedding <=> query_embedding) as similarity
  from ai_cache
  where
    feature = query_feature
    and 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### deepseek.service.js

```js
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPTS = {
  autocomplete: `أنت مساعد خبير في LaTeX. أكمل أوامر LaTeX بدقة.
    أجب بـ JSON فقط: { "suggestions": [{ "text": "", "description": "" }] }`,

  'explain-error': `أنت خبير في تشخيص أخطاء LaTeX.
    اشرح الخطأ بالعربية وقدم الحل. أجب بـ JSON فقط:
    { "explanation": "", "suggestions": [{ "description": "", "code": "" }] }`,

  generate: `أنت خبير في كتابة كود LaTeX الأكاديمي.
    ولّد كود LaTeX دقيق للطلب. أجب بـ JSON فقط:
    { "code": "", "explanation": "" }`,

  'edit-content': `أنت محرر أكاديمي محترف.
    نفّذ المهمة المطلوبة على النص. أجب بـ JSON فقط:
    { "result": "", "changes": [] }`
};

export async function callDeepSeek(feature, userMessage) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[feature] },
        { role: 'user',   content: userMessage }
      ],
      temperature: feature === 'generate' ? 0.3 : 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();

  return {
    result: JSON.parse(data.choices[0].message.content),
    tokensUsed: data.usage.total_tokens
  };
}
```

### ai.controller.js

```js
import { findInCache, saveToCache } from '../services/cache.service.js';
import { callDeepSeek }            from '../services/deepseek.service.js';
import { generateEmbedding }       from '../services/embedding.service.js';
import { logUsage }                from '../services/usage.service.js';

export async function handleAIRequest(req, res) {
  const { feature } = req.params;
  const userId = req.user.id;
  const inputText = JSON.stringify(req.body);

  try {
    // 1. توليد Embedding للطلب
    const embedding = await generateEmbedding(inputText);

    // 2. البحث في Cache
    const cached = await findInCache(feature, inputText, embedding);
    if (cached) {
      await logUsage(userId, feature, 0, true, 0);
      return res.json({ ...cached.result, fromCache: true });
    }

    // 3. استدعاء DeepSeek
    const { result, tokensUsed } = await callDeepSeek(feature, inputText);

    // 4. حفظ في Cache
    await saveToCache(feature, inputText, embedding, result, tokensUsed);

    // 5. تسجيل الاستهلاك
    const costUsd = tokensUsed * 0.00000027; // سعر DeepSeek Chat
    await logUsage(userId, feature, tokensUsed, false, costUsd);

    res.json({ ...result, fromCache: false });

  } catch (error) {
    res.status(500).json({ error: 'فشل طلب الذكاء الاصطناعي', details: error.message });
  }
}
```

---

## Middleware التحقق من الخطة المدفوعة

```js
// middleware/auth.middleware.js

export async function requirePaidPlan(req, res, next) {
  const user = req.user;

  if (user.plan === 'free') {
    return res.status(403).json({
      error: 'هذه الميزة متاحة للحسابات المدفوعة فقط',
      upgradeUrl: '/pricing'
    });
  }

  // التحقق من حد الاستهلاك الشهري
  const monthlyUsage = await getMonthlyTokenUsage(user.id);

  if (monthlyUsage >= PLAN_LIMITS[user.plan]) {
    return res.status(429).json({
      error: 'وصلت للحد الشهري من الذكاء الاصطناعي',
      used: monthlyUsage,
      limit: PLAN_LIMITS[user.plan]
    });
  }

  next();
}

const PLAN_LIMITS = {
  pro:        500_000,   // 500K توكن/شهر
  university: 2_000_000  // 2M توكن/شهر (للمؤسسات)
};
```

---

## متغيرات البيئة الإضافية

```env
# DeepSeek
DEEPSEEK_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Embedding (لتوليد المتجهات - مجاني من Supabase)
EMBEDDING_MODEL=text-embedding-3-small
```

---

## تقدير التوفير من Semantic Cache

| السيناريو | بدون Cache | مع Cache (70% hit) |
|---|---|---|
| 1000 طلب/يوم | ~$2.70 | ~$0.81 |
| 10,000 طلب/يوم | ~$27.00 | ~$8.10 |
| 100,000 طلب/يوم | ~$270.00 | ~$81.00 |

> الأخطاء الشائعة والأوامر المتكررة ستصل نسبة Cache فيها إلى 80%+

---

## الاعتماديات

```json
{
  "express": "^4.19",
  "@supabase/supabase-js": "^2.39",
  "openai": "^4.28",
  "ioredis": "^5.3",
  "express-rate-limit": "^7.0",
  "jsonwebtoken": "^9.0"
}
```

> ملاحظة: حزمة `openai` تُستخدم لتوليد Embeddings فقط عبر Supabase Edge Functions — لا تكلفة إضافية.

---

## خارطة الطريق لهذه الخدمة

- [ ] إعداد Supabase + تفعيل pgvector
- [ ] بناء Cache Service (بحث حرفي + دلالي)
- [ ] دمج DeepSeek API للميزات الأربع
- [ ] Middleware الخطة المدفوعة
- [ ] لوحة تحكم لمراقبة الاستهلاك والتوفير
- [ ] ضبط عتبة التشابه بناءً على بيانات حقيقية

---

*Waraqa AI Service — يونيو 2026*
