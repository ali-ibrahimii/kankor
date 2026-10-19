"use client";

import { CirclePlus } from "lucide-react";
import * as React from "react";

import { NewCourseDialog } from "@/components/blocks/course-builder";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { routes } from "@/lib/routes";

interface NewCourseButtonProps {
	label: string;
}

export function NewCourseButton({ label }: NewCourseButtonProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<>
			<SidebarMenuButton
				className="bg-[#1461B8] text-white hover:bg-[#1051a0] hover:text-white active:bg-[#1051a0]"
				onClick={() => setOpen(true)}
			>
				<CirclePlus />
				<span>{label}</span>
			</SidebarMenuButton>
			<NewCourseDialog
				open={open}
				onOpenChange={setOpen}
				basePath={routes.d.instructor.page()}
			/>
		</>
	);
}
