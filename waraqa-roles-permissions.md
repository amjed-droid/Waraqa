# Waraqa — وثيقة إدارة المستخدمين والصلاحيات

> المبدأ: **Zero Trust + Least Privilege** — كل مستخدم يملك الحد الأدنى من الصلاحيات اللازمة لعمله فقط.

---

## هيكل الأدوار العام

```
┌─────────────────────────────────────────────────────────┐
│                    هرم الصلاحيات                        │
│                                                         │
│                    ╔═══════════╗                        │
│                    ║  Super    ║  ← مطور النظام فقط     │
│                    ║  Admin    ║                        │
│                    ╚═════╦═════╝                        │
│                          ║                              │
│                    ╔═════╩═════╗                        │
│                    ║   Admin   ║  ← فريق الإدارة        │
│                    ╚═════╦═════╝                        │
│                          ║                              │
│               ╔══════════╩══════════╗                   │
│               ║                     ║                   │
│        ╔══════╩══════╗       ╔══════╩══════╗            │
│        ║  Moderator  ║       ║   Support   ║            │
│        ╚══════╦══════╝       ╚══════╦══════╝            │
│               ║                     ║                   │
│        ╔══════╩═════════════════════╩══════╗            │
│        ║              Users                ║            │
│        ║  ┌─────────┐  ┌────────────────┐  ║            │
│        ║  │  Free   │  │   Pro / Uni    │  ║            │
│        ║  └─────────┘  └────────────────┘  ║            │
│        ╚═══════════════════════════════════╝            │
└─────────────────────────────────────────────────────────┘
```

---

## تعريف الأدوار النظامية

### 1. Super Admin
```
من يكون: مطور النظام الرئيسي فقط (1-2 أشخاص)
كيف يُعيَّن: يدوياً في قاعدة البيانات، لا يوجد واجهة لإنشائه
المصادقة: JWT + TOTP (إلزامي) + IP Whitelist
```

**صلاحياته الحصرية:**
- تعيين وإلغاء دور Admin
- الوصول للبنية التحتية والخوادم
- تعديل إعدادات النظام الجوهرية
- عرض جميع السجلات الأمنية
- تفعيل/تعطيل الخدمات
- إدارة خطط الاشتراك والأسعار
- الوصول للإحصائيات المالية الكاملة

---

### 2. Admin
```
من يكون: فريق إدارة المنصة (3-5 أشخاص)
كيف يُعيَّن: من قِبل Super Admin فقط
المصادقة: JWT + TOTP (إلزامي)
```

**صلاحياته:**
- إدارة حسابات المستخدمين (تعليق، حذف، تعديل الخطة)
- عرض إحصائيات النظام العامة
- الرد على شكاوى المستخدمين
- مراجعة محتوى مُبلَّغ عنه
- إدارة القوالب العامة
- إرسال إشعارات للمستخدمين
- عرض سجلات الأخطاء (بدون بيانات حساسة)

**ما لا يستطيع فعله:**
- ❌ تعيين Admins آخرين
- ❌ الوصول للخوادم والبنية التحتية
- ❌ عرض كلمات المرور أو التوكنات
- ❌ تعديل الأسعار والخطط

---

### 3. Moderator
```
من يكون: مشرفو المجتمع الأكاديمي
كيف يُعيَّن: من قِبل Admin
المصادقة: JWT + TOTP (مستحسن)
```

**صلاحياته:**
- مراجعة المحتوى المُبلَّغ عنه
- تعليق مستخدم مؤقتاً (24-72 ساعة)
- إدارة التعليقات والمراجعات
- عرض تقارير الانتهاكات

**ما لا يستطيع فعله:**
- ❌ حذف حسابات نهائياً
- ❌ الوصول لبيانات المشاريع
- ❌ تعديل الخطط أو الأسعار

---

### 4. Support
```
من يكون: فريق الدعم الفني
كيف يُعيَّن: من قِبل Admin
المصادقة: JWT
```

**صلاحياته:**
- عرض معلومات المستخدم (اسم، بريد، خطة)
- عرض سجل المشاريع (أسماء فقط، لا محتوى)
- إعادة تعيين كلمة المرور بطلب المستخدم
- عرض سجل أخطاء التجميع للمستخدم
- فتح/إغلاق تذاكر الدعم

**ما لا يستطيع فعله:**
- ❌ الوصول لمحتوى الملفات
- ❌ تعليق أو حذف الحسابات
- ❌ الوصول للإحصائيات المالية

---

### 5. المستخدم العادي (User)

#### Free Plan
```
التسجيل: مجاني بالبريد الإلكتروني أو Google
المصادقة: JWT
```

| الميزة | الحد |
|---|---|
| المشاريع | 3 مشاريع كحد أقصى |
| حجم التخزين | 200MB |
| التجميع | 10 تجميعات/يوم |
| المتعاونون | مستخدم واحد إضافي |
| الذكاء الاصطناعي | ❌ غير متاح |
| القوالب | القوالب العامة فقط |
| سجل المراجعات | 7 أيام |

#### Pro Plan
```
الاشتراك: شهري أو سنوي
المصادقة: JWT
```

| الميزة | الحد |
|---|---|
| المشاريع | غير محدود |
| حجم التخزين | 10GB |
| التجميع | غير محدود |
| المتعاونون | 10 مستخدمين |
| الذكاء الاصطناعي | 500K توكن/شهر |
| القوالب | جميع القوالب + إنشاء خاصة |
| سجل المراجعات | 90 يوماً |
| دعم فني | أولوية |

#### University Plan
```
الاشتراك: سنوي للمؤسسات الأكاديمية
المصادقة: JWT + SSO (اختياري)
```

| الميزة | الحد |
|---|---|
| المشاريع | غير محدود |
| حجم التخزين | 100GB مشترك |
| التجميع | غير محدود |
| المتعاونون | غير محدود |
| الذكاء الاصطناعي | 2M توكن/شهر |
| لوحة تحكم المؤسسة | ✅ |
| إدارة الأعضاء | ✅ مسؤول المؤسسة |
| تقارير الاستخدام | ✅ |
| دعم فني | مخصص |

---

### 6. أدوار المشروع (Project Roles)

> هذه أدوار داخل كل مشروع، مستقلة عن دور المستخدم في النظام.

```
مالك المشروع (Owner)
├── محرر (Editor)
└── قارئ (Viewer)
```

| الإجراء | Owner | Editor | Viewer |
|---|:---:|:---:|:---:|
| قراءة الملفات | ✅ | ✅ | ✅ |
| تعديل الملفات | ✅ | ✅ | ❌ |
| تجميع المشروع | ✅ | ✅ | ❌ |
| رفع ملفات | ✅ | ✅ | ❌ |
| حذف ملفات | ✅ | ✅ | ❌ |
| استخدام الذكاء | ✅ | ✅ | ❌ |
| دعوة أعضاء | ✅ | ❌ | ❌ |
| تغيير الأدوار | ✅ | ❌ | ❌ |
| حذف المشروع | ✅ | ❌ | ❌ |
| تغيير إعدادات | ✅ | ❌ | ❌ |
| نقل الملكية | ✅ | ❌ | ❌ |

---

## قاعدة البيانات

### جداول الأدوار والصلاحيات

```sql
-- أدوار النظام
CREATE TYPE system_role AS ENUM (
  'super_admin',
  'admin',
  'moderator',
  'support',
  'user'
);

-- خطط الاشتراك
CREATE TYPE subscription_plan AS ENUM (
  'free',
  'pro',
  'university'
);

-- أدوار المشروع
CREATE TYPE project_role AS ENUM (
  'owner',
  'editor',
  'viewer'
);

-- جدول المستخدمين الموسَّع
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  name              VARCHAR(100) NOT NULL,
  password          VARCHAR(255),
  avatar_url        VARCHAR(500),
  provider          VARCHAR(20) DEFAULT 'email',
  system_role       system_role DEFAULT 'user',
  plan              subscription_plan DEFAULT 'free',
  plan_expires_at   TIMESTAMP,
  is_active         BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  totp_secret       VARCHAR(255),           -- مشفر في DB
  totp_enabled      BOOLEAN DEFAULT FALSE,
  last_login_at     TIMESTAMP,
  last_login_ip     INET,
  failed_logins     INTEGER DEFAULT 0,
  locked_until      TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- جدول أعضاء المشاريع
CREATE TABLE project_members (
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        project_role DEFAULT 'viewer',
  invited_by  UUID REFERENCES users(id),
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- جدول مؤسسات University Plan
CREATE TABLE organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  domain       VARCHAR(255),            -- اسم النطاق الجامعي
  plan         subscription_plan DEFAULT 'university',
  max_members  INTEGER DEFAULT 100,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- أعضاء المؤسسة
CREATE TABLE org_members (
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  is_org_admin BOOLEAN DEFAULT FALSE,
  joined_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- سجل تغييرات الأدوار
CREATE TABLE role_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user  UUID REFERENCES users(id),
  changed_by   UUID REFERENCES users(id),
  old_role     system_role,
  new_role     system_role,
  reason       TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- جدول الدعوات
CREATE TABLE invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  invited_by   UUID REFERENCES users(id),
  email        VARCHAR(255) NOT NULL,
  role         project_role DEFAULT 'viewer',
  token        VARCHAR(64) UNIQUE NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  accepted_at  TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

---

## لوحة تحكم الأدمن (Admin Panel)

### الأقسام الرئيسية

```
لوحة التحكم
├── الرئيسية (Dashboard)
│   ├── إحصائيات فورية (مستخدمون نشطون، تجميعات اليوم، استهلاك AI)
│   ├── رسوم بيانية (نمو المستخدمين، الإيرادات، الأخطاء)
│   └── تنبيهات أمنية معلقة
│
├── المستخدمون (Users)
│   ├── قائمة المستخدمين مع تصفية وبحث
│   ├── عرض تفاصيل مستخدم
│   ├── تعديل الخطة والدور
│   ├── تعليق / إلغاء تعليق الحساب
│   ├── إعادة تعيين كلمة المرور
│   └── عرض سجل نشاط المستخدم
│
├── المشاريع (Projects)
│   ├── إحصائيات المشاريع
│   ├── المشاريع الأكثر نشاطاً
│   └── بحث بالمشاريع (للدعم الفني فقط)
│
├── الاشتراكات (Subscriptions)
│   ├── إدارة خطط الاشتراك
│   ├── سجل المدفوعات
│   ├── المستخدمون قرب انتهاء الاشتراك
│   └── إحصائيات الإيرادات (Super Admin فقط)
│
├── الذكاء الاصطناعي (AI)
│   ├── إجمالي الاستهلاك اليومي/الشهري
│   ├── نسبة Cache Hit
│   ├── أعلى المستخدمين استهلاكاً
│   └── تكلفة DeepSeek API هذا الشهر
│
├── الأمان (Security)
│   ├── محاولات الدخول الفاشلة
│   ├── IP Addresses المحظورة
│   ├── الحوادث الأمنية الأخيرة
│   └── سجل الإجراءات الإدارية
│
├── المؤسسات (Organizations)
│   ├── قائمة الجامعات والمؤسسات
│   ├── عرض وإدارة أعضاء كل مؤسسة
│   └── إحصائيات الاستخدام لكل مؤسسة
│
└── الإعدادات (Settings)  ← Super Admin فقط
    ├── إعدادات النظام
    ├── حدود الخطط
    ├── إدارة فريق الإدارة
    └── مفاتيح API الخارجية
```

---

## Middleware الصلاحيات

```js
// middleware/roles.middleware.js

export const SystemRoles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN:       'admin',
  MODERATOR:   'moderator',
  SUPPORT:     'support',
  USER:        'user'
};

// هرم الصلاحيات — كل دور يشمل ما دونه
const ROLE_HIERARCHY = {
  super_admin: 5,
  admin:       4,
  moderator:   3,
  support:     2,
  user:        1
};

// التحقق من دور نظامي
export function requireSystemRole(minRole) {
  return (req, res, next) => {
    const userLevel = ROLE_HIERARCHY[req.user.systemRole] ?? 0;
    const minLevel  = ROLE_HIERARCHY[minRole] ?? 99;

    if (userLevel < minLevel) {
      return res.status(403).json({
        error: 'لا تملك صلاحية الوصول لهذا القسم'
      });
    }
    next();
  };
}

// التحقق من دور داخل المشروع
export function requireProjectRole(minRole) {
  const PROJECT_HIERARCHY = { owner: 3, editor: 2, viewer: 1 };

  return async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT pm.role FROM project_members pm
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );

    if (!rows[0]) {
      return res.status(403).json({ error: 'لا تملك صلاحية الوصول' });
    }

    const userLevel = PROJECT_HIERARCHY[rows[0].role] ?? 0;
    const minLevel  = PROJECT_HIERARCHY[minRole] ?? 99;

    if (userLevel < minLevel) {
      return res.status(403).json({ error: 'صلاحياتك لا تكفي لهذا الإجراء' });
    }

    req.projectRole = rows[0].role;
    next();
  };
}
```

### تطبيق Middleware على المسارات

```js
// routes/admin.routes.js
import { requireSystemRole } from '../middleware/roles.middleware.js';

const router = express.Router();

// Super Admin فقط
router.get ('/system/settings',    requireSystemRole('super_admin'), getSystemSettings);
router.post('/admins',             requireSystemRole('super_admin'), createAdmin);
router.get ('/revenue',            requireSystemRole('super_admin'), getRevenue);

// Admin فما فوق
router.get ('/users',              requireSystemRole('admin'), getAllUsers);
router.put ('/users/:id/plan',     requireSystemRole('admin'), updateUserPlan);
router.put ('/users/:id/suspend',  requireSystemRole('admin'), suspendUser);
router.post('/notifications/send', requireSystemRole('admin'), sendNotification);

// Moderator فما فوق
router.get ('/reports',            requireSystemRole('moderator'), getReports);
router.put ('/users/:id/warn',     requireSystemRole('moderator'), warnUser);

// Support فما فوق
router.get ('/users/:id/basic',    requireSystemRole('support'), getUserBasicInfo);
router.post('/users/:id/reset-pw', requireSystemRole('support'), resetPassword);
```

---

## نظام الدعوات

```js
// services/invitation.service.js
import crypto from 'crypto';

export async function createInvitation(projectId, invitedBy, email, role) {

  // التحقق من صلاحية المدعو
  const inviter = await getProjectMember(projectId, invitedBy);
  if (inviter.role !== 'owner') {
    throw new ForbiddenError('فقط مالك المشروع يستطيع دعوة أعضاء');
  }

  // التحقق من حد المتعاونين حسب الخطة
  const memberCount = await getProjectMemberCount(projectId);
  const plan = await getUserPlan(invitedBy);
  const limits = { free: 1, pro: 10, university: Infinity };

  if (memberCount >= limits[plan]) {
    throw new PlanLimitError('وصلت للحد الأقصى من المتعاونين في خطتك');
  }

  // إنشاء الدعوة
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام

  await db.query(
    `INSERT INTO invitations (project_id, invited_by, email, role, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, invitedBy, email, role, token, expiresAt]
  );

  // إرسال البريد
  await sendInvitationEmail(email, token, projectId);

  return { token, expiresAt };
}

export async function acceptInvitation(token, userId) {
  const { rows } = await db.query(
    `SELECT * FROM invitations
     WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL`,
    [token]
  );

  if (!rows[0]) {
    throw new NotFoundError('الدعوة غير موجودة أو انتهت صلاحيتها');
  }

  const invitation = rows[0];

  await db.query(
    `INSERT INTO project_members (project_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, user_id) DO NOTHING`,
    [invitation.project_id, userId, invitation.role, invitation.invited_by]
  );

  await db.query(
    `UPDATE invitations SET accepted_at = NOW() WHERE token = $1`,
    [token]
  );
}
```

---

## نظام تدقيق الإجراءات الإدارية (Audit Log)

```js
// utils/adminAudit.js

export async function logAdminAction(adminId, action, targetId, details = {}) {
  await db.query(
    `INSERT INTO admin_audit_log
     (admin_id, action, target_id, details, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [adminId, action, targetId, JSON.stringify(details), details.ip]
  );
}

// كل إجراء إداري يُسجَّل إلزامياً
export const AdminActions = {
  USER_SUSPENDED:      'user.suspended',
  USER_ACTIVATED:      'user.activated',
  USER_DELETED:        'user.deleted',
  PLAN_CHANGED:        'user.plan_changed',
  ROLE_CHANGED:        'user.role_changed',
  PASSWORD_RESET:      'user.password_reset',
  ADMIN_CREATED:       'admin.created',
  ADMIN_REMOVED:       'admin.removed',
  SYSTEM_SETTING:      'system.setting_changed',
  IP_BLOCKED:          'security.ip_blocked',
  NOTIFICATION_SENT:   'notification.sent',
};
```

```sql
CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  target_id   UUID,
  details     JSONB DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX ON admin_audit_log (admin_id);
CREATE INDEX ON admin_audit_log (action);
CREATE INDEX ON admin_audit_log (created_at DESC);
```

---

## لوحة مسؤول المؤسسة (Org Admin)

> خاص بخطة University فقط — مسؤول الجامعة يدير أعضاء مؤسسته فقط.

```
صلاحيات مسؤول المؤسسة:
  ✅ إضافة وإزالة أعضاء من المؤسسة
  ✅ عرض إحصائيات استخدام أعضاء المؤسسة
  ✅ تعيين مسؤولين آخرين داخل المؤسسة
  ✅ عرض إجمالي استهلاك AI للمؤسسة
  ✅ إدارة مشاريع مشتركة على مستوى المؤسسة

  ❌ لا يملك أي صلاحيات على النظام الكلي
  ❌ لا يستطيع رؤية بيانات مؤسسات أخرى
  ❌ لا يستطيع تغيير خطة الاشتراك
```

---

## حدود الخطط في الكود

```js
// config/planLimits.js

export const PLAN_LIMITS = {
  free: {
    maxProjects:      3,
    storageGB:        0.2,
    compilesPerDay:   10,
    collaborators:    1,
    aiTokensPerMonth: 0,
    historyDays:      7,
    templates:        'public'
  },
  pro: {
    maxProjects:      Infinity,
    storageGB:        10,
    compilesPerDay:   Infinity,
    collaborators:    10,
    aiTokensPerMonth: 500_000,
    historyDays:      90,
    templates:        'all'
  },
  university: {
    maxProjects:      Infinity,
    storageGB:        100,
    compilesPerDay:   Infinity,
    collaborators:    Infinity,
    aiTokensPerMonth: 2_000_000,
    historyDays:      365,
    templates:        'all'
  }
};

export async function checkPlanLimit(userId, limitKey) {
  const user = await getUserWithPlan(userId);
  const limits = PLAN_LIMITS[user.plan];

  const checks = {
    maxProjects: async () => {
      const count = await getProjectCount(userId);
      return count < limits.maxProjects;
    },
    compilesPerDay: async () => {
      if (limits.compilesPerDay === Infinity) return true;
      const count = await getCompilesCount(userId, 'today');
      return count < limits.compilesPerDay;
    },
    aiTokensPerMonth: async () => {
      if (limits.aiTokensPerMonth === 0) return false;
      const used = await getAITokensUsed(userId, 'month');
      return used < limits.aiTokensPerMonth;
    }
  };

  return checks[limitKey]?.() ?? true;
}
```

---

## جدول ملخص الصلاحيات الكاملة

| الإجراء | Super Admin | Admin | Moderator | Support | Pro User | Free User |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| إنشاء مشاريع | ✅ | ✅ | ✅ | ✅ | ✅ غير محدود | ✅ (3 فقط) |
| استخدام الذكاء | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| التجميع | ✅ | ✅ | ✅ | ❌ | ✅ غير محدود | ✅ (10/يوم) |
| عرض كل المستخدمين | ✅ | ✅ | ❌ | ✅ محدود | ❌ | ❌ |
| تعليق مستخدم | ✅ | ✅ | ✅ مؤقت | ❌ | ❌ | ❌ |
| حذف مستخدم | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| تغيير خطة | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| إنشاء Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| عرض الإيرادات | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| إعدادات النظام | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| إرسال إشعارات | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| عرض السجل الأمني | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| مراجعة البلاغات | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## إعدادات المستخدم الشخصية

```
الإعدادات المتاحة لكل مستخدم:
  الحساب:
    ✅ تغيير الاسم والصورة
    ✅ تغيير كلمة المرور
    ✅ تفعيل/تعطيل 2FA
    ✅ ربط/فصل Google
    ✅ حذف الحساب نهائياً

  المحرر:
    ✅ اختيار الثيم (فاتح/داكن)
    ✅ حجم الخط
    ✅ نمط المفاتيح (Default/Vim/Emacs)
    ✅ المحرك الافتراضي (pdflatex/xelatex)
    ✅ التجميع التلقائي عند الحفظ

  الإشعارات:
    ✅ إشعار عند دعوة لمشروع
    ✅ إشعار عند انتهاء الاشتراك
    ✅ نشرة إخبارية (اختياري)

  الخصوصية:
    ✅ تصدير كل البيانات (GDPR)
    ✅ عرض سجل تسجيلات الدخول
    ✅ إلغاء جميع الجلسات النشطة
```

---

*Waraqa — إدارة المستخدمين والصلاحيات — يونيو 2026*
