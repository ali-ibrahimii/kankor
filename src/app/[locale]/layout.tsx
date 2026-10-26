import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { Locale } from "@/i18n";
import { dirOf, routing } from "@/i18n/routing";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { themeInitScript } from "@/providers/theme-script";
import { BaseParams } from "@/types/common.types";
import { Providers } from "./providers";

// Local Vazirmatn font covers Arabic-script (Persian/Dari & Pashto) as well as Latin
// glyphs and works 100% offline without external Google Fonts requests.
const fontVazirmatn = localFont({
	src: [
		{
			path: "../../../public/fonts/vazirmatn/Vazirmatn-Light.ttf",
			weight: "300",
			style: "normal",
		},
		{
			path: "../../../public/fonts/vazirmatn/Vazirmatn-Regular.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../../public/fonts/vazirmatn/Vazirmatn-Medium.ttf",
			weight: "500",
			style: "normal",
		},
		{
			path: "../../../public/fonts/vazirmatn/Vazirmatn-Bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-vazirmatn",
	display: "swap",
});

export { generateMetadata } from "./metadata";
export { viewport } from "./viewport";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

const isProd = process.env.NODE_ENV === "production";

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<BaseParams>;
}>) {
	const { locale } = await params;
	if (!routing.locales.includes(locale as Locale)) {
		notFound();
	}

	setRequestLocale(locale);
	const messages = await getMessages();

	const dir = dirOf(locale);

	return (
		<html
			lang={locale}
			dir={dir}
			suppressHydrationWarning
			className={`${fontVazirmatn.variable} antialiased`}
		>
			<body className="relative">
				{/* Applies the stored theme before the first paint. Rendered on the
				    server so React never creates a <script> on the client. */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static, self-contained theme bootstrap
					dangerouslySetInnerHTML={{ __html: themeInitScript }}
				/>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<Providers dir={dir}>
						{children}
						{isProd && (
							<>
								<SpeedInsights />
								<Analytics />
								<MicrosoftClarity />
							</>
						)}
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
