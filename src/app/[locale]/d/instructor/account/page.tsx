import { redirect } from "next/navigation";

import { AccountView } from "@/components/blocks/account";
import { getCurrentUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";

export default async function InstructorAccountPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect(routes.auth.login.page(undefined, { locale }));
	}

	return <AccountView user={user} />;
}
