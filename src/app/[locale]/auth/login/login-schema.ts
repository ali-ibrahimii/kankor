import z from "zod";

export const loginSchema = z.object({
	email: z.email("validation.invalidEmail"),
	password: z.string(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
