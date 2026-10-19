import { ConfirmEmailForm } from "./confirm-email-form";

interface Props {
	searchParams: Promise<{ email?: string }>;
}

export default async function ConfirmEmailPage({ searchParams }: Props) {
	const { email } = await searchParams;
	return <ConfirmEmailForm defaultEmail={email} />;
}
