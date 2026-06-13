# 📝 ورقة | Waraqa - Collaborative LaTeX Editor

**ورقة (Waraqa)** هو محرر LaTeX تعاوني متكامل عبر الإنترنت يتيح لك كتابة وتعديل وتنسيق الأوراق العلمية والرياضية بشكل فوري ومباشر مع زملائك، دون الحاجة إلى تثبيت بيئة LaTeX الضخمة على جهازك.

**Waraqa** is an online collaborative LaTeX editor that allows you to write, edit, and typeset scientific and mathematical papers in real-time with colleagues, without installing a bulky local LaTeX environment.

---

## ✨ المميزات الرئيسية (Key Features)

- **📝 محرر ذكي (Smart Editor)**: محرر نصوص متقدم (Monaco Editor) يدعم تلوين صياغة LaTeX، وإكمال تلقائي ذكي للأوامر، والتفاف الكود، وأرقام الأسطر.
- **🔄 مزامنة فورية (Real-time Collaboration)**: تحرير مشترك في الوقت الفعلي باستخدام Socket.IO مع إمكانية تتبع كتابة ومؤشر الزملاء ورؤية المتواجدين حالياً.
- **⚡ تجميع ذكي وهجين (Hybrid Compilation)**:
  - تجميع حقيقي عند توفر محرك LaTeX (`pdflatex`) على الخادم لتوليد مستندات PDF.
  - محاكي تجميع فوري (HTML Preview Simulator) كبديل متكامل وعالي الأداء في حال عدم توفر محركات محلياً.
- **📐 تصيير فائق السرعة للرياضيات (Fast Math Rendering)**: تصيير كل المعادلات والرموز الرياضية المعقدة فورياً باستخدام مكتبة `KaTeX`.
- **📂 شجرة ملفات مرنة (Sidebar File Manager)**: إدارة ملفات المشروع (إنشاء، حذف، تنقل) بسهولة مع شاشة عرض ثنائية مقسومة وقابلة للتعديل تفاعلياً (Resizable Split View).
- **⚠️ سجل الأخطاء المرتبط بالكود (Click-to-Line Log)**: يعرض قائمة بالأخطاء والتحذيرات الناتجة أثناء التجميع، وبالنقر على أي سطر في السجل يتم الانتقال مباشرة للسطر المعني في المحرر.
- **🛡️ وضع العمل المحلي الآمن (Offline Mode)**: إمكانية تشغيل التطبيق بالكامل وبشكل مستقل على المتصفح وحفظ المشاريع وتصييرها محلياً دون الحاجة لاتصال بالخادم.

---

## 📂 هيكل المجلدات (Project Directory)

```
Waraqa/
├── backend/                # خادم Express + Socket.IO ومحرك التجميع
└── frontend/               # تطبيق React + Monaco Editor + KaTeX
```

---

## 🚀 طريقة البدء والتشغيل (How to Run)

### الإعداد لأول مرة (First-time Installation):
تأكد من تنصيب مكتبات المشروع في المجلدين. يمكنك ذلك يدوياً:
```bash
# تنصيب حزم الواجهة الخلفية
cd backend
npm install

# تنصيب حزم الواجهة الأمامية
cd frontend
npm install
```

### التشغيل السريع (Quick Start):
إذا كنت تستخدم نظام **Windows**، يمكنك نقر ملف التشغيل السريع المرفق:
```powershell
./run.ps1
```
*سيقوم هذا الملف بفتح سيرفر الخلفية والواجهة الأمامية في نافذتين مستقلتين تلقائياً.*

أو يمكنك تشغيلهما يدوياً:
- **تشغيل الخادم**: `cd backend && npm run start` (يعمل على المنفذ `5000`)
- **تشغيل الواجهة**: `cd frontend && npm run dev` (يعمل على المنفذ `5173`)
