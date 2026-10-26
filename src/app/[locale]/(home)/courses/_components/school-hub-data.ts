import { CARD_IMAGES } from "@/components/blocks/shared/card-images";
import type { Locale } from "@/i18n";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type HubTrackId =
	| "frontend"
	| "backend"
	| "languages"
	| "technical"
	| "life"
	| "school";

export type HubCourseItem = {
	id: string;
	title: string;
	subtitle: string;
	track: HubTrackId;
	categoryLabel: string;
	subLabel: string;
	instructorName: string;
	level: "beginner" | "intermediate" | "advanced" | "all_levels";
	isFree: boolean;
	isFeatured: boolean;
	priceCredits: number;
	lessonsCount: number;
	durationHours: number;
	projectsOrExercises?: string;
	tags: string[];
	rating: number;
	votes: number;
	imageSrc: string;
	href: string;
};

export type LearningPathItem = {
	id: string;
	track: HubTrackId;
	title: string;
	subtitle: string;
	steps: string[];
	courseIds: string[];
	coursesCount: number;
	durationLabel: string;
	accent: "violet" | "sky" | "amber" | "emerald";
};

export type SchoolHubData = {
	courses: HubCourseItem[];
	learningPaths: LearningPathItem[];
};

type LocalizedString = {
	fa: string;
	ps: string;
	en: string;
};

function tr(locale: Locale, value: LocalizedString): string {
	return value[locale] ?? value.fa;
}

function getFallbackLearningPaths(locale: Locale): LearningPathItem[] {
	const paths: {
		id: string;
		track: HubTrackId;
		coursesCount: number;
		accent: "violet" | "sky" | "amber" | "emerald";
		title: LocalizedString;
		subtitle: LocalizedString;
		duration: LocalizedString;
		steps: LocalizedString[];
		courseIds: string[];
	}[] = [
		{
			id: "path-frontend",
			track: "frontend",
			coursesCount: 4,
			courseIds: [
				"fe-html-css-responsive",
				"fe-ui-ux-design-systems",
				"fe-react-nextjs-pro",
				"fe-state-testing-perf",
			],
			accent: "violet",
			title: {
				fa: "مسیر متخصص فرانت‌اند (Front-end)",
				ps: "د فرانت‌انډ پراختیا مسلکي لاره",
				en: "Front-end Web Developer Path",
			},
			subtitle: {
				fa: "از طراحی صفحات واکنش‌گرا تا ساخت وب‌اپلیکیشن‌های کامل با React و Next.js.",
				ps: "له HTML/CSS نیولې تر React او Next.js پورې عملي پروژې.",
				en: "From responsive layouts to full production apps in React & Next.js.",
			},
			duration: { fa: "۸۴ ساعت", ps: "۸۴ ساعته", en: "84 Hours" },
			steps: [
				{ fa: "HTML5 & CSS3", ps: "HTML5 & CSS3", en: "HTML5 & CSS3" },
				{ fa: "طراحی UI/UX", ps: "UI/UX ډیزاین", en: "UI/UX Design" },
				{ fa: "React & Next.js", ps: "React & Next.js", en: "React & Next.js" },
				{
					fa: "آزمون و بهینه‌سازی",
					ps: "ازموینه او چټکتیا",
					en: "Testing & Performance",
				},
			],
		},
		{
			id: "path-backend",
			track: "backend",
			coursesCount: 4,
			courseIds: [
				"be-linux-git-docker",
				"be-nodejs-express-api",
				"be-sql-postgresql-supabase",
				"be-python-django-fastapi",
			],
			accent: "sky",
			title: {
				fa: "مسیر مهندسی بک‌اند و دیتابیس",
				ps: "د بک‌انډ انجنیرۍ او ډیټابیس لاره",
				en: "Back-end & Cloud Engineering Path",
			},
			subtitle: {
				fa: "طراحی سرویس‌های امن، بانک‌های اطلاعاتی SQL و استقرار روی سرور واقعی.",
				ps: "د خوندي API، SQL ډیټابیس او سرور مدیریت زده‌کړه.",
				en: "Design secure REST APIs, relational SQL schemas, and Docker deployments.",
			},
			duration: { fa: "۷۸ ساعت", ps: "۷۸ ساعته", en: "78 Hours" },
			steps: [
				{ fa: "Git & Linux", ps: "Git & Linux", en: "Git & Linux" },
				{
					fa: "Node.js / FastAPI",
					ps: "Node.js / FastAPI",
					en: "Node.js / FastAPI",
				},
				{ fa: "PostgreSQL", ps: "PostgreSQL", en: "PostgreSQL" },
				{ fa: "Docker & امنیت", ps: "Docker او امنیت", en: "Docker & Auth" },
			],
		},
		{
			id: "path-programming",
			track: "languages",
			coursesCount: 4,
			courseIds: [
				"lang-python-zero-to-hero",
				"lang-js-typescript-mastery",
				"lang-cpp-algorithms",
				"lang-flutter-mobile",
			],
			accent: "emerald",
			title: {
				fa: "مسیر زبان‌های برنامه‌نویسی و الگوریتم",
				ps: "د پروګرامینګ ژبو او الګوریتم لاره",
				en: "Programming Languages & Algorithms",
			},
			subtitle: {
				fa: "تسلط بر منطق کدنویسی، ساختمان داده‌ها، پایتون، C++ و توسعه موبایل.",
				ps: "پایتون، جاوااسکریپټ، C++ او د موبایل اپلیکیشن پراختیا.",
				en: "Build rock-solid logic across Python, TypeScript, C++, and Flutter.",
			},
			duration: { fa: "۹۲ ساعت", ps: "۹۲ ساعته", en: "92 Hours" },
			steps: [
				{ fa: "مبانی و پایتون", ps: "پایتون بنسټونه", en: "Python Core" },
				{ fa: "ساختمان داده", ps: "ډیټا سټرکچر", en: "Data Structures" },
				{ fa: "الگوریتم با C++", ps: "الګوریتم C++", en: "Algorithms" },
				{ fa: "اپ موبایل Flutter", ps: "Flutter موبایل", en: "Flutter Mobile" },
			],
		},
		{
			id: "path-career-life",
			track: "technical",
			coursesCount: 8,
			courseIds: [
				"tech-ai-productivity",
				"tech-excel-data-analysis",
				"tech-graphic-design-branding",
				"tech-freelancing-remote-work",
				"life-time-focus-systems",
				"life-public-speaking-communication",
				"life-financial-literacy",
				"life-critical-thinking-english",
			],
			accent: "amber",
			title: {
				fa: "مسیر مهارت‌های فنی، زندگی و بازار کار",
				ps: "د تخنیکي، ژوند او کار بازار مهارتونو لاره",
				en: "Career, Technical & Life Skills Path",
			},
			subtitle: {
				fa: "ترکیب ابزارهای دیجیتال، هوش مصنوعی، فن بیان، زبان و فریلنسینگ.",
				ps: "ډیجیټل وسیلې، مصنوعي ځیرکتیا، وینا هنر او فریلنسینګ.",
				en: "Combine digital tools, AI workflows, communication, and freelancing.",
			},
			duration: { fa: "۶۴ ساعت", ps: "۶۴ ساعته", en: "64 Hours" },
			steps: [
				{ fa: "ابزار و هوش مصنوعی", ps: "AI وسیلې", en: "AI & Digital Tools" },
				{ fa: "طراحی / تحلیل داده", ps: "ډیزاین او ډیټا", en: "Design & Data" },
				{ fa: "فن بیان و انگلیسی", ps: "وینا او انګلیسي", en: "Communication" },
				{ fa: "کسب درآمد و رزومه", ps: "فریلنسینګ", en: "Freelancing" },
			],
		},
		{
			id: "path-life-skills",
			track: "life",
			coursesCount: 4,
			courseIds: [
				"life-time-focus-systems",
				"life-public-speaking-communication",
				"life-financial-literacy",
				"life-critical-thinking-english",
			],
			accent: "violet",
			title: {
				fa: "مسیر رشد فردی و مهارت‌های زندگی",
				ps: "د شخصي ودې او ژوند مهارتونو لار",
				en: "Personal Growth & Life Skills Path",
			},
			subtitle: {
				fa: "مدیریت زمان، ارتباط مؤثر، سواد مالی و تفکر نقاد را گام‌به‌گام بیاموزید.",
				ps: "د وخت مدیریت، اغېزمنې اړیکې، مالي پوهه او انتقادي فکر زده کړئ.",
				en: "Build focus, communication, financial literacy, and critical thinking step by step.",
			},
			duration: { fa: "۴۸ ساعت", ps: "۴۸ ساعته", en: "48 Hours" },
			steps: [
				{ fa: "مدیریت زمان", ps: "د وخت مدیریت", en: "Time Management" },
				{ fa: "فن بیان و ارتباط", ps: "وینا او اړیکې", en: "Communication" },
				{ fa: "سواد مالی", ps: "مالي پوهه", en: "Financial Literacy" },
				{ fa: "تفکر نقاد", ps: "انتقادي فکر", en: "Critical Thinking" },
			],
		},
		{
			id: "path-school-curriculum",
			track: "school",
			coursesCount: 4,
			courseIds: [
				"sch-calculus-12",
				"sch-physics-mechanics",
				"sch-chemistry-organic",
				"sch-biology-genetics",
			],
			accent: "emerald",
			title: {
				fa: "مسیر دروس مکتب و آمادگی کانکور",
				ps: "د ښوونځي مضمونونو او کانکور چمتووالي لار",
				en: "School Curriculum & Kankor Preparation",
			},
			subtitle: {
				fa: "مفاهیم اساسی مضامین اصلی را از ریاضی تا علوم طبیعی با ترتیب روشن بیاموزید.",
				ps: "له ریاضي څخه تر طبیعي علومو پورې د ښوونځي بنسټیز مضمونونه زده کړئ.",
				en: "Strengthen core subjects in a clear sequence, from mathematics to natural sciences.",
			},
			duration: { fa: "۵۶ ساعت", ps: "۵۶ ساعته", en: "56 Hours" },
			steps: [
				{ fa: "ریاضی", ps: "ریاضي", en: "Mathematics" },
				{ fa: "فزیک", ps: "فزیک", en: "Physics" },
				{ fa: "کیمیا", ps: "کیمیا", en: "Chemistry" },
				{ fa: "بیولوژی", ps: "بیولوژي", en: "Biology" },
			],
		},
	];

	return paths.map((p) => ({
		id: p.id,
		track: p.track,
		title: tr(locale, p.title),
		subtitle: tr(locale, p.subtitle),
		steps: p.steps.map((s) => tr(locale, s)),
		courseIds: p.courseIds,
		coursesCount: p.coursesCount,
		durationLabel: tr(locale, p.duration),
		accent: p.accent,
	}));
}

function getFallbackCourses(locale: Locale): HubCourseItem[] {
	const signupHref = routes.auth.signup.page({ type: "student" });

	const specs: {
		id: string;
		track: HubTrackId;
		level: "beginner" | "intermediate" | "advanced" | "all_levels";
		isFree: boolean;
		credits: number;
		lessons: number;
		hours: number;
		rating: number;
		votes: number;
		image: string;
		tags: string[];
		title: LocalizedString;
		subtitle: LocalizedString;
		categoryLabel: LocalizedString;
		subLabel: LocalizedString;
		instructor: LocalizedString;
		projects?: LocalizedString;
		featured?: boolean;
	}[] = [
		// ── 1. FRONT-END DEVELOPMENT ──
		{
			id: "fe-html-css-responsive",
			featured: true,
			track: "frontend",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 48,
			hours: 19,
			rating: 4.9,
			votes: 640,
			image: CARD_IMAGES.frontend,
			tags: ["HTML5", "CSS3", "Flexbox", "Grid"],
			title: {
				fa: "طراحی وب مدرن و واکنش‌گرا با HTML5، CSS3 و Tailwind",
				ps: "له HTML5، CSS3 او Tailwind سره عصري ویب ډیزاین",
				en: "Modern Responsive Web Design with HTML5, CSS3 & Tailwind",
			},
			subtitle: {
				fa: "ساخت ۵ قالب واقعی وب‌سایت از صفر مطلق با اصول چیدمان استاندارد موبایل و دسکتاپ.",
				ps: "له صفر څخه د ۵ اصلي ویب‌پاڼو جوړول د موبایل او ډیسټاپ لپاره.",
				en: "Build 5 responsive real-world websites from scratch with modern CSS.",
			},
			categoryLabel: { fa: "فرانت‌اند", ps: "فرانت‌انډ", en: "Front-end" },
			subLabel: { fa: "۵ پروژه عملی", ps: "۵ عملي پروژې", en: "5 Projects" },
			instructor: {
				fa: "انجنیر فواد سلیمانی",
				ps: "انجنیر فواد سلیماني",
				en: "Eng. Fawad Soleimani",
			},
		},
		{
			id: "fe-react-nextjs-pro",
			track: "frontend",
			level: "intermediate",
			isFree: true,
			credits: 0,
			lessons: 64,
			hours: 28,
			rating: 4.9,
			votes: 512,
			image: CARD_IMAGES.programming,
			tags: ["React 19", "Next.js", "TypeScript"],
			title: {
				fa: "توسعه وب‌اپلیکیشن‌های حرفه‌ای با React 19 و Next.js",
				ps: "له React 19 او Next.js سره د مسلکي ویب اپلیکیشن پراختیا",
				en: "Production Web Applications with React 19, Next.js & TypeScript",
			},
			subtitle: {
				fa: "کامپوننت‌نویسی تمیز، مدیریت وضعیت، رندر سمت سرور، احراز هویت و اتصال به API واقعی.",
				ps: "پاک کوډ، Server Components، احراز هویت او له API سره نښلول.",
				en: "Master components, App Router SSR, state architecture, and API integration.",
			},
			categoryLabel: { fa: "فرانت‌اند", ps: "فرانت‌انډ", en: "Front-end" },
			subLabel: {
				fa: "پروژه فروشگاهی و داشبورد",
				ps: "بشپړه پروژه",
				en: "Full App Lab",
			},
			instructor: {
				fa: "استاد سهراب نادری",
				ps: "استاد سهراب نادري",
				en: "Sohrab Naderi",
			},
		},
		{
			id: "fe-ui-ux-design-systems",
			track: "frontend",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 36,
			hours: 15,
			rating: 4.8,
			votes: 348,
			image: CARD_IMAGES.technicalSkills,
			tags: ["Figma", "UI/UX", "Design System"],
			title: {
				fa: "طراحی رابط و تجربه کاربری (UI/UX) با Figma ویژه برنامه‌نویسان",
				ps: "له Figma سره د UI/UX ډیزاین د پروګرامرانو لپاره",
				en: "Practical UI/UX & Design Systems in Figma for Developers",
			},
			subtitle: {
				fa: "تایپوگرافی فارسی و لاتین، پالت رنگ، وایرفریم و تبدیل طرح Figma به کد دقیق.",
				ps: "رنګونه، ټایپوګرافي، وایرفریم او له Figma نه کوډ ته ژباړه.",
				en: "Color systems, RTL/LTR typography, wireframing, and clean developer handoff.",
			},
			categoryLabel: {
				fa: "طراحی وب و UI",
				ps: "UI/UX ډیزاین",
				en: "UI/UX & Web",
			},
			subLabel: {
				fa: "۳ سیستم طراحی",
				ps: "۳ ډیزاین سیسټمونه",
				en: "3 UI Kits",
			},
			instructor: {
				fa: "استاد نگینه رحیمی",
				ps: "استاده نګینه رحیمي",
				en: "Negina Rahimi",
			},
		},
		{
			id: "fe-state-testing-perf",
			track: "frontend",
			level: "advanced",
			isFree: false,
			credits: 40,
			lessons: 42,
			hours: 18,
			rating: 4.8,
			votes: 229,
			image: CARD_IMAGES.frontend,
			tags: ["TanStack Query", "Testing", "PWA"],
			title: {
				fa: "معماری پیشرفته فرانت‌اند، PWA آفلاین و بهینه‌سازی سرعت",
				ps: "پرمختللی فرانت‌انډ معمارۍ، افلاین PWA او سرعت",
				en: "Advanced Front-end Architecture, Offline PWAs & Web Performance",
			},
			subtitle: {
				fa: "کش هوشمند داده‌ها، کارکرد آفلاین، تست‌نویسی خودکار و Core Web Vitals.",
				ps: "هوښیار کېش، افلاین کار، اتومات ټسټونه او سرعت اصلاح.",
				en: "Data caching, service workers, automated testing, and Core Web Vitals.",
			},
			categoryLabel: {
				fa: "فرانت‌اند پیشرفته",
				ps: "پرمختللی فرانت‌انډ",
				en: "Senior Front-end",
			},
			subLabel: { fa: "گواهینامه تخصصی", ps: "مسلکي بریالیک", en: "Certified" },
			instructor: {
				fa: "انجنیر فواد سلیمانی",
				ps: "انجنیر فواد سلیماني",
				en: "Eng. Fawad Soleimani",
			},
		},

		// ── 2. BACK-END & DATABASES ──
		{
			id: "be-nodejs-express-api",
			featured: true,
			track: "backend",
			level: "intermediate",
			isFree: true,
			credits: 0,
			lessons: 54,
			hours: 24,
			rating: 4.9,
			votes: 476,
			image: CARD_IMAGES.backend,
			tags: ["Node.js", "Express", "JWT", "REST API"],
			title: {
				fa: "برنامه‌نویسی بک‌اند و ساخت REST API امن با Node.js",
				ps: "له Node.js سره د بک‌انډ او خوندي REST API جوړول",
				en: "Back-end Engineering & Secure REST APIs with Node.js",
			},
			subtitle: {
				fa: "احراز هویت JWT، سطح دسترسی نقش‌ها، آپلود فایل، اعتبارسنجی Zod و مدیریت خطا.",
				ps: "JWT امنیت، رولونه، فایل اپلوډ او د سرور بشپړ جوړښت.",
				en: "Authentication, RBAC permissions, Zod validation, queues, and clean architecture.",
			},
			categoryLabel: { fa: "بک‌اند", ps: "بک‌انډ", en: "Back-end" },
			subLabel: {
				fa: "پروژه سامانه واقعی",
				ps: "عملي سرور پروژه",
				en: "API Project",
			},
			instructor: {
				fa: "انجنیر میلاد رحمانی",
				ps: "انجنیر میلاد رحماني",
				en: "Milad Rahmani",
			},
		},
		{
			id: "be-python-django-fastapi",
			track: "backend",
			level: "intermediate",
			isFree: true,
			credits: 0,
			lessons: 50,
			hours: 22,
			rating: 4.9,
			votes: 392,
			image: CARD_IMAGES.programming,
			tags: ["Python", "Django", "FastAPI"],
			title: {
				fa: "توسعه بک‌اند با پایتون — Django و FastAPI کاربردی",
				ps: "پایتون بک‌انډ پراختیا — Django او FastAPI",
				en: "Python Back-end Development with Django & FastAPI",
			},
			subtitle: {
				fa: "ساخت سرویس‌های وب سریع، پنل مدیریت حرفه‌ای، ORM و مستندسازی خودکار OpenAPI.",
				ps: "چټک ویب سرویسونه، اډمین پنل، ORM او اتومات اسناد.",
				en: "Build async microservices, admin dashboards, ORM models, and OpenAPI docs.",
			},
			categoryLabel: {
				fa: "بک‌اند پایتون",
				ps: "پایتون بک‌انډ",
				en: "Python Back-end",
			},
			subLabel: { fa: "۴ سرویس عملی", ps: "۴ عملي سرویسونه", en: "4 Services" },
			instructor: {
				fa: "داکتر سمیرا فرهمند",
				ps: "ډاکټره سمیرا فرهمند",
				en: "Dr. Samira Farahmand",
			},
		},
		{
			id: "be-sql-postgresql-supabase",
			track: "backend",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 38,
			hours: 16,
			rating: 4.8,
			votes: 315,
			image: CARD_IMAGES.backend,
			tags: ["SQL", "PostgreSQL", "Supabase"],
			title: {
				fa: "طراحی دیتابیس رابطه‌ای، SQL پیشرفته و PostgreSQL",
				ps: "د اړیکیز ډیټابیس ډیزاین، پرمختللی SQL او PostgreSQL",
				en: "Relational Database Design, Advanced SQL & PostgreSQL",
			},
			subtitle: {
				fa: "مدل‌سازی جداول، ایندکس‌گذاری، کوئری‌های تحلیلی سریع، امنیت سطری (RLS) و بکاپ.",
				ps: "د جدولونو ډیزاین، انډېکس، ګړندي کوئري او امنیت.",
				en: "Schema normalization, indexing, query tuning, Row-Level Security, and backups.",
			},
			categoryLabel: {
				fa: "دیتابیس و SQL",
				ps: "ډیټابیس او SQL",
				en: "Databases",
			},
			subLabel: {
				fa: "۸۰ تمرین کوئری",
				ps: "۸۰ SQL تمرینونه",
				en: "80 SQL Labs",
			},
			instructor: {
				fa: "انجنیر میلاد رحمانی",
				ps: "انجنیر میلاد رحماني",
				en: "Milad Rahmani",
			},
		},
		{
			id: "be-linux-git-docker",
			track: "backend",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 32,
			hours: 14,
			rating: 4.8,
			votes: 284,
			image: CARD_IMAGES.technicalSkills,
			tags: ["Git", "Linux", "Docker", "CI/CD"],
			title: {
				fa: "لینوکس، Git، گیت‌هاب و استقرار پروژه با Docker",
				ps: "لینوکس، Git، ګیټ‌هاب او له Docker سره خپرول",
				en: "Linux CLI, Git Workflows, Docker & Cloud Deployment",
			},
			subtitle: {
				fa: "مهارت‌های ضروری هر برنامه‌نویس برای کار تیمی، مدیریت سرور لینوکس و انتشار خودکار.",
				ps: "د ډله‌ییز کار، لینوکس سرور او اتومات خپرولو اړین مهارتونه.",
				en: "Essential developer tooling: shell scripting, Git team workflows, and Docker.",
			},
			categoryLabel: {
				fa: "زیرساخت و DevOps",
				ps: "سرور او DevOps",
				en: "DevOps Basics",
			},
			subLabel: {
				fa: "کارگاه عملی سرور",
				ps: "عملي لابراتوار",
				en: "Cloud Lab",
			},
			instructor: {
				fa: "استاد حامد نوری",
				ps: "استاد حامد نوري",
				en: "Hamed Noori",
			},
		},

		// ── 3. PROGRAMMING LANGUAGES ──
		{
			id: "lang-python-zero-to-hero",
			featured: true,
			track: "languages",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 56,
			hours: 23,
			rating: 4.9,
			votes: 820,
			image: CARD_IMAGES.programming,
			tags: ["Python 3", "OOP", "Automation"],
			title: {
				fa: "زبان پایتون (Python) از صفر مطلق تا شیءگرایی و پروژه‌های کاربردی",
				ps: "پایتون ژبه له صفر څخه تر عملي پروژو پورې",
				en: "Complete Python Programming: From Zero to Real-World Projects",
			},
			subtitle: {
				fa: "بهترین نقطه شروع برنامه‌نویسی بدون هیچ پیش‌نیاز همراه با ۱۰۰ تمرین کدنویسی.",
				ps: "پرته له کومې مخکینۍ پوهې له ۱۰۰ تمرینونو سره د کوډینګ پیل.",
				en: "Start coding from zero with 100 interactive exercises and practical scripts.",
			},
			categoryLabel: {
				fa: "زبان برنامه‌نویسی",
				ps: "پروګرامینګ ژبه",
				en: "Language",
			},
			subLabel: {
				fa: "۱۰۰ تمرین کدنویسی",
				ps: "۱۰۰ کوډ تمرینونه",
				en: "100 Exercises",
			},
			instructor: {
				fa: "داکتر سمیرا فرهمند",
				ps: "ډاکټره سمیرا فرهمند",
				en: "Dr. Samira Farahmand",
			},
		},
		{
			id: "lang-js-typescript-mastery",
			track: "languages",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 52,
			hours: 21,
			rating: 4.9,
			votes: 590,
			image: CARD_IMAGES.frontend,
			tags: ["JavaScript", "TypeScript", "Async"],
			title: {
				fa: "جاوااسکریپت مدرن و TypeScript از پایه تا پیشرفته",
				ps: "عصري جاوااسکریپټ او TypeScript له بنسټه تر پرمختللي",
				en: "Modern JavaScript & TypeScript Deep Dive",
			},
			subtitle: {
				fa: "تسلط کامل بر DOM، برنامه‌نویسی ناهمگام (Async/Await)، تایپ‌سیستم قوی و الگوهای طراحی.",
				ps: "DOM، Async/Await، قوي ټایپ سیسټم او ډیزاین نمونې.",
				en: "Master closures, async/await, generics, strict typing, and clean code patterns.",
			},
			categoryLabel: {
				fa: "زبان برنامه‌نویسی",
				ps: "پروګرامینګ ژبه",
				en: "Language",
			},
			subLabel: {
				fa: "فرانت و بک‌اند",
				ps: "ویب او سرور",
				en: "Full-Stack Core",
			},
			instructor: {
				fa: "استاد سهراب نادری",
				ps: "استاد سهراب نادري",
				en: "Sohrab Naderi",
			},
		},
		{
			id: "lang-cpp-algorithms",
			track: "languages",
			level: "intermediate",
			isFree: true,
			credits: 0,
			lessons: 46,
			hours: 20,
			rating: 4.8,
			votes: 410,
			image: CARD_IMAGES.backend,
			tags: ["C++20", "Data Structures", "Algorithms"],
			title: {
				fa: "برنامه‌نویسی C++، ساختمان داده‌ها و طراحی الگوریتم",
				ps: "C++ پروګرامینګ، ډیټا سټرکچر او الګوریتمونه",
				en: "C++ Programming, Data Structures & Algorithmic Thinking",
			},
			subtitle: {
				fa: "پایه علمی کمپیوتر ساینس، مدیریت حافظه، گراف، درخت، مرتب‌سازی و حل مسایل المپیادی.",
				ps: "د کمپیوټر ساینس بنسټ، حافظه، ونې، ګرافونه او الګوریتمیک حل.",
				en: "Core computer science fundamentals: memory, trees, graphs, and problem solving.",
			},
			categoryLabel: {
				fa: "علوم کامپیوتر",
				ps: "کمپیوټر ساینس",
				en: "CS Core",
			},
			subLabel: {
				fa: "۹۰ مسأله الگوریتمی",
				ps: "۹۰ الګوریتمي مسایل",
				en: "90 Problems",
			},
			instructor: {
				fa: "استاد فرهاد بهرامی",
				ps: "استاد فرهاد بهرامي",
				en: "Farhad Bahrami",
			},
		},
		{
			id: "lang-flutter-mobile",
			track: "languages",
			level: "intermediate",
			isFree: false,
			credits: 35,
			lessons: 48,
			hours: 22,
			rating: 4.8,
			votes: 334,
			image: CARD_IMAGES.programming,
			tags: ["Dart", "Flutter", "Android & iOS"],
			title: {
				fa: "ساخت اپلیکیشن موبایل اندروید و iOS با زبان Dart و Flutter",
				ps: "له Dart او Flutter سره د اندروید او iOS موبایل اپ جوړول",
				en: "Cross-Platform Mobile App Development with Dart & Flutter",
			},
			subtitle: {
				fa: "طراحی رابط موبایل روان، ذخیره‌سازی آفلاین SQLite و انتشار اپلیکیشن در Google Play.",
				ps: "ښکلی موبایل ډیزاین، افلاین ډیټابیس او په Google Play کې خپرول.",
				en: "Build smooth native-speed mobile apps with offline storage and Play Store release.",
			},
			categoryLabel: {
				fa: "برنامه‌نویسی موبایل",
				ps: "موبایل پراختیا",
				en: "Mobile Dev",
			},
			subLabel: {
				fa: "۳ اپلیکیشن کامل",
				ps: "۳ بشپړ اپونه",
				en: "3 Mobile Apps",
			},
			instructor: {
				fa: "استاد حامد نوری",
				ps: "استاد حامد نوري",
				en: "Hamed Noori",
			},
		},

		// ── 4. TECHNICAL & CAREER SKILLS ──
		{
			id: "tech-ai-productivity",
			featured: true,
			track: "technical",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 28,
			hours: 11,
			rating: 4.9,
			votes: 715,
			image: CARD_IMAGES.technicalSkills,
			tags: ["AI Tools", "Prompting", "Automation"],
			title: {
				fa: "هوش مصنوعی کاربردی، مهندسی پرامپت و خودکارسازی کارهای روزمره",
				ps: "کاربردي مصنوعي ځیرکتیا، پرامپټ لیکل او کاري چټکتیا",
				en: "Applied AI Workflows, Prompt Engineering & Research Productivity",
			},
			subtitle: {
				fa: "استفاده حرفه‌ای و اصولی از ابزارهای هوش مصنوعی در پژوهش علمی، کدنویسی، ترجمه و تولید محتوا.",
				ps: "په څېړنه، کوډینګ او منځپانګه کې له AI وسیلو مسلکي ګټه اخیستنه.",
				en: "Use modern AI tools responsibly for research, coding, writing, and workflows.",
			},
			categoryLabel: {
				fa: "مهارت فنی و دیجیتال",
				ps: "ډیجیټل مهارت",
				en: "Digital Skill",
			},
			subLabel: { fa: "پروژه‌محور", ps: "عملي کارکشاپ", en: "Hands-on" },
			instructor: {
				fa: "داکتر سمیرا فرهمند",
				ps: "ډاکټره سمیرا فرهمند",
				en: "Dr. Samira Farahmand",
			},
		},
		{
			id: "tech-excel-data-analysis",
			track: "technical",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 34,
			hours: 14,
			rating: 4.8,
			votes: 462,
			image: CARD_IMAGES.generalLibrary,
			tags: ["Excel", "Pivot Table", "Dashboards"],
			title: {
				fa: "اکسل پیشرفته، گزارش‌گیری مالی و ساخت داشبوردهای تحلیلی",
				ps: "پرمختللی اکسل، مالي راپورونه او تحلیلي ډشبورډونه",
				en: "Advanced Excel, Financial Modeling & Interactive Dashboards",
			},
			subtitle: {
				fa: "توابع کلیدی اداری و حسابداری، Pivot Table، نمودارهای پویا و تمیزکاری داده‌ها.",
				ps: "مهمې اداري او مالي فورمولې، Pivot Table او متحرک چارتونه.",
				en: "Master lookup formulas, PivotTables, data cleaning, and executive charts.",
			},
			categoryLabel: {
				fa: "مهارت فنی و اداری",
				ps: "اداري مهارت",
				en: "Office & Data",
			},
			subLabel: {
				fa: "فایل‌های تمرینی واقعی",
				ps: "عملي فایلونه",
				en: " spreadsheets",
			},
			instructor: {
				fa: "استاد تمیم حسینی",
				ps: "استاد تمیم حسیني",
				en: "Tamim Hosseini",
			},
		},
		{
			id: "tech-graphic-design-branding",
			track: "technical",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 40,
			hours: 16,
			rating: 4.8,
			votes: 388,
			image: CARD_IMAGES.technicalSkills,
			tags: ["Graphic Design", "Typography", "Branding"],
			title: {
				fa: "طراحی گرافیک، هویت بصری برند و تولید محتوای حرفه‌ای",
				ps: "ګرافیک ډیزاین، د برانډ پیژندنه او مسلکي منځپانګه",
				en: "Graphic Design Principles, Brand Identity & Visual Content",
			},
			subtitle: {
				fa: "اصول ترکیب‌بندی، رنگ‌شناسی، طراحی پوستر، لوگو و کاور شبکه‌های اجتماعی با نمونه‌کار واقعی.",
				ps: "کمپوزیشن، رنګ‌پوهنه، لوګو او د ټولنیزو رسنیو مسلکي ډیزاین.",
				en: "Layout hierarchy, color theory, poster design, and portfolio-ready branding.",
			},
			categoryLabel: {
				fa: "طراحی و هنر دیجیتال",
				ps: "ګرافیک ډیزاین",
				en: "Design",
			},
			subLabel: {
				fa: "۸ پروژه نمونه‌کار",
				ps: "۸ پورټفولیو پروژې",
				en: "8 Portfolio Pieces",
			},
			instructor: {
				fa: "استاد نگینه رحیمی",
				ps: "استاده نګینه رحیمي",
				en: "Negina Rahimi",
			},
		},
		{
			id: "tech-freelancing-remote-work",
			track: "technical",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 26,
			hours: 10,
			rating: 4.9,
			votes: 530,
			image: CARD_IMAGES.lifeSkills,
			tags: ["Freelancing", "Portfolio", "Remote Work"],
			title: {
				fa: "فریلنسینگ، کار از راه دور (Remote) و ساخت پروفایل حرفه‌ای",
				ps: "فریلنسینګ، ریموټ کار او مسلکي پروفایل جوړول",
				en: "Freelancing, Remote Careers & Building a Winning Portfolio",
			},
			subtitle: {
				fa: "انتخاب مهارت پول‌ساز، ساخت نمونه‌کار قوی، نگارش پروپوزال، قیمت‌گذاری و مدیریت کارفرما.",
				ps: "د پورټفولیو جوړول، پروپوزل لیکل، بیه ټاکل او له مراجعینو سره اړیکه.",
				en: "Position your skills, write winning proposals, price projects, and work remotely.",
			},
			categoryLabel: {
				fa: "بازار کار دیجیتال",
				ps: "کار بازار",
				en: "Career Skill",
			},
			subLabel: {
				fa: "قالب رزومه و قرارداد",
				ps: "چمتو ټیمپلیټونه",
				en: "Templates Included",
			},
			instructor: {
				fa: "استاد تمیم حسینی",
				ps: "استاد تمیم حسیني",
				en: "Tamim Hosseini",
			},
		},

		// ── 5. LIFE & PERSONAL DEVELOPMENT SKILLS ──
		{
			id: "life-time-focus-systems",
			featured: true,
			track: "life",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 24,
			hours: 9,
			rating: 4.9,
			votes: 690,
			image: CARD_IMAGES.lifeSkills,
			tags: ["مدیریت زمان", "تمرکز عمیق", "عادت‌سازی"],
			title: {
				fa: "مدیریت زمان، تمرکز عمیق و غلبه بر اهمال‌کاری",
				ps: "د وخت مدیریت، ژور تمرکز او له ځنډولو خلاصون",
				en: "Time Management, Deep Focus & Overcoming Procrastination",
			},
			subtitle: {
				fa: "ساخت سیستم برنامه‌ریزی واقع‌بینانه روزانه برای درس، کار و رشد فردی بدون فرسودگی.",
				ps: "د درس، کار او شخصي ودې لپاره د ورځني پلان عملي سیستم.",
				en: "Build sustainable daily routines for study, work, and calm high output.",
			},
			categoryLabel: {
				fa: "مهارت‌های زندگی",
				ps: "د ژوند مهارتونه",
				en: "Life Skills",
			},
			subLabel: {
				fa: "دفترچه برنامه‌ریزی",
				ps: "عملي پلانر",
				en: "Action Workbook",
			},
			instructor: {
				fa: "استاد فرشته نیازی",
				ps: "استاده فرشته نیازۍ",
				en: "Fereshta Niazi",
			},
		},
		{
			id: "life-public-speaking-communication",
			track: "life",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 28,
			hours: 11,
			rating: 4.9,
			votes: 545,
			image: CARD_IMAGES.lifeSkills,
			tags: ["فن بیان", "اعتمادبه‌نفس", "مذاکره"],
			title: {
				fa: "فن بیان، سخنرانی مؤثر، زبان بدن و اعتمادبه‌نفس در جمع",
				ps: "د وینا هنر، اغېزمنه مفاهمه او پر ځان باور",
				en: "Confident Public Speaking, Persuasion & Everyday Communication",
			},
			subtitle: {
				fa: "غلبه بر استرس صحبت در جمع، ساختاردهی پیامی روشن، گفتگوی محترمانه و ارائه دانشگاهی و کاری.",
				ps: "په غونډو کې له وېرې پرته خبرې، روښانه بیان او مسلکي پریزنټیشن.",
				en: "Speak with clarity in classrooms, interviews, meetings, and presentations.",
			},
			categoryLabel: {
				fa: "مهارت ارتباطی",
				ps: "د اړیکو مهارت",
				en: "Communication",
			},
			subLabel: {
				fa: "تمرین‌های عملی بیان",
				ps: "عملي تمرینونه",
				en: "Speaking Drills",
			},
			instructor: {
				fa: "استاد فرشته نیازی",
				ps: "استاده فرشته نیازۍ",
				en: "Fereshta Niazi",
			},
		},
		{
			id: "life-financial-literacy",
			track: "life",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 22,
			hours: 8,
			rating: 4.8,
			votes: 412,
			image: CARD_IMAGES.generalLibrary,
			tags: ["سواد مالی", "بودجه‌بندی", "پس‌انداز"],
			title: {
				fa: "سواد مالی شخصی، مدیریت درآمد، پس‌انداز و تصمیم‌گیری اقتصادی",
				ps: "شخصي مالي پوهه، د عاید مدیریت او سپما",
				en: "Personal Financial Literacy, Budgeting & Smart Money Habits",
			},
			subtitle: {
				fa: "اصول عملی مدیریت خرج و دخل ماهانه، صندوق اضطراری، پرهیز از بدهی و برنامه‌ریزی مالی آینده.",
				ps: "د میاشتنۍ بودیجې تنظیم، سپما او راتلونکی مالي پلان.",
				en: "Practical monthly budgeting, emergency funds, and responsible financial planning.",
			},
			categoryLabel: {
				fa: "مهارت‌های زندگی",
				ps: "د ژوند مهارتونه",
				en: "Life Skills",
			},
			subLabel: {
				fa: "جدول بودجه شخصی",
				ps: "د بودیجې جدول",
				en: "Budget Sheet",
			},
			instructor: {
				fa: "استاد تمیم حسینی",
				ps: "استاد تمیم حسیني",
				en: "Tamim Hosseini",
			},
		},
		{
			id: "life-critical-thinking-english",
			track: "life",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 36,
			hours: 15,
			rating: 4.8,
			votes: 498,
			image: CARD_IMAGES.languages,
			tags: ["انگلیسی کاربردی", "تفکر نقادانه", "نگارش"],
			title: {
				fa: "انگلیسی کاربردی، مکاتبه رسمی و تفکر نقادانه برای دانشگاه و کار",
				ps: "کاربردي انګلیسي، رسمي لیکنه او انتقادي فکر",
				en: "Academic & Career English, Email Writing & Critical Thinking",
			},
			subtitle: {
				fa: "تقویت دایره واژگان کاربردی، ایمیل‌نویسی حرفه‌ای، درک متون علمی و تحلیل منطقی موضوعات.",
				ps: "مسلکي ایمیل لیکل، د علمي متنونو پوهه او منطقي تحلیل.",
				en: "Write clear professional emails, read academic texts, and reason structuredly.",
			},
			categoryLabel: {
				fa: "زبان و مهارت فردی",
				ps: "ژبه او مهارت",
				en: "Language & Thinking",
			},
			subLabel: {
				fa: "مکالمه + نگارش",
				ps: "خبرې او لیکل",
				en: "Speaking & Writing",
			},
			instructor: {
				fa: "استاد زلمی مهمند",
				ps: "استاد زلمی مومند",
				en: "Zalmai Mohmand",
			},
		},

		// ── 6. SCHOOL CURRICULUM & KANKOR ──
		{
			id: "sch-calculus-12",
			featured: true,
			track: "school",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 42,
			hours: 18,
			rating: 4.9,
			votes: 1840,
			image: CARD_IMAGES.math,
			tags: ["صنف دوازدهم", "لمت و مشتق", "انتیگرال"],
			title: {
				fa: "ریاضی عالی صنف دوازدهم — لمت، مشتق، انتیگرال و کانکور",
				ps: "د دولسم ټولګي عالي ریاضي — لېمېټ، مشتق او انتیګرال",
				en: "Grade 12 Calculus — Limits, Derivatives, Integrals & Kankor",
			},
			subtitle: {
				fa: "تدریس کامل نصاب رسمی معارف به همراه تکنیک‌های حل سریع سوالات چهارگزینه‌ای کانکور.",
				ps: "د دولسم ټولګي بشپړ درسي نصاب د کانکور پوښتنو له چټک حل سره.",
				en: "Complete curriculum mastery paired with rapid Kankor exam problem-solving.",
			},
			categoryLabel: {
				fa: "ریاضیات مکتب",
				ps: "د ښوونځي ریاضي",
				en: "School Math",
			},
			subLabel: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			instructor: {
				fa: "استاد احمد رشاد نادری",
				ps: "استاد احمد رشاد نادري",
				en: "Prof. Ahmad Rashad Naderi",
			},
		},
		{
			id: "sch-physics-mechanics",
			track: "school",
			level: "intermediate",
			isFree: true,
			credits: 0,
			lessons: 36,
			hours: 15,
			rating: 4.8,
			votes: 1490,
			image: CARD_IMAGES.physics,
			tags: ["صنف ۱۱ و ۱۲", "میخانیک", "برق و مقناطیس"],
			title: {
				fa: "فزیک دوره لیسه — میخانیک، امواج، نور و برق مقناطیس",
				ps: "د لېسې دورې فزیک — میخانیک، څپې او برېښنا مقناطیس",
				en: "High-School Physics — Mechanics, Waves & Electromagnetism",
			},
			subtitle: {
				fa: "آموزش مفهومی روابط فزیکی و حل گام‌به‌گام مسایل عددی امتحانات مکتب و کانکور.",
				ps: "د فزیکي فورمولونو او عددي مسایلو روښانه تشریح.",
				en: "Clear conceptual physics and numerical problem drills across Grades 11–12.",
			},
			categoryLabel: {
				fa: "فزیک مکتب",
				ps: "د ښوونځي فزیک",
				en: "School Physics",
			},
			subLabel: {
				fa: "صنف یازدهم و دوازدهم",
				ps: "۱۱ او ۱۲ ټولګی",
				en: "Grade 11–12",
			},
			instructor: {
				fa: "استاد مریم سادات هاشمی",
				ps: "استاده مریم سادات هاشمي",
				en: "Maryam Sadat Hashemi",
			},
		},
		{
			id: "sch-chemistry-organic",
			track: "school",
			level: "all_levels",
			isFree: true,
			credits: 0,
			lessons: 34,
			hours: 14,
			rating: 4.9,
			votes: 1320,
			image: CARD_IMAGES.chemistry,
			tags: ["صنف دوازدهم", "کیمیای عضوی", "جدول تناوبی"],
			title: {
				fa: "کیمیای عضوی و غیرعضوی جامع دوره لیسه و کانکور",
				ps: "د لېسې او کانکور جامع عضوي او غیرعضوي کیمیا",
				en: "Comprehensive Organic & Inorganic Chemistry for High School",
			},
			subtitle: {
				fa: "مرکبات عضوی، تعاملات کیمیاوی، استوکیومتری و محلول‌ها با دسته‌بندی تصویری.",
				ps: "عضوي مرکبات، کیمیاوي تعاملات او محلولونه په اسانه بڼه.",
				en: "Hydrocarbons, functional groups, stoichiometry, and reaction mechanisms.",
			},
			categoryLabel: {
				fa: "کیمیا مکتب",
				ps: "د ښوونځي کیمیا",
				en: "School Chemistry",
			},
			subLabel: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			instructor: {
				fa: "استاد حسیب‌الله کریمی",
				ps: "استاد حسیب الله کریمي",
				en: "Hasibullah Karimi",
			},
		},
		{
			id: "sch-biology-genetics",
			track: "school",
			level: "beginner",
			isFree: true,
			credits: 0,
			lessons: 30,
			hours: 12,
			rating: 4.8,
			votes: 1610,
			image: CARD_IMAGES.biology,
			tags: ["صنف ۱۰ تا ۱۲", "جنتیک", "فیزیولوژی"],
			title: {
				fa: "بیولوژی حجروی، جنتیک و سیستم‌های بدن ویژه داوطلبان طب",
				ps: "حجروي بیولوژي، جنتیک او د بدن سیستمونه",
				en: "Cell Biology, Genetics & Human Systems for Pre-Med Students",
			},
			subtitle: {
				fa: "پوشش کامل نکات حفظی و مفهومی بیولوژی صنف دهم تا دوازدهم همراه با تست‌های طب.",
				ps: "د لسم نه تر دولسم ټولګي پورې د بیولوژي بشپړ پوښښ.",
				en: "Complete Grade 10–12 biology review tailored for medical faculty applicants.",
			},
			categoryLabel: {
				fa: "بیولوژی مکتب",
				ps: "د ښوونځي بیولوژي",
				en: "School Biology",
			},
			subLabel: {
				fa: "صنف دهم تا دوازدهم",
				ps: "۱۰ تر ۱۲ ټولګی",
				en: "Grade 10–12",
			},
			instructor: {
				fa: "داکتر نیلوفر رحیمی",
				ps: "ډاکټره نیلوفر رحیمي",
				en: "Dr. Nilofar Rahimi",
			},
		},
	];

	return specs.map((item) => ({
		id: item.id,
		title: tr(locale, item.title),
		subtitle: tr(locale, item.subtitle),
		track: item.track,
		categoryLabel: tr(locale, item.categoryLabel),
		subLabel: tr(locale, item.subLabel),
		instructorName: tr(locale, item.instructor),
		level: item.level,
		isFree: item.isFree,
		isFeatured: Boolean(item.featured),
		priceCredits: item.credits,
		lessonsCount: item.lessons,
		durationHours: item.hours,
		tags: item.tags,
		rating: item.rating,
		votes: item.votes,
		imageSrc: item.image,
		href: signupHref,
	}));
}

function inferTrackFromTitle(
	title: string,
	gradeId: string | null | undefined
): HubTrackId {
	const t = title.toLowerCase();
	if (/فرانت|frontend|react|next|html|css|ui/.test(t)) return "frontend";
	if (/بک‌اند|بک اند|backend|node|django|fastapi|sql|docker/.test(t))
		return "backend";
	if (/python|پایتون|javascript|c\+\+|java|flutter|برنامه‌نویسی|کدنویسی/.test(t))
		return "languages";
	if (/گرافیک|اکسل|excel|figma|شبکه|فریلنس|هوش مصنوعی|ai/.test(t))
		return "technical";
	if (/زندگی|فن بیان|مدیریت زمان|سواد مالی|ارتباط/.test(t)) return "life";
	if (gradeId) return "school";
	return "technical";
}

function isPlaceholderSupabase(): boolean {
	const url = serverEnv.supabase.url;
	return (
		!url || url.includes("demo.invalid") || url.includes("example.invalid")
	);
}

/**
 * Loads only publicly published courses and their curated learning paths.
 */
export async function getSchoolHubData(locale: Locale): Promise<SchoolHubData> {
	const fallbackCourses = getFallbackCourses(locale);
	const learningPaths = getFallbackLearningPaths(locale);

	if (isPlaceholderSupabase()) {
		return { courses: fallbackCourses, learningPaths };
	}

	try {
		const supabase = await createClient();
		const { data } = await supabase
			.from("courses")
			.select(
				"id, slug, title, subtitle, cover_image_url, level, is_free, price_credits, estimated_duration_hours, average_rating, total_reviews, grade_id, instructor_id, grade:grades(id, name), subject:subjects(name), instructor:profiles!courses_instructor_id_fkey(full_name, role)"
			)
			.eq("is_published", true)
			.eq("visibility", "public")
			.order("created_at", { ascending: false })
			.limit(24);

		const eligibleRows = (data ?? []).filter((row) => {
			const instructor = Array.isArray(row.instructor)
				? row.instructor[0]
				: row.instructor;
			return (
				!row.instructor_id ||
				instructor?.role === "instructor" ||
				instructor?.role === "admin"
			);
		});

		const publishedCourses: HubCourseItem[] = eligibleRows.map((row) => {
			const subject = Array.isArray(row.subject) ? row.subject[0] : row.subject;
			const grade = Array.isArray(row.grade) ? row.grade[0] : row.grade;
			const instructor = Array.isArray(row.instructor)
				? row.instructor[0]
				: row.instructor;
			const track = inferTrackFromTitle(row.title, row.grade_id);

			return {
				id: row.id,
				title: row.title,
				subtitle: row.subtitle ?? "",
				track,
				isFeatured: false,
				categoryLabel:
					subject?.name ??
					tr(locale, {
						fa: "دوره آموزشی",
						ps: "زده‌کړیز کورس",
						en: "Course",
					}),
				subLabel:
					grade?.name ??
					tr(locale, {
						fa: "همه سطوح",
						ps: "ټولې کچې",
						en: "All Levels",
					}),
				instructorName:
					row.instructor_id && instructor?.role === "instructor"
						? (instructor.full_name ??
							tr(locale, {
								fa: "تیم آموزشی ابزار کانکور",
								ps: "د ابزار کانکور ښوونیز ټیم",
								en: "Abzar Kankor Learning Team",
							}))
						: tr(locale, {
								fa: "تیم آموزشی ابزار کانکور",
								ps: "د ابزار کانکور ښوونیز ټیم",
								en: "Abzar Kankor Learning Team",
							}),
				level: row.level ?? "all_levels",
				isFree: Boolean(row.is_free),
				priceCredits: row.price_credits ?? 0,
				lessonsCount: 24,
				durationHours: row.estimated_duration_hours ?? 12,
				tags: [subject?.name, grade?.name].filter((value): value is string =>
					Boolean(value)
				),
				rating:
					row.average_rating && row.average_rating > 0
						? row.average_rating
						: 4.9,
				votes: row.total_reviews > 0 ? row.total_reviews : 0,
				imageSrc: row.cover_image_url ?? "",
				href: routes.courses.slug.page({ slug: row.slug ?? row.id }),
			};
		});

		if (publishedCourses.length === 0) {
			return { courses: fallbackCourses, learningPaths };
		}

		const featuredCourseIds = new Set(
			[...publishedCourses]
				.sort((a, b) => b.rating - a.rating || b.votes - a.votes)
				.slice(0, Math.min(6, publishedCourses.length))
				.map((course) => course.id)
		);

		return {
			courses: publishedCourses.map((course) => ({
				...course,
				isFeatured: featuredCourseIds.has(course.id),
			})),
			learningPaths,
		};
	} catch {
		return { courses: fallbackCourses, learningPaths };
	}
}
