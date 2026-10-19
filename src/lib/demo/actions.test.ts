import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
	addLesson,
	addModule,
	completeLesson,
	createClassroom,
	createCourse,
	extractJoinCode,
	progressFor,
	requestToJoin,
	respondToJoin,
	revokeCertificate,
	setCoursePublished,
	setSchoolStatus,
	setUserStatus,
	updateSiteSettings,
	verifyCertificate,
} from "./actions";
import { createDemoState } from "./seed";
import { DEMO_STORAGE_KEY, readDemoState, writeDemoState } from "./storage";

beforeAll(() => vi.stubGlobal("crypto", { randomUUID }));
afterAll(() => vi.unstubAllGlobals());

describe("standalone dashboard demo", () => {
	it("lets teachers create, publish and manage only their own content", () => {
		const initial = createDemoState();
		expect(() =>
			createCourse(initial, "student-1", {
				title: "Math",
				description: "New course",
				subject: "Math",
				teacherId: "teacher-1",
				color: "violet",
			})
		).toThrow("noPermission");
		const created = createCourse(initial, "teacher-1", {
			title: " Math ",
			description: "New course",
			subject: "Math",
			teacherId: "teacher-1",
			color: "violet",
		});
		const course = created.courses[0];
		expect(course.title).toBe("Math");
		expect(course.schoolId).toBe("school-ariyana");
		expect(initial.courses).not.toContainEqual(course); // pure state updates
		expect(() =>
			setCoursePublished(created, "teacher-1", course.id, true)
		).toThrow("courseNeedsLesson");
		expect(() => addModule(created, "teacher-2", course.id, "Algebra")).toThrow(
			"noPermission"
		);

		const withModule = addModule(created, "teacher-1", course.id, "Algebra");
		const withLesson = addLesson(
			withModule,
			"teacher-1",
			course.id,
			withModule.courses[0].modules[0].id,
			{
				title: "Variables",
				summary: "Introduction",
				content: "The first lesson",
				type: "text",
				duration: 20,
				resourceUrl: "",
			}
		);
		const published = setCoursePublished(
			withLesson,
			"teacher-1",
			course.id,
			true
		);
		expect(published.courses[0].published).toBe(true);
		expect(() =>
			createClassroom(published, "teacher-2", {
				title: "Class",
				description: "",
				teacherId: "teacher-2",
				courseId: course.id,
			})
		).toThrow("noPermission");
		const withClass = createClassroom(published, "teacher-1", {
			title: "Class",
			description: "Lessons",
			teacherId: "teacher-1",
			courseId: course.id,
		});
		expect(withClass.classrooms[0].joinCode).toMatch(/^AK-[A-F0-9]{8}$/);
	});

	it("opens an invite as a request, not membership, until the teacher approves", () => {
		const state = createDemoState();
		const invited = requestToJoin(
			state,
			"student-1",
			"https://example.com/fa/demo?invite=AK-PHYS26"
		);
		const classroom = invited.classrooms.find(
			(item) => item.id === "class-physics"
		)!;
		expect(classroom.requestIds).toContain("student-1");
		expect(classroom.memberIds).not.toContain("student-1");
		expect(() => requestToJoin(invited, "student-1", "AK-PHYS26")).toThrow(
			"alreadyRequested"
		);
		expect(() =>
			respondToJoin(invited, "teacher-1", classroom.id, "student-1", true)
		).toThrow("noPermission");
		const approved = respondToJoin(
			invited,
			"teacher-2",
			classroom.id,
			"student-1",
			true
		);
		expect(
			approved.classrooms.find((item) => item.id === classroom.id)?.memberIds
		).toContain("student-1");
		expect(
			approved.classrooms.find((item) => item.id === classroom.id)?.requestIds
		).not.toContain("student-1");
		expect(() => requestToJoin(approved, "student-1", "AK-PHYS26")).toThrow(
			"alreadyMember"
		);
		expect(() => requestToJoin(state, "teacher-1", "AK-PHYS26")).toThrow(
			"noPermission"
		);
		expect(() =>
			extractJoinCode("https://example.com/fa/demo?invite=INVALID")
		).toThrow("invalidCode");
	});

	it("issues one verifiable demo certificate at full progress and lets only the admin revoke it", () => {
		const state = createDemoState();
		const course = state.courses.find((item) => item.id === "course-math")!;
		const enrollment = state.enrollments.find(
			(item) => item.id === "enroll-1"
		)!;
		expect(progressFor(course, enrollment)).toBe(33);
		const partial = completeLesson(
			state,
			"student-1",
			course.id,
			"lesson-equations"
		);
		expect(partial.certificates.some((c) => c.studentId === "student-1")).toBe(
			false
		);
		const finished = completeLesson(
			partial,
			"student-1",
			course.id,
			"lesson-triangle"
		);
		const certificate = finished.certificates.find(
			(c) => c.studentId === "student-1"
		)!;
		expect(certificate).toBeDefined();
		expect(verifyCertificate(finished, certificate.code)).toEqual(certificate);
		expect(
			completeLesson(finished, "student-1", course.id, "lesson-triangle")
		).toBe(finished);
		expect(() =>
			revokeCertificate(finished, "teacher-1", certificate.id, true)
		).toThrow("noPermission");
		const revoked = revokeCertificate(
			finished,
			"admin-1",
			certificate.id,
			true
		);
		expect(verifyCertificate(revoked, certificate.code)).toBeNull();
		expect(
			verifyCertificate(
				revokeCertificate(revoked, "admin-1", certificate.id, false),
				certificate.code
			)
		).toBeTruthy();
	});

	it("limits school administration to its school while the site admin controls global settings", () => {
		const state = createDemoState();
		expect(() =>
			setUserStatus(state, "school-account", "teacher-2", "suspended")
		).toThrow("noPermission");
		expect(
			setUserStatus(
				state,
				"school-account",
				"student-1",
				"suspended"
			).users.find((person) => person.id === "student-1")?.status
		).toBe("suspended");
		expect(() =>
			updateSiteSettings(state, "school-account", state.settings)
		).toThrow("noPermission");
		const updated = updateSiteSettings(state, "admin-1", {
			...state.settings,
			siteName: "New site name",
		});
		expect(updated.settings.siteName).toBe("New site name");
		expect(state.settings.siteName).not.toBe("New site name");
		const suspended = setSchoolStatus(
			state,
			"admin-1",
			"school-ariyana",
			"suspended"
		);
		expect(
			suspended.users.find((person) => person.id === "school-account")?.status
		).toBe("suspended");
		expect(() =>
			setUserStatus(suspended, "school-account", "student-1", "active")
		).toThrow("noPermission");
	});

	it("persists separately from Supabase and falls back to seed data for invalid storage", () => {
		const memory = new Map<string, string>();
		const storage = {
			getItem: (key: string) => memory.get(key) ?? null,
			setItem: (key: string, value: string) => {
				memory.set(key, value);
			},
		};
		const state = createDemoState();
		writeDemoState(storage, state);
		expect(memory.has(DEMO_STORAGE_KEY)).toBe(true);
		expect(readDemoState(storage)).toEqual(state);
		memory.set(DEMO_STORAGE_KEY, "{invalid-json");
		expect(readDemoState(storage).version).toBe(1);
		memory.set(DEMO_STORAGE_KEY, JSON.stringify({ ...state, version: 2 }));
		expect(readDemoState(storage).version).toBe(1);
	});
});
