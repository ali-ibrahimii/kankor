import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverEnv } from "@/lib/env/server-env";
import { BaseParams } from "@/types/common.types";

const ogLocaleMap: Record<string, string> = {
	en: "en_US",
	fa: "fa_IR",
	ps: "ps_AF",
};

export async function generateMetadata({
	params,
}: {
	params: Promise<BaseParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	setRequestLocale(locale);

	const [tApp, tMeta] = await Promise.all([
		getTranslations({ locale, namespace: "app" }),
		getTranslations({ locale, namespace: "metadata" }),
	]);

	const appName = tApp("name");
	const description = tMeta("description");
	const keywords = tMeta.raw("keywords") as string[];
	const ogLocale = ogLocaleMap[locale] ?? "en_US";

	return {
		title: {
			default: appName,
			template: `%s | ${appName}`,
		},
		description,
		keywords,
		authors: [{ name: "Abzar Kankor Team" }],
		creator: "Abzar Kankor",
		publisher: "Abzar Kankor",
		formatDetection: {
			email: false,
			address: false,
			telephone: false,
		},
		metadataBase: new URL(serverEnv.app.address),
		alternates: {
			canonical: `/${locale}`,
			languages: {
				fa: "/fa",
				ps: "/ps",
				en: "/en",
				"x-default": "/fa",
			},
		},
		openGraph: {
			type: "website",
			locale: ogLocale,
			url: serverEnv.app.address,
			siteName: appName,
			title: appName,
			description,
			images: [
				{
					url: "/og-image.png",
					width: 1200,
					height: 630,
					alt: appName,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			site: "@AbzarKankor",
			creator: "@AbzarKankor",
			title: appName,
			description,
			images: ["/og-image.png"],
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
		// verification: {
		//     google: "your-google-verification-code",
		//     yandex: "your-yandex-verification-code",
		//     yahoo: "your-yahoo-verification-code",
		// },
		category: "Education",
		classification: "Education",
		other: {
			"application-name": appName,
			"apple-mobile-web-app-capable": "yes",
			"apple-mobile-web-app-status-bar-style": "default",
			"apple-mobile-web-app-title": appName,
			"format-detection": "telephone=no",
			"mobile-web-app-capable": "yes",
			"msapplication-config": "/browserconfig.xml",
			"msapplication-TileColor": "#000000",
			"msapplication-tap-highlight": "no",
			"theme-color": "#000000",
		},
		icons: {
			icon: [
				{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
				{ url: "/favicon.svg", type: "image/svg+xml" },
				{ url: "/favicon.ico", sizes: "any" },
			],
			shortcut: "/favicon.ico",
			apple: [
				{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
			],
			other: [
				{
					rel: "mask-icon",
					url: "/favicon.svg",
					color: "#000000",
				},
			],
		},
		appleWebApp: {
			capable: true,
			statusBarStyle: "default",
			title: appName,
		},
		applicationName: appName,
		referrer: "origin-when-cross-origin",
	};
}
