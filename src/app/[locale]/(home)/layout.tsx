import "@/styles/public-theme.css";
import { setRequestLocale } from "next-intl/server";
import { PublicFooter } from "@/components/blocks/footer/PublicFooter";
import { PublicNavbar } from "@/components/blocks/navbar/PublicNavbar";
import { BaseParams } from "@/types/common.types";

export default async function HomeLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<BaseParams>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<div className="public-site relative flex min-h-screen flex-col">
			<PublicNavbar />
			<main className="flex-1 w-full">{children}</main>
			<PublicFooter />
		</div>
	);
}
