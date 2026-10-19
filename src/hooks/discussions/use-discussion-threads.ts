"use client";

import { useMemo } from "react";
import { useQueryFilters } from "@/hooks/filter/filter.hooks";
import type { DiscussionResourceType } from "@/types/discussion.types";

interface UseDiscussionThreadsProps {
	resource_type?: DiscussionResourceType;
	resource_id?: string;
	initialPageSize?: number;
}

export function useDiscussionThreads({
	resource_type,
	resource_id,
	initialPageSize = 10,
}: UseDiscussionThreadsProps = {}) {
	const initialFilters = useMemo(() => {
		const filtersArr = [];
		if (resource_type) {
			filtersArr.push({
				field: "resource_type" as const,
				operator: "eq" as const,
				value: resource_type,
			});
		}
		if (resource_id) {
			filtersArr.push({
				field: "resource_id" as const,
				operator: "eq" as const,
				value: resource_id,
			});
		}
		return {
			name: "discussion_threads",
			filters: filtersArr,
			pagination: {
				page: 1,
				pageSize: initialPageSize,
			},
			sort: [
				{ field: "is_pinned" as const, direction: "desc" as const },
				{ field: "last_activity_at" as const, direction: "desc" as const },
			],
		};
	}, [resource_type, resource_id, initialPageSize]);

	const filterQuery = useQueryFilters<"discussion_threads">({
		table: "discussion_threads",
		initialState: initialFilters as any,
		selectColumns: `
      *,
      profiles!user_id(id, full_name, avatar_url, role)
    ` as any,
		searchColumns: ["title", "content"] as any,
	});

	return filterQuery;
}
