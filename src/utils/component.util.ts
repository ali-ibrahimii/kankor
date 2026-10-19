const rawTypes = ["string", "number", "boolean"];

export function isRawType(child: React.ReactNode) {
	const type = typeof child;
	return rawTypes.includes(type);
}
