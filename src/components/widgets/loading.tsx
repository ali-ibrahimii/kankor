import { LoaderIcon } from "lucide-react";

export default function Loading() {
	return (
		<div className="w-full flex justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	);
}
