import { BookOpen, Sparkles } from "lucide-react";

export default function Loading() {
	return (
		<div
			role="status"
			aria-label="در حال بارگذاری"
			className="relative flex min-h-[65vh] w-full flex-col items-center justify-center overflow-hidden bg-[#f9faff] px-4 dark:bg-[#141b2c]"
		>
			{/* Background glow */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 flex items-center justify-center"
			>
				<div className="absolute size-80 rounded-full bg-violet-400/10 blur-[90px] dark:bg-violet-500/10" />

				<div className="absolute size-52 translate-x-20 translate-y-16 rounded-full bg-emerald-400/10 blur-[70px]" />
			</div>

			{/* Main loader */}
			<div className="relative flex size-40 items-center justify-center">
				{/* Outer rotating ring */}
				<div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#694bd2] border-r-[#a78bfa] dark:border-t-[#a78bfa] dark:border-r-[#694bd2]" />

				{/* Inner rotating ring */}
				<div className="absolute inset-4 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-[#57d4a7] border-l-[#b7f486]" />

				{/* Soft background circle */}
				<div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#eee8ff] to-[#e4dcff] shadow-[0_12px_35px_-12px_rgba(105,75,210,.35)] dark:from-[#302b50] dark:to-[#252c46]" />

				{/* Center icon */}
				<div className="relative flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#694bd2] to-[#8b5cf6] text-white shadow-lg shadow-violet-500/30">
					<BookOpen className="size-8 animate-pulse" strokeWidth={1.8} />
				</div>

				{/* Floating sparkle */}
				<div className="absolute -end-2 top-5 flex size-9 animate-bounce items-center justify-center rounded-2xl bg-[#b7f486] text-[#23304a] shadow-lg shadow-emerald-500/20">
					<Sparkles className="size-4" />
				</div>
			</div>

			{/* Loading text */}
			<div className="relative mt-9 text-center">
				<h2 className="text-lg font-extrabold tracking-tight text-[#19243b] dark:text-white">
					در حال آماده‌سازی...
				</h2>

				<p className="mt-3 text-xs leading-7 text-slate-500 dark:text-slate-400">
					لطفاً کمی صبر کنید، محتوای آموزشی در حال بارگذاری است.
				</p>

				{/* Animated dots */}
				<div
					aria-hidden="true"
					className="mt-5 flex items-center justify-center gap-2"
				>
					<span className="size-2 animate-bounce rounded-full bg-[#694bd2] [animation-delay:-0.3s]" />

					<span className="size-2 animate-bounce rounded-full bg-[#8b5cf6] [animation-delay:-0.15s]" />

					<span className="size-2 animate-bounce rounded-full bg-[#57d4a7]" />
				</div>
			</div>

			<span className="sr-only">در حال بارگذاری...</span>
		</div>
	);
}
