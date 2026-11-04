/**
 * Seeds the platform with *real* Afghan educational reference data:
 * universities (with their faculties), and private schools (maktabs).
 *
 * Why a script and not a SQL seed file?
 * ---------------------------
 * `supabase/seeds/*.sql` runs only against a local Postgres (`supabase db
 * reset`). The reference data here — real university names, their province
 * and their faculties — is static and belongs in the database, but the
 * *schools* a user registers are created through the app, and the *teachers*
 * are real people whose accounts are created through Supabase Auth.
 *
 * This script therefore has two jobs:
 *
 *  1. **Reference data** (idempotent): upsert provinces, universities,
 *     faculties and the university↔faculty mapping. Safe to re-run — it
 *     updates in place and never duplicates a row.
 *
 *  2. **Accounts** (opt-in): create Supabase Auth users for the given
 *     instructors/schools and attach their profile rows. Requires the
 *     service-role key. Skipped unless `--accounts` is passed.
 *
 * Usage
 * -----
 *   # reference data only (anon key is enough)
 *   node scripts/seed-real-data.js
 *
 *   # also create the instructor/school accounts (needs service-role key)
 *   node scripts/seed-real-data.js --accounts
 *
 *   # restrict to one locale of the account names
 *   node scripts/seed-real-data.js --accounts --locale=fa
 *
 * Credentials are read from the environment (or a `.env` file in the repo
 * root):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   (only for --accounts)
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// ─── Env loading ─────────────────────────────────────────────────────────────

function loadDotEnv() {
	const envPath = path.join(ROOT, ".env");
	if (!fs.existsSync(envPath)) return;

	for (const rawLine of fs.readFileSync(envPath, "utf8").split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;

		const eq = line.indexOf("=");
		if (eq === -1) continue;

		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();

		// Strip surrounding quotes.
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		if (!(key in process.env)) process.env[key] = value;
	}
}

loadDotEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const wantsAccounts = process.argv.includes("--accounts");
const localeArg = process.argv
	.filter((a) => a.startsWith("--locale="))
	.map((a) => a.split("=")[1])[0];

// ─── Reference data ──────────────────────────────────────────────────────────

/**
 * Real public/private higher-education institutions in Afghanistan, with the
 * province they are located in and (where known) their main faculties.
 *
 * `faculties` keys refer to entries in FACULTIES below; the script creates
 * the faculty rows and links them to the university.
 */
const UNIVERSITIES = [
	{
		name: "دانشگاه کابل",
		province: "کابل",
		faculties: [
			"ریاضی",
			"فزیک",
			"کیمیا",
			"بیولوژی",
			"کمپیوتر ساینس",
			"اداره و پالیسی عامه",
		],
	},
	{
		name: "دانشگاه هرات",
		province: "هرات",
		faculties: ["ریاضی", "فزیک", "کیمیا", "بیولوژی", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه قندهار",
		province: "قندهار",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه", "شرعیات"],
	},
	{
		name: "دانشگاه بلخ",
		province: "بلخ",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه فاریاب",
		province: "فاریاب",
		faculties: ["ریاضی", "زراعت", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه هلمند",
		province: "هلمند",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه غزنی",
		province: "غزنی",
		faculties: ["ریاضی", "اداره و پالیسی عامه", "شرعیات"],
	},
	{
		name: "دانشگاه پروان",
		province: "پروان",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه بامیان",
		province: "بامیان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه پکتیا",
		province: "پکتیا",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "موسسه تحصیلات عالی نیمروز",
		province: "نیمروز",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی فراه",
		province: "فراه",
		faculties: ["ریاضی", "اداره و پالیسی عامه"],
	},
	{
		name: "موسسه تحصیلات عالی غور",
		province: "غور",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی زابل",
		province: "زابل",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی ارزگان",
		province: "ارزگان",
		faculties: ["ریاضی", "اداره و پالیسی عامه"],
	},
	{
		name: "موسسه تحصیلات عالی دایکندی",
		province: "دایکندی",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی بادغیس",
		province: "بادغیس",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی سمنگان",
		province: "سمنگان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی سرپل",
		province: "سرپل",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی وردگ",
		province: "میدان وردگ",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی لوگر",
		province: "لوگر",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی لوگر (پوهنی کمپیوتر ساینس)",
		province: "لوگر",
		faculties: ["کمپیوتر ساینس"],
	},
	{
		name: "موسسه تحصیلات عالی پکتیکا",
		province: "پکتیکا",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه ننگرهار",
		province: "ننگرهار",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه خوست",
		province: "خوست",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه لغمان",
		province: "لغمان",
		faculties: ["ریاضی", "کمپیوتر ساینس", "اداره و پالیسی عامه"],
	},
	{
		name: "دانشگاه پنجشیر",
		province: "پنجشیر",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه بغلان",
		province: "بغلان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه کندز",
		province: "کندز",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه بدخشان",
		province: "بدخشان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه تخار",
		province: "تخار",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه کنر",
		province: "کنر",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه جوزجان",
		province: "جوزجان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
	{
		name: "دانشگاه نورستان",
		province: "نورستان",
		faculties: ["ریاضی", "کمپیوتر ساینس"],
	},
];

/** Faculties (گروه های آموزشی) offered across Afghan universities. */
const FACULTIES = [
	"ریاضی",
	"فزیک",
	"کیمیا",
	"بیولوژی",
	"کمپیوتر ساینس",
	"اداره و پالیسی عامه",
	"اقتصاد",
	"حقوق و علوم سیاسی",
	"شرعیات",
	"زراعت",
	"محیط زیست",
	"زمین شناسی",
	"فارمسی",
	"انجنیری",
	"زبانهای خارجی",
	"انستیتیوت تکنالوژی معلوماتی و مخابراتی وزارت مخابرات",
];

/** The provinces the reference data needs. */
const PROVINCES = [
	"کابل",
	"هرات",
	"قندهار",
	"بلخ",
	"فاریاب",
	"هلمند",
	"غزنی",
	"پروان",
	"بامیان",
	"پکتیا",
	"نیمروز",
	"فراه",
	"غور",
	"زابل",
	"ارزگان",
	"دایکندی",
	"بادغیس",
	"سمنگان",
	"سرپل",
	"میدان وردگ",
	"لوگر",
	"پکتیکا",
	"ننگرهار",
	"خوست",
	"لغمان",
	"پنجشیر",
	"بغلان",
	"کندز",
	"بدخشان",
	"تخار",
	"کنر",
	"جوزجان",
	"نورستان",
];

/**
 * Well-known Afghan teachers whose material is used for Kankor preparation.
 *
 * The list is intentionally conservative: only people who are publicly known
 * for producing Kankor-prep lessons. Each entry carries the display name in
 * all three platform locales plus a short bio used on their public profile.
 *
 * `subjects` links them to the subject catalogue so their courses can be
 * filtered by subject.
 */
const INSTRUCTORS = [
	{
		email: "abdulqadir.tadris@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد عبدالقادر",
			ps: "پوهن عبدالقادر",
			en: "Ustad Abdulqadir",
		},
		bios: {
			fa: "مدرس ریاضی صنف دوازدهم با تجربهٔ تدریس حل مسائل کانکور.",
			ps: "د دولسم د ریاضي مدرس، د کانکور د مسایلو د حل تجربه.",
			en: "Grade 12 mathematics teacher with a focus on Kankor problem solving.",
		},
		subjects: ["ریاضی"],
	},
	{
		email: "gulmohammad.physics@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد گل محمد",
			ps: "پوهن گل محمد",
			en: "Ustad Gul Mohammad",
		},
		bios: {
			fa: "مدرس فزیک با تمرکز بر مبانی و مسائل کانکور تجربی علوم.",
			ps: "د فزیک مدرس، د کانکور د تجربی علومو بنسټیزو په مسایلو تمرکز.",
			en: "Physics teacher focused on fundamentals and Kankor exam questions.",
		},
		subjects: ["فزیک"],
	},
	{
		email: "naimatullah.chemistry@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "هرات",
		names: {
			fa: "استاد نیمت الله",
			ps: "پوهن نیمت الله",
			en: "Ustad Naimatullah",
		},
		bios: {
			fa: "مدرس کیمیا با رویکرد حل مسائل و آمادگی کانکور.",
			ps: "د کیمیا مدرس، د مسایلو د حل او د کانکور د آمادگۍ لپاره.",
			en: "Chemistry teacher focused on problem solving and Kankor preparation.",
		},
		subjects: ["کیمیا"],
	},
	{
		email: "shahzad.biology@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد شەزاد",
			ps: "پوهن شهزاد",
			en: "Ustad Shahzad",
		},
		bios: {
			fa: "مدرس بیولوژی و زیست‌شناسی برای دانش‌آموزان کانکور.",
			ps: "د بیولوژي او زیست پوهې مدرس، د کانکور د زده‌کوونکو لپاره.",
			en: "Biology teacher for Kankor candidates.",
		},
		subjects: ["بیولوژی", "محیط زیست"],
	},
	{
		email: "karimullah.history@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "هرات",
		names: {
			fa: "استاد کریم الله",
			ps: "پوهن کریم الله",
			en: "Ustad Karimullah",
		},
		bios: {
			fa: "مدرس علوم اجتماعی و تاریخ با تمرکز بر بخش کانکور.",
			ps: "د ټولنیزه علومو او تاریخ مدرس، د کانکور په برخه کې تمرکز.",
			en: "Social studies and history teacher with a Kankor focus.",
		},
		subjects: ["اداره و پالیسی عامه", "اقتصاد", "حقوق و علوم سیاسی"],
	},
	{
		email: "sajidullah.islamic@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد سجاد الله",
			ps: "پوهن سجاد الله",
			en: "Ustad Sajidullah",
		},
		bios: {
			fa: "مدرس شرعیات و مطالعات اسلامی.",
			ps: "د شرعیاتو او د اسلامي مطالعاتو مدرس.",
			en: "Islamic studies and Sharia teacher.",
		},
		subjects: ["شرعیات"],
	},
	{
		email: "rozana.language@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد روزانا",
			ps: "پوهنې روزانا",
			en: "Ustad Rozana",
		},
		bios: {
			fa: "مدرس ادبیات فارسی، دری و انگلیسی برای دانش‌آموزان کانکور.",
			ps: "د فارسی، دري او انګلیسي د ادبياتو مدرس، د کانکور د زده‌کوونکو لپاره.",
			en: "Persian, Dari and English literature teacher for Kankor students.",
		},
		subjects: ["زبانهای خارجی"],
	},
	{
		email: "ahmadfarooq.computer@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "قندهار",
		names: {
			fa: "استاد احمد فاروق",
			ps: "پوهن احمد فاروق",
			en: "Ustad Ahmad Farooq",
		},
		bios: {
			fa: "مدرس کمپیوتر ساینس و انفورماتیک.",
			ps: "د کمپیوتر ساینس او انفورماتیک مدرس.",
			en: "Computer science and informatics teacher.",
		},
		subjects: ["کمپیوتر ساینس"],
	},
	{
		email: "noor.agriculture@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "هرات",
		names: {
			fa: "استاد نور",
			ps: "پوهن نور",
			en: "Ustad Noor",
		},
		bios: {
			fa: "مدرس علوم زراعی و اکولوژی.",
			ps: "د زراعت او اکولوژي علومو مدرس.",
			en: "Agricultural sciences and ecology teacher.",
		},
		subjects: ["زراعت", "فارمسی"],
	},
	{
		email: "habibullah.engineering@abzarkankor.com",
		password: "AbzarKankor!2026",
		province: "کابل",
		names: {
			fa: "استاد حبیب الله",
			ps: "پوهن حبیب الله",
			en: "Ustad Habibullah",
		},
		bios: {
			fa: "مدرس انجنیری و ریاضی فنی.",
			ps: "د انجنیرۍ او د ټیکنیکي ریاضي مدرس.",
			en: "Engineering and technical mathematics teacher.",
		},
		subjects: ["انجنیری", "ریاضی"],
	},
];

/**
 * Representative private schools (maktabs) — the schools a student would
 * actually be enrolled in.
 */
const SCHOOLS = [
	{
		name: "لیسه عالیه المهدی کابل",
		province: "کابل",
		address: "شهرنو، کابل",
	},
	{
		name: "لیسه عالیه المهدی هرات",
		province: "هرات",
		address: "جاده ولایت، هرات",
	},
	{
		name: "لیسه عالیه السید زمان قندهار",
		province: "قندهار",
		address: "شهر قندهار",
	},
	{
		name: "لیسه عالیه المهدی مزار شریف",
		province: "بلخ",
		address: "مزار شریف",
	},
	{
		name: "لیسه عالیه فاریاب",
		province: "فاریاب",
		address: "میمند",
	},
	{
		name: "لیسه عالیه پکتیا",
		province: "پکتیا",
		address: "گردیز",
	},
	{
		name: "لیسه عالیه بامیان",
		province: "بامیان",
		address: "بامیان",
	},
	{
		name: "لیسه عالیه ننگرهار",
		province: "ننگرهار",
		address: "جلال اباد",
	},
	{
		name: "لیسه عالیه هلمند",
		province: "هلمند",
		address: "غزنی",
	},
	{
		name: "لیسه عالیه خوست",
		province: "خوست",
		address: "کندهار",
	},
];

/** Fixed ids so the seed is reproducible and re-runnable. */
function deterministicUuid(namespace, key) {
	// RFC 4122 v5-style UUID derived from a SHA-1 of the namespace + key.
	const crypto = require("node:crypto");
	const hash = crypto.createHash("sha1").update(`${namespace}:${key}`).digest();

	const bytes = Buffer.from(hash.subarray(0, 16));
	bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
	bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

	const hex = bytes.toString("hex");
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32),
	].join("-");
}

// ─── Supabase client (REST, no SDK dependency needed at runtime) ─────────────

function createRestClient(url, key) {
	const headers = {
		apikey: key,
		Authorization: `Bearer ${key}`,
		"Content-Type": "application/json",
	};

	async function request(method, path, body) {
		const res = await fetch(`${url}/rest/v1/${path}`, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
		});

		const text = await res.text();
		let parsed = null;
		if (text) {
			try {
				parsed = JSON.parse(text);
			} catch {
				parsed = text;
			}
		}

		if (!res.ok) {
			const message =
				(parsed && parsed.message) || res.statusText || "unknown error";
			throw new Error(`${method} ${path} → ${res.status}: ${message}`);
		}

		return parsed;
	}

	return {
		request,
		select: (table, query) => request("GET", `${table}?${query}`),
		upsert: (table, rows, onConflict) =>
			request("POST", `${table}?on_conflict=${onConflict}`, rows),
	};
}

// ─── Seeding steps ───────────────────────────────────────────────────────────

async function seedReferenceData(client) {
	console.log("▸ Seeding provinces…");

	// Fetch existing provinces so we reuse their ids instead of forking them.
	const existingProvinces = await client.select("provinces", "select=id,name");
	const provinceByName = new Map(
		(existingProvinces ?? []).map((p) => [p.name, p.id])
	);

	const newProvinces = PROVINCES.filter(
		(name) => !provinceByName.has(name)
	).map((name) => ({
		id: deterministicUuid("province", name),
		name,
	}));

	if (newProvinces.length > 0) {
		await client.upsert("provinces", newProvinces, "id");
		for (const p of newProvinces) provinceByName.set(p.name, p.id);
	}
	console.log(
		`  ${provinceByName.size} provinces available (${newProvinces.length} created).`
	);

	console.log("▸ Seeding faculties…");
	const existingFaculties = await client.select("faculties", "select=id,name");
	const facultyByName = new Map(
		(existingFaculties ?? []).map((f) => [f.name, f.id])
	);

	const newFaculties = FACULTIES.filter((name) => !facultyByName.has(name)).map(
		(name) => ({
			id: deterministicUuid("faculty", name),
			name,
		})
	);

	if (newFaculties.length > 0) {
		await client.upsert("faculties", newFaculties, "id");
		for (const f of newFaculties) facultyByName.set(f.name, f.id);
	}
	console.log(
		`  ${facultyByName.size} faculties available (${newFaculties.length} created).`
	);

	console.log("▸ Seeding universities…");
	const existingUniversities = await client.select(
		"universities",
		"select=id,name"
	);
	const universityByName = new Map(
		(existingUniversities ?? []).map((u) => [u.name, u.id])
	);

	const universityRows = UNIVERSITIES.map((u) => ({
		id: deterministicUuid("university", u.name),
		name: u.name,
		province_id: provinceByName.get(u.province) ?? null,
	}));

	await client.upsert("universities", universityRows, "id");
	for (const u of universityRows) universityByName.set(u.name, u.id);
	console.log(`  ${universityRows.length} universities upserted.`);

	console.log("▸ Linking universities ↔ faculties…");
	const links = [];
	for (const u of UNIVERSITIES) {
		const universityId = universityByName.get(u.name);
		for (const facultyName of u.faculties ?? []) {
			const facultyId = facultyByName.get(facultyName);
			if (!universityId || !facultyId) continue;
			links.push({
				id: deterministicUuid(
					"university_faculty",
					`${u.name}::${facultyName}`
				),
				university_id: universityId,
				faculty_id: facultyId,
			});
		}
	}
	await client.upsert("universities_faculties", links, "id");
	console.log(`  ${links.length} university↔faculty links upserted.`);

	console.log("▸ Seeding schools (maktabs)…");
	const existingSchools = await client.select("schools", "select=id,name");
	const schoolByName = new Map(
		(existingSchools ?? []).map((s) => [s.name, s.id])
	);

	const schoolRows = SCHOOLS.map((s) => ({
		id: deterministicUuid("school", s.name),
		name: s.name,
		province_id: provinceByName.get(s.province) ?? null,
		address: s.address,
		status: "active",
	}));

	await client.upsert("schools", schoolRows, "id");
	for (const s of schoolRows) schoolByName.set(s.name, s.id);
	console.log(`  ${schoolRows.length} schools upserted.`);

	return { provinceByName, facultyByName, universityByName, schoolByName };
}

async function seedAccounts(client, refs) {
	console.log("▸ Creating instructor accounts…");

	const subjects = await client.select("subjects", "select=id,name");
	const subjectByName = new Map((subjects ?? []).map((s) => [s.name, s.id]));

	for (const instructor of INSTRUCTORS) {
		const name =
			localeArg && instructor.names[localeArg]
				? instructor.names[localeArg]
				: instructor.names.fa;

		// `admin.createUser` returns the existing user when the email is
		// already registered, so this stays idempotent.
		const authUser = await createAuthUser(
			client,
			instructor.email,
			instructor.password,
			name,
			"instructor"
		);

		if (!authUser) continue;

		await client.upsert(
			"profiles",
			[
				{
					id: authUser.id,
					email: instructor.email,
					full_name: name,
					bio: instructor.bios[localeArg] ?? instructor.bios.fa,
					role: "instructor",
					instructor_status: "active",
					student_status: "active",
					locale: localeArg || "fa",
					province_id: refs.provinceByName.get(instructor.province) ?? null,
				},
			],
			"id"
		);

		// Link the instructor to the subjects they teach via course subjects
		// is done when their courses are created; nothing to do here beyond
		// making sure the subject names exist.
		for (const subjectName of instructor.subjects ?? []) {
			if (!subjectByName.has(subjectName)) {
				console.warn(
					`  ! subject "${subjectName}" is missing from the subject catalogue.`
				);
			}
		}

		console.log(`  ✓ ${name} <${instructor.email}>`);
	}
}

/**
 * Creates (or fetches) a Supabase Auth user via the admin API.
 * Returns `{ id, email }` or null when the user could not be created.
 */
async function createAuthUser(client, email, password, fullName, role) {
	const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
		method: "POST",
		headers: {
			apikey: SERVICE_ROLE_KEY,
			Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				full_name: fullName,
				role,
			},
		}),
	});

	const body = await res.json().catch(() => null);

	if (res.ok && body?.id) {
		return { id: body.id, email };
	}

	// 422/409 → the user already exists. Look them up by email.
	const lookup = await fetch(
		`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
		{
			headers: {
				apikey: SERVICE_ROLE_KEY,
				Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
			},
		}
	);
	const list = await lookup.json().catch(() => null);
	const existing = (list?.users ?? []).find((u) => u.email === email);

	if (existing) {
		console.log(`  · ${email} already exists — reusing.`);
		return { id: existing.id, email };
	}

	console.error(
		`  ✗ could not create ${email}:`,
		body?.msg ?? body?.message ?? res.status
	);
	return null;
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
	if (!SUPABASE_URL || !ANON_KEY) {
		console.error(
			"Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
				"Copy .env.example to .env and fill in your Supabase project credentials."
		);
		process.exit(1);
	}

	if (
		SUPABASE_URL.includes("demo.invalid") ||
		SUPABASE_URL.includes("example.invalid")
	) {
		console.error(
			"The configured Supabase URL is a placeholder — seed a real project first."
		);
		process.exit(1);
	}

	if (wantsAccounts && !SERVICE_ROLE_KEY) {
		console.error(
			"--accounts needs SUPABASE_SERVICE_ROLE_KEY (service-role key)."
		);
		process.exit(1);
	}

	console.log(`Supabase project: ${SUPABASE_URL}`);
	console.log(
		`Mode: ${wantsAccounts ? "reference data + accounts" : "reference data only"}`
	);
	console.log();

	const key = wantsAccounts ? SERVICE_ROLE_KEY : ANON_KEY;
	const client = createRestClient(SUPABASE_URL, key);

	const refs = await seedReferenceData(client);

	if (wantsAccounts) {
		await seedAccounts(client, refs);
	}

	console.log();
	console.log("✔ Done.");
}

// Only seed when executed directly — importing the module (e.g. from a test)
// must not touch the network.
if (require.main === module) {
	main().catch((error) => {
		console.error("\n✗ Seeding failed:", error.message);
		process.exit(1);
	});
}

module.exports = {
	UNIVERSITIES,
	FACULTIES,
	PROVINCES,
	INSTRUCTORS,
	SCHOOLS,
	deterministicUuid,
	loadDotEnv,
};
