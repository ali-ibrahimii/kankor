# تصاویر کارت‌ها روی Cloudflare R2

هر تصویری که روی کارت‌ها دیده می‌شود — کاور کورس، کاور و لوگوی مکتب، آواتار
پروفایل — در **Cloudflare R2** ذخیره می‌شود و از همان‌جا به مرورگر می‌آید.

## چه چیزی از قبل بود و چه چیزی اضافه شد

| بخش | وضعیت قبل | حالا |
| --- | --- | --- |
| ویدیو/صدا/PDF/برگهٔ پاسخ | R2 با URL امضاشده (`course_assets`) | بدون تغییر (خصوصی می‌ماند) |
| `publicAssetUrl()` | نوشته شده بود ولی هیچ‌جا استفاده نمی‌شد | پایهٔ مسیر تصاویر عمومی |
| آپلود تصویر کاور | وجود نداشت — کارت‌ها فقط `cover_image_url` را از Firebase/Google قبول می‌کردند | `ImageUploadField` + `requestImageUpload` / `finalizeImageUpload` |
| `resolveCoverSrc` | فقط `storage.googleapis.com` را قبول می‌کرد | Cloudflare (هاست عمومی یا `*.r2.dev`) و پروکسی `/api/media` را هم قبول می‌کند |

## راه‌اندازی برای باکت `abzarkankor`

تنظیمات فعلی حساب: باکت **abzarkankor** با **Public Access: Enabled** و
پوشه‌های `certificates/` و `courses/`. تصاویر جدید دقیقاً زیر همان ساختار
می‌نشینند:

```
abzarkankor/
  courses/{courseId}/cover/{uuid}-cover.png     ← تصویر کارت کورس
  schools/{schoolId}/cover/{uuid}-cover.png     ← کاور مکتب
  schools/{schoolId}/logo/{uuid}-logo.png       ← لوگوی مکتب
  avatars/{userId}/{uuid}-avatar.png            ← آواتار پروفایل
  certificates/…                                (از قبل)
```

قدم‌ها:

1. **کلید دسترسی S3**: داشبورد R2 → *Manage R2 API Tokens* → *Create API token*
   با دسترسی **Object Read & Write** روی همین باکت. مقدارهای
   `Access Key ID` و `Secret Access Key` را بردار (Secret فقط یک‌بار نشان داده می‌شود).
2. **متغیرهای محیطی** (در Vercel → Settings → Environment Variables):

   ```env
   R2_ACCOUNT_ID=d2d324ed88248dc0e81505a1501aadbb
   R2_ACCESS_KEY_ID=<from the token>
   R2_SECRET_ACCESS_KEY=<from the token>
   R2_BUCKET_NAME=abzarkankor
   NEXT_PUBLIC_R2_PUBLIC_HOSTNAME=<public host>
   ```

   `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` را از همان صفحهٔ باکت، بخش
   **Public access → R2.dev subdomain** بردار؛ چیزی شبیه
   `pub-1a2b3c4d5e6f.r2.dev`. اگر خالی بگذاری، تصاویر از پروکسی
   هم‌مبدأ `/api/media/...` سرو می‌شوند و باز هم کار می‌کنند.
3. **CORS** را طبق بخش بعدی تنظیم کن (بدون آن، آپلود مرورگر بلاک می‌شود و
   پیام «Upload failed — check the bucket CORS rules» می‌بینی).
4. مهاجرت `20260725000000_cloudflare_public_images.sql` را اجرا کن.
5. **بررسی سالم بودن**: با حساب ادمین وارد شو و
   `GET /api/storage/health` را باز کن:

   ```json
   {
     "ok": true,
     "configured": true,
     "bucket": "abzarkankor",
     "endpoint": "https://<account>.r2.cloudflarestorage.com",
     "publicHostname": "pub-xxx.r2.dev",
     "delivery": "cloudflare-cdn",
     "tableReady": true,
     "listing": { "ok": true, "sample": ["certificates/…", "courses/…"] },
     "covers": { "courses": 3, "schools": 1, "avatars": 0 }
   }
   ```

   `listing.ok: false` یعنی کلید/شناسهٔ حساب غلط است، `tableReady: false`
   یعنی مهاجرت اجرا نشده، و `configured: false` یعنی متغیرها در محیط
   تنظیم نشده‌اند.

## معماری

```
مرورگر ──PUT (presigned, XHR + progress)──▶ R2  (courses/{id}/cover/…)
   │
   └─ finalizeImageUpload()  → HEAD روی R2 → تأیید حجم/نوع → status=ready
                               └─▶ courses.cover_image_url = https://<host>/<key>
```

* **جدول `image_assets`** مرجع «هر تصویر متعلق به کدام کورس/مکتب است»:
  `scope` (`course` | `school` | `profile`)، `owner_id`، `storage_key`،
  `mime_type`، `size_bytes`، `status` (`pending` | `ready` | `failed`).
* **دسترسی**: خواندن برای همه (`anon`) فقط روی ردیف‌های `ready` — چون این‌ها
  همان تصاویر عمومی کارت‌ها هستند. نوشتن فقط برای کسی که
  `can_manage_image_owner(scope, owner_id)` را داشته باشد، یعنی
  مربی/مدیر کورس، یا مدیر/مالک مکتب، یا ادمین.
* **کلید فایل**: `courses/{courseId}/cover/{uuid}-{filename}`،
  `schools/{schoolId}/cover|logo/{uuid}-{filename}`،
  `avatars/{userId}/{uuid}-{filename}`. UUID باعث می‌شود محتوا هرگز تغییر نکند،
  پس `Cache-Control: immutable` کاملاً امن است.
* **کالم‌ها**: `courses.cover_image_url` (از قبل بود)،
  `schools.cover_image_url` و `schools.logo_url` (مهاجرت جدید).
  مقدار همان URL کامل Cloudflare است، بنابراین هیچ کوئری موجودی نیاز به
  تغییر ندارد و ردیف‌های قدیمی (Firebase) هم دست‌نخورده کار می‌کنند.

## تنظیمات لازم

### ۱. متغیرهای محیطی

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=abzarkankor

# عمومی (در مرورگر هم لازم است — برای ساخت URL کارت‌ها)
NEXT_PUBLIC_R2_PUBLIC_HOSTNAME=img.abzarkankor.com
```

`NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` را روی **دامنهٔ عمومی باکت** بگذارید
(Custom Domain در تنظیمات R2، یا هاست `pub-xxxx.r2.dev`).

اگر این متغیر خالی بماند، تصاویر باز هم کار می‌کنند: برنامه آن‌ها را از مسیر
هم‌مبدأ `/api/media/<key>` سرو می‌کند. آن مسیر فقط کلیدهایی را می‌دهد که در
`image_assets` و با وضعیت `ready` ثبت شده باشند، پس هرگز به پروکسی باز باکت
تبدیل نمی‌شود.

### ۲. CORS روی باکت

آپلود مستقیم از مرورگر به R2 انجام می‌شود، پس باکت باید اجازهٔ PUT بدهد:

```json
[
  {
    "AllowedOrigins": ["https://abzarkankor.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

### ۳. دامنهٔ عمومی

در R2 → bucket → Settings → **Public access** یکی از این دو را فعال کنید:

* **Custom Domains** (توصیه‌شده): `img.abzarkankor.com` — از CDN خود
  Cloudflare استفاده می‌کند و همان چیزی است که در `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` می‌گذاریم.
* **R2.dev subdomain**: سریع‌ترین راه برای تست، اما برای ترافیک واقعی محدود است.

هنگام استفاده از دامنهٔ عمومی، `next.config.ts` به‌طور خودکار آن هاست را به
`images.remotePatterns` اضافه می‌کند (و `*.r2.dev` همیشه مجاز است).

## استفاده در کد

```tsx
<ImageUploadField
  scope="course"              // course | school | profile
  ownerId={courseId}
  target="cover"              // cover | logo
  value={values.cover_image_url}
  onUploaded={({ url }) => patch("cover_image_url", url)}
  onRemoved={() => patch("cover_image_url", null)}
/>
```

Server actions (`src/lib/r2/image-actions.ts`):

| اکشن | کار |
| --- | --- |
| `requestImageUpload` | اعتبارسنجی نوع/حجم + دسترسی،درج ردیف `pending`، ساخت URL امضاشده |
| `finalizeImageUpload` | `HEAD` روی R2، تأیید واقعی حجم/نوع، `ready` و نوشتن URL روی کورس/مکتب |
| `deleteImageAsset` | حذف ردیف + آبجکت، و پاک‌کردن URL فقط اگر همان تصویر باشد |
| `listOwnerImages` | همهٔ تصاویر یک کورس/مکتب (برای گالری آینده) |
| `getImageStorageStatus` | وضعیت اتصال R2 + جدول + شمارش تصاویر (`/api/storage/health`) |

## کجا وصل شده است

* **ساخت کورس** (دیالوگ ساخت): تصویر را قبل از ساخت انتخاب می‌کنی؛ به‌محض
  ساخته‌شدن ردیف کورس، تصویر به R2 آپلود و روی کارت ثبت می‌شود.
* **سازندهٔ کورس** → دیالوگ «ویرایش جزئیات» → فیلد «تصویر کارت کورس» (تغییر/حذف).
* **داشبورد مکتب** (`/d/school/[id]`) → کارت «برند مکتب»: کاور + لوگو.
* خواندن: `resolveCoverSrc` در همهٔ کارت‌ها/هیروها (`course-hero`,
  `card-images`, صفحهٔ کورس، فهرست‌های استاد/مکتب و داشبوردها).
* **صفحهٔ عمومی مکتب** (`/schools/[id]`) لوگوی Cloudflare را در هدر نشان می‌دهد.
* `R2_PUBLIC_HOSTNAME` (سمت سرور) اگر تنظیم نشده باشد، خودکار از
  `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` پر می‌شود تا هر دو سمت یک هاست ببینند.

## نکات نگهداری

* تصویر SVG پذیرفته نمی‌شود (ریسک XSS)؛ حداکثر حجم ۸ مگابایت.
* قبل از آپلود، نوع/حجم در کلاینت و در اکشن بررسی می‌شود؛ بعد از آپلود دوباره
  از خود R2 (`HEAD`) خوانده می‌شود — تنها منبع حقیقت.
* آبجکت‌های `pending`/`failed` هرگز به کاربر نشان داده نمی‌شوند و توسط
  `finalizeImageUpload` در صورت نامعتبر بودن پاک می‌شوند.
