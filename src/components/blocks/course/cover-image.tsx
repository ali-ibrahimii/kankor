import Image from "next/image";

import { isNextImageSafe } from "./cover.utils";

/**
 * Fill-mode cover image that can never crash on a foreign host: URLs from
 * trusted hosts render through `next/image`; everything else falls back to a
 * plain `<img>` (which browsers handle fine, just without the optimizer).
 */
export function CoverFillImage({
	src,
	alt,
	sizes,
	className,
	priority,
}: {
	src: string;
	alt: string;
	sizes: string;
	className?: string;
	priority?: boolean;
}) {
	if (!isNextImageSafe(src)) {
		return (
			<img
				src={src}
				alt={alt}
				sizes={sizes}
				className={className}
				loading={priority ? "eager" : "lazy"}
				decoding="async"
			/>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes={sizes}
			className={className}
			priority={priority}
		/>
	);
}
