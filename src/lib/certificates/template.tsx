import path from "node:path";
import {
	Circle,
	Document,
	Font,
	Image,
	Line,
	Page,
	Path,
	renderToBuffer,
	StyleSheet,
	Svg,
	Text,
	View,
} from "@react-pdf/renderer";
import { buildGuillocheLayers } from "./guilloche";

// ─── Fonts ──────────────────────────────────────────────────────────────────
//
// Vazirmatn ships the Arabic-script glyphs Dari/Persian (fa) and Pashto (ps)
// need AND a clean Latin set, so one family covers all three locales — same
// reasoning as the app layout font. Files live in public/fonts/vazirmatn and
// are resolved from process.cwd() so Next.js file tracing bundles them for
// serverless deploys.

const fontDir = path.join(process.cwd(), "public", "fonts", "vazirmatn");

// Bilingual wordmark (Latin + Arabic script), so one asset serves en/fa/ps.
// 391×335 px source — sized in the styles below at the same aspect ratio.
const logoPath = path.join(process.cwd(), "public", "logo_typo_blue.png");

Font.register({
	family: "Vazirmatn",
	fonts: [
		{ src: path.join(fontDir, "Vazirmatn-Light.ttf"), fontWeight: 300 },
		{ src: path.join(fontDir, "Vazirmatn-Regular.ttf"), fontWeight: 400 },
		{ src: path.join(fontDir, "Vazirmatn-Medium.ttf"), fontWeight: 500 },
		{ src: path.join(fontDir, "Vazirmatn-Bold.ttf"), fontWeight: 700 },
	],
});

// Never hyphenate: breaking words mid-way destroys Arabic-script joining.
Font.registerHyphenationCallback((word) => [word]);

// ─── Palette ────────────────────────────────────────────────────────────────

const NAVY = "#16324F";
const GOLD = "#C8A24B";
const GOLD_SOFT = "#E3CD96";
const INK = "#2B2B2B";
const MUTED = "#6B7280";
const IVORY = "#FDFBF5";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface CertificateStrings {
	/** Platform name as printed in the header and signature block. */
	platform: string;
	/** e.g. "Certificate of Completion" */
	title: string;
	/** e.g. "This certificate is proudly presented to" */
	presentedTo: string;
	/** e.g. "for successfully completing the course" */
	bodyLine: string;
	/** Fully formatted issue-date sentence, e.g. "Issued on July 13, 2026" */
	dateLine: string;
	/** e.g. "Verification code" */
	verificationLabel: string;
	/**
	 * Hint TEMPLATE with a literal `{url}` placeholder, e.g.
	 * "Verify authenticity at {url}". The template (not the action)
	 * interpolates it, because RTL locales need the direction runs
	 * re-arranged around the URL — see `composeVerifyHint`.
	 */
	verifyHint: string;
	/** e.g. "Issuing platform" */
	signatureRole: string;
}

export interface CertificateTemplateProps {
	studentName: string;
	courseTitle: string;
	verificationCode: string;
	/** PNG data URL of the QR code pointing at the public verify page. */
	qrDataUrl: string;
	/** Human-readable verify URL substituted into `strings.verifyHint`. */
	verifyUrlDisplay: string;
	direction: "ltr" | "rtl";
	strings: CertificateStrings;
}

// ─── RTL bidi workaround ────────────────────────────────────────────────────
//
// react-pdf shapes Arabic script correctly WITHIN a run, but does not apply
// the Unicode bidi algorithm ACROSS runs: mixed-direction lines are laid out
// in logical order, left to right. Pure-Persian lines therefore render fine,
// but a line like "کد تأیید: CODE" comes out with the label on the left and
// the Latin code on the right — backwards for an RTL reader. The fix is to
// pre-arrange the runs in *visual* order ourselves. If react-pdf ever gains
// real bidi support, these helpers should be removed.

/** "Label: CODE" for LTR; visually "CODE :Label" (label rightmost) for RTL. */
export function composeVerificationLine(
	label: string,
	code: string,
	isRtl: boolean
): string {
	return isRtl ? `${code} :${label}` : `${label}: ${code}`;
}

/**
 * Interpolates `{url}` into the hint template. For RTL the clause after the
 * URL must come FIRST in logical order so it lands leftmost, and the leading
 * clause last so it lands rightmost — reading right-to-left then gives the
 * original sentence order.
 */
export function composeVerifyHint(
	template: string,
	url: string,
	isRtl: boolean
): string {
	const [before = "", after = ""] = template.split("{url}");
	if (!isRtl) return `${before}${url}${after}`;
	return `${after.trim()} ${url} ${before.trim()}`.trim();
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	page: {
		backgroundColor: IVORY,
		fontFamily: "Vazirmatn",
		color: INK,
	},
	outerFrame: {
		position: "absolute",
		top: 18,
		left: 18,
		right: 18,
		bottom: 18,
		borderWidth: 3,
		borderColor: NAVY,
	},
	innerFrame: {
		position: "absolute",
		top: 26,
		left: 26,
		right: 26,
		bottom: 26,
		borderWidth: 1,
		borderColor: GOLD,
	},
	content: {
		flex: 1,
		alignItems: "center",
		paddingTop: 46,
		paddingHorizontal: 90,
	},
	logo: {
		// 391:335 source ratio.
		width: 76,
		height: 65,
	},
	watermark: {
		// 391:335 source ratio, centred on the guilloché rosette.
		position: "absolute",
		width: 240,
		height: 206,
		left: (841.89 - 240) / 2,
		top: 285 - 103,
		opacity: 0.05,
	},
	title: {
		fontSize: 32,
		fontWeight: 700,
		color: NAVY,
		marginTop: 14,
		textAlign: "center",
	},
	presentedTo: {
		fontSize: 11,
		fontWeight: 300,
		color: MUTED,
		marginTop: 26,
	},
	studentName: {
		fontSize: 30,
		fontWeight: 700,
		color: INK,
		marginTop: 10,
		textAlign: "center",
	},
	bodyLine: {
		fontSize: 11,
		fontWeight: 300,
		color: MUTED,
		marginTop: 22,
	},
	courseTitle: {
		fontSize: 18,
		fontWeight: 500,
		color: NAVY,
		marginTop: 8,
		textAlign: "center",
	},
	dateLine: {
		fontSize: 10,
		color: MUTED,
		marginTop: 18,
	},
	footer: {
		position: "absolute",
		left: 64,
		right: 64,
		bottom: 52,
		alignItems: "flex-end",
		justifyContent: "space-between",
	},
	qrBlock: {
		alignItems: "center",
		width: 170,
	},
	qrImage: {
		width: 62,
		height: 62,
	},
	verificationCode: {
		fontSize: 10,
		fontWeight: 500,
		color: INK,
		marginTop: 4,
	},
	verifyHint: {
		fontSize: 7,
		color: MUTED,
		marginTop: 2,
		textAlign: "center",
	},
	signatureBlock: {
		alignItems: "center",
		width: 170,
	},
	signatureRule: {
		width: 150,
		borderBottomWidth: 1,
		borderBottomColor: INK,
		marginTop: 6,
	},
	signatureName: {
		fontSize: 11,
		fontWeight: 500,
		color: INK,
		marginTop: 6,
	},
	signatureRole: {
		fontSize: 8,
		color: MUTED,
		marginTop: 2,
	},
});

// ─── Decorative pieces ──────────────────────────────────────────────────────

type PdfStyle = React.ComponentProps<typeof Svg>["style"];

/** Gold laurel-style corner flourish, rotated per corner via style. */
function CornerOrnament({ style }: { style: PdfStyle }) {
	return (
		<Svg width={54} height={54} viewBox="0 0 54 54" style={style}>
			<Path
				d="M4 50 L4 14 Q4 4 14 4 L50 4"
				stroke={GOLD}
				strokeWidth={2}
				fill="none"
			/>
			<Path
				d="M10 44 L10 18 Q10 10 18 10 L44 10"
				stroke={GOLD_SOFT}
				strokeWidth={1}
				fill="none"
			/>
			<Circle cx={4} cy={50} r={2.5} fill={GOLD} />
			<Circle cx={50} cy={4} r={2.5} fill={GOLD} />
		</Svg>
	);
}

/** Center divider: line — diamond — line. */
function Divider() {
	return (
		<Svg width={220} height={12} viewBox="0 0 220 12" style={{ marginTop: 20 }}>
			<Line x1={0} y1={6} x2={95} y2={6} stroke={GOLD_SOFT} strokeWidth={1} />
			<Path d="M110 1 L116 6 L110 11 L104 6 Z" fill={GOLD} />
			<Line
				x1={125}
				y1={6}
				x2={220}
				y2={6}
				stroke={GOLD_SOFT}
				strokeWidth={1}
			/>
		</Svg>
	);
}

// A4 landscape page, in points.
const PAGE_W = 841.89;
const PAGE_H = 595.28;

/**
 * Security layer 1 — code-seeded guilloché rosette.
 *
 * The interwoven band ringing the page centre is generated from the
 * verification code (see guilloche.ts), so every certificate's pattern is
 * unique yet reproducible. Drawn at whisper opacity: lace on close
 * inspection, texture from arm's length.
 */
function GuillochePattern({ seed }: { seed: string }) {
	// baseRadius 150 keeps the worst-case outer reach (base + layer offsets +
	// both harmonic amplitudes ≈ 252pt) inside the inner frame for any seed.
	const layers = buildGuillocheLayers(seed, {
		cx: PAGE_W / 2,
		cy: 285,
		baseRadius: 150,
	});
	return (
		<Svg
			width={PAGE_W}
			height={PAGE_H}
			viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
			style={{ position: "absolute", top: 0, left: 0 }}
		>
			{layers.map((layer, index) => (
				<Path
					key={layer.d.slice(0, 24)}
					d={layer.d}
					fill="none"
					stroke={index % 2 === 0 ? GOLD : NAVY}
					strokeWidth={0.5}
					opacity={0.08}
				/>
			))}
		</Svg>
	);
}

/**
 * Security layer 2 — micro-text rule.
 *
 * Reads as a faint decorative line under the frame, but is actually the
 * verification code repeated at 2pt. Survives zoom; destroyed by any
 * re-typesetting or low-res copy.
 */
function MicroTextRule({ code, top }: { code: string; top: number }) {
	const repeated = `${code} · ABZAR KANKOR · `.repeat(48);
	return (
		<Text
			style={{
				position: "absolute",
				top,
				left: 34,
				right: 34,
				fontSize: 2,
				color: GOLD,
				opacity: 0.55,
				maxLines: 1,
				textAlign: "center",
			}}
		>
			{repeated}
		</Text>
	);
}

/** Embossed-style gold seal above the signature block. */
function Seal() {
	return (
		<Svg width={58} height={58} viewBox="0 0 58 58">
			<Circle
				cx={29}
				cy={29}
				r={26}
				fill="none"
				stroke={GOLD}
				strokeWidth={2}
			/>
			<Circle
				cx={29}
				cy={29}
				r={21}
				fill="none"
				stroke={GOLD_SOFT}
				strokeWidth={1}
				strokeDasharray="3 2"
			/>
			<Path
				d="M29 14 L32.5 24.5 L43.5 24.5 L34.5 31 L38 41.5 L29 35 L20 41.5 L23.5 31 L14.5 24.5 L25.5 24.5 Z"
				fill={GOLD}
			/>
		</Svg>
	);
}

// ─── Template ───────────────────────────────────────────────────────────────

/** JSX lives here (.tsx) so the server action file can stay plain .ts. */
export function renderCertificatePdf(
	props: CertificateTemplateProps
): Promise<Buffer> {
	return renderToBuffer(<CertificateTemplate {...props} />);
}

export function CertificateTemplate({
	studentName,
	courseTitle,
	verificationCode,
	qrDataUrl,
	verifyUrlDisplay,
	direction,
	strings,
}: CertificateTemplateProps) {
	const isRtl = direction === "rtl";
	const verificationLine = composeVerificationLine(
		strings.verificationLabel,
		verificationCode,
		isRtl
	);
	const verifyHintLine = composeVerifyHint(
		strings.verifyHint,
		verifyUrlDisplay,
		isRtl
	);

	return (
		<Document
			title={`${strings.title} — ${studentName}`}
			author={strings.platform}
			subject={courseTitle}
			language={isRtl ? "fa" : "en"}
		>
			<Page size="A4" orientation="landscape" style={styles.page}>
				{/* ── Security layer (behind everything) ─────────────────────── */}
				{/* The wrapper View is what actually escapes document flow —
				    react-pdf's Svg ignores `position: absolute` on itself and
				    would otherwise push the content onto a second page. */}
				<View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: PAGE_W,
						height: PAGE_H,
					}}
				>
					{/* 3: faint logo watermark — makes local edits visible. */}
					{/* biome-ignore lint/a11y/useAltText: react-pdf Image has no alt prop */}
					<Image style={styles.watermark} src={logoPath} />
					{/* 1: guilloché rosette seeded by the verification code. */}
					<GuillochePattern seed={verificationCode} />
				</View>

				{/* Frames */}
				<View style={styles.outerFrame} fixed />
				<View style={styles.innerFrame} fixed />

				{/* 2: micro-text rules just inside the top/bottom gold frame. */}
				<MicroTextRule code={verificationCode} top={29} />
				<MicroTextRule code={verificationCode} top={PAGE_H - 32} />

				{/* Corner flourishes */}
				<CornerOrnament style={{ position: "absolute", top: 34, left: 34 }} />
				<CornerOrnament
					style={{
						position: "absolute",
						top: 34,
						right: 34,
						transform: "rotate(90deg)",
					}}
				/>
				<CornerOrnament
					style={{
						position: "absolute",
						bottom: 34,
						right: 34,
						transform: "rotate(180deg)",
					}}
				/>
				<CornerOrnament
					style={{
						position: "absolute",
						bottom: 34,
						left: 34,
						transform: "rotate(270deg)",
					}}
				/>

				{/* Main content */}
				<View style={styles.content}>
					{/* biome-ignore lint/a11y/useAltText: react-pdf Image has no alt prop */}
					<Image style={styles.logo} src={logoPath} />
					<Text style={styles.title}>{strings.title}</Text>
					<Divider />
					<Text style={styles.presentedTo}>{strings.presentedTo}</Text>
					<Text style={styles.studentName}>{studentName}</Text>
					<Text style={styles.bodyLine}>{strings.bodyLine}</Text>
					<Text style={styles.courseTitle}>{courseTitle}</Text>
					<Text style={styles.dateLine}>{strings.dateLine}</Text>
				</View>

				{/* Footer: QR/verification on one side, seal & signature on the other */}
				<View
					style={[
						styles.footer,
						{ flexDirection: isRtl ? "row-reverse" : "row" },
					]}
				>
					<View style={styles.qrBlock}>
						{/* biome-ignore lint/a11y/useAltText: react-pdf Image has no alt prop */}
						<Image style={styles.qrImage} src={qrDataUrl} />
						<Text style={styles.verificationCode}>{verificationLine}</Text>
						<Text style={styles.verifyHint}>{verifyHintLine}</Text>
					</View>

					<View style={styles.signatureBlock}>
						<Seal />
						<View style={styles.signatureRule} />
						<Text style={styles.signatureName}>{strings.platform}</Text>
						<Text style={styles.signatureRole}>{strings.signatureRole}</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
}
