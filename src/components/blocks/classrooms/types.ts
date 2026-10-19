import type { Database } from "@/lib/supabase/database.types";

export type MyClassroom = {
	membership_id: string;
	classroom_id: string;
	role: Database["public"]["Enums"]["classroom_role"];
	joined_at: string;
	name: string;
	description: string | null;
	cover_image: string | null;
};

export type MyClassroomRequest = {
	id: string;
	classroom_id: string;
	classroom_name: string;
	initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
	created_at: string;
};

export type ClassroomResourceForMember = {
	id: string;
	resource_type: Database["public"]["Enums"]["shareable_type"];
	resource_id: string;
	title: string;
	href: string | null;
};

export type ClassroomMaterialForMember = {
	id: string;
	title: string;
	description: string | null;
	type: Database["public"]["Enums"]["classroom_material_type"];
	created_at: string;
};

export type ClassroomAnnouncementForMember = {
	id: string;
	message: string;
	created_at: string;
	author: { full_name: string | null; avatar_url: string | null } | null;
};

export type ClassroomDetailForMember = {
	id: string;
	name: string;
	description: string | null;
	cover_image: string | null;
	role: Database["public"]["Enums"]["classroom_role"];
	resources: ClassroomResourceForMember[];
	materials: ClassroomMaterialForMember[];
	announcements: ClassroomAnnouncementForMember[];
};
