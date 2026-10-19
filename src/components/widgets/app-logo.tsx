import Image, { ImageProps } from "next/image";

const logos = {
	abzarkankor:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/abzarkankor.png",
	icon: "https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/icon.png",
	logo: "https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo.png",
	logo_2:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_2.png",
	logo_3:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_3.png",
	logo_typo_blue:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_typo_blue.png",
	logo_typo_blue_space:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_typo_blue_space.png",
	logo_typo_white:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_typo_white.png",
	logo_typo_white_space:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/logo_typo_white_space.png",
	typo_blue:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/typo_blue.png",
	typo_white:
		"https://storage.googleapis.com/abzarkankorv2.firebasestorage.app/logos/typo_white.png",
};

const dimensions: Record<LogoVariant, { width: number; height: number }> = {
	abzarkankor: { width: 102, height: 24 },
	icon: { width: 102, height: 24 },
	logo: { width: 512, height: 512 },
	logo_2: { width: 2513, height: 2342 },
	logo_3: { width: 1024, height: 1024 },
	logo_typo_blue: { width: 391, height: 335 },
	logo_typo_blue_space: { width: 512, height: 512 },
	logo_typo_white: { width: 384, height: 330 },
	logo_typo_white_space: { width: 512, height: 512 },
	typo_blue: { width: 324, height: 98 },
	typo_white: { width: 638, height: 194 },
};

type LogoVariant = keyof typeof logos;

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height"> & {
	variant?: LogoVariant;
};
export function AppLogo({ variant = "typo_blue", ...props }: Props) {
	const src = logos[variant];
	const dimen = dimensions[variant];
	return (
		<Image src={src} alt="Abzar Kankor" loading="eager" {...dimen} {...props} />
	);
}
