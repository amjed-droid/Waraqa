# Waraqa — وثيقة الخادم الخلفي (Backend)

> التقنية الأساسية: **Node.js + Express** مع معمارية Microservices خفيفة

---

## هيكل المشروع

```
waraqa-backend/
├── apps/
│   ├── api-gateway/          # بوابة API المركزية
│   ├── auth-service/         # خدمة المصادقة
│   ├── projects-service/     # خدمة المشاريع والملفات
│   ├── compile-service/      # خدمة التجميع
│   └── collaboration-service/# خدمة التعاون الفوري
├── packages/
│   ├── shared/               # كود مشترك (types, utils, errors)
│   ├── database/             # اتصالات وموديلات قواعد البيانات
│   └── queue/                # منطق Redis Queue
├── docker/
│   ├── texlive/              # Dockerfile لبيئة التجميع
│   └── compose/              # ملفات Docker Compose
├── scripts/                  # سكريبتات البناء والنشر
├── .env.example
├── package.json              # Monorepo root (npm workspaces)
└── turbo.json                # Turborepo للبناء السريع
```

---

## الخدمات (Services)

### 1. API Gateway

**المسؤولية:** استقبال كل الطلبات الخارجية، التحقق من التوكن، التوجيه للخدمات.

```
المنفذ: 3000
التقنية: Express + http-proxy-middleware
```

```
المسارات:
  POST   /auth/*          ──► auth-service:3001
  GET    /projects/*      ──► projects-service:3002
  POST   /compile/*       ──► compile-service:3003
  WS     /collaborate/*   ──► collaboration-service:3004
```

**الاعتماديات:**
```json
{
  "express": "^4.19",
  "http-proxy-middleware": "^3.0",
  "jsonwebtoken": "^9.0",
  "express-rate-limit": "^7.0",
  "helmet": "^7.0",
  "cors": "^2.8"
}
```

---

### 2. Auth Service — خدمة المصادقة

**المنفذ:** `3001`

**نقاط النهاية:**

| الفعل | المسار | الوصف |
|---|---|---|
| POST | `/auth/register` | تسجيل مستخدم جديد |
| POST | `/auth/login` | تسجيل دخول + إرجاع JWT |
| POST | `/auth/refresh` | تجديد Access Token |
| POST | `/auth/logout` | إلغاء Refresh Token |
| GET  | `/auth/me` | بيانات المستخدم الحالي |
| POST | `/auth/oauth/google` | تسجيل دخول بـ Google |

**منطق التوكن:**
```
Access Token:  مدة صلاحية 15 دقيقة  (JWT - في الذاكرة)
Refresh Token: مدة صلاحية 30 يوم    (Httponly Cookie + Redis)
```

**الاعتماديات:**
```json
{
  "express": "^4.19",
  "jsonwebtoken": "^9.0",
  "bcryptjs": "^2.4",
  "passport": "^0.7",
  "passport-google-oauth20": "^2.0",
  "ioredis": "^5.3",
  "pg": "^8.11",
  "zod": "^3.22"
}
```

**جدول PostgreSQL:**
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  password    VARCHAR(255),
  avatar_url  VARCHAR(500),
  provider    VARCHAR(20) DEFAULT 'email',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

### 3. Projects Service — خدمة المشاريع

**المنفذ:** `3002`

**نقاط النهاية:**

| الفعل | المسار | الوصف |
|---|---|---|
| GET    | `/projects`                    | جلب مشاريع المستخدم |
| POST   | `/projects`                    | إنشاء مشروع جديد |
| GET    | `/projects/:id`                | تفاصيل مشروع |
| DELETE | `/projects/:id`                | حذف مشروع |
| GET    | `/projects/:id/files`          | قائمة ملفات المشروع |
| POST   | `/projects/:id/files`          | إنشاء ملف جديد |
| GET    | `/projects/:id/files/:fileId`  | محتوى ملف |
| PUT    | `/projects/:id/files/:fileId`  | تحديث محتوى ملف |
| DELETE | `/projects/:id/files/:fileId`  | حذف ملف |
| POST   | `/projects/:id/files/upload`   | رفع صورة أو ملف ثنائي |

**جداول PostgreSQL:**
```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  compiler    VARCHAR(20) DEFAULT 'pdflatex',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(20) DEFAULT 'viewer', -- owner | editor | viewer
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  path        VARCHAR(500) NOT NULL,
  content     TEXT,
  is_binary   BOOLEAN DEFAULT FALSE,
  storage_key VARCHAR(500),            -- مسار الملف في MinIO
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

**الاعتماديات:**
```json
{
  "express": "^4.19",
  "pg": "^8.11",
  "minio": "^7.1",
  "multer": "^1.4",
  "zod": "^3.22",
  "ioredis": "^5.3"
}
```

---

### 4. Compile Service — خدمة التجميع

**المنفذ:** `3003`

**نقاط النهاية:**

| الفعل | المسار | الوصف |
|---|---|---|
| POST | `/compile` | إضافة مهمة تجميع للقائمة |
| GET  | `/compile/:jobId` | حالة مهمة التجميع |
| GET  | `/compile/:jobId/pdf` | تحميل PDF الناتج |
| GET  | `/compile/:jobId/log` | سجل التجميع والأخطاء |

**سير العمل:**

```
[Client] ──POST /compile──► [Compile Service]
                                    │
                          إضافة Job في Redis Queue
                                    │
                          Worker يسحب المهمة
                                    │
                    ┌───────────────▼───────────────┐
                    │   Docker Container (TexLive)   │
                    │   1. نسخ ملفات المشروع         │
                    │   2. تشغيل pdflatex/xelatex    │
                    │   3. تحليل سجل الأخطاء         │
                    │   4. رفع PDF إلى MinIO          │
                    └───────────────┬───────────────┘
                                    │
                    إرسال النتيجة عبر WebSocket للعميل
```

**بنية Job في Redis:**
```json
{
  "jobId": "uuid",
  "projectId": "uuid",
  "userId": "uuid",
  "compiler": "pdflatex",
  "mainFile": "main.tex",
  "status": "queued | running | success | failed",
  "createdAt": "ISO-8601",
  "pdfKey": "projects/uuid/main.pdf",
  "errors": [],
  "warnings": []
}
```

**الاعتماديات:**
```json
{
  "express": "^4.19",
  "bullmq": "^5.0",
  "ioredis": "^5.3",
  "dockerode": "^4.0",
  "minio": "^7.1",
  "ws": "^8.16"
}
```

**حدود الأمان لكل Container:**
```js
const containerConfig = {
  Image: 'waraqa/texlive:latest',
  NetworkDisabled: true,           // بدون إنترنت
  HostConfig: {
    Memory: 512 * 1024 * 1024,    // 512MB حد الذاكرة
    CpuPeriod: 100000,
    CpuQuota: 50000,              // 50% من نواة واحدة
    AutoRemove: true,
    ReadonlyRootfs: false,
    Tmpfs: { '/tmp': 'size=100m' }
  }
};
```

---

### 5. Collaboration Service — خدمة التعاون

**المنفذ:** `3004` (WebSocket فقط)

**بروتوكول الأحداث:**

```
Client ──► Server:
  { type: "join",   projectId, fileId, token }
  { type: "update", fileId, changes: Y.js-update (binary) }
  { type: "cursor", fileId, position: { line, col } }
  { type: "leave",  fileId }

Server ──► Client:
  { type: "joined",   users: [...] }
  { type: "update",   fileId, changes, userId }
  { type: "cursor",   fileId, userId, position }
  { type: "user-joined", user }
  { type: "user-left",   userId }
```

**الاعتماديات:**
```json
{
  "ws": "^8.16",
  "yjs": "^13.6",
  "y-protocols": "^1.0",
  "ioredis": "^5.3",
  "jsonwebtoken": "^9.0"
}
```

---

## قواعد البيانات

| قاعدة البيانات | الاستخدام | السبب |
|---|---|---|
| **PostgreSQL 15** | المستخدمون، المشاريع، الأعضاء، الملفات (metadata) | علاقات منظمة + ACID |
| **Redis 7** | الجلسات، قوائم التجميع، Cache، حالة التعاون | سريع + مؤقت |
| **MinIO** | ملفات PDF، الصور، الملفات الثنائية | تخزين كائنات رخيص |

---

## متغيرات البيئة (.env)

```env
# العام
NODE_ENV=development
PORT=3000

# قاعدة البيانات
DATABASE_URL=postgresql://waraqa:password@localhost:5432/waraqa_db

# Redis
REDIS_URL=redis://localhost:6379

# التوكن
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=waraqa

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/oauth/google/callback

# التجميع
COMPILE_TIMEOUT_MS=30000
COMPILE_MAX_CONCURRENT=5
TEXLIVE_IMAGE=waraqa/texlive:latest

# الواجهة الأمامية
FRONTEND_URL=http://localhost:5173
```

---

## Docker Compose (بيئة التطوير)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: waraqa_db
      POSTGRES_USER: waraqa
      POSTGRES_PASSWORD: password
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ['9000:9000', '9001:9001']
    volumes: ['miniodata:/data']

  api-gateway:
    build: ./apps/api-gateway
    ports: ['3000:3000']
    depends_on: [postgres, redis]
    env_file: .env

  auth-service:
    build: ./apps/auth-service
    ports: ['3001:3001']
    depends_on: [postgres, redis]
    env_file: .env

  projects-service:
    build: ./apps/projects-service
    ports: ['3002:3002']
    depends_on: [postgres, minio]
    env_file: .env

  compile-service:
    build: ./apps/compile-service
    ports: ['3003:3003']
    depends_on: [redis, minio]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    env_file: .env

  collaboration-service:
    build: ./apps/collaboration-service
    ports: ['3004:3004']
    depends_on: [redis]
    env_file: .env

volumes:
  pgdata:
  miniodata:
```

---

## خارطة الطريق التقنية للخادم

### المرحلة 1 — الأساس (4 أسابيع)
- [ ] إعداد Monorepo (npm workspaces + Turborepo)
- [ ] Auth Service (تسجيل / دخول / JWT)
- [ ] Projects Service (CRUD المشاريع والملفات)
- [ ] Docker Compose للتطوير المحلي

### المرحلة 2 — التجميع (3 أسابيع)
- [ ] Dockerfile لبيئة TexLive
- [ ] Compile Worker بـ BullMQ
- [ ] تحليل سجل أخطاء LaTeX
- [ ] رفع PDF إلى MinIO وإرجاعه للعميل

### المرحلة 3 — التعاون (3 أسابيع)
- [ ] Collaboration Service بـ WebSocket
- [ ] دمج Y.js للتحرير المشترك
- [ ] مزامنة المؤشرات بين المستخدمين

### المرحلة 4 — الإنتاج (أسبوعان)
- [ ] Kubernetes manifests
- [ ] CI/CD بـ GitHub Actions
- [ ] Logging بـ Winston + مراقبة بـ Prometheus
- [ ] اختبارات تكاملية

---

*Waraqa Backend — يونيو 2026*
