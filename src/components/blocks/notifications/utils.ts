import {
	Award,
	BookOpen,
	Building2,
	CheckCircle2,
	ClipboardCheck,
	Clock,
	FileUp,
	GraduationCap,
	LogIn,
	type LucideIcon,
	Megaphone,
	MessageSquare,
	Reply,
	Settings,
	UserPlus,
} from "lucide-react";
import type { NotificationType } from "./types";

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, LucideIcon> = {
	new_course_enrollment: GraduationCap,
	course_completion: Award,
	new_lesson_available: BookOpen,
	quiz_due_reminder: Clock,
	quiz_graded: ClipboardCheck,
	new_assignment_submission: FileUp,
	assignment_graded: ClipboardCheck,
	new_discussion_post: MessageSquare,
	new_reply_to_post: Reply,
	course_announcement: Megaphone,
	system_update: Settings,
	badge_awarded: Award,
	classroom_invite: UserPlus,
	classroom_join_request: LogIn,
	classroom_invite_response: CheckCircle2,
	school_invite: Building2,
	school_invite_response: CheckCircle2,
};

const RELATIVE_TIME_DIVISIONS: {
	amount: number;
	unit: Intl.RelativeTimeFormatUnit;
}[] = [
	{ amount: 60, unit: "seconds" },
	{ amount: 60, unit: "minutes" },
	{ amount: 24, unit: "hours" },
	{ amount: 7, unit: "days" },
	{ amount: 4.34524, unit: "weeks" },
	{ amount: 12, unit: "months" },
	{ amount: Number.POSITIVE_INFINITY, unit: "years" },
];

export function formatRelativeTime(dateIso: string, locale: string): string {
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	let duration = (new Date(dateIso).getTime() - Date.now()) / 1000;

	for (const division of RELATIVE_TIME_DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			return rtf.format(Math.round(duration), division.unit);
		}
		duration /= division.amount;
	}
	return rtf.format(Math.round(duration), "years");
}
