export type BaseParams = {
	locale: string;
};

export type BasePageProps = {
	params: Promise<BaseParams>;
	searchParams: Promise<Record<string, string>>;
};
