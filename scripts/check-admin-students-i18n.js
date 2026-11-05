/**
 * Verifies that every `admin.students.*` translation key used in the app
 * exists in all three locale files.
 *
 * next-intl throws at render time when a key is missing, which in a
 * production build shows up as an error boundary instead of a readable
 * message. This check runs in CI so the three locales can never drift
 * apart.
 *
 * Usage:
 *   node scripts/check-admin-students-i18n.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MESSAGES_DIR = path.join(ROOT, "src/messages");
const LOCALES = ["en", "fa", "ps"];

/**
 * Keys the student pages read at runtime, grouped by the file that uses
 * them. Keep in sync with:
 *   - src/app/[locale]/d/admin/users/students/page.tsx
 *   - src/app/[locale]/d/admin/users/students/[user_id]/page.tsx
 *   - src/components/blocks/admin/student-overview-panel.tsx
 */
const REQUIRED_KEYS = {
	// Top level
	"admin.students.title": null,
	"admin.students.unnamedStudent": null,
	"admin.students.backToStudents": null,
	"admin.students.profile": null,
	"admin.students.academicSummary": null,
	"admin.students.activitySummary": null,
	"admin.students.recentActivity": null,
	"admin.students.overviewUnavailable": null,

	// tabs
	"admin.students.tabs.overview": null,
	"admin.students.tabs.courses": null,
	"admin.students.tabs.quizzes": null,
	"admin.students.tabs.decks": null,
	"admin.students.tabs.classrooms": null,
	"admin.students.tabs.activity": null,
	"admin.students.tabs.credits": null,

	// stats
	"admin.students.stats.enrolledCourses": null,
	"admin.students.stats.completedCourses": null,
	"admin.students.stats.averageScore": null,
	"admin.students.stats.quizAttempts": null,
	"admin.students.stats.quizzesPassed": null,
	"admin.students.stats.activeDecks": null,
	"admin.students.stats.lessonsCompleted": null,
	"admin.students.stats.studyMinutes": null,
	"admin.students.stats.certificates": null,
	"admin.students.stats.classrooms": null,
	"admin.students.stats.bookmarks": null,
	"admin.students.stats.notes": null,

	// fields
	"admin.students.fields.email": null,
	"admin.students.fields.phone": null,
	"admin.students.fields.province": null,
	"admin.students.fields.balance": null,
	"admin.students.fields.joined": null,
	"admin.students.fields.lastActivity": null,

	// summary
	"admin.students.summary.grades": null,
	"admin.students.summary.subjects": null,
	"admin.students.summary.firstEnrolled": null,
	"admin.students.summary.lastActivity": null,
	"admin.students.summary.bestScore": null,
	"admin.students.summary.failedQuizzes": null,
	"admin.students.summary.courses": null,
	"admin.students.summary.decks": null,
	"admin.students.summary.classrooms": null,
	"admin.students.summary.lessons": null,
	"admin.students.summary.studyTime": null,
	"admin.students.summary.minutes": null,
	"admin.students.summary.bookmarks": null,
	"admin.students.summary.notes": null,
	"admin.students.summary.certificates": null,
	"admin.students.summary.none": null,

	// list page table + counters
	"admin.students.table.classes": null,
	"admin.students.table.gradesSubjects": null,
	"admin.students.table.score": null,
	"admin.students.list.courses": null,
	"admin.students.list.decks": null,
	"admin.students.list.classrooms": null,
	"admin.students.list.attempts": null,

	// courses table
	"admin.students.coursesTable.course": null,
	"admin.students.coursesTable.gradeSubject": null,
	"admin.students.coursesTable.instructor": null,
	"admin.students.coursesTable.progress": null,
	"admin.students.coursesTable.enrolledAt": null,
	"admin.students.coursesTable.status": null,
	"admin.students.coursesTable.completed": null,
	"admin.students.coursesTable.inProgress": null,
	"admin.students.coursesTable.unknownCourse": null,
	"admin.students.coursesTable.lessons": null,

	// quizzes table
	"admin.students.quizzesTable.quiz": null,
	"admin.students.quizzesTable.subject": null,
	"admin.students.quizzesTable.attempt": null,
	"admin.students.quizzesTable.score": null,
	"admin.students.quizzesTable.result": null,
	"admin.students.quizzesTable.date": null,
	"admin.students.quizzesTable.feedback": null,
	"admin.students.quizzesTable.unknownQuiz": null,

	// decks table
	"admin.students.decksTable.deck": null,
	"admin.students.decksTable.subject": null,
	"admin.students.decksTable.cards": null,
	"admin.students.decksTable.progress": null,
	"admin.students.decksTable.lastLearned": null,
	"admin.students.decksTable.unknownDeck": null,
	"admin.students.decksTable.mastered": null,

	// classrooms table
	"admin.students.classroomsTable.classroom": null,
	"admin.students.classroomsTable.teacher": null,
	"admin.students.classroomsTable.school": null,
	"admin.students.classroomsTable.role": null,
	"admin.students.classroomsTable.joinedAt": null,

	// certificates table
	"admin.students.certificatesTable.course": null,
	"admin.students.certificatesTable.issuedAt": null,
	"admin.students.certificatesTable.code": null,

	// activity types
	"admin.students.activityTypes.enrollment": null,
	"admin.students.activityTypes.quiz_attempt": null,
	"admin.students.activityTypes.lesson_completed": null,
	"admin.students.activityTypes.note": null,
	"admin.students.activityTypes.bookmark": null,
	"admin.students.activityTypes.unknown": null,

	// empty states
	"admin.students.empty.noEnrollments": null,
	"admin.students.empty.noQuizAttempts": null,
	"admin.students.empty.noDecks": null,
	"admin.students.empty.noClassrooms": null,
	"admin.students.empty.noCertificates": null,
	"admin.students.empty.noActivity": null,
};

function resolve(data, dottedKey) {
	return dottedKey
		.split(".")
		.reduce((acc, part) => (acc == null ? undefined : acc[part]), data);
}

function main() {
	const messages = {};
	for (const locale of LOCALES) {
		messages[locale] = JSON.parse(
			fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8")
		);
	}

	const keys = Object.keys(REQUIRED_KEYS);
	let failures = 0;

	for (const key of keys) {
		for (const locale of LOCALES) {
			const value = resolve(messages[locale], key);
			if (value === undefined || value === null || value === "") {
				console.error(`✘ ${locale}: missing "${key}"`);
				failures++;
			}
		}
	}

	// The reverse direction: keys present in one locale but not another.
	const keySets = {};
	for (const locale of LOCALES) {
		keySets[locale] = new Set(
			Object.keys(messages[locale].admin?.students ?? {}).flatMap((top) => {
				const value = messages[locale].admin.students[top];
				if (typeof value !== "object" || value === null) return [top];
				return Object.keys(value).map((sub) => `${top}.${sub}`);
			})
		);
	}

	const reference = keySets.en;
	for (const locale of LOCALES.filter((l) => l !== "en")) {
		for (const key of reference) {
			if (!keySets[locale].has(key)) {
				console.error(
					`✘ ${locale}: extra/missing key "${key}" (present in en)`
				);
				failures++;
			}
		}
		for (const key of keySets[locale]) {
			if (!reference.has(key)) {
				console.error(`✘ ${locale}: key "${key}" is not in en`);
				failures++;
			}
		}
	}

	if (failures > 0) {
		console.error(`\n${failures} i18n problem(s) found.`);
		process.exit(1);
	}

	console.log(
		`✔ All ${keys.length} admin.students keys present in ${LOCALES.join(", ")}`
	);
}

if (require.main === module) {
	main();
}

module.exports = { main, REQUIRED_KEYS, LOCALES };
