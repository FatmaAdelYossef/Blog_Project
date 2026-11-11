# FILE GUIDE — شرح كل ملف اتغير

> كل ملف من الـ **188 ملف** اللي اتغيرت بين `main` و `feat/frontend-seo`.
> الرموز: **A** = جديد (Added) · **M** = اتعدّل (Modified) · **D** = اتمسح (Deleted) · **R** = اتسمّى/اتنقل (Renamed)

---

## 📁 جذر المشروع

| الملف | الحالة | الشرح |
|---|---|---|
| `.github/workflows/ci.yml` | A | **CI Pipeline** — بيشتغل على GitHub مع كل push/PR: بيبني الفرونت إند (lint + tests + build) والباك إند (build + tests) |
| `docker-compose.yml` | A | تشغيل محلي كامل: PostgreSQL + API + Frontend في containers، مع healthchecks و volumes للـ images و DataProtection keys |
| `DEPLOYMENT.md` | A | **دليل الـ Deploy** — إزاي تنزلي على Railway / Render / Fly.io، كل الـ env vars المطلوبة، ونصايح الإنتاج |
| `README.md` | A | شرح المشروع من الصفر: المعمارية، التشغيل، الاختبارات، الـ API endpoints |
| `.gitignore` | M | ضاف حماية للـ `.env` files عشان مفاتيح محلية ماتترفعش GitHub |

---

## ⚙️ الباك إند — `BlogBack/`

### إعدادات المشروع

| الملف | الحالة | الشرح |
|---|---|---|
| `BlogBack.sln` | M | ملف الـ Solution — ضاف مشروع `BlogBack.Tests` الجديد عشان `dotnet test` يشمله |
| `Blog/Blog.csproj` | M | ملف الـ API project — ضاف مكتبات (Swashbuckle, MailKit, غيرها) |
| `Blog/appsettings.json` | M | الإعدادات الافتراضية — ضاف أقسام جديدة: `Jwt` (ExpireDays + RefreshTokenExpireDays)، `DataProtection`، `RateLimiting`، `Email` (MailKit) |
| `Blog/appsettings.Development.json` | M | إعدادات التطوير — CORS origin، URLs المحلية، وإعدادات تسمح بـ Swagger |
| `BusinessLogicLayer/BusinessLogicLayer.csproj` | M | ضاف مراجع مشاريع (SharedLayer, DataAccessLayer) ومكتبات |
| `DataAccessLayer/DataAccessLayer.csproj` | M | ضاف Npgsql (PostgreSQL driver) بدل SQL Server + EF Core packages |
| `SharedLayer/AppRoles.cs` | A | **ثوابت الأدوار**: `Admin` و `Author` — بيتستخدم في `[Authorize(Roles=...)]` و PostAccess checks |
| `SharedLayer/ConfigClasses/JwtSettings.cs` | M | ضاف `RefreshTokenExpireDays` جنب `ExpireDays` |
| `SharedLayer/Helpers/PublicHelperShared.cs` | M | Helper بيولّد HTML template للإيميلات (زرار Reset Password / كود OTP) — اتعدّل للـ MailKit flow |
| `.config/dotnet-tools.json` | A | بيثبّت `dotnet-ef` محلياً عشان الـ migrations (`dotnet dotnet-ef migrations add ...`) |

### Controllers — `Blog/Controllers/`

| الملف | الحالة | الشرح |
|---|---|---|
| `AuthController.cs` | M | endpoints الـ auth: login, refresh, logout, change/forgot/reset password. **ضاف** `/refresh` و `/logout`، وحسّن error handling (generic 500 بدل `ex.Message`) |
| `PostsController.cs` | M | CRUD للمقالات + media attach/update/delete. ضاف role/ownership checks عبر PostAccess، و validation للتصنيف |
| `CategoryController.cs` | M | CRUD للتصنيفات — read للكل، write للـ Admin بس./regnormalized الـ responses لـ `ApiResponse<T>` |
| `UploadController.cs` | M | رفع/تحميل الصور — ضاف rate limit (20/دقيقة) و validation للملفات |
| `SeoController.cs` | A | **جديد** — `/api/seo/sitemap.xml` و `/api/seo/robots.txt` للـ search engines، وبيستخدم `GetPostIdsAsync` (IDs بس مش HTML كامل) |
| `Middleware/SecurityHeadersMiddleware.cs` | A | **جديد** — بيضيف security headers على كل response: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. CSP بيتعطّل في dev عشان Swagger |
| `Program.cs` | M | **قلب الـ API** — ضاف: startup validation (JWT key/connection string)، rate limiting policies، DataProtection key path، تسجيل الـ services الجديدة، seeders كـ hosted service، migration auto-apply |

### Services — `BusinessLogicLayer/Services/`

#### Auth

| الملف | الحالة | الشرح |
|---|---|---|
| `Auth/IAuthService.cs` | M | الـ interface — ضاف `RefreshTokenAsync`, `LogoutAsync`, و return types جديدة (`LoginResponseDto` فيه access + refresh token) |
| `Auth/AuthService.cs` | M | **أكبر تعديل** — ضاف: refresh token generation + rotation + reuse detection (لو token قديم اتستخدم → revoke كل العيلة)، `RevokeAllForUserAsync` (مع fix: كان ناقص `SaveChangesAsync`!)، dummy password verify للـ timing attack، generic errors ضد enumeration |

#### Authorization (جديد)

| الملف | الحالة | الشرح |
|---|---|---|
| `Authorization/PostAccess.cs` | A | **جديد** — static helper بيفحص: هل الـ user ده Admin؟ ولا Author صاحب المقال؟ بيتستخدم قبل أي edit/delete على posts/media |

#### Category

| الملف | الحالة | الشرح |
|---|---|---|
| `Category/ICategoryService.cs` | M | ضاف return types (`Task<CategoryDto>` بدل void) عشان الـ controller يرجّع الـ entity بعد create/update |
| `Category/CategoryService.cs` | M | نفس التعديل + validation أحسن |

#### Email

| الملف | الحالة | الشرح |
|---|---|---|
| `Email/EmailService.cs` | M | **اتبدلت من `SmtpClient` (obsolete + vulnerable) لـ MailKit 5** — `SmtpClient` async API الجديد، `MimeMessage`، نفس الوظيفة (forgot/reset password emails) |

#### Health (جديد)

| الملف | الحالة | الشرح |
|---|---|---|
| `Health/BlogDbHealthCheck.cs` | A | **جديد** — `IHealthCheck` implementation بيتشيك على الاتصال بالداتابيز — بيشتغل في `/health` endpoint للـ load balancers/PaaS |

#### JWT

| الملف | الحالة | الشرح |
|---|---|---|
| `JWT/IJwtService.cs` | M | ضاف claims جديدة لو لزم (ممكن user id/roles للـ refresh flow) |
| `JWT/JwtService.cs` | M | توليد الـ JWT — ضاف expiry من `JwtSettings` الجديدة، validation أقوى |

#### Media

| الملف | الحالة | الشرح |
|---|---|---|
| `Media/MediaService.cs` | M | إدارة الـ media items — ضاف validation و cleanup logic |

#### Post

| الملف | الحالة | الشرح |
|---|---|---|
| `Post/IPostService.cs` | M | ضاف `GetPostIdsAsync()` (للـ sitemap — IDs بس) + return types أوضح |
| `Post/PostService.cs` | M | **تعديلات كتير**: category validation قبل create/update، case-insensitive search (`ToLower().Contains()`)، `GetPostIdsAsync` projection، حذف الملفات المرفوعة من `wwwroot/images` لما post/media يتمسح أو URL تتغير |

#### Upload

| الملف | الحالة | الشرح |
|---|---|---|
| `Upload/InvalidImageException.cs` | A | **جديد** — exception مخصوص لما صورة مرفوعة تكون مش صورة فعلاً (type/signature check) |
| `Upload/IUploadService.cs` | M | ضاف validation signature للملفات |
| `Upload/UploadService.cs` | M | بيعمل save للصور في `wwwroot/images` — ضاف: فحص الـ magic bytes (مش بس extension)، توليد GUID filename، حذف الملفات القديمة |

### DataAccessLayer — `DataAccessLayer/`

#### Context

| الملف | الحالة | الشرح |
|---|---|---|
| `Context/BlogDbContext.cs` | M | ضاف `DbSet<RefreshToken>` + configures + identity على PostgreSQL (Npgsql) بدل SQL Server |

#### Models

| الملف | الحالة | الشرح |
|---|---|---|
| `Models/Post.cs` | M | ضاف `CategoryId` FK + navigation properties للـ Category والـ Media |
| `Models/RefreshToken.cs` | A | **جديد** — entity للـ refresh tokens: Token (hash), UserId, ExpiresAt, RevokedAt, ReplacedByToken, CreatedByIp, UserAgent |
| `Models/Configurations/RefreshTokenConfiguration.cs` | A | **جديد** — EF Core config: indexes على UserId و Token، relationships مع ApplicationUser |
| `Models/Configurations/PostConfiguration.cs` | M | ضاف composite index `(CategoryId, CreatedAt)` للـ feed السريع + FK constraints |

#### DTOs

| الملف | الحالة | الشرح |
|---|---|---|
| `DTOs/Auth/LoginDto.cs` | M | email + password — ضاف validation attributes |
| `DTOs/Auth/LoginResponseDto.cs` | A | **جديد** — accessToken + refreshToken + expiry + user info — بيرجع من login/refresh |
| `DTOs/Auth/RefreshTokenRequestDto.cs` | A | **جديد** — refreshToken string للـ `/refresh` endpoint |
| `DTOs/Auth/LogoutRequestDto.cs` | A | **جديد** — refreshToken للـ `/logout` endpoint |
| `DTOs/Auth/ChangePasswordDto.cs` | M | validation attributes أقوى |
| `DTOs/Auth/ForgotPasswordDto.cs` | M | نفس الشي |
| `DTOs/Auth/ResetPasswordDto.cs` | M | ضاف token + email validation |
| `DTOs/Posts/CreatePostDto.cs` | M | ضاف validation + CategoryId required |
| `DTOs/Posts/UpdatePostDto.cs` | M | نفس الشي |
| `DTOs/Posts/PostResponseDto.cs` | M | ضاف Category info + Author + Media list في الـ response |
| `DTOs/Medias/CreateMediaDto.cs` | M | validation للـ media type/url |
| `DTOs/Validation/MediaUrlAttribute.cs` | A | **جديد** — custom validation attribute بيتأكد إن الـ media URL بيشاور على domain مسموح بيه (مش external links عشوائية) |

#### Migrations

| الملف | الحالة | الشرح |
|---|---|---|
| `Migrations/20261029025039_InitialPostgres.cs` | R050 (rename) | **الـ baseline migration** — اتعملت من الصفر لـ PostgreSQL (بدل SQL Server). فيها كل الجداول: Identity + Posts + Media + Categories |
| `Migrations/20261029025039_InitialPostgres.Designer.cs` | R072 | نفس الـ migration — Designer file (EF internal) |
| `Migrations/20261111160030_RefreshTokensAndPostIndex.cs` | A | **جديد** — ضاف جدول `RefreshTokens` + indexes + PostCategoryId index |
| `Migrations/20261111160030_RefreshTokensAndPostIndex.Designer.cs` | R063 | Designer file بتاعها |
| `Migrations/BlogDbContextModelSnapshot.cs` | M | آخر حالة الـ schema — اتحدّث بعد الـ migration الجديدة |
| `Migrations/20260817*.cs` (6 ملفات) | D | **اتمسحت** — migrations القديمة بتاعة SQL Server (InitialIdentitySetup, AddPostAndMediaTables, RenamePostAndMediaTables, AddContentTable, AddPostsMediaTables, AddCategoryAndConstraints, MakeCategoryIdInPostsTableNotNull) — مش محتاجينها بعد الانتقال لـ PostgreSQL |

#### Seeders

| الملف | الحالة | الشرح |
|---|---|---|
| `Seeders/Classes/RoleSeeder.cs` | A | **جديد** — بينشئ الأدوار (Admin, Author) لو مش موجودين |
| `Seeders/Classes/UserSeeder.cs` | M | بينشئ demo users — ضاف ربطهم بالأدوار الجديدة |
| `Seeders/MainSeeder.cs` | M | الـ orchestrator — شغّل الـ seeders بالترتيب: Roles → Users → Blog content |

#### Tests — `BlogBack.Tests/` (مشروع جديد — 9 ملفات)

| الملف | الشرح |
|---|---|
| `BlogBack.Tests.csproj` | xUnit + EF Core InMemory + Moq — project file بتاع الاختبارات |
| `TestSupport.cs` | **Helpers مشتركة** — InMemory DbContext, UserManager/RoleManager حقيقيين, JWT tokens, test data factories — كل الاختبارات بتستخدمه |
| `AuthServiceTests.cs` | **أهم ملف** — بيختبر: login success/fail، refresh token rotation، reuse detection (old token → revoke all)، logout، password change/reset revocation، enumeration prevention |
| `JwtServiceTests.cs` | توليد/validation الـ JWT — expiry, claims, invalid key |
| `PostServiceTests.cs` | CRUD posts، ownership checks، category validation، search (case-insensitive)، pagination |
| `PostAccessTests.cs` | منطق `PostAccess` — admin يقدر على الكل، author على بتاعه بس، guest على ولا حاجة |
| `CategoryServiceTests.cs` | CRUD تصنيفات، صلاحيات (admin write, الكل read)، validation |
| `UploadServiceTests.cs` | validation للصور — file type, signature check, size limits |
| `PaginationParamsTests.cs` | الـ pagination params — page number, page size, clamping |

---

## 🎨 الفرونت إند — `BlogFront/`

### Build & Config

| الملف | الحالة | الشرح |
|---|---|---|
| `package.json` | M | ضاف مكتبات: `react-quill-new` (editor), `dompurify` (sanitize HTML), `vitest` + `@testing-library/*` (tests), `oxlint` (lint), وإعداد scripts جديدة (`test`, `lint`) |
| `package-lock.json` | A | lock file للـ dependencies — بيضمن نفس الـ versions في كل جهاز/CI |
| `vite.config.js` | M | ضاف proxy للـ API في dev + vitest globals + path aliases |
| `vitest.config.js` | A | **جديد** — إعدادات Vitest: jsdom environment, setup files, coverage |
| `index.html` | M | ضاف fonts preload, theme-boot script, SEO meta tags الأساسية |
| `Dockerfile` | A | **جديد** — multi-stage: node build → nginx serve. Alpine-based |
| `.dockerignore` | A | بيمنع `node_modules`, `.env`, `dist` من الـ Docker context |
| `.env.example` | A | مثال للـ env vars: `VITE_API_BASE_URL` |
| `nginx/default.conf.template` | A | **جديد** — nginx config: serve SPA + proxy `/api` للـ backend + `/healthz` + gzip + cache headers |
| `public/theme-boot.js` | A | **جديد** — script صغير بيشتغل قبل React hydration — بيطبّق الـ theme (light/dark) من localStorage عشان ميحصلش flash |
| `tailwind.config.js` | D | **اتمسح** — Tailwind CSS 4 مش محتاج config file (بيشتغل بـ CSS-first) |
| `src/App.css` | D | **اتمسح** — استبدل بـ `index.css` الجديد (Tailwind 4 + design tokens) |
| `src/assets/hero.png`, `react.svg`, `vite.svg` | D | **اتمسحوا** — صور Vite template القديمة — مش مستخدمين في التصميم الجديد |
| `vscode/settings.json` | D | **اتمسح** — إعدادات IDE قديمة |

### App Entry & Routing

| الملف | الحالة | الشرح |
|---|---|---|
| `src/App.jsx` | M | ضاف `SiteShell` component — بيختار بين `PublicLayout` (زائر) و `DashboardLayout` (مسجل) على حسب auth state + route definitions + providers (Auth, Theme, Language) |
| `src/index.css` | M | **اتبدل بالكامل** — Tailwind 4 directives + CSS variables للـ design system (colors, spacing, fonts) + dark mode + RTL support |
| `src/test/setup.js` | A | **جديد** — Vitest setup: jest-dom matchers, localStorage mock, cleanup |

### Context — `src/context/`

| الملف | الحالة | الشرح |
|---|---|---|
| `AuthContext.jsx` | A | **جديد** — global auth state: user, token, login/logout, refresh token management, `auth:token-refreshed` event listener |
| `AuthContext.test.jsx` | A | اختبارات الـ auth context — login, logout, token refresh, expiry |
| `ThemeContext.jsx` | A | **جديد** — light/dark theme state + localStorage persistence + `data-theme` attribute على `<html>` |

### i18n — `src/i18n/`

| الملف | الحالة | الشرح |
|---|---|---|
| `index.jsx` | A | **جديد** — `LanguageProvider` + `useLanguage()` hook + `t()` function + interpolation (`{var}`) + fallback للإنجليزي + `dir`/`lang` auto-set على `<html>` |
| `en.js` | A | **جديد** — قاموس الإنجليزي — كل الـ keys للـ UI text |
| `ar.js` | A | **جديد** — قاموس العربي — نفس الـ keys مترجمة |

### Lib — `src/lib/` (utilities)

| الملف | الحالة | الشرح |
|---|---|---|
| `cn.js` | A | **جديد** — `cn()` utility — بيدمج Tailwind classes بشكل smart (زي `clsx` + `tailwind-merge`) |
| `focusable.js` | A | **جديد** — utility بيدور على focusable elements جوا container — للـ keyboard navigation في modals/menus |
| `readingTime.js` | A | **جديد** — بيحسب وقت قراءة المقال من عدد الكلمات |
| `readingTime.test.js` | A | اختبارات الـ reading time |
| `sanitize.js` | A | **جديد** — wrapper حوالين DOMPurify — بينضّف HTML بتاع المقالات قبل العرض (XSS protection) |
| `sanitize.test.js` | A | اختبارات الـ sanitizer — script tags, event handlers, iframe |
| `seo.js` | A | **جديد** — `useSeo()` hook — بيحدّث meta tags (title, description, og:image) per page + canonical URL |
| `seo.test.js` | A | اختبارات الـ SEO hook |
| `theme.js` | A | **جديد** — theme utilities: get/set theme, apply `data-theme`, system preference detection |
| `tokenStorage.js` | A | **جديد** — safe localStorage wrapper للـ tokens (access + refresh) — بيتعامل مع JSON parse errors |
| `tokenStorage.test.js` | A | اختبارات الـ token storage |

### Services — `src/services/` (API clients)

| الملف | الحالة | الشرح |
|---|---|---|
| `authService.js` | M | login, logout, refresh, change/forgot/reset password — ضاف refresh token calls + return type جديد |
| `axiosConfig.js` | M | **axios interceptor** — بيضيف Bearer token تلقائياً، بيلفّ على 401 → يحاول refresh → لو نجح يعمل retry للـ request الأصلي، لو فشل يعمل logout. single-flight refresh (request واحد بس للـ refresh في نفس الوقت) |
| `categoryService.js` | M | CRUD تصنيفات — اتظبط مع الـ `ApiResponse<T>` الجديد |
| `jwtService.js` | M | decode JWT + check expiry — اتظبط مع الـ token structure الجديد |
| `uploadService.js` | M | upload/download images — validation + error handling |
| `jwtService.test.js` | A | اختبارات الـ JWT decode/expiry |

### Config

| الملف | الحالة | الشرح |
|---|---|---|
| `config/apiEndpoints.js` | M | كل الـ API URLs في مكان واحد — ضاف `AUTH.REFRESH`, `AUTH.LOGOUT`, `SEO` endpoints, `BASE_URL` من env |

### Components — `src/components/`

#### Layout — `components/layout/`

| الملف | الحالة | الشرح |
|---|---|---|
| `PublicLayout.jsx` | A | **جديد** — الـ shell بتاع الزائر: top navbar (brand + nav links + theme toggle + language toggle + sign-in button) + mobile menu + footer. Sticky header, blurred background |
| `PublicLayout` مفيش test | — | (مفيش test file ليها — معقدة بسبب router) |
| `AuthShell.jsx` | A | **جديد** — wrapper للـ auth pages (login, forgot, reset, change password) — centered card design + brand logo |
| `AuthShell.test.jsx` | A | اختبارات الـ auth shell |
| `Brand.jsx` | A | **جديد** — logo + name component — بيستخدم في كل الـ layouts |
| `LanguageToggle.jsx` | A | **جديد** — زرار تبديل اللغة (EN ↔ عربي) — بيستخدم `useLanguage()` |
| `ThemeToggle.jsx` | A | **جديد** — زرار تبديل light/dark — بيستخدم `ThemeContext` |
| `ThemeToggle.test.jsx` | A | اختبارات الـ theme toggle |
| `ScrollToTop.jsx` | A | **جديد** — بيعمل scroll للـ top عند تغيير الـ route |
| `DashboardLayout.jsx` | M | **موجود من قبل** — اتعدّل: logical CSS properties للـ RTL (`ms-`, `me-`, `border-e`), language toggle, auth-aware nav, responsive drawer |

#### UI Kit — `components/ui/` (25 ملف — كلهم جداد)

| الملف | الشرح |
|---|---|
| `index.js` | **barrel export** — بيصدّر كل الـ components من مكان واحد: `import { Button, Card } from '@/components/ui'` |
| `Button.jsx` | زرار موحد — variants (primary, secondary, ghost, danger), sizes, loading state, disabled |
| `Button.test.jsx` | اختبارات الـ button — variants, click, disabled, loading |
| `Card.jsx` | container card — padding variants, hover effects |
| `Modal.jsx` | modal/dialog — overlay, escape key, focus trap (باستخدام `focusable.js`), sizes |
| `Modal.test.jsx` | اختبارات الـ modal |
| `Input.jsx` | text input — label, error, helper text, icons |
| `Textarea.jsx` | textarea — نفس فكرة Input بس للـ multi-line |
| `Select.jsx` | dropdown select — options, placeholder, disabled |
| `PasswordInput.jsx` | input مخصوص للباسورد — show/hide toggle |
| `PasswordInput.test.jsx` | اختبارات الـ password input |
| `Field.jsx` | wrapper للـ form fields — label + input + error + helper text |
| `Tabs.jsx` | tabs component — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `Tabs.test.jsx` | اختبارات الـ tabs |
| `Pagination.jsx` | pagination controls — page numbers, prev/next, page size |
| `Pagination.test.jsx` | اختبارات الـ pagination |
| `Badge.jsx` | badge/tag — variants (success, warning, danger, info) |
| `Alert.jsx` | alert banner — variants (success, error, warning, info), dismissible |
| `Avatar.jsx` | avatar — image + fallback initials, sizes |
| `IconButton.jsx` | زرار أيقونة بس — accessibility (aria-label required) |
| `ConfirmDialog.jsx` | modal تأكيد — "Are you sure?" pattern — بيستخدم Modal + Button |
| `EmptyState.jsx` | حالة فاضية — icon + title + description + CTA button |
| `Skeleton.jsx` | skeleton loader — animated placeholder shapes |
| `Spinner.jsx` | loading spinner — sizes |
| `README.md` | **دليل الـ UI Kit** — إزاي تستخدم كل component + examples |

#### PageHeader (جديد)

| الملف | الشرح |
|---|---|
| `PageHeader.jsx` | **جديد** — component موحد لعنوان الصفحة: eyebrow + title + description + actions — بيستخدم في كل الصفحات |

#### AuthGuard (معدّل)

| الملف | الحالة | الشرح |
|---|---|---|
| `AuthGuard.jsx` | M | بيحمي الـ routes — بيتأكد إن الـ user مسجل + عنده role معين. اتعدّل عشان يشتغل مع الـ AuthContext الجديد |

### Pages — `src/pages/`

#### Home

| الملف | الحالة | الشرح |
|---|---|---|
| `home/PublicHome.jsx` | A | **جديد** — الصفحة الرئيسية للزائر: hero section ("Notes, stories, and ideas worth keeping.") + CTA buttons + "Fresh from the archive" grid (أحدث 6 مقالات) + loading skeletons + empty state |
| `home/HomePage.jsx` | A | **جديد** — auth-aware switch — لو مسجل → Dashboard، لو زائر → PublicHome. ده اللي `SiteShell` بيستخدمه |

#### Posts

| الملف | الحالة | الشرح |
|---|---|---|
| `posts/PostCard.jsx` | A | **جديد** — card لعرض المقال في القوائم — image, title, excerpt, category badge, author, date, reading time |
| `posts/PostsPage.jsx` | M | قائمة المقالات — **ضاف live search** (debounce 400ms), filters, pagination, create/delete buttons (للمسجلين بس), بيستخدم UI Kit + i18n |
| `posts/PostsPage.test.jsx` | A | اختبارات صفحة المقالات — search, filters, pagination, empty state |
| `posts/PostDetailsPage.jsx` | M | صفحة تفاصيل المقال — **ضاف**: edit mode (Quill editor), media management (images/music/links), ownership checks, SEO meta, reading time, RTL support, i18n |
| `posts/PostDetailsPage.test.jsx` | A | اختبارات صفحة التفاصيل — 8 tests: view, edit, save, media, errors |

#### Category

| الملف | الحالة | الشرح |
|---|---|---|
| `category/CategoriesPage.jsx` | M | إدارة التصنيفات — list, create, edit, delete — بيستخدم UI Kit + i18n + RTL. Admin يقدر يكتب، الباقي read-only |
| `category/CategoriesPage.test.jsx` | A | اختبارات صفحة التصنيفات |

#### Dashboard

| الملف | الحالة | الشرح |
|---|---|---|
| `dashboard/Dashboard.jsx` | M | صفحة النظرة العامة — stats, recent posts, quick actions — اتربطت بـ i18n + UI Kit |
| `dashboard/DashboardLayout.jsx` | M | **موجود من قبل** — اتعدّل: logical CSS properties (`ms-`, `me-`, `border-e`) للـ RTL, language toggle, auth-aware nav links, responsive mobile drawer, user menu |
| `dashboard/DashboardLayout.test.jsx` | A | اختبارات الـ dashboard layout — nav, drawer, user menu |

#### Auth Pages

| الملف | الحالة | الشرح |
|---|---|---|
| `login/Login.jsx` | M | صفحة تسجيل الدخول — اتربطت بـ UI Kit + i18n + AuthContext الجديد (login → refresh token flow) |
| `login/Login.test.jsx` | A | اختبارات صفحة اللوجين — success, error, validation |
| `forgetPassword/ForgotPassword.jsx` | M | صفحة "نسيت الباسورد" — بتبعت email → بيجيلك reset link. اتربطت بـ i18n |
| `resetPassword/ResetPassword.jsx` | M | صفحة "تعيين باسورد جديد" — بتاخد token من URL + new password. اتربطت بـ i18n |
| `resetPassword/ResetPassword.test.jsx` | A | اختبارات صفحة الـ reset |
| `changePassword/ChangePassword.jsx` | M | صفحة "تغيير الباسورد" — للمستخدم المسجل. بتبعت old + new password → بيرجع refresh tokens جديدة |
| `changePassword/ChangePassword.test.jsx` | A | اختبارات صفحة الـ change password |

#### Other

| الملف | الحالة | الشرح |
|---|---|---|
| `NotFound.jsx` | M | صفحة 404 — اتربطت بـ i18n + UI Kit + Link للـ home |

---

## 📊 ملخص الأرقام

| التصنيف | العدد |
|---|---|
| Backend (BlogBack) | ~60 ملف |
| Frontend (BlogFront) | ~110 ملف |
| Root/CI/Docs | ~5 ملفات |
| Migrations ممسوحة | 7 ملفات |
| UI Kit components | 19 components + 8 tests + README + index |
| Test files | 9 backend + 13 frontend |

---

