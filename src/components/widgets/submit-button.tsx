"use client";
import { LoaderIcon } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "../ui/button";

export function SubmitButton({ children, ...rest }: ButtonProps) {
	const { pending } = useFormStatus();
	return (
		<Button disabled={pending} type="submit" {...rest}>
			{pending ? <LoaderIcon className="animate-spin" /> : children}
		</Button>
	);
}
