import type { Database } from "@/lib/supabase/database.types";
import type { TableRow } from "@/types/db.types";

export type DiscussionThread = TableRow<"discussion_threads">;
export type DiscussionPost = TableRow<"discussion_posts">;
export type DiscussionTag = TableRow<"discussion_tags">;
export type DiscussionVote = TableRow<"discussion_votes">;
export type DiscussionReaction = TableRow<"discussion_reactions">;
export type DiscussionAttachment = TableRow<"discussion_attachments">;
export type DiscussionReport = TableRow<"discussion_reports">;

export type DiscussionThreadType =
	Database["public"]["Enums"]["discussion_thread_type"];
export type DiscussionThreadStatus =
	Database["public"]["Enums"]["discussion_thread_status"];
export type DiscussionResourceType =
	Database["public"]["Enums"]["discussion_resource_type"];
export type DiscussionReactionEmoji =
	Database["public"]["Enums"]["discussion_reaction_emoji"];
export type DiscussionReportReason =
	Database["public"]["Enums"]["discussion_report_reason"];

export interface DiscussionAuthor {
	id: string;
	full_name: string | null;
	avatar_url: string | null;
	role: string | null;
	headline?: string | null;
}

export interface DiscussionThreadItem extends DiscussionThread {
	author?: DiscussionAuthor | null;
	tags_list?: DiscussionTag[];
	user_vote?: number;
	is_bookmarked?: boolean;
	is_subscribed?: boolean;
	reactions_summary?: Record<string, number>;
	user_reactions?: string[];
}

export interface DiscussionPostItem extends DiscussionPost {
	author?: DiscussionAuthor | null;
	replies?: DiscussionPostItem[];
	user_vote?: number;
	reactions_summary?: Record<string, number>;
	user_reactions?: string[];
	attachments?: DiscussionAttachment[];
}

export interface CreateThreadInput {
	title: string;
	content: string;
	resource_type: DiscussionResourceType;
	resource_id: string;
	type?: DiscussionThreadType;
	tags?: string[];
	is_anonymous?: boolean;
	is_instructor_only?: boolean;
	attachments?: {
		file_name: string;
		file_path: string;
		file_size: number;
		mime_type: string;
		file_type: "image" | "pdf" | "audio";
	}[];
}

export interface CreatePostInput {
	thread_id: string;
	content: string;
	parent_post_id?: string;
	is_anonymous?: boolean;
	attachments?: {
		file_name: string;
		file_path: string;
		file_size: number;
		mime_type: string;
		file_type: "image" | "pdf" | "audio";
	}[];
}
