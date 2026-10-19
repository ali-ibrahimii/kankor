"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export interface TrendChartProps {
	title: string;
	data: { date: string; value: number }[];
	valueLabel: string;
	color?: string;
}

function formatTickDate(value: React.ReactNode) {
	return new Date(value as string).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

/** Small 14-day area trend chart shared by the four dashboard overview pages. */
export function TrendChart({
	title,
	data,
	valueLabel,
	color = "var(--primary)",
}: TrendChartProps) {
	const gradientId = React.useId();
	const config = {
		value: { label: valueLabel, color },
	} satisfies ChartConfig;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-2 pt-0 sm:px-6">
				<ChartContainer
					config={config}
					className="aspect-auto h-[220px] w-full"
				>
					<AreaChart data={data}>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-value)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-value)"
									stopOpacity={0.05}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={24}
							tickFormatter={formatTickDate}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									labelFormatter={formatTickDate}
									indicator="dot"
								/>
							}
						/>
						<Area
							dataKey="value"
							type="natural"
							fill={`url(#${gradientId})`}
							stroke="var(--color-value)"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
