import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware wrappers — use these instead of next/navigation and next/link
// anywhere under app/[locale] so links keep the current locale prefix.
export const {
	Link,
	redirect,
	usePathname,
	useRouter,
	getPathname,
	permanentRedirect,
} = createNavigation(routing);
