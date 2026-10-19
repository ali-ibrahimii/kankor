import * as React from "react";

export type Menu = {
	label: React.ReactNode;
	icon?: React.ReactNode;
	href?: string;
	exact?: boolean;
	notifications?: number;
	isActive?: boolean;
	user_type?: string;
	roles?: string[];
};

export type MenuParent = Menu & {
	type: "dropdown" | "collapsible" | "sidebar";
	menus: Menu[];
};

export type MenuGroup = {
	order?: number;
	label?: React.ReactNode;
	icon?: React.ReactNode;
	href?: string;
	menus: (Menu | MenuParent)[];
	roles?: string[];
};
