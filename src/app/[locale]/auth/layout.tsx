import { AppLogo } from "@/components/widgets/app-logo";
import { LocaleSwitcher } from "@/components/widgets/locale-switcher";
import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: React.PropsWithChildren) {
	return (
		<div className="relative flex min-h-svh flex-col bg-muted">
			<div className="flex flex-1 items-center justify-center p-6 md:p-10">
				<div className="flex w-full max-w-sm flex-col gap-6">
					<Link
						href="/"
						className="flex items-center gap-2 self-center font-medium"
					>
						<AppLogo className="w-20" variant="logo" />
					</Link>
					{children}
				</div>
			</div>
			<div className="flex md:fixed bottom-5 justify-center p-4 md:p-6">
				<LocaleSwitcher type="group" />
			</div>
		</div>
	);
}
