import { redirect } from "next/navigation";
import type { BaseParams } from "@/types/common.types";

export default async function AdminUsersIndexPage({
	params,
}: {
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	redirect(`/${locale}/d/admin/users/students`);
}
