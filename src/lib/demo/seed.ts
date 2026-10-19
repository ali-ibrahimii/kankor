import type { DemoState } from "./types";

/** Deterministic, believable data so all four dashboards are useful on first load. */
export function createDemoState(): DemoState {
	return {
		version: 1,
		settings: {
			siteName: "ابزار کانکور",
			tagline: "یادگیری برای فردای روشن‌تر",
			heroTitle: "از اولین درس تا موفقیت در کانکور",
			heroDescription:
				"یک فضای یادگیری برای شاگردان، استادان و مکتب‌های افغانستان.",
			contactEmail: "info@abzarkankor.com",
			announcement: "ثبت‌نام کورس‌های آمادگی کانکور باز است.",
		},
		schools: [
			{
				id: "school-ariyana",
				name: "لیسه عالی آریانا",
				city: "کابل",
				email: "ariyana@example.com",
				status: "active",
			},
			{
				id: "school-roshana",
				name: "مکتب روشنایی",
				city: "هرات",
				email: "roshana@example.com",
				status: "pending",
			},
		],
		users: [
			{
				id: "admin-1",
				name: "علی ابراهیمی",
				email: "admin@abzarkankor.com",
				role: "admin",
				status: "active",
			},
			{
				id: "teacher-1",
				name: "استاد مریم احمدی",
				email: "maryam@example.com",
				role: "teacher",
				status: "active",
				schoolId: "school-ariyana",
			},
			{
				id: "teacher-2",
				name: "استاد احمد نوری",
				email: "ahmad@example.com",
				role: "teacher",
				status: "active",
			},
			{
				id: "teacher-3",
				name: "استاد سارا وفایی",
				email: "sara@example.com",
				role: "teacher",
				status: "pending",
				schoolId: "school-roshana",
			},
			{
				id: "student-1",
				name: "زهرا محمدی",
				email: "zahra@example.com",
				role: "student",
				status: "active",
				schoolId: "school-ariyana",
			},
			{
				id: "student-2",
				name: "فرید حیدری",
				email: "farid@example.com",
				role: "student",
				status: "active",
				schoolId: "school-ariyana",
			},
			{
				id: "student-3",
				name: "لیلا کریمی",
				email: "laila@example.com",
				role: "student",
				status: "active",
				schoolId: "school-ariyana",
			},
			{
				id: "student-4",
				name: "احمد رشیدی",
				email: "rashid@example.com",
				role: "student",
				status: "pending",
				schoolId: "school-roshana",
			},
			{
				id: "school-account",
				name: "مدیریت لیسه آریانا",
				email: "manager@ariyana.example.com",
				role: "school",
				status: "active",
				schoolId: "school-ariyana",
			},
		],
		courses: [
			{
				id: "course-math",
				title: "ریاضی کانکور از صفر تا صد",
				description:
					"مفاهیم کلیدی ریاضی، حل مسئله و آمادگی برای سوالات کانکور.",
				subject: "ریاضی",
				teacherId: "teacher-1",
				schoolId: "school-ariyana",
				published: true,
				color: "violet",
				createdAt: "2026-09-12T08:00:00Z",
				modules: [
					{
						id: "module-algebra",
						title: "فصل اول: جبر و معادله",
						lessons: [
							{
								id: "lesson-variables",
								title: "آشنایی با متغیرها",
								type: "video",
								duration: 18,
								summary: "مبانی عبارت‌های جبری و متغیرها",
								content:
									"در این درس مفهوم متغیر، ثابت و عبارت جبری را با مثال‌های ساده یاد می‌گیریم. برای تمرین، مقدار ۲x + ۳ را به ازای x = ۴ حساب کنید.",
								resourceUrl: "",
							},
							{
								id: "lesson-equations",
								title: "حل معادله‌های خطی",
								type: "text",
								duration: 24,
								summary: "روش حل معادله‌های یک‌مجهولی",
								content:
									"برای حل ۲x + ۶ = ۱۴، ابتدا ۶ را از دو طرف کم می‌کنیم و سپس بر ۲ تقسیم می‌کنیم. پاسخ x = ۴ است.",
								resourceUrl: "",
							},
						],
					},
					{
						id: "module-geometry",
						title: "فصل دوم: هندسه",
						lessons: [
							{
								id: "lesson-triangle",
								title: "قضیهٔ فیثاغورس",
								type: "pdf",
								duration: 16,
								summary: "محاسبهٔ ضلع‌ها در مثلث قائم‌الزاویه",
								content:
									"در مثلث قائم‌الزاویه، مجموع مربع‌های دو ضلع کوتاه برابر مربع وتر است: a² + b² = c².",
								resourceUrl: "",
							},
						],
					},
				],
			},
			{
				id: "course-physics",
				title: "فیزیک صنف دوازدهم",
				description:
					"از حرکت و نیرو تا انرژی؛ فیزیک را مفهومی و با مثال بیاموزید.",
				subject: "فیزیک",
				teacherId: "teacher-2",
				published: true,
				color: "sky",
				createdAt: "2026-09-18T09:00:00Z",
				modules: [
					{
						id: "module-motion",
						title: "حرکت و دینامیک",
						lessons: [
							{
								id: "lesson-motion",
								title: "سرعت و شتاب",
								type: "video",
								duration: 20,
								summary: "تفاوت سرعت و شتاب در حرکت",
								content:
									"سرعت، تغییر مکان در واحد زمان است. شتاب، تغییر سرعت در واحد زمان را بیان می‌کند.",
								resourceUrl: "",
							},
							{
								id: "lesson-newton",
								title: "قوانین نیوتن",
								type: "text",
								duration: 28,
								summary: "سه قانون اصلی حرکت",
								content:
									"قانون دوم نیوتن رابطهٔ میان نیرو، جرم و شتاب را به صورت F = ma نشان می‌دهد.",
								resourceUrl: "",
							},
						],
					},
				],
			},
			{
				id: "course-biology",
				title: "زیست‌شناسی کاربردی",
				description: "درس‌های کوتاه و کاربردی دربارهٔ سلول، ژنتیک و بدن انسان.",
				subject: "بیولوژی",
				teacherId: "teacher-1",
				schoolId: "school-ariyana",
				published: false,
				color: "mint",
				createdAt: "2026-10-03T07:30:00Z",
				modules: [
					{
						id: "module-cell",
						title: "سلول و ساختار آن",
						lessons: [
							{
								id: "lesson-cell",
								title: "سلول چیست؟",
								type: "text",
								duration: 15,
								summary: "کوچک‌ترین واحد حیات",
								content:
									"سلول واحد بنیادی ساختمان و عملکرد تمام موجودات زنده است.",
								resourceUrl: "",
							},
						],
					},
				],
			},
		],
		classrooms: [
			{
				id: "class-math",
				title: "کلاس ریاضی آمادگی کانکور",
				description: "جلسات هفتگی حل تمرین و رفع اشکال.",
				teacherId: "teacher-1",
				schoolId: "school-ariyana",
				courseId: "course-math",
				joinCode: "AK-MATH26",
				memberIds: ["student-1", "student-2"],
				requestIds: ["student-3"],
				createdAt: "2026-09-15T08:00:00Z",
			},
			{
				id: "class-physics",
				title: "آزمایشگاه فیزیک",
				description: "حل مثال‌های قوانین حرکت همراه با استاد.",
				teacherId: "teacher-2",
				courseId: "course-physics",
				joinCode: "AK-PHYS26",
				memberIds: ["student-2"],
				requestIds: [],
				createdAt: "2026-09-20T08:00:00Z",
			},
		],
		enrollments: [
			{
				id: "enroll-1",
				courseId: "course-math",
				studentId: "student-1",
				completedLessonIds: ["lesson-variables"],
				enrolledAt: "2026-09-19T12:00:00Z",
			},
			{
				id: "enroll-2",
				courseId: "course-math",
				studentId: "student-2",
				completedLessonIds: [
					"lesson-variables",
					"lesson-equations",
					"lesson-triangle",
				],
				enrolledAt: "2026-09-22T12:00:00Z",
			},
			{
				id: "enroll-3",
				courseId: "course-physics",
				studentId: "student-2",
				completedLessonIds: ["lesson-motion"],
				enrolledAt: "2026-10-01T12:00:00Z",
			},
		],
		certificates: [
			{
				id: "certificate-1",
				code: "AK-CERT-2026-001",
				courseId: "course-math",
				studentId: "student-2",
				issuedAt: "2026-10-12T10:00:00Z",
			},
		],
	};
}
