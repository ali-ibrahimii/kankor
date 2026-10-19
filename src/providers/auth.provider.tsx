"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import * as React from "react";
import { signOutAction } from "@/lib/auth/actions";
import { getDashboardPath } from "@/lib/auth/auth.util";
import { CurrentUser } from "@/lib/auth/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthState =
	| { status: "loading" }
	| { status: "unauthenticated" }
	| { status: "authenticated"; user?: User; profile: CurrentUser | null };

type AuthContextValue = {
	/** Raw Supabase auth user — null when unauthenticated or still loading. */
	user: User | null;
	/** Full profile with role and school memberships. Null while fetching. */
	profile: CurrentUser | null;
	/** True while the initial session check is in flight. */
	isLoading: boolean;
	/** True when the user is authenticated (session exists). */
	isAuthenticated: boolean;
	/** Sign the current user out and navigate to /login. */
	signOut: () => Promise<void>;
	/** Role-appropriate dashboard path for the current user. */
	dashboardPath: string;
	/** Manually refetch the profile (e.g. after a role change). */
	refetchProfile: () => Promise<void>;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export type AuthProviderProps = {
	children: React.ReactNode;
	/**
	 * Optionally seed the provider with profile data fetched on the server.
	 * Avoids a client-side round-trip on first load for already-authenticated users.
	 */
	initialProfile?: CurrentUser | null;
};

export function AuthProvider({ children, initialProfile }: AuthProviderProps) {
	const router = useRouter();
	const locale = useLocale();

	const [authState, setAuthState] = React.useState<AuthState>({
		status: "loading",
	});

	// Fetch the full profile (role + school memberships) from the DB.
	const fetchProfile =
		React.useCallback(async (): Promise<CurrentUser | null> => {
			const { data: claimsData } = await supabase.auth.getClaims();
			const sub = claimsData?.claims?.sub;
			if (!sub) return null;

			const { data } = await supabase
				.from("profiles")
				.select(
					"*, schoolMemberships:school_members(school_id, role), agencyMemberships:agency_members(agency_id, role, status)"
				)
				.eq("id", sub)
				.single();

			return (data as CurrentUser) ?? null;
		}, []);

	// On mount: resolve the initial session and subscribe to auth state changes.
	React.useEffect(() => {
		// Resolve the current session once.
		supabase.auth.getClaims().then(async ({ data }) => {
			if (!data?.claims) {
				setAuthState({ status: "unauthenticated" });
				return;
			}
			// Use server-provided profile if available to avoid an extra round-trip.
			const profile =
				initialProfile !== undefined ? initialProfile : await fetchProfile();
			setAuthState({
				status: profile ? "authenticated" : "unauthenticated",
				profile,
			});
		});

		// Keep the state in sync with Supabase auth events.
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (!session?.user) {
				setAuthState({ status: "unauthenticated" });
				return;
			}

			const newUser = session.user;

			if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
				setAuthState((prev) => {
					// Keep the existing profile if the user hasn't changed — avoids a
					// redundant DB fetch on token refreshes.
					if (prev.status === "authenticated" && prev.profile !== null) {
						return { ...prev, user: newUser };
					}
					// Return "authenticated" with a null profile; fetchProfile will fill it.
					return { status: "authenticated", user: newUser, profile: null };
				});

				// Fetch profile for a new sign-in (not just a token refresh of the same user).
				setAuthState((prev) => {
					if (prev.status === "authenticated" && prev.profile === null) {
						fetchProfile().then((profile) => {
							setAuthState((current) =>
								current.status === "authenticated"
									? { ...current, profile }
									: current
							);
						});
					}
					return prev;
				});
			}

			if (event === "USER_UPDATED") {
				const profile = await fetchProfile();
				setAuthState({ status: "authenticated", user: newUser, profile });
			}

			if (event === "SIGNED_OUT") {
				setAuthState({ status: "unauthenticated" });
			}
		});

		return () => subscription.unsubscribe();
		// fetchProfile and initialProfile are intentionally stable references — no deps needed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const signOut = React.useCallback(async () => {
		await signOutAction();
		setAuthState({ status: "unauthenticated" });
		router.push(routes.auth.login.page(undefined, { locale }));
		router.refresh();
	}, [locale, router]);

	const refetchProfile = React.useCallback(async () => {
		if (authState.status !== "authenticated") return;
		const profile = await fetchProfile();
		setAuthState((prev) =>
			prev.status === "authenticated" ? { ...prev, profile } : prev
		);
	}, [authState, fetchProfile]);

	const dashboardPath = React.useMemo((): string => {
		if (authState.status === "authenticated")
			return getDashboardPath(authState.profile);
		return `/${locale}`;
	}, [authState, locale]);

	const value = React.useMemo<AuthContextValue>(
		() => ({
			user:
				authState.status === "authenticated" ? authState.user || null : null,
			profile: authState.status === "authenticated" ? authState.profile : null,
			isLoading: authState.status === "loading",
			isAuthenticated: "profile" in authState && !!authState.profile,
			signOut,
			dashboardPath,
			refetchProfile,
		}),
		[authState, signOut, dashboardPath, refetchProfile]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
	const ctx = React.useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
	return ctx;
}

/** Returns the raw Supabase User or null. */
export function useAuthUser(): User | null {
	return useAuth().user;
}

/** Returns the full profile (role + memberships) or null while loading. */
export function useAuthProfile(): CurrentUser | null {
	return useAuth().profile;
}

/** Returns a stable signOut callback. */
export function useSignOut(): () => Promise<void> {
	return useAuth().signOut;
}

/** Returns the role-appropriate dashboard path for the current user. */
export function useDashboardPath(): string {
	return useAuth().dashboardPath;
}

/** Returns true while the initial auth check is in flight. */
export function useAuthLoading(): boolean {
	return useAuth().isLoading;
}

/** Returns true while the initial auth check is in flight. */
export function useIsAuthenticated(): boolean {
	return useAuth().isAuthenticated;
}
