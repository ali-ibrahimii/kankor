import type { CourseMeta } from "@/components/blocks/course/course-card";
import type { PublicDeck } from "@/components/blocks/decks/public-deck-card";
import type { LibraryBook } from "@/components/blocks/libraries/types";
import { BOOK_SELECT } from "@/components/blocks/libraries/types";
import type { PublicQuiz } from "@/components/blocks/quizzes/types";
import { CARD_IMAGES } from "@/components/blocks/shared/card-images";
import { serializeQuery } from "@/hooks/filter/filter.utils";
import type { Locale } from "@/i18n";
import { serverEnv } from "@/lib/env/server-env";
import { routes } from "@/lib/routes";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { PartnerInstitution } from "./partner-institutions-section";

export const GENERAL_BOOKS_CATEGORY_ID = "9e062cba-47c7-4491-a51b-a894348103e8";
const STUDIES_CATEGORY_ID = "48838524-7374-4331-8903-2cd954055d4b";
const FIELDS_CATEGORY_ID = "3fa6e782-7102-4823-8ae9-d31d1599f02d";

export type CardEntry<T> = {
	item: T;
	href: string;
};

export type HomeCatalogData = {
	courses: CardEntry<CourseMeta>[];
	schoolBooks: CardEntry<
		LibraryBook & {
			cover_image_url?: string | null;
			rating?: number;
			rating_count?: number;
		}
	>[];
	generalBooks: CardEntry<
		LibraryBook & {
			cover_image_url?: string | null;
			rating?: number;
			rating_count?: number;
		}
	>[];
	decks: CardEntry<PublicDeck>[];
	kankorForms: CardEntry<
		PublicQuiz & {
			cover_image_url?: string | null;
			exam_zone?: string;
			rating?: number;
			rating_count?: number;
		}
	>[];
	partners: PartnerInstitution[];
	generalBooksMoreHref: string;
};

const NOW_ISO = "2026-01-15T08:00:00.000Z";

function localizedText(
	locale: Locale,
	values: { fa: string; ps: string; en: string }
): string {
	return values[locale] ?? values.fa;
}

export function buildGeneralBooksHref(): string {
	return routes.libraries.page({
		filters: new URLSearchParams(
			serializeQuery<"libraries">({
				filters: [
					{
						field: "category_id",
						operator: "eq",
						value: GENERAL_BOOKS_CATEGORY_ID,
					},
				],
			})
		).toString(),
	});
}

function getFallbackCourses(locale: Locale): CardEntry<CourseMeta>[] {
	const catalogHref = routes.courses.page();
	const specs: {
		id: string;
		slug: string;
		cover: string;
		isFree: boolean;
		credits: number;
		lessons: number;
		hours: number;
		enrollments: number;
		rating: number;
		level: Database["public"]["Enums"]["course_level"];
		title: { fa: string; ps: string; en: string };
		subtitle: { fa: string; ps: string; en: string };
		subject: { fa: string; ps: string; en: string };
		grade: { fa: string; ps: string; en: string };
		instructor: { fa: string; ps: string; en: string };
	}[] = [
		{
			id: "course-math-12",
			slug: "grade-12-calculus-and-limits",
			cover: CARD_IMAGES.math,
			isFree: true,
			credits: 0,
			lessons: 42,
			hours: 18,
			enrollments: 1840,
			rating: 4.9,
			level: "all_levels",
			title: {
				fa: "ریاضی عالی صنف دوازدهم — لمت، مشتق و انتیگرال",
				ps: "د دولسم ټولګي عالي ریاضي — لېمېټ، مشتق او انتیګرال",
				en: "Grade 12 Calculus — Limits, Derivatives & Integrals",
			},
			subtitle: {
				fa: "آموزش مفهومی تمام فصل‌های ریاضی صنف ۱۲ همراه با حل سوالات پرتکرار کانکور.",
				ps: "د دولسم ټولګي د ریاضي ټولو فصلونو مفهومي زده‌کړه د کانکور پوښتنو له حل سره.",
				en: "Conceptual mastery of Grade 12 calculus with solved Kankor exam questions.",
			},
			subject: { fa: "ریاضی", ps: "ریاضي", en: "Mathematics" },
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			instructor: {
				fa: "استاد احمد رشاد نادری",
				ps: "استاد احمد رشاد نادري",
				en: "Prof. Ahmad Rashad Naderi",
			},
		},
		{
			id: "course-physics-12",
			slug: "grade-12-mechanics-and-electricity",
			cover: CARD_IMAGES.physics,
			isFree: true,
			credits: 0,
			lessons: 36,
			hours: 15,
			enrollments: 1490,
			rating: 4.8,
			level: "intermediate",
			title: {
				fa: "فزیک میخانیک، موج و برق مقناطیس",
				ps: "د میخانیک، څپو او برېښنا مقناطیس فزیک",
				en: "Mechanics, Waves & Electromagnetism Physics",
			},
			subtitle: {
				fa: "تحلیل دقیق فرمول‌ها، مسایل عددی و نکات تستی فزیک دوره لیسه برای کانکور.",
				ps: "د لېسې دورې د فزیک فورمولونو او عددي مسایلو بشپړه تشریح.",
				en: "Step-by-step problem solving across high-school mechanics and electricity.",
			},
			subject: { fa: "فزیک", ps: "فزیک", en: "Physics" },
			grade: {
				fa: "صنف یازدهم و دوازدهم",
				ps: "یوولسم او دولسم",
				en: "Grade 11–12",
			},
			instructor: {
				fa: "استاد مریم سادات هاشمی",
				ps: "استاده مریم سادات هاشمي",
				en: "Maryam Sadat Hashemi",
			},
		},
		{
			id: "course-chemistry-12",
			slug: "organic-and-general-chemistry",
			cover: CARD_IMAGES.chemistry,
			isFree: true,
			credits: 0,
			lessons: 34,
			hours: 14,
			enrollments: 1320,
			rating: 4.9,
			level: "all_levels",
			title: {
				fa: "کیمیای عضوی و غیرعضوی ویژه کانکور",
				ps: "د کانکور ځانګړې عضوي او غیرعضوي کیمیا",
				en: "Organic & Inorganic Chemistry for Kankor",
			},
			subtitle: {
				fa: "هایدروکاربن‌ها، تعاملات کیمیاوی، محلول‌ها و جدول تناوبی با روش‌های سریع.",
				ps: "هایدروکاربنونه، کیمیاوي تعاملات، محلولونه او دوره يي جدول په اسانه بڼه.",
				en: "Hydrocarbons, chemical reactions, stoichiometry, and periodic trends.",
			},
			subject: { fa: "کیمیا", ps: "کیمیا", en: "Chemistry" },
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			instructor: {
				fa: "استاد حسیب‌الله کریمی",
				ps: "استاد حسیب الله کریمي",
				en: "Hasibullah Karimi",
			},
		},
		{
			id: "course-biology-12",
			slug: "cell-biology-and-genetics",
			cover: CARD_IMAGES.biology,
			isFree: true,
			credits: 0,
			lessons: 30,
			hours: 12,
			enrollments: 1610,
			rating: 4.8,
			level: "beginner",
			title: {
				fa: "بیولوژی حجروی، جنتیک و سیستم‌های بدن",
				ps: "حجروي بیولوژي، جنتیک او د بدن سیستمونه",
				en: "Cell Biology, Genetics & Human Physiology",
			},
			subtitle: {
				fa: "مرور تصویری فصل‌های بیولوژی صنف دهم تا دوازدهم مخصوص داوطلبان طب.",
				ps: "د لسم نه تر دولسم ټولګي پورې د بیولوژي تصویري زده‌کړه.",
				en: "Visual guide to high-school biology tailored for pre-medical students.",
			},
			subject: { fa: "بیولوژی", ps: "بیولوژي", en: "Biology" },
			grade: {
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
		{
			id: "course-history-11",
			slug: "afghanistan-and-world-history",
			cover: CARD_IMAGES.humanities,
			isFree: true,
			credits: 0,
			lessons: 28,
			hours: 10,
			enrollments: 980,
			rating: 4.7,
			level: "all_levels",
			title: {
				fa: "تاریخ معاصر، جغرافیه و علوم اجتماعی",
				ps: "معاصر تاریخ، جغرافیه او ټولنیز علوم",
				en: "Contemporary History, Geography & Social Studies",
			},
			subtitle: {
				fa: "دسته‌بندی موضوعی تاریخ و جغرافیه دوره لیسه همراه با نکات کلیدی حفظی.",
				ps: "د لېسې دورې د تاریخ او جغرافیې موضوعي لنډیز او مهم ټکي.",
				en: "Structured timeline summaries across Grade 10–12 history and geography.",
			},
			subject: {
				fa: "تاریخ و جغرافیه",
				ps: "تاریخ او جغرافیه",
				en: "History & Geography",
			},
			grade: { fa: "صنف یازدهم", ps: "یوولسم ټولګی", en: "Grade 11" },
			instructor: {
				fa: "استاد فریدون امینی",
				ps: "استاد فریدون امیني",
				en: "Fereydoon Amini",
			},
		},
		{
			id: "course-languages-12",
			slug: "dari-and-pashto-literature",
			cover: CARD_IMAGES.languages,
			isFree: true,
			credits: 0,
			lessons: 26,
			hours: 11,
			enrollments: 1120,
			rating: 4.9,
			level: "all_levels",
			title: {
				fa: "ادبیات دری، پشتو و دستور زبان کانکور",
				ps: "پښتو او دري ادبیات او د ژبې ګرامر",
				en: "Dari & Pashto Literature, Rhetoric & Grammar",
			},
			subtitle: {
				fa: "صنایع ادبی، معنی لغات، تاریخ ادبیات و قواعد دستوری پرتکرار در کانکور.",
				ps: "ادبي صنایع، لغتونه، د ادبیاتو تاریخ او ګرامري قواعد.",
				en: "Poetic devices, vocabulary, literary history, and high-yield grammar rules.",
			},
			subject: {
				fa: "دری و پشتو",
				ps: "پښتو او دري",
				en: "Languages & Literature",
			},
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			instructor: {
				fa: "استاد زلمی مهمند",
				ps: "استاد زلمی مومند",
				en: "Zalmai Mohmand",
			},
		},
	];

	return specs.map((spec) => ({
		href: catalogHref,
		item: {
			id: spec.id,
			slug: spec.slug,
			title: localizedText(locale, spec.title),
			subtitle: localizedText(locale, spec.subtitle),
			description: localizedText(locale, spec.subtitle),
			cover_image_url: spec.cover,
			promo_video_url: null,
			welcome_message: null,
			instructor_id: null,
			subject_id: null,
			grade_id: null,
			book_id: null,
			agency_id: null,
			school_id: null,
			language: locale,
			level: spec.level,
			is_free: spec.isFree,
			is_published: true,
			price: 0,
			price_credits: spec.credits,
			currency: null,
			enrollment_limit: 0,
			estimated_duration_hours: spec.hours,
			learning_objectives: null,
			prerequisites: null,
			related_decks_ids: [],
			related_libraries_ids: [],
			related_quizzes_ids: [],
			seo_title: null,
			seo_description: null,
			total_reviews: spec.enrollments,
			visibility: "public",
			published_at: NOW_ISO,
			created_at: NOW_ISO,
			updated_at: NOW_ISO,
			average_rating: spec.rating,
			total_lessons: spec.lessons,
			total_enrollments: spec.enrollments,
			instructor: {
				full_name: localizedText(locale, spec.instructor),
				avatar_url: null,
			},
			subject: { name: localizedText(locale, spec.subject) },
			grade: { id: spec.id, name: localizedText(locale, spec.grade) },
		},
	}));
}

function getFallbackSchoolBooks(
	locale: Locale
): CardEntry<LibraryBook & { cover_image_url?: string | null }>[] {
	const href = routes.libraries.page();
	const items = [
		{
			id: "school-book-math-12",
			cover: CARD_IMAGES.schoolBooks,
			title: {
				fa: "کتاب درسی ریاضی صنف دوازدهم",
				ps: "د دولسم ټولګي د ریاضي درسي کتاب",
				en: "Grade 12 Official Mathematics Textbook",
			},
			desc: {
				fa: "نسخه کامل و باکیفیت کتاب رسمی نصاب تعلیمی معارف شامل لمت، مشتق، انتیگرال و احصائیه.",
				ps: "د پوهنې وزارت د دولسم ټولګي د ریاضي رسمي درسي کتاب بشپړه نسخه.",
				en: "Complete official curriculum textbook covering limits, derivatives, integrals, and statistics.",
			},
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			subject: { fa: "ریاضی", ps: "ریاضي", en: "Mathematics" },
		},
		{
			id: "school-book-physics-12",
			cover: CARD_IMAGES.physics,
			title: {
				fa: "کتاب درسی فزیک صنف دوازدهم",
				ps: "د دولسم ټولګي د فزیک درسي کتاب",
				en: "Grade 12 Official Physics Textbook",
			},
			desc: {
				fa: "فزیک اتمی، هستوی، اهتزازات، امواج و خواص میخانیکی ماده مطابق نصاب رسمی مکتب.",
				ps: "اتومي او هستوي فزیک، اهتزازات او څپې د ښوونځي د رسمي نصاب له مخې.",
				en: "Official textbook on vibrations, waves, optics, and modern atomic physics.",
			},
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			subject: { fa: "فزیک", ps: "فزیک", en: "Physics" },
		},
		{
			id: "school-book-chemistry-11",
			cover: CARD_IMAGES.chemistry,
			title: {
				fa: "کتاب درسی کیمیا صنف یازدهم",
				ps: "د یوولسم ټولګي د کیمیا درسي کتاب",
				en: "Grade 11 Official Chemistry Textbook",
			},
			desc: {
				fa: "محلول‌ها، تعادل کیمیاوی، تیزاب‌ها و القلی‌ها و الکتروکیمیا برای دوره لیسه.",
				ps: "محلولونه، کیمیاوي تعادل، تېزابونه او القلي او الکتروکیمیا.",
				en: "Solutions, chemical equilibrium, acids & bases, and electrochemistry.",
			},
			grade: { fa: "صنف یازدهم", ps: "یوولسم ټولګی", en: "Grade 11" },
			subject: { fa: "کیمیا", ps: "کیمیا", en: "Chemistry" },
		},
		{
			id: "school-book-biology-12",
			cover: CARD_IMAGES.biology,
			title: {
				fa: "کتاب درسی بیولوژی صنف دوازدهم",
				ps: "د دولسم ټولګي د بیولوژي درسي کتاب",
				en: "Grade 12 Official Biology Textbook",
			},
			desc: {
				fa: "وراثت، قوانین مندل، DNA، بیوتکنولوژی و ایکولوژی با تصاویر واضح درسی.",
				ps: "وراثت، د مندل قوانین، DNA، بیوټکنالوژي او ایکولوژي.",
				en: "Mendelian genetics, molecular DNA biology, biotechnology, and ecology.",
			},
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			subject: { fa: "بیولوژی", ps: "بیولوژي", en: "Biology" },
		},
		{
			id: "school-book-history-11",
			cover: CARD_IMAGES.humanities,
			title: {
				fa: "کتاب درسی تاریخ صنف یازدهم",
				ps: "د یوولسم ټولګي د تاریخ درسي کتاب",
				en: "Grade 11 Official History Textbook",
			},
			desc: {
				fa: "تمامی بخش‌های تاریخ دوره معاصر و تمدن‌های بشری برای آمادگی امتحانات مکتب و کانکور.",
				ps: "د معاصرې دورې او انساني تمدنونو بشپړ تاریخي درسي کتاب.",
				en: "Modern era history and world civilizations curriculum textbook.",
			},
			grade: { fa: "صنف یازدهم", ps: "یوولسم ټولګی", en: "Grade 11" },
			subject: { fa: "تاریخ", ps: "تاریخ", en: "History" },
		},
		{
			id: "school-book-dari-12",
			cover: CARD_IMAGES.languages,
			title: {
				fa: "کتاب درسی دری صنف دوازدهم",
				ps: "د دولسم ټولګي د دري ادبیاتو کتاب",
				en: "Grade 12 Dari Language & Literature Textbook",
			},
			desc: {
				fa: "متون نظم و نثر، قواعد دستور زبان، بدیع و بیان و واژه‌نامه کامل کتاب مکتب.",
				ps: "نظم او نثر، د ژبې ګرامر، ادبي فنون او بشپړ لغت‌نامه.",
				en: "Classical and modern prose, poetry analysis, rhetoric, and vocabulary.",
			},
			grade: { fa: "صنف دوازدهم", ps: "دولسم ټولګی", en: "Grade 12" },
			subject: { fa: "دری", ps: "دري", en: "Dari Literature" },
		},
	];

	return items.map((item) => ({
		href,
		item: {
			id: item.id,
			slug: item.id,
			title: localizedText(locale, item.title),
			desc: localizedText(locale, item.desc),
			uri: href,
			file_path: "",
			book_id: item.id,
			category_id: null,
			grade_id: item.id,
			subject_id: item.id,
			related_courses_ids: [],
			related_decks_ids: [],
			seo_title: null,
			seo_description: null,
			created_at: NOW_ISO,
			updated_at: NOW_ISO,
			cover_image_url: item.cover,
			grades: { id: item.id, name: localizedText(locale, item.grade) },
			subjects: { id: item.id, name: localizedText(locale, item.subject) },
		},
	}));
}

function getFallbackGeneralBooks(
	locale: Locale,
	moreHref: string
): CardEntry<LibraryBook & { cover_image_url?: string | null }>[] {
	const items = [
		{
			id: "general-book-major-guide",
			cover: CARD_IMAGES.generalLibrary,
			title: {
				fa: "راهنمای جامع انتخاب رشته و پوهنځی‌های کانکور",
				ps: "د کانکور د څانګې او پوهنځیو د ټاکلو بشپړ لارښود",
				en: "Complete Guide to Kankor Majors & University Faculties",
			},
			desc: {
				fa: "معرفی کامل رشته‌های طب، انجنیری، کمپیوتر ساینس، اقتصاد، حقوق و بازار کار هر رشته.",
				ps: "د طب، انجنیرۍ، کمپیوټر ساینس، اقتصاد او حقوقو پوهنځیو بشپړه پېژندنه.",
				en: "Detailed overview of medicine, engineering, computer science, economics, and law tracks.",
			},
			category: {
				fa: "معرفی رشته‌ها",
				ps: "د څانګو پېژندنه",
				en: "Field Guide",
			},
			tag: { fa: "مشاوره تحصیلی", ps: "تحصیلي سلا", en: "Academic Advising" },
		},
		{
			id: "general-book-study-methods",
			cover: CARD_IMAGES.flashcards,
			title: {
				fa: "اصول مطالعه هدفمند، تمرکز و تقویت حافظه",
				ps: "د اغېزمنې مطالعې، تمرکز او حافظې پیاوړتیا اصول",
				en: "Deep Focus, Active Recall & Study Strategies",
			},
			desc: {
				fa: "روش‌های علمی مرور فاصله‌دار، خلاصه‌نویسی استاندارد و برنامه‌ریزی روزانه داوطلبان برتر.",
				ps: "د فاصلوي تکرار، لنډیز لیکلو او ورځني مهالوېش علمي تګلارې.",
				en: "Evidence-based spaced repetition, note-taking, and daily exam study planning.",
			},
			category: {
				fa: "مطالعات و مهارت",
				ps: "مطالعه او مهارت",
				en: "Study Skills",
			},
			tag: { fa: "کتاب عمومی", ps: "عمومي کتاب", en: "General Book" },
		},
		{
			id: "general-book-math-handbook",
			cover: CARD_IMAGES.math,
			title: {
				fa: "هندبوک طلایی فرمول‌های ریاضیات، هندسه و مثلثات",
				ps: "د ریاضیاتو، هندسې او مثلثاتو طلایي فورمولونو کتاب",
				en: "Golden Handbook of Algebra, Geometry & Trigonometry",
			},
			desc: {
				fa: "مرجع جیبی تمام قضایا، اتحادها، نسبت‌های مثلثاتی و فرمول‌های سریع حل تست.",
				ps: "د الجبر، هندسې او مثلثاتو ټولو مهمو فورمولونو جامع ټولګه.",
				en: "Compact reference of identities, theorems, and rapid exam shortcuts.",
			},
			category: { fa: "مرجع علمی", ps: "علمي سرچینه", en: "Reference" },
			tag: { fa: "ریاضیات", ps: "ریاضیات", en: "Mathematics" },
		},
		{
			id: "general-book-exam-psychology",
			cover: CARD_IMAGES.kankorExam,
			title: {
				fa: "مدیریت زمان و کنترول استرس در جلسه امتحان کانکور",
				ps: "د کانکور په ازموینه کې د وخت مدیریت او د فشار کنټرول",
				en: "Time Management & Calm Performance on Kankor Day",
			},
			desc: {
				fa: "تکنیک‌های تقسیم وقت برای ۱۶۰ سوال کانکور، ترتیب پاسخ‌دهی و جلوگیری از اشتباهات رایج.",
				ps: "د ۱۶۰ پوښتنو لپاره د وخت وېش او له تېروتنو د مخنیوي عملي لارې.",
				en: "Pacing tactics across 160 questions and avoiding common answer-sheet traps.",
			},
			category: {
				fa: "آمادگی کانکور",
				ps: "د کانکور چمتووالی",
				en: "Exam Strategy",
			},
			tag: { fa: "کتاب عمومی", ps: "عمومي کتاب", en: "General Book" },
		},
		{
			id: "general-book-science-lexicon",
			cover: CARD_IMAGES.chemistry,
			title: {
				fa: "فرهنگ جامع اصطلاحات علمی ساینس و طب",
				ps: "د ساینس او طب علمي اصطلاحاتو جامع قاموس",
				en: "Illustrated Dictionary of Scientific & Medical Terms",
			},
			desc: {
				fa: "شرح ساده و دقیق صدها اصطلاح کلیدی بیولوژی، کیمیا و فزیک به دری، پشتو و انگلیسی.",
				ps: "په دري، پښتو او انګلیسي ژبو د ساینسي اصطلاحاتو اسانه تشریح.",
				en: "Trilingual glossary of essential biology, chemistry, and physics terminology.",
			},
			category: { fa: "فرهنگ علمی", ps: "علمي قاموس", en: "Glossary" },
			tag: { fa: "علوم طبیعی", ps: "طبیعي علوم", en: "Natural Sciences" },
		},
		{
			id: "general-book-scholarships",
			cover: CARD_IMAGES.university,
			title: {
				fa: "راهنمای نگارش انگیزه‌نامه و بورسیه‌های تحصیلی",
				ps: "د تحصیلي بورسونو او انګېزه‌لیک چمتو کولو لارښود",
				en: "Guide to Academic Scholarships & Personal Statements",
			},
			desc: {
				fa: "گام‌به‌گام آماده‌سازی اسناد تحصیلی، رزومه علمی و تقویت زبان برای بورسیه‌های معتبر.",
				ps: "د تحصیلي اسنادو، علمي سي‌وي او بورسونو لپاره ګام په ګام لارښود.",
				en: "Step-by-step preparation of academic CVs, transcripts, and scholarship applications.",
			},
			category: {
				fa: "آینده تحصیلی",
				ps: "تحصیلي راتلونکی",
				en: "Higher Education",
			},
			tag: { fa: "کتاب عمومی", ps: "عمومي کتاب", en: "General Book" },
		},
	];

	return items.map((item) => ({
		href: moreHref,
		item: {
			id: item.id,
			slug: item.id,
			title: localizedText(locale, item.title),
			desc: localizedText(locale, item.desc),
			uri: moreHref,
			file_path: "",
			book_id: null,
			category_id: GENERAL_BOOKS_CATEGORY_ID,
			grade_id: null,
			subject_id: null,
			related_courses_ids: [],
			related_decks_ids: [],
			seo_title: null,
			seo_description: null,
			created_at: NOW_ISO,
			updated_at: NOW_ISO,
			cover_image_url: item.cover,
			categories: {
				id: GENERAL_BOOKS_CATEGORY_ID,
				name: localizedText(locale, item.category),
				slug: "generals",
			},
			subjects: { id: item.id, name: localizedText(locale, item.tag) },
		},
	}));
}

function getFallbackDecks(locale: Locale): CardEntry<PublicDeck>[] {
	const href = routes.decks.page();
	const items = [
		{
			id: "deck-trig-derivatives",
			cover: CARD_IMAGES.flashcards,
			count: 95,
			rating: 4.9,
			votes: 312,
			category: { fa: "ریاضیات", ps: "ریاضیات", en: "Mathematics" },
			name: {
				fa: "فرمول‌های مثلثات، لمت و مشتق در یک نگاه",
				ps: "د مثلثاتو، لېمېټ او مشتق کلیدي فورمولونه",
				en: "Trigonometry, Limits & Derivatives Flashcards",
			},
			desc: {
				fa: "۹۵ کارت پرسش و پاسخ سریع برای تثبیت اتحادهای مثلثاتی و قواعد مشتق‌گیری.",
				ps: "د مثلثاتي اړیکو او مشتق قواعدو د چټکې زده‌کړې ۹۵ کارټونه.",
				en: "95 active-recall cards covering trig identities and derivative rules.",
			},
		},
		{
			id: "deck-periodic-table",
			cover: CARD_IMAGES.chemistry,
			count: 118,
			rating: 4.8,
			votes: 264,
			category: { fa: "کیمیا", ps: "کیمیا", en: "Chemistry" },
			name: {
				fa: "عناصر جدول تناوبی، نمبر اکسیدیشن و تعاملات",
				ps: "د دوره يي جدول عناصر، اکسیدېشن نمبر او تعاملات",
				en: "Periodic Table Elements & Oxidation States",
			},
			desc: {
				fa: "مرور هوشمند خواص گروپ‌ها، الکترونگاتیویتی و مرکبات مهم کیمیاوی.",
				ps: "د کیمیاوي عناصرو، ګروپونو او مرکباتو هوښیار تکرار.",
				en: "Master periodic groups, valency, and common Kankor chemical compounds.",
			},
		},
		{
			id: "deck-human-biology",
			cover: CARD_IMAGES.biology,
			count: 140,
			rating: 4.9,
			votes: 389,
			category: { fa: "بیولوژی", ps: "بیولوژي", en: "Biology" },
			name: {
				fa: "نکات طلایی بیولوژی حجروی، هورمون‌ها و ویتامین‌ها",
				ps: "حجروي بیولوژي، هورمونونه او ویټامینونه",
				en: "Cell Organelles, Hormones & Vitamins Deck",
			},
			desc: {
				fa: "حفظ آسان وظایف حجرات، غده‌های اندوکراین و سیستم عصبی با الگوریتم لایتنر.",
				ps: "د حجرو دندو، غدو او عصبي سیستم اسانه زده‌کړه د لایټنر په طریقه.",
				en: "Spaced-repetition deck for endocrine glands, vitamins, and cell biology.",
			},
		},
		{
			id: "deck-physics-laws",
			cover: CARD_IMAGES.physics,
			count: 84,
			rating: 4.8,
			votes: 218,
			category: { fa: "فزیک", ps: "فزیک", en: "Physics" },
			name: {
				fa: "قوانین حرکت نیوتن، کار، انرژی و واحدات SI",
				ps: "د نیوټن قوانین، کار، انرژي او SI واحدونه",
				en: "Newton's Laws, Work, Energy & SI Units",
			},
			desc: {
				fa: "مرور روزانه واحدهای اندازه‌گیری، ابعاد کمیت‌ها و روابط کلیدی فزیک.",
				ps: "د فزیک واحدونو، ابعادو او کلیدي اړیکو ورځنی تکرار.",
				en: "Daily drill on physical dimensions, SI units, and kinematics equations.",
			},
		},
		{
			id: "deck-history-dates",
			cover: CARD_IMAGES.humanities,
			count: 110,
			rating: 4.7,
			votes: 176,
			category: { fa: "تاریخ", ps: "تاریخ", en: "History" },
			name: {
				fa: "سال‌شمار رویدادها، معاهدات و شخصیت‌های تاریخی",
				ps: "تاریخي پېښې، تړونونه او مشهور شخصیتونه",
				en: "Historical Dates, Treaties & Figures",
			},
			desc: {
				fa: "پرتکرارترین تاریخ‌ها و وقایع صنف دهم تا دوازدهم به شکل کارت‌های مرور سریع.",
				ps: "د لسم نه تر دولسم ټولګي پورې تر ټولو مهمې تاریخي نېټې او پېښې.",
				en: "High-frequency historical dates and treaties from Grade 10–12 textbooks.",
			},
		},
		{
			id: "deck-literature-vocab",
			cover: CARD_IMAGES.languages,
			count: 130,
			rating: 4.9,
			votes: 245,
			category: { fa: "ادبیات", ps: "ادبیات", en: "Literature" },
			name: {
				fa: "لغات دشوار، مترادف‌ها و صنایع ادبی دری و پشتو",
				ps: "ستونزمن لغتونه، مترادفونه او ادبي صنایع",
				en: "Dari & Pashto Vocabulary & Literary Figures",
			},
			desc: {
				fa: "تسلط کامل بر معنی واژگان، شاعران، آثار ادبی و آرایه‌های بدیعی کانکور.",
				ps: "پر لغتونو، شاعرانو، ادبي آثارو او بدیعي صنایعو بشپړ تسلط.",
				en: "Essential vocabulary, authors, and rhetorical figures tested on Kankor.",
			},
		},
	];

	return items.map((item) => ({
		href,
		item: {
			id: item.id,
			slug: item.id,
			name: localizedText(locale, item.name),
			description: localizedText(locale, item.desc),
			is_free: true,
			card_count: item.count,
			category: localizedText(locale, item.category),
			rating: item.rating,
			rating_count: item.votes,
			cover_image_url: item.cover,
		},
	}));
}

function getFallbackKankorForms(
	locale: Locale
): CardEntry<PublicQuiz & { cover_image_url?: string | null }>[] {
	const href = routes.quizzes.page();
	const items = [
		{
			id: "kankor-form-kabul-1",
			cover: CARD_IMAGES.kankorExam,
			minutes: 180,
			title: {
				fa: "فورم عمومی کانکور ولایت کابل — دور اول",
				ps: "د کابل ولایت د کانکور عمومي فورم — لومړی پړاو",
				en: "Kabul General Kankor Exam Form — Round 1",
			},
			desc: {
				fa: "شبیه‌ساز کامل ۱۶۰ سوالی شامل ریاضیات، علوم طبیعی، علوم اجتماعی و السنه با نمره‌دهی دقیق.",
				ps: "بشپړ ۱۶۰ پوښتنې لرونکی معیاري فورم له دقیقې نمرې ورکونې سره.",
				en: "Full 160-question standard simulation across Math, Natural Sciences, Humanities & Languages.",
			},
		},
		{
			id: "kankor-form-herat-1",
			cover: CARD_IMAGES.math,
			minutes: 180,
			title: {
				fa: "فورم عمومی کانکور ولایت هرات — معیاری",
				ps: "د هرات ولایت د کانکور معیاري عمومي فورم",
				en: "Herat Provincial General Kankor Form",
			},
			desc: {
				fa: "سوالات واقعی دسته‌بندی‌شده به همراه پاسخ‌نامه تشریحی و تحلیل نقاط قوت و ضعف.",
				ps: "اصلي طبقه بندي شوې پوښتنې له تشریحي ځوابونو او بشپړ تحلیل سره.",
				en: "Authentic provincial exam questions with step-by-step explanations and score breakdown.",
			},
		},
		{
			id: "kankor-form-balkh-1",
			cover: CARD_IMAGES.physics,
			minutes: 180,
			title: {
				fa: "فورم عمومی کانکور ولایت بلخ — شبیه‌ساز جامع",
				ps: "د بلخ ولایت د کانکور عمومي ازموینې فورم",
				en: "Balkh Provincial General Kankor Mock Exam",
			},
			desc: {
				fa: "امتحان زمان‌بندی‌شده ۳ ساعته مطابق ساختار رسمی اداره ملی امتحانات.",
				ps: "د ازموینو ملي ادارې له معیار سره سم درې ساعته وخت لرونکې ازموینه.",
				en: "Timed 3-hour exam matching the official National Examinations Authority format.",
			},
		},
		{
			id: "kankor-form-natural-sciences",
			cover: CARD_IMAGES.biology,
			minutes: 90,
			title: {
				fa: "آزمون موضوعی علوم طبیعی (کیمیا، بیولوژی و فزیک)",
				ps: "د طبیعي علومو ځانګړې موضوعي ازموینه",
				en: "Natural Sciences Intensive Practice Form",
			},
			desc: {
				fa: "۸۰ سوال منتخب با ضریب بالا ویژه داوطلبان پوهنځی‌های طب معالجوی، ستوماتولوژی و فارمسی.",
				ps: "د طب، ستوماتولوژي او فارمسي نوماندانو لپاره ۸۰ غوره پوښتنې.",
				en: "80 high-weight science questions tailored for Medicine, Stomatology & Pharmacy applicants.",
			},
		},
		{
			id: "kankor-form-engineering-math",
			cover: CARD_IMAGES.schoolBooks,
			minutes: 90,
			title: {
				fa: "آزمون اختصاصی ریاضیات عالی و منطق انجنیری",
				ps: "د عالي ریاضیاتو او انجنیرۍ ځانګړی فورم",
				en: "Advanced Mathematics & Engineering Form",
			},
			desc: {
				fa: "تمرین فشرده الجبر، هندسه تحلیلی، مثلثات و حساب دیفرانسیل با زمان‌بندی استاندارد.",
				ps: "الجبر، تحلیلي هندسه، مثلثات او ډیفرانسیل حساب په معیاري وخت کې.",
				en: "Focused timed drill in algebra, analytic geometry, trigonometry, and calculus.",
			},
		},
		{
			id: "kankor-form-nightly",
			cover: CARD_IMAGES.generalLibrary,
			minutes: 160,
			title: {
				fa: "فورم عمومی کانکور شبانه و متفرقه سراسری",
				ps: "د شپې او متفرقه کانکور عمومي فورم",
				en: "Nightly & Special Kankor General Form",
			},
			desc: {
				fa: "مجموعه کامل سوالات دوره‌های شبانه و چهارده‌پاس برای مرور نهایی پیش از امتحان.",
				ps: "د شپې پوهنځیو او څوارلس پاسانو د ازموینې بشپړ چمتووالی.",
				en: "Comprehensive practice form covering evening faculty and special admission tracks.",
			},
		},
	];

	return items.map((item) => ({
		href,
		item: {
			id: item.id,
			slug: item.id,
			title: localizedText(locale, item.title),
			description: localizedText(locale, item.desc),
			instructions: null,
			time_limit_minutes: item.minutes,
			passing_score_percentage: 60,
			max_attempts: null,
			created_at: NOW_ISO,
			cover_image_url: item.cover,
		},
	}));
}

function getFallbackPartners(locale: Locale): PartnerInstitution[] {
	const items = [
		{
			id: "partner-kabul-university",
			kind: "university" as const,
			imageSrc: CARD_IMAGES.university,
			name: {
				fa: "پوهنتون کابل (دانشگاه کابل)",
				ps: "د کابل پوهنتون",
				en: "Kabul University",
			},
			province: { fa: "کابل", ps: "کابل", en: "Kabul" },
			summary: {
				fa: "همکاری در معرفی رشته‌ها، منابع درسی پایه و راهنمای قبولی پوهنځی‌های برتر.",
				ps: "د پوهنځیو پېژندنې، درسي سرچینو او د بریالیتوب لارښود په برخه کې همکاري.",
				en: "Academic faculty guides, foundational syllabi, and Kankor admission benchmarks.",
			},
			tag: {
				fa: "راهنمای رشته‌ها",
				ps: "د پوهنځیو لارښود",
				en: "Faculty Partner",
			},
			students: {
				fa: "۲۲ پوهنځی فعال",
				ps: "۲۲ فعال پوهنځي",
				en: "22 Faculties",
			},
		},
		{
			id: "partner-kabul-polytechnic",
			kind: "university" as const,
			imageSrc: CARD_IMAGES.math,
			name: {
				fa: "پوهنتون پولی‌تخنیک کابل",
				ps: "د کابل پولي‌تخنیک پوهنتون",
				en: "Kabul Polytechnic University",
			},
			province: { fa: "کابل", ps: "کابل", en: "Kabul" },
			summary: {
				fa: "منابع تخصصی ریاضیات عالی، انجنیری سیول، کمپیوتر ساینس و تکنالوژی معلوماتی.",
				ps: "د عالي ریاضیاتو، سیول انجنیرۍ او کمپیوټر ساینس ځانګړې سرچینې.",
				en: "Engineering, computer science, and applied mathematics prep resources.",
			},
			tag: {
				fa: "انجنیری و تکنالوژی",
				ps: "انجنیري او ټکنالوژي",
				en: "STEM Partner",
			},
			students: {
				fa: "۸ پوهنځی تخصصی",
				ps: "۸ تخصصي پوهنځي",
				en: "8 STEM Faculties",
			},
		},
		{
			id: "partner-kabul-medical",
			kind: "university" as const,
			imageSrc: CARD_IMAGES.biology,
			name: {
				fa: "پوهنتون علوم طبی کابل",
				ps: "د کابل طبي علومو پوهنتون",
				en: "Kabul University of Medical Sciences",
			},
			province: { fa: "کابل", ps: "کابل", en: "Kabul" },
			summary: {
				fa: "بانک سوالات علوم طبیعی، بیولوژی و کیمیای عضوی ویژه داوطلبان رشته‌های طبی.",
				ps: "د طبي څانګو نوماندانو لپاره د بیولوژي او کیمیا ځانګړی بانک.",
				en: "Pre-medical biology, chemistry, and clinical sciences exam preparation.",
			},
			tag: { fa: "علوم طبی", ps: "طبي علوم", en: "Medical Sciences" },
			students: {
				fa: "۶ پوهنځی طبی",
				ps: "۶ طبي پوهنځي",
				en: "6 Medical Tracks",
			},
		},
		{
			id: "partner-herat-university",
			kind: "university" as const,
			imageSrc: CARD_IMAGES.university,
			name: {
				fa: "پوهنتون هرات (دانشگاه هرات)",
				ps: "د هرات پوهنتون",
				en: "Herat University",
			},
			province: { fa: "هرات", ps: "هرات", en: "Herat" },
			summary: {
				fa: "آرشیف فورم‌های کانکور حوزه غرب، سمینارهای انتخاب رشته و کتابخانه دیجیتال.",
				ps: "د لوېدیځې حوزې د کانکور فورمونه او ډیجیټل کتابتون.",
				en: "Western zone Kankor form archive, career counseling, and digital library.",
			},
			tag: { fa: "بانک فورم کانکور", ps: "د کانکور بانک", en: "Exam Archive" },
			students: {
				fa: "۱۷ پوهنځی فعال",
				ps: "۱۷ فعال پوهنځي",
				en: "17 Faculties",
			},
		},
		{
			id: "partner-balkh-university",
			kind: "university" as const,
			imageSrc: CARD_IMAGES.generalLibrary,
			name: {
				fa: "پوهنتون بلخ (دانشگاه بلخ)",
				ps: "د بلخ پوهنتون",
				en: "Balkh University",
			},
			province: { fa: "بلخ", ps: "بلخ", en: "Balkh" },
			summary: {
				fa: "همکاری آموزشی در دروس پایه، آزمون‌های آزمایشی ولایات شمال و منابع علمی.",
				ps: "په شمالي ولایتونو کې د ازمایښتي ازموینو او علمي سرچینو همکاري.",
				en: "Northern region mock exams, foundational courses, and open study materials.",
			},
			tag: {
				fa: "کتابخانه دیجیتال",
				ps: "ډیجیټل کتابتون",
				en: "Digital Library",
			},
			students: {
				fa: "۱۶ پوهنځی فعال",
				ps: "۱۶ فعال پوهنځي",
				en: "16 Faculties",
			},
		},
		{
			id: "partner-habibia-high-school",
			kind: "school" as const,
			imageSrc: CARD_IMAGES.school,
			name: {
				fa: "لیسه عالی حبیبیه کابل",
				ps: "د کابل حبیبیې عالي لېسه",
				en: "Habibia High School",
			},
			province: { fa: "کابل", ps: "کابل", en: "Kabul" },
			summary: {
				fa: "صنوف آنلاین تقویتی، امتحانات چهارونیم‌ماهه و آمادگی کانکور صنف دوازدهم.",
				ps: "انلاین تقویتي ټولګي او د دولسم ټولګي د کانکور چمتووالی.",
				en: "Blended classrooms, mid-term assessments, and Grade 12 Kankor prep.",
			},
			tag: { fa: "صنوف هوشمند", ps: "هوښیار ټولګي", en: "Smart Classrooms" },
			students: {
				fa: "۱۲۰۰+ متعلم فعال",
				ps: "۱۲۰۰+ زده‌کوونکي",
				en: "1,200+ Students",
			},
		},
		{
			id: "partner-marefat-high-school",
			kind: "school" as const,
			imageSrc: CARD_IMAGES.schoolBooks,
			name: {
				fa: "لیسه عالی معرفت",
				ps: "د معرفت عالي لېسه",
				en: "Marefat High School",
			},
			province: { fa: "کابل", ps: "کابل", en: "Kabul" },
			summary: {
				fa: "تولید محتوای ویدیویی مضامین ساینسی، فلش‌کارت‌های درسی و آزمون‌های هفته‌وار.",
				ps: "د ساینسي مضامینو ویډیویي درسونه، فلش کارټونه او اونیزې ازموینې.",
				en: "Science video lessons, curriculum flashcards, and weekly mock exams.",
			},
			tag: {
				fa: "محتوای ویدیویی",
				ps: "ویډیویي محتوا",
				en: "Video Curriculum",
			},
			students: {
				fa: "۹۵۰+ متعلم فعال",
				ps: "۹۵۰+ زده‌کوونکي",
				en: "950+ Students",
			},
		},
		{
			id: "partner-sultan-razia-school",
			kind: "school" as const,
			imageSrc: CARD_IMAGES.flashcards,
			name: {
				fa: "لیسه عالی سلطان راضیه هرات",
				ps: "د هرات سلطان راضیې عالي لېسه",
				en: "Sultan Razia High School",
			},
			province: { fa: "هرات", ps: "هرات", en: "Herat" },
			summary: {
				fa: "دسترسی کامل شاگردان به کتابخانه درسی، مرور هوشمند لایتنر و کارنامه تحلیلی.",
				ps: "درسي کتابتون، لایټنر فلش کارټونو او تحلیلي کارنامو ته لاسرسی.",
				en: "Full student access to digital textbooks, Leitner decks, and analytics.",
			},
			tag: {
				fa: "آموزش از راه دور",
				ps: "لرې زده‌کړه",
				en: "Distance Learning",
			},
			students: {
				fa: "۸۸۰+ متعلم فعال",
				ps: "۸۸۰+ زده‌کوونکي",
				en: "880+ Students",
			},
		},
	];

	return items.map((item) => {
		const localizedName = localizedText(locale, item.name);
		return {
			id: item.id,
			name: localizedName,
			kind: item.kind,
			province: localizedText(locale, item.province),
			summary: localizedText(locale, item.summary),
			collaborationTag: localizedText(locale, item.tag),
			studentsLabel: localizedText(locale, item.students),
			imageSrc: item.imageSrc,
			href: routes.search.page({ q: localizedName }),
		};
	});
}

function isPlaceholderSupabase(): boolean {
	const url = serverEnv.supabase.url;
	return (
		!url || url.includes("demo.invalid") || url.includes("example.invalid")
	);
}

/**
 * Loads categorized Home page shelves from Supabase in parallel and falls back
 * gracefully per-section when a table is empty or offline in local preview.
 */
export async function getHomeCatalogData(
	locale: Locale
): Promise<HomeCatalogData> {
	const generalBooksMoreHref = buildGeneralBooksHref();

	const fallback: HomeCatalogData = {
		courses: getFallbackCourses(locale),
		schoolBooks: getFallbackSchoolBooks(locale),
		generalBooks: getFallbackGeneralBooks(locale, generalBooksMoreHref),
		decks: getFallbackDecks(locale),
		kankorForms: getFallbackKankorForms(locale),
		partners: getFallbackPartners(locale),
		generalBooksMoreHref,
	};

	if (isPlaceholderSupabase()) {
		return fallback;
	}

	try {
		const supabase = await createClient();

		const [
			coursesRes,
			schoolBooksRes,
			generalBooksRes,
			decksRes,
			quizzesRes,
			schoolsRes,
		] = await Promise.all([
			supabase
				.from("courses")
				.select(
					"*, subject:subjects(name), grade:grades(id, name), instructor:profiles!courses_instructor_id_fkey(full_name, avatar_url)"
				)
				.eq("is_published", true)
				.eq("visibility", "public")
				.order("created_at", { ascending: false })
				.limit(8),
			supabase
				.from("libraries")
				.select(BOOK_SELECT)
				.not("grade_id", "is", null)
				.order("created_at", { ascending: false })
				.limit(8),
			supabase
				.from("libraries")
				.select(BOOK_SELECT)
				.in("category_id", [
					GENERAL_BOOKS_CATEGORY_ID,
					STUDIES_CATEGORY_ID,
					FIELDS_CATEGORY_ID,
				])
				.order("created_at", { ascending: false })
				.limit(8),
			supabase
				.from("decks")
				.select("id, slug, name, description, is_free")
				.eq("visibility", "public")
				.order("created_at", { ascending: false })
				.limit(8),
			supabase
				.from("quizzes")
				.select(
					"id, slug, title, description, instructions, time_limit_minutes, passing_score_percentage, max_attempts, created_at"
				)
				.eq("visibility", "public")
				.order("created_at", { ascending: false })
				.limit(8),
			supabase
				.from("schools")
				.select("id, name, address, provinces(name)")
				.eq("status", "active")
				.order("created_at", { ascending: false })
				.limit(8),
		]);

		const courses =
			coursesRes.data && coursesRes.data.length > 0
				? coursesRes.data.map((row) => ({
						item: {
							...row,
							average_rating: row.average_rating ?? 0,
							subject: Array.isArray(row.subject)
								? (row.subject[0] ?? null)
								: row.subject,
							grade: Array.isArray(row.grade)
								? (row.grade[0] ?? null)
								: row.grade,
							instructor: Array.isArray(row.instructor)
								? (row.instructor[0] ?? null)
								: row.instructor,
						},
						href: routes.courses.slug.page({ slug: row.slug ?? row.id }),
					}))
				: fallback.courses;

		const schoolBooks =
			schoolBooksRes.data && schoolBooksRes.data.length > 0
				? (schoolBooksRes.data as unknown as LibraryBook[]).map((book) => ({
						item: book,
						href: routes.libraries.slug.page({ slug: book.slug ?? book.id }),
					}))
				: fallback.schoolBooks;

		const generalBooks =
			generalBooksRes.data && generalBooksRes.data.length > 0
				? (generalBooksRes.data as unknown as LibraryBook[]).map((book) => ({
						item: book,
						href: routes.libraries.slug.page({ slug: book.slug ?? book.id }),
					}))
				: fallback.generalBooks;

		const decks =
			decksRes.data && decksRes.data.length > 0
				? decksRes.data.map((deck) => ({
						item: deck,
						href: routes.decks.slug.page({ slug: deck.slug ?? deck.id }),
					}))
				: fallback.decks;

		const kankorForms =
			quizzesRes.data && quizzesRes.data.length > 0
				? quizzesRes.data.map((quiz) => ({
						item: quiz,
						href: routes.quizzes.slug.page({ slug: quiz.slug ?? quiz.id }),
					}))
				: fallback.kankorForms;

		const liveSchools: PartnerInstitution[] =
			schoolsRes.data && schoolsRes.data.length > 0
				? schoolsRes.data.map((school) => {
						const provinceRel = Array.isArray(school.provinces)
							? school.provinces[0]
							: school.provinces;
						return {
							id: school.id,
							name:
								school.name ??
								localizedText(locale, {
									fa: "مکتب همکار",
									ps: "همکار ښوونځی",
									en: "Partner School",
								}),
							kind: "school",
							province:
								provinceRel?.name ??
								localizedText(locale, {
									fa: "افغانستان",
									ps: "افغانستان",
									en: "Afghanistan",
								}),
							summary:
								school.address ??
								localizedText(locale, {
									fa: "مکتب همکار فعال در پلتفرم آموزشی ابزار کانکور.",
									ps: "د ابزار کانکور همکاره ښوونځی.",
									en: "Active partner school on the Abzar Kankor learning platform.",
								}),
							collaborationTag: localizedText(locale, {
								fa: "مکتب همکار",
								ps: "همکار ښوونځی",
								en: "Partner School",
							}),
							studentsLabel: localizedText(locale, {
								fa: "عضو رسمی",
								ps: "رسمي غړی",
								en: "Verified School",
							}),
							imageSrc: CARD_IMAGES.school,
							href: `/schools/${school.id}`,
						};
					})
				: [];

		return {
			courses,
			schoolBooks,
			generalBooks,
			decks,
			kankorForms,
			partners:
				liveSchools.length > 0
					? [...liveSchools, ...fallback.partners]
					: fallback.partners,
			generalBooksMoreHref,
		};
	} catch {
		return fallback;
	}
}
