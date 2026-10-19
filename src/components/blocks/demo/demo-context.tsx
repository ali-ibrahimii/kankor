"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { DemoError } from "@/lib/demo/actions";
import { createDemoState } from "@/lib/demo/seed";
import {
	DEMO_STORAGE_KEY,
	readDemoState,
	writeDemoState,
} from "@/lib/demo/storage";
import type { DemoRole, DemoState, DemoUser } from "@/lib/demo/types";

export type DemoSection =
	| "overview"
	| "people"
	| "members"
	| "schools"
	| "courses"
	| "myCourses"
	| "explore"
	| "classrooms"
	| "students"
	| "certificates"
	| "settings";

export interface DemoContextValue {
	state: DemoState;
	ready: boolean;
	actor: DemoUser;
	section: DemoSection;
	setSection: (section: DemoSection) => void;
	chooseRole: (role: DemoRole) => void;
	chooseAccount: (id: string) => void;
	run: (
		action: (state: DemoState, actorId: string) => DemoState,
		success?: string
	) => boolean;
	reset: () => void;
	formatNumber: (value: number) => string;
	formatDate: (value: string) => string;
}

const DemoContext = React.createContext<DemoContextValue | null>(null);
const ACCOUNT_KEY = "abzarkankor.dashboard-demo.account";

export function useDemo(): DemoContextValue {
	const value = React.useContext(DemoContext);
	if (!value) throw new Error("Demo panels require DemoProvider");
	return value;
}

export function DemoProvider({
	invitation,
	children,
}: {
	invitation?: string;
	children: React.ReactNode;
}) {
	const t = useTranslations("demo");
	const locale = useLocale();
	const [state, setState] = React.useState<DemoState>(createDemoState);
	const [ready, setReady] = React.useState(false);
	const stateRef = React.useRef(state);
	const [accountId, setAccountId] = React.useState(
		invitation ? "student-1" : "admin-1"
	);
	const [section, setSection] = React.useState<DemoSection>(
		invitation ? "classrooms" : "overview"
	);

	React.useEffect(() => {
		const saved = readDemoState(window.localStorage);
		// Persist the initial seed too, so even its sample certificate can only
		// be verified in a browser that has visited this demo workspace.
		writeDemoState(window.localStorage, saved);
		stateRef.current = saved;
		setState(saved);
		if (!invitation) {
			try {
				const storedAccount = window.sessionStorage.getItem(ACCOUNT_KEY);
				if (
					saved.users.some(
						(person) =>
							person.id === storedAccount && person.status === "active"
					)
				) {
					setAccountId(storedAccount!);
				}
			} catch {
				/* session storage may be unavailable */
			}
		}
		const onStorage = (event: StorageEvent) => {
			if (event.key === DEMO_STORAGE_KEY) {
				const next = readDemoState(window.localStorage);
				stateRef.current = next;
				setState(next);
			}
		};
		window.addEventListener("storage", onStorage);
		setReady(true);
		return () => window.removeEventListener("storage", onStorage);
	}, [invitation]);

	const actor =
		state.users.find(
			(person) => person.id === accountId && person.status === "active"
		) ?? state.users.find((person) => person.id === "admin-1")!;

	const chooseAccount = React.useCallback((id: string) => {
		if (
			!stateRef.current.users.some(
				(person) => person.id === id && person.status === "active"
			)
		)
			return;
		setAccountId(id);
		setSection("overview");
		try {
			window.sessionStorage.setItem(ACCOUNT_KEY, id);
		} catch {
			/* demo still works */
		}
	}, []);

	const chooseRole = React.useCallback(
		(role: DemoRole) => {
			const next = stateRef.current.users.find(
				(person) => person.role === role && person.status === "active"
			);
			if (next) chooseAccount(next.id);
		},
		[chooseAccount]
	);

	const run = React.useCallback(
		(
			action: (state: DemoState, actorId: string) => DemoState,
			success?: string
		): boolean => {
			try {
				const next = action(stateRef.current, actor.id);
				stateRef.current = next;
				setState(next);
				writeDemoState(window.localStorage, next);
				toast.success(success ?? t("saved"));
				return true;
			} catch (error) {
				if (error instanceof DemoError) {
					toast.error(t(`errors.${error.code}` as Parameters<typeof t>[0]));
				} else {
					toast.error(t("errors.unknown"));
				}
				return false;
			}
		},
		[actor.id, t]
	);

	const reset = React.useCallback(() => {
		const fresh = createDemoState();
		stateRef.current = fresh;
		setState(fresh);
		writeDemoState(window.localStorage, fresh);
		chooseAccount("admin-1");
		toast.success(t("resetSuccess"));
	}, [chooseAccount, t]);

	const formatNumber = React.useCallback(
		(value: number) =>
			new Intl.NumberFormat(
				locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US"
			).format(value),
		[locale]
	);
	const formatDate = React.useCallback(
		(value: string) =>
			new Intl.DateTimeFormat(
				locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-GB",
				{ dateStyle: "medium" }
			).format(new Date(value)),
		[locale]
	);

	return (
		<DemoContext.Provider
			value={{
				state,
				ready,
				actor,
				section,
				setSection,
				chooseRole,
				chooseAccount,
				run,
				reset,
				formatNumber,
				formatDate,
			}}
		>
			{children}
		</DemoContext.Provider>
	);
}
