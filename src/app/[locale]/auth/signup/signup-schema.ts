export type SignUpFormValues = {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;

	schoolName?: string;
	schoolAddress?: string;
	provinceId?: string;
	locale: string;
	type: string;
};
