"use client";

import { atom } from "jotai";
import type {
	ClassroomAnnouncement,
	ClassroomBuilderState,
	ClassroomBuilderTab,
	ClassroomDetails,
	ClassroomFolder,
	ClassroomMaterial,
	ClassroomMember,
	ClassroomResource,
} from "./types";
import { INITIAL_CLASSROOM_DETAILS } from "./types";

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: ClassroomBuilderState = {
	classroom: INITIAL_CLASSROOM_DETAILS,
	members: [],
	resources: [],
	materials: [],
	folders: [],
	announcements: [],
	isSaving: false,
	activeTab: "resources",
};

// ─── Root atom ────────────────────────────────────────────────────────────────

export const classroomBuilderAtom = atom<ClassroomBuilderState>(INITIAL_STATE);

// ─── Derived atoms ────────────────────────────────────────────────────────────

export const classroomAtom = atom((get) => get(classroomBuilderAtom).classroom);
export const membersAtom = atom((get) => get(classroomBuilderAtom).members);
export const resourcesAtom = atom((get) => get(classroomBuilderAtom).resources);
export const materialsAtom = atom((get) => get(classroomBuilderAtom).materials);
export const foldersAtom = atom((get) => get(classroomBuilderAtom).folders);
export const announcementsAtom = atom(
	(get) => get(classroomBuilderAtom).announcements
);
export const activeTabAtom = atom((get) => get(classroomBuilderAtom).activeTab);

// ─── Init atom ────────────────────────────────────────────────────────────────

export const initClassroomBuilderAtom = atom(
	null,
	(
		_get,
		set,
		payload: {
			classroom: ClassroomDetails;
			members: ClassroomMember[];
			resources: ClassroomResource[];
			materials: ClassroomMaterial[];
			folders: ClassroomFolder[];
			announcements: ClassroomAnnouncement[];
		}
	) => {
		set(classroomBuilderAtom, {
			...INITIAL_STATE,
			...payload,
		});
	}
);

// ─── Classroom write atoms ────────────────────────────────────────────────────

export const patchClassroomAtom = atom(
	null,
	(_get, set, patch: Partial<ClassroomDetails>) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			classroom: { ...prev.classroom, ...patch },
		}));
	}
);

export const setActiveTabAtom = atom(
	null,
	(_get, set, tab: ClassroomBuilderTab) => {
		set(classroomBuilderAtom, (prev) => ({ ...prev, activeTab: tab }));
	}
);

export const setSavingAtom = atom(null, (_get, set, isSaving: boolean) => {
	set(classroomBuilderAtom, (prev) => ({ ...prev, isSaving }));
});

// ─── Resources write atoms ────────────────────────────────────────────────────

export const addResourceAtom = atom(
	null,
	(_get, set, resource: ClassroomResource) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			resources: [...prev.resources, resource],
		}));
	}
);

export const removeResourceAtom = atom(null, (_get, set, id: string) => {
	set(classroomBuilderAtom, (prev) => ({
		...prev,
		resources: prev.resources.filter((r) => r.id !== id),
	}));
});

// ─── Materials write atoms ────────────────────────────────────────────────────

export const addMaterialAtom = atom(
	null,
	(_get, set, material: ClassroomMaterial) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			materials: [...prev.materials, material],
		}));
	}
);

export const removeMaterialAtom = atom(null, (_get, set, id: string) => {
	set(classroomBuilderAtom, (prev) => ({
		...prev,
		materials: prev.materials.filter((m) => m.id !== id),
	}));
});

export const updateMaterialAtom = atom(
	null,
	(
		_get,
		set,
		{ id, patch }: { id: string; patch: Partial<ClassroomMaterial> }
	) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			materials: prev.materials.map((m) =>
				m.id === id ? { ...m, ...patch } : m
			),
		}));
	}
);

// ─── Announcement write atoms ─────────────────────────────────────────────────

export const addAnnouncementAtom = atom(
	null,
	(_get, set, announcement: ClassroomAnnouncement) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			announcements: [announcement, ...prev.announcements],
		}));
	}
);

export const removeAnnouncementAtom = atom(null, (_get, set, id: string) => {
	set(classroomBuilderAtom, (prev) => ({
		...prev,
		announcements: prev.announcements.filter((a) => a.id !== id),
	}));
});

// ─── Member write atoms ───────────────────────────────────────────────────────

export const addMemberAtom = atom(
	null,
	(_get, set, member: ClassroomMember) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			members: [...prev.members, member],
		}));
	}
);

export const removeMemberAtom = atom(null, (_get, set, id: string) => {
	set(classroomBuilderAtom, (prev) => ({
		...prev,
		members: prev.members.filter((m) => m.id !== id),
	}));
});

export const updateMemberRoleAtom = atom(
	null,
	(
		_get,
		set,
		{ id, role }: { id: string; role: import("./types").ClassroomRole }
	) => {
		set(classroomBuilderAtom, (prev) => ({
			...prev,
			members: prev.members.map((m) => (m.id === id ? { ...m, role } : m)),
		}));
	}
);
