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
		<div className="relative min-h-screen bg-slate-50/50 flex flex-col">
			<PublicNavbar />
			<main className="flex-1 w-full pt-24 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="container mx-auto max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm prose prose-slate max-w-none prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-slate-900 prose-h1:text-3xl sm:prose-h1:text-4xl prose-h2:text-2xl sm:prose-h2:text-3xl prose-h3:text-xl sm:prose-h3:text-2xl dark:prose-headings:text-white">
					{children}
				</div>
			</main>
			<PublicFooter />
		</div>
	);
}
