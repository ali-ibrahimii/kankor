// AUTO-GENERATED FILE — DO NOT EDIT

import type { Locale } from "@/i18n";
import { clientEnv } from "@/lib/env/client-env";

type BuildPathResult<
	TPath extends string,
	TLocale extends string | undefined = undefined,
> = TLocale extends string ? `/${TLocale}${TPath}` : TPath;

function buildPath<
	TPath extends string,
	TLocale extends string | undefined = undefined,
>(
	pathname: TPath,
	params?: Record<string, string>,
	searchParams?: Record<string, string>,
	{
		locale,
		isAbsolute,
	}: {
		locale?: TLocale;
		isAbsolute?: boolean;
	} = {}
): BuildPathResult<TPath, TLocale> {
	let path = pathname.startsWith("/") ? pathname : "/" + pathname;
	if (locale) path = `/${locale}${path}`;
	if (params) {
		for (const key in params) {
			path = path.replace(`:${key}`, params[key]);
		}
	}
	if (isAbsolute) path = `${clientEnv.app.address}${path}`;
	const qs = searchParams
		? "?" + new URLSearchParams(searchParams).toString()
		: "";
	return (qs ? path + qs : path) as BuildPathResult<TPath, TLocale>;
}

export const routes = {
	".wellKnown": {
		"assetlinks.json": {
			route: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/.well-known/assetlinks.json", {}, searchParams, options),
		},
	},
	about: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/about", {}, searchParams, options),
	},
	api: {
		auth: {
			callback: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/auth/callback", {}, searchParams, options),
			},
			signout: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/auth/signout", {}, searchParams, options),
			},
		},
		cron: {
			deliverPushNotifications: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/api/cron/deliver-push-notifications",
						{},
						searchParams,
						options
					),
			},
			deliverTelegramNotifications: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/api/cron/deliver-telegram-notifications",
						{},
						searchParams,
						options
					),
			},
		},
		import: {
			googleSheet: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/import/google-sheet", {}, searchParams, options),
			},
		},
		omr: {
			print: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/omr/print", {}, searchParams, options),
			},
			scan: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/omr/scan", {}, searchParams, options),
			},
		},
		slack: {
			interactions: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/slack/interactions", {}, searchParams, options),
			},
			webhook: {
				instructorSignup: {
					route: (
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/api/slack/webhook/instructor-signup",
							{},
							searchParams,
							options
						),
				},
				schoolCreated: {
					route: (
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/api/slack/webhook/school-created",
							{},
							searchParams,
							options
						),
				},
			},
		},
		telegram: {
			webhook: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/api/telegram/webhook", {}, searchParams, options),
			},
		},
		webhooks: {
			notificationCreated: {
				route: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/api/webhooks/notification-created",
						{},
						searchParams,
						options
					),
			},
		},
	},
	auth: {
		confirmEmail: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/auth/confirm-email", {}, searchParams, options),
		},
		forgotPassword: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/auth/forgot-password", {}, searchParams, options),
		},
		login: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/auth/login", {}, searchParams, options),
		},
		resetPassword: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/auth/reset-password", {}, searchParams, options),
		},
		signup: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/auth/signup", {}, searchParams, options),
		},
	},
	courses: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/courses", {}, searchParams, options),
		slug: {
			page: (
				params: { slug: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/courses/:slug", params, searchParams, options),
		},
	},
	d: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/d", {}, searchParams, options),
		account: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/account", {}, searchParams, options),
		},
		admin: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/admin", {}, searchParams, options),
			agencies: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/agencies", {}, searchParams, options),
				agency_id: {
					page: (
						params: { agency_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/admin/agencies/:agency_id",
							params,
							searchParams,
							options
						),
				},
			},
			courses: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/courses", {}, searchParams, options),
				slug: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath("/d/admin/courses/:slug", params, searchParams, options),
				},
			},
			decks: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/decks", {}, searchParams, options),
				edit: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/admin/decks/:slug/edit",
							params,
							searchParams,
							options
						),
				},
			},
			discounts: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/discounts", {}, searchParams, options),
			},
			grades: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/grades", {}, searchParams, options),
			},
			libraries: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/libraries", {}, searchParams, options),
				slug: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/admin/libraries/:slug",
							params,
							searchParams,
							options
						),
				},
			},
			notifications: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/notifications", {}, searchParams, options),
			},
			provinces: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/provinces", {}, searchParams, options),
			},
			quizzes: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/quizzes", {}, searchParams, options),
				slug: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath("/d/admin/quizzes/:slug", params, searchParams, options),
				},
			},
			schools: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/admin/schools", {}, searchParams, options),
				school_id: {
					page: (
						params: { school_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/admin/schools/:school_id",
							params,
							searchParams,
							options
						),
				},
			},
			users: {
				instructors: {
					page: (
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath("/d/admin/users/instructors", {}, searchParams, options),
					user_id: {
						page: (
							params: { user_id: string },
							searchParams?: Record<string, string>,
							options: { locale?: string; isAbsolute?: boolean } = {}
						) =>
							buildPath(
								"/d/admin/users/instructors/:user_id",
								params,
								searchParams,
								options
							),
					},
				},
				students: {
					page: (
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) => buildPath("/d/admin/users/students", {}, searchParams, options),
					user_id: {
						page: (
							params: { user_id: string },
							searchParams?: Record<string, string>,
							options: { locale?: string; isAbsolute?: boolean } = {}
						) =>
							buildPath(
								"/d/admin/users/students/:user_id",
								params,
								searchParams,
								options
							),
					},
				},
			},
		},
		agency: {
			page: (
				params: { agency_id: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/agency/:agency_id", params, searchParams, options),
			charge: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/charge",
						params,
						searchParams,
						options
					),
			},
			courses: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/courses",
						params,
						searchParams,
						options
					),
				new: {
					page: (
						params: { agency_id: string; course_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/agency/:agency_id/courses/new/:course_id",
							params,
							searchParams,
							options
						),
				},
			},
			decks: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/decks",
						params,
						searchParams,
						options
					),
				edit: {
					page: (
						params: { agency_id: string; slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/agency/:agency_id/decks/:slug/edit",
							params,
							searchParams,
							options
						),
				},
			},
			disputes: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/disputes",
						params,
						searchParams,
						options
					),
			},
			instructors: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/instructors",
						params,
						searchParams,
						options
					),
			},
			members: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/members",
						params,
						searchParams,
						options
					),
			},
			notifications: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/notifications",
						params,
						searchParams,
						options
					),
			},
			quizzes: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/quizzes",
						params,
						searchParams,
						options
					),
				slug: {
					page: (
						params: { agency_id: string; slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/agency/:agency_id/quizzes/:slug",
							params,
							searchParams,
							options
						),
				},
			},
			schools: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/schools",
						params,
						searchParams,
						options
					),
			},
			settlements: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/settlements",
						params,
						searchParams,
						options
					),
			},
			transactions: {
				page: (
					params: { agency_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/agency/:agency_id/transactions",
						params,
						searchParams,
						options
					),
			},
		},
		bookmarks: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/bookmarks", {}, searchParams, options),
		},
		classrooms: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/classrooms", {}, searchParams, options),
			classroom_id: {
				page: (
					params: { classroom_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/classrooms/:classroom_id",
						params,
						searchParams,
						options
					),
			},
		},
		courses: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/courses", {}, searchParams, options),
			learn: {
				page: (
					params: { slug: string; lesson_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/courses/:slug/learn/:lesson_id",
						params,
						searchParams,
						options
					),
			},
			slug: {
				page: (
					params: { slug: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/courses/:slug", params, searchParams, options),
			},
		},
		decks: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/decks", {}, searchParams, options),
			edit: {
				page: (
					params: { slug: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/decks/:slug/edit", params, searchParams, options),
			},
			practice: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/decks/practice", {}, searchParams, options),
			},
		},
		instructor: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/instructor", {}, searchParams, options),
			account: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/account", {}, searchParams, options),
			},
			classrooms: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/classrooms", {}, searchParams, options),
				edit: {
					page: (
						params: { classroom_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/instructor/classrooms/:classroom_id/edit",
							params,
							searchParams,
							options
						),
				},
			},
			courses: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/courses", {}, searchParams, options),
				new: {
					page: (
						params: { course_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/instructor/courses/new/:course_id",
							params,
							searchParams,
							options
						),
				},
				slug: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/instructor/courses/:slug",
							params,
							searchParams,
							options
						),
				},
			},
			decks: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/decks", {}, searchParams, options),
				edit: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/instructor/decks/:slug/edit",
							params,
							searchParams,
							options
						),
				},
			},
			discounts: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/discounts", {}, searchParams, options),
			},
			earnings: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/earnings", {}, searchParams, options),
			},
			notifications: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath("/d/instructor/notifications", {}, searchParams, options),
			},
			quizzes: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/quizzes", {}, searchParams, options),
				slug: {
					page: (
						params: { slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/instructor/quizzes/:slug",
							params,
							searchParams,
							options
						),
				},
			},
			students: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/instructor/students", {}, searchParams, options),
			},
		},
		library: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/library", {}, searchParams, options),
			slug: {
				page: (
					params: { slug: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/library/:slug", params, searchParams, options),
			},
		},
		myCourses: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/my-courses", {}, searchParams, options),
			slug: {
				page: (
					params: { slug: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/my-courses/:slug", params, searchParams, options),
			},
		},
		myDecks: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/my-decks", {}, searchParams, options),
		},
		notifications: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/notifications", {}, searchParams, options),
		},
		school: {
			page: (
				params: { school_id: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/school/:school_id", params, searchParams, options),
			account: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/account",
						params,
						searchParams,
						options
					),
			},
			courses: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/courses",
						params,
						searchParams,
						options
					),
				new: {
					page: (
						params: { school_id: string; course_id: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/school/:school_id/courses/new/:course_id",
							params,
							searchParams,
							options
						),
				},
				slug: {
					page: (
						params: { school_id: string; slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/school/:school_id/courses/:slug",
							params,
							searchParams,
							options
						),
				},
			},
			decks: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/decks",
						params,
						searchParams,
						options
					),
				edit: {
					page: (
						params: { school_id: string; slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/school/:school_id/decks/:slug/edit",
							params,
							searchParams,
							options
						),
				},
			},
			discounts: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/discounts",
						params,
						searchParams,
						options
					),
			},
			earnings: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/earnings",
						params,
						searchParams,
						options
					),
			},
			members: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/members",
						params,
						searchParams,
						options
					),
			},
			notifications: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/notifications",
						params,
						searchParams,
						options
					),
			},
			quizzes: {
				page: (
					params: { school_id: string },
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) =>
					buildPath(
						"/d/school/:school_id/quizzes",
						params,
						searchParams,
						options
					),
				slug: {
					page: (
						params: { school_id: string; slug: string },
						searchParams?: Record<string, string>,
						options: { locale?: string; isAbsolute?: boolean } = {}
					) =>
						buildPath(
							"/d/school/:school_id/quizzes/:slug",
							params,
							searchParams,
							options
						),
				},
			},
		},
		tests: {
			passed: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/tests/passed", {}, searchParams, options),
			},
			registered: {
				page: (
					searchParams?: Record<string, string>,
					options: { locale?: string; isAbsolute?: boolean } = {}
				) => buildPath("/d/tests/registered", {}, searchParams, options),
			},
		},
		wallet: {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/d/wallet", {}, searchParams, options),
		},
	},
	decks: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/decks", {}, searchParams, options),
		slug: {
			page: (
				params: { slug: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/decks/:slug", params, searchParams, options),
		},
	},
	deleteAccount: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/delete-account", {}, searchParams, options),
		"content.mdx": {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/delete-account/content.mdx", {}, searchParams, options),
		},
	},
	home: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/", {}, searchParams, options),
	},
	libraries: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/libraries", {}, searchParams, options),
		slug: {
			page: (
				params: { slug: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/libraries/:slug", params, searchParams, options),
		},
	},
	offline: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/offline", {}, searchParams, options),
	},
	privacyPolicy: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/privacy-policy", {}, searchParams, options),
		"content.mdx": {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/privacy-policy/content.mdx", {}, searchParams, options),
		},
	},
	quizzes: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/quizzes", {}, searchParams, options),
		slug: {
			page: (
				params: { slug: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/quizzes/:slug", params, searchParams, options),
		},
	},
	search: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/search", {}, searchParams, options),
	},
	termsOfUse: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/terms-of-use", {}, searchParams, options),
		"content.mdx": {
			page: (
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/terms-of-use/content.mdx", {}, searchParams, options),
		},
	},
	verificationPending: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/verification-pending", {}, searchParams, options),
	},
	verify: {
		page: (
			searchParams?: Record<string, string>,
			options: { locale?: string; isAbsolute?: boolean } = {}
		) => buildPath("/verify", {}, searchParams, options),
		code: {
			page: (
				params: { code: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/verify/:code", params, searchParams, options),
		},
	},
	watch: {
		u: {
			page: (
				params: { id: string },
				searchParams?: Record<string, string>,
				options: { locale?: string; isAbsolute?: boolean } = {}
			) => buildPath("/watch/u/:id", params, searchParams, options),
		},
	},
};
