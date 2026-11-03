# بررسی کامل مخزن «ابزار کانکور» — گزارش نهایی

تاریخ: ۱۴۰۵/۰۸/۱۲ (۲۰۲۶-۱۱-۰۳) · شاخه: `arena/50f9b6a9-kankor` · پایه: `main` = `1880c38`
دامنه: **تمام مخزن** (۶۹۷ فایل TypeScript/TSX، ۱۰۹٫۸۶۹ خط، ۱۱۴ صفحه، ۲۵۰ کامپوننت، ۷۵ فایل تست، ۶۹ مایگریشن، ۱۴ روت API).

---

## ۱) خلاصهٔ اجرایی

**حکم کلی: مخزن در وضعیت «آمادهٔ انتشار» است.** هیچ باگ مسدودکننده یا حفرهٔ امنیتی بحرانی پیدا نشد. در این پاس ۷ فایل مرده (۲٫۴ هزار خط) حذف شد، ۳ نشت اطلاعات در لاگ بسته شد، ۲ کلاس آسیب‌پذیری واقعی (XSS ذخیره‌شده در داده‌های ساخت‌یافته و Open Redirect در ورود) بسته شد، و ۵ صفحهٔ فارسی‌نشده به i18n منتقل شد.

وضعیت تأییدشده پس از تغییرات:

| بررسی | نتیجه |
| --- | --- |
| `biome check src __tests__` | ✅ ۷۴۱ فایل، صفر خطا |
| `tsc --noEmit` | ✅ صفر خطا |
| `vitest run` | ✅ **۷۶ فایل / ۴۴۶ تست** (قبلاً ۷۴ / ۴۳۶) |
| `next build` | ✅ موفق — ۱۱۴ روت، Proxy فعال |
| دود تست مسیرها (prod server) | ✅ `/fa|en|ps/about`, `/fa`, `/fa/courses`, `/decks`, `/libraries`, `/quizzes`, `/roadmap`, `/search?q=math`, `/verify`, `/auth/login` → ۲۰۰ |
| ۴۰۴ | ✅ `/fa/nope-404` → ۴۰۴ |
| `TODO/FIXME/HACK` | ✅ صفر |
| کلیدهای i18n (fa/en/ps) | ✅ ۳٫۲۷۶ کلید، هم‌تراز، بدون کلید گم‌شده |

---

## ۲) روش بررسی

بررسی با ابزارهای خودِ مخزن انجام شد، نه با بازبینی چشمی:

1. **ایستا:** `biome check`, `tsc --noEmit`, `next build`.
2. **پویا:** اجرای dev/prod server و درخواست به ۱۳ مسیر عمومی + پایش لاگ کنسول (صفر خطای کنسول).
3. **تست:** اجرای کل مجموعه (۴۴۶ تست) و افزودن ۱۰ تست جدید برای دو اصلاح امنیتی.
4. **اسکن هدفمند روی کل `src`:** `console.*`، `as any`، `dangerouslySetInnerHTML`، `@ts-ignore`/`eslint-disable`، استفاده از سرویس‌رول سوپابیس، `use client` در صفحات، فایل‌های بدون مرجع (اسکن مرجع‌دهی)، رشته‌های انگلیسی سخت‌کد، بایت‌های کنترلی، سقف ۸ مگابایتی آپلود، هدرهای امنیتی، کوتاها و مایگریشن‌ها.

---

## ۳) معماری

| لایه | وضعیت |
| --- | --- |
| فریم‌ورک | Next.js 16 (Turbopack) + React 19 + TypeScript strict |
| مسیر‌دهی | App Router با `[locale]` (fa/en/ps)؛ `next-intl` v4 با ۳٫۲۷۶ کلید؛ RTL از `isRtl()` |
| مرز سرور/کلاینت | Server Components پیش‌فرض؛ ۲۶ صفحه از ۱۱۴ کلاینت هستند (همه فرم/تعامل‌محور — قابل قبول) |
| داده | Supabase (Postgres + RLS روی همهٔ جداول) با ۶۹ مایگریشن؛ ۱۴ روت API برای cron/webhook/OMR |
| احراز هویت | Supabase Auth + Google OAuth (PKCE) + OTP ایمیلی؛ سشن در `src/lib/supabase/middleware.ts` و گارد نقش‌محور در `src/proxy.ts` |
| نقش‌ها | student / instructor / school / agency / admin با ریشهٔ داشبورد اختصاصی (`dashboardRootFor`) |
| فایل | Cloudflare R2 (bucket `abzarkankor`) — آپلود ۸ مگابایتی، فقط jpeg/png/webp/avif/gif |
| سازمان‌دهی | `src/app` (روت‌ها) · `src/components/blocks/*` (دامنه‌ای) · `src/lib/*` · `src/features/*` · `src/messages/*` |

**نقطهٔ قوت:** جداسازی تمیز «بلوک دامنه‌ای» از «کامپوننت UI» و وجود یک لایهٔ واحد امنیت در `src/lib/security/` که همهٔ روت‌های حساس از آن استفاده می‌کنند.

---

## ۴) امنیت

### ۴٫۱ آنچه درست است (و تأیید شد)

| مورد | شاهد |
| --- | --- |
| RLS روی همهٔ جداول | ۶۹ مایگریشن، همه با `enable row level security` |
| `credit_transactions` فقط-افزودنی | تریگر/سیاست insert-only؛ ستون `credit_balance` از نوشتن مستقیم محافظت می‌شود |
| توابع `SECURITY DEFINER` | همه با `set search_path = ''` و `auth.uid()` |
| مقایسهٔ راز | `timingSafeStringEqual` در `src/lib/security/secret.ts` |
| گارد روت‌های داخلی | `requireBearerSecret` روی cron / OMR / webhook |
| هدرها | CSP کامل، HSTS، `Permissions-Policy`، `X-Frame-Options` در `src/lib/security/headers.ts` |
| اعتبارسنجی محیط | Zod در `src/lib/env/*` — بدون متغیر، بوت شکست می‌خورد |
| Rate limit | `guardServerAction` روی اکشن‌های auth و `AUTH_ABUSE_RULE` روی `/api/import/google-sheet` |
| سرویس‌رول | هیچ فایل `"use client"` آن را ایمپورت نمی‌کند (تأیید با اسکن) |
| Markdown | `rehype-sanitize` قبل از رندر (`src/lib/markdown-to-html.ts`) |

### ۴٫۲ آسیب‌پذیری‌هایی که در این پاس بسته شد

1. **Open Redirect در ورود (بالا)** — `login-form.tsx` مقدار `?next=` را بدون اعتبارسنجی به `window.location.href` می‌داد: `/auth/login?next=https://evil.example` کاربر را بلافاصله بعد از ورود موفق به صفحهٔ جعلی مهاجم می‌فرستاد (فیشینگ کامل، شامل احتمال درخواست مجدد رمز). برای آن `safeNextPath()` نوشته شد (فقط مسیرهای هم‌مبدأ، رد `//`، `\`، `javascript:`، `data:` و کاراکترهای کنترلی) و در فرم ورود و روت callback اعمال شد. **۵ تست** جدید.
2. **XSS ذخیره‌شده در JSON-LD (بالا)** — در ۷ فایل، داده ساخت‌یافته با `JSON.stringify` خام داخل `<script type="application/ld+json">` تزریق می‌شد. عنوان کورس/دِک/کتابخانه از ورودی کاربر (پنل استاد/مدرسه) می‌آید؛ عنوانی مثل `</script><script>…` تگ را می‌بست و اسکریپت اجرا می‌شد. `safeJsonLd()` اضافه شد (فرار `<`، `>`، `&`، U+2028/2029) و در هر ۱۲ نقطه اعمال شد. **۵ تست** جدید.

### ۴٫۳ شکاف‌های باقی‌مانده

| # | شدت | مورد | توصیه |
| --- | --- | --- | --- |
| S1 | متوسط | بدون MFA برای نقش‌های `admin` و `agency` | فعال‌سازی TOTP سوپابیس برای این دو نقش |
| S2 | کم | بدون CI (`.github/workflows` در gitignore است) — گیت‌هوک لوکال به‌سادگی دور زده می‌شود | حداقل یک workflow برای `biome + tsc + vitest + build` |
| S3 | کم | هیچ محدودیت نرخ سراسری روی روت‌های عمومی خواندنی نیست (فقط auth و import) | در صورت حملهٔ DoS، rate limit در لبه (Vercel/WAF) |

---

## ۵) باگ‌ها و ریسک‌ها — جدول کامل

| # | شدت | محل | مشکل | وضعیت |
| --- | --- | --- | --- | --- |
| 1 | بالا | `src/app/[locale]/auth/login/login-form.tsx:84` | Open Redirect از `?next=` | ✅ اصلاح شد |
| 2 | بالا | ۷ فایل `<script type="application/ld+json">` | XSS ذخیره‌شده از عنوان کاربر | ✅ اصلاح شد |
| 3 | متوسط | `src/app/api/auth/callback/route.ts` | `console.log("google login", code)` — کد PKCE یک اعتبارنامهٔ حامل است | ✅ حذف شد |
| 4 | متوسط | `src/app/[locale]/auth/signup/action.ts` | `console.error` کل آبجکت خطای Supabase (شامل جزئیات داخلی) | ✅ پیام محدود شد |
| 5 | متوسط | `src/test/setup.ts` | `projectRef` تولیدی واقعی در مخزن هاردکد شده بود | ✅ به `test-project` تغییر کرد |
| 6 | متوسط | ۷ فایل بدون مرجع (۲٫۴k خط) | کد مرده، از جمله `data-table.tsx` دموی کامل با داده‌های ساختگی که اشتباهاً در باندل می‌ماند | ✅ حذف شد |
| 7 | متوسط | `src/proxy.ts` + `middleware.ts:158` | `dashboardRootFor(pathname) !== dashPath` — کاربر admin/مدرسه که عضو یک مدرسه هم هست، از `/d/school/{id}` بیرون انداخته می‌شود | ⚠️ گزارش شد، تغییر نکرد (منطق نقش‌محور؛ نیاز به تصمیم محصول) |
| 8 | کم | `vercel.json` | کرون‌ها روزانه‌اند (`0 0 * * *`) → اعلان تا ۲۴ ساعت تأخیر | ⚠️ نیاز به پلن Vercel با فرکانس بیشتر |
| 9 | کم | `d/instructor`, `d/school/.../courses/[slug]` | رشته‌های انگلیسی سخت‌کد در toast/404/دکمهٔ بازگشت + لینک بازگشت به داشبورد **استاد** از داخل داشبورد **مدرسه** | ✅ اصلاح شد (۵ کلید i18n جدید در ۳ زبان) |
| 10 | کم | `d/(student)/courses/[slug]/page.tsx:35` | ریدایرکت ورود بدون پیشوند زبان — بازدیدکنندهٔ `/en` به فرم فارسی می‌رفت | ✅ اصلاح شد |
| 11 | کم | `src/features/import/hooks/use-column-mapping.ts` | بایت NUL واقعی در فایل → git/grep آن را باینری می‌دید | ✅ به `\u0000` تبدیل شد |
| 12 | کم | ۱۳۳ مورد `as any` | عمدتاً در مرزهای سوپابیس/جدول‌های داینامیک | ⚠️ گزارش شد |
| 13 | کم | ۲۶ صفحهٔ `"use client"` | حجم JS اولیه بیشتر از لازم | ⚠️ گزارش شد |
| 14 | کم | ۲۴۹ کلید i18n بدون استفادهٔ قطعی | حجم پیام‌ها | ⚠️ گزارش شد (اسکن اکتشافی) |

---

## ۶) تغییرات این پاس (فایل‌به‌فایل)

**جدید**
- `src/lib/seo/json-ld.ts` — `safeJsonLd()` و `jsonLdProps()`.
- `src/lib/security/redirect.ts` — `safeNextPath()`.
- `__tests__/lib/json-ld.test.ts` — ۵ تست.
- `__tests__/lib/security/redirect.test.ts` — ۵ تست.

**منتقل به i18n / اصلاح‌شده**
- `src/app/[locale]/auth/login/login-form.tsx` — `safeNextPath` روی `?next=` (هم ناوبری، هم پارامتر OAuth).
- `src/app/api/auth/callback/route.ts` — حذف لاگ کد، `safeNextPath` روی `next`، ساده‌سازی ریدایرکت.
- `src/app/[locale]/auth/signup/action.ts` — لاگ محدود به پیام.
- `src/app/[locale]/d/(student)/courses/[slug]/page.tsx` — ریدایرکت ورود با `routes.auth.login.page({ next }, { locale })`.
- `src/app/[locale]/d/instructor/courses/[slug]/page.tsx` — ۵ رشتهٔ انگلیسی → `t(...)`.
- `src/app/[locale]/d/school/[school_id]/courses/[slug]/page.tsx` — همان + مسیر بازگشت به داشبورد مدرسه (`routes.d.school.courses.page`) + روتر locale-aware.
- `src/app/[locale]/(home)/{about,page,courses/[slug],decks/[slug],libraries/[slug],quizzes/[slug]}/page.tsx` و `d/(student)/library/[slug]/page.tsx` — همهٔ JSON-LDها روی `safeJsonLd`.
- `src/features/import/hooks/use-column-mapping.ts` — حذف بایت NUL.
- `src/messages/{fa,en,ps}.json` — `courses.backToCourses`, `deleteCourseFailed`, `courseDeleted` (کلیدها هم‌تراز در هر سه زبان).
- `src/test/setup.ts` — حذف `projectRef` تولیدی.

**حذف‌شده (بدون هیچ ارجاعی؛ با اسکن دوم تأیید شد)**
`src/components/data-table.tsx` · `section-cards.tsx` · `chart-area-interactive.tsx` · `site-header.tsx` · `blocks/sidebar/nav-main.tsx` · `nav-documents.tsx` · `nav-secondary.tsx`

---

## ۷) صریحاً اصلاح نشد (و چرا)

- **S1/MFA و S2/CI:** تغییر در تنظیمات حساب سوپابیس و زیرساخت است، نه کد — خارج از دامنهٔ «ویژگیِ کد».
- **مورد ۷ (دسترسی مدرسه برای ادمین):** رفتار فعلی «هر نقش فقط داشبورد خودش» است. اگر عضویت مدرسه برای ادمین/استاد مجاز باشد، این یک باگ است؛ ولی تغییرش می‌تواند دسترسی غیرمجاز باز کند. نیاز به تأیید صریح محصول دارد.
- **مورد ۸ (کرون روزانه):** محدودیت پلن Vercel؛ راه‌حل جایگزین، تریگر `pg_cron` در سوپابیس است.
- **`as any` (۱۳۳) و صفحات کلاینت (۲۶):** بازنویسی تدریجی است، نه اصلاح ایمن. هر تغییر گروهی ریسک رگرسیون دارد.
- **مهاجرت `20261103000000_course_card_stats.sql`:** باید روی دیتابیس واقعی اجرا شود (در سندباکس دسترسی DB نیست).

---

## ۸) بررسی‌های جانبی که پاک درآمدند

- `<Image>` بدون `alt`: صفر (۳ هیت اولیه در `src/lib/certificates/template.tsx` مثبت کاذب بود — الگوی `alt=` در رشتهٔ قالب HTML).
- srcset/`use client` + سرویس‌رول: صفر.
- بایت کنترلی در فایل‌های `src`: صفر (پس از اصلاح مورد ۱۱).
- TODO/FIXME/HACK: صفر.
- بیلد بدون هشدار باندل غیرمنتظره.

---

## ۹) توصیهٔ نهایی

کد فعلی قابل تحویل است. مسیر پیشنهادی برای ادامه، به ترتیب اولویت: (۱) تصمیم روی مورد ۷، (۲) راه‌اندازی CI، (۳) کاهش `as any` در مرز سوپابیس با تایپ‌های تولیدشده، (۴) تبدیل ۲۶ صفحهٔ کلاینت به سرور به‌صورت موردی برای کاهش JS.
