export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			agencies: {
				Row: {
					address: string | null;
					commission_rate: number;
					contact_email: string | null;
					contact_phone: string | null;
					created_at: string;
					created_by: string | null;
					id: string;
					liability_limit: number;
					name: string;
					province_id: string | null;
					status: Database["public"]["Enums"]["agency_status"];
					updated_at: string;
				};
				Insert: {
					address?: string | null;
					commission_rate?: number;
					contact_email?: string | null;
					contact_phone?: string | null;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					liability_limit: number;
					name: string;
					province_id?: string | null;
					status?: Database["public"]["Enums"]["agency_status"];
					updated_at?: string;
				};
				Update: {
					address?: string | null;
					commission_rate?: number;
					contact_email?: string | null;
					contact_phone?: string | null;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					liability_limit?: number;
					name?: string;
					province_id?: string | null;
					status?: Database["public"]["Enums"]["agency_status"];
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "agencies_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agencies_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agencies_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agencies_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
				];
			};
			agency_audit_log: {
				Row: {
					action: string;
					actor_id: string | null;
					agency_id: string;
					created_at: string;
					id: string;
					payload: Json | null;
					permission_used:
						| Database["public"]["Enums"]["agency_permission"]
						| null;
					target_id: string | null;
					target_type: string | null;
				};
				Insert: {
					action: string;
					actor_id?: string | null;
					agency_id: string;
					created_at?: string;
					id?: string;
					payload?: Json | null;
					permission_used?:
						| Database["public"]["Enums"]["agency_permission"]
						| null;
					target_id?: string | null;
					target_type?: string | null;
				};
				Update: {
					action?: string;
					actor_id?: string | null;
					agency_id?: string;
					created_at?: string;
					id?: string;
					payload?: Json | null;
					permission_used?:
						| Database["public"]["Enums"]["agency_permission"]
						| null;
					target_id?: string | null;
					target_type?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_audit_log_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_audit_log_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_audit_log_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_audit_log_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_audit_log_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
				];
			};
			agency_disputes: {
				Row: {
					adjustment_transaction_id: string | null;
					agency_id: string;
					agency_response: string | null;
					created_at: string;
					id: string;
					resolution_note: string | null;
					resolved_by: string | null;
					status: Database["public"]["Enums"]["agency_dispute_status"];
					student_id: string;
					student_note: string;
					topup_id: string;
					updated_at: string;
				};
				Insert: {
					adjustment_transaction_id?: string | null;
					agency_id: string;
					agency_response?: string | null;
					created_at?: string;
					id?: string;
					resolution_note?: string | null;
					resolved_by?: string | null;
					status?: Database["public"]["Enums"]["agency_dispute_status"];
					student_id: string;
					student_note: string;
					topup_id: string;
					updated_at?: string;
				};
				Update: {
					adjustment_transaction_id?: string | null;
					agency_id?: string;
					agency_response?: string | null;
					created_at?: string;
					id?: string;
					resolution_note?: string | null;
					resolved_by?: string | null;
					status?: Database["public"]["Enums"]["agency_dispute_status"];
					student_id?: string;
					student_note?: string;
					topup_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "agency_disputes_adjustment_transaction_id_fkey";
						columns: ["adjustment_transaction_id"];
						isOneToOne: false;
						referencedRelation: "credit_transactions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_resolved_by_fkey";
						columns: ["resolved_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_resolved_by_fkey";
						columns: ["resolved_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_resolved_by_fkey";
						columns: ["resolved_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_topup_id_fkey";
						columns: ["topup_id"];
						isOneToOne: true;
						referencedRelation: "agency_topups";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_topup_id_fkey";
						columns: ["topup_id"];
						isOneToOne: true;
						referencedRelation: "agency_topups_view";
						referencedColumns: ["id"];
					},
				];
			};
			agency_grants: {
				Row: {
					agency_id: string;
					created_at: string;
					granted_by: string | null;
					id: string;
					permission: Database["public"]["Enums"]["agency_permission"];
					scope: Json | null;
					scope_type: Database["public"]["Enums"]["agency_grant_scope"];
				};
				Insert: {
					agency_id: string;
					created_at?: string;
					granted_by?: string | null;
					id?: string;
					permission: Database["public"]["Enums"]["agency_permission"];
					scope?: Json | null;
					scope_type?: Database["public"]["Enums"]["agency_grant_scope"];
				};
				Update: {
					agency_id?: string;
					created_at?: string;
					granted_by?: string | null;
					id?: string;
					permission?: Database["public"]["Enums"]["agency_permission"];
					scope?: Json | null;
					scope_type?: Database["public"]["Enums"]["agency_grant_scope"];
				};
				Relationships: [
					{
						foreignKeyName: "agency_grants_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_grants_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_grants_granted_by_fkey";
						columns: ["granted_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_grants_granted_by_fkey";
						columns: ["granted_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_grants_granted_by_fkey";
						columns: ["granted_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			agency_members: {
				Row: {
					agency_id: string;
					created_at: string;
					id: string;
					role: Database["public"]["Enums"]["agency_member_role"];
					status: Database["public"]["Enums"]["agency_member_status"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					agency_id: string;
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["agency_member_role"];
					status?: Database["public"]["Enums"]["agency_member_status"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					agency_id?: string;
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["agency_member_role"];
					status?: Database["public"]["Enums"]["agency_member_status"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			agency_settlements: {
				Row: {
					agency_id: string;
					commission_amount: number;
					created_at: string;
					gross_amount: number;
					id: string;
					method: Database["public"]["Enums"]["agency_settlement_method"];
					net_received: number;
					note: string | null;
					period_end: string | null;
					period_start: string | null;
					recorded_by: string | null;
				};
				Insert: {
					agency_id: string;
					commission_amount: number;
					created_at?: string;
					gross_amount: number;
					id?: string;
					method?: Database["public"]["Enums"]["agency_settlement_method"];
					net_received: number;
					note?: string | null;
					period_end?: string | null;
					period_start?: string | null;
					recorded_by?: string | null;
				};
				Update: {
					agency_id?: string;
					commission_amount?: number;
					created_at?: string;
					gross_amount?: number;
					id?: string;
					method?: Database["public"]["Enums"]["agency_settlement_method"];
					net_received?: number;
					note?: string | null;
					period_end?: string | null;
					period_start?: string | null;
					recorded_by?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_settlements_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_settlements_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_settlements_recorded_by_fkey";
						columns: ["recorded_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_settlements_recorded_by_fkey";
						columns: ["recorded_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_settlements_recorded_by_fkey";
						columns: ["recorded_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			agency_topups: {
				Row: {
					agency_id: string;
					amount: number;
					created_at: string;
					credit_transaction_id: string | null;
					id: string;
					member_id: string;
					note: string | null;
					student_id: string;
				};
				Insert: {
					agency_id: string;
					amount: number;
					created_at?: string;
					credit_transaction_id?: string | null;
					id?: string;
					member_id: string;
					note?: string | null;
					student_id: string;
				};
				Update: {
					agency_id?: string;
					amount?: number;
					created_at?: string;
					credit_transaction_id?: string | null;
					id?: string;
					member_id?: string;
					note?: string | null;
					student_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "agency_topups_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_credit_transaction_id_fkey";
						columns: ["credit_transaction_id"];
						isOneToOne: false;
						referencedRelation: "credit_transactions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			answer_sheets: {
				Row: {
					answer_number: number;
					created_at: string | null;
					id: string;
					lesson_id: string;
					question_number: number;
					updated_at: string | null;
				};
				Insert: {
					answer_number: number;
					created_at?: string | null;
					id?: string;
					lesson_id: string;
					question_number: number;
					updated_at?: string | null;
				};
				Update: {
					answer_number?: number;
					created_at?: string | null;
					id?: string;
					lesson_id?: string;
					question_number?: number;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "answer_sheets_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
				];
			};
			answers: {
				Row: {
					answer_text: string | null;
					created_at: string;
					feedback: string | null;
					id: string;
					is_correct: boolean | null;
					points_awarded: number | null;
					question_id: string | null;
					quiz_attempt_id: string | null;
					selected_option_ids: string[] | null;
					structured_answer: Json | null;
					submitted_at: string;
					updated_at: string;
				};
				Insert: {
					answer_text?: string | null;
					created_at?: string;
					feedback?: string | null;
					id?: string;
					is_correct?: boolean | null;
					points_awarded?: number | null;
					question_id?: string | null;
					quiz_attempt_id?: string | null;
					selected_option_ids?: string[] | null;
					structured_answer?: Json | null;
					submitted_at?: string;
					updated_at?: string;
				};
				Update: {
					answer_text?: string | null;
					created_at?: string;
					feedback?: string | null;
					id?: string;
					is_correct?: boolean | null;
					points_awarded?: number | null;
					question_id?: string | null;
					quiz_attempt_id?: string | null;
					selected_option_ids?: string[] | null;
					structured_answer?: Json | null;
					submitted_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "answers_question_id_fkey";
						columns: ["question_id"];
						isOneToOne: false;
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "answers_quiz_attempt_id_fkey";
						columns: ["quiz_attempt_id"];
						isOneToOne: false;
						referencedRelation: "quiz_attempts";
						referencedColumns: ["id"];
					},
				];
			};
			bookmarks: {
				Row: {
					created_at: string;
					id: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["bookmarkable_item_type"];
					notes: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["bookmarkable_item_type"];
					notes?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					item_id?: string;
					item_type?: Database["public"]["Enums"]["bookmarkable_item_type"];
					notes?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			books: {
				Row: {
					created_at: string;
					file_path: string;
					full_name: string;
					grade_id: string | null;
					id: string;
					name: string;
					subject_id: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					file_path: string;
					full_name: string;
					grade_id?: string | null;
					id?: string;
					name: string;
					subject_id?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					file_path?: string;
					full_name?: string;
					grade_id?: string | null;
					id?: string;
					name?: string;
					subject_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "books_grade_id_fkey1";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "books_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
				];
			};
			categories: {
				Row: {
					created_at: string;
					description: string | null;
					icon_url: string | null;
					id: string;
					name: string;
					parent: string | null;
					slug: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					icon_url?: string | null;
					id?: string;
					name: string;
					parent?: string | null;
					slug?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					icon_url?: string | null;
					id?: string;
					name?: string;
					parent?: string | null;
					slug?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "categories_parent_fkey";
						columns: ["parent"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
				];
			};
			certificates: {
				Row: {
					certificate_pdf_url: string | null;
					course_id: string;
					course_title: string;
					created_at: string;
					id: string;
					issued_at: string | null;
					updated_at: string;
					user_full_name: string;
					user_id: string;
					verification_code: string | null;
				};
				Insert: {
					certificate_pdf_url?: string | null;
					course_id: string;
					course_title: string;
					created_at?: string;
					id?: string;
					issued_at?: string | null;
					updated_at?: string;
					user_full_name: string;
					user_id: string;
					verification_code?: string | null;
				};
				Update: {
					certificate_pdf_url?: string | null;
					course_id?: string;
					course_title?: string;
					created_at?: string;
					id?: string;
					issued_at?: string | null;
					updated_at?: string;
					user_full_name?: string;
					user_id?: string;
					verification_code?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "certificates_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "certificates_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "certificates_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "certificates_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "certificates_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_announcements: {
				Row: {
					author_id: string;
					classroom_id: string;
					created_at: string;
					id: string;
					message: string;
					updated_at: string;
				};
				Insert: {
					author_id: string;
					classroom_id: string;
					created_at?: string;
					id?: string;
					message: string;
					updated_at?: string;
				};
				Update: {
					author_id?: string;
					classroom_id?: string;
					created_at?: string;
					id?: string;
					message?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_announcements_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_announcements_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_announcements_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_announcements_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_folders: {
				Row: {
					classroom_id: string;
					id: string;
					name: string;
					sort_order: number | null;
				};
				Insert: {
					classroom_id: string;
					id?: string;
					name: string;
					sort_order?: number | null;
				};
				Update: {
					classroom_id?: string;
					id?: string;
					name?: string;
					sort_order?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_folders_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_material_files: {
				Row: {
					created_at: string;
					file_name: string;
					file_path: string;
					file_size: number | null;
					id: string;
					material_id: string;
					mime_type: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					file_name: string;
					file_path: string;
					file_size?: number | null;
					id?: string;
					material_id: string;
					mime_type?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					file_name?: string;
					file_path?: string;
					file_size?: number | null;
					id?: string;
					material_id?: string;
					mime_type?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_material_files_material_id_fkey";
						columns: ["material_id"];
						isOneToOne: false;
						referencedRelation: "classroom_materials";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_materials: {
				Row: {
					classroom_id: string;
					created_at: string;
					created_by: string;
					description: string | null;
					folder_id: string | null;
					id: string;
					published: boolean;
					published_at: string | null;
					title: string;
					type: Database["public"]["Enums"]["classroom_material_type"];
					updated_at: string;
				};
				Insert: {
					classroom_id: string;
					created_at?: string;
					created_by: string;
					description?: string | null;
					folder_id?: string | null;
					id?: string;
					published?: boolean;
					published_at?: string | null;
					title: string;
					type?: Database["public"]["Enums"]["classroom_material_type"];
					updated_at?: string;
				};
				Update: {
					classroom_id?: string;
					created_at?: string;
					created_by?: string;
					description?: string | null;
					folder_id?: string | null;
					id?: string;
					published?: boolean;
					published_at?: string | null;
					title?: string;
					type?: Database["public"]["Enums"]["classroom_material_type"];
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_materials_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_materials_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_materials_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_materials_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_materials_folder_id_fkey";
						columns: ["folder_id"];
						isOneToOne: false;
						referencedRelation: "classroom_folders";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_members: {
				Row: {
					classroom_id: string;
					created_at: string;
					id: string;
					role: Database["public"]["Enums"]["classroom_role"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					classroom_id: string;
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["classroom_role"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					classroom_id?: string;
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["classroom_role"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_members_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_membership_requests: {
				Row: {
					classroom_id: string;
					classroom_name: string | null;
					created_at: string;
					id: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by: string | null;
					responded_at: string | null;
					responded_by: string | null;
					status: Database["public"]["Enums"]["classroom_request_status"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					classroom_id: string;
					classroom_name?: string | null;
					created_at?: string;
					id?: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by?: string | null;
					responded_at?: string | null;
					responded_by?: string | null;
					status?: Database["public"]["Enums"]["classroom_request_status"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					classroom_id?: string;
					classroom_name?: string | null;
					created_at?: string;
					id?: string;
					initiated_by?: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by?: string | null;
					responded_at?: string | null;
					responded_by?: string | null;
					status?: Database["public"]["Enums"]["classroom_request_status"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_membership_requests_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_responded_by_fkey";
						columns: ["responded_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_responded_by_fkey";
						columns: ["responded_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_responded_by_fkey";
						columns: ["responded_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_membership_requests_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			classroom_resources: {
				Row: {
					classroom_id: string;
					created_at: string;
					id: string;
					resource_id: string;
					resource_type: Database["public"]["Enums"]["shareable_type"];
					shared_by: string;
					updated_at: string;
				};
				Insert: {
					classroom_id: string;
					created_at?: string;
					id?: string;
					resource_id: string;
					resource_type: Database["public"]["Enums"]["shareable_type"];
					shared_by: string;
					updated_at?: string;
				};
				Update: {
					classroom_id?: string;
					created_at?: string;
					id?: string;
					resource_id?: string;
					resource_type?: Database["public"]["Enums"]["shareable_type"];
					shared_by?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classroom_resources_classroom_id_fkey";
						columns: ["classroom_id"];
						isOneToOne: false;
						referencedRelation: "classrooms";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_resources_shared_by_fkey";
						columns: ["shared_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_resources_shared_by_fkey";
						columns: ["shared_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classroom_resources_shared_by_fkey";
						columns: ["shared_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			classrooms: {
				Row: {
					cover_image: string | null;
					created_at: string;
					description: string | null;
					id: string;
					is_archived: boolean;
					join_code: string;
					name: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					cover_image?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					is_archived?: boolean;
					join_code: string;
					name: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					cover_image?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					is_archived?: boolean;
					join_code?: string;
					name?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "classrooms_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classrooms_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "classrooms_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			code: {
				Row: {
					code: number;
					created_at: string;
					department_id: string;
					id: string;
					max_score: number;
					min_score: number;
					university_id: string;
					updated_at: string;
				};
				Insert: {
					code: number;
					created_at?: string;
					department_id: string;
					id?: string;
					max_score: number;
					min_score: number;
					university_id: string;
					updated_at?: string;
				};
				Update: {
					code?: number;
					created_at?: string;
					department_id?: string;
					id?: string;
					max_score?: number;
					min_score?: number;
					university_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "code_department_id_fkey";
						columns: ["department_id"];
						isOneToOne: false;
						referencedRelation: "departments";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "code_university_id_fkey";
						columns: ["university_id"];
						isOneToOne: false;
						referencedRelation: "universities";
						referencedColumns: ["id"];
					},
				];
			};
			course_assets: {
				Row: {
					block_id: string | null;
					course_id: string;
					created_at: string;
					id: string;
					kind: Database["public"]["Enums"]["course_asset_kind"];
					mime_type: string;
					original_filename: string;
					size_bytes: number | null;
					status: Database["public"]["Enums"]["course_asset_status"];
					storage_key: string;
					updated_at: string;
					uploaded_by: string;
				};
				Insert: {
					block_id?: string | null;
					course_id: string;
					created_at?: string;
					id?: string;
					kind: Database["public"]["Enums"]["course_asset_kind"];
					mime_type: string;
					original_filename: string;
					size_bytes?: number | null;
					status?: Database["public"]["Enums"]["course_asset_status"];
					storage_key: string;
					updated_at?: string;
					uploaded_by: string;
				};
				Update: {
					block_id?: string | null;
					course_id?: string;
					created_at?: string;
					id?: string;
					kind?: Database["public"]["Enums"]["course_asset_kind"];
					mime_type?: string;
					original_filename?: string;
					size_bytes?: number | null;
					status?: Database["public"]["Enums"]["course_asset_status"];
					storage_key?: string;
					updated_at?: string;
					uploaded_by?: string;
				};
				Relationships: [
					{
						foreignKeyName: "course_assets_block_id_fkey";
						columns: ["block_id"];
						isOneToOne: false;
						referencedRelation: "lesson_content_blocks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_assets_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "course_assets_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
				];
			};
			courses: {
				Row: {
					agency_id: string | null;
					average_rating: number | null;
					book_id: string | null;
					cover_image_url: string | null;
					created_at: string;
					currency: string | null;
					description: string | null;
					enrollment_limit: number;
					estimated_duration_hours: number | null;
					grade_id: string | null;
					id: string;
					instructor_id: string | null;
					is_free: boolean | null;
					is_published: boolean;
					language: Database["public"]["Enums"]["language_enum"];
					learning_objectives: string[] | null;
					level: Database["public"]["Enums"]["course_level"] | null;
					prerequisites: string[] | null;
					price: number | null;
					price_credits: number;
					promo_video_url: string | null;
					published_at: string | null;
					related_decks_ids: string[];
					related_libraries_ids: string[];
					related_quizzes_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					subject_id: string | null;
					subtitle: string | null;
					title: string;
					total_reviews: number;
					updated_at: string;
					visibility: Database["public"]["Enums"]["visibility"];
					welcome_message: string | null;
				};
				Insert: {
					agency_id?: string | null;
					average_rating?: number | null;
					book_id?: string | null;
					cover_image_url?: string | null;
					created_at?: string;
					currency?: string | null;
					description?: string | null;
					enrollment_limit?: number;
					estimated_duration_hours?: number | null;
					grade_id?: string | null;
					id?: string;
					instructor_id?: string | null;
					is_free?: boolean | null;
					is_published?: boolean;
					language?: Database["public"]["Enums"]["language_enum"];
					learning_objectives?: string[] | null;
					level?: Database["public"]["Enums"]["course_level"] | null;
					prerequisites?: string[] | null;
					price?: number | null;
					price_credits?: number;
					promo_video_url?: string | null;
					published_at?: string | null;
					related_decks_ids?: string[];
					related_libraries_ids?: string[];
					related_quizzes_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					subject_id?: string | null;
					subtitle?: string | null;
					title: string;
					total_reviews?: number;
					updated_at?: string;
					visibility?: Database["public"]["Enums"]["visibility"];
					welcome_message?: string | null;
				};
				Update: {
					agency_id?: string | null;
					average_rating?: number | null;
					book_id?: string | null;
					cover_image_url?: string | null;
					created_at?: string;
					currency?: string | null;
					description?: string | null;
					enrollment_limit?: number;
					estimated_duration_hours?: number | null;
					grade_id?: string | null;
					id?: string;
					instructor_id?: string | null;
					is_free?: boolean | null;
					is_published?: boolean;
					language?: Database["public"]["Enums"]["language_enum"];
					learning_objectives?: string[] | null;
					level?: Database["public"]["Enums"]["course_level"] | null;
					prerequisites?: string[] | null;
					price?: number | null;
					price_credits?: number;
					promo_video_url?: string | null;
					published_at?: string | null;
					related_decks_ids?: string[];
					related_libraries_ids?: string[];
					related_quizzes_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					subject_id?: string | null;
					subtitle?: string | null;
					title?: string;
					total_reviews?: number;
					updated_at?: string;
					visibility?: Database["public"]["Enums"]["visibility"];
					welcome_message?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "courses_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
				];
			};
			credit_transactions: {
				Row: {
					amount: number;
					balance_after: number;
					created_at: string;
					created_by: string | null;
					id: string;
					note: string | null;
					profile_id: string;
					reference_id: string | null;
					reference_type: string | null;
					type: Database["public"]["Enums"]["credit_transaction_type"];
				};
				Insert: {
					amount: number;
					balance_after: number;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					note?: string | null;
					profile_id: string;
					reference_id?: string | null;
					reference_type?: string | null;
					type: Database["public"]["Enums"]["credit_transaction_type"];
				};
				Update: {
					amount?: number;
					balance_after?: number;
					created_at?: string;
					created_by?: string | null;
					id?: string;
					note?: string | null;
					profile_id?: string;
					reference_id?: string | null;
					reference_type?: string | null;
					type?: Database["public"]["Enums"]["credit_transaction_type"];
				};
				Relationships: [
					{
						foreignKeyName: "credit_transactions_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "credit_transactions_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "credit_transactions_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "credit_transactions_profile_id_fkey";
						columns: ["profile_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "credit_transactions_profile_id_fkey";
						columns: ["profile_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "credit_transactions_profile_id_fkey";
						columns: ["profile_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			deck_cards: {
				Row: {
					created_at: string;
					deck_id: string;
					difficulty: number;
					ease_factor: number;
					elapsed_days: number;
					first_reviewed_at: string | null;
					flashcard_id: string | null;
					id: string;
					interval: number;
					last_reviewed_at: string | null;
					next_review_date: string;
					repetitions: number;
					scheduled_days: number;
					stability: number;
					status: Database["public"]["Enums"]["card_status"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					deck_id: string;
					difficulty?: number;
					ease_factor?: number;
					elapsed_days?: number;
					first_reviewed_at?: string | null;
					flashcard_id?: string | null;
					id?: string;
					interval?: number;
					last_reviewed_at?: string | null;
					next_review_date?: string;
					repetitions?: number;
					scheduled_days?: number;
					stability?: number;
					status?: Database["public"]["Enums"]["card_status"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					deck_id?: string;
					difficulty?: number;
					ease_factor?: number;
					elapsed_days?: number;
					first_reviewed_at?: string | null;
					flashcard_id?: string | null;
					id?: string;
					interval?: number;
					last_reviewed_at?: string | null;
					next_review_date?: string;
					repetitions?: number;
					scheduled_days?: number;
					stability?: number;
					status?: Database["public"]["Enums"]["card_status"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "deck_cards_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "admin_decks_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "deck_cards_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "decks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "deck_cards_flashcard_id_fkey";
						columns: ["flashcard_id"];
						isOneToOne: false;
						referencedRelation: "flashcards";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "deck_cards_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "deck_cards_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "deck_cards_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			decks: {
				Row: {
					agency_id: string | null;
					algorithm: Database["public"]["Enums"]["flashcard_algorithm"];
					average_rating: number | null;
					book_id: string | null;
					config: Json | null;
					created_at: string;
					creation: Database["public"]["Enums"]["creation_enum"];
					description: string | null;
					fsrs_maximum_interval: number;
					fsrs_request_retention: number;
					grade_id: string | null;
					id: string;
					is_free: boolean;
					name: string;
					price_credits: number;
					related_courses_ids: string[];
					related_libraries_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					sm2_easy_bonus: number;
					sm2_interval_modifier: number;
					sm2_starting_ease: number;
					subject_id: string | null;
					total_reviews: number;
					updated_at: string;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"];
				};
				Insert: {
					agency_id?: string | null;
					algorithm?: Database["public"]["Enums"]["flashcard_algorithm"];
					average_rating?: number | null;
					book_id?: string | null;
					config?: Json | null;
					created_at?: string;
					creation?: Database["public"]["Enums"]["creation_enum"];
					description?: string | null;
					fsrs_maximum_interval?: number;
					fsrs_request_retention?: number;
					grade_id?: string | null;
					id?: string;
					is_free?: boolean;
					name: string;
					price_credits?: number;
					related_courses_ids?: string[];
					related_libraries_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					sm2_easy_bonus?: number;
					sm2_interval_modifier?: number;
					sm2_starting_ease?: number;
					subject_id?: string | null;
					total_reviews?: number;
					updated_at?: string;
					user_id?: string | null;
					visibility?: Database["public"]["Enums"]["visibility"];
				};
				Update: {
					agency_id?: string | null;
					algorithm?: Database["public"]["Enums"]["flashcard_algorithm"];
					average_rating?: number | null;
					book_id?: string | null;
					config?: Json | null;
					created_at?: string;
					creation?: Database["public"]["Enums"]["creation_enum"];
					description?: string | null;
					fsrs_maximum_interval?: number;
					fsrs_request_retention?: number;
					grade_id?: string | null;
					id?: string;
					is_free?: boolean;
					name?: string;
					price_credits?: number;
					related_courses_ids?: string[];
					related_libraries_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					sm2_easy_bonus?: number;
					sm2_interval_modifier?: number;
					sm2_starting_ease?: number;
					subject_id?: string | null;
					total_reviews?: number;
					updated_at?: string;
					user_id?: string | null;
					visibility?: Database["public"]["Enums"]["visibility"];
				};
				Relationships: [
					{
						foreignKeyName: "decks_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			departments: {
				Row: {
					created_at: string;
					faculty_id: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					faculty_id: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					faculty_id?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "departments_faculty_id_fkey";
						columns: ["faculty_id"];
						isOneToOne: false;
						referencedRelation: "faculties";
						referencedColumns: ["id"];
					},
				];
			};
			discount_targets: {
				Row: {
					discount_id: string;
					id: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["purchase_item_type"];
				};
				Insert: {
					discount_id: string;
					id?: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["purchase_item_type"];
				};
				Update: {
					discount_id?: string;
					id?: string;
					item_id?: string;
					item_type?: Database["public"]["Enums"]["purchase_item_type"];
				};
				Relationships: [
					{
						foreignKeyName: "discount_targets_discount_id_fkey";
						columns: ["discount_id"];
						isOneToOne: false;
						referencedRelation: "discounts";
						referencedColumns: ["id"];
					},
				];
			};
			discounts: {
				Row: {
					code: string;
					created_at: string;
					ends_at: string | null;
					id: string;
					is_active: boolean;
					owner_profile_id: string | null;
					owner_school_id: string | null;
					owner_type: Database["public"]["Enums"]["seller_type"];
					scope: Database["public"]["Enums"]["discount_scope"];
					starts_at: string | null;
					type: Database["public"]["Enums"]["discount_type"];
					updated_at: string;
					value: number;
				};
				Insert: {
					code: string;
					created_at?: string;
					ends_at?: string | null;
					id?: string;
					is_active?: boolean;
					owner_profile_id?: string | null;
					owner_school_id?: string | null;
					owner_type: Database["public"]["Enums"]["seller_type"];
					scope: Database["public"]["Enums"]["discount_scope"];
					starts_at?: string | null;
					type: Database["public"]["Enums"]["discount_type"];
					updated_at?: string;
					value: number;
				};
				Update: {
					code?: string;
					created_at?: string;
					ends_at?: string | null;
					id?: string;
					is_active?: boolean;
					owner_profile_id?: string | null;
					owner_school_id?: string | null;
					owner_type?: Database["public"]["Enums"]["seller_type"];
					scope?: Database["public"]["Enums"]["discount_scope"];
					starts_at?: string | null;
					type?: Database["public"]["Enums"]["discount_type"];
					updated_at?: string;
					value?: number;
				};
				Relationships: [
					{
						foreignKeyName: "discounts_owner_profile_id_fkey";
						columns: ["owner_profile_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discounts_owner_profile_id_fkey";
						columns: ["owner_profile_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discounts_owner_profile_id_fkey";
						columns: ["owner_profile_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discounts_owner_school_id_fkey";
						columns: ["owner_school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discounts_owner_school_id_fkey";
						columns: ["owner_school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discounts_owner_school_id_fkey";
						columns: ["owner_school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_attachments: {
				Row: {
					created_at: string;
					file_name: string;
					file_path: string;
					file_size: number;
					file_type: string;
					id: string;
					metadata: Json;
					mime_type: string;
					post_id: string | null;
					thread_id: string;
					uploader_id: string;
				};
				Insert: {
					created_at?: string;
					file_name: string;
					file_path: string;
					file_size: number;
					file_type: string;
					id?: string;
					metadata?: Json;
					mime_type: string;
					post_id?: string | null;
					thread_id: string;
					uploader_id: string;
				};
				Update: {
					created_at?: string;
					file_name?: string;
					file_path?: string;
					file_size?: number;
					file_type?: string;
					id?: string;
					metadata?: Json;
					mime_type?: string;
					post_id?: string | null;
					thread_id?: string;
					uploader_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_attachments_post_id_fkey";
						columns: ["post_id"];
						isOneToOne: false;
						referencedRelation: "discussion_posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_attachments_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_attachments_uploader_id_fkey";
						columns: ["uploader_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_attachments_uploader_id_fkey";
						columns: ["uploader_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_attachments_uploader_id_fkey";
						columns: ["uploader_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_audit_logs: {
				Row: {
					action: string;
					actor_id: string;
					created_at: string;
					id: string;
					metadata: Json;
					target_id: string;
					target_type: string;
				};
				Insert: {
					action: string;
					actor_id: string;
					created_at?: string;
					id?: string;
					metadata?: Json;
					target_id: string;
					target_type: string;
				};
				Update: {
					action?: string;
					actor_id?: string;
					created_at?: string;
					id?: string;
					metadata?: Json;
					target_id?: string;
					target_type?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_audit_logs_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_audit_logs_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_audit_logs_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_bookmarks: {
				Row: {
					created_at: string;
					id: string;
					thread_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					thread_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					thread_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_bookmarks_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_mentions: {
				Row: {
					created_at: string;
					id: string;
					mentioned_by_user_id: string;
					mentioned_user_id: string;
					post_id: string | null;
					thread_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					mentioned_by_user_id: string;
					mentioned_user_id: string;
					post_id?: string | null;
					thread_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					mentioned_by_user_id?: string;
					mentioned_user_id?: string;
					post_id?: string | null;
					thread_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_mentions_mentioned_by_user_id_fkey";
						columns: ["mentioned_by_user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_mentioned_by_user_id_fkey";
						columns: ["mentioned_by_user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_mentioned_by_user_id_fkey";
						columns: ["mentioned_by_user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_mentioned_user_id_fkey";
						columns: ["mentioned_user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_mentioned_user_id_fkey";
						columns: ["mentioned_user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_mentioned_user_id_fkey";
						columns: ["mentioned_user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_post_id_fkey";
						columns: ["post_id"];
						isOneToOne: false;
						referencedRelation: "discussion_posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_mentions_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_posts: {
				Row: {
					content: string;
					created_at: string;
					deleted_at: string | null;
					deleted_by: string | null;
					fts: unknown;
					id: string;
					is_anonymous: boolean;
					is_solution: boolean | null;
					parent_post_id: string | null;
					thread_id: string | null;
					updated_at: string;
					user_id: string;
					vote_count: number;
				};
				Insert: {
					content: string;
					created_at?: string;
					deleted_at?: string | null;
					deleted_by?: string | null;
					fts?: unknown;
					id?: string;
					is_anonymous?: boolean;
					is_solution?: boolean | null;
					parent_post_id?: string | null;
					thread_id?: string | null;
					updated_at?: string;
					user_id: string;
					vote_count?: number;
				};
				Update: {
					content?: string;
					created_at?: string;
					deleted_at?: string | null;
					deleted_by?: string | null;
					fts?: unknown;
					id?: string;
					is_anonymous?: boolean;
					is_solution?: boolean | null;
					parent_post_id?: string | null;
					thread_id?: string | null;
					updated_at?: string;
					user_id?: string;
					vote_count?: number;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_posts_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_parent_post_id_fkey";
						columns: ["parent_post_id"];
						isOneToOne: false;
						referencedRelation: "discussion_posts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_posts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_reactions: {
				Row: {
					created_at: string;
					emoji: Database["public"]["Enums"]["discussion_reaction_emoji"];
					id: string;
					target_id: string;
					target_type: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					emoji: Database["public"]["Enums"]["discussion_reaction_emoji"];
					id?: string;
					target_id: string;
					target_type: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					emoji?: Database["public"]["Enums"]["discussion_reaction_emoji"];
					id?: string;
					target_id?: string;
					target_type?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_reactions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reactions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reactions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_reports: {
				Row: {
					created_at: string;
					details: string | null;
					id: string;
					reason: Database["public"]["Enums"]["discussion_report_reason"];
					reporter_id: string;
					reviewed_at: string | null;
					reviewed_by: string | null;
					status: Database["public"]["Enums"]["discussion_report_status"];
					target_id: string;
					target_type: string;
				};
				Insert: {
					created_at?: string;
					details?: string | null;
					id?: string;
					reason: Database["public"]["Enums"]["discussion_report_reason"];
					reporter_id: string;
					reviewed_at?: string | null;
					reviewed_by?: string | null;
					status?: Database["public"]["Enums"]["discussion_report_status"];
					target_id: string;
					target_type: string;
				};
				Update: {
					created_at?: string;
					details?: string | null;
					id?: string;
					reason?: Database["public"]["Enums"]["discussion_report_reason"];
					reporter_id?: string;
					reviewed_at?: string | null;
					reviewed_by?: string | null;
					status?: Database["public"]["Enums"]["discussion_report_status"];
					target_id?: string;
					target_type?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_reports_reporter_id_fkey";
						columns: ["reporter_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reports_reporter_id_fkey";
						columns: ["reporter_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reports_reporter_id_fkey";
						columns: ["reporter_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reports_reviewed_by_fkey";
						columns: ["reviewed_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reports_reviewed_by_fkey";
						columns: ["reviewed_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_reports_reviewed_by_fkey";
						columns: ["reviewed_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_subscriptions: {
				Row: {
					created_at: string;
					id: string;
					is_muted: boolean;
					thread_id: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					is_muted?: boolean;
					thread_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					is_muted?: boolean;
					thread_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_subscriptions_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_subscriptions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_subscriptions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_subscriptions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_tags: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					slug: string;
					updated_at: string;
					usage_count: number;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					slug: string;
					updated_at?: string;
					usage_count?: number;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					slug?: string;
					updated_at?: string;
					usage_count?: number;
				};
				Relationships: [];
			};
			discussion_thread_tags: {
				Row: {
					tag_id: string;
					thread_id: string;
				};
				Insert: {
					tag_id: string;
					thread_id: string;
				};
				Update: {
					tag_id?: string;
					thread_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_thread_tags_tag_id_fkey";
						columns: ["tag_id"];
						isOneToOne: false;
						referencedRelation: "discussion_tags";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_thread_tags_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_thread_views: {
				Row: {
					client_hash: string;
					id: string;
					thread_id: string;
					user_id: string | null;
					viewed_at: string;
				};
				Insert: {
					client_hash: string;
					id?: string;
					thread_id: string;
					user_id?: string | null;
					viewed_at?: string;
				};
				Update: {
					client_hash?: string;
					id?: string;
					thread_id?: string;
					user_id?: string | null;
					viewed_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_thread_views_thread_id_fkey";
						columns: ["thread_id"];
						isOneToOne: false;
						referencedRelation: "discussion_threads";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_thread_views_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_thread_views_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_thread_views_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_threads: {
				Row: {
					bookmark_count: number;
					content: string;
					course_id: string | null;
					created_at: string;
					deleted_at: string | null;
					deleted_by: string | null;
					fts: unknown;
					id: string;
					is_anonymous: boolean;
					is_archived: boolean;
					is_closed: boolean | null;
					is_featured: boolean;
					is_instructor_only: boolean;
					is_locked: boolean;
					is_pinned: boolean | null;
					last_activity_at: string;
					lesson_id: string | null;
					reply_count: number;
					resource_id: string;
					resource_type: Database["public"]["Enums"]["discussion_resource_type"];
					status: Database["public"]["Enums"]["discussion_thread_status"];
					subscriber_count: number;
					tags: string[] | null;
					title: string;
					type: Database["public"]["Enums"]["discussion_thread_type"];
					updated_at: string;
					user_id: string;
					views_count: number;
					vote_count: number;
				};
				Insert: {
					bookmark_count?: number;
					content: string;
					course_id?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					deleted_by?: string | null;
					fts?: unknown;
					id?: string;
					is_anonymous?: boolean;
					is_archived?: boolean;
					is_closed?: boolean | null;
					is_featured?: boolean;
					is_instructor_only?: boolean;
					is_locked?: boolean;
					is_pinned?: boolean | null;
					last_activity_at?: string;
					lesson_id?: string | null;
					reply_count?: number;
					resource_id?: string;
					resource_type?: Database["public"]["Enums"]["discussion_resource_type"];
					status?: Database["public"]["Enums"]["discussion_thread_status"];
					subscriber_count?: number;
					tags?: string[] | null;
					title: string;
					type?: Database["public"]["Enums"]["discussion_thread_type"];
					updated_at?: string;
					user_id: string;
					views_count?: number;
					vote_count?: number;
				};
				Update: {
					bookmark_count?: number;
					content?: string;
					course_id?: string | null;
					created_at?: string;
					deleted_at?: string | null;
					deleted_by?: string | null;
					fts?: unknown;
					id?: string;
					is_anonymous?: boolean;
					is_archived?: boolean;
					is_closed?: boolean | null;
					is_featured?: boolean;
					is_instructor_only?: boolean;
					is_locked?: boolean;
					is_pinned?: boolean | null;
					last_activity_at?: string;
					lesson_id?: string | null;
					reply_count?: number;
					resource_id?: string;
					resource_type?: Database["public"]["Enums"]["discussion_resource_type"];
					status?: Database["public"]["Enums"]["discussion_thread_status"];
					subscriber_count?: number;
					tags?: string[] | null;
					title?: string;
					type?: Database["public"]["Enums"]["discussion_thread_type"];
					updated_at?: string;
					user_id?: string;
					views_count?: number;
					vote_count?: number;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_threads_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_deleted_by_fkey";
						columns: ["deleted_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_threads_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			discussion_votes: {
				Row: {
					created_at: string;
					id: string;
					target_id: string;
					target_type: string;
					updated_at: string;
					user_id: string;
					vote: number;
				};
				Insert: {
					created_at?: string;
					id?: string;
					target_id: string;
					target_type: string;
					updated_at?: string;
					user_id: string;
					vote: number;
				};
				Update: {
					created_at?: string;
					id?: string;
					target_id?: string;
					target_type?: string;
					updated_at?: string;
					user_id?: string;
					vote?: number;
				};
				Relationships: [
					{
						foreignKeyName: "discussion_votes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_votes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "discussion_votes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			enrollments: {
				Row: {
					certificate_id: string | null;
					completed_at: string | null;
					course_id: string | null;
					created_at: string;
					deck_id: string | null;
					enrolled_at: string | null;
					flashcard_daily_limit: number | null;
					id: string;
					last_accessed_lesson_id: string | null;
					progress_percentage: number | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					certificate_id?: string | null;
					completed_at?: string | null;
					course_id?: string | null;
					created_at?: string;
					deck_id?: string | null;
					enrolled_at?: string | null;
					flashcard_daily_limit?: number | null;
					id?: string;
					last_accessed_lesson_id?: string | null;
					progress_percentage?: number | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					certificate_id?: string | null;
					completed_at?: string | null;
					course_id?: string | null;
					created_at?: string;
					deck_id?: string | null;
					enrolled_at?: string | null;
					flashcard_daily_limit?: number | null;
					id?: string;
					last_accessed_lesson_id?: string | null;
					progress_percentage?: number | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "enrollments_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "admin_decks_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "decks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_last_accessed_lesson_id_fkey";
						columns: ["last_accessed_lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "enrollments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "fk_enrollments_certificate_id";
						columns: ["certificate_id"];
						isOneToOne: false;
						referencedRelation: "certificates";
						referencedColumns: ["id"];
					},
				];
			};
			faculties: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			fcm_tokens: {
				Row: {
					created_at: string;
					id: string;
					last_seen_at: string;
					token: string;
					user_agent: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					last_seen_at?: string;
					token: string;
					user_agent?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					last_seen_at?: string;
					token?: string;
					user_agent?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "fcm_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "fcm_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "fcm_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			flashcards: {
				Row: {
					answers: Json[];
					book_id: string | null;
					created_at: string;
					creation: Database["public"]["Enums"]["creation_enum"];
					deck_id: string | null;
					fact: string | null;
					grade_id: string | null;
					hint: string | null;
					id: string;
					img_path: string | null;
					page: number;
					question: string;
					updated_at: string;
					user_id: string | null;
					vid_path: string | null;
				};
				Insert: {
					answers: Json[];
					book_id?: string | null;
					created_at?: string;
					creation?: Database["public"]["Enums"]["creation_enum"];
					deck_id?: string | null;
					fact?: string | null;
					grade_id?: string | null;
					hint?: string | null;
					id?: string;
					img_path?: string | null;
					page?: number;
					question: string;
					updated_at?: string;
					user_id?: string | null;
					vid_path?: string | null;
				};
				Update: {
					answers?: Json[];
					book_id?: string | null;
					created_at?: string;
					creation?: Database["public"]["Enums"]["creation_enum"];
					deck_id?: string | null;
					fact?: string | null;
					grade_id?: string | null;
					hint?: string | null;
					id?: string;
					img_path?: string | null;
					page?: number;
					question?: string;
					updated_at?: string;
					user_id?: string | null;
					vid_path?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "flashcard_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcard_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcard_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcards_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcards_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "admin_decks_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcards_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "decks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "flashcards_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
				];
			};
			forms: {
				Row: {
					category_id: string | null;
					created_at: string;
					file_path: string;
					id: string;
					province_id: string | null;
					round: number;
					title: string;
					updated_at: string;
					year: number;
				};
				Insert: {
					category_id?: string | null;
					created_at?: string;
					file_path: string;
					id?: string;
					province_id?: string | null;
					round?: number;
					title: string;
					updated_at?: string;
					year: number;
				};
				Update: {
					category_id?: string | null;
					created_at?: string;
					file_path?: string;
					id?: string;
					province_id?: string | null;
					round?: number;
					title?: string;
					updated_at?: string;
					year?: number;
				};
				Relationships: [
					{
						foreignKeyName: "forms_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "forms_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
				];
			};
			grades: {
				Row: {
					category_id: string | null;
					created_at: string;
					id: string;
					name: string;
					ordering: number;
					updated_at: string;
				};
				Insert: {
					category_id?: string | null;
					created_at?: string;
					id?: string;
					name: string;
					ordering: number;
					updated_at?: string;
				};
				Update: {
					category_id?: string | null;
					created_at?: string;
					id?: string;
					name?: string;
					ordering?: number;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "grades_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
				];
			};
			leitners: {
				Row: {
					book_id: string | null;
					boxes: number;
					created_at: string;
					daily_limit: number;
					day: number;
					deck_id: string | null;
					id: string;
					last_learn_on: string;
					name: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					book_id?: string | null;
					boxes?: number;
					created_at?: string;
					daily_limit?: number;
					day?: number;
					deck_id?: string | null;
					id?: string;
					last_learn_on?: string;
					name: string;
					updated_at?: string;
					user_id?: string;
				};
				Update: {
					book_id?: string | null;
					boxes?: number;
					created_at?: string;
					daily_limit?: number;
					day?: number;
					deck_id?: string | null;
					id?: string;
					last_learn_on?: string;
					name?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "leitners_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "leitners_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "admin_decks_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "leitners_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "decks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "leitners_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "leitners_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "leitners_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			lesson_content_blocks: {
				Row: {
					audio_storage_key: string | null;
					audio_transcript: string | null;
					audio_url: string | null;
					block_type: Database["public"]["Enums"]["lesson_content_type"];
					code_language: string | null;
					course_id: string | null;
					created_at: string;
					default_code: string | null;
					document_storage_key: string | null;
					document_url: string | null;
					external_resource_title: string | null;
					external_resource_url: string | null;
					id: string;
					image_url: string | null;
					lesson_id: string | null;
					order_index: number;
					playlist: string | null;
					slug: string | null;
					solution_code: string | null;
					text_content: string | null;
					updated_at: string;
					video_provider: string | null;
					video_storage_key: string | null;
					video_transcript: string | null;
					video_url: string | null;
				};
				Insert: {
					audio_storage_key?: string | null;
					audio_transcript?: string | null;
					audio_url?: string | null;
					block_type: Database["public"]["Enums"]["lesson_content_type"];
					code_language?: string | null;
					course_id?: string | null;
					created_at?: string;
					default_code?: string | null;
					document_storage_key?: string | null;
					document_url?: string | null;
					external_resource_title?: string | null;
					external_resource_url?: string | null;
					id?: string;
					image_url?: string | null;
					lesson_id?: string | null;
					order_index?: number;
					playlist?: string | null;
					slug?: string | null;
					solution_code?: string | null;
					text_content?: string | null;
					updated_at?: string;
					video_provider?: string | null;
					video_storage_key?: string | null;
					video_transcript?: string | null;
					video_url?: string | null;
				};
				Update: {
					audio_storage_key?: string | null;
					audio_transcript?: string | null;
					audio_url?: string | null;
					block_type?: Database["public"]["Enums"]["lesson_content_type"];
					code_language?: string | null;
					course_id?: string | null;
					created_at?: string;
					default_code?: string | null;
					document_storage_key?: string | null;
					document_url?: string | null;
					external_resource_title?: string | null;
					external_resource_url?: string | null;
					id?: string;
					image_url?: string | null;
					lesson_id?: string | null;
					order_index?: number;
					playlist?: string | null;
					slug?: string | null;
					solution_code?: string | null;
					text_content?: string | null;
					updated_at?: string;
					video_provider?: string | null;
					video_storage_key?: string | null;
					video_transcript?: string | null;
					video_url?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "lesson_content_blocks_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_content_blocks_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_content_blocks_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
				];
			};
			lesson_progress: {
				Row: {
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					id: string;
					is_completed: boolean | null;
					last_accessed_at: string | null;
					lesson_id: string | null;
					updated_at: string;
					user_id: string | null;
					video_progress_seconds: number | null;
				};
				Insert: {
					completed_at?: string | null;
					created_at?: string;
					enrollment_id?: string | null;
					id?: string;
					is_completed?: boolean | null;
					last_accessed_at?: string | null;
					lesson_id?: string | null;
					updated_at?: string;
					user_id?: string | null;
					video_progress_seconds?: number | null;
				};
				Update: {
					completed_at?: string | null;
					created_at?: string;
					enrollment_id?: string | null;
					id?: string;
					is_completed?: boolean | null;
					last_accessed_at?: string | null;
					lesson_id?: string | null;
					updated_at?: string;
					user_id?: string | null;
					video_progress_seconds?: number | null;
				};
				Relationships: [
					{
						foreignKeyName: "lesson_progress_enrollment_id_fkey";
						columns: ["enrollment_id"];
						isOneToOne: false;
						referencedRelation: "enrollments";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_progress_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_progress_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_progress_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lesson_progress_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			lessons: {
				Row: {
					book_id: string | null;
					content_type: Database["public"]["Enums"]["lesson_content_type"];
					course_id: string | null;
					created_at: string;
					description: string | null;
					estimated_duration_minutes: number | null;
					id: string;
					is_mandatory: boolean | null;
					is_previewable: boolean | null;
					module_id: string | null;
					order_index: number;
					slug: string | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					book_id?: string | null;
					content_type?: Database["public"]["Enums"]["lesson_content_type"];
					course_id?: string | null;
					created_at?: string;
					description?: string | null;
					estimated_duration_minutes?: number | null;
					id?: string;
					is_mandatory?: boolean | null;
					is_previewable?: boolean | null;
					module_id?: string | null;
					order_index?: number;
					slug?: string | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					book_id?: string | null;
					content_type?: Database["public"]["Enums"]["lesson_content_type"];
					course_id?: string | null;
					created_at?: string;
					description?: string | null;
					estimated_duration_minutes?: number | null;
					id?: string;
					is_mandatory?: boolean | null;
					is_previewable?: boolean | null;
					module_id?: string | null;
					order_index?: number;
					slug?: string | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "lessons_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lessons_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lessons_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lessons_module_id_fkey";
						columns: ["module_id"];
						isOneToOne: false;
						referencedRelation: "modules";
						referencedColumns: ["id"];
					},
				];
			};
			libraries: {
				Row: {
					book_id: string | null;
					category_id: string | null;
					created_at: string;
					desc: string | null;
					file_path: string;
					grade_id: string | null;
					id: string;
					related_courses_ids: string[];
					related_decks_ids: string[];
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					subject_id: string | null;
					title: string;
					updated_at: string;
					uri: string;
				};
				Insert: {
					book_id?: string | null;
					category_id?: string | null;
					created_at?: string;
					desc?: string | null;
					file_path: string;
					grade_id?: string | null;
					id?: string;
					related_courses_ids?: string[];
					related_decks_ids?: string[];
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					subject_id?: string | null;
					title: string;
					updated_at?: string;
					uri: string;
				};
				Update: {
					book_id?: string | null;
					category_id?: string | null;
					created_at?: string;
					desc?: string | null;
					file_path?: string;
					grade_id?: string | null;
					id?: string;
					related_courses_ids?: string[];
					related_decks_ids?: string[];
					seo_description?: string | null;
					seo_title?: string | null;
					slug?: string | null;
					subject_id?: string | null;
					title?: string;
					updated_at?: string;
					uri?: string;
				};
				Relationships: [
					{
						foreignKeyName: "libraries_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "libraries_category_id_fkey";
						columns: ["category_id"];
						isOneToOne: false;
						referencedRelation: "categories";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "libraries_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "libraries_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
				];
			};
			modules: {
				Row: {
					book_id: string | null;
					course_id: string | null;
					created_at: string;
					description: string | null;
					end_page: number | null;
					id: string;
					order_index: number;
					start_page: number | null;
					title: string;
					updated_at: string;
				};
				Insert: {
					book_id?: string | null;
					course_id?: string | null;
					created_at?: string;
					description?: string | null;
					end_page?: number | null;
					id?: string;
					order_index?: number;
					start_page?: number | null;
					title: string;
					updated_at?: string;
				};
				Update: {
					book_id?: string | null;
					course_id?: string | null;
					created_at?: string;
					description?: string | null;
					end_page?: number | null;
					id?: string;
					order_index?: number;
					start_page?: number | null;
					title?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "modules_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "modules_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "modules_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
				];
			};
			notes: {
				Row: {
					content: string;
					created_at: string;
					id: string;
					title: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					content: string;
					created_at?: string;
					id?: string;
					title?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					content?: string;
					created_at?: string;
					id?: string;
					title?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "notes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			notifications: {
				Row: {
					actor_id: string | null;
					created_at: string;
					id: string;
					is_read: boolean | null;
					message: string | null;
					push_delivered_at: string | null;
					read_at: string | null;
					related_entity_id: string | null;
					related_entity_type: string | null;
					telegram_delivered_at: string | null;
					title: string;
					type: Database["public"]["Enums"]["notification_type"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					actor_id?: string | null;
					created_at?: string;
					id?: string;
					is_read?: boolean | null;
					message?: string | null;
					push_delivered_at?: string | null;
					read_at?: string | null;
					related_entity_id?: string | null;
					related_entity_type?: string | null;
					telegram_delivered_at?: string | null;
					title: string;
					type: Database["public"]["Enums"]["notification_type"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					actor_id?: string | null;
					created_at?: string;
					id?: string;
					is_read?: boolean | null;
					message?: string | null;
					push_delivered_at?: string | null;
					read_at?: string | null;
					related_entity_id?: string | null;
					related_entity_type?: string | null;
					telegram_delivered_at?: string | null;
					title?: string;
					type?: Database["public"]["Enums"]["notification_type"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "notifications_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_actor_id_fkey";
						columns: ["actor_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "notifications_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			omr_scan_responses: {
				Row: {
					confidence: number | null;
					created_at: string;
					detected_option_index: number | null;
					id: string;
					is_correct: boolean | null;
					question_id: string;
					scan_id: string;
					updated_at: string;
				};
				Insert: {
					confidence?: number | null;
					created_at?: string;
					detected_option_index?: number | null;
					id?: string;
					is_correct?: boolean | null;
					question_id: string;
					scan_id: string;
					updated_at?: string;
				};
				Update: {
					confidence?: number | null;
					created_at?: string;
					detected_option_index?: number | null;
					id?: string;
					is_correct?: boolean | null;
					question_id?: string;
					scan_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "omr_scan_responses_question_id_fkey";
						columns: ["question_id"];
						isOneToOne: false;
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "omr_scan_responses_scan_id_fkey";
						columns: ["scan_id"];
						isOneToOne: false;
						referencedRelation: "omr_scans";
						referencedColumns: ["id"];
					},
				];
			};
			omr_scans: {
				Row: {
					created_at: string;
					error_message: string | null;
					id: string;
					image_storage_path: string;
					raw_omr_result: Json | null;
					score_pct: number | null;
					scored_at: string | null;
					status: Database["public"]["Enums"]["omr_scan_status"];
					total_correct: number | null;
					total_questions: number | null;
					updated_at: string;
					uploaded_at: string;
					uploaded_by: string;
					variant_id: string;
				};
				Insert: {
					created_at?: string;
					error_message?: string | null;
					id?: string;
					image_storage_path: string;
					raw_omr_result?: Json | null;
					score_pct?: number | null;
					scored_at?: string | null;
					status?: Database["public"]["Enums"]["omr_scan_status"];
					total_correct?: number | null;
					total_questions?: number | null;
					updated_at?: string;
					uploaded_at?: string;
					uploaded_by: string;
					variant_id: string;
				};
				Update: {
					created_at?: string;
					error_message?: string | null;
					id?: string;
					image_storage_path?: string;
					raw_omr_result?: Json | null;
					score_pct?: number | null;
					scored_at?: string | null;
					status?: Database["public"]["Enums"]["omr_scan_status"];
					total_correct?: number | null;
					total_questions?: number | null;
					updated_at?: string;
					uploaded_at?: string;
					uploaded_by?: string;
					variant_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "omr_scans_uploaded_by_fkey";
						columns: ["uploaded_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "omr_scans_uploaded_by_fkey";
						columns: ["uploaded_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "omr_scans_uploaded_by_fkey";
						columns: ["uploaded_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "omr_scans_variant_id_fkey";
						columns: ["variant_id"];
						isOneToOne: false;
						referencedRelation: "quiz_variants";
						referencedColumns: ["id"];
					},
				];
			};
			payments: {
				Row: {
					amount: number;
					course_id: string | null;
					created_at: string;
					currency: string;
					enrollment_id: string | null;
					error_message: string | null;
					id: string;
					payment_method_details: Json | null;
					payment_provider: string | null;
					provider_transaction_id: string | null;
					status: Database["public"]["Enums"]["payment_status"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					amount: number;
					course_id?: string | null;
					created_at?: string;
					currency?: string;
					enrollment_id?: string | null;
					error_message?: string | null;
					id?: string;
					payment_method_details?: Json | null;
					payment_provider?: string | null;
					provider_transaction_id?: string | null;
					status?: Database["public"]["Enums"]["payment_status"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					amount?: number;
					course_id?: string | null;
					created_at?: string;
					currency?: string;
					enrollment_id?: string | null;
					error_message?: string | null;
					id?: string;
					payment_method_details?: Json | null;
					payment_provider?: string | null;
					provider_transaction_id?: string | null;
					status?: Database["public"]["Enums"]["payment_status"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "payments_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payments_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payments_enrollment_id_fkey";
						columns: ["enrollment_id"];
						isOneToOne: false;
						referencedRelation: "enrollments";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "payments_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			profiles: {
				Row: {
					active_school_id: string | null;
					avatar_url: string | null;
					bio: string | null;
					created_at: string;
					credit_balance: number;
					email: string | null;
					full_name: string | null;
					id: string;
					instructor_status:
						| Database["public"]["Enums"]["account_status"]
						| null;
					instructor_suspended_by_agency_id: string | null;
					instructor_suspension_reason: string | null;
					locale: Database["public"]["Enums"]["language_enum"];
					phone: string | null;
					province_id: string | null;
					role: Database["public"]["Enums"]["user_role"];
					school_id: string | null;
					slug: string | null;
					student_status: Database["public"]["Enums"]["account_status"];
					telegram_chat_id: number | null;
					telegram_linked_at: string | null;
					updated_at: string;
					website_url: string | null;
				};
				Insert: {
					active_school_id?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					credit_balance?: number;
					email?: string | null;
					full_name?: string | null;
					id?: string;
					instructor_status?:
						| Database["public"]["Enums"]["account_status"]
						| null;
					instructor_suspended_by_agency_id?: string | null;
					instructor_suspension_reason?: string | null;
					locale?: Database["public"]["Enums"]["language_enum"];
					phone?: string | null;
					province_id?: string | null;
					role?: Database["public"]["Enums"]["user_role"];
					school_id?: string | null;
					slug?: string | null;
					student_status?: Database["public"]["Enums"]["account_status"];
					telegram_chat_id?: number | null;
					telegram_linked_at?: string | null;
					updated_at?: string;
					website_url?: string | null;
				};
				Update: {
					active_school_id?: string | null;
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					credit_balance?: number;
					email?: string | null;
					full_name?: string | null;
					id?: string;
					instructor_status?:
						| Database["public"]["Enums"]["account_status"]
						| null;
					instructor_suspended_by_agency_id?: string | null;
					instructor_suspension_reason?: string | null;
					locale?: Database["public"]["Enums"]["language_enum"];
					phone?: string | null;
					province_id?: string | null;
					role?: Database["public"]["Enums"]["user_role"];
					school_id?: string | null;
					slug?: string | null;
					student_status?: Database["public"]["Enums"]["account_status"];
					telegram_chat_id?: number | null;
					telegram_linked_at?: string | null;
					updated_at?: string;
					website_url?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "profiles_active_school_id_fkey";
						columns: ["active_school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_active_school_id_fkey";
						columns: ["active_school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_active_school_id_fkey";
						columns: ["active_school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_instructor_suspended_by_agency_id_fkey";
						columns: ["instructor_suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_instructor_suspended_by_agency_id_fkey";
						columns: ["instructor_suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
				];
			};
			provinces: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			purchases: {
				Row: {
					buyer_id: string;
					created_at: string;
					credit_transaction_id: string | null;
					discount_id: string | null;
					id: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["purchase_item_type"];
					original_price_credits: number | null;
					price_credits: number;
					seller_agency_id: string | null;
					seller_profile_id: string | null;
					seller_school_id: string | null;
					seller_type: Database["public"]["Enums"]["seller_type"];
				};
				Insert: {
					buyer_id: string;
					created_at?: string;
					credit_transaction_id?: string | null;
					discount_id?: string | null;
					id?: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["purchase_item_type"];
					original_price_credits?: number | null;
					price_credits: number;
					seller_agency_id?: string | null;
					seller_profile_id?: string | null;
					seller_school_id?: string | null;
					seller_type: Database["public"]["Enums"]["seller_type"];
				};
				Update: {
					buyer_id?: string;
					created_at?: string;
					credit_transaction_id?: string | null;
					discount_id?: string | null;
					id?: string;
					item_id?: string;
					item_type?: Database["public"]["Enums"]["purchase_item_type"];
					original_price_credits?: number | null;
					price_credits?: number;
					seller_agency_id?: string | null;
					seller_profile_id?: string | null;
					seller_school_id?: string | null;
					seller_type?: Database["public"]["Enums"]["seller_type"];
				};
				Relationships: [
					{
						foreignKeyName: "purchases_buyer_id_fkey";
						columns: ["buyer_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_buyer_id_fkey";
						columns: ["buyer_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_buyer_id_fkey";
						columns: ["buyer_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_credit_transaction_id_fkey";
						columns: ["credit_transaction_id"];
						isOneToOne: false;
						referencedRelation: "credit_transactions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_discount_id_fkey";
						columns: ["discount_id"];
						isOneToOne: false;
						referencedRelation: "discounts";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_agency_id_fkey";
						columns: ["seller_agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_agency_id_fkey";
						columns: ["seller_agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_profile_id_fkey";
						columns: ["seller_profile_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_profile_id_fkey";
						columns: ["seller_profile_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_profile_id_fkey";
						columns: ["seller_profile_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_school_id_fkey";
						columns: ["seller_school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_school_id_fkey";
						columns: ["seller_school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "purchases_seller_school_id_fkey";
						columns: ["seller_school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
				];
			};
			question_options: {
				Row: {
					created_at: string;
					feedback: string | null;
					id: string;
					is_correct: boolean | null;
					match_target_text: string | null;
					option_text: string | null;
					order_index: number | null;
					question_id: string | null;
					quiz_id: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					feedback?: string | null;
					id?: string;
					is_correct?: boolean | null;
					match_target_text?: string | null;
					option_text?: string | null;
					order_index?: number | null;
					question_id?: string | null;
					quiz_id?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					feedback?: string | null;
					id?: string;
					is_correct?: boolean | null;
					match_target_text?: string | null;
					option_text?: string | null;
					order_index?: number | null;
					question_id?: string | null;
					quiz_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "question_options_question_id_fkey";
						columns: ["question_id"];
						isOneToOne: false;
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "question_options_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "admin_quizzes_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "question_options_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "quizzes";
						referencedColumns: ["id"];
					},
				];
			};
			questions: {
				Row: {
					created_at: string;
					explanation: string | null;
					hint: string | null;
					id: string;
					image_content_block_id: string | null;
					order_index: number;
					points: number | null;
					question_text: string;
					question_type: Database["public"]["Enums"]["question_type"];
					quiz_id: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					explanation?: string | null;
					hint?: string | null;
					id?: string;
					image_content_block_id?: string | null;
					order_index?: number;
					points?: number | null;
					question_text: string;
					question_type: Database["public"]["Enums"]["question_type"];
					quiz_id?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					explanation?: string | null;
					hint?: string | null;
					id?: string;
					image_content_block_id?: string | null;
					order_index?: number;
					points?: number | null;
					question_text?: string;
					question_type?: Database["public"]["Enums"]["question_type"];
					quiz_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "questions_image_content_block_id_fkey";
						columns: ["image_content_block_id"];
						isOneToOne: false;
						referencedRelation: "lesson_content_blocks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "questions_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "admin_quizzes_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "questions_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "quizzes";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_attempts: {
				Row: {
					attempt_number: number;
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					feedback_from_instructor: string | null;
					id: string;
					max_score_possible: number | null;
					passed: boolean | null;
					quiz_id: string | null;
					score: number | null;
					started_at: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					attempt_number: number;
					completed_at?: string | null;
					created_at?: string;
					enrollment_id?: string | null;
					feedback_from_instructor?: string | null;
					id?: string;
					max_score_possible?: number | null;
					passed?: boolean | null;
					quiz_id?: string | null;
					score?: number | null;
					started_at?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					attempt_number?: number;
					completed_at?: string | null;
					created_at?: string;
					enrollment_id?: string | null;
					feedback_from_instructor?: string | null;
					id?: string;
					max_score_possible?: number | null;
					passed?: boolean | null;
					quiz_id?: string | null;
					score?: number | null;
					started_at?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_attempts_enrollment_id_fkey";
						columns: ["enrollment_id"];
						isOneToOne: false;
						referencedRelation: "enrollments";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_attempts_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "admin_quizzes_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_attempts_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_attempts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_attempts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_attempts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_registrations: {
				Row: {
					created_at: string;
					id: string;
					quiz_id: string;
					registered_by: string | null;
					source: Database["public"]["Enums"]["quiz_registration_source"];
					student_id: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					quiz_id: string;
					registered_by?: string | null;
					source?: Database["public"]["Enums"]["quiz_registration_source"];
					student_id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					quiz_id?: string;
					registered_by?: string | null;
					source?: Database["public"]["Enums"]["quiz_registration_source"];
					student_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_registrations_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "admin_quizzes_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_registered_by_fkey";
						columns: ["registered_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_registered_by_fkey";
						columns: ["registered_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_registered_by_fkey";
						columns: ["registered_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_registrations_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			quiz_variants: {
				Row: {
					created_at: string;
					id: string;
					question_order: string[];
					quiz_id: string;
					shuffled: boolean;
					student_id: string;
					template_version: number;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					question_order: string[];
					quiz_id: string;
					shuffled?: boolean;
					student_id: string;
					template_version: number;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					question_order?: string[];
					quiz_id?: string;
					shuffled?: boolean;
					student_id?: string;
					template_version?: number;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "quiz_variants_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "admin_quizzes_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_variants_quiz_id_fkey";
						columns: ["quiz_id"];
						isOneToOne: false;
						referencedRelation: "quizzes";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_variants_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_variants_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quiz_variants_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			quizzes: {
				Row: {
					agency_id: string | null;
					book_id: string | null;
					created_at: string;
					description: string | null;
					entrance_code: string;
					grade_id: string | null;
					id: string;
					instructions: string | null;
					is_free: boolean;
					lesson_id: string | null;
					locked_at: string | null;
					max_attempts: number | null;
					passing_score_percentage: number | null;
					price_credits: number;
					print_version: number;
					registration_deadline: string | null;
					related_courses_ids: string[];
					related_decks_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					show_correct_answers_after:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions: boolean | null;
					slug: string | null;
					subject_id: string | null;
					time_limit_minutes: number | null;
					title: string;
					updated_at: string;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"];
				};
				Insert: {
					agency_id?: string | null;
					book_id?: string | null;
					created_at?: string;
					description?: string | null;
					entrance_code?: string;
					grade_id?: string | null;
					id?: string;
					instructions?: string | null;
					is_free?: boolean;
					lesson_id?: string | null;
					locked_at?: string | null;
					max_attempts?: number | null;
					passing_score_percentage?: number | null;
					price_credits?: number;
					print_version?: number;
					registration_deadline?: string | null;
					related_courses_ids?: string[];
					related_decks_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					show_correct_answers_after?:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions?: boolean | null;
					slug?: string | null;
					subject_id?: string | null;
					time_limit_minutes?: number | null;
					title: string;
					updated_at?: string;
					user_id?: string | null;
					visibility?: Database["public"]["Enums"]["visibility"];
				};
				Update: {
					agency_id?: string | null;
					book_id?: string | null;
					created_at?: string;
					description?: string | null;
					entrance_code?: string;
					grade_id?: string | null;
					id?: string;
					instructions?: string | null;
					is_free?: boolean;
					lesson_id?: string | null;
					locked_at?: string | null;
					max_attempts?: number | null;
					passing_score_percentage?: number | null;
					price_credits?: number;
					print_version?: number;
					registration_deadline?: string | null;
					related_courses_ids?: string[];
					related_decks_ids?: string[];
					school_id?: string | null;
					seo_description?: string | null;
					seo_title?: string | null;
					show_correct_answers_after?:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions?: boolean | null;
					slug?: string | null;
					subject_id?: string | null;
					time_limit_minutes?: number | null;
					title?: string;
					updated_at?: string;
					user_id?: string | null;
					visibility?: Database["public"]["Enums"]["visibility"];
				};
				Relationships: [
					{
						foreignKeyName: "quizzes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			reviews: {
				Row: {
					comment: string | null;
					course_id: string | null;
					created_at: string;
					deck_id: string | null;
					id: string;
					rating: number;
					title: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					comment?: string | null;
					course_id?: string | null;
					created_at?: string;
					deck_id?: string | null;
					id?: string;
					rating: number;
					title?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					comment?: string | null;
					course_id?: string | null;
					created_at?: string;
					deck_id?: string | null;
					id?: string;
					rating?: number;
					title?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "reviews_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "admin_decks_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_deck_id_fkey";
						columns: ["deck_id"];
						isOneToOne: false;
						referencedRelation: "decks";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "reviews_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			school_member_invites: {
				Row: {
					created_at: string;
					id: string;
					invited_by: string | null;
					responded_at: string | null;
					role: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					status: Database["public"]["Enums"]["school_invite_status"];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					invited_by?: string | null;
					responded_at?: string | null;
					role?: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					status?: Database["public"]["Enums"]["school_invite_status"];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					invited_by?: string | null;
					responded_at?: string | null;
					role?: Database["public"]["Enums"]["school_member_role"];
					school_id?: string;
					status?: Database["public"]["Enums"]["school_invite_status"];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "school_member_invites_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_member_invites_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			school_members: {
				Row: {
					created_at: string;
					id: string;
					role: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					role?: Database["public"]["Enums"]["school_member_role"];
					school_id?: string;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			schools: {
				Row: {
					address: string | null;
					admin_email: string | null;
					created_at: string;
					id: string;
					name: string | null;
					province_id: string | null;
					status: Database["public"]["Enums"]["account_status"];
					suspended_by_agency_id: string | null;
					suspension_reason: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					address?: string | null;
					admin_email?: string | null;
					created_at?: string;
					id?: string;
					name?: string | null;
					province_id?: string | null;
					status?: Database["public"]["Enums"]["account_status"];
					suspended_by_agency_id?: string | null;
					suspension_reason?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					address?: string | null;
					admin_email?: string | null;
					created_at?: string;
					id?: string;
					name?: string | null;
					province_id?: string | null;
					status?: Database["public"]["Enums"]["account_status"];
					suspended_by_agency_id?: string | null;
					suspension_reason?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "schools_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_suspended_by_agency_id_fkey";
						columns: ["suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_suspended_by_agency_id_fkey";
						columns: ["suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			subjects: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			tags: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			telegram_link_tokens: {
				Row: {
					created_at: string;
					expires_at: string;
					id: string;
					token: string;
					used_at: string | null;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					expires_at: string;
					id?: string;
					token: string;
					used_at?: string | null;
					user_id: string;
				};
				Update: {
					created_at?: string;
					expires_at?: string;
					id?: string;
					token?: string;
					used_at?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "telegram_link_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "telegram_link_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "telegram_link_tokens_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			universities: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					province_id: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					province_id?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					province_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "universities_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
				];
			};
			universities_faculties: {
				Row: {
					created_at: string;
					faculty_id: string | null;
					id: string;
					university_id: string | null;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					faculty_id?: string | null;
					id?: string;
					university_id?: string | null;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					faculty_id?: string | null;
					id?: string;
					university_id?: string | null;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "universities_faculties_faculty_id_fkey";
						columns: ["faculty_id"];
						isOneToOne: false;
						referencedRelation: "faculties";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "universities_faculties_university_id_fkey";
						columns: ["university_id"];
						isOneToOne: false;
						referencedRelation: "universities";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			admin_courses_view: {
				Row: {
					avg_rating: number | null;
					book_id: string | null;
					book_name: string | null;
					cover_image_url: string | null;
					created_at: string | null;
					currency: string | null;
					description: string | null;
					enrollment_limit: number | null;
					enrollments_count: number | null;
					estimated_duration_hours: number | null;
					grade_id: string | null;
					grade_name: string | null;
					id: string | null;
					instructor_avatar_url: string | null;
					instructor_email: string | null;
					instructor_id: string | null;
					instructor_name: string | null;
					is_free: boolean | null;
					is_published: boolean | null;
					language: Database["public"]["Enums"]["language_enum"] | null;
					lessons_count: number | null;
					level: Database["public"]["Enums"]["course_level"] | null;
					modules_count: number | null;
					price: number | null;
					price_credits: number | null;
					promo_video_url: string | null;
					published_at: string | null;
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					subject_id: string | null;
					subject_name: string | null;
					subtitle: string | null;
					title: string | null;
					updated_at: string | null;
					visibility: Database["public"]["Enums"]["visibility"] | null;
				};
				Relationships: [
					{
						foreignKeyName: "courses_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_grade_id_fkey";
						columns: ["grade_id"];
						isOneToOne: false;
						referencedRelation: "grades";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_instructor_id_fkey";
						columns: ["instructor_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "courses_subject_id_fkey";
						columns: ["subject_id"];
						isOneToOne: false;
						referencedRelation: "subjects";
						referencedColumns: ["id"];
					},
				];
			};
			admin_decks_view: {
				Row: {
					algorithm: Database["public"]["Enums"]["flashcard_algorithm"] | null;
					book_id: string | null;
					card_count: number | null;
					created_at: string | null;
					creation: Database["public"]["Enums"]["creation_enum"] | null;
					description: string | null;
					id: string | null;
					is_free: boolean | null;
					name: string | null;
					owner_email: string | null;
					owner_name: string | null;
					price_credits: number | null;
					school_id: string | null;
					school_name: string | null;
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					updated_at: string | null;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"] | null;
				};
				Relationships: [
					{
						foreignKeyName: "decks_book_id_fkey";
						columns: ["book_id"];
						isOneToOne: false;
						referencedRelation: "books";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "decks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			admin_instructors_view: {
				Row: {
					avatar_url: string | null;
					bio: string | null;
					courses_count: number | null;
					created_at: string | null;
					decks_count: number | null;
					email: string | null;
					full_name: string | null;
					id: string | null;
					instructor_status:
						| Database["public"]["Enums"]["account_status"]
						| null;
					phone: string | null;
					province_id: string | null;
					province_name: string | null;
					published_courses_count: number | null;
					quizzes_count: number | null;
					slug: string | null;
					updated_at: string | null;
					website_url: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "profiles_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
				];
			};
			admin_quizzes_view: {
				Row: {
					course_id: string | null;
					course_title: string | null;
					created_at: string | null;
					description: string | null;
					entrance_code: string | null;
					id: string | null;
					instructions: string | null;
					is_free: boolean | null;
					lesson_id: string | null;
					lesson_title: string | null;
					max_attempts: number | null;
					owner_email: string | null;
					owner_name: string | null;
					passing_score_percentage: number | null;
					price_credits: number | null;
					question_count: number | null;
					school_id: string | null;
					school_name: string | null;
					seo_description: string | null;
					seo_title: string | null;
					show_correct_answers_after:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions: boolean | null;
					slug: string | null;
					time_limit_minutes: number | null;
					title: string | null;
					updated_at: string | null;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"] | null;
				};
				Relationships: [
					{
						foreignKeyName: "lessons_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "admin_courses_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "lessons_course_id_fkey";
						columns: ["course_id"];
						isOneToOne: false;
						referencedRelation: "courses";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_lesson_id_fkey";
						columns: ["lesson_id"];
						isOneToOne: false;
						referencedRelation: "lessons";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "quizzes_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			admin_school_members_view: {
				Row: {
					avatar_url: string | null;
					created_at: string | null;
					email: string | null;
					full_name: string | null;
					id: string | null;
					phone: string | null;
					role: Database["public"]["Enums"]["school_member_role"] | null;
					school_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "admin_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_schools_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_school_id_fkey";
						columns: ["school_id"];
						isOneToOne: false;
						referencedRelation: "schools";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "school_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			admin_schools_view: {
				Row: {
					address: string | null;
					admin_email: string | null;
					courses_count: number | null;
					created_at: string | null;
					decks_count: number | null;
					id: string | null;
					members_count: number | null;
					name: string | null;
					owner_email: string | null;
					owner_id: string | null;
					owner_name: string | null;
					quizzes_count: number | null;
					status: Database["public"]["Enums"]["account_status"] | null;
					updated_at: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_user_id_fkey";
						columns: ["owner_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			agency_disputes_view: {
				Row: {
					agency_id: string | null;
					agency_response: string | null;
					created_at: string | null;
					id: string | null;
					resolution_note: string | null;
					status: Database["public"]["Enums"]["agency_dispute_status"] | null;
					student_email_masked: string | null;
					student_id: string | null;
					student_name: string | null;
					student_note: string | null;
					topup_amount: number | null;
					topup_created_at: string | null;
					topup_id: string | null;
					updated_at: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_disputes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_topup_id_fkey";
						columns: ["topup_id"];
						isOneToOne: true;
						referencedRelation: "agency_topups";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_disputes_topup_id_fkey";
						columns: ["topup_id"];
						isOneToOne: true;
						referencedRelation: "agency_topups_view";
						referencedColumns: ["id"];
					},
				];
			};
			agency_liability_summary: {
				Row: {
					charged_total: number | null;
					commission_rate: number | null;
					commission_total: number | null;
					id: string | null;
					last_settlement_at: string | null;
					last_topup_at: string | null;
					liability_limit: number | null;
					name: string | null;
					outstanding: number | null;
					settled_gross: number | null;
					status: Database["public"]["Enums"]["agency_status"] | null;
				};
				Relationships: [];
			};
			agency_members_view: {
				Row: {
					agency_id: string | null;
					avatar_url: string | null;
					created_at: string | null;
					email: string | null;
					full_name: string | null;
					id: string | null;
					role: Database["public"]["Enums"]["agency_member_role"] | null;
					status: Database["public"]["Enums"]["agency_member_status"] | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			agency_moderated_instructors_view: {
				Row: {
					agency_id: string | null;
					avatar_url: string | null;
					can_suspend: boolean | null;
					created_at: string | null;
					email: string | null;
					full_name: string | null;
					id: string | null;
					instructor_status:
						| Database["public"]["Enums"]["account_status"]
						| null;
					instructor_suspended_by_agency_id: string | null;
					instructor_suspension_reason: string | null;
					province_id: string | null;
					province_name: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_instructor_suspended_by_agency_id_fkey";
						columns: ["instructor_suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_instructor_suspended_by_agency_id_fkey";
						columns: ["instructor_suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "profiles_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
				];
			};
			agency_moderated_schools_view: {
				Row: {
					address: string | null;
					admin_email: string | null;
					agency_id: string | null;
					can_manage: boolean | null;
					can_suspend: boolean | null;
					created_at: string | null;
					id: string | null;
					name: string | null;
					province_id: string | null;
					province_name: string | null;
					status: Database["public"]["Enums"]["account_status"] | null;
					suspended_by_agency_id: string | null;
					suspension_reason: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_members_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_province_id_fkey";
						columns: ["province_id"];
						isOneToOne: false;
						referencedRelation: "provinces";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_suspended_by_agency_id_fkey";
						columns: ["suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "schools_suspended_by_agency_id_fkey";
						columns: ["suspended_by_agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
				];
			};
			agency_topups_view: {
				Row: {
					agency_id: string | null;
					amount: number | null;
					created_at: string | null;
					dispute_id: string | null;
					dispute_status:
						| Database["public"]["Enums"]["agency_dispute_status"]
						| null;
					id: string | null;
					member_id: string | null;
					member_name: string | null;
					note: string | null;
					student_email_masked: string | null;
					student_id: string | null;
					student_name: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "agency_topups_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agencies";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_agency_id_fkey";
						columns: ["agency_id"];
						isOneToOne: false;
						referencedRelation: "agency_liability_summary";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "agency_topups_student_id_fkey";
						columns: ["student_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
			bookmark_details: {
				Row: {
					cover_image_url: string | null;
					created_at: string | null;
					description: string | null;
					id: string | null;
					item_id: string | null;
					item_type:
						| Database["public"]["Enums"]["bookmarkable_item_type"]
						| null;
					notes: string | null;
					slug: string | null;
					title: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "admin_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "agency_moderated_instructors_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "bookmarks_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "profiles";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Functions: {
			add_agency_member: {
				Args: {
					p_agency_id: string;
					p_email: string;
					p_role?: Database["public"]["Enums"]["agency_member_role"];
				};
				Returns: {
					agency_id: string;
					created_at: string;
					id: string;
					role: Database["public"]["Enums"]["agency_member_role"];
					status: Database["public"]["Enums"]["agency_member_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "agency_members";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			admin_topup_credits: {
				Args: { p_amount: number; p_note?: string; p_user_id: string };
				Returns: {
					amount: number;
					balance_after: number;
					created_at: string;
					created_by: string | null;
					id: string;
					note: string | null;
					profile_id: string;
					reference_id: string | null;
					reference_type: string | null;
					type: Database["public"]["Enums"]["credit_transaction_type"];
				};
				SetofOptions: {
					from: "*";
					to: "credit_transactions";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			admin_update_user_role: {
				Args: {
					p_new_role: Database["public"]["Enums"]["user_role"];
					p_user_id: string;
				};
				Returns: {
					active_school_id: string | null;
					avatar_url: string | null;
					bio: string | null;
					created_at: string;
					credit_balance: number;
					email: string | null;
					full_name: string | null;
					id: string;
					instructor_status:
						| Database["public"]["Enums"]["account_status"]
						| null;
					instructor_suspended_by_agency_id: string | null;
					instructor_suspension_reason: string | null;
					locale: Database["public"]["Enums"]["language_enum"];
					phone: string | null;
					province_id: string | null;
					role: Database["public"]["Enums"]["user_role"];
					school_id: string | null;
					slug: string | null;
					student_status: Database["public"]["Enums"]["account_status"];
					telegram_chat_id: number | null;
					telegram_linked_at: string | null;
					updated_at: string;
					website_url: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "profiles";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			agency_can_manage_any: {
				Args: {
					p_entity_id: string;
					p_permission: Database["public"]["Enums"]["agency_permission"];
					p_user_id?: string;
				};
				Returns: boolean;
			};
			agency_charge_student: {
				Args: {
					p_agency_id: string;
					p_amount: number;
					p_note?: string;
					p_student_email: string;
				};
				Returns: Json;
			};
			agency_has_permission: {
				Args: {
					p_agency_id: string;
					p_permission: Database["public"]["Enums"]["agency_permission"];
					p_target_entity?: string;
					p_target_province?: string;
					p_user_id?: string;
				};
				Returns: boolean;
			};
			agency_member_role: {
				Args: { p_agency_id: string; p_user_id?: string };
				Returns: Database["public"]["Enums"]["agency_member_role"];
			};
			agency_outstanding_liability: {
				Args: { p_agency_id: string };
				Returns: number;
			};
			agency_set_instructor_status: {
				Args: {
					p_action: string;
					p_agency_id: string;
					p_instructor_id: string;
					p_reason?: string;
				};
				Returns: undefined;
			};
			agency_set_school_status: {
				Args: {
					p_action: string;
					p_agency_id: string;
					p_reason?: string;
					p_school_id: string;
				};
				Returns: {
					address: string | null;
					admin_email: string | null;
					created_at: string;
					id: string;
					name: string | null;
					province_id: string | null;
					status: Database["public"]["Enums"]["account_status"];
					suspended_by_agency_id: string | null;
					suspension_reason: string | null;
					updated_at: string;
					user_id: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "schools";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			agency_update_school: {
				Args: {
					p_address?: string;
					p_admin_email?: string;
					p_agency_id: string;
					p_name?: string;
					p_school_id: string;
				};
				Returns: {
					address: string | null;
					admin_email: string | null;
					created_at: string;
					id: string;
					name: string | null;
					province_id: string | null;
					status: Database["public"]["Enums"]["account_status"];
					suspended_by_agency_id: string | null;
					suspension_reason: string | null;
					updated_at: string;
					user_id: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "schools";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			attach_certificate_pdf: {
				Args: { p_certificate_id: string; p_pdf_storage_key: string };
				Returns: {
					certificate_pdf_url: string | null;
					course_id: string;
					course_title: string;
					created_at: string;
					id: string;
					issued_at: string | null;
					updated_at: string;
					user_full_name: string;
					user_id: string;
					verification_code: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "certificates";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			can_manage_classroom: {
				Args: { p_classroom_id: string; p_user_id?: string };
				Returns: boolean;
			};
			can_manage_course: {
				Args: { p_course_id: string; p_school_id?: string; p_user_id?: string };
				Returns: boolean;
			};
			can_manage_discount: {
				Args: { p_discount_id: string; p_user_id?: string };
				Returns: boolean;
			};
			can_manage_omr_scan: {
				Args: { p_scan_id: string; p_user_id?: string };
				Returns: boolean;
			};
			can_manage_quiz: {
				Args: { p_quiz_id: string; p_user_id?: string };
				Returns: boolean;
			};
			can_view_classroom: {
				Args: { p_classroom_id: string; p_user_id?: string };
				Returns: boolean;
			};
			can_view_course: {
				Args: { p_course_id: string; p_school_id?: string; p_user_id?: string };
				Returns: boolean;
			};
			can_view_quiz: {
				Args: { p_quiz_id: string; p_user_id?: string };
				Returns: boolean;
			};
			cancel_classroom_request: {
				Args: { p_request_id: string };
				Returns: {
					classroom_id: string;
					classroom_name: string | null;
					created_at: string;
					id: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by: string | null;
					responded_at: string | null;
					responded_by: string | null;
					status: Database["public"]["Enums"]["classroom_request_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "classroom_membership_requests";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			complete_and_grade_quiz_attempt: {
				Args: { p_quiz_attempt_id: string; p_user_id?: string };
				Returns: {
					attempt_number: number;
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					feedback_from_instructor: string | null;
					id: string;
					max_score_possible: number | null;
					passed: boolean | null;
					quiz_id: string | null;
					score: number | null;
					started_at: string | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "quiz_attempts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			complete_lesson_for_user: {
				Args: { p_lesson_id: string; p_user_id?: string };
				Returns: {
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					id: string;
					is_completed: boolean | null;
					last_accessed_at: string | null;
					lesson_id: string | null;
					updated_at: string;
					user_id: string | null;
					video_progress_seconds: number | null;
				};
				SetofOptions: {
					from: "*";
					to: "lesson_progress";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			compute_discounted_price: {
				Args: {
					p_base_price: number;
					p_code: string;
					p_item_id: string;
					p_item_type: Database["public"]["Enums"]["purchase_item_type"];
				};
				Returns: {
					discount_id: string;
					price: number;
				}[];
			};
			create_app_notification: {
				Args: {
					p_actor_id?: string;
					p_message?: string;
					p_related_entity_id?: string;
					p_related_entity_type?: string;
					p_title: string;
					p_type: Database["public"]["Enums"]["notification_type"];
					p_user_id: string;
				};
				Returns: {
					actor_id: string | null;
					created_at: string;
					id: string;
					is_read: boolean | null;
					message: string | null;
					push_delivered_at: string | null;
					read_at: string | null;
					related_entity_id: string | null;
					related_entity_type: string | null;
					telegram_delivered_at: string | null;
					title: string;
					type: Database["public"]["Enums"]["notification_type"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "notifications";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			create_classroom_invite: {
				Args: { p_classroom_id: string; p_student_email: string };
				Returns: {
					classroom_id: string;
					classroom_name: string | null;
					created_at: string;
					id: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by: string | null;
					responded_at: string | null;
					responded_by: string | null;
					status: Database["public"]["Enums"]["classroom_request_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "classroom_membership_requests";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			create_discount: {
				Args: {
					p_code: string;
					p_ends_at?: string;
					p_school_id?: string;
					p_scope: Database["public"]["Enums"]["discount_scope"];
					p_starts_at?: string;
					p_targets?: Json;
					p_type: Database["public"]["Enums"]["discount_type"];
					p_value: number;
				};
				Returns: {
					code: string;
					created_at: string;
					ends_at: string | null;
					id: string;
					is_active: boolean;
					owner_profile_id: string | null;
					owner_school_id: string | null;
					owner_type: Database["public"]["Enums"]["seller_type"];
					scope: Database["public"]["Enums"]["discount_scope"];
					starts_at: string | null;
					type: Database["public"]["Enums"]["discount_type"];
					updated_at: string;
					value: number;
				};
				SetofOptions: {
					from: "*";
					to: "discounts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			create_omr_scan: {
				Args: {
					p_image_storage_path: string;
					p_user_id?: string;
					p_variant_id: string;
				};
				Returns: {
					created_at: string;
					error_message: string | null;
					id: string;
					image_storage_path: string;
					raw_omr_result: Json | null;
					score_pct: number | null;
					scored_at: string | null;
					status: Database["public"]["Enums"]["omr_scan_status"];
					total_correct: number | null;
					total_questions: number | null;
					updated_at: string;
					uploaded_at: string;
					uploaded_by: string;
					variant_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "omr_scans";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			custom_access_token_hook: { Args: { event: Json }; Returns: Json };
			delete_discount: { Args: { p_discount_id: string }; Returns: undefined };
			delete_user_account: { Args: never; Returns: undefined };
			enroll_user_in_course: {
				Args: { p_course_id: string; p_user_id?: string };
				Returns: {
					certificate_id: string | null;
					completed_at: string | null;
					course_id: string | null;
					created_at: string;
					deck_id: string | null;
					enrolled_at: string | null;
					flashcard_daily_limit: number | null;
					id: string;
					last_accessed_lesson_id: string | null;
					progress_percentage: number | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "enrollments";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			epoch_to_timestamp:
				| {
						Args: { epoch: number };
						Returns: {
							error: true;
						} & "Could not choose the best candidate function between: public.epoch_to_timestamp(epoch => int8), public.epoch_to_timestamp(epoch => text). Try renaming the parameters or the function itself in the database so function overloading can be resolved";
				  }
				| {
						Args: { epoch: string };
						Returns: {
							error: true;
						} & "Could not choose the best candidate function between: public.epoch_to_timestamp(epoch => int8), public.epoch_to_timestamp(epoch => text). Try renaming the parameters or the function itself in the database so function overloading can be resolved";
				  };
			extract_email_username: { Args: { email: string }; Returns: string };
			find_similar_threads: {
				Args: {
					p_content: string;
					p_limit?: number;
					p_resource_id?: string;
					p_resource_type?: Database["public"]["Enums"]["discussion_resource_type"];
					p_title: string;
				};
				Returns: {
					content: string;
					created_at: string;
					id: string;
					reply_count: number;
					status: Database["public"]["Enums"]["discussion_thread_status"];
					title: string;
					vote_count: number;
				}[];
			};
			generate_quiz_variants: {
				Args: { p_quiz_id: string; p_shuffle?: boolean; p_user_id?: string };
				Returns: {
					created_at: string;
					id: string;
					question_order: string[];
					quiz_id: string;
					shuffled: boolean;
					student_id: string;
					template_version: number;
					updated_at: string;
				}[];
				SetofOptions: {
					from: "*";
					to: "quiz_variants";
					isOneToOne: false;
					isSetofReturn: true;
				};
			};
			get_admin_instructor_overview: {
				Args: { p_instructor_id: string };
				Returns: {
					average_rating: number;
					draft_courses_count: number;
					earnings_this_month_credits: number;
					published_courses_count: number;
					recent_enrollments: Json;
					total_decks_count: number;
					total_earnings_credits: number;
					total_quizzes_count: number;
					total_students_count: number;
				}[];
			};
			get_agency_overview: { Args: { p_agency_id: string }; Returns: Json };
			get_course_average_rating: {
				Args: { p_course_id: string };
				Returns: number;
			};
			get_course_details: {
				Args: { p_course_id?: string; p_course_slug?: string };
				Returns: {
					average_rating: number;
					book: Database["public"]["CompositeTypes"]["item_type"];
					cover_image_url: string;
					created_at: string;
					currency: string;
					description: string;
					enrollment: Json;
					enrollment_limit: number;
					estimated_duration_hours: number;
					grade: Database["public"]["CompositeTypes"]["item_type"];
					id: string;
					instructor: Database["public"]["CompositeTypes"]["user_info"];
					is_free: boolean;
					is_published: boolean;
					language: Database["public"]["Enums"]["language_enum"];
					learning_objectives: string[];
					level: Database["public"]["Enums"]["course_level"];
					modules: Json;
					prerequisites: string[];
					price: number;
					price_credits: number;
					promo_video_url: string;
					published_at: string;
					related_decks_ids: string[];
					related_libraries_ids: string[];
					related_quizzes_ids: string[];
					school_id: string;
					seo_description: string;
					seo_title: string;
					slug: string;
					subject: Database["public"]["CompositeTypes"]["item_type"];
					subtitle: string;
					title: string;
					total_enrollments: number;
					total_lessons: number;
					total_reviews: number;
					updated_at: string;
					welcome_message: string;
				}[];
			};
			get_course_id_from_lesson: {
				Args: { check_lesson_id: string };
				Returns: string;
			};
			get_course_id_from_section: {
				Args: { check_section_id: string };
				Returns: string;
			};
			get_current_user_role: {
				Args: never;
				Returns: Database["public"]["Enums"]["user_role"];
			};
			get_deck_card_counts: {
				Args: { p_deck_ids: string[] };
				Returns: {
					card_count: number;
					deck_id: string;
				}[];
			};
			get_deck_details: {
				Args: { p_deck_id?: string; p_deck_slug?: string };
				Returns: {
					algorithm: Database["public"]["Enums"]["flashcard_algorithm"];
					average_rating: number;
					book: Database["public"]["CompositeTypes"]["item_type"];
					card_count: number;
					config: Json;
					created_at: string;
					description: string;
					enrollment: Json;
					flashcards: Json;
					fsrs_maximum_interval: number;
					fsrs_request_retention: number;
					id: string;
					is_free: boolean;
					is_owner: boolean;
					name: string;
					price_credits: number;
					related_courses_ids: string[];
					related_libraries_ids: string[];
					seo_description: string;
					seo_title: string;
					slug: string;
					sm2_easy_bonus: number;
					sm2_interval_modifier: number;
					sm2_starting_ease: number;
					total_flashcards: number;
					total_reviews: number;
					user_id: string;
					visibility: Database["public"]["Enums"]["visibility"];
				}[];
			};
			get_instructor_dashboard_overview: {
				Args: never;
				Returns: {
					average_rating: number;
					draft_courses_count: number;
					earnings_this_month_credits: number;
					earnings_trend: Json;
					published_courses_count: number;
					recent_enrollments: Json;
					recent_quiz_attempts: Json;
					total_decks_count: number;
					total_earnings_credits: number;
					total_quizzes_count: number;
					total_students_count: number;
				}[];
			};
			get_library_details: {
				Args: { p_library_id?: string; p_library_slug?: string };
				Returns: {
					book: Database["public"]["CompositeTypes"]["item_type"];
					category: Database["public"]["CompositeTypes"]["item_type"];
					created_at: string;
					desc: string;
					file_path: string;
					grade: Database["public"]["CompositeTypes"]["item_type"];
					id: string;
					related_courses_ids: string[];
					related_decks_ids: string[];
					seo_description: string;
					seo_title: string;
					slug: string;
					subject: Database["public"]["CompositeTypes"]["item_type"];
					title: string;
					updated_at: string;
					uri: string;
				}[];
			};
			get_platform_admin_overview: {
				Args: never;
				Returns: {
					courses_draft_count: number;
					courses_published_count: number;
					decks_count: number;
					instructors_count: number;
					pending_instructor_approvals: number;
					quizzes_count: number;
					recent_signups: Json;
					revenue_this_month_credits: number;
					revenue_trend: Json;
					schools_active_count: number;
					schools_pending_count: number;
					signup_trend: Json;
					students_count: number;
					total_revenue_credits: number;
				}[];
			};
			get_quiz_by_entrance_code: {
				Args: { p_entrance_code: string };
				Returns: {
					agency_id: string | null;
					book_id: string | null;
					created_at: string;
					description: string | null;
					entrance_code: string;
					grade_id: string | null;
					id: string;
					instructions: string | null;
					is_free: boolean;
					lesson_id: string | null;
					locked_at: string | null;
					max_attempts: number | null;
					passing_score_percentage: number | null;
					price_credits: number;
					print_version: number;
					registration_deadline: string | null;
					related_courses_ids: string[];
					related_decks_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					show_correct_answers_after:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions: boolean | null;
					slug: string | null;
					subject_id: string | null;
					time_limit_minutes: number | null;
					title: string;
					updated_at: string;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"];
				};
				SetofOptions: {
					from: "*";
					to: "quizzes";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			get_quiz_details: {
				Args: { p_quiz_id?: string; p_quiz_slug?: string };
				Returns: {
					created_at: string;
					description: string;
					id: string;
					instructions: string;
					is_free: boolean;
					is_registered: boolean;
					max_attempts: number;
					passing_score_percentage: number;
					price_credits: number;
					registration_open: boolean;
					related_courses_ids: string[];
					related_decks_ids: string[];
					school_id: string;
					seo_description: string;
					seo_title: string;
					slug: string;
					time_limit_minutes: number;
					title: string;
					visibility: Database["public"]["Enums"]["visibility"];
				}[];
			};
			get_quiz_questions_for_attempt: {
				Args: { p_quiz_attempt_id: string; p_user_id?: string };
				Returns: {
					hint: string;
					image_content_block_id: string;
					match_target_text: string;
					option_id: string;
					option_order_index: number;
					option_text: string;
					order_index: number;
					points: number;
					question_id: string;
					question_text: string;
					question_type: Database["public"]["Enums"]["question_type"];
				}[];
			};
			get_related_courses: {
				Args: {
					p_book_id?: string;
					p_grade_id?: string;
					p_limit?: number;
					p_related_ids?: string[];
					p_school_id?: string;
					p_subject_id?: string;
				};
				Returns: {
					average_rating: number;
					cover_image_url: string;
					created_at: string;
					currency: string;
					id: string;
					is_free: boolean;
					language: Database["public"]["Enums"]["language_enum"];
					level: Database["public"]["Enums"]["course_level"];
					price: number;
					price_credits: number;
					slug: string;
					subtitle: string;
					title: string;
					updated_at: string;
				}[];
			};
			get_related_decks: {
				Args: {
					p_book_id?: string;
					p_grade_id?: string;
					p_limit?: number;
					p_related_ids?: string[];
					p_school_id?: string;
					p_subject_id?: string;
				};
				Returns: {
					description: string;
					id: string;
					is_free: boolean;
					name: string;
					slug: string;
				}[];
			};
			get_related_libraries: {
				Args: {
					p_book_id?: string;
					p_grade_id?: string;
					p_limit?: number;
					p_related_ids?: string[];
					p_school_id?: string;
					p_subject_id?: string;
				};
				Returns: {
					book_id: string;
					category_id: string;
					created_at: string;
					desc: string;
					file_path: string;
					grade_id: string;
					id: string;
					slug: string;
					subject_id: string;
					title: string;
					updated_at: string;
					uri: string;
				}[];
			};
			get_related_quizzes: {
				Args: {
					p_book_id?: string;
					p_grade_id?: string;
					p_limit?: number;
					p_related_ids?: string[];
					p_school_id?: string;
					p_subject_id?: string;
				};
				Returns: {
					created_at: string;
					description: string;
					id: string;
					instructions: string;
					is_free: boolean;
					max_attempts: number;
					passing_score_percentage: number;
					slug: string;
					time_limit_minutes: number;
					title: string;
				}[];
			};
			get_review_breakdown: {
				Args: { p_course_id?: string; p_deck_id?: string };
				Returns: {
					count: number;
					rating: number;
				}[];
			};
			get_reviews: {
				Args: {
					p_course_id?: string;
					p_deck_id?: string;
					p_limit?: number;
					p_offset?: number;
				};
				Returns: {
					comment: string;
					created_at: string;
					id: string;
					rating: number;
					reviewer: Json;
					title: string;
					total_count: number;
					updated_at: string;
					user_id: string;
				}[];
			};
			get_school_dashboard_overview: {
				Args: { p_school_id: string };
				Returns: {
					courses_count: number;
					decks_count: number;
					earnings_this_month_credits: number;
					earnings_trend: Json;
					quizzes_count: number;
					recent_members: Json;
					recent_quiz_attempts: Json;
					staff_count: number;
					students_count: number;
					teachers_count: number;
					total_earnings_credits: number;
				}[];
			};
			get_school_member_role: {
				Args: { p_school_id: string; p_user_id?: string };
				Returns: Database["public"]["Enums"]["school_member_role"];
			};
			get_student_dashboard_overview: {
				Args: never;
				Returns: {
					active_decks_count: number;
					bookmarks_count: number;
					cards_due_today: number;
					continue_learning: Json;
					credit_balance: number;
					enrolled_courses_count: number;
					notes_count: number;
					recent_notes: Json;
					recent_quiz_attempts: Json;
					study_activity: Json;
					tests_completed_count: number;
					tests_passed_count: number;
				}[];
			};
			get_user_role: {
				Args: { user_id?: string };
				Returns: Database["public"]["Enums"]["user_role"];
			};
			import_new_deck_cards: {
				Args: {
					p_deck_id: string;
					p_now: string;
					p_start_of_today: string;
					p_user_id: string;
				};
				Returns: number;
			};
			instructor_grade_answer_and_update_quiz: {
				Args: {
					p_answer_id: string;
					p_instructor_feedback?: string;
					p_instructor_id?: string;
					p_is_correct: boolean;
					p_points_awarded: number;
				};
				Returns: {
					attempt_number: number;
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					feedback_from_instructor: string | null;
					id: string;
					max_score_possible: number | null;
					passed: boolean | null;
					quiz_id: string | null;
					score: number | null;
					started_at: string | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "quiz_attempts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			invite_school_member: {
				Args: {
					p_email: string;
					p_role: Database["public"]["Enums"]["school_member_role"];
					p_school_id: string;
				};
				Returns: {
					created_at: string;
					id: string;
					invited_by: string | null;
					responded_at: string | null;
					role: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					status: Database["public"]["Enums"]["school_invite_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "school_member_invites";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			is_admin: { Args: { user_id?: string }; Returns: boolean };
			is_agency_admin: {
				Args: { p_agency_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_agency_content_editor: {
				Args: {
					p_agency_id: string;
					p_permission: Database["public"]["Enums"]["agency_permission"];
					p_user_id?: string;
				};
				Returns: boolean;
			};
			is_agency_member: {
				Args: { p_agency_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_classroom_instructor: {
				Args: { p_classroom_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_classroom_member: {
				Args: { p_classroom_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_content_owner_active: {
				Args: { p_owner_id: string; p_school_id?: string };
				Returns: boolean;
			};
			is_course_instructor: {
				Args: { p_course_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_course_instructor_old: {
				Args: { check_course_id: string; check_user_id: string };
				Returns: boolean;
			};
			is_course_published: { Args: { p_course_id: string }; Returns: boolean };
			is_enrolled: {
				Args: { p_course_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_enrolled_deck: {
				Args: { p_deck_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_enrolled_old: {
				Args: { check_course_id: string; check_user_id: string };
				Returns: boolean;
			};
			is_instructor: { Args: { user_id?: string }; Returns: boolean };
			is_owner: { Args: { user_id: string }; Returns: boolean };
			is_quiz_public: { Args: { p_quiz_id: string }; Returns: boolean };
			is_resource_shared_with_user: {
				Args: { p_resource_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_school_admin: {
				Args: { p_school_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_school_editor: {
				Args: { p_school_id?: string; p_user_id?: string };
				Returns: boolean;
			};
			is_school_member: {
				Args: { p_school_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_school_owner: {
				Args: { p_school_id: string; p_user_id?: string };
				Returns: boolean;
			};
			is_student: { Args: { user_id?: string }; Returns: boolean };
			is_user_a: {
				Args: {
					role: Database["public"]["Enums"]["user_role"];
					user_id?: string;
				};
				Returns: boolean;
			};
			is_user_any_of: {
				Args: {
					p_roles: Database["public"]["Enums"]["user_role"][];
					p_user_id?: string;
				};
				Returns: boolean;
			};
			log_agency_action: {
				Args: {
					p_action: string;
					p_actor_id: string;
					p_agency_id: string;
					p_payload?: Json;
					p_permission?: Database["public"]["Enums"]["agency_permission"];
					p_target_id?: string;
					p_target_type?: string;
				};
				Returns: undefined;
			};
			mark_accepted_solution: { Args: { p_post_id: string }; Returns: Json };
			mark_omr_scan_error: {
				Args: { p_error_message: string; p_scan_id: string };
				Returns: {
					created_at: string;
					error_message: string | null;
					id: string;
					image_storage_path: string;
					raw_omr_result: Json | null;
					score_pct: number | null;
					scored_at: string | null;
					status: Database["public"]["Enums"]["omr_scan_status"];
					total_correct: number | null;
					total_questions: number | null;
					updated_at: string;
					uploaded_at: string;
					uploaded_by: string;
					variant_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "omr_scans";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			mask_email: { Args: { p_email: string }; Returns: string };
			open_agency_topup_dispute: {
				Args: { p_note: string; p_topup_id: string };
				Returns: {
					adjustment_transaction_id: string | null;
					agency_id: string;
					agency_response: string | null;
					created_at: string;
					id: string;
					resolution_note: string | null;
					resolved_by: string | null;
					status: Database["public"]["Enums"]["agency_dispute_status"];
					student_id: string;
					student_note: string;
					topup_id: string;
					updated_at: string;
				};
				SetofOptions: {
					from: "*";
					to: "agency_disputes";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			purchase_item: {
				Args: {
					p_daily_limit?: number;
					p_discount_code?: string;
					p_item_id: string;
					p_item_type: Database["public"]["Enums"]["purchase_item_type"];
				};
				Returns: {
					buyer_id: string;
					created_at: string;
					credit_transaction_id: string | null;
					discount_id: string | null;
					id: string;
					item_id: string;
					item_type: Database["public"]["Enums"]["purchase_item_type"];
					original_price_credits: number | null;
					price_credits: number;
					seller_agency_id: string | null;
					seller_profile_id: string | null;
					seller_school_id: string | null;
					seller_type: Database["public"]["Enums"]["seller_type"];
				};
				SetofOptions: {
					from: "*";
					to: "purchases";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			quiz_registration_open: { Args: { p_quiz_id: string }; Returns: boolean };
			record_agency_settlement: {
				Args: {
					p_agency_id: string;
					p_gross_amount: number;
					p_method?: Database["public"]["Enums"]["agency_settlement_method"];
					p_note?: string;
					p_period_end?: string;
					p_period_start?: string;
				};
				Returns: {
					agency_id: string;
					commission_amount: number;
					created_at: string;
					gross_amount: number;
					id: string;
					method: Database["public"]["Enums"]["agency_settlement_method"];
					net_received: number;
					note: string | null;
					period_end: string | null;
					period_start: string | null;
					recorded_by: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "agency_settlements";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			record_credit_transaction: {
				Args: {
					p_amount: number;
					p_created_by?: string;
					p_note?: string;
					p_profile_id: string;
					p_reference_id?: string;
					p_reference_type?: string;
					p_type: Database["public"]["Enums"]["credit_transaction_type"];
				};
				Returns: {
					amount: number;
					balance_after: number;
					created_at: string;
					created_by: string | null;
					id: string;
					note: string | null;
					profile_id: string;
					reference_id: string | null;
					reference_type: string | null;
					type: Database["public"]["Enums"]["credit_transaction_type"];
				};
				SetofOptions: {
					from: "*";
					to: "credit_transactions";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			record_omr_scan_result: {
				Args: {
					p_confidence_threshold?: number;
					p_raw_result?: Json;
					p_responses: Json;
					p_scan_id: string;
				};
				Returns: {
					created_at: string;
					error_message: string | null;
					id: string;
					image_storage_path: string;
					raw_omr_result: Json | null;
					score_pct: number | null;
					scored_at: string | null;
					status: Database["public"]["Enums"]["omr_scan_status"];
					total_correct: number | null;
					total_questions: number | null;
					updated_at: string;
					uploaded_at: string;
					uploaded_by: string;
					variant_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "omr_scans";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			record_thread_view: {
				Args: { p_client_hash: string; p_thread_id: string };
				Returns: undefined;
			};
			request_join_classroom: {
				Args: { p_join_code: string };
				Returns: {
					classroom_id: string;
					classroom_name: string | null;
					created_at: string;
					id: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by: string | null;
					responded_at: string | null;
					responded_by: string | null;
					status: Database["public"]["Enums"]["classroom_request_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "classroom_membership_requests";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			resolve_agency_dispute: {
				Args: {
					p_adjustment_amount?: number;
					p_dispute_id: string;
					p_resolution_note?: string;
					p_status: Database["public"]["Enums"]["agency_dispute_status"];
				};
				Returns: {
					adjustment_transaction_id: string | null;
					agency_id: string;
					agency_response: string | null;
					created_at: string;
					id: string;
					resolution_note: string | null;
					resolved_by: string | null;
					status: Database["public"]["Enums"]["agency_dispute_status"];
					student_id: string;
					student_note: string;
					topup_id: string;
					updated_at: string;
				};
				SetofOptions: {
					from: "*";
					to: "agency_disputes";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			respond_agency_dispute: {
				Args: { p_dispute_id: string; p_response: string };
				Returns: {
					adjustment_transaction_id: string | null;
					agency_id: string;
					agency_response: string | null;
					created_at: string;
					id: string;
					resolution_note: string | null;
					resolved_by: string | null;
					status: Database["public"]["Enums"]["agency_dispute_status"];
					student_id: string;
					student_note: string;
					topup_id: string;
					updated_at: string;
				};
				SetofOptions: {
					from: "*";
					to: "agency_disputes";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			respond_to_classroom_request: {
				Args: { p_approve: boolean; p_request_id: string };
				Returns: {
					classroom_id: string;
					classroom_name: string | null;
					created_at: string;
					id: string;
					initiated_by: Database["public"]["Enums"]["classroom_request_initiator"];
					invited_by: string | null;
					responded_at: string | null;
					responded_by: string | null;
					status: Database["public"]["Enums"]["classroom_request_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "classroom_membership_requests";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			respond_to_school_invite: {
				Args: { p_accept: boolean; p_invite_id: string };
				Returns: {
					created_at: string;
					id: string;
					invited_by: string | null;
					responded_at: string | null;
					role: Database["public"]["Enums"]["school_member_role"];
					school_id: string;
					status: Database["public"]["Enums"]["school_invite_status"];
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "school_member_invites";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			search_suggestions: {
				Args: { p_limit_per_type?: number; p_query: string };
				Returns: {
					id: string;
					rank: number;
					result_type: string;
					slug: string;
					subtitle: string;
					title: string;
				}[];
			};
			set_course_published_status: {
				Args: { p_course_id: string; p_is_published: boolean };
				Returns: {
					agency_id: string | null;
					average_rating: number | null;
					book_id: string | null;
					cover_image_url: string | null;
					created_at: string;
					currency: string | null;
					description: string | null;
					enrollment_limit: number;
					estimated_duration_hours: number | null;
					grade_id: string | null;
					id: string;
					instructor_id: string | null;
					is_free: boolean | null;
					is_published: boolean;
					language: Database["public"]["Enums"]["language_enum"];
					learning_objectives: string[] | null;
					level: Database["public"]["Enums"]["course_level"] | null;
					prerequisites: string[] | null;
					price: number | null;
					price_credits: number;
					promo_video_url: string | null;
					published_at: string | null;
					related_decks_ids: string[];
					related_libraries_ids: string[];
					related_quizzes_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					slug: string | null;
					subject_id: string | null;
					subtitle: string | null;
					title: string;
					total_reviews: number;
					updated_at: string;
					visibility: Database["public"]["Enums"]["visibility"];
					welcome_message: string | null;
				};
				SetofOptions: {
					from: "*";
					to: "courses";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			slugify: { Args: { input_text: string }; Returns: string };
			start_quiz_attempt: {
				Args: { p_quiz_id: string; p_user_id?: string };
				Returns: {
					attempt_number: number;
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					feedback_from_instructor: string | null;
					id: string;
					max_score_possible: number | null;
					passed: boolean | null;
					quiz_id: string | null;
					score: number | null;
					started_at: string | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "quiz_attempts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			start_standalone_quiz_attempt: {
				Args: { p_entrance_code: string; p_user_id?: string };
				Returns: {
					attempt_number: number;
					completed_at: string | null;
					created_at: string;
					enrollment_id: string | null;
					feedback_from_instructor: string | null;
					id: string;
					max_score_possible: number | null;
					passed: boolean | null;
					quiz_id: string | null;
					score: number | null;
					started_at: string | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "quiz_attempts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			submit_quiz_answer: {
				Args: {
					p_answer_text?: string;
					p_question_id: string;
					p_quiz_attempt_id: string;
					p_selected_option_ids?: string[];
					p_structured_answer?: Json;
					p_user_id?: string;
				};
				Returns: {
					answer_text: string | null;
					created_at: string;
					feedback: string | null;
					id: string;
					is_correct: boolean | null;
					points_awarded: number | null;
					question_id: string | null;
					quiz_attempt_id: string | null;
					selected_option_ids: string[] | null;
					structured_answer: Json | null;
					submitted_at: string;
					updated_at: string;
				};
				SetofOptions: {
					from: "*";
					to: "answers";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			submit_review: {
				Args: {
					p_comment?: string;
					p_course_id?: string;
					p_deck_id?: string;
					p_rating?: number;
					p_title?: string;
					p_user_id?: string;
				};
				Returns: {
					comment: string | null;
					course_id: string | null;
					created_at: string;
					deck_id: string | null;
					id: string;
					rating: number;
					title: string | null;
					updated_at: string;
					user_id: string;
				};
				SetofOptions: {
					from: "*";
					to: "reviews";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			timestamp_to_epoch: { Args: { ts: string }; Returns: number };
			toggle_reaction: {
				Args: {
					p_emoji: Database["public"]["Enums"]["discussion_reaction_emoji"];
					p_target_id: string;
					p_target_type: string;
				};
				Returns: Json;
			};
			unlock_quiz_for_editing: {
				Args: { p_quiz_id: string; p_user_id?: string };
				Returns: {
					agency_id: string | null;
					book_id: string | null;
					created_at: string;
					description: string | null;
					entrance_code: string;
					grade_id: string | null;
					id: string;
					instructions: string | null;
					is_free: boolean;
					lesson_id: string | null;
					locked_at: string | null;
					max_attempts: number | null;
					passing_score_percentage: number | null;
					price_credits: number;
					print_version: number;
					registration_deadline: string | null;
					related_courses_ids: string[];
					related_decks_ids: string[];
					school_id: string | null;
					seo_description: string | null;
					seo_title: string | null;
					show_correct_answers_after:
						| Database["public"]["Enums"]["show_correct_answers"]
						| null;
					shuffle_questions: boolean | null;
					slug: string | null;
					subject_id: string | null;
					time_limit_minutes: number | null;
					title: string;
					updated_at: string;
					user_id: string | null;
					visibility: Database["public"]["Enums"]["visibility"];
				};
				SetofOptions: {
					from: "*";
					to: "quizzes";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			update_discount: {
				Args: {
					p_code: string;
					p_discount_id: string;
					p_ends_at?: string;
					p_is_active: boolean;
					p_starts_at?: string;
					p_value: number;
				};
				Returns: {
					code: string;
					created_at: string;
					ends_at: string | null;
					id: string;
					is_active: boolean;
					owner_profile_id: string | null;
					owner_school_id: string | null;
					owner_type: Database["public"]["Enums"]["seller_type"];
					scope: Database["public"]["Enums"]["discount_scope"];
					starts_at: string | null;
					type: Database["public"]["Enums"]["discount_type"];
					updated_at: string;
					value: number;
				};
				SetofOptions: {
					from: "*";
					to: "discounts";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			validate_discount_code: {
				Args: {
					p_code: string;
					p_item_id: string;
					p_item_type: Database["public"]["Enums"]["purchase_item_type"];
				};
				Returns: {
					discounted_price: number;
					original_price: number;
				}[];
			};
			verify_certificate: {
				Args: { p_verification_code: string };
				Returns: {
					course_title: string;
					created_at: string;
					issued_at: string;
					user_full_name: string;
				}[];
			};
			vote_discussion: {
				Args: { p_target_id: string; p_target_type: string; p_vote: number };
				Returns: Json;
			};
		};
		Enums: {
			account_status:
				| "pending"
				| "active"
				| "rejected"
				| "suspended"
				| "disabled";
			agency_dispute_status: "open" | "resolved" | "rejected";
			agency_grant_scope: "global" | "province" | "entities";
			agency_member_role: "owner" | "admin" | "staff";
			agency_member_status: "active" | "disabled";
			agency_permission:
				| "students.charge"
				| "schools.suspend"
				| "instructors.suspend"
				| "schools.manage"
				| "courses.manage_own"
				| "decks.manage_own"
				| "quizzes.manage_own"
				| "courses.manage_any"
				| "decks.manage_any"
				| "quizzes.manage_any";
			agency_settlement_method: "bank" | "hawala" | "cash" | "other";
			agency_status: "active" | "suspended";
			bookmarkable_item_type:
				| "course"
				| "module"
				| "lesson"
				| "quiz"
				| "question"
				| "discussion_thread"
				| "discussion_post"
				| "resource"
				| "library"
				| "deck";
			card_status: "new" | "learning" | "review" | "relearning";
			classroom_material_type:
				| "lesson"
				| "pdf"
				| "video"
				| "document"
				| "link"
				| "practice"
				| "exam"
				| "other";
			classroom_request_initiator: "instructor" | "student";
			classroom_request_status:
				| "pending"
				| "approved"
				| "declined"
				| "canceled";
			classroom_role: "owner" | "instructor" | "assistant" | "student";
			course_asset_kind: "video" | "audio" | "document" | "answer_sheet";
			course_asset_status: "pending" | "ready" | "failed";
			course_level: "beginner" | "intermediate" | "advanced" | "all_levels";
			creation_enum: "built-in" | "custom";
			credit_transaction_type: "topup" | "purchase" | "refund" | "adjustment";
			discount_scope: "item" | "group" | "all";
			discount_type: "percentage" | "fixed";
			discussion_reaction_emoji: "👍" | "❤️" | "😂" | "😮" | "🎉" | "🤔";
			discussion_report_reason:
				| "spam"
				| "offensive"
				| "wrong_information"
				| "duplicate"
				| "other";
			discussion_report_status:
				| "pending"
				| "reviewed"
				| "dismissed"
				| "actioned";
			discussion_resource_type:
				| "course"
				| "lesson"
				| "quiz"
				| "deck"
				| "library"
				| "classroom"
				| "general";
			discussion_thread_status: "open" | "answered" | "solved" | "closed";
			discussion_thread_type:
				| "question"
				| "discussion"
				| "tip"
				| "announcement"
				| "poll"
				| "report_mistake";
			flashcard_algorithm: "fsrs" | "sm2" | "leitner";
			language_enum: "fa" | "ps" | "en";
			lesson_content_type:
				| "text"
				| "video"
				| "audio"
				| "pdf_document"
				| "slide_presentation"
				| "quiz"
				| "assignment"
				| "external_resource"
				| "code_playground";
			notification_type:
				| "new_course_enrollment"
				| "course_completion"
				| "new_lesson_available"
				| "quiz_due_reminder"
				| "quiz_graded"
				| "new_assignment_submission"
				| "assignment_graded"
				| "new_discussion_post"
				| "new_reply_to_post"
				| "course_announcement"
				| "system_update"
				| "badge_awarded"
				| "classroom_invite"
				| "classroom_join_request"
				| "classroom_invite_response"
				| "school_invite"
				| "school_invite_response";
			omr_scan_status:
				| "pending"
				| "processing"
				| "scored"
				| "needs_review"
				| "error";
			payment_status:
				| "pending"
				| "succeeded"
				| "failed"
				| "refunded"
				| "disputed";
			payout_status: "pending" | "processing" | "paid" | "failed";
			purchase_item_type: "course" | "deck" | "quiz";
			question_type:
				| "multiple_choice_single_correct"
				| "multiple_choice_multiple_correct"
				| "true_false"
				| "yes_no"
				| "short_answer_text"
				| "long_answer_text"
				| "fill_in_the_blanks"
				| "matching"
				| "ordering"
				| "image_based_question";
			quiz_registration_source: "self" | "owner";
			school_invite_status: "pending" | "accepted" | "declined";
			school_member_role:
				| "owner"
				| "admin"
				| "instructor"
				| "manager"
				| "staff"
				| "viewer";
			seller_type: "platform" | "instructor" | "school" | "student" | "agency";
			shareable_type: "deck" | "course" | "library" | "quiz";
			show_correct_answers: "attempt" | "quiz_end_time" | "never";
			user_role: "student" | "instructor" | "admin";
			visibility: "public" | "private" | "classmate";
		};
		CompositeTypes: {
			item_type: {
				id: string | null;
				name: string | null;
			};
			user_info: {
				id: string | null;
				slug: string | null;
				email: string | null;
				name: string | null;
				avatar: string | null;
			};
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			account_status: [
				"pending",
				"active",
				"rejected",
				"suspended",
				"disabled",
			],
			agency_dispute_status: ["open", "resolved", "rejected"],
			agency_grant_scope: ["global", "province", "entities"],
			agency_member_role: ["owner", "admin", "staff"],
			agency_member_status: ["active", "disabled"],
			agency_permission: [
				"students.charge",
				"schools.suspend",
				"instructors.suspend",
				"schools.manage",
				"courses.manage_own",
				"decks.manage_own",
				"quizzes.manage_own",
				"courses.manage_any",
				"decks.manage_any",
				"quizzes.manage_any",
			],
			agency_settlement_method: ["bank", "hawala", "cash", "other"],
			agency_status: ["active", "suspended"],
			bookmarkable_item_type: [
				"course",
				"module",
				"lesson",
				"quiz",
				"question",
				"discussion_thread",
				"discussion_post",
				"resource",
				"library",
				"deck",
			],
			card_status: ["new", "learning", "review", "relearning"],
			classroom_material_type: [
				"lesson",
				"pdf",
				"video",
				"document",
				"link",
				"practice",
				"exam",
				"other",
			],
			classroom_request_initiator: ["instructor", "student"],
			classroom_request_status: ["pending", "approved", "declined", "canceled"],
			classroom_role: ["owner", "instructor", "assistant", "student"],
			course_asset_kind: ["video", "audio", "document", "answer_sheet"],
			course_asset_status: ["pending", "ready", "failed"],
			course_level: ["beginner", "intermediate", "advanced", "all_levels"],
			creation_enum: ["built-in", "custom"],
			credit_transaction_type: ["topup", "purchase", "refund", "adjustment"],
			discount_scope: ["item", "group", "all"],
			discount_type: ["percentage", "fixed"],
			discussion_reaction_emoji: ["👍", "❤️", "😂", "😮", "🎉", "🤔"],
			discussion_report_reason: [
				"spam",
				"offensive",
				"wrong_information",
				"duplicate",
				"other",
			],
			discussion_report_status: [
				"pending",
				"reviewed",
				"dismissed",
				"actioned",
			],
			discussion_resource_type: [
				"course",
				"lesson",
				"quiz",
				"deck",
				"library",
				"classroom",
				"general",
			],
			discussion_thread_status: ["open", "answered", "solved", "closed"],
			discussion_thread_type: [
				"question",
				"discussion",
				"tip",
				"announcement",
				"poll",
				"report_mistake",
			],
			flashcard_algorithm: ["fsrs", "sm2", "leitner"],
			language_enum: ["fa", "ps", "en"],
			lesson_content_type: [
				"text",
				"video",
				"audio",
				"pdf_document",
				"slide_presentation",
				"quiz",
				"assignment",
				"external_resource",
				"code_playground",
			],
			notification_type: [
				"new_course_enrollment",
				"course_completion",
				"new_lesson_available",
				"quiz_due_reminder",
				"quiz_graded",
				"new_assignment_submission",
				"assignment_graded",
				"new_discussion_post",
				"new_reply_to_post",
				"course_announcement",
				"system_update",
				"badge_awarded",
				"classroom_invite",
				"classroom_join_request",
				"classroom_invite_response",
				"school_invite",
				"school_invite_response",
			],
			omr_scan_status: [
				"pending",
				"processing",
				"scored",
				"needs_review",
				"error",
			],
			payment_status: [
				"pending",
				"succeeded",
				"failed",
				"refunded",
				"disputed",
			],
			payout_status: ["pending", "processing", "paid", "failed"],
			purchase_item_type: ["course", "deck", "quiz"],
			question_type: [
				"multiple_choice_single_correct",
				"multiple_choice_multiple_correct",
				"true_false",
				"yes_no",
				"short_answer_text",
				"long_answer_text",
				"fill_in_the_blanks",
				"matching",
				"ordering",
				"image_based_question",
			],
			quiz_registration_source: ["self", "owner"],
			school_invite_status: ["pending", "accepted", "declined"],
			school_member_role: [
				"owner",
				"admin",
				"instructor",
				"manager",
				"staff",
				"viewer",
			],
			seller_type: ["platform", "instructor", "school", "student", "agency"],
			shareable_type: ["deck", "course", "library", "quiz"],
			show_correct_answers: ["attempt", "quiz_end_time", "never"],
			user_role: ["student", "instructor", "admin"],
			visibility: ["public", "private", "classmate"],
		},
	},
} as const;
