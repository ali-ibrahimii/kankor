import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
	const supabase = await createClient();

	// Check if a user's logged in
	const { data: claimsData } = await supabase.auth.getClaims();

	if (claimsData?.claims) {
		await supabase.auth.signOut();
	}

	revalidatePath(routes.d.page(), "layout");
	return NextResponse.redirect(new URL(routes.auth.login.page(), req.url), {
		status: 302,
	});
}
