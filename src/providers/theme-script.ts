export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEMES: Theme[] = ["light", "dark", "system"];

/**
 * Runs before the first paint (rendered by the server layout) so the correct
 * `light`/`dark` class is already on <html> when the app hydrates. Without it
 * a dark-mode visitor would briefly see the light theme.
 */
export const themeInitScript = `(function(){try{var d=document.documentElement,s=localStorage.getItem("${THEME_STORAGE_KEY}"),t=s==="light"||s==="dark"||s==="system"?s:"light",r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r}catch(e){}})();`;
