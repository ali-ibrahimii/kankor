import type { QuizCatalogFallbackEntry } from "@/components/blocks/quizzes/quiz-catalog";
import { CARD_IMAGES } from "@/components/blocks/shared/card-images";
import type { Locale } from "@/i18n";
import { routes } from "@/lib/routes";

type Localized = { fa: string; ps: string; en: string };

function pick(locale: Locale, text: Localized): string {
	return text[locale] ?? text.fa;
}

const DEMO_CREATED_AT = "2026-01-15T08:00:00.000Z";

/**
 * Curated Kankor mock exams and subject quizzes displayed only when Supabase
 * is not configured (local preview / demo environment), mirroring HomeContent
 * and SchoolHubView.
 */
export function getFallbackQuizzes(locale: Locale): QuizCatalogFallbackEntry[] {
	const signupHref = routes.auth.signup.page({ type: "student" });

	const specs: {
		id: string;
		cover: string;
		minutes: number;
		passing: number;
		attempts: number | null;
		isFree: boolean;
		credits: number;
		rating: number;
		votes: number;
		zone: Localized;
		title: Localized;
		desc: Localized;
	}[] = [
		{
			id: "kankor-form-kabul-1",
			cover: CARD_IMAGES.kankorExam,
			minutes: 180,
			passing: 60,
			attempts: 3,
			isFree: true,
			credits: 0,
			rating: 4.9,
			votes: 640,
			zone: { fa: "کابل", ps: "کابل", en: "Kabul" },
			title: {
				fa: "فورم عمومی کانکور ولایت کابل — دور اول",
				ps: "د کابل ولایت د کانکور عمومي فورم — لومړی پړاو",
				en: "Kabul General Kankor Exam Form — Round 1",
			},
			desc: {
				fa: "شبیه‌ساز کامل ۱۶۰ سوالی شامل ریاضیات، علوم طبیعی، علوم اجتماعی و السنه با نمره‌دهی دقیق.",
				ps: "بشپړ ۱۶۰ پوښتنې لرونکی معیاري فورم له دقیقې نمرې ورکونې سره.",
				en: "Full 160-question simulation across Mathematics, Natural Sciences, Humanities, and Languages.",
			},
		},
		{
			id: "kankor-form-herat-1",
			cover: CARD_IMAGES.math,
			minutes: 180,
			passing: 60,
			attempts: 3,
			isFree: true,
			credits: 0,
			rating: 4.9,
			votes: 510,
			zone: { fa: "هرات", ps: "هرات", en: "Herat" },
			title: {
				fa: "فورم عمومی کانکور ولایت هرات — معیاری",
				ps: "د هرات ولایت د کانکور معیاري عمومي فورم",
				en: "Herat Provincial General Kankor Form",
			},
			desc: {
				fa: "سوالات واقعی دسته‌بندی‌شده به همراه پاسخ‌نامه تشریحی و تحلیل نقاط قوت و ضعف.",
				ps: "اصلي طبقه بندي شوې پوښتنې له تشریحي ځوابونو او بشپړ تحلیل سره.",
				en: "Authentic provincial exam questions with structured topic coverage and instant scoring.",
			},
		},
		{
			id: "kankor-form-balkh-1",
			cover: CARD_IMAGES.physics,
			minutes: 180,
			passing: 60,
			attempts: 2,
			isFree: false,
			credits: 8,
			rating: 4.8,
			votes: 430,
			zone: { fa: "بلخ", ps: "بلخ", en: "Balkh" },
			title: {
				fa: "فورم عمومی کانکور ولایت بلخ — شبیه‌ساز جامع",
				ps: "د بلخ ولایت د کانکور عمومي ازموینې فورم",
				en: "Balkh Provincial General Kankor Mock Exam",
			},
			desc: {
				fa: "امتحان زمان‌بندی‌شده ۳ ساعته مطابق ساختار رسمی اداره ملی امتحانات.",
				ps: "د ازموینو ملي ادارې له معیار سره سم درې ساعته وخت لرونکې ازموینه.",
				en: "Timed 3-hour simulation matching the official National Examinations Authority structure.",
			},
		},
		{
			id: "kankor-form-natural-sciences",
			cover: CARD_IMAGES.biology,
			minutes: 90,
			passing: 70,
			attempts: 3,
			isFree: true,
			credits: 0,
			rating: 4.9,
			votes: 585,
			zone: { fa: "علوم طبیعی", ps: "طبیعي علوم", en: "Sciences" },
			title: {
				fa: "آزمون موضوعی علوم طبیعی (کیمیا، بیولوژی و فزیک)",
				ps: "د طبیعي علومو ځانګړې موضوعي ازموینه",
				en: "Natural Sciences Intensive Practice Quiz",
			},
			desc: {
				fa: "۸۰ سوال منتخب با ضریب بالا ویژه داوطلبان پوهنځی‌های طب معالجوی، ستوماتولوژی و فارمسی.",
				ps: "د طب، ستوماتولوژي او فارمسي نوماندانو لپاره ۸۰ غوره پوښتنې.",
				en: "80 high-weight questions designed for Medicine, Stomatology, and Pharmacy applicants.",
			},
		},
		{
			id: "kankor-form-engineering-math",
			cover: CARD_IMAGES.schoolBooks,
			minutes: 90,
			passing: 65,
			attempts: 3,
			isFree: true,
			credits: 0,
			rating: 4.8,
			votes: 470,
			zone: { fa: "ریاضیات", ps: "ریاضیات", en: "Mathematics" },
			title: {
				fa: "آزمون اختصاصی ریاضیات عالی و منطق انجنیری",
				ps: "د عالي ریاضیاتو او انجنیرۍ ځانګړی فورم",
				en: "Advanced Mathematics & Engineering Drill",
			},
			desc: {
				fa: "تمرین فشرده الجبر، هندسه تحلیلی، مثلثات، لمت و انتیگرال با زمان‌بندی استاندارد.",
				ps: "الجبر، تحلیلي هندسه، مثلثات او ډیفرانسیل حساب په معیاري وخت کې.",
				en: "Focused timed drill in algebra, analytic geometry, trigonometry, limits, and calculus.",
			},
		},
		{
			id: "kankor-quiz-chemistry-organic",
			cover: CARD_IMAGES.chemistry,
			minutes: 45,
			passing: 65,
			attempts: 4,
			isFree: true,
			credits: 0,
			rating: 4.8,
			votes: 325,
			zone: { fa: "کیمیا", ps: "کیمیا", en: "Chemistry" },
			title: {
				fa: "آزمون فصل‌بندی کیمیای عضوی و محلول‌ها — صنف ۱۲",
				ps: "د دولسم ټولګي عضوي کیمیا او محلولونو ازموینه",
				en: "Grade 12 Organic Chemistry & Solutions Quiz",
			},
			desc: {
				fa: "سوالات چهارگزینه‌ای از هایدروکاربن‌ها، الکول‌ها، تیزاب‌ها و محاسبات غلظت محلول.",
				ps: "د هایدروکاربنونو، الکولونو او محلولونو د غلظت څلورځوابه پوښتنې.",
				en: "Multiple-choice practice covering hydrocarbons, functional groups, and molarity problems.",
			},
		},
		{
			id: "kankor-quiz-humanities",
			cover: CARD_IMAGES.humanities,
			minutes: 60,
			passing: 60,
			attempts: 3,
			isFree: true,
			credits: 0,
			rating: 4.7,
			votes: 290,
			zone: { fa: "علوم اجتماعی", ps: "ټولنیز علوم", en: "Humanities" },
			title: {
				fa: "آزمون جامع تاریخ، جغرافیه و تعلیمات اسلامی",
				ps: "د تاریخ، جغرافیې او اسلامي زده‌کړو عمومي ازموینه",
				en: "History, Geography & Islamic Studies Quiz",
			},
			desc: {
				fa: "مرور نکات کلیدی دوره لیسه برای کسب نمره کامل در بخش علوم اجتماعی و دینی کانکور.",
				ps: "د کانکور په ټولنیزو او دیني علومو کې د بشپړې نمرې لپاره کلیدي پوښتنې.",
				en: "Essential high-school review to maximize your score in the humanities section of Kankor.",
			},
		},
		{
			id: "kankor-form-nightly",
			cover: CARD_IMAGES.generalLibrary,
			minutes: 160,
			passing: 55,
			attempts: 2,
			isFree: false,
			credits: 6,
			rating: 4.8,
			votes: 355,
			zone: { fa: "شبانه", ps: "شپنی", en: "Evening" },
			title: {
				fa: "فورم عمومی کانکور شبانه و متفرقه سراسری",
				ps: "د شپې او متفرقه کانکور عمومي فورم",
				en: "Evening & Special Track General Kankor Form",
			},
			desc: {
				fa: "مجموعه کامل سوالات دوره‌های شبانه و چهارده‌پاس برای مرور نهایی پیش از امتحان.",
				ps: "د شپې پوهنځیو او څوارلس پاسانو د ازموینې بشپړ چمتووالی.",
				en: "Comprehensive practice form covering evening faculty and special admission tracks.",
			},
		},
	];

	return specs.map((item) => ({
		href: signupHref,
		quiz: {
			id: item.id,
			slug: item.id,
			title: pick(locale, item.title),
			description: pick(locale, item.desc),
			instructions: null,
			cover_image_url: item.cover,
			is_free: item.isFree,
			price_credits: item.credits,
			time_limit_minutes: item.minutes,
			passing_score_percentage: item.passing,
			max_attempts: item.attempts,
			created_at: DEMO_CREATED_AT,
			exam_zone: pick(locale, item.zone),
			rating: item.rating,
			rating_count: item.votes,
		},
	}));
}
