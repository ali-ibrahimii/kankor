"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
	CreatePostInput,
	CreateThreadInput,
	DiscussionReactionEmoji,
	DiscussionReportReason,
	DiscussionResourceType,
} from "@/types/discussion.types";

/**
 * Creates a new discussion thread with optional tags & attachments.
 */
export async function createDiscussionThreadAction(input: CreateThreadInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Authentication required");
	}

	// 1. Insert Thread Record
	const { data: thread, error: threadError } = await supabase
		.from("discussion_threads")
		.insert({
			user_id: user.id,
			title: input.title,
			content: input.content,
			resource_type: input.resource_type,
			resource_id: input.resource_id,
			type: input.type || "discussion",
			is_anonymous: input.is_anonymous || false,
			is_instructor_only: input.is_instructor_only || false,
		})
		.select()
		.single();

	if (threadError || !thread) {
		throw new Error(threadError?.message || "Failed to create thread");
	}

	// 2. Process Tags if provided
	if (input.tags && input.tags.length > 0) {
		for (const rawTag of input.tags) {
			const cleanName = rawTag.trim();
			const slug = cleanName
				.toLowerCase()
				.replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
				.replace(/^-+|-+$/g, "");

			if (!slug) continue;

			let tagId: string;
			const { data: existingTag } = await supabase
				.from("discussion_tags")
				.select("id")
				.eq("slug", slug)
				.maybeSingle();

			if (existingTag) {
				tagId = existingTag.id;
			} else {
				const { data: newTag } = await supabase
					.from("discussion_tags")
					.insert({ name: cleanName, slug })
					.select("id")
					.single();
				if (newTag) tagId = newTag.id;
				else continue;
			}

			await supabase
				.from("discussion_thread_tags")
				.insert({ thread_id: thread.id, tag_id: tagId })
				.maybeSingle();
		}
	}

	// 3. Attachments
	if (input.attachments && input.attachments.length > 0) {
		const attachmentRows = input.attachments.map((att) => ({
			thread_id: thread.id,
			uploader_id: user.id,
			file_name: att.file_name,
			file_path: att.file_path,
			file_size: att.file_size,
			mime_type: att.mime_type,
			file_type: att.file_type,
		}));
		await supabase.from("discussion_attachments").insert(attachmentRows);
	}

	// Auto-subscribe creator to thread
	await supabase
		.from("discussion_subscriptions")
		.insert({ user_id: user.id, thread_id: thread.id })
		.maybeSingle();

	revalidatePath("/d/discussions");
	return thread;
}

/**
 * Creates a post or nested reply in a discussion thread.
 */
export async function createDiscussionPostAction(input: CreatePostInput) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Authentication required");
	}

	const { data: post, error } = await supabase
		.from("discussion_posts")
		.insert({
			thread_id: input.thread_id,
			user_id: user.id,
			content: input.content,
			parent_post_id: input.parent_post_id || null,
			is_anonymous: input.is_anonymous || false,
		})
		.select()
		.single();

	if (error || !post) {
		throw new Error(error?.message || "Failed to submit reply");
	}

	if (input.attachments && input.attachments.length > 0) {
		const attachmentRows = input.attachments.map((att) => ({
			thread_id: input.thread_id,
			post_id: post.id,
			uploader_id: user.id,
			file_name: att.file_name,
			file_path: att.file_path,
			file_size: att.file_size,
			mime_type: att.mime_type,
			file_type: att.file_type,
		}));
		await supabase.from("discussion_attachments").insert(attachmentRows);
	}

	// Auto-subscribe replier
	await supabase
		.from("discussion_subscriptions")
		.insert({ user_id: user.id, thread_id: input.thread_id })
		.maybeSingle();

	return post;
}

/**
 * Atomic upvote/downvote for thread or post.
 */
export async function voteDiscussionAction(
	target_type: "thread" | "post",
	target_id: string,
	vote: 1 | -1
) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("vote_discussion", {
		p_target_type: target_type,
		p_target_id: target_id,
		p_vote: vote,
	});

	if (error) {
		throw new Error(error.message);
	}
	return data;
}

/**
 * Toggle emoji reaction for thread or post.
 */
export async function toggleReactionAction(
	target_type: "thread" | "post",
	target_id: string,
	emoji: DiscussionReactionEmoji
) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("toggle_reaction", {
		p_target_type: target_type,
		p_target_id: target_id,
		p_emoji: emoji,
	});

	if (error) {
		throw new Error(error.message);
	}
	return data;
}

/**
 * Mark post as accepted solution.
 */
export async function markAcceptedSolutionAction(post_id: string) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("mark_accepted_solution", {
		p_post_id: post_id,
	});

	if (error) {
		throw new Error(error.message);
	}
	return data;
}

/**
 * Toggle bookmark state for thread.
 */
export async function toggleBookmarkAction(thread_id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Authentication required");

	const { data: existing } = await supabase
		.from("discussion_bookmarks")
		.select("id")
		.eq("user_id", user.id)
		.eq("thread_id", thread_id)
		.maybeSingle();

	if (existing) {
		await supabase.from("discussion_bookmarks").delete().eq("id", existing.id);
		return { is_bookmarked: false };
	}

	await supabase
		.from("discussion_bookmarks")
		.insert({ user_id: user.id, thread_id });
	return { is_bookmarked: true };
}

/**
 * Toggle subscription state for thread.
 */
export async function toggleSubscriptionAction(thread_id: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Authentication required");

	const { data: existing } = await supabase
		.from("discussion_subscriptions")
		.select("id")
		.eq("user_id", user.id)
		.eq("thread_id", thread_id)
		.maybeSingle();

	if (existing) {
		await supabase
			.from("discussion_subscriptions")
			.delete()
			.eq("id", existing.id);
		return { is_subscribed: false };
	}

	await supabase
		.from("discussion_subscriptions")
		.insert({ user_id: user.id, thread_id });
	return { is_subscribed: true };
}

/**
 * Finds similar existing threads before creating a new one.
 */
export async function findSimilarThreadsAction(
	title: string,
	content: string,
	resource_type: DiscussionResourceType = "general",
	resource_id = "general"
) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("find_similar_threads", {
		p_title: title,
		p_content: content,
		p_resource_type: resource_type,
		p_resource_id: resource_id,
		p_limit: 5,
	});

	if (error) return [];
	return data || [];
}

/**
 * Submit user report for moderation.
 */
export async function reportDiscussionAction(
	target_type: "thread" | "post",
	target_id: string,
	reason: DiscussionReportReason,
	details?: string
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Authentication required");

	const { data, error } = await supabase
		.from("discussion_reports")
		.insert({
			reporter_id: user.id,
			target_type,
			target_id,
			reason,
			details: details || null,
		})
		.select()
		.single();

	if (error) throw new Error(error.message);
	return data;
}

/**
 * Moderation actions (soft delete, restore, pin, lock, close).
 */
export async function moderateDiscussionAction(
	action:
		| "delete"
		| "restore"
		| "pin"
		| "unpin"
		| "lock"
		| "unlock"
		| "close"
		| "reopen",
	target_type: "thread" | "post",
	target_id: string
) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Authentication required");

	if (target_type === "thread") {
		const updatePayload: any = {};
		if (action === "delete") {
			updatePayload.deleted_at = new Date().toISOString();
			updatePayload.deleted_by = user.id;
		} else if (action === "restore") {
			updatePayload.deleted_at = null;
			updatePayload.deleted_by = null;
		} else if (action === "pin") {
			updatePayload.is_pinned = true;
		} else if (action === "unpin") {
			updatePayload.is_pinned = false;
		} else if (action === "lock") {
			updatePayload.is_locked = true;
		} else if (action === "unlock") {
			updatePayload.is_locked = false;
		} else if (action === "close") {
			updatePayload.status = "closed";
		} else if (action === "reopen") {
			updatePayload.status = "open";
		}

		const { error } = await supabase
			.from("discussion_threads")
			.update(updatePayload)
			.eq("id", target_id);

		if (error) throw new Error(error.message);
	} else if (target_type === "post") {
		const updatePayload: any = {};
		if (action === "delete") {
			updatePayload.deleted_at = new Date().toISOString();
			updatePayload.deleted_by = user.id;
		} else if (action === "restore") {
			updatePayload.deleted_at = null;
			updatePayload.deleted_by = null;
		}

		const { error } = await supabase
			.from("discussion_posts")
			.update(updatePayload)
			.eq("id", target_id);

		if (error) throw new Error(error.message);
	}

	// Audit log entry
	await supabase.from("discussion_audit_logs" as any).insert({
		actor_id: user.id,
		action,
		target_type,
		target_id,
	});

	return { success: true };
}
