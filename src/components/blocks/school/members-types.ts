import type { Database } from "@/lib/supabase/database.types";

export type SchoolMemberRole =
	Database["public"]["Enums"]["school_member_role"];

export type SchoolMemberRow = {
	id: string;
	user_id: string;
	role: SchoolMemberRole;
	created_at: string;
	profile?: {
		full_name: string | null;
		avatar_url: string | null;
		email: string | null;
	};
};

export type SchoolInviteRow = {
	id: string;
	user_id: string;
	role: SchoolMemberRole;
	status: Database["public"]["Enums"]["school_invite_status"];
	created_at: string;
	profile?: {
		full_name: string | null;
		avatar_url: string | null;
		email: string | null;
	};
};
