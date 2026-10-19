"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import type { SearchResultType } from "@/components/blocks/search/build-result-href";
import { createClient } from "@/lib/supabase/client";

export type SearchSuggestion = {
	result_type: SearchResultType;
	id: string;
	title: string;
	subtitle: string | null;
	rank: number;
	slug: string;
};

const MIN_QUERY_LENGTH = 2;

export function useSearchSuggestions(query: string, limitPerType = 4) {
	const trimmed = query.trim();
	const debouncedQuery = useDebounce(trimmed, { wait: 300 });

	return useQuery({
		queryKey: ["search-suggestions", debouncedQuery, limitPerType],
		queryFn: async () => {
			const client = createClient();
			const { data, error } = await client.rpc("search_suggestions", {
				p_query: debouncedQuery,
				p_limit_per_type: limitPerType,
			});

			if (error) throw error;
			return (data ?? []) as SearchSuggestion[];
		},
		enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
		staleTime: 30_000,
		placeholderData: (prev) => prev,
	});
}
