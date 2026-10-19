import type {
	DemoCertificate,
	DemoClassroom,
	DemoClassroomInput,
	DemoCourse,
	DemoCourseInput,
	DemoEnrollment,
	DemoLesson,
	DemoLessonInput,
	DemoRole,
	DemoSchool,
	DemoSiteSettings,
	DemoState,
	DemoStatus,
	DemoUser,
} from "./types";

export class DemoError extends Error {
	constructor(public readonly code: string) {
		super(code);
		this.name = "DemoError";
	}
}

function fail(code: string): never {
	throw new DemoError(code);
}

function id(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`;
}

function required(value: string, max = 120): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > max) fail("invalidInput");
	return trimmed;
}

function email(value: string): string {
	const result = required(value, 160).toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail("invalidEmail");
	return result;
}

function actorOf(
	state: DemoState,
	actorId: string,
	roles?: DemoRole[]
): DemoUser {
	const actor = state.users.find((person) => person.id === actorId);
	if (
		!actor ||
		actor.status !== "active" ||
		(roles && !roles.includes(actor.role))
	) {
		fail("noPermission");
	}
	if (
		actor.role === "school" &&
		state.schools.find((school) => school.id === actor.schoolId)?.status !==
			"active"
	) {
		fail("noPermission");
	}
	return actor;
}

export function canManageCourse(actor: DemoUser, course: DemoCourse): boolean {
	return (
		actor.role === "admin" ||
		(actor.role === "teacher" && course.teacherId === actor.id) ||
		(actor.role === "school" &&
			!!actor.schoolId &&
			course.schoolId === actor.schoolId)
	);
}

export function canManageClassroom(
	actor: DemoUser,
	classroom: DemoClassroom
): boolean {
	return (
		actor.role === "admin" ||
		(actor.role === "teacher" && classroom.teacherId === actor.id) ||
		(actor.role === "school" &&
			!!actor.schoolId &&
			classroom.schoolId === actor.schoolId)
	);
}

function courseForEdit(
	state: DemoState,
	actorId: string,
	courseId: string
): DemoCourse {
	const actor = actorOf(state, actorId, ["admin", "teacher", "school"]);
	const course = state.courses.find((item) => item.id === courseId);
	if (!course) fail("notFound");
	if (!canManageCourse(actor, course)) fail("noPermission");
	return course;
}

function classForEdit(
	state: DemoState,
	actorId: string,
	classroomId: string
): DemoClassroom {
	const actor = actorOf(state, actorId, ["admin", "teacher", "school"]);
	const classroom = state.classrooms.find((item) => item.id === classroomId);
	if (!classroom) fail("notFound");
	if (!canManageClassroom(actor, classroom)) fail("noPermission");
	return classroom;
}

function teacherFor(
	state: DemoState,
	actor: DemoUser,
	teacherId: string
): DemoUser {
	const teacher = state.users.find(
		(user) =>
			user.id === teacherId &&
			user.role === "teacher" &&
			user.status === "active"
	);
	if (
		!teacher ||
		(actor.role === "teacher" && teacher.id !== actor.id) ||
		(actor.role === "school" &&
			(!actor.schoolId || teacher.schoolId !== actor.schoolId))
	) {
		fail("noPermission");
	}
	return teacher;
}

function newCode(state: DemoState): string {
	let code: string;
	do {
		code = `AK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
	} while (state.classrooms.some((item) => item.joinCode === code));
	return code;
}

export function allLessons(course: DemoCourse): DemoLesson[] {
	return course.modules.flatMap((module) => module.lessons);
}

export function progressFor(
	course: DemoCourse,
	enrollment?: DemoEnrollment
): number {
	const lessons = allLessons(course);
	if (!enrollment || lessons.length === 0) return 0;
	return Math.round(
		(100 *
			lessons.filter((lesson) =>
				enrollment.completedLessonIds.includes(lesson.id)
			).length) /
			lessons.length
	);
}

export function createCourse(
	state: DemoState,
	actorId: string,
	input: DemoCourseInput
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "teacher", "school"]);
	const teacher = teacherFor(state, actor, input.teacherId);
	const course: DemoCourse = {
		id: id("course"),
		title: required(input.title),
		description: required(input.description, 800),
		subject: required(input.subject, 60),
		color: input.color,
		teacherId: teacher.id,
		...(teacher.schoolId ? { schoolId: teacher.schoolId } : {}),
		published: false,
		modules: [],
		createdAt: new Date().toISOString(),
	};
	return { ...state, courses: [course, ...state.courses] };
}

export function updateCourse(
	state: DemoState,
	actorId: string,
	courseId: string,
	input: DemoCourseInput
): DemoState {
	courseForEdit(state, actorId, courseId);
	const actor = actorOf(state, actorId);
	const teacher = teacherFor(state, actor, input.teacherId);
	return {
		...state,
		courses: state.courses.map((course) =>
			course.id === courseId
				? {
						...course,
						title: required(input.title),
						description: required(input.description, 800),
						subject: required(input.subject, 60),
						color: input.color,
						teacherId: teacher.id,
						schoolId: teacher.schoolId,
					}
				: course
		),
	};
}

export function setCoursePublished(
	state: DemoState,
	actorId: string,
	courseId: string,
	published: boolean
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (published && allLessons(course).length === 0) fail("courseNeedsLesson");
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId ? { ...item, published } : item
		),
	};
}

export function deleteCourse(
	state: DemoState,
	actorId: string,
	courseId: string
): DemoState {
	courseForEdit(state, actorId, courseId);
	if (state.enrollments.some((entry) => entry.courseId === courseId))
		fail("courseHasEnrollments");
	return {
		...state,
		courses: state.courses.filter((item) => item.id !== courseId),
		classrooms: state.classrooms.map((item) =>
			item.courseId === courseId ? { ...item, courseId: undefined } : item
		),
	};
}

export function addModule(
	state: DemoState,
	actorId: string,
	courseId: string,
	title: string
): DemoState {
	courseForEdit(state, actorId, courseId);
	const module = { id: id("module"), title: required(title), lessons: [] };
	return {
		...state,
		courses: state.courses.map((course) =>
			course.id === courseId
				? { ...course, modules: [...course.modules, module] }
				: course
		),
	};
}

export function renameModule(
	state: DemoState,
	actorId: string,
	courseId: string,
	moduleId: string,
	title: string
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (!course.modules.some((module) => module.id === moduleId))
		fail("notFound");
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId
				? {
						...item,
						modules: item.modules.map((module) =>
							module.id === moduleId
								? { ...module, title: required(title) }
								: module
						),
					}
				: item
		),
	};
}

export function removeModule(
	state: DemoState,
	actorId: string,
	courseId: string,
	moduleId: string
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (!course.modules.some((module) => module.id === moduleId))
		fail("notFound");
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId
				? {
						...item,
						modules: item.modules.filter((module) => module.id !== moduleId),
					}
				: item
		),
	};
}

export function addLesson(
	state: DemoState,
	actorId: string,
	courseId: string,
	moduleId: string,
	input: DemoLessonInput
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (!course.modules.some((module) => module.id === moduleId))
		fail("notFound");
	const lesson = validatedLesson(input, id("lesson"));
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId
				? {
						...item,
						modules: item.modules.map((module) =>
							module.id === moduleId
								? { ...module, lessons: [...module.lessons, lesson] }
								: module
						),
					}
				: item
		),
	};
}

function validatedLesson(input: DemoLessonInput, lessonId: string): DemoLesson {
	const url = input.resourceUrl.trim();
	if (url) {
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
				fail("invalidUrl");
		} catch {
			fail("invalidUrl");
		}
	}
	if (
		!Number.isFinite(input.duration) ||
		input.duration < 1 ||
		input.duration > 600
	)
		fail("invalidInput");
	return {
		id: lessonId,
		title: required(input.title),
		type: input.type,
		duration: input.duration,
		summary: input.summary.trim().slice(0, 300),
		content: required(input.content, 10000),
		resourceUrl: url,
	};
}

export function updateLesson(
	state: DemoState,
	actorId: string,
	courseId: string,
	moduleId: string,
	lessonId: string,
	input: DemoLessonInput
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (
		!course.modules.some(
			(module) =>
				module.id === moduleId &&
				module.lessons.some((lesson) => lesson.id === lessonId)
		)
	)
		fail("notFound");
	const lesson = validatedLesson(input, lessonId);
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId
				? {
						...item,
						modules: item.modules.map((module) =>
							module.id === moduleId
								? {
										...module,
										lessons: module.lessons.map((entry) =>
											entry.id === lessonId ? lesson : entry
										),
									}
								: module
						),
					}
				: item
		),
	};
}

export function removeLesson(
	state: DemoState,
	actorId: string,
	courseId: string,
	moduleId: string,
	lessonId: string
): DemoState {
	const course = courseForEdit(state, actorId, courseId);
	if (
		!course.modules.some(
			(module) =>
				module.id === moduleId &&
				module.lessons.some((lesson) => lesson.id === lessonId)
		)
	)
		fail("notFound");
	return {
		...state,
		courses: state.courses.map((item) =>
			item.id === courseId
				? {
						...item,
						modules: item.modules.map((module) =>
							module.id === moduleId
								? {
										...module,
										lessons: module.lessons.filter(
											(lesson) => lesson.id !== lessonId
										),
									}
								: module
						),
					}
				: item
		),
	};
}

export function createClassroom(
	state: DemoState,
	actorId: string,
	input: DemoClassroomInput
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "teacher", "school"]);
	const teacher = teacherFor(state, actor, input.teacherId);
	const course = input.courseId
		? state.courses.find((item) => item.id === input.courseId)
		: undefined;
	if (input.courseId && (!course || course.teacherId !== teacher.id))
		fail("noPermission");
	const classroom: DemoClassroom = {
		id: id("class"),
		title: required(input.title),
		description: input.description.trim().slice(0, 800),
		teacherId: teacher.id,
		...(teacher.schoolId ? { schoolId: teacher.schoolId } : {}),
		...(course ? { courseId: course.id } : {}),
		joinCode: newCode(state),
		memberIds: [],
		requestIds: [],
		createdAt: new Date().toISOString(),
	};
	return { ...state, classrooms: [classroom, ...state.classrooms] };
}

export function regenerateJoinCode(
	state: DemoState,
	actorId: string,
	classroomId: string
): DemoState {
	classForEdit(state, actorId, classroomId);
	const code = newCode(state);
	return {
		...state,
		classrooms: state.classrooms.map((item) =>
			item.id === classroomId ? { ...item, joinCode: code } : item
		),
	};
}

/** Accept just a code or a link copied from this demo. Never follows external URLs. */
export function extractJoinCode(value: string): string {
	let raw = value.trim();
	if (raw.startsWith("http://") || raw.startsWith("https://")) {
		try {
			raw = new URL(raw).searchParams.get("invite") ?? "";
		} catch {
			fail("invalidCode");
		}
	}
	const code = raw.toUpperCase();
	if (!/^AK-[A-Z0-9]{6,12}$/.test(code)) fail("invalidCode");
	return code;
}

export function requestToJoin(
	state: DemoState,
	actorId: string,
	codeOrLink: string
): DemoState {
	const actor = actorOf(state, actorId, ["student"]);
	const code = extractJoinCode(codeOrLink);
	const classroom = state.classrooms.find((item) => item.joinCode === code);
	if (!classroom) fail("invalidCode");
	if (classroom.memberIds.includes(actor.id)) fail("alreadyMember");
	if (classroom.requestIds.includes(actor.id)) fail("alreadyRequested");
	return {
		...state,
		classrooms: state.classrooms.map((item) =>
			item.id === classroom.id
				? { ...item, requestIds: [...item.requestIds, actor.id] }
				: item
		),
	};
}

export function respondToJoin(
	state: DemoState,
	actorId: string,
	classroomId: string,
	studentId: string,
	approve: boolean
): DemoState {
	const classroom = classForEdit(state, actorId, classroomId);
	if (!classroom.requestIds.includes(studentId)) fail("notFound");
	const student = state.users.find(
		(person) =>
			person.id === studentId &&
			person.role === "student" &&
			person.status === "active"
	);
	if (approve && !student) fail("noPermission");
	return {
		...state,
		classrooms: state.classrooms.map((item) =>
			item.id === classroomId
				? {
						...item,
						requestIds: item.requestIds.filter(
							(request) => request !== studentId
						),
						memberIds: approve
							? [...item.memberIds, studentId]
							: item.memberIds,
					}
				: item
		),
	};
}

export function addClassroomMember(
	state: DemoState,
	actorId: string,
	classroomId: string,
	studentId: string
): DemoState {
	const classroom = classForEdit(state, actorId, classroomId);
	const student = state.users.find(
		(person) =>
			person.id === studentId &&
			person.role === "student" &&
			person.status === "active"
	);
	if (!student) fail("notFound");
	if (classroom.memberIds.includes(studentId)) fail("alreadyMember");
	return {
		...state,
		classrooms: state.classrooms.map((item) =>
			item.id === classroomId
				? {
						...item,
						memberIds: [...item.memberIds, studentId],
						requestIds: item.requestIds.filter((value) => value !== studentId),
					}
				: item
		),
	};
}

export function removeClassroomMember(
	state: DemoState,
	actorId: string,
	classroomId: string,
	studentId: string
): DemoState {
	const classroom = classForEdit(state, actorId, classroomId);
	if (!classroom.memberIds.includes(studentId)) fail("notFound");
	return {
		...state,
		classrooms: state.classrooms.map((item) =>
			item.id === classroomId
				? {
						...item,
						memberIds: item.memberIds.filter((value) => value !== studentId),
					}
				: item
		),
	};
}

export function enrollInCourse(
	state: DemoState,
	actorId: string,
	courseId: string
): DemoState {
	const actor = actorOf(state, actorId, ["student"]);
	const course = state.courses.find((item) => item.id === courseId);
	if (!course || !course.published || allLessons(course).length === 0)
		fail("notFound");
	if (
		state.enrollments.some(
			(entry) => entry.studentId === actor.id && entry.courseId === courseId
		)
	)
		fail("alreadyEnrolled");
	return {
		...state,
		enrollments: [
			...state.enrollments,
			{
				id: id("enrollment"),
				courseId,
				studentId: actor.id,
				completedLessonIds: [],
				enrolledAt: new Date().toISOString(),
			},
		],
	};
}

export function completeLesson(
	state: DemoState,
	actorId: string,
	courseId: string,
	lessonId: string
): DemoState {
	actorOf(state, actorId, ["student"]);
	const course = state.courses.find(
		(item) => item.id === courseId && item.published
	);
	const enrollment = state.enrollments.find(
		(item) => item.courseId === courseId && item.studentId === actorId
	);
	if (
		!course ||
		!enrollment ||
		!allLessons(course).some((lesson) => lesson.id === lessonId)
	)
		fail("noPermission");
	if (enrollment.completedLessonIds.includes(lessonId)) return state;
	const updatedEnrollment = {
		...enrollment,
		completedLessonIds: [...enrollment.completedLessonIds, lessonId],
	};
	const alreadyIssued = state.certificates.some(
		(certificate) =>
			certificate.courseId === courseId && certificate.studentId === actorId
	);
	const complete = progressFor(course, updatedEnrollment) === 100;
	const certificate: DemoCertificate | undefined =
		complete && !alreadyIssued
			? {
					id: id("certificate"),
					code: `AK-CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
					courseId,
					studentId: actorId,
					issuedAt: new Date().toISOString(),
				}
			: undefined;
	return {
		...state,
		enrollments: state.enrollments.map((item) =>
			item.id === enrollment.id ? updatedEnrollment : item
		),
		certificates: certificate
			? [...state.certificates, certificate]
			: state.certificates,
	};
}

export function revokeCertificate(
	state: DemoState,
	actorId: string,
	certificateId: string,
	revoke: boolean
): DemoState {
	actorOf(state, actorId, ["admin"]);
	if (!state.certificates.some((item) => item.id === certificateId))
		fail("notFound");
	return {
		...state,
		certificates: state.certificates.map((item) =>
			item.id === certificateId
				? { ...item, revokedAt: revoke ? new Date().toISOString() : undefined }
				: item
		),
	};
}

export function verifyCertificate(
	state: DemoState,
	code: string
): DemoCertificate | null {
	return (
		state.certificates.find(
			(item) =>
				item.code.toUpperCase() === code.trim().toUpperCase() && !item.revokedAt
		) ?? null
	);
}

export function setUserStatus(
	state: DemoState,
	actorId: string,
	userId: string,
	status: DemoStatus
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "school"]);
	const user = state.users.find((person) => person.id === userId);
	if (
		!user ||
		user.role === "admin" ||
		user.role === "school" ||
		user.id === actor.id ||
		(actor.role === "school" && user.schoolId !== actor.schoolId)
	)
		fail("noPermission");
	return {
		...state,
		users: state.users.map((person) =>
			person.id === userId ? { ...person, status } : person
		),
	};
}

export function assignSchool(
	state: DemoState,
	actorId: string,
	userId: string,
	schoolId?: string
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "school"]);
	const user = state.users.find((person) => person.id === userId);
	if (!user || (user.role !== "student" && user.role !== "teacher"))
		fail("noPermission");
	if (
		actor.role === "school" &&
		(schoolId !== actor.schoolId ||
			(user.schoolId && user.schoolId !== actor.schoolId))
	)
		fail("noPermission");
	if (schoolId && !state.schools.some((school) => school.id === schoolId))
		fail("notFound");
	return {
		...state,
		users: state.users.map((person) =>
			person.id === userId ? { ...person, schoolId } : person
		),
	};
}

export function createUser(
	state: DemoState,
	actorId: string,
	input: Pick<DemoUser, "name" | "email" | "role"> & { schoolId?: string }
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "school"]);
	if (
		(input.role !== "student" && input.role !== "teacher") ||
		(actor.role === "school" && input.schoolId !== actor.schoolId)
	)
		fail("noPermission");
	const normalizedEmail = email(input.email);
	if (
		state.users.some((person) => person.email.toLowerCase() === normalizedEmail)
	)
		fail("duplicateEmail");
	if (
		input.schoolId &&
		!state.schools.some((school) => school.id === input.schoolId)
	)
		fail("notFound");
	const user: DemoUser = {
		id: id("user"),
		name: required(input.name),
		email: normalizedEmail,
		role: input.role,
		status: "active",
		...(input.schoolId ? { schoolId: input.schoolId } : {}),
	};
	return { ...state, users: [...state.users, user] };
}

export function updateProfile(
	state: DemoState,
	actorId: string,
	userId: string,
	name: string,
	contactEmail: string
): DemoState {
	const actor = actorOf(state, actorId);
	const user = state.users.find((person) => person.id === userId);
	if (
		!user ||
		(actor.role !== "admin" && actor.id !== userId) ||
		(actor.role === "admin" && user.role === "admin" && user.id !== actor.id)
	)
		fail("noPermission");
	const normalizedEmail = email(contactEmail);
	if (
		state.users.some(
			(person) =>
				person.id !== userId && person.email.toLowerCase() === normalizedEmail
		)
	)
		fail("duplicateEmail");
	return {
		...state,
		users: state.users.map((person) =>
			person.id === userId
				? { ...person, name: required(name), email: normalizedEmail }
				: person
		),
	};
}

export function createSchool(
	state: DemoState,
	actorId: string,
	input: Pick<DemoSchool, "name" | "city" | "email">
): DemoState {
	actorOf(state, actorId, ["admin"]);
	const normalizedEmail = email(input.email);
	if (
		state.users.some((person) => person.email.toLowerCase() === normalizedEmail)
	)
		fail("duplicateEmail");
	const school: DemoSchool = {
		id: id("school"),
		name: required(input.name),
		city: required(input.city),
		email: normalizedEmail,
		status: "pending",
	};
	const manager: DemoUser = {
		id: id("school-manager"),
		name: school.name,
		email: normalizedEmail,
		role: "school",
		schoolId: school.id,
		status: "pending",
	};
	return {
		...state,
		schools: [...state.schools, school],
		users: [...state.users, manager],
	};
}

export function updateSchool(
	state: DemoState,
	actorId: string,
	schoolId: string,
	input: Pick<DemoSchool, "name" | "city" | "email">
): DemoState {
	const actor = actorOf(state, actorId, ["admin", "school"]);
	if (actor.role === "school" && actor.schoolId !== schoolId)
		fail("noPermission");
	if (!state.schools.some((school) => school.id === schoolId)) fail("notFound");
	return {
		...state,
		schools: state.schools.map((school) =>
			school.id === schoolId
				? {
						...school,
						name: required(input.name),
						city: required(input.city),
						email: email(input.email),
					}
				: school
		),
	};
}

export function setSchoolStatus(
	state: DemoState,
	actorId: string,
	schoolId: string,
	status: DemoStatus
): DemoState {
	actorOf(state, actorId, ["admin"]);
	if (!state.schools.some((school) => school.id === schoolId)) fail("notFound");
	return {
		...state,
		schools: state.schools.map((school) =>
			school.id === schoolId ? { ...school, status } : school
		),
		users: state.users.map((person) =>
			person.role === "school" && person.schoolId === schoolId
				? { ...person, status }
				: person
		),
	};
}

export function updateSiteSettings(
	state: DemoState,
	actorId: string,
	input: DemoSiteSettings
): DemoState {
	actorOf(state, actorId, ["admin"]);
	return {
		...state,
		settings: {
			siteName: required(input.siteName),
			tagline: required(input.tagline),
			heroTitle: required(input.heroTitle),
			heroDescription: required(input.heroDescription, 500),
			contactEmail: email(input.contactEmail),
			announcement: input.announcement.trim().slice(0, 200),
		},
	};
}
