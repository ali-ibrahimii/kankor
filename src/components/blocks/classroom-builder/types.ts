import type { Database } from "@/lib/supabase/database.types";

// ─── Enum aliases ─────────────────────────────────────────────────────────────

export type ClassroomRole = Database["public"]["Enums"]["classroom_role"];
export type ClassroomMaterialType =
	Database["public"]["Enums"]["classroom_material_type"];
export type ShareableType = Database["public"]["Enums"]["shareable_type"];

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface ClassroomDetails {
	id: string;
	name: string;
	description: string | null;
	cover_image: string | null;
	join_code: string;
	is_archived: boolean;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface ClassroomMember {
	id: string;
	classroom_id: string;
	user_id: string;
	role: ClassroomRole;
	created_at: string;
	profile?: {
		id: string;
		full_name: string | null;
		avatar_url: string | null;
		email?: string | null;
	};
}

export type ClassroomRequestInitiator =
	Database["public"]["Enums"]["classroom_request_initiator"];
export type ClassroomRequestStatus =
	Database["public"]["Enums"]["classroom_request_status"];

export interface ClassroomMembershipRequest {
	id: string;
	classroom_id: string;
	user_id: string;
	initiated_by: ClassroomRequestInitiator;
	status: ClassroomRequestStatus;
	invited_by: string | null;
	responded_by: string | null;
	responded_at: string | null;
	created_at: string;
	profile?: {
		id: string;
		full_name: string | null;
		avatar_url: string | null;
		email: string | null;
	};
}

export interface ClassroomResource {
	id: string;
	classroom_id: string;
	resource_id: string;
	resource_type: ShareableType;
	shared_by: string;
	created_at: string;
	// resolved title from the joined table
	title?: string;
}

export interface ClassroomFolder {
	id: string;
	classroom_id: string;
	name: string;
	sort_order: number | null;
}

export interface ClassroomMaterial {
	id: string;
	classroom_id: string;
	title: string;
	description: string | null;
	type: ClassroomMaterialType;
	folder_id: string | null;
	published: boolean;
	published_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface ClassroomAnnouncement {
	id: string;
	classroom_id: string;
	author_id: string;
	message: string;
	created_at: string;
	updated_at: string;
	author?: {
		full_name: string | null;
		avatar_url: string | null;
	};
}

// ─── Builder UI state ─────────────────────────────────────────────────────────

export interface ClassroomBuilderState {
	classroom: ClassroomDetails;
	members: ClassroomMember[];
	resources: ClassroomResource[];
	materials: ClassroomMaterial[];
	folders: ClassroomFolder[];
	announcements: ClassroomAnnouncement[];
	isSaving: boolean;
	activeTab: ClassroomBuilderTab;
}

export type ClassroomBuilderTab =
	| "resources"
	| "materials"
	| "announcements"
	| "members";

// ─── Form value types ─────────────────────────────────────────────────────────

export interface NewClassroomFormValues {
	name: string;
	description: string;
	join_code: string;
}

export interface EditClassroomFormValues {
	name: string;
	description: string;
}

export interface NewAnnouncementFormValues {
	message: string;
}

export interface AddResourceFormValues {
	resource_type: string;
	resource_id: string;
}

export interface AddMaterialFormValues {
	title: string;
	description: string;
	type: string;
	folder_id: string;
}

// ─── Classroom list meta (for grid) ──────────────────────────────────────────

export interface ClassroomMeta {
	id: string;
	name: string;
	description: string | null;
	cover_image: string | null;
	join_code: string;
	is_archived: boolean;
	user_id: string;
	created_at: string;
	updated_at: string;
	classroom_members: { count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const INITIAL_CLASSROOM_DETAILS: ClassroomDetails = {
	id: "",
	name: "",
	description: null,
	cover_image: null,
	join_code: "",
	is_archived: false,
	user_id: "",
	created_at: "",
	updated_at: "",
};
