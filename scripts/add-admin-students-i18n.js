/**
 * Adds the `admin.students` translation namespace to every locale file.
 *
 * The student detail page introduces a lot of new UI strings (tabs, stat
 * labels, table headers, empty states). Keeping them in one script means the
 * three locales stay in sync — a missing key in one locale is impossible to
 * miss because the script writes all of them together.
 *
 * Idempotent: re-running replaces the namespace with the same content.
 *
 * Usage:
 *   node scripts/add-admin-students-i18n.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "src/messages");

const TRANSLATIONS = {
	en: {
		title: "Student details",
		unnamedStudent: "Unnamed student",
		backToStudents: "Back to students",
		profile: "Profile",
		academicSummary: "Academic summary",
		activitySummary: "Activity summary",
		recentActivity: "Recent activity",
		overviewUnavailable:
			"Detailed data is unavailable right now. Make sure the admin student overview migration has been applied.",
		tabs: {
			overview: "Overview",
			courses: "Courses",
			quizzes: "Quiz results",
			decks: "Decks",
			classrooms: "Classrooms",
			activity: "Activity",
			credits: "Credits",
		},
		stats: {
			enrolledCourses: "Enrolled courses",
			completedCourses: "Completed courses",
			averageScore: "Average quiz score",
			quizAttempts: "Quiz attempts",
			quizzesPassed: "Quizzes passed",
			activeDecks: "Active decks",
			lessonsCompleted: "Lessons completed",
			studyMinutes: "Study minutes",
			certificates: "Certificates",
			classrooms: "Classrooms",
			bookmarks: "Bookmarks",
			notes: "Notes",
		},
		fields: {
			email: "Email",
			phone: "Phone",
			province: "Province",
			balance: "Credit balance",
			joined: "Joined",
			lastActivity: "Last activity",
		},
		summary: {
			grades: "Grades covered",
			subjects: "Subjects covered",
			firstEnrolled: "First enrollment",
			lastActivity: "Last activity",
			bestScore: "Best quiz score",
			failedQuizzes: "Failed quiz attempts",
			courses: "Course enrollments",
			decks: "Flashcard decks",
			classrooms: "Classrooms",
			lessons: "Lessons completed",
			studyTime: "Total study time",
			minutes: "{count, plural, one {# minute} other {# minutes}}",
			bookmarks: "Bookmarks",
			notes: "Notes",
			certificates: "Certificates",
			none: "None",
		},
		table: {
			classes: "Enrollments",
			gradesSubjects: "Grades / subjects",
			score: "Score",
		},
		list: {
			courses: "{count, plural, one {# course} other {# courses}}",
			decks: "{count, plural, one {# deck} other {# decks}}",
			classrooms: "{count, plural, one {# classroom} other {# classrooms}}",
			attempts: "{count, plural, one {# attempt} other {# attempts}}",
		},
		coursesTable: {
			course: "Course",
			gradeSubject: "Grade / subject",
			instructor: "Instructor",
			progress: "Progress",
			enrolledAt: "Enrolled",
			status: "Status",
			completed: "Completed",
			inProgress: "In progress",
			unknownCourse: "Unknown course",
			lessons: "{completed} / {total} lessons",
		},
		quizzesTable: {
			quiz: "Quiz",
			subject: "Grade / subject",
			attempt: "Attempt",
			score: "Score",
			result: "Result",
			date: "Date",
			feedback: "Instructor feedback",
			unknownQuiz: "Unknown quiz",
		},
		decksTable: {
			deck: "Deck",
			subject: "Grade / subject",
			cards: "Cards mastered",
			progress: "Progress",
			lastLearned: "Last learned",
			unknownDeck: "Unknown deck",
			mastered: "{count} mastered",
		},
		classroomsTable: {
			classroom: "Classroom",
			teacher: "Teacher",
			school: "School",
			role: "Role",
			joinedAt: "Joined",
		},
		certificatesTable: {
			course: "Course",
			issuedAt: "Issued",
			code: "Verification code",
		},
		activityTypes: {
			enrollment: "Course enrollment",
			quiz_attempt: "Quiz attempt",
			lesson_completed: "Lesson completed",
			note: "Note",
			bookmark: "Bookmark",
			unknown: "Activity",
		},
		empty: {
			noEnrollments: "This student has not enrolled in any course yet.",
			noQuizAttempts: "This student has not attempted any quiz yet.",
			noDecks: "This student has not enrolled in any flashcard deck yet.",
			noClassrooms: "This student is not a member of any classroom.",
			noCertificates: "No certificates have been issued yet.",
			noActivity: "No recorded activity yet.",
		},
	},
	fa: {
		title: "جزئیات شاگرد",
		unnamedStudent: "شاگرد بی‌نام",
		backToStudents: "بازگشت به شاگردان",
		profile: "مشخصات",
		academicSummary: "خلاصهٔ تحصیلی",
		activitySummary: "خلاصهٔ فعالیت",
		recentActivity: "فعالیت‌های اخیر",
		overviewUnavailable:
			"در حال حاضر داده‌های تفصیلی در دسترس نیست. مطمئن شوید که مهاجرت مربوط به نمای کلی شاگردان ادمین اعمال شده است.",
		tabs: {
			overview: "نمای کلی",
			courses: "صنف‌ها",
			quizzes: "نتایج آزمون‌ها",
			decks: "فلش‌کارت‌ها",
			classrooms: "کلاس‌ها",
			activity: "فعالیت",
			credits: "کریژنال",
		},
		stats: {
			enrolledCourses: "صنف‌های ثبت‌نام‌شده",
			completedCourses: "صنف‌های تکمیل‌شده",
			averageScore: "میانگین نمرهٔ آزمون",
			quizAttempts: "تلاش‌های آزمون",
			quizzesPassed: "آزمون‌های پاس‌شده",
			activeDecks: "فلش‌کارت‌های فعال",
			lessonsCompleted: "درس‌های تکمیل‌شده",
			studyMinutes: "دقیقهٔ مطالعه",
			certificates: "گواهی‌نامه‌ها",
			classrooms: "کلاس‌ها",
			bookmarks: "نشانک‌ها",
			notes: "یادداشت‌ها",
		},
		fields: {
			email: "ایمیل",
			phone: "شمارهٔ تماس",
			province: "ولایت",
			balance: "موجودی کریژنال",
			joined: "تاریخ عضویت",
			lastActivity: "آخرین فعالیت",
		},
		summary: {
			grades: "صنف‌های پوشش‌داده‌شده",
			subjects: "مضامین پوشش‌داده‌شده",
			firstEnrolled: "اولین ثبت‌نام",
			lastActivity: "آخرین فعالیت",
			bestScore: "بهترین نمرهٔ آزمون",
			failedQuizzes: "آزمون‌های مردود",
			courses: "ثبت‌نام در صنف‌ها",
			decks: "فلش‌کارت‌ها",
			classrooms: "کلاس‌ها",
			lessons: "درس‌های تکمیل‌شده",
			studyTime: "مجموع زمان مطالعه",
			minutes: "{count, plural, one {# دقیقه} other {# دقیقه}}",
			bookmarks: "نشانک‌ها",
			notes: "یادداشت‌ها",
			certificates: "گواهی‌نامه‌ها",
			none: "ندارد",
		},
		table: {
			classes: "ثبت‌نام‌ها",
			gradesSubjects: "صنف / مضمون",
			score: "نمره",
		},
		list: {
			courses: "{count, plural, one {# صنف} other {# صنف}}",
			decks: "{count, plural, one {# فلش‌کارت} other {# فلش‌کارت}}",
			classrooms: "{count, plural, one {# کلاس} other {# کلاس}}",
			attempts: "{count, plural, one {# تلاش} other {# تلاش}}",
		},
		coursesTable: {
			course: "صنف",
			gradeSubject: "صنف / مضمون",
			instructor: "استاد",
			progress: "پیشرفت",
			enrolledAt: "تاریخ ثبت‌نام",
			status: "وضعیت",
			completed: "تکمیل‌شده",
			inProgress: "در حال یادگیری",
			unknownCourse: "صنف نامشخص",
			lessons: "{completed} از {total} درس",
		},
		quizzesTable: {
			quiz: "آزمون",
			subject: "صنف / مضمون",
			attempt: "تلاش",
			score: "نمره",
			result: "نتیجه",
			date: "تاریخ",
			feedback: "بازخورد استاد",
			unknownQuiz: "آزمون نامشخص",
		},
		decksTable: {
			deck: "فلش‌کارت",
			subject: "صنف / مضمون",
			cards: "کارت‌های تسلط‌یافته",
			progress: "پیشرفت",
			lastLearned: "آخرین مطالعه",
			unknownDeck: "فلش‌کارت نامشخص",
			mastered: "{count} تسلط",
		},
		classroomsTable: {
			classroom: "کلاس",
			teacher: "معلم",
			school: "مکتب",
			role: "نقش",
			joinedAt: "تاریخ عضویت",
		},
		certificatesTable: {
			course: "صنف",
			issuedAt: "تاریخ صدور",
			code: "کد تأیید",
		},
		activityTypes: {
			enrollment: "ثبت‌نام در صنف",
			quiz_attempt: "تلاش در آزمون",
			lesson_completed: "تکمیل درس",
			note: "یادداشت",
			bookmark: "نشانک",
			unknown: "فعالیت",
		},
		empty: {
			noEnrollments: "این شاگرد هنوز در هیچ صنفی ثبت‌نام نکرده است.",
			noQuizAttempts: "این شاگرد هنوز در هیچ آزمونی شرکت نکرده است.",
			noDecks: "این شاگرد هنوز در هیچ فلش‌کارتی ثبت‌نام نکرده است.",
			noClassrooms: "این شاگرد عضو هیچ کلاسی نیست.",
			noCertificates: "هنوز گواهی‌نامه‌ای صادر نشده است.",
			noActivity: "هنوز فعالیتی ثبت نشده است.",
		},
	},
	ps: {
		title: "د شاګد جزئیات",
		unnamedStudent: "بې‌نومه شاګد",
		backToStudents: "شاتګ ته بېرته ستګه",
		profile: "معلومات",
		academicSummary: "د تحصیلي خلاصه",
		activitySummary: "د فعالیت خلاصه",
		recentActivity: "وروستي فعالیتونه",
		overviewUnavailable:
			"اوس جزئیات معلومات شتون نلري. ډاګه کړئ چې د ادمین د شاګد خلاصه مهاجرت پلی شوی وي.",
		tabs: {
			overview: "خلاصه",
			courses: "صنفونه",
			quizzes: "د ازموینو پایله",
			decks: "فلش‌کارتونه",
			classrooms: "کلاسونه",
			activity: "فعالیت",
			credits: "کریډټ",
		},
		stats: {
			enrolledCourses: "ثبت‌شوي صنفونه",
			completedCourses: "بشپړ شوي صنفونه",
			averageScore: "د ازموین اوسط نمره",
			quizAttempts: "د ازموینو هڅې",
			quizzesPassed: "پاس شوي ازمونونه",
			activeDecks: "فعال فلش‌کارتونه",
			lessonsCompleted: "بشپړ شوي درسونه",
			studyMinutes: "د مطالعې دقیقې",
			certificates: "سندونه",
			classrooms: "کلاسونه",
			bookmarks: "نښانې",
			notes: "یادداشتونه",
		},
		fields: {
			email: "برېښنالیک",
			phone: "د تلیفون شمېره",
			province: "ولایت",
			balance: "د کریډټ شات",
			joined: "د غړې نېټه",
			lastActivity: "وروستي فعالیت",
		},
		summary: {
			grades: "پوښ شوي صنفونه",
			subjects: "پوښ شوي مضامین",
			firstEnrolled: "لومړی ثبت",
			lastActivity: "وروستي فعالیت",
			bestScore: "غوره نمره",
			failedQuizzes: "ناکام ازمونونه",
			courses: "د صنفونو ثبت",
			decks: "فلش‌کارتونه",
			classrooms: "کلاسونه",
			lessons: "بشپړ شوي درسونه",
			studyTime: "ټول وخت د مطالعې",
			minutes: "{count, plural, one {# دقیقه} other {# دقیقې}}",
			bookmarks: "نښانې",
			notes: "یادداشتونه",
			certificates: "سندونه",
			none: "هیڅ",
		},
		table: {
			classes: "ثبت‌نامونه",
			gradesSubjects: "صنف / مضمون",
			score: "نمره",
		},
		list: {
			courses: "{count, plural, one {# صنف} other {# صنفونه}}",
			decks: "{count, plural, one {# فلش‌کارت} other {# فلش‌کارتونه}}",
			classrooms: "{count, plural, one {# کلاس} other {# کلاسونه}}",
			attempts: "{count, plural, one {# هڅه} other {# هڅې}}",
		},
		coursesTable: {
			course: "صنف",
			gradeSubject: "صنف / مضمون",
			instructor: "استاد",
			progress: "پرمختګ",
			enrolledAt: "د ثبت نېټه",
			status: "حالت",
			completed: "بشپړ",
			inProgress: "د زده‌کړې په حال کې",
			unknownCourse: "نامعلوم صنف",
			lessons: "{completed} له {total} درسونو",
		},
		quizzesTable: {
			quiz: "ازموین",
			subject: "صنف / مضمون",
			attempt: "هڅه",
			score: "نمره",
			result: "پایله",
			date: "نېټه",
			feedback: "د استاد نظر",
			unknownQuiz: "نامعلوم ازموین",
		},
		decksTable: {
			deck: "فلش‌کارت",
			subject: "صنف / مضمون",
			cards: "مسلط کارتونه",
			progress: "پرمختګ",
			lastLearned: "وروستي زده‌کړه",
			unknownDeck: "نامعلوم فلش‌کارت",
			mastered: "{count} مسلط",
		},
		classroomsTable: {
			classroom: "کلاس",
			teacher: "معلم",
			school: "مکتب",
			role: "دور",
			joinedAt: "د غړې نېټه",
		},
		certificatesTable: {
			course: "صنف",
			issuedAt: "د صدور نېټه",
			code: "د تایید کوډ",
		},
		activityTypes: {
			enrollment: "د صنف ثبت",
			quiz_attempt: "د ازموین هڅه",
			lesson_completed: "درس بشپړ شو",
			note: "یادداشت",
			bookmark: "نښان",
			unknown: "فعالیت",
		},
		empty: {
			noEnrollments: "دا شاګد لا په هیڅ صنف کې نه دی ثبت شوی.",
			noQuizAttempts: "دا شاګد لا په هیڅ ازموین کې نه دی ګډون کړی.",
			noDecks: "دا شاګد لا په هیڅ فلش‌کارت کې نه دی ثبت شوی.",
			noClassrooms: "دا شاګد د هیڅ کلاس غړی نه دی.",
			noCertificates: "لا څه سند نه دی صادر شوی.",
			noActivity: "لا څه فعالیت نه دی ثبت شوی.",
		},
	},
};

/**
 * Inserts the `admin.students` namespace into a locale file *textually*.
 *
 * A full `JSON.parse` → `JSON.stringify` round-trip would reformat every
 * array in the file (the source keeps short arrays on one line), producing a
 * huge, noisy diff. Instead we splice the new namespace into the raw text
 * right after the top-level `"admin": {` line, so only the added keys show
 * up in the diff.
 *
 * The message files are tab-indented: the top-level `"admin"` object opens at
 * two tabs, so its members live at three tabs.
 */

/** Finds the top-level `"admin": {` block and returns its start/end offsets. */
function findAdminBlock(source) {
	// Top-level keys are indented with exactly one tab; a deeper match would
	// be a nested "admin" object inside another namespace.
	const anchor = '\n\t"admin": {\n';
	const start = source.indexOf(anchor);
	if (start === -1) {
		throw new Error('Could not find the top-level "admin" namespace');
	}
	const bodyStart = start + anchor.length;

	// Walk the block character by character, tracking brace depth, so we
	// find the matching closing brace of `"admin": {`. String literals are
	// skipped so braces inside translated text do not confuse the counter.
	let depth = 1;
	let index = bodyStart;
	let inString = false;
	let escaped = false;
	while (index < source.length && depth > 0) {
		const char = source[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (char === "\\") escaped = true;
			else if (char === '"') inString = false;
		} else if (char === '"') {
			inString = true;
		} else if (char === "{") {
			depth++;
		} else if (char === "}") {
			depth--;
		}
		index++;
	}

	return { start: start + 1, bodyStart, end: index - 1 };
}

function insertNamespace(source, namespace) {
	const { bodyStart, end } = findAdminBlock(source);
	const body = source.slice(bodyStart, end);

	// Remove a previously inserted `"students"` member first (keeps the
	// script idempotent and lets it be re-run after editing the translations).
	const withoutStudents = body.replace(
		/^\t\t"students": \{[\s\S]*?\n\t\t\},\n/m,
		""
	);

	// Serialise `{ "students": <namespace> }` and strip the *outer* braces
	// only — the inner closing brace of `"students"` must stay.
	const lines = JSON.stringify({ students: namespace }, null, "\t").split("\n");
	const members = lines.slice(1, -1).map((line) => `\t${line}`);

	// The last member needs a trailing comma so the next sibling in
	// `"admin": { … }` stays separated.
	const block = `${members.join("\n").replace(/\}$/, "},")}\n`;

	return (
		source.slice(0, bodyStart) + block + withoutStudents + source.slice(end)
	);
}

function main() {
	for (const [locale, namespace] of Object.entries(TRANSLATIONS)) {
		const file = path.join(MESSAGES_DIR, `${locale}.json`);
		const source = fs.readFileSync(file, "utf8");

		const updated = insertNamespace(source, namespace);

		// Validate the result parses as JSON before writing it back.
		const parsed = JSON.parse(updated);
		if (!parsed.admin?.students) {
			throw new Error(`admin.students missing after insert in ${locale}.json`);
		}

		fs.writeFileSync(file, updated);
		console.log(`✔ ${locale}.json — admin.students`);
	}

	console.log("\nAll locales updated.");
}

if (require.main === module) {
	main();
}

module.exports = { main };
