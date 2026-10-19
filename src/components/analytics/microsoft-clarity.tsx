"use client";

import clarity from "@microsoft/clarity";
import { useEffect } from "react";
import { clientEnv } from "@/lib/env/client-env";

interface MicrosoftClarityProps {
	projectId?: string;
}

export function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
	const idToUse =
		projectId ??
		(projectId === undefined ? clientEnv.clarityProjectId : undefined);

	useEffect(() => {
		if (idToUse) {
			clarity.init(idToUse);
		}
	}, [idToUse]);

	return null;
}
