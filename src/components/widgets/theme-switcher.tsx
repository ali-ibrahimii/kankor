"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme.provider";

export function ThemeSwitcher({ label }: { label: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const dark = mounted && resolvedTheme === "dark";
	return (
		<Button
			variant="ghost"
			size="icon"
			type="button"
			aria-label={label}
			title={label}
			onClick={() => setTheme(dark ? "light" : "dark")}
			className="size-9 shrink-0 rounded-xl text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/10"
		>
			<span className="sr-only">{label}</span>
			{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</Button>
	);
}
