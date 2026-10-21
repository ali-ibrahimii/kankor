import { Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitial } from "@/utils/str.util";

/** Read-only stand-in for `NavUser` in the demo — no menu, no session. */
export function DemoUserCard({
	name,
	email,
	roleLabel,
	hint,
}: {
	name: string;
	email: string;
	roleLabel: string;
	hint: string;
}) {
	return (
		<div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2">
			<Avatar className="size-8 rounded-lg">
				<AvatarFallback className="rounded-lg bg-gradient-to-br from-[#725bff] to-[#36c6ab] text-xs font-bold text-white">
					{getInitial(name)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1 text-start">
				<p className="truncate text-sm font-medium">{name}</p>
				<p className="truncate text-[10px] text-muted-foreground">
					{roleLabel} · {email}
				</p>
			</div>
			<span
				title={hint}
				className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
			>
				<Eye className="size-3" />
				<span className="sr-only">{hint}</span>
			</span>
		</div>
	);
}
