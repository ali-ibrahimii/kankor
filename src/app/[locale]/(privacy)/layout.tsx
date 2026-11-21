import "@/styles/public-theme.css";
import { setRequestLocale } from "next-intl/server";
import { PublicFooter } from "@/components/blocks/footer/PublicFooter";
import { PublicNavbar } from "@/components/blocks/navbar/PublicNavbar";
import { BaseParams } from "@/types/common.types";

export default async function MdxLayout({
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
			<main className="w-full flex-1 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
				<div className="prose prose-slate dark:prose-invert container mx-auto max-w-4xl rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-10 prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-foreground prose-h1:text-3xl sm:prose-h1:text-4xl prose-h2:text-2xl sm:prose-h2:text-3xl prose-h3:text-xl sm:prose-h3:text-2xl">
					{children}
				</div>
			</main>
			<PublicFooter />
		</div>
	);
}
