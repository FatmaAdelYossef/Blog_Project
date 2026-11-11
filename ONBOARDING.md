# دليل_Onboarding — نظام المدونة

> شرح كامل لكل اللي اتعمل في المشروع، مُجهّز كـ onboarding لأي حد هتكمل شغل (فاطمة أو غيرها).
> آخر تحديث: بعد دمج كل شغل `feat/frontend-seo` في GitHub.

---

## 1. النظام ده إيه أصلاً؟

مدونة كاملة (Full-Stack Blog) فيها **واجهة مستخدم React** + **API بـ ASP.NET Core** + **قاعدة بيانات PostgreSQL**.

```
المتصفح (React SPA)
      │  HTTPS / JSON
      ▼
ASP.NET Core API  ──►  PostgreSQL
      │
      └── JWT Auth + Refresh Tokens + Roles (Admin / Author)
```

### المسارات المهمة

| المسار | الوظيفة |
|---|---|
| `BlogFront/` | الفرونت إند — React 19 + Vite + Tailwind CSS 4 |
| `BlogBack/Blog/` | الـ API نفسه (Controllers + Program.cs) |
| `BlogBack/BusinessLogicLayer/` | الخدمات (Auth, Post, Category, Media, Upload, JWT, Email) |
| `BlogBack/DataAccessLayer/` | قاعدة البيانات: EF Core, Models, Migrations, Seeders, DTOs |
| `BlogBack/SharedLayer/` | الثوابت المشتركة (الأدوار، إعدادات) |
| `BlogBack/BlogBack.Tests/` | اختبارات الـ Backend (xUnit) — **41 اختبار** |
| `BlogFront/src/**/*.test.*` | اختبارات الـ Frontend (Vitest) — **111 اختبار** |

---

## 2. إيه اللي اتعمل؟ (الملخص التنفيذي)

الشغل كله اتعمل عشان النظام يبقى **Production-Ready**. دي المحاور big picture:

### أ) أمان الجلسات (Auth) — أكبر تغيير

- **Refresh Tokens**: زمان كان فيه JWT واحد عمره 7 أيام ومفيش طريقة نسحب بيها جلسة مسروقة. دلوقتي:
  - Access token قصير العمر (1 يوم).
  - Refresh token (30 يوم) بيتخزن في جدول `RefreshTokens` في الداتابيز.
  - **Rotation**: كل استخدام للـ refresh token بيطلّع واحد جديد ويلغي القديم.
  - **Reuse detection**: لو حد استخدم refresh token قديم (يعني اتسرق)، النظام بيلغي **كل** الجلسات بتاعة المستخدم ده فوراً.
  - Logout / تغيير الباسورد / استرجاع الباسورد → بيلغي كل التوكنات.
- **سد ثغرات timing/enumeration**: تسجيل الدخول والإيميلات غير الموجودة بيردوا بنفس الشكل والوقت تقريباً، فالـ API مش بيفضح مين مسجل ومين لأ.
- **سياسات الباسورد**: حد أدنى 12 حرف + حروف كبيرة/صغيرة/أرقام.
- **Startup validation**: لو الـ JWT key ناقص أو ضعيف، السيرفر **يرفض يشتغل** بدل ما يشتغل بشكل مكسور.
- **Rate limiting**: endpoints بتاعة الـ auth محمية (5 طلبات/دقيقة لكل IP)، والـ upload (20/دقيقة لكل مستخدم).

### ب) الأمان العام (Backend)

- **Security Headers Middleware**: CSP, X-Frame-Options, إلخ — على كل الردود.
- **رفع الملفات**: validation للنوع والحجم والتوقيع (signature) بتاع الصورة، مش بس الامتداد.
- **تنضيف الملفات اليتيمة**: لما مقال أو ميديا تتمسح، الصور المرفوعة بتتمسح من `wwwroot/images` كمان.
- **Validation للتصنيفات**: إنشاء/تعديل مقال بتصنيف مش موجود كان بيرمي 500 — دلوقتي بيرجع خطأ واضح.
- **Index في الداتابيز**: `(CategoryId, CreatedAt)` عشان الـ feed السريع.
- **Sitemap محسّن**: كان بيحمل كل المقالات كاملة بالـ HTML عشان يعمل sitemap — دلوقتي بيجيب الـ IDs بس.
- **DataProtection**: مفاتيح Identity tokens بتتحفظ في مكان دائم (volume) بدل ما تضيع مع كل deploy.
- **MailKit بدل SmtpClient**: المكتبة القديمة obsolete وفيها ثغرات — اتبدلت بـ MailKit 5.

### ج) تجربة المستخدم — واجهتين مختلفتين

- **زائر (مش مسجل)**: تصميم عام أنيق — navbar فوق + home page editorial + footer. مش داشبورد الأدمن.
- **مسجل دخول (Admin/Author)**: نفس الداشبورد القديم بالـ sidebar.
- التنفيذ ذكي: نفس الـ routes، بس `SiteShell` بيختار الـ layout على حسب حالة الـ auth.

### د) العربية و RTL

- نظام ترجمة خفيف (`src/i18n/`) من غير مكتبات خارجية: `LanguageProvider` + `t()` + قواميس `en.js` و `ar.js`.
- زرار تبديل اللغة في الواجهتين، الاختيار بيتحفظ في `localStorage`.
- `dir="rtl"` و `lang="ar"` بيتظبطوا تلقائياً.
- كل الصفحات مترجمة: الرئيسية، المقالات، التفاصيل، التصنيفات، الداشبورد، تسجيل الدخول/استعادة الباسورد، 404.
- استخدام CSS logical properties (`ms-`, `me-`, `start-`, `end-`) فالـ RTL بيشتغل صح.

### هـ) البحث

- **Case-insensitive**: كان بيدور بـ `Contains` حساس لحالة الأحرف — دلوقتي `ToLower().Contains()`.
- **Live search**: أول ما تكتب، بعد 400ms النتائج بتتحدث — مش لازم تدوس Enter.

### و) الأداء والجودة

- **UI Kit موحد**: `components/ui/` — Button, Card, Modal, Input, Select, Tabs, Pagination, Badge, Alert, إلخ — كلها بـ Tailwind + design tokens.
- **Design system**: خطوط (Inter + Newsreader) محلية، light/dark theme، skeletons, empty states.
- **SEO**: `lib/seo.js` (meta tags per page) + `SeoController` (`/api/seo/sitemap.xml`, `/api/seo/robots.txt`).
- **Tests**: 41 backend + 111 frontend — كلها بتعدي.
- **CI**: `.github/workflows/ci.yml` بيشغل lint + tests + build للاتنين.
- **Deploy**: Dockerfiles (API بـ .NET runtime، Frontend بـ nginx)، `docker-compose.yml`، `DEPLOYMENT.md`.

---

## 3. الـ ~188 ملف — إيه؟

مش كلهم شغلنا — الـ branch فيه شغل waves كتير اتعمل قبل كده واتدمج. بس دي خريطة كل حاجة:

### 3.1 الباك إند — `BlogBack/` (~60 ملف)

| المجلد | الملفات | الوظيفة |
|---|---|---|
| `Blog/Controllers/` | AuthController, PostsController, CategoryController, UploadController, **SeoController** (جديد), HealthController | الـ API endpoints |
| `Blog/Middleware/` | **SecurityHeadersMiddleware** (جديد) | حماية الـ headers |
| `Blog/Program.cs` | معدّل | startup validation, rate limits, DataProtection, DI |
| `BusinessLogicLayer/Services/` | AuthService, PostService, CategoryService, MediaService, UploadService, JwtService, EmailService, HealthService | منطق الشغل |
| `BusinessLogicLayer/Services/Authorization/` | **PostAccess** (جديد) | فحص ملكية المقال (author/admin) |
| `BusinessLogicLayer/Services/Upload/` | **InvalidImageException** (جديد) | validation للصور |
| `DataAccessLayer/Models/` | Post, Category, Media, **RefreshToken** (جديد), ApplicationUser | جداول الداتابيز |
| `DataAccessLayer/Migrations/` | InitialPostgres + **RefreshTokensAndPostIndex** (جديد) + مسح الـ migrations القديمة بتاعة SQL Server | EF Core migrations |
| `DataAccessLayer/Seeders/` | RoleSeeder + UserSeeder + ContentSeeder | بيانات أول تشغيل |
| `DataAccessLayer/DTOs/` | LoginResponseDto, RefreshTokenRequestDto, LogoutRequestDto, MediaUrlAttribute | شكل البيانات المتبادلة |
| `SharedLayer/` | **AppRoles** (جديد) | ثوابت الأدوار |
| `BlogBack.Tests/` | 9 ملفات — **جديدة كلها** | 41 اختبار xUnit |

### 3.2 الفرونت إند — `BlogFront/` (~100 ملف)

| المجلد | الملفات | الوظيفة |
|---|---|---|
| `src/components/ui/` | 25 ملف — **جديدة كلها** | UI Kit: Button, Card, Modal, Input, Select, Tabs, Pagination, Badge, Alert, Avatar, ConfirmDialog, EmptyState, Field, IconButton, PasswordInput, Skeleton, Spinner, Textarea + tests + README | **أهم** — دي المكونات الموحدة اللي كل الصفحات بتستخدمها |
| `src/components/layout/` | PublicLayout (جديد), DashboardLayout, AuthShell, Brand, LanguageToggle (جديد), ThemeToggle, ScrollToTop | الـ shells والـ chrome |
| `src/i18n/` | index.jsx, en.js, ar.js — **جديدة كلها** | نظام الترجمة |
| `src/lib/` | sanitize, seo, theme, tokenStorage, readingTime, cn, focusable + tests | utilities |
| `src/context/` | AuthContext, ThemeContext | state management |
| `src/services/` | axiosConfig, authService, jwtService, postService, categoryService, uploadService + tests | API clients |
| `src/pages/` | home (PublicHome جديد + HomePage), posts (PostsPage, PostDetailsPage, PostCard), category, dashboard, login, forgot/reset/change password, NotFound | الصفحات |
| `src/assets/fonts/` | Inter + Newsreader font files | الخطوط |
| `public/theme-boot.js` | جديد | تطبيق الثيم قبل الـ React hydration (يمنع flash) |
| `Dockerfile`, `nginx/`, `.dockerignore`, `.env.example` | جديدة | production build |
| `vite.config.js`, `vitest.config.js`, `tailwind.config.js`, `package.json` | معدّلة | build/test config |

### 3.3 ملفات الجذر والبنية (~10 ملفات)

| الملف | الوظيفة |
|---|---|
| `.github/workflows/ci.yml` | CI pipeline: frontend lint+test+build، backend build+test |
| `docker-compose.yml` | postgres + api + web محلياً |
| `DEPLOYMENT.md` | دليل deploy على PaaS (Railway/Render/Fly) |
| `README.md` | شرح المشروع (اتحدّث) |
| `BlogBack/README-SECRETS.md` | كل الـ env vars المطلوبة |
| `BlogBack/README-ROLES.md` | نظام الصلاحيات |
| `BlogBack/Dockerfile`, `BlogBack/.dockerignore`, `BlogBack/.config/dotnet-tools.json` | Docker + dotnet-ef tool pin |
| `.gitignore` | ضاف `.env` protection |
| `BlogFront/.env.example` | مثال للـ env vars |

### 3.4 الملفات الممسوحة (D)

- **Migrations القديمة**: كل الـ SQL Server migrations اتمسحت واتبدلت بـ `InitialPostgres` واحدة — لأن المشروع اتنقل من SQL Server لـ PostgreSQL.
- **`src/App.css`, `hero.png`, `react.svg`, `vite.svg`, `tailwind.config.js`**: بقايا Vite template القديمة — التصميم الجديد Tailwind 4 مش محتاجها.
- **`vscode/settings.json`**: إعدادات IDE قديمة.

### 3.5 ملفات اتعدلت (M) — أهمها

- كل الـ Controllers (ضاف auth checks, error handling, SEO endpoint)
- كل الـ Services (refresh tokens, upload validation, cleanup)
- كل الصفحات (ربط بـ UI kit + i18n + RTL)
- `Program.cs` (startup validation, rate limits, DataProtection)
- `package.json` (مكتبات جديدة: react-quill, dompurify, mailkit على الباك إند)

---

## 4. إزاي تشغّل المشروع محلياً؟

### المتطلبات
- .NET 8 SDK (`~/.dotnet8/dotnet`)
- Node.js 20+
- PostgreSQL (أو Docker)

### الباك إند
```bash
cd BlogBack
# لو عندك dotnet-ef:
dotnet dotnet-ef database update   # لو عايز apply migrations يدوي
# أو شغّل عادي — الـ migrations بتتعمل auto عند الـ startup
dotnet run --project Blog
```
بيشتغل على `http://localhost:5218` (HTTP) و `https://localhost:7034` (HTTPS).

### الفرونت إند
```bash
cd BlogFront
cp .env.example .env   # وعدّل VITE_API_BASE_URL لو محتاج
npm install
npm run dev            # http://localhost:5173
```

### الاختبارات
```bash
# Backend
cd BlogBack && dotnet test

# Frontend
cd BlogFront && npm test        # watch mode
cd BlogFront && npm run build   # production build
cd BlogFront && npm run lint    # oxlint
```

### Docker (لو Docker Hub شغال)
```bash
docker compose up --build
```

---

## 5. مفاهيم لازم تفهميها

### JWT + Refresh Token
- **Access token**: قصير العمر (1 يوم)، بيتبعت في `Authorization: Bearer` header. لو انتهى → الـ frontend بيعمل silent refresh.
- **Refresh token**: طويل العمر (30 يوم)، بيتخزن في `localStorage` + جدول `RefreshTokens` في الداتابيز. كل استخدام بيعمل rotation.
- **Reuse detection**: لو token قديم اتستخدم تاني → كل الجلسات بتتلغي (security feature).

### Roles
- `Admin`: كل حاجة — تصنيفات، مقالات الكل، users.
- `Author`: مقالاته بس + التصنيفات read-only.
- `PostAccess` helper: بيفحص ملكية المقال قبل التعديل/الحذف.

### UI Kit
- كل المكونات في `src/components/ui/` — **استخدميهم دايماً** بدل ما تكتبي HTML+Tailwind من الصفر.
- فيهم `cn()` utility للـ class merging، `focusable.js` للـ keyboard navigation، `theme.js` للـ dark/light.

### i18n
- `t('key')` للترجمة، `t('key', { var })` للـ interpolation.
- لو مفتاح مش موجود في `ar.js` → بيرجع الإنجليزي (fallback).
- `useLanguage()` hook بيديك `t`, `language`, `setLanguage`, `dir`.

### SEO
- `lib/seo.js` → `useSeo()` hook بيحط meta tags per page.
- `SeoController` → `/api/seo/sitemap.xml` و `/robots.txt` (للـ search engines).

---

## 6. نصايح للـ Onboarding

1. **اقرأي `BlogBack/README-SECRETS.md`** — كل الـ env vars المطلوبة.
2. **اقرأي `BlogBack/README-ROLES.md`** — نظام الصلاحيات.
3. **شوفي `src/components/ui/README.md`** — إزاي تستخدم الـ UI Kit.
4. **`DEPLOYMENT.md`** — لو هتنزلي على PaaS.
5. **الاختبارات هي أحسن documentation** — `BlogBack.Tests/` بيبين إزاي الـ services بتشتغل.
6. **متعدليش على الـ migrations القديمة** — لو محتاجة schema change اعملي migration جديدة.

---

## 7. الـ Gaps اللي لسه موجودة (لو عايزة تكمل)

- **SMTP**: الإيميلات (forgot password) مش بتتبعت لحد ما تحطي credentials — `Email:SmtpHost`, `Email:SmtpUser`, `Email:SmtpPass`, `Email:From`.
- **Uploaded images على PaaS**: بتتخزن في `wwwroot/images` — لو الـ container اتعمله restart بتضيع. محتاجة volume دائم أو object storage (S3, Cloudinary).
- **E2E tests**: مفيش Playwright/Cypress — الـ unit tests كويسة بس مش بتغطي flows كاملة.
- **i18n للمحتوى**: المقالات نفسها مش بتتترجم — بس الـ UI.
- **Rate limiting على PaaS**: شغال بس لو ورا proxy (Railway/Render) ممكن تحتاج تظبط `ForwardedHeaders`.

---

## 8. الأرقام

| المقياس | الرقم |
|---|---|
| ملفات اتغيرت | ~188 |
| Backend tests | 41 |
| Frontend tests | 111 |
| صفحات مترجمة | كل الصفحات |
| Lines of code | ~15,475 إضافة / ~4,281 حذف |

---

**لو عندك أي سؤال عن جزء معين، اسأل — ده الشرح الكامل بسrealistically مش هينفع تحطي كل حاجة في ملف واحد.**
