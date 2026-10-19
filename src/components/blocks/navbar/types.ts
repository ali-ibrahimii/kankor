import { ReactNode } from "react";

export interface SubLink {
	href: string;
	label: string;
	icon?: ReactNode;
	description?: string;
}

export interface NavLink {
	href: string;
	labelKey: string;
	icon?: ReactNode;
	children?: SubLink[];
	GlobalSearch?: ReactNode;
}
