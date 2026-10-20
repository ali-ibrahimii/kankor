import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";
import { buildSecurityHeaders } from "./src/lib/security/headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withMDX = createMDX({
	extension: /\.(md|mdx)$/,
});

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["*.e2b.app", "localhost:3000"],
	// cacheComponents: true,
	// typescript: {
	// 	ignoreBuildErrors: true
	// },
	experimental: {
		mdxRs: true,
		preloadEntriesOnStart: false,
		optimizePackageImports: [
			"lucide-react",
			"radix-ui",
			"date-fns",
			"recharts",
			"framer-motion",
			"@dnd-kit/core",
			"@dnd-kit/sortable",
			"@dnd-kit/modifiers",
			"@dnd-kit/utilities",
			"@tanstack/react-query",
			"@tanstack/react-table",
			"@tanstack/react-form",
			"@base-ui/react",
		],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "storage.googleapis.com",
				pathname: "/abzarkankorv2.firebasestorage.app/**",
			},
		],
	},
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
	async headers() {
		return [
			{
				// Security headers (CSP, HSTS, frame denial, permissions policy)
				// are defined once in src/lib/security/headers.ts.
				source: "/(.*)",
				headers: buildSecurityHeaders(),
			},
			{
				source: "/sw.js",
				headers: [
					{
						key: "Content-Type",
						value: "application/javascript; charset=utf-8",
					},
					{
						key: "Cache-Control",
						value: "no-cache, no-store, must-revalidate",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self'",
					},
				],
			},
		];
	},
};

const composedConfig = withMDX(withNextIntl(nextConfig));

export default isProd
	? withSentryConfig(composedConfig, {
			// For all available options, see:
			// https://www.npmjs.com/package/@sentry/webpack-plugin#options

			org: "abzarkankor",

			project: "abzarkankor-web",

			// Only print logs for uploading source maps in CI
			silent: !process.env.CI,

			// Upload a larger set of source maps for prettier stack traces (increases build time)
			widenClientFileUpload: true,

			// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
			tunnelRoute: "/monitoring",

			webpack: {
				automaticVercelMonitors: true,
				treeshake: {
					removeDebugLogging: true,
				},
			},
		})
	: composedConfig;
