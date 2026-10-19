export function getInitial(name?: string | null): string {
	if (!name) return "";

	const nameWords = name.split(/\s+/).filter((word) => word.length > 0);

	if (nameWords.length === 0) return "";

	if (nameWords.length === 1) {
		return nameWords[0].charAt(0).toUpperCase();
	} else {
		const firstInitial = nameWords[0].charAt(0).toUpperCase();
		const lastInitial = nameWords[nameWords.length - 1].charAt(0).toUpperCase();
		return firstInitial + lastInitial;
	}
}
