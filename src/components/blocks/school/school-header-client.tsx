"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { SchoolForm, type SchoolFormValues } from "./school-form";

interface SchoolHeaderClientProps {
	schoolId: string;
	userId: string;
	locale: string;
}

export function SchoolHeaderClient({
	schoolId,
	userId,
	locale,
}: SchoolHeaderClientProps) {
	const t = useTranslations("dashboard.school");
	const router = useRouter();
	const supabase = createClient();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = React.useState(false);

	const schoolsQuery = useQuery({
		queryKey: ["user-schools-switcher", userId],
		queryFn: async () => {
			// Query owned schools
			const { data: owned, error: ownedErr } = await supabase
				.from("schools")
				.select("id, name, address, province_id")
				.eq("user_id", userId);
			if (ownedErr) throw ownedErr;

			// Query member schools
			const { data: members, error: membersErr } = await supabase
				.from("school_members")
				.select("school_id, schools(id, name, address, province_id)")
				.eq("user_id", userId);
			if (membersErr) throw membersErr;

			const ownedSchools = owned || [];
			const memberSchools = (members || [])
				.map((m) => m.schools)
				.filter(Boolean) as any[];

			// Merge unique schools by id
			const mergedMap = new Map<string, any>();
			for (const s of [...ownedSchools, ...memberSchools]) {
				mergedMap.set(s.id, s);
			}

			return Array.from(mergedMap.values());
		},
		enabled: !!userId,
		staleTime: 2 * 60 * 1000,
	});

	const schoolsList = schoolsQuery.data ?? [];
	const currentSchool = schoolsList.find((s) => s.id === schoolId);

	const handleSwitchSchool = (targetId: string) => {
		router.push(`/d/school/${targetId}`);
	};

	const handleCreateSchoolSubmit = async (values: SchoolFormValues) => {
		try {
			const { data: newSchool, error } = await supabase
				.from("schools")
				.insert({
					name: values.name,
					address: values.address,
					province_id: values.provinceId || null,
					user_id: userId,
				})
				.select("id, name")
				.single();

			if (error) throw error;

			toast.success("School created successfully!");
			setCreateOpen(false);

			// Invalidate query to refresh list
			await queryClient.invalidateQueries({
				queryKey: ["user-schools-switcher", userId],
			});

			// Redirect to new school page
			if (newSchool?.id) {
				router.push(`/d/school/${newSchool.id}`);
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to create school");
		}
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
							>
								<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1461B8]">
									<Building2 className="size-4 text-white" />
								</div>
								<div className="flex flex-col leading-none text-start text-base font-semibold group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 transition-all duration-150">
									<span className="truncate text-sm font-semibold">
										{currentSchool?.name || t("defaultName")}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{t("roleLabel")}
									</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
							align="start"
						>
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Schools
							</DropdownMenuLabel>
							{schoolsQuery.isLoading ? (
								<DropdownMenuItem disabled>Loading schools...</DropdownMenuItem>
							) : schoolsList.length === 0 ? (
								<DropdownMenuItem disabled>No schools found</DropdownMenuItem>
							) : (
								schoolsList.map((sch) => (
									<DropdownMenuItem
										key={sch.id}
										onClick={() => handleSwitchSchool(sch.id)}
										className="cursor-pointer"
									>
										<Building2 className="size-4 mr-2" />
										<span className="truncate">{sch.name}</span>
									</DropdownMenuItem>
								))
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setCreateOpen(true)}
								className="cursor-pointer"
							>
								<Plus className="size-4 mr-2" />
								<span>Create New School</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Create New School</DialogTitle>
						<DialogDescription>
							Register a new school branch to manage classrooms, students, and
							courses.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<SchoolForm
							onSubmit={handleCreateSchoolSubmit}
							onCancel={() => setCreateOpen(false)}
							submitLabel="Register School"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
