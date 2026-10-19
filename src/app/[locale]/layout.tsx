import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { Locale } from "@/i18n";
import { dirOf, routing } from "@/i18n/routing";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
	Inter as FontSans,
	Vazirmatn as FontVazirmatn,
} from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { BaseParams } from "@/types/common.types";
import { Providers } from "./providers";

const fontInter = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

// Vazirmatn covers the Arabic-script glyphs Dari/Persian (fa) and Pashto (ps)
// need — Inter doesn't render those at all.
const fontVazirmatn = FontVazirmatn({
	subsets: ["arabic", "latin"],
	variable: "--font-sans",
});

export { generateMetadata } from "./metadata";
export { viewport } from "./viewport";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

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
	const font = dir === "rtl" ? fontVazirmatn : fontInter;

	return (
		<html
			lang={locale}
			dir={dir}
			suppressHydrationWarning
			className={`${font.variable} antialiased`}
		>
			<head>
				{process.env.NODE_ENV === "development" && (
					<Script
						src="//unpkg.com/react-scan/dist/auto.global.js"
						crossOrigin="anonymous"
						strategy="beforeInteractive"
					/>
				)}
			</head>
			<body className="relative">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<Providers dir={dir}>
						{children}
						<SpeedInsights />
						<Analytics />
						<MicrosoftClarity />
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
