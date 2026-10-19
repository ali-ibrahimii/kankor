import { PostgrestError } from "@supabase/supabase-js";

export function parseError(error: unknown): string | null {
	if (error instanceof PostgrestError) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	try {
		const obj = JSON.parse(String(error));
		return obj.message;
	} catch {
		return null;
	}
}
