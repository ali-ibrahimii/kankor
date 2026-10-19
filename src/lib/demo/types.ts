/** Browser-only demonstration data. These records are never Supabase accounts. */
export type DemoRole = "admin" | "teacher" | "student" | "school";
export type DemoStatus = "active" | "pending" | "suspended";
export type DemoLessonType = "video" | "text" | "pdf";

export interface DemoUser {
	id: string;
	name: string;
	email: string;
	role: DemoRole;
	status: DemoStatus;
	schoolId?: string;
}

export interface DemoSchool {
	id: string;
	name: string;
	city: string;
	email: string;
	status: DemoStatus;
}

export interface DemoLesson {
	id: string;
	title: string;
	type: DemoLessonType;
	duration: number;
	summary: string;
	content: string;
	resourceUrl: string;
}

export interface DemoModule {
	id: string;
	title: string;
	lessons: DemoLesson[];
}

export interface DemoCourse {
	id: string;
	title: string;
	description: string;
	subject: string;
	teacherId: string;
	schoolId?: string;
	published: boolean;
	color: "violet" | "mint" | "peach" | "sky";
	modules: DemoModule[];
	createdAt: string;
}

export interface DemoClassroom {
	id: string;
	title: string;
	description: string;
	teacherId: string;
	schoolId?: string;
	courseId?: string;
	joinCode: string;
	memberIds: string[];
	requestIds: string[];
	createdAt: string;
}

export interface DemoEnrollment {
	id: string;
	courseId: string;
	studentId: string;
	completedLessonIds: string[];
	enrolledAt: string;
}

export interface DemoCertificate {
	id: string;
	code: string;
	courseId: string;
	studentId: string;
	issuedAt: string;
	revokedAt?: string;
}

export interface DemoSiteSettings {
	siteName: string;
	tagline: string;
	heroTitle: string;
	heroDescription: string;
	contactEmail: string;
	announcement: string;
}

export interface DemoState {
	version: 1;
	users: DemoUser[];
	schools: DemoSchool[];
	courses: DemoCourse[];
	classrooms: DemoClassroom[];
	enrollments: DemoEnrollment[];
	certificates: DemoCertificate[];
	settings: DemoSiteSettings;
}

export type DemoCourseInput = Pick<
	DemoCourse,
	"title" | "description" | "subject" | "teacherId" | "color"
>;
export type DemoLessonInput = Omit<DemoLesson, "id">;
export type DemoClassroomInput = Pick<
	DemoClassroom,
	"title" | "description" | "teacherId" | "courseId"
>;
