import { Suspense } from "react";
import { LoginForm } from "@/app/[locale]/auth/login/login-form";
import Loading from "@/components/widgets/loading";

export default function LoginPage() {
	return (
		<Suspense fallback={<Loading />}>
			<LoginForm />
		</Suspense>
	);
}
