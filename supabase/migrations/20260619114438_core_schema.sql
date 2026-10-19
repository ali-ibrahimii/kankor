-- Create a role/user with replication privileges for PowerSync
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'ZqqiUkGpSecuQOP0DYHotgi0HR4MjfN2';
-- Set up permissions for the newly created role
-- Read-only (SELECT) access is required
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;  

-- Optionally, grant SELECT on all future tables (to cater for schema additions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

drop extension if exists "pg_net";

create type "public"."bookmarkable_item_type" as enum ('course', 'module', 'lesson', 'quiz', 'question', 'discussion_thread', 'discussion_post', 'resource', 'library');

create type "public"."card_status" as enum ('new', 'learning', 'review', 'relearning');

create type "public"."course_level" as enum ('beginner', 'intermediate', 'advanced', 'all_levels');

create type "public"."creation_enum" as enum ('built-in', 'custom');

create type "public"."flashcard_algorithm" as enum ('fsrs', 'sm2', 'leitner');

create type "public"."language_enum" as enum ('fa', 'ps', 'en');

create type "public"."lesson_content_type" as enum ('text', 'video', 'audio', 'pdf_document', 'slide_presentation', 'quiz', 'assignment', 'external_resource', 'code_playground');

create type "public"."notification_type" as enum ('new_course_enrollment', 'course_completion', 'new_lesson_available', 'quiz_due_reminder', 'quiz_graded', 'new_assignment_submission', 'assignment_graded', 'new_discussion_post', 'new_reply_to_post', 'course_announcement', 'system_update', 'badge_awarded');

create type "public"."payment_status" as enum ('pending', 'succeeded', 'failed', 'refunded', 'disputed');

create type "public"."payout_status" as enum ('pending', 'processing', 'paid', 'failed');

create type "public"."question_type" as enum ('multiple_choice_single_correct', 'multiple_choice_multiple_correct', 'true_false', 'yes_no', 'short_answer_text', 'long_answer_text', 'fill_in_the_blanks', 'matching', 'ordering', 'image_based_question');

create type "public"."show_correct_answers" as enum ('attempt', 'quiz_end_time', 'never');

create type "public"."user_role" as enum ('student', 'instructor', 'admin');


  create table "public"."answer_sheets" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "question_number" smallint not null,
    "answer_number" smallint not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."answer_sheets" enable row level security;


  create table "public"."answers" (
    "answer_text" text,
    "structured_answer" jsonb,
    "is_correct" boolean,
    "points_awarded" numeric(5,2),
    "feedback" text,
    "submitted_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "question_id" uuid,
    "quiz_attempt_id" uuid,
    "selected_option_ids" uuid[]
      );


alter table "public"."answers" enable row level security;


  create table "public"."bookmarks" (
    "user_id" uuid not null,
    "item_type" public.bookmarkable_item_type not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "item_id" uuid not null
      );


alter table "public"."bookmarks" enable row level security;


  create table "public"."books" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "full_name" text not null,
    "file_path" text not null,
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "subject_id" uuid,
    "grade_id" uuid
      );


alter table "public"."books" enable row level security;


  create table "public"."categories" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "slug" text,
    "icon_url" text,
    "description" text,
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "parent" uuid
      );


alter table "public"."categories" enable row level security;


  create table "public"."certificates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "course_title" text not null,
    "user_full_name" text not null,
    "issued_at" timestamp with time zone default now(),
    "verification_code" text,
    "certificate_pdf_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "course_id" uuid not null
      );


alter table "public"."certificates" enable row level security;


  create table "public"."code" (
    "code" integer not null,
    "min_score" real not null,
    "max_score" real not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "university_id" uuid not null,
    "department_id" uuid not null
      );


alter table "public"."code" enable row level security;


  create table "public"."courses" (
    "title" text not null,
    "slug" text,
    "subtitle" text,
    "description" text,
    "instructor_id" uuid,
    "level" public.course_level default 'all_levels'::public.course_level,
    "cover_image_url" text,
    "promo_video_url" text,
    "welcome_message" text,
    "learning_objectives" text[],
    "prerequisites" text[],
    "is_published" boolean not null default false,
    "published_at" timestamp with time zone,
    "is_free" boolean default true,
    "price" numeric(10,2),
    "currency" character(3) default 'USD'::bpchar,
    "enrollment_limit" integer not null default '-1'::integer,
    "estimated_duration_hours" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "book_id" uuid,
    "subject_id" uuid,
    "grade_id" uuid,
    "language" public.language_enum not null default 'fa'::public.language_enum
      );


alter table "public"."courses" enable row level security;


  create table "public"."deck_cards" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "user_id" uuid not null,
    "flashcard_id" uuid default gen_random_uuid(),
    "ease_factor" real not null default '2.5'::real,
    "interval" smallint not null default '0'::smallint,
    "repetitions" smallint not null default '0'::smallint,
    "next_review_date" timestamp with time zone not null default now(),
    "last_reviewed_at" timestamp with time zone,
    "status" public.card_status not null default 'new'::public.card_status,
    "deck_id" uuid not null,
    "stability" real not null default '0'::real,
    "difficulty" real not null default '0'::real,
    "elapsed_days" integer not null default 0,
    "scheduled_days" integer not null default 0,
    "first_reviewed_at" timestamp with time zone
      );


alter table "public"."deck_cards" enable row level security;


  create table "public"."decks" (
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "creation" public.creation_enum not null default 'built-in'::public.creation_enum,
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "book_id" uuid,
    "daily_limit" smallint default '10'::smallint,
    "algorithm" public.flashcard_algorithm not null default 'fsrs'::public.flashcard_algorithm,
    "sm2_starting_ease" real not null default '2.5'::real,
    "sm2_easy_bonus" real not null default '1.3'::real,
    "sm2_interval_modifier" real not null default '1'::real,
    "fsrs_request_retention" real not null default '0.9'::real,
    "fsrs_maximum_interval" integer not null default 36500,
    "config" jsonb
      );


alter table "public"."decks" enable row level security;


  create table "public"."departments" (
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "faculty_id" uuid not null
      );


alter table "public"."departments" enable row level security;


  create table "public"."discussion_posts" (
    "user_id" uuid not null,
    "content" text not null,
    "is_solution" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "thread_id" uuid,
    "parent_post_id" uuid
      );


alter table "public"."discussion_posts" enable row level security;


  create table "public"."discussion_threads" (
    "user_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "is_pinned" boolean default false,
    "is_closed" boolean default false,
    "tags" text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid,
    "lesson_id" uuid
      );


alter table "public"."discussion_threads" enable row level security;


  create table "public"."enrollments" (
    "user_id" uuid not null,
    "enrolled_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "progress_percentage" smallint default 0,
    "certificate_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid,
    "last_accessed_lesson_id" uuid
      );


alter table "public"."enrollments" enable row level security;


  create table "public"."faculties" (
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid()
      );


alter table "public"."faculties" enable row level security;


  create table "public"."flashcards" (
    "question" text not null,
    "fact" text,
    "hint" text,
    "page" integer not null default 1,
    "vid_path" text,
    "answers" jsonb[] not null,
    "creation" public.creation_enum not null default 'built-in'::public.creation_enum,
    "user_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "grade_id" uuid,
    "book_id" uuid
      );


alter table "public"."flashcards" enable row level security;


  create table "public"."forms" (
    "title" text not null,
    "year" integer not null,
    "round" integer not null default 1,
    "file_path" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "province_id" uuid,
    "category_id" uuid
      );


alter table "public"."forms" enable row level security;


  create table "public"."grades" (
    "name" text not null,
    "ordering" smallint not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid
      );


alter table "public"."grades" enable row level security;


  create table "public"."leitners" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "day" smallint not null default '1'::smallint,
    "last_learn_on" date not null default now(),
    "user_id" uuid not null default gen_random_uuid(),
    "daily_limit" smallint not null default '10'::smallint,
    "boxes" smallint not null default '5'::smallint,
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "book_id" uuid,
    "deck_id" uuid
      );


alter table "public"."leitners" enable row level security;


  create table "public"."lesson_content_blocks" (
    "block_type" public.lesson_content_type not null,
    "order_index" smallint not null default 0,
    "text_content" text,
    "video_url" text,
    "video_provider" text,
    "video_transcript" text,
    "audio_url" text,
    "audio_transcript" text,
    "document_url" text,
    "external_resource_url" text,
    "external_resource_title" text,
    "code_language" text,
    "default_code" text,
    "solution_code" text,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid,
    "playlist" text,
    "slug" text
      );


alter table "public"."lesson_content_blocks" enable row level security;


  create table "public"."lesson_progress" (
    "is_completed" boolean default false,
    "completed_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone default now(),
    "video_progress_seconds" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "enrollment_id" uuid,
    "lesson_id" uuid,
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid
      );


alter table "public"."lesson_progress" enable row level security;


  create table "public"."lessons" (
    "title" text not null,
    "description" text,
    "content_type" public.lesson_content_type not null default 'video'::public.lesson_content_type,
    "order_index" smallint not null default 0,
    "estimated_duration_minutes" integer,
    "is_previewable" boolean default false,
    "is_mandatory" boolean default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "slug" text,
    "id" uuid not null default gen_random_uuid(),
    "module_id" uuid,
    "book_id" uuid,
    "course_id" uuid
      );


alter table "public"."lessons" enable row level security;


  create table "public"."libraries" (
    "title" text not null,
    "desc" text,
    "file_path" text not null,
    "uri" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid,
    "subject_id" uuid,
    "book_id" uuid,
    "grade_id" uuid
      );


alter table "public"."libraries" enable row level security;


  create table "public"."modules" (
    "title" text not null,
    "description" text,
    "order_index" smallint not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "start_page" smallint,
    "end_page" smallint,
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid,
    "book_id" uuid
      );


alter table "public"."modules" enable row level security;


  create table "public"."notes" (
    "title" text,
    "content" text not null,
    "user_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid()
      );


alter table "public"."notes" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" public.notification_type not null,
    "title" text not null,
    "message" text,
    "related_entity_type" text,
    "actor_id" uuid,
    "is_read" boolean default false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "related_entity_id" uuid
      );


alter table "public"."notifications" enable row level security;


  create table "public"."payments" (
    "user_id" uuid not null,
    "amount" numeric(10,2) not null,
    "currency" character(3) not null default 'USD'::bpchar,
    "payment_provider" text,
    "provider_transaction_id" text,
    "status" public.payment_status not null default 'pending'::public.payment_status,
    "payment_method_details" jsonb,
    "error_message" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid,
    "enrollment_id" uuid
      );


alter table "public"."payments" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text,
    "avatar_url" text,
    "bio" text,
    "website_url" text,
    "role" public.user_role not null default 'student'::public.user_role,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "email" text,
    "phone" text,
    "province_id" uuid,
    "school_id" uuid
      );


alter table "public"."profiles" enable row level security;


  create table "public"."provinces" (
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid()
      );


alter table "public"."provinces" enable row level security;


  create table "public"."question_options" (
    "option_text" text,
    "is_correct" boolean default false,
    "order_index" smallint default 0,
    "feedback" text,
    "match_target_text" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "question_id" uuid
      );


alter table "public"."question_options" enable row level security;


  create table "public"."questions" (
    "question_text" text not null,
    "question_type" public.question_type not null,
    "order_index" smallint not null default 0,
    "points" smallint default 1,
    "hint" text,
    "explanation" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "quiz_id" uuid,
    "image_content_block_id" uuid
      );


alter table "public"."questions" enable row level security;


  create table "public"."quiz_attempts" (
    "user_id" uuid not null,
    "started_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "score" numeric(6,2),
    "max_score_possible" numeric(6,2),
    "passed" boolean,
    "attempt_number" smallint not null,
    "feedback_from_instructor" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "enrollment_id" uuid,
    "quiz_id" uuid
      );


alter table "public"."quiz_attempts" enable row level security;


  create table "public"."quizzes" (
    "title" text not null,
    "description" text,
    "time_limit_minutes" integer,
    "passing_score_percentage" smallint,
    "max_attempts" smallint default 1,
    "shuffle_questions" boolean default false,
    "show_correct_answers_after" public.show_correct_answers default 'attempt'::public.show_correct_answers,
    "instructions" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "school_id" uuid,
    "entrance_code" integer generated by default as identity not null,
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid
      );


alter table "public"."quizzes" enable row level security;


  create table "public"."reviews" (
    "user_id" uuid not null,
    "rating" smallint not null,
    "title" text,
    "comment" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid
      );


alter table "public"."reviews" enable row level security;


  create table "public"."schools" (
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "address" text,
    "manager" uuid default gen_random_uuid(),
    "admin_email" text,
    "id" uuid not null default gen_random_uuid(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."schools" enable row level security;


  create table "public"."subjects" (
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid()
      );


alter table "public"."subjects" enable row level security;


  create table "public"."tags" (
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tags" enable row level security;


  create table "public"."universities" (
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "province_id" uuid
      );


alter table "public"."universities" enable row level security;


  create table "public"."universities_faculties" (
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid(),
    "university_id" uuid,
    "faculty_id" uuid
      );


alter table "public"."universities_faculties" enable row level security;

CREATE UNIQUE INDEX answer_sheets_pkey ON public.answer_sheets USING btree (id);

CREATE UNIQUE INDEX answers_pkey ON public.answers USING btree (id);

CREATE INDEX answers_updated_at ON public.answers USING btree (updated_at DESC);

CREATE UNIQUE INDEX bookmarks_pkey ON public.bookmarks USING btree (id);

CREATE INDEX bookmarks_updated_at ON public.bookmarks USING btree (updated_at DESC);

CREATE UNIQUE INDEX books_pk_key ON public.books USING btree (id);

CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id);

CREATE INDEX books_updated_at ON public.books USING btree (updated_at DESC);

CREATE INDEX categories_parent ON public.categories USING hash (parent);

CREATE UNIQUE INDEX categories_pk_key ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE INDEX categories_updated_at ON public.categories USING btree (updated_at DESC);

CREATE UNIQUE INDEX certificates_pkey ON public.certificates USING btree (id);

CREATE INDEX certificates_updated_at ON public.certificates USING btree (updated_at DESC);

CREATE UNIQUE INDEX certificates_verification_code_key ON public.certificates USING btree (verification_code);

CREATE UNIQUE INDEX code_id_key ON public.code USING btree (id);

CREATE UNIQUE INDEX code_pkey ON public.code USING btree (code, id);

CREATE INDEX code_updated_at ON public.code USING btree (updated_at DESC);

CREATE UNIQUE INDEX courses_pk_key ON public.courses USING btree (id);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX courses_slug_key ON public.courses USING btree (slug);

CREATE INDEX courses_updated_at ON public.courses USING btree (updated_at DESC);

CREATE UNIQUE INDEX deck_cards_pkey ON public.deck_cards USING btree (id);

CREATE UNIQUE INDEX decks_pk_key ON public.decks USING btree (id);

CREATE UNIQUE INDEX decks_pkey ON public.decks USING btree (id);

CREATE INDEX decks_updated_at ON public.decks USING btree (updated_at DESC);

CREATE UNIQUE INDEX departments_pk_key ON public.departments USING btree (id);

CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id);

CREATE INDEX departments_updated_at ON public.departments USING btree (updated_at DESC);

CREATE UNIQUE INDEX discussion_posts_pk_key ON public.discussion_posts USING btree (id);

CREATE UNIQUE INDEX discussion_posts_pkey ON public.discussion_posts USING btree (id);

CREATE INDEX discussion_posts_updated_at ON public.discussion_posts USING btree (updated_at DESC);

CREATE UNIQUE INDEX discussion_threads_pj_key ON public.discussion_threads USING btree (id);

CREATE UNIQUE INDEX discussion_threads_pkey ON public.discussion_threads USING btree (id);

CREATE INDEX discussion_threads_updated_at ON public.discussion_threads USING btree (updated_at DESC);

CREATE UNIQUE INDEX enrollments_pk_key ON public.enrollments USING btree (id);

CREATE UNIQUE INDEX enrollments_pkey ON public.enrollments USING btree (id);

CREATE INDEX enrollments_updated_at ON public.enrollments USING btree (updated_at DESC);

CREATE UNIQUE INDEX faculties_pk_key ON public.faculties USING btree (id);

CREATE UNIQUE INDEX faculties_pkey ON public.faculties USING btree (id);

CREATE INDEX faculties_updated_at ON public.faculties USING btree (updated_at DESC);

CREATE UNIQUE INDEX flashcards_pk_key ON public.flashcards USING btree (id);

CREATE UNIQUE INDEX flashcards_pkey ON public.flashcards USING btree (id);

CREATE INDEX flashcards_updated_at ON public.flashcards USING btree (updated_at DESC);

CREATE UNIQUE INDEX forms_pk_key ON public.forms USING btree (id);

CREATE UNIQUE INDEX forms_pkey ON public.forms USING btree (id);

CREATE INDEX forms_updated_at ON public.forms USING btree (updated_at DESC);

CREATE UNIQUE INDEX grades_pk_key ON public.grades USING btree (id);

CREATE UNIQUE INDEX grades_pkey ON public.grades USING btree (id);

CREATE INDEX grades_updated_at ON public.grades USING btree (updated_at DESC);

CREATE INDEX idx_answers_created_at ON public.answers USING btree (created_at);

CREATE INDEX idx_answers_is_correct ON public.answers USING btree (is_correct);

CREATE INDEX idx_answers_question_correct ON public.answers USING btree (question_id, is_correct);

CREATE INDEX idx_answers_question_id ON public.answers USING btree (question_id);

CREATE INDEX idx_answers_quiz_attempt_id ON public.answers USING btree (quiz_attempt_id);

CREATE INDEX idx_answers_quiz_attempt_question ON public.answers USING btree (quiz_attempt_id, question_id);

CREATE INDEX idx_answers_submitted_at ON public.answers USING btree (submitted_at);

CREATE INDEX idx_bookmarks_created_at ON public.bookmarks USING btree (created_at);

CREATE INDEX idx_bookmarks_item_type ON public.bookmarks USING btree (item_type);

CREATE INDEX idx_bookmarks_question_id ON public.bookmarks USING btree (item_id);

CREATE INDEX idx_bookmarks_user_created ON public.bookmarks USING btree (user_id, created_at DESC);

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks USING btree (user_id);

CREATE INDEX idx_bookmarks_user_item_type ON public.bookmarks USING btree (user_id, item_type);

CREATE INDEX idx_books_created_at ON public.books USING btree (created_at);

CREATE INDEX idx_books_full_name ON public.books USING btree (full_name);

CREATE INDEX idx_books_grade_id ON public.books USING btree (grade_id);

CREATE INDEX idx_books_grade_subject ON public.books USING btree (grade_id, subject_id);

CREATE INDEX idx_books_name ON public.books USING btree (name);

CREATE INDEX idx_books_name_grade ON public.books USING btree (name, grade_id);

CREATE INDEX idx_books_subject_id ON public.books USING btree (subject_id);

CREATE INDEX idx_categories_created_at ON public.categories USING btree (created_at);

CREATE INDEX idx_categories_name ON public.categories USING btree (name);

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent);

CREATE INDEX idx_categories_parent_name ON public.categories USING btree (parent, name);

CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);

CREATE INDEX idx_certificates_course_id ON public.certificates USING btree (course_id);

CREATE INDEX idx_certificates_course_issued ON public.certificates USING btree (course_id, issued_at DESC);

CREATE INDEX idx_certificates_created_at ON public.certificates USING btree (created_at);

CREATE INDEX idx_certificates_issued_at ON public.certificates USING btree (issued_at);

CREATE INDEX idx_certificates_user_course ON public.certificates USING btree (user_id, course_id);

CREATE INDEX idx_certificates_user_id ON public.certificates USING btree (user_id);

CREATE INDEX idx_certificates_verification_code ON public.certificates USING btree (verification_code);

CREATE INDEX idx_code_code ON public.code USING btree (code);

CREATE INDEX idx_code_created_at ON public.code USING btree (created_at);

CREATE INDEX idx_code_department_id ON public.code USING btree (department_id);

CREATE INDEX idx_code_max_score ON public.code USING btree (max_score);

CREATE INDEX idx_code_min_score ON public.code USING btree (min_score);

CREATE INDEX idx_code_score_range ON public.code USING btree (min_score, max_score);

CREATE INDEX idx_code_university_department ON public.code USING btree (university_id, department_id);

CREATE INDEX idx_code_university_id ON public.code USING btree (university_id);

CREATE INDEX idx_courses_book_id ON public.courses USING btree (book_id);

CREATE INDEX idx_courses_created_at ON public.courses USING btree (created_at);

CREATE INDEX idx_courses_created_published ON public.courses USING btree (created_at DESC, is_published);

CREATE INDEX idx_courses_grade_id ON public.courses USING btree (grade_id);

CREATE INDEX idx_courses_instructor_id ON public.courses USING btree (instructor_id);

CREATE INDEX idx_courses_instructor_published ON public.courses USING btree (instructor_id, is_published);

CREATE INDEX idx_courses_is_free ON public.courses USING btree (is_free);

CREATE INDEX idx_courses_is_published ON public.courses USING btree (is_published);

CREATE INDEX idx_courses_level ON public.courses USING btree (level);

CREATE INDEX idx_courses_price ON public.courses USING btree (price);

CREATE INDEX idx_courses_price_free ON public.courses USING btree (is_free, price);

CREATE INDEX idx_courses_published ON public.courses USING btree (is_published);

CREATE INDEX idx_courses_published_at ON public.courses USING btree (published_at);

CREATE INDEX idx_courses_published_level ON public.courses USING btree (is_published, level);

CREATE INDEX idx_courses_slug ON public.courses USING btree (slug);

CREATE INDEX idx_courses_subject_id ON public.courses USING btree (subject_id);

CREATE INDEX idx_courses_subject_published ON public.courses USING btree (subject_id, is_published);

CREATE INDEX idx_courses_title ON public.courses USING btree (title);

CREATE INDEX idx_decks_created_at ON public.decks USING btree (created_at);

CREATE INDEX idx_decks_creation ON public.decks USING btree (creation);

CREATE INDEX idx_decks_name ON public.decks USING btree (name);

CREATE INDEX idx_decks_user_created ON public.decks USING btree (user_id, created_at DESC);

CREATE INDEX idx_decks_user_creation ON public.decks USING btree (user_id, creation);

CREATE INDEX idx_decks_user_id ON public.decks USING btree (user_id);

CREATE INDEX idx_departments_created_at ON public.departments USING btree (created_at);

CREATE INDEX idx_departments_faculty_id ON public.departments USING btree (faculty_id);

CREATE INDEX idx_departments_faculty_name ON public.departments USING btree (faculty_id, name);

CREATE INDEX idx_departments_name ON public.departments USING btree (name);

CREATE INDEX idx_discussion_posts_created_at ON public.discussion_posts USING btree (created_at);

CREATE INDEX idx_discussion_posts_is_solution ON public.discussion_posts USING btree (is_solution);

CREATE INDEX idx_discussion_posts_parent_created ON public.discussion_posts USING btree (parent_post_id, created_at DESC);

CREATE INDEX idx_discussion_posts_parent_post_id ON public.discussion_posts USING btree (parent_post_id);

CREATE INDEX idx_discussion_posts_thread_created ON public.discussion_posts USING btree (thread_id, created_at DESC);

CREATE INDEX idx_discussion_posts_thread_id ON public.discussion_posts USING btree (thread_id);

CREATE INDEX idx_discussion_posts_user_created ON public.discussion_posts USING btree (user_id, created_at DESC);

CREATE INDEX idx_discussion_posts_user_id ON public.discussion_posts USING btree (user_id);

CREATE INDEX idx_discussion_threads_course_created ON public.discussion_threads USING btree (course_id, created_at DESC);

CREATE INDEX idx_discussion_threads_course_id ON public.discussion_threads USING btree (course_id);

CREATE INDEX idx_discussion_threads_created_at ON public.discussion_threads USING btree (created_at);

CREATE INDEX idx_discussion_threads_is_closed ON public.discussion_threads USING btree (is_closed);

CREATE INDEX idx_discussion_threads_is_pinned ON public.discussion_threads USING btree (is_pinned);

CREATE INDEX idx_discussion_threads_lesson_id ON public.discussion_threads USING btree (lesson_id);

CREATE INDEX idx_discussion_threads_pinned_closed ON public.discussion_threads USING btree (is_pinned DESC, is_closed, created_at DESC);

CREATE INDEX idx_discussion_threads_title ON public.discussion_threads USING btree (title);

CREATE INDEX idx_discussion_threads_user_created ON public.discussion_threads USING btree (user_id, created_at DESC);

CREATE INDEX idx_discussion_threads_user_id ON public.discussion_threads USING btree (user_id);

CREATE INDEX idx_enrollments_certificate_id ON public.enrollments USING btree (certificate_id);

CREATE INDEX idx_enrollments_completed_at ON public.enrollments USING btree (completed_at);

CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);

CREATE INDEX idx_enrollments_course_progress ON public.enrollments USING btree (course_id, progress_percentage DESC);

CREATE INDEX idx_enrollments_created_at ON public.enrollments USING btree (created_at);

CREATE INDEX idx_enrollments_enrolled_at ON public.enrollments USING btree (enrolled_at);

CREATE INDEX idx_enrollments_last_accessed_lesson_id ON public.enrollments USING btree (last_accessed_lesson_id);

CREATE INDEX idx_enrollments_progress_percentage ON public.enrollments USING btree (progress_percentage);

CREATE INDEX idx_enrollments_user_completed ON public.enrollments USING btree (user_id, completed_at DESC);

CREATE INDEX idx_enrollments_user_course ON public.enrollments USING btree (user_id, course_id);

CREATE INDEX idx_enrollments_user_id ON public.enrollments USING btree (user_id);

CREATE INDEX idx_faculties_created_at ON public.faculties USING btree (created_at);

CREATE INDEX idx_faculties_name ON public.faculties USING btree (name);

CREATE INDEX idx_flashcards_book_id ON public.flashcards USING btree (book_id);

CREATE INDEX idx_flashcards_book_page ON public.flashcards USING btree (book_id, page);

CREATE INDEX idx_flashcards_created_at ON public.flashcards USING btree (created_at);

CREATE INDEX idx_flashcards_creation ON public.flashcards USING btree (creation);

CREATE INDEX idx_flashcards_grade_id ON public.flashcards USING btree (grade_id);

CREATE INDEX idx_flashcards_page ON public.flashcards USING btree (page);

CREATE INDEX idx_flashcards_question ON public.flashcards USING btree (question);

CREATE INDEX idx_flashcards_user_creation ON public.flashcards USING btree (user_id, creation);

CREATE INDEX idx_flashcards_user_id ON public.flashcards USING btree (user_id);

CREATE INDEX idx_forms_category_id ON public.forms USING btree (category_id);

CREATE INDEX idx_forms_category_year ON public.forms USING btree (category_id, year DESC);

CREATE INDEX idx_forms_created_at ON public.forms USING btree (created_at);

CREATE INDEX idx_forms_province_id ON public.forms USING btree (province_id);

CREATE INDEX idx_forms_province_year ON public.forms USING btree (province_id, year DESC);

CREATE INDEX idx_forms_round ON public.forms USING btree (round);

CREATE INDEX idx_forms_title ON public.forms USING btree (title);

CREATE INDEX idx_forms_year ON public.forms USING btree (year);

CREATE INDEX idx_forms_year_round ON public.forms USING btree (year, round);

CREATE INDEX idx_grades_category_id ON public.grades USING btree (category_id);

CREATE INDEX idx_grades_category_ordering ON public.grades USING btree (category_id, ordering);

CREATE INDEX idx_grades_created_at ON public.grades USING btree (created_at);

CREATE INDEX idx_grades_name ON public.grades USING btree (name);

CREATE INDEX idx_grades_ordering ON public.grades USING btree (ordering);

CREATE INDEX idx_leitners_book_id ON public.leitners USING btree (book_id);

CREATE INDEX idx_leitners_created_at ON public.leitners USING btree (created_at);

CREATE INDEX idx_leitners_day ON public.leitners USING btree (day);

CREATE INDEX idx_leitners_deck_created ON public.leitners USING btree (deck_id, created_at DESC);

CREATE INDEX idx_leitners_deck_id ON public.leitners USING btree (deck_id);

CREATE INDEX idx_leitners_last_learn_on ON public.leitners USING btree (last_learn_on);

CREATE INDEX idx_leitners_name ON public.leitners USING btree (name);

CREATE INDEX idx_leitners_user_day ON public.leitners USING btree (user_id, day);

CREATE INDEX idx_leitners_user_id ON public.leitners USING btree (user_id);

CREATE INDEX idx_leitners_user_last_learn ON public.leitners USING btree (user_id, last_learn_on DESC);

CREATE INDEX idx_lesson_content_blocks_block_type ON public.lesson_content_blocks USING btree (block_type);

CREATE INDEX idx_lesson_content_blocks_created_at ON public.lesson_content_blocks USING btree (created_at);

CREATE INDEX idx_lesson_content_blocks_lesson_id ON public.lesson_content_blocks USING btree (lesson_id);

CREATE INDEX idx_lesson_content_blocks_lesson_order ON public.lesson_content_blocks USING btree (lesson_id, order_index);

CREATE INDEX idx_lesson_content_blocks_lesson_type ON public.lesson_content_blocks USING btree (lesson_id, block_type);

CREATE INDEX idx_lesson_content_blocks_order_index ON public.lesson_content_blocks USING btree (order_index);

CREATE INDEX idx_lesson_progress_completed_at ON public.lesson_progress USING btree (completed_at);

CREATE INDEX idx_lesson_progress_created_at ON public.lesson_progress USING btree (created_at);

CREATE INDEX idx_lesson_progress_enrollment_completed ON public.lesson_progress USING btree (enrollment_id, is_completed);

CREATE INDEX idx_lesson_progress_enrollment_id ON public.lesson_progress USING btree (enrollment_id);

CREATE INDEX idx_lesson_progress_enrollment_lesson ON public.lesson_progress USING btree (enrollment_id, lesson_id);

CREATE INDEX idx_lesson_progress_is_completed ON public.lesson_progress USING btree (is_completed);

CREATE INDEX idx_lesson_progress_last_accessed_at ON public.lesson_progress USING btree (last_accessed_at);

CREATE INDEX idx_lesson_progress_lesson_completed ON public.lesson_progress USING btree (lesson_id, is_completed);

CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress USING btree (lesson_id);

CREATE INDEX idx_lesson_progress_video_progress_seconds ON public.lesson_progress USING btree (video_progress_seconds);

CREATE INDEX idx_lessons_book_id ON public.lessons USING btree (book_id);

CREATE INDEX idx_lessons_book_order ON public.lessons USING btree (book_id, order_index);

CREATE INDEX idx_lessons_content_type ON public.lessons USING btree (content_type);

CREATE INDEX idx_lessons_created_at ON public.lessons USING btree (created_at);

CREATE INDEX idx_lessons_is_mandatory ON public.lessons USING btree (is_mandatory);

CREATE INDEX idx_lessons_is_previewable ON public.lessons USING btree (is_previewable);

CREATE INDEX idx_lessons_module_id ON public.lessons USING btree (module_id);

CREATE INDEX idx_lessons_module_mandatory ON public.lessons USING btree (module_id, is_mandatory);

CREATE INDEX idx_lessons_module_order ON public.lessons USING btree (module_id, order_index);

CREATE INDEX idx_lessons_order_index ON public.lessons USING btree (order_index);

CREATE INDEX idx_lessons_slug ON public.lessons USING btree (slug);

CREATE INDEX idx_lessons_title ON public.lessons USING btree (title);

CREATE INDEX idx_libraries_book_id ON public.libraries USING btree (book_id);

CREATE INDEX idx_libraries_category_grade ON public.libraries USING btree (category_id, grade_id);

CREATE INDEX idx_libraries_category_id ON public.libraries USING btree (category_id);

CREATE INDEX idx_libraries_created_at ON public.libraries USING btree (created_at);

CREATE INDEX idx_libraries_grade_id ON public.libraries USING btree (grade_id);

CREATE INDEX idx_libraries_grade_subject ON public.libraries USING btree (grade_id, subject_id);

CREATE INDEX idx_libraries_subject_id ON public.libraries USING btree (subject_id);

CREATE INDEX idx_libraries_title ON public.libraries USING btree (title);

CREATE INDEX idx_libraries_title_grade ON public.libraries USING btree (title, grade_id);

CREATE INDEX idx_libraries_uri ON public.libraries USING btree (uri);

CREATE INDEX idx_modules_book_id ON public.modules USING btree (book_id);

CREATE INDEX idx_modules_book_order ON public.modules USING btree (book_id, order_index);

CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);

CREATE INDEX idx_modules_course_order ON public.modules USING btree (course_id, order_index);

CREATE INDEX idx_modules_created_at ON public.modules USING btree (created_at);

CREATE INDEX idx_modules_end_page ON public.modules USING btree (end_page);

CREATE INDEX idx_modules_order_index ON public.modules USING btree (order_index);

CREATE INDEX idx_modules_start_page ON public.modules USING btree (start_page);

CREATE INDEX idx_modules_title ON public.modules USING btree (title);

CREATE INDEX idx_notes_created_at ON public.notes USING btree (created_at);

CREATE INDEX idx_notes_title ON public.notes USING btree (title);

CREATE INDEX idx_notes_user_created ON public.notes USING btree (user_id, created_at DESC);

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);

CREATE INDEX idx_notes_user_title ON public.notes USING btree (user_id, title);

CREATE INDEX idx_notifications_actor_id ON public.notifications USING btree (actor_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notifications_entity_type_id ON public.notifications USING btree (related_entity_type, related_entity_id);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_notifications_read_at ON public.notifications USING btree (read_at);

CREATE INDEX idx_notifications_related_entity_id ON public.notifications USING btree (related_entity_id);

CREATE INDEX idx_notifications_related_entity_type ON public.notifications USING btree (related_entity_type);

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_notifications_user_type ON public.notifications USING btree (user_id, type);

CREATE INDEX idx_payments_amount ON public.payments USING btree (amount);

CREATE INDEX idx_payments_course_id ON public.payments USING btree (course_id);

CREATE INDEX idx_payments_course_status ON public.payments USING btree (course_id, status);

CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at);

CREATE INDEX idx_payments_currency ON public.payments USING btree (currency);

CREATE INDEX idx_payments_enrollment_id ON public.payments USING btree (enrollment_id);

CREATE INDEX idx_payments_payment_provider ON public.payments USING btree (payment_provider);

CREATE INDEX idx_payments_provider_transaction_id ON public.payments USING btree (provider_transaction_id);

CREATE INDEX idx_payments_status ON public.payments USING btree (status);

CREATE INDEX idx_payments_status_created ON public.payments USING btree (status, created_at DESC);

CREATE INDEX idx_payments_user_created ON public.payments USING btree (user_id, created_at DESC);

CREATE INDEX idx_payments_user_id ON public.payments USING btree (user_id);

CREATE INDEX idx_payments_user_status ON public.payments USING btree (user_id, status);

CREATE INDEX idx_profiles_created_at ON public.profiles USING btree (created_at);

CREATE INDEX idx_profiles_full_name ON public.profiles USING btree (full_name);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_profiles_role_created ON public.profiles USING btree (role, created_at DESC);

CREATE INDEX idx_provinces_created_at ON public.provinces USING btree (created_at);

CREATE INDEX idx_provinces_name ON public.provinces USING btree (name);

CREATE INDEX idx_question_options_created_at ON public.question_options USING btree (created_at);

CREATE INDEX idx_question_options_is_correct ON public.question_options USING btree (is_correct);

CREATE INDEX idx_question_options_order_index ON public.question_options USING btree (order_index);

CREATE INDEX idx_question_options_question_correct ON public.question_options USING btree (question_id, is_correct);

CREATE INDEX idx_question_options_question_id ON public.question_options USING btree (question_id);

CREATE INDEX idx_question_options_question_order ON public.question_options USING btree (question_id, order_index);

CREATE INDEX idx_questions_created_at ON public.questions USING btree (created_at);

CREATE INDEX idx_questions_image_content_block_id ON public.questions USING btree (image_content_block_id);

CREATE INDEX idx_questions_order_index ON public.questions USING btree (order_index);

CREATE INDEX idx_questions_points ON public.questions USING btree (points);

CREATE INDEX idx_questions_question_text ON public.questions USING btree (question_text);

CREATE INDEX idx_questions_question_type ON public.questions USING btree (question_type);

CREATE INDEX idx_questions_quiz_id ON public.questions USING btree (quiz_id);

CREATE INDEX idx_questions_quiz_order ON public.questions USING btree (quiz_id, order_index);

CREATE INDEX idx_questions_quiz_type ON public.questions USING btree (quiz_id, question_type);

CREATE INDEX idx_questions_type_points ON public.questions USING btree (question_type, points DESC);

CREATE INDEX idx_quiz_attempts_attempt_number ON public.quiz_attempts USING btree (attempt_number);

CREATE INDEX idx_quiz_attempts_completed_at ON public.quiz_attempts USING btree (completed_at);

CREATE INDEX idx_quiz_attempts_created_at ON public.quiz_attempts USING btree (created_at);

CREATE INDEX idx_quiz_attempts_enrollment_id ON public.quiz_attempts USING btree (enrollment_id);

CREATE INDEX idx_quiz_attempts_passed ON public.quiz_attempts USING btree (passed);

CREATE INDEX idx_quiz_attempts_quiz_attempt_number ON public.quiz_attempts USING btree (quiz_id, attempt_number);

CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts USING btree (quiz_id);

CREATE INDEX idx_quiz_attempts_quiz_score ON public.quiz_attempts USING btree (quiz_id, score DESC);

CREATE INDEX idx_quiz_attempts_score ON public.quiz_attempts USING btree (score);

CREATE INDEX idx_quiz_attempts_started_at ON public.quiz_attempts USING btree (started_at);

CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts USING btree (user_id);

CREATE INDEX idx_quiz_attempts_user_passed ON public.quiz_attempts USING btree (user_id, passed);

CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts USING btree (user_id, quiz_id);

CREATE INDEX idx_quizzes_created_at ON public.quizzes USING btree (created_at);

CREATE INDEX idx_quizzes_entrance_code ON public.quizzes USING btree (entrance_code);

CREATE INDEX idx_quizzes_lesson_created ON public.quizzes USING btree (lesson_id, created_at DESC);

CREATE INDEX idx_quizzes_lesson_id ON public.quizzes USING btree (lesson_id);

CREATE INDEX idx_quizzes_max_attempts ON public.quizzes USING btree (max_attempts);

CREATE INDEX idx_quizzes_passing_score_percentage ON public.quizzes USING btree (passing_score_percentage);

CREATE INDEX idx_quizzes_school_created ON public.quizzes USING btree (school_id, created_at DESC);

CREATE INDEX idx_quizzes_school_id ON public.quizzes USING btree (school_id);

CREATE INDEX idx_quizzes_show_correct_answers_after ON public.quizzes USING btree (show_correct_answers_after);

CREATE INDEX idx_quizzes_shuffle_questions ON public.quizzes USING btree (shuffle_questions);

CREATE INDEX idx_quizzes_time_limit_minutes ON public.quizzes USING btree (time_limit_minutes);

CREATE INDEX idx_quizzes_title ON public.quizzes USING btree (title);

CREATE INDEX idx_reviews_course_created ON public.reviews USING btree (course_id, created_at DESC);

CREATE INDEX idx_reviews_course_id ON public.reviews USING btree (course_id);

CREATE INDEX idx_reviews_course_rating ON public.reviews USING btree (course_id, rating DESC);

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at);

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);

CREATE INDEX idx_reviews_title ON public.reviews USING btree (title);

CREATE INDEX idx_reviews_user_created ON public.reviews USING btree (user_id, created_at DESC);

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);

CREATE INDEX idx_schools_admin_email ON public.schools USING btree (admin_email);

CREATE INDEX idx_schools_created_at ON public.schools USING btree (created_at);

CREATE INDEX idx_schools_manager ON public.schools USING btree (manager);

CREATE INDEX idx_schools_manager_created ON public.schools USING btree (manager, created_at DESC);

CREATE INDEX idx_schools_name ON public.schools USING btree (name);

CREATE INDEX idx_subjects_created_at ON public.subjects USING btree (created_at);

CREATE INDEX idx_subjects_name ON public.subjects USING btree (name);

CREATE INDEX idx_tags_created_at ON public.tags USING btree (created_at);

CREATE INDEX idx_tags_name ON public.tags USING btree (name);

CREATE INDEX idx_universities_created_at ON public.universities USING btree (created_at);

CREATE INDEX idx_universities_faculties_created_at ON public.universities_faculties USING btree (created_at);

CREATE INDEX idx_universities_faculties_faculty_id ON public.universities_faculties USING btree (faculty_id);

CREATE INDEX idx_universities_faculties_university_faculty ON public.universities_faculties USING btree (university_id, faculty_id);

CREATE INDEX idx_universities_faculties_university_id ON public.universities_faculties USING btree (university_id);

CREATE INDEX idx_universities_name ON public.universities USING btree (name);

CREATE INDEX idx_universities_province_id ON public.universities USING btree (province_id);

CREATE INDEX idx_universities_province_name ON public.universities USING btree (province_id, name);

CREATE UNIQUE INDEX leitners_pk_key ON public.leitners USING btree (id);

CREATE UNIQUE INDEX leitners_pkey ON public.leitners USING btree (id);

CREATE INDEX leitners_updated_at ON public.leitners USING btree (updated_at DESC);

CREATE UNIQUE INDEX lesson_content_blocks_pk_key ON public.lesson_content_blocks USING btree (id);

CREATE UNIQUE INDEX lesson_content_blocks_pkey ON public.lesson_content_blocks USING btree (id);

CREATE UNIQUE INDEX lesson_content_blocks_slug_key ON public.lesson_content_blocks USING btree (slug);

CREATE INDEX lesson_content_blocks_updated_at ON public.lesson_content_blocks USING btree (updated_at DESC);

CREATE UNIQUE INDEX lesson_progress_id_key ON public.lesson_progress USING btree (id);

CREATE UNIQUE INDEX lesson_progress_pkey ON public.lesson_progress USING btree (id);

CREATE INDEX lesson_progress_updated_at ON public.lesson_progress USING btree (updated_at DESC);

CREATE UNIQUE INDEX lessons_pk_key ON public.lessons USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX lessons_slug_key ON public.lessons USING btree (slug);

CREATE INDEX lessons_updated_at ON public.lessons USING btree (updated_at DESC);

CREATE UNIQUE INDEX libraries_pk_key ON public.libraries USING btree (id);

CREATE UNIQUE INDEX libraries_pkey ON public.libraries USING btree (id);

CREATE INDEX libraries_updated_at ON public.libraries USING btree (updated_at DESC);

CREATE UNIQUE INDEX modules_pk_key ON public.modules USING btree (id);

CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);

CREATE INDEX modules_updated_at ON public.modules USING btree (updated_at DESC);

CREATE UNIQUE INDEX notes_pk_key ON public.notes USING btree (id);

CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);

CREATE INDEX notes_updated_at ON public.notes USING btree (updated_at DESC);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX notifications_updated_at ON public.notifications USING btree (updated_at DESC);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_provider_transaction_id_key ON public.payments USING btree (provider_transaction_id);

CREATE INDEX payments_updated_at ON public.payments USING btree (updated_at DESC);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_phone_key ON public.profiles USING btree (phone);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX profiles_updated_at ON public.profiles USING btree (updated_at DESC);

CREATE UNIQUE INDEX provinces_pk_key ON public.provinces USING btree (id);

CREATE UNIQUE INDEX provinces_pkey ON public.provinces USING btree (id);

CREATE INDEX provinces_updated_at ON public.provinces USING btree (updated_at DESC);

CREATE UNIQUE INDEX question_options_pk_key ON public.question_options USING btree (id);

CREATE UNIQUE INDEX question_options_pkey ON public.question_options USING btree (id);

CREATE INDEX question_options_updated_at ON public.question_options USING btree (updated_at DESC);

CREATE UNIQUE INDEX questions_pk_key ON public.questions USING btree (id);

CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

CREATE INDEX questions_updated_at ON public.questions USING btree (updated_at DESC);

CREATE UNIQUE INDEX quiz_attempts_pk_key ON public.quiz_attempts USING btree (id);

CREATE UNIQUE INDEX quiz_attempts_pkey ON public.quiz_attempts USING btree (id);

CREATE INDEX quiz_attempts_updated_at ON public.quiz_attempts USING btree (updated_at DESC);

CREATE UNIQUE INDEX quizzes_entrance_code_key ON public.quizzes USING btree (entrance_code);

CREATE UNIQUE INDEX quizzes_pk_key ON public.quizzes USING btree (id);

CREATE UNIQUE INDEX quizzes_pkey ON public.quizzes USING btree (id);

CREATE INDEX quizzes_updated_at ON public.quizzes USING btree (updated_at DESC);

CREATE UNIQUE INDEX reviews_id_key ON public.reviews USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE INDEX reviews_updated_at ON public.reviews USING btree (updated_at DESC);

CREATE UNIQUE INDEX schools_pk_key ON public.schools USING btree (id);

CREATE UNIQUE INDEX schools_pkey ON public.schools USING btree (id);

CREATE INDEX schools_updated_at ON public.schools USING btree (updated_at DESC);

CREATE UNIQUE INDEX subjects_pk_key ON public.subjects USING btree (id);

CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id);

CREATE INDEX subjects_updated_at ON public.subjects USING btree (updated_at DESC);

CREATE UNIQUE INDEX tags_id_key ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE INDEX tags_updated_at ON public.tags USING btree (updated_at DESC);

CREATE UNIQUE INDEX universities_faculties_pk_key ON public.universities_faculties USING btree (id);

CREATE UNIQUE INDEX universities_faculties_pkey ON public.universities_faculties USING btree (id);

CREATE INDEX universities_faculties_updated_at ON public.universities_faculties USING btree (updated_at DESC);

CREATE UNIQUE INDEX universities_pk_key ON public.universities USING btree (id);

CREATE UNIQUE INDEX universities_pkey ON public.universities USING btree (id);

CREATE INDEX universities_updated_at ON public.universities USING btree (updated_at DESC);

alter table "public"."answer_sheets" add constraint "answer_sheets_pkey" PRIMARY KEY using index "answer_sheets_pkey";

alter table "public"."answers" add constraint "answers_pkey" PRIMARY KEY using index "answers_pkey";

alter table "public"."bookmarks" add constraint "bookmarks_pkey" PRIMARY KEY using index "bookmarks_pkey";

alter table "public"."books" add constraint "books_pkey" PRIMARY KEY using index "books_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."certificates" add constraint "certificates_pkey" PRIMARY KEY using index "certificates_pkey";

alter table "public"."code" add constraint "code_pkey" PRIMARY KEY using index "code_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."deck_cards" add constraint "deck_cards_pkey" PRIMARY KEY using index "deck_cards_pkey";

alter table "public"."decks" add constraint "decks_pkey" PRIMARY KEY using index "decks_pkey";

alter table "public"."departments" add constraint "departments_pkey" PRIMARY KEY using index "departments_pkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_pkey" PRIMARY KEY using index "discussion_posts_pkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_pkey" PRIMARY KEY using index "discussion_threads_pkey";

alter table "public"."enrollments" add constraint "enrollments_pkey" PRIMARY KEY using index "enrollments_pkey";

alter table "public"."faculties" add constraint "faculties_pkey" PRIMARY KEY using index "faculties_pkey";

alter table "public"."flashcards" add constraint "flashcards_pkey" PRIMARY KEY using index "flashcards_pkey";

alter table "public"."forms" add constraint "forms_pkey" PRIMARY KEY using index "forms_pkey";

alter table "public"."grades" add constraint "grades_pkey" PRIMARY KEY using index "grades_pkey";

alter table "public"."leitners" add constraint "leitners_pkey" PRIMARY KEY using index "leitners_pkey";

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_pkey" PRIMARY KEY using index "lesson_content_blocks_pkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_pkey" PRIMARY KEY using index "lesson_progress_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."libraries" add constraint "libraries_pkey" PRIMARY KEY using index "libraries_pkey";

alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";

alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."provinces" add constraint "provinces_pkey" PRIMARY KEY using index "provinces_pkey";

alter table "public"."question_options" add constraint "question_options_pkey" PRIMARY KEY using index "question_options_pkey";

alter table "public"."questions" add constraint "questions_pkey" PRIMARY KEY using index "questions_pkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_pkey" PRIMARY KEY using index "quiz_attempts_pkey";

alter table "public"."quizzes" add constraint "quizzes_pkey" PRIMARY KEY using index "quizzes_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."schools" add constraint "schools_pkey" PRIMARY KEY using index "schools_pkey";

alter table "public"."subjects" add constraint "subjects_pkey" PRIMARY KEY using index "subjects_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."universities" add constraint "universities_pkey" PRIMARY KEY using index "universities_pkey";

alter table "public"."universities_faculties" add constraint "universities_faculties_pkey" PRIMARY KEY using index "universities_faculties_pkey";

alter table "public"."answer_sheets" add constraint "answer_sheets_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."answer_sheets" validate constraint "answer_sheets_lesson_id_fkey";

alter table "public"."answers" add constraint "answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) not valid;

alter table "public"."answers" validate constraint "answers_question_id_fkey";

alter table "public"."answers" add constraint "answers_quiz_attempt_id_fkey" FOREIGN KEY (quiz_attempt_id) REFERENCES public.quiz_attempts(id) not valid;

alter table "public"."answers" validate constraint "answers_quiz_attempt_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_user_id_fkey";

alter table "public"."books" add constraint "books_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."books" validate constraint "books_grade_id_fkey";

alter table "public"."books" add constraint "books_grade_id_fkey1" FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL not valid;

alter table "public"."books" validate constraint "books_grade_id_fkey1";

alter table "public"."books" add constraint "books_pk_key" UNIQUE using index "books_pk_key";

alter table "public"."books" add constraint "books_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) not valid;

alter table "public"."books" validate constraint "books_subject_id_fkey";

alter table "public"."categories" add constraint "categories_parent_fkey" FOREIGN KEY (parent) REFERENCES public.categories(id) not valid;

alter table "public"."categories" validate constraint "categories_parent_fkey";

alter table "public"."categories" add constraint "categories_pk_key" UNIQUE using index "categories_pk_key";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."certificates" add constraint "certificates_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."certificates" validate constraint "certificates_course_id_fkey";

alter table "public"."certificates" add constraint "certificates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."certificates" validate constraint "certificates_user_id_fkey";

alter table "public"."certificates" add constraint "certificates_verification_code_key" UNIQUE using index "certificates_verification_code_key";

alter table "public"."code" add constraint "code_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) not valid;

alter table "public"."code" validate constraint "code_department_id_fkey";

alter table "public"."code" add constraint "code_id_key" UNIQUE using index "code_id_key";

alter table "public"."code" add constraint "code_university_id_fkey" FOREIGN KEY (university_id) REFERENCES public.universities(id) not valid;

alter table "public"."code" validate constraint "code_university_id_fkey";

alter table "public"."courses" add constraint "courses_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."courses" validate constraint "courses_book_id_fkey";

alter table "public"."courses" add constraint "courses_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."courses" validate constraint "courses_grade_id_fkey";

alter table "public"."courses" add constraint "courses_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."courses" validate constraint "courses_instructor_id_fkey";

alter table "public"."courses" add constraint "courses_pk_key" UNIQUE using index "courses_pk_key";

alter table "public"."courses" add constraint "courses_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."courses" validate constraint "courses_price_check";

alter table "public"."courses" add constraint "courses_slug_key" UNIQUE using index "courses_slug_key";

alter table "public"."courses" add constraint "courses_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) not valid;

alter table "public"."courses" validate constraint "courses_subject_id_fkey";

alter table "public"."deck_cards" add constraint "deck_cards_deck_id_fkey" FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE CASCADE not valid;

alter table "public"."deck_cards" validate constraint "deck_cards_deck_id_fkey";

alter table "public"."deck_cards" add constraint "deck_cards_flashcard_id_fkey" FOREIGN KEY (flashcard_id) REFERENCES public.flashcards(id) ON DELETE CASCADE not valid;

alter table "public"."deck_cards" validate constraint "deck_cards_flashcard_id_fkey";

alter table "public"."deck_cards" add constraint "deck_cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."deck_cards" validate constraint "deck_cards_user_id_fkey";

alter table "public"."decks" add constraint "decks_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE not valid;

alter table "public"."decks" validate constraint "decks_book_id_fkey";

alter table "public"."decks" add constraint "decks_pk_key" UNIQUE using index "decks_pk_key";

alter table "public"."decks" add constraint "decks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."decks" validate constraint "decks_user_id_fkey";

alter table "public"."departments" add constraint "departments_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) not valid;

alter table "public"."departments" validate constraint "departments_faculty_id_fkey";

alter table "public"."departments" add constraint "departments_pk_key" UNIQUE using index "departments_pk_key";

alter table "public"."discussion_posts" add constraint "discussion_posts_parent_post_id_fkey" FOREIGN KEY (parent_post_id) REFERENCES public.discussion_posts(id) ON DELETE CASCADE not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_parent_post_id_fkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_pk_key" UNIQUE using index "discussion_posts_pk_key";

alter table "public"."discussion_posts" add constraint "discussion_posts_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.discussion_threads(id) not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_thread_id_fkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_user_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_course_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_lesson_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_pj_key" UNIQUE using index "discussion_threads_pj_key";

alter table "public"."discussion_threads" add constraint "discussion_threads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_user_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."enrollments" validate constraint "enrollments_course_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_last_accessed_lesson_id_fkey" FOREIGN KEY (last_accessed_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL not valid;

alter table "public"."enrollments" validate constraint "enrollments_last_accessed_lesson_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_pk_key" UNIQUE using index "enrollments_pk_key";

alter table "public"."enrollments" add constraint "enrollments_progress_percentage_check" CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))) not valid;

alter table "public"."enrollments" validate constraint "enrollments_progress_percentage_check";

alter table "public"."enrollments" add constraint "enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_user_id_fkey";

alter table "public"."enrollments" add constraint "fk_enrollments_certificate_id" FOREIGN KEY (certificate_id) REFERENCES public.certificates(id) ON DELETE SET NULL not valid;

alter table "public"."enrollments" validate constraint "fk_enrollments_certificate_id";

alter table "public"."faculties" add constraint "faculties_pk_key" UNIQUE using index "faculties_pk_key";

alter table "public"."flashcards" add constraint "flashcard_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."flashcards" validate constraint "flashcard_user_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."flashcards" validate constraint "flashcards_book_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."flashcards" validate constraint "flashcards_grade_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_pk_key" UNIQUE using index "flashcards_pk_key";

alter table "public"."forms" add constraint "forms_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."forms" validate constraint "forms_category_id_fkey";

alter table "public"."forms" add constraint "forms_pk_key" UNIQUE using index "forms_pk_key";

alter table "public"."forms" add constraint "forms_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.provinces(id) not valid;

alter table "public"."forms" validate constraint "forms_province_id_fkey";

alter table "public"."grades" add constraint "grades_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."grades" validate constraint "grades_category_id_fkey";

alter table "public"."grades" add constraint "grades_pk_key" UNIQUE using index "grades_pk_key";

alter table "public"."leitners" add constraint "leitners_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."leitners" validate constraint "leitners_book_id_fkey";

alter table "public"."leitners" add constraint "leitners_deck_id_fkey" FOREIGN KEY (deck_id) REFERENCES public.decks(id) not valid;

alter table "public"."leitners" validate constraint "leitners_deck_id_fkey";

alter table "public"."leitners" add constraint "leitners_pk_key" UNIQUE using index "leitners_pk_key";

alter table "public"."leitners" add constraint "leitners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."leitners" validate constraint "leitners_user_id_fkey";

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."lesson_content_blocks" validate constraint "lesson_content_blocks_lesson_id_fkey";

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_pk_key" UNIQUE using index "lesson_content_blocks_pk_key";

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_slug_key" UNIQUE using index "lesson_content_blocks_slug_key";

alter table "public"."lesson_progress" add constraint "lesson_progress_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_enrollment_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_id_key" UNIQUE using index "lesson_progress_id_key";

alter table "public"."lesson_progress" add constraint "lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_lesson_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_user_id_fkey";

alter table "public"."lessons" add constraint "lessons_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."lessons" validate constraint "lessons_book_id_fkey";

alter table "public"."lessons" add constraint "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_course_id_fkey";

alter table "public"."lessons" add constraint "lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES public.modules(id) not valid;

alter table "public"."lessons" validate constraint "lessons_module_id_fkey";

alter table "public"."lessons" add constraint "lessons_pk_key" UNIQUE using index "lessons_pk_key";

alter table "public"."lessons" add constraint "lessons_slug_key" UNIQUE using index "lessons_slug_key";

alter table "public"."libraries" add constraint "libraries_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."libraries" validate constraint "libraries_book_id_fkey";

alter table "public"."libraries" add constraint "libraries_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."libraries" validate constraint "libraries_category_id_fkey";

alter table "public"."libraries" add constraint "libraries_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."libraries" validate constraint "libraries_grade_id_fkey";

alter table "public"."libraries" add constraint "libraries_pk_key" UNIQUE using index "libraries_pk_key";

alter table "public"."libraries" add constraint "libraries_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) not valid;

alter table "public"."libraries" validate constraint "libraries_subject_id_fkey";

alter table "public"."modules" add constraint "modules_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."modules" validate constraint "modules_book_id_fkey";

alter table "public"."modules" add constraint "modules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."modules" validate constraint "modules_course_id_fkey";

alter table "public"."modules" add constraint "modules_pk_key" UNIQUE using index "modules_pk_key";

alter table "public"."notes" add constraint "notes_pk_key" UNIQUE using index "notes_pk_key";

alter table "public"."notes" add constraint "notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."notes" validate constraint "notes_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."notifications" validate constraint "notifications_actor_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."payments" add constraint "payments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."payments" validate constraint "payments_course_id_fkey";

alter table "public"."payments" add constraint "payments_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) not valid;

alter table "public"."payments" validate constraint "payments_enrollment_id_fkey";

alter table "public"."payments" add constraint "payments_provider_transaction_id_key" UNIQUE using index "payments_provider_transaction_id_key";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_phone_key" UNIQUE using index "profiles_phone_key";

alter table "public"."profiles" add constraint "profiles_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_province_id_fkey";

alter table "public"."profiles" add constraint "profiles_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_school_id_fkey";

alter table "public"."provinces" add constraint "provinces_pk_key" UNIQUE using index "provinces_pk_key";

alter table "public"."question_options" add constraint "question_options_pk_key" UNIQUE using index "question_options_pk_key";

alter table "public"."question_options" add constraint "question_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) not valid;

alter table "public"."question_options" validate constraint "question_options_question_id_fkey";

alter table "public"."questions" add constraint "questions_image_content_block_id_fkey" FOREIGN KEY (image_content_block_id) REFERENCES public.lesson_content_blocks(id) not valid;

alter table "public"."questions" validate constraint "questions_image_content_block_id_fkey";

alter table "public"."questions" add constraint "questions_pk_key" UNIQUE using index "questions_pk_key";

alter table "public"."questions" add constraint "questions_points_check" CHECK ((points > 0)) not valid;

alter table "public"."questions" validate constraint "questions_points_check";

alter table "public"."questions" add constraint "questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) not valid;

alter table "public"."questions" validate constraint "questions_quiz_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_enrollment_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_pk_key" UNIQUE using index "quiz_attempts_pk_key";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_quiz_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_user_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_entrance_code_key" UNIQUE using index "quizzes_entrance_code_key";

alter table "public"."quizzes" add constraint "quizzes_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."quizzes" validate constraint "quizzes_lesson_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_passing_score_percentage_check" CHECK (((passing_score_percentage >= 0) AND (passing_score_percentage <= 100))) not valid;

alter table "public"."quizzes" validate constraint "quizzes_passing_score_percentage_check";

alter table "public"."quizzes" add constraint "quizzes_pk_key" UNIQUE using index "quizzes_pk_key";

alter table "public"."quizzes" add constraint "quizzes_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) not valid;

alter table "public"."quizzes" validate constraint "quizzes_school_id_fkey";

alter table "public"."reviews" add constraint "reviews_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."reviews" validate constraint "reviews_course_id_fkey";

alter table "public"."reviews" add constraint "reviews_id_key" UNIQUE using index "reviews_id_key";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."schools" add constraint "schools_manager_fkey" FOREIGN KEY (manager) REFERENCES public.profiles(id) not valid;

alter table "public"."schools" validate constraint "schools_manager_fkey";

alter table "public"."schools" add constraint "schools_pk_key" UNIQUE using index "schools_pk_key";

alter table "public"."subjects" add constraint "subjects_pk_key" UNIQUE using index "subjects_pk_key";

alter table "public"."tags" add constraint "tags_id_key" UNIQUE using index "tags_id_key";

alter table "public"."tags" add constraint "tags_name_key" UNIQUE using index "tags_name_key";

alter table "public"."universities" add constraint "universities_pk_key" UNIQUE using index "universities_pk_key";

alter table "public"."universities" add constraint "universities_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.provinces(id) not valid;

alter table "public"."universities" validate constraint "universities_province_id_fkey";

alter table "public"."universities_faculties" add constraint "universities_faculties_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE not valid;

alter table "public"."universities_faculties" validate constraint "universities_faculties_faculty_id_fkey";

alter table "public"."universities_faculties" add constraint "universities_faculties_pk_key" UNIQUE using index "universities_faculties_pk_key";

alter table "public"."universities_faculties" add constraint "universities_faculties_university_id_fkey" FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE CASCADE not valid;

alter table "public"."universities_faculties" validate constraint "universities_faculties_university_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_new_role public.user_role)
 RETURNS public.profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  updated_profile public.profiles;
BEGIN
  -- Authorization: Only an admin can perform this action.
  IF not is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can update user roles.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
  END IF;

  UPDATE public.profiles
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;$function$
;

CREATE OR REPLACE FUNCTION public.complete_and_grade_quiz_attempt(p_quiz_attempt_id bigint, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  total_score_for_attempt NUMERIC(6,2);
  is_quiz_passed BOOLEAN;
  num_questions_awaiting_manual_grade INT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided.';
  END IF;

  SELECT * INTO quiz_attempt_record FROM public.quiz_attempts WHERE id = p_quiz_attempt_id;
  IF quiz_attempt_record IS NULL THEN
    RAISE EXCEPTION 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  END IF;

  IF quiz_attempt_record.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  END IF;

  IF quiz_attempt_record.completed_at IS NOT NULL THEN
    RAISE WARNING 'Quiz attempt % is already completed.', p_quiz_attempt_id;
    RETURN quiz_attempt_record;
  END IF;

  SELECT * INTO quiz_record FROM public.quizzes WHERE id = quiz_attempt_record.quiz_id;
  IF quiz_record IS NULL THEN
    RAISE EXCEPTION 'Associated quiz (ID %) not found for attempt %.', quiz_attempt_record.quiz_id, p_quiz_attempt_id;
  END IF;

  -- Sum up points for auto-graded answers.
  SELECT COALESCE(SUM(a.points_awarded), 0)
  INTO total_score_for_attempt
  FROM public.answers a
  WHERE a.quiz_attempt_id = p_quiz_attempt_id AND a.is_correct IS NOT NULL; -- Only count auto-graded

  -- Check if any questions are awaiting manual grading
  SELECT COUNT(*)
  INTO num_questions_awaiting_manual_grade
  FROM public.answers a
  WHERE a.quiz_attempt_id = p_quiz_attempt_id AND a.is_correct IS NULL;

  IF num_questions_awaiting_manual_grade > 0 THEN
    -- Mark as completed but note that final score might change after manual grading.
    -- The 'passed' status might be provisional.
    UPDATE public.quiz_attempts
    SET
      score = total_score_for_attempt, -- Provisional score
      completed_at = NOW(), -- Mark as completed by student
      -- 'passed' status will be updated by instructor after manual grading if needed
      updated_at = NOW()
    WHERE id = p_quiz_attempt_id
    RETURNING * INTO quiz_attempt_record;

    PERFORM public.create_app_notification(
      p_user_id := p_user_id,
      p_type := 'quiz_graded', -- or 'quiz_submitted_for_grading'
      p_title := 'Quiz Submitted: ' || quiz_record.title,
      p_message := 'Your quiz "' || quiz_record.title || '" has been submitted. Some questions require manual grading. Provisional score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id_bigint := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );
    -- Notify instructor about submission needing grading
     PERFORM public.create_app_notification(
      p_user_id := (SELECT c.instructor_id FROM public.courses c JOIN public.sections s ON c.id = s.course_id JOIN public.lessons l ON s.id = l.section_id WHERE l.id = quiz_record.lesson_id),
      p_type := 'new_assignment_submission', -- Re-use or new 'quiz_needs_grading'
      p_title := 'Quiz Needs Grading: ' || quiz_record.title,
      p_message := (SELECT pf.full_name FROM public.profiles pf WHERE pf.id = p_user_id) || ' submitted the quiz "' || quiz_record.title || '" which requires manual grading.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id_bigint := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    RETURN quiz_attempt_record;
  END IF;

  -- If all questions are auto-graded or no questions exist:
  IF quiz_record.passing_score_percentage IS NOT NULL AND quiz_attempt_record.max_score_possible > 0 THEN
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  ELSIF quiz_record.passing_score_percentage IS NULL THEN
    is_quiz_passed = TRUE; -- No passing score needed, completion implies pass
  ELSE
    is_quiz_passed = FALSE; -- Max score is 0 or not set, cannot pass based on percentage.
  END IF;

  UPDATE public.quiz_attempts
  SET
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_quiz_attempt_id
  RETURNING * INTO quiz_attempt_record;

  -- If quiz passed and is part of a mandatory lesson, mark lesson complete
  IF is_quiz_passed THEN
    SELECT * INTO lesson_record FROM public.lessons WHERE id = quiz_record.lesson_id;
    IF lesson_record.is_mandatory THEN
      PERFORM public.complete_lesson_for_user(quiz_record.lesson_id, p_user_id);
    END IF;
  END IF;

  PERFORM public.create_app_notification(
    p_user_id := p_user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Graded: ' || quiz_record.title,
    p_message := 'Your quiz "' || quiz_record.title || '" has been graded. Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (CASE WHEN is_quiz_passed THEN 'Passed' ELSE 'Failed' END) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id_bigint := p_quiz_attempt_id,
    p_actor_id := NULL -- System graded
  );

  RETURN quiz_attempt_record;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_lesson_for_user(p_lesson_id bigint, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.lesson_progress
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  enrollment_record public.enrollments;
  lesson_record public.lessons;
  section_record public.sections;
  course_record public.courses;
  user_profile public.profiles;
  updated_lesson_progress public.lesson_progress;
  total_mandatory_lessons_in_course INT;
  completed_mandatory_lessons_by_user INT;
  new_course_progress_percentage SMALLINT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided.';
  END IF;

  SELECT * INTO lesson_record FROM public.lessons WHERE id = p_lesson_id;
  IF lesson_record IS NULL THEN
    RAISE EXCEPTION 'Lesson not found: ID %', p_lesson_id;
  END IF;

  SELECT * INTO section_record FROM public.sections WHERE id = lesson_record.section_id;
  SELECT * INTO course_record FROM public.courses WHERE id = section_record.course_id;
  SELECT * INTO user_profile FROM public.profiles WHERE id = p_user_id;

  -- Find the user's enrollment for this course
  SELECT * INTO enrollment_record
  FROM public.enrollments
  WHERE user_id = p_user_id AND course_id = course_record.id;

  IF enrollment_record IS NULL THEN
    RAISE EXCEPTION 'User % is not enrolled in the course "%" containing this lesson.', user_profile.full_name, course_record.title;
  END IF;
  IF enrollment_record.completed_at IS NOT NULL THEN
    RAISE WARNING 'Course "%" is already marked as completed by user %.', course_record.title, user_profile.full_name;
    -- Allow completing lessons even if course is technically complete, in case of re-visits or errors.
  END IF;

  -- Insert or Update lesson progress
  INSERT INTO public.lesson_progress (enrollment_id, lesson_id, is_completed, completed_at, last_accessed_at)
  VALUES (enrollment_record.id, p_lesson_id, TRUE, NOW(), NOW())
  ON CONFLICT (enrollment_id, lesson_id) DO UPDATE
  SET
    is_completed = TRUE,
    completed_at = COALESCE(public.lesson_progress.completed_at, NOW()), -- Only set completed_at once
    last_accessed_at = NOW()
  RETURNING * INTO updated_lesson_progress;

  -- Update overall course progress based on mandatory lessons
  SELECT COUNT(*) INTO total_mandatory_lessons_in_course
  FROM public.lessons l_count
  JOIN public.sections s_count ON l_count.section_id = s_count.id
  WHERE s_count.course_id = course_record.id AND l_count.is_mandatory = TRUE;

  IF total_mandatory_lessons_in_course > 0 THEN
    SELECT COUNT(DISTINCT lp.lesson_id) INTO completed_mandatory_lessons_by_user
    FROM public.lesson_progress lp
    JOIN public.lessons l_check ON lp.lesson_id = l_check.id
    JOIN public.sections s_check ON l_check.section_id = s_check.id
    WHERE lp.enrollment_id = enrollment_record.id
      AND s_check.course_id = course_record.id
      AND l_check.is_mandatory = TRUE
      AND lp.is_completed = TRUE;

    new_course_progress_percentage = LEAST(100, (completed_mandatory_lessons_by_user * 100 / total_mandatory_lessons_in_course))::SMALLINT;
  ELSE
    -- If no mandatory lessons, course completion is immediate upon completing any lesson or by other criteria.
    -- For simplicity, if all lessons (even non-mandatory) are done, mark as 100%.
    DECLARE
        total_lessons_in_course INT;
        completed_lessons_by_user INT;
    BEGIN
        SELECT COUNT(*) INTO total_lessons_in_course FROM public.lessons l_count JOIN public.sections s_count ON l_count.section_id = s_count.id WHERE s_count.course_id = course_record.id;
        SELECT COUNT(DISTINCT lp.lesson_id) INTO completed_lessons_by_user FROM public.lesson_progress lp JOIN public.lessons l_check ON lp.lesson_id = l_check.id JOIN public.sections s_check ON l_check.section_id = s_check.id WHERE lp.enrollment_id = enrollment_record.id AND s_check.course_id = course_record.id AND lp.is_completed = TRUE;
        IF total_lessons_in_course > 0 AND completed_lessons_by_user = total_lessons_in_course THEN
            new_course_progress_percentage = 100;
        ELSEIF total_lessons_in_course = 0 THEN
             new_course_progress_percentage = 100; -- No lessons, course is complete
        ELSE
            new_course_progress_percentage = enrollment_record.progress_percentage; -- Or some other logic
        END IF;
    END;
  END IF;

  UPDATE public.enrollments
  SET
    progress_percentage = new_course_progress_percentage,
    last_accessed_lesson_id = p_lesson_id,
    updated_at = NOW()
  WHERE id = enrollment_record.id;

  -- Check for course completion (all mandatory lessons completed)
  IF new_course_progress_percentage = 100 AND enrollment_record.completed_at IS NULL THEN
    DECLARE
      new_certificate_id UUID;
    BEGIN
      UPDATE public.enrollments
      SET completed_at = NOW()
      WHERE id = enrollment_record.id;

      -- Issue Certificate
      INSERT INTO public.certificates (enrollment_id, user_id, course_id, course_title, user_full_name, verification_code)
      VALUES (
        enrollment_record.id,
        p_user_id,
        course_record.id,
        course_record.title,
        user_profile.full_name,
        substr(md5(random()::text || clock_timestamp()::text), 1, 16) -- Generate a simple unique code
      ) RETURNING id INTO new_certificate_id;

      UPDATE public.enrollments SET certificate_id = new_certificate_id WHERE id = enrollment_record.id;

      -- Notify user of course completion and certificate
      PERFORM public.create_app_notification(
        p_user_id := p_user_id,
        p_type := 'course_completion',
        p_title := 'Congratulations! Course Completed: ' || course_record.title,
        p_message := 'You have successfully completed "' || course_record.title || '". Your certificate is now available.',
        p_related_entity_type := 'certificate',
        p_related_entity_id_uuid := new_certificate_id,
        p_actor_id := NULL -- System
      );

       -- Notify instructor of student's course completion
        PERFORM public.create_app_notification(
            p_user_id := course_record.instructor_id,
            p_type := 'course_completion', -- Could be a different type like 'student_course_completion'
            p_title := 'Student Completed Course: ' || course_record.title,
            p_message := user_profile.full_name || ' has completed your course "' || course_record.title || '".',
            p_related_entity_type := 'enrollment',
            p_related_entity_id_bigint := enrollment_record.id,
            p_actor_id := p_user_id
        );
    END;
  END IF;

  RETURN updated_lesson_progress;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_app_notification(p_user_id uuid, p_type public.notification_type, p_title text, p_message text DEFAULT NULL::text, p_related_entity_type text DEFAULT NULL::text, p_related_entity_id uuid DEFAULT NULL::uuid, p_actor_id uuid DEFAULT NULL::uuid)
 RETURNS public.notifications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_notification public.notifications;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE WARNING 'Recipient user ID % not found for notification. Notification not created.', p_user_id;
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    actor_id
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_actor_id
  )
  RETURNING * INTO new_notification;

  RETURN new_notification;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  claims jsonb;
  v_role public.user_role;
begin
  -- Get user role from profiles
  select role
  into v_role
  from public.profiles
  where user_id = (event->>'user_id')::uuid;

  -- Fallback role
  v_role := coalesce(v_role, 'student'::public.user_role);

  -- Extract claims
  claims := event->'claims';

  -- Ensure app_metadata exists
  if claims->'app_metadata' is null then
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      '{}'::jsonb
    );
  end if;

  -- Inject role into JWT
  claims := jsonb_set(
    claims,
    '{app_metadata,role}',
    to_jsonb(v_role)
  );

  -- Update event claims
  event := jsonb_set(
    event,
    '{claims}',
    claims
  );

  return event;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_user_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Ensure the user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete the authenticated user
  delete from auth.users
  where id = auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.enrollments
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  course_record public.courses;
  new_enrollment public.enrollments;
  current_enrollment_count INT;
  user_profile public.profiles;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided to enroll in a course.';
  END IF;

  SELECT * INTO course_record FROM public.courses WHERE id = p_course_id;
  SELECT * INTO user_profile FROM public.profiles WHERE id = p_user_id;

  IF course_record IS NULL THEN
    RAISE EXCEPTION 'Course not found: ID %', p_course_id;
  END IF;
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found: ID %', p_user_id;
  END IF;

  IF NOT course_record.is_published THEN
    RAISE EXCEPTION 'Cannot enroll in an unpublished course: %', course_record.title;
  END IF;

  -- Check if already enrolled
  IF EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = p_user_id AND course_id = p_course_id) THEN
    RAISE EXCEPTION 'User % is already enrolled in course %.', user_profile.full_name, course_record.title;
  END IF;

  -- Check enrollment limit
  IF course_record.enrollment_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO current_enrollment_count FROM public.enrollments WHERE course_id = p_course_id;
    IF current_enrollment_count >= course_record.enrollment_limit THEN
      RAISE EXCEPTION 'Enrollment limit reached for course: %.', course_record.title;
    END IF;
  END IF;

  -- Payment Logic Placeholder:
  -- IF NOT course_record.is_free THEN
  --   -- This is where you'd check if a payment record exists and is successful for this user and course.
  --   -- For example:
  --   -- IF NOT EXISTS (
  --   --   SELECT 1 FROM public.payments
  --   --   WHERE user_id = p_user_id AND course_id = p_course_id AND status = 'succeeded'
  --   -- ) THEN
  --   --   RAISE EXCEPTION 'Payment required to enroll in this course: %', course_record.title;
  --   -- END IF;
  --   -- Alternatively, enrollment might happen AFTER a successful payment is recorded by another function/webhook.
  -- END IF;

  INSERT INTO public.enrollments (user_id, course_id)
  VALUES (p_user_id, p_course_id)
  RETURNING * INTO new_enrollment;

  -- Notification for instructor
  PERFORM public.create_app_notification(
    p_user_id := course_record.instructor_id,
    p_type := 'new_course_enrollment',
    p_title := 'New Enrollment: ' || course_record.title,
    p_message := user_profile.full_name || ' has enrolled in your course "' || course_record.title || '".',
    p_related_entity_type := 'courses',
    p_related_entity_id := p_course_id,
    p_actor_id := p_user_id
  );

  RETURN new_enrollment;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.epoch_to_timestamp(epoch bigint)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN to_timestamp(epoch);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.epoch_to_timestamp(epoch text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
AS $function$ begin return timestamp with time zone 'epoch' + ((epoch::bigint) / 1000) * interval '1 second';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_average_rating(p_course_id bigint)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  avg_rating NUMERIC(2,1);
BEGIN
  SELECT AVG(rating)::NUMERIC(2,1)
  INTO avg_rating
  FROM public.reviews
  WHERE course_id = p_course_id;

  RETURN COALESCE(avg_rating, 0.0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id bigint DEFAULT NULL::bigint)
 RETURNS TABLE(id bigint, title text, slug text, subtitle text, description text, instructor_id uuid, instructor_full_name text, instructor_avatar_url text, category_id bigint, category_name text, level public.course_level, language character varying, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, sections jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    IF p_course_slug IS NULL AND p_course_id IS NULL THEN
        RAISE EXCEPTION 'Either course slug or course ID must be provided.';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.slug,
        c.subtitle,
        c.description,
        c.instructor_id,
        p.full_name AS instructor_full_name,
        p.avatar_url AS instructor_avatar_url,
        c.category_id,
        cc.name AS category_name,
        c.level,
        c.language,
        c.cover_image_url,
        c.promo_video_url,
        c.welcome_message,
        c.learning_objectives,
        c.prerequisites,
        c.is_published,
        c.published_at,
        c.is_free,
        c.price,
        c.currency,
        c.enrollment_limit,
        c.estimated_duration_hours,
        c.created_at,
        c.updated_at,
        (SELECT AVG(r.rating)::NUMERIC(2,1) FROM public.reviews r WHERE r.course_id = c.id) AS average_rating,
        (SELECT COUNT(r.id) FROM public.reviews r WHERE r.course_id = c.id) AS total_reviews,
        (SELECT COUNT(e.id) FROM public.enrollments e WHERE e.course_id = c.id) AS total_enrollments,
        (SELECT COUNT(l.id) FROM public.lessons l JOIN public.sections s_count ON l.section_id = s_count.id WHERE s_count.course_id = c.id) AS total_lessons,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'title', s.title,
                    'description', s.description,
                    'order_index', s.order_index,
                    'lessons', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', l.id,
                                'title', l.title,
                                'content_type', l.content_type,
                                'order_index', l.order_index,
                                'estimated_duration_minutes', l.estimated_duration_minutes,
                                'is_previewable', l.is_previewable
                                -- Add other lesson fields as needed
                            ) ORDER BY l.order_index ASC
                        )
                        FROM public.lessons l
                        WHERE l.section_id = s.id
                    )
                ) ORDER BY s.order_index ASC
            )
            FROM public.sections s
            WHERE s.course_id = c.id
        ) AS sections
    FROM public.courses c
    LEFT JOIN public.profiles p ON c.instructor_id = p.id
    LEFT JOIN public.course_categories cc ON c.category_id = cc.id
    WHERE (p_course_slug IS NOT NULL AND c.slug = p_course_slug) OR (p_course_id IS NOT NULL AND c.id = p_course_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_id_from_lesson(check_lesson_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  resolved_course_id BIGINT;
BEGIN
    SELECT s.course_id INTO resolved_course_id
    FROM public.lessons l
    JOIN public.sections s ON l.section_id = s.id
    WHERE l.id = check_lesson_id;
    RETURN resolved_course_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_id_from_section(check_section_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  resolved_course_id BIGINT;
BEGIN
    SELECT s.course_id INTO resolved_course_id
    FROM public.sections s
    WHERE s.id = check_section_id;
    RETURN resolved_course_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS public.user_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  profile_role public.user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL; -- Or a specific role for anonymous users if needed
  END IF;
  SELECT role INTO profile_role FROM public.profiles WHERE id = auth.uid();
  RETURN profile_role;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL; -- User has an auth entry but no profile yet
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
 RETURNS public.user_role
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  jwt_role text;
  db_role public.user_role;
begin
  if user_id is null then
    return null;
  end if;

  -- 1. JWT fast path
  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  if jwt_role is not null then
    begin
      return jwt_role::public.user_role;
    exception
      when invalid_text_representation then
        null; -- ignore bad JWT value and fallback
    end;
  end if;

  -- 2. DB fallback
  select role
  into db_role
  from public.profiles
  where user_id = get_user_role.user_id;

  return db_role;

end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'), 
    COALESCE(NEW.email, NULL),
    COALESCE(NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$BEGIN
    -- Your function logic here
    NEW.updated_at = now();
    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.instructor_grade_answer_and_update_quiz(p_answer_id bigint, p_is_correct boolean, p_points_awarded numeric, p_instructor_feedback text DEFAULT NULL::text, p_instructor_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  answer_record public.answers;
  question_record public.questions;
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  course_id_val BIGINT;
  total_score_for_attempt NUMERIC(6,2);
  is_quiz_passed BOOLEAN;
  num_questions_still_awaiting_manual_grade INT;
  affected_user_id UUID;
BEGIN
  -- Authorization: Check if p_instructor_id is instructor of the course or admin
  SELECT a.quiz_attempt_id, a.question_id, qa.user_id
  INTO quiz_attempt_record.id, question_record.id, affected_user_id
  FROM public.answers a
  JOIN public.quiz_attempts qa ON a.quiz_attempt_id = qa.id
  WHERE a.id = p_answer_id;

  IF quiz_attempt_record.id IS NULL THEN
    RAISE EXCEPTION 'Answer ID % not found.', p_answer_id;
  END IF;

  SELECT qz.* INTO quiz_record FROM public.quizzes qz JOIN public.questions q ON qz.id = q.quiz_id WHERE q.id = question_record.id;
  course_id_val := public.get_course_id_from_lesson(quiz_record.lesson_id);

  IF NOT (public.is_course_instructor(p_instructor_id, course_id_val) OR public.get_current_user_role() = 'admin') THEN
    RAISE EXCEPTION 'Permission denied: Not an instructor for this course or an admin.';
  END IF;

  -- Update the specific answer
  UPDATE public.answers
  SET
    is_correct = p_is_correct,
    points_awarded = p_points_awarded,
    feedback = COALESCE(p_instructor_feedback, feedback) -- Append or replace feedback
  WHERE id = p_answer_id
  RETURNING * INTO answer_record;

  -- Recalculate quiz attempt score
  SELECT * INTO quiz_attempt_record FROM public.quiz_attempts WHERE id = answer_record.quiz_attempt_id;

  SELECT COALESCE(SUM(a.points_awarded), 0)
  INTO total_score_for_attempt
  FROM public.answers a
  WHERE a.quiz_attempt_id = quiz_attempt_record.id AND a.points_awarded IS NOT NULL; -- Sum all that have points

  -- Check if any OTHER questions are still awaiting manual grading for this attempt
  SELECT COUNT(*)
  INTO num_questions_still_awaiting_manual_grade
  FROM public.answers a
  WHERE a.quiz_attempt_id = quiz_attempt_record.id AND a.is_correct IS NULL AND a.id <> p_answer_id;

  IF num_questions_still_awaiting_manual_grade > 0 THEN
    -- Update score, but don't finalize pass/fail yet
    UPDATE public.quiz_attempts
    SET score = total_score_for_attempt, updated_at = NOW()
    WHERE id = quiz_attempt_record.id
    RETURNING * INTO quiz_attempt_record;

    RAISE NOTICE 'Answer graded. Quiz attempt % still has % other questions awaiting manual grading.', quiz_attempt_record.id, num_questions_still_awaiting_manual_grade;
    RETURN quiz_attempt_record; -- Return partially updated attempt
  END IF;

  -- All questions for this attempt are now graded (either auto or manually)
  IF quiz_record.passing_score_percentage IS NOT NULL AND quiz_attempt_record.max_score_possible > 0 THEN
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  ELSIF quiz_record.passing_score_percentage IS NULL THEN
    is_quiz_passed = TRUE;
  ELSE
    is_quiz_passed = FALSE;
  END IF;

  UPDATE public.quiz_attempts
  SET
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    feedback_from_instructor = COALESCE(quiz_attempt_record.feedback_from_instructor, '') || 'Answer ID ' || p_answer_id || ' graded. ', -- Optional: Add overall feedback here
    -- completed_at was set when student submitted. updated_at is handled by trigger.
    updated_at = NOW()
  WHERE id = quiz_attempt_record.id
  RETURNING * INTO quiz_attempt_record;

  -- If quiz now passed and is part of a mandatory lesson, mark lesson complete
  IF is_quiz_passed AND quiz_attempt_record.passed IS DISTINCT FROM TRUE THEN -- only if status changed to PASSED
    DECLARE lesson_rec public.lessons;
    BEGIN
        SELECT * INTO lesson_rec FROM public.lessons WHERE id = quiz_record.lesson_id;
        IF lesson_rec.is_mandatory THEN
          PERFORM public.complete_lesson_for_user(quiz_record.lesson_id, quiz_attempt_record.user_id);
        END IF;
    END;
  END IF;

  PERFORM public.create_app_notification(
    p_user_id := quiz_attempt_record.user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Update: ' || quiz_record.title,
    p_message := 'An answer in your quiz "' || quiz_record.title || '" has been graded by the instructor. New Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (CASE WHEN is_quiz_passed THEN 'Passed' ELSE 'Failed' END) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id_bigint := quiz_attempt_record.id,
    p_actor_id := p_instructor_id
  );

  RETURN quiz_attempt_record;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('admin'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_course_instructor(check_user_id uuid, check_course_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = check_course_id AND instructor_id = check_user_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_enrolled(check_user_id uuid, check_course_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE course_id = check_course_id AND user_id = check_user_id AND completed_at IS NULL -- Optional: only active enrollments
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_instructor(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('instructor'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_owner(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$declare
  v_owner boolean := false;
begin
  v_owner := (select auth.uid()) = user_id;
  return v_owner;
end;$function$
;

CREATE OR REPLACE FUNCTION public.is_student(user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return is_user_a('student'::public.user_role, user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_a(role public.user_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role public.user_role;
begin
  v_role := get_current_user_role();

  return v_role = role;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_a(role public.user_role, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role public.user_role;
begin
  v_role := get_user_role(user_id);

  return v_role = role;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_published_status(p_course_id bigint, p_is_published boolean)
 RETURNS public.courses
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  updated_course public.courses;
  current_user_id UUID := auth.uid();
  current_user_role public.user_role;
BEGIN
  SELECT public.get_current_user_role() INTO current_user_role;

  -- Authorization: Only the course instructor or an admin can publish/unpublish.
  IF NOT (public.is_course_instructor(current_user_id, p_course_id) OR current_user_role = 'admin') THEN
    RAISE EXCEPTION 'Permission denied: Only the course instructor or an admin can change publication status.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION 'Course not found for ID: %', p_course_id;
  END IF;

  UPDATE public.courses
  SET
    is_published = p_is_published,
    published_at = CASE
                     WHEN p_is_published = TRUE AND published_at IS NULL THEN NOW()
                     WHEN p_is_published = FALSE THEN NULL -- Optionally clear published_at when unpublishing
                     ELSE published_at
                   END,
    updated_at = NOW()
  WHERE id = p_course_id
  RETURNING * INTO updated_course;

  -- TODO: Consider creating a notification if the course is newly published.

  RETURN updated_course;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.slugify(input_text text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN trim(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        lower(trim(input_text)),
                        '[^a-zA-Z0-9\s-]', '', 'g'
                    ),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            ),
            '^-+|-+$', '', 'g'
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id bigint, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  enrollment_record public.enrollments;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  course_id_val BIGINT;
  previous_attempts_count SMALLINT;
  new_quiz_attempt public.quiz_attempts;
  max_score_possible_for_quiz NUMERIC(6,2);
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided.';
  END IF;

  SELECT * INTO quiz_record FROM public.quizzes WHERE id = p_quiz_id;
  IF quiz_record IS NULL THEN
    RAISE EXCEPTION 'Quiz not found: ID %', p_quiz_id;
  END IF;

  SELECT * INTO lesson_record FROM public.lessons WHERE id = quiz_record.lesson_id;
  IF lesson_record IS NULL THEN
    RAISE EXCEPTION 'Associated lesson for quiz ID % not found (Lesson ID %)', p_quiz_id, quiz_record.lesson_id;
  END IF;

  course_id_val := public.get_course_id_from_lesson(lesson_record.id);
  IF course_id_val IS NULL THEN
    RAISE EXCEPTION 'Could not determine course for the quiz ID %.', p_quiz_id;
  END IF;

  SELECT * INTO enrollment_record
  FROM public.enrollments
  WHERE user_id = p_user_id AND course_id = course_id_val;

  IF enrollment_record IS NULL THEN
    RAISE EXCEPTION 'User is not enrolled in the course containing this quiz.';
  END IF;
  IF enrollment_record.completed_at IS NOT NULL THEN
      RAISE WARNING 'User has already completed this course. Still allowing quiz attempt.';
  END IF;

  -- Check max attempts
  SELECT COUNT(*) INTO previous_attempts_count
  FROM public.quiz_attempts
  WHERE user_id = p_user_id AND quiz_id = p_quiz_id;

  IF quiz_record.max_attempts IS NOT NULL AND previous_attempts_count >= quiz_record.max_attempts THEN
    RAISE EXCEPTION 'Maximum number of attempts (%) reached for quiz "%".', quiz_record.max_attempts, quiz_record.title;
  END IF;

  -- Calculate max possible score for the quiz
  SELECT COALESCE(SUM(q.points), 0) INTO max_score_possible_for_quiz
  FROM public.questions q
  WHERE q.quiz_id = p_quiz_id;

  INSERT INTO public.quiz_attempts (enrollment_id, quiz_id, user_id, attempt_number, max_score_possible)
  VALUES (enrollment_record.id, p_quiz_id, p_user_id, previous_attempts_count + 1, max_score_possible_for_quiz)
  RETURNING * INTO new_quiz_attempt;

  RETURN new_quiz_attempt;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_quiz_attempt_id bigint, p_question_id bigint, p_selected_option_ids bigint[] DEFAULT NULL::bigint[], p_answer_text text DEFAULT NULL::text, p_structured_answer jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.answers
 LANGUAGE plpgsql
AS $function$
DECLARE
  quiz_attempt_record public.quiz_attempts;
  question_record public.questions;
  new_answer_record public.answers;
  is_answer_correct BOOLEAN := NULL; -- NULL means requires manual grading or not applicable
  points_awarded_for_answer NUMERIC(5,2) := 0;
  answer_feedback TEXT := NULL;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided.';
  END IF;

  SELECT * INTO quiz_attempt_record FROM public.quiz_attempts WHERE id = p_quiz_attempt_id;
  IF quiz_attempt_record IS NULL THEN
    RAISE EXCEPTION 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  END IF;

  IF quiz_attempt_record.user_id <> p_user_id THEN
    RAISE EXCEPTION 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  END IF;

  IF quiz_attempt_record.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot submit answers: Quiz attempt % is already completed.', p_quiz_attempt_id;
  END IF;

  SELECT * INTO question_record FROM public.questions WHERE id = p_question_id AND quiz_id = quiz_attempt_record.quiz_id;
  IF question_record IS NULL THEN
    RAISE EXCEPTION 'Question ID % not found or does not belong to quiz ID %.', p_question_id, quiz_attempt_record.quiz_id;
  END IF;

  -- Auto-grading logic based on question_type
  CASE question_record.question_type
    WHEN 'multiple_choice_single_correct', 'true_false', 'yes_no' THEN
      IF array_length(p_selected_option_ids, 1) = 1 THEN
        SELECT qo.is_correct, qo.feedback
        INTO is_answer_correct, answer_feedback
        FROM public.question_options qo
        WHERE qo.question_id = p_question_id AND qo.id = p_selected_option_ids[1];
        is_answer_correct := COALESCE(is_answer_correct, FALSE);
      ELSE
        is_answer_correct := FALSE; -- Incorrect number of options selected
        answer_feedback := 'Please select exactly one option.';
      END IF;

    WHEN 'multiple_choice_multiple_correct' THEN
      DECLARE
        correct_ids BIGINT[];
        selected_ids_count INT;
        correct_ids_count INT;
        matching_correct_ids_count INT;
        incorrectly_selected_ids_count INT;
      BEGIN
        SELECT array_agg(id) INTO correct_ids FROM public.question_options WHERE question_id = p_question_id AND is_correct = TRUE;
        correct_ids_count := array_length(correct_ids, 1);
        selected_ids_count := array_length(p_selected_option_ids, 1);

        IF selected_ids_count IS NULL OR selected_ids_count = 0 THEN
            is_answer_correct := FALSE; -- No options selected, but some might be correct
            IF correct_ids_count = 0 THEN -- If no options are correct (unusual), then selecting nothing is correct
                is_answer_correct := TRUE;
            END IF;
        ELSE
            SELECT COUNT(*) INTO matching_correct_ids_count FROM unnest(p_selected_option_ids) sel_id WHERE sel_id = ANY(correct_ids);
            SELECT COUNT(*) INTO incorrectly_selected_ids_count FROM unnest(p_selected_option_ids) sel_id WHERE sel_id <> ALL(correct_ids);

            IF matching_correct_ids_count = correct_ids_count AND incorrectly_selected_ids_count = 0 THEN
              is_answer_correct := TRUE;
            ELSE
              is_answer_correct := FALSE;
              -- Partial credit could be complex here, for now, it's all or nothing.
              answer_feedback := 'One or more selected options are incorrect, or not all correct options were chosen.';
            END IF;
        END IF;
      END;
    -- For types requiring more complex or manual grading:
    WHEN 'short_answer_text', 'long_answer_text', 'fill_in_the_blanks', 'matching', 'ordering', 'image_based_question' THEN
      is_answer_correct := NULL; -- Requires manual grading or more advanced logic
      answer_feedback := 'This answer will be reviewed by an instructor or requires specific processing.';
    ELSE
      is_answer_correct := NULL;
      answer_feedback := 'Grading for this question type is not yet implemented.';
  END CASE;

  IF is_answer_correct = TRUE THEN
    points_awarded_for_answer := question_record.points;
  END IF;

  INSERT INTO public.answers (
    quiz_attempt_id,
    question_id,
    selected_option_ids,
    answer_text,
    structured_answer,
    is_correct,
    points_awarded,
    feedback
  )
  VALUES (
    p_quiz_attempt_id,
    p_question_id,
    p_selected_option_ids,
    p_answer_text,
    p_structured_answer,
    is_answer_correct,
    points_awarded_for_answer,
    answer_feedback
  )
  ON CONFLICT (quiz_attempt_id, question_id) DO UPDATE SET
    selected_option_ids = EXCLUDED.selected_option_ids,
    answer_text = EXCLUDED.answer_text,
    structured_answer = EXCLUDED.structured_answer,
    is_correct = EXCLUDED.is_correct,
    points_awarded = EXCLUDED.points_awarded,
    feedback = EXCLUDED.feedback,
    submitted_at = NOW()
  RETURNING * INTO new_answer_record;

  RETURN new_answer_record;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.timestamp_to_epoch(ts timestamp with time zone)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$ begin return (
        extract(
            epoch
            from ts
        ) * 1000
    )::bigint;
end;
$function$
;

grant delete on table "public"."answer_sheets" to "anon";

grant insert on table "public"."answer_sheets" to "anon";

grant references on table "public"."answer_sheets" to "anon";

grant select on table "public"."answer_sheets" to "anon";

grant trigger on table "public"."answer_sheets" to "anon";

grant truncate on table "public"."answer_sheets" to "anon";

grant update on table "public"."answer_sheets" to "anon";

grant delete on table "public"."answer_sheets" to "authenticated";

grant insert on table "public"."answer_sheets" to "authenticated";

grant references on table "public"."answer_sheets" to "authenticated";

grant select on table "public"."answer_sheets" to "authenticated";

grant trigger on table "public"."answer_sheets" to "authenticated";

grant truncate on table "public"."answer_sheets" to "authenticated";

grant update on table "public"."answer_sheets" to "authenticated";

grant select on table "public"."answer_sheets" to "powersync_role";

grant delete on table "public"."answer_sheets" to "service_role";

grant insert on table "public"."answer_sheets" to "service_role";

grant references on table "public"."answer_sheets" to "service_role";

grant select on table "public"."answer_sheets" to "service_role";

grant trigger on table "public"."answer_sheets" to "service_role";

grant truncate on table "public"."answer_sheets" to "service_role";

grant update on table "public"."answer_sheets" to "service_role";

grant delete on table "public"."answers" to "anon";

grant insert on table "public"."answers" to "anon";

grant references on table "public"."answers" to "anon";

grant select on table "public"."answers" to "anon";

grant trigger on table "public"."answers" to "anon";

grant truncate on table "public"."answers" to "anon";

grant update on table "public"."answers" to "anon";

grant delete on table "public"."answers" to "authenticated";

grant insert on table "public"."answers" to "authenticated";

grant references on table "public"."answers" to "authenticated";

grant select on table "public"."answers" to "authenticated";

grant trigger on table "public"."answers" to "authenticated";

grant truncate on table "public"."answers" to "authenticated";

grant update on table "public"."answers" to "authenticated";

grant select on table "public"."answers" to "powersync_role";

grant delete on table "public"."answers" to "service_role";

grant insert on table "public"."answers" to "service_role";

grant references on table "public"."answers" to "service_role";

grant select on table "public"."answers" to "service_role";

grant trigger on table "public"."answers" to "service_role";

grant truncate on table "public"."answers" to "service_role";

grant update on table "public"."answers" to "service_role";

grant delete on table "public"."bookmarks" to "anon";

grant insert on table "public"."bookmarks" to "anon";

grant references on table "public"."bookmarks" to "anon";

grant select on table "public"."bookmarks" to "anon";

grant trigger on table "public"."bookmarks" to "anon";

grant truncate on table "public"."bookmarks" to "anon";

grant update on table "public"."bookmarks" to "anon";

grant delete on table "public"."bookmarks" to "authenticated";

grant insert on table "public"."bookmarks" to "authenticated";

grant references on table "public"."bookmarks" to "authenticated";

grant select on table "public"."bookmarks" to "authenticated";

grant trigger on table "public"."bookmarks" to "authenticated";

grant truncate on table "public"."bookmarks" to "authenticated";

grant update on table "public"."bookmarks" to "authenticated";

grant select on table "public"."bookmarks" to "powersync_role";

grant delete on table "public"."bookmarks" to "service_role";

grant insert on table "public"."bookmarks" to "service_role";

grant references on table "public"."bookmarks" to "service_role";

grant select on table "public"."bookmarks" to "service_role";

grant trigger on table "public"."bookmarks" to "service_role";

grant truncate on table "public"."bookmarks" to "service_role";

grant update on table "public"."bookmarks" to "service_role";

grant delete on table "public"."books" to "anon";

grant insert on table "public"."books" to "anon";

grant references on table "public"."books" to "anon";

grant select on table "public"."books" to "anon";

grant trigger on table "public"."books" to "anon";

grant truncate on table "public"."books" to "anon";

grant update on table "public"."books" to "anon";

grant delete on table "public"."books" to "authenticated";

grant insert on table "public"."books" to "authenticated";

grant references on table "public"."books" to "authenticated";

grant select on table "public"."books" to "authenticated";

grant trigger on table "public"."books" to "authenticated";

grant truncate on table "public"."books" to "authenticated";

grant update on table "public"."books" to "authenticated";

grant select on table "public"."books" to "powersync_role";

grant delete on table "public"."books" to "service_role";

grant insert on table "public"."books" to "service_role";

grant references on table "public"."books" to "service_role";

grant select on table "public"."books" to "service_role";

grant trigger on table "public"."books" to "service_role";

grant truncate on table "public"."books" to "service_role";

grant update on table "public"."books" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "powersync_role";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."certificates" to "anon";

grant insert on table "public"."certificates" to "anon";

grant references on table "public"."certificates" to "anon";

grant select on table "public"."certificates" to "anon";

grant trigger on table "public"."certificates" to "anon";

grant truncate on table "public"."certificates" to "anon";

grant update on table "public"."certificates" to "anon";

grant delete on table "public"."certificates" to "authenticated";

grant insert on table "public"."certificates" to "authenticated";

grant references on table "public"."certificates" to "authenticated";

grant select on table "public"."certificates" to "authenticated";

grant trigger on table "public"."certificates" to "authenticated";

grant truncate on table "public"."certificates" to "authenticated";

grant update on table "public"."certificates" to "authenticated";

grant select on table "public"."certificates" to "powersync_role";

grant delete on table "public"."certificates" to "service_role";

grant insert on table "public"."certificates" to "service_role";

grant references on table "public"."certificates" to "service_role";

grant select on table "public"."certificates" to "service_role";

grant trigger on table "public"."certificates" to "service_role";

grant truncate on table "public"."certificates" to "service_role";

grant update on table "public"."certificates" to "service_role";

grant delete on table "public"."code" to "anon";

grant insert on table "public"."code" to "anon";

grant references on table "public"."code" to "anon";

grant select on table "public"."code" to "anon";

grant trigger on table "public"."code" to "anon";

grant truncate on table "public"."code" to "anon";

grant update on table "public"."code" to "anon";

grant delete on table "public"."code" to "authenticated";

grant insert on table "public"."code" to "authenticated";

grant references on table "public"."code" to "authenticated";

grant select on table "public"."code" to "authenticated";

grant trigger on table "public"."code" to "authenticated";

grant truncate on table "public"."code" to "authenticated";

grant update on table "public"."code" to "authenticated";

grant select on table "public"."code" to "powersync_role";

grant delete on table "public"."code" to "service_role";

grant insert on table "public"."code" to "service_role";

grant references on table "public"."code" to "service_role";

grant select on table "public"."code" to "service_role";

grant trigger on table "public"."code" to "service_role";

grant truncate on table "public"."code" to "service_role";

grant update on table "public"."code" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "powersync_role";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."deck_cards" to "anon";

grant insert on table "public"."deck_cards" to "anon";

grant references on table "public"."deck_cards" to "anon";

grant select on table "public"."deck_cards" to "anon";

grant trigger on table "public"."deck_cards" to "anon";

grant truncate on table "public"."deck_cards" to "anon";

grant update on table "public"."deck_cards" to "anon";

grant delete on table "public"."deck_cards" to "authenticated";

grant insert on table "public"."deck_cards" to "authenticated";

grant references on table "public"."deck_cards" to "authenticated";

grant select on table "public"."deck_cards" to "authenticated";

grant trigger on table "public"."deck_cards" to "authenticated";

grant truncate on table "public"."deck_cards" to "authenticated";

grant update on table "public"."deck_cards" to "authenticated";

grant select on table "public"."deck_cards" to "powersync_role";

grant delete on table "public"."deck_cards" to "service_role";

grant insert on table "public"."deck_cards" to "service_role";

grant references on table "public"."deck_cards" to "service_role";

grant select on table "public"."deck_cards" to "service_role";

grant trigger on table "public"."deck_cards" to "service_role";

grant truncate on table "public"."deck_cards" to "service_role";

grant update on table "public"."deck_cards" to "service_role";

grant delete on table "public"."decks" to "anon";

grant insert on table "public"."decks" to "anon";

grant references on table "public"."decks" to "anon";

grant select on table "public"."decks" to "anon";

grant trigger on table "public"."decks" to "anon";

grant truncate on table "public"."decks" to "anon";

grant update on table "public"."decks" to "anon";

grant delete on table "public"."decks" to "authenticated";

grant insert on table "public"."decks" to "authenticated";

grant references on table "public"."decks" to "authenticated";

grant select on table "public"."decks" to "authenticated";

grant trigger on table "public"."decks" to "authenticated";

grant truncate on table "public"."decks" to "authenticated";

grant update on table "public"."decks" to "authenticated";

grant select on table "public"."decks" to "powersync_role";

grant delete on table "public"."decks" to "service_role";

grant insert on table "public"."decks" to "service_role";

grant references on table "public"."decks" to "service_role";

grant select on table "public"."decks" to "service_role";

grant trigger on table "public"."decks" to "service_role";

grant truncate on table "public"."decks" to "service_role";

grant update on table "public"."decks" to "service_role";

grant delete on table "public"."departments" to "anon";

grant insert on table "public"."departments" to "anon";

grant references on table "public"."departments" to "anon";

grant select on table "public"."departments" to "anon";

grant trigger on table "public"."departments" to "anon";

grant truncate on table "public"."departments" to "anon";

grant update on table "public"."departments" to "anon";

grant delete on table "public"."departments" to "authenticated";

grant insert on table "public"."departments" to "authenticated";

grant references on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "authenticated";

grant trigger on table "public"."departments" to "authenticated";

grant truncate on table "public"."departments" to "authenticated";

grant update on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "powersync_role";

grant delete on table "public"."departments" to "service_role";

grant insert on table "public"."departments" to "service_role";

grant references on table "public"."departments" to "service_role";

grant select on table "public"."departments" to "service_role";

grant trigger on table "public"."departments" to "service_role";

grant truncate on table "public"."departments" to "service_role";

grant update on table "public"."departments" to "service_role";

grant delete on table "public"."discussion_posts" to "anon";

grant insert on table "public"."discussion_posts" to "anon";

grant references on table "public"."discussion_posts" to "anon";

grant select on table "public"."discussion_posts" to "anon";

grant trigger on table "public"."discussion_posts" to "anon";

grant truncate on table "public"."discussion_posts" to "anon";

grant update on table "public"."discussion_posts" to "anon";

grant delete on table "public"."discussion_posts" to "authenticated";

grant insert on table "public"."discussion_posts" to "authenticated";

grant references on table "public"."discussion_posts" to "authenticated";

grant select on table "public"."discussion_posts" to "authenticated";

grant trigger on table "public"."discussion_posts" to "authenticated";

grant truncate on table "public"."discussion_posts" to "authenticated";

grant update on table "public"."discussion_posts" to "authenticated";

grant select on table "public"."discussion_posts" to "powersync_role";

grant delete on table "public"."discussion_posts" to "service_role";

grant insert on table "public"."discussion_posts" to "service_role";

grant references on table "public"."discussion_posts" to "service_role";

grant select on table "public"."discussion_posts" to "service_role";

grant trigger on table "public"."discussion_posts" to "service_role";

grant truncate on table "public"."discussion_posts" to "service_role";

grant update on table "public"."discussion_posts" to "service_role";

grant delete on table "public"."discussion_threads" to "anon";

grant insert on table "public"."discussion_threads" to "anon";

grant references on table "public"."discussion_threads" to "anon";

grant select on table "public"."discussion_threads" to "anon";

grant trigger on table "public"."discussion_threads" to "anon";

grant truncate on table "public"."discussion_threads" to "anon";

grant update on table "public"."discussion_threads" to "anon";

grant delete on table "public"."discussion_threads" to "authenticated";

grant insert on table "public"."discussion_threads" to "authenticated";

grant references on table "public"."discussion_threads" to "authenticated";

grant select on table "public"."discussion_threads" to "authenticated";

grant trigger on table "public"."discussion_threads" to "authenticated";

grant truncate on table "public"."discussion_threads" to "authenticated";

grant update on table "public"."discussion_threads" to "authenticated";

grant select on table "public"."discussion_threads" to "powersync_role";

grant delete on table "public"."discussion_threads" to "service_role";

grant insert on table "public"."discussion_threads" to "service_role";

grant references on table "public"."discussion_threads" to "service_role";

grant select on table "public"."discussion_threads" to "service_role";

grant trigger on table "public"."discussion_threads" to "service_role";

grant truncate on table "public"."discussion_threads" to "service_role";

grant update on table "public"."discussion_threads" to "service_role";

grant delete on table "public"."enrollments" to "anon";

grant insert on table "public"."enrollments" to "anon";

grant references on table "public"."enrollments" to "anon";

grant select on table "public"."enrollments" to "anon";

grant trigger on table "public"."enrollments" to "anon";

grant truncate on table "public"."enrollments" to "anon";

grant update on table "public"."enrollments" to "anon";

grant delete on table "public"."enrollments" to "authenticated";

grant insert on table "public"."enrollments" to "authenticated";

grant references on table "public"."enrollments" to "authenticated";

grant select on table "public"."enrollments" to "authenticated";

grant trigger on table "public"."enrollments" to "authenticated";

grant truncate on table "public"."enrollments" to "authenticated";

grant update on table "public"."enrollments" to "authenticated";

grant select on table "public"."enrollments" to "powersync_role";

grant delete on table "public"."enrollments" to "service_role";

grant insert on table "public"."enrollments" to "service_role";

grant references on table "public"."enrollments" to "service_role";

grant select on table "public"."enrollments" to "service_role";

grant trigger on table "public"."enrollments" to "service_role";

grant truncate on table "public"."enrollments" to "service_role";

grant update on table "public"."enrollments" to "service_role";

grant delete on table "public"."faculties" to "anon";

grant insert on table "public"."faculties" to "anon";

grant references on table "public"."faculties" to "anon";

grant select on table "public"."faculties" to "anon";

grant trigger on table "public"."faculties" to "anon";

grant truncate on table "public"."faculties" to "anon";

grant update on table "public"."faculties" to "anon";

grant delete on table "public"."faculties" to "authenticated";

grant insert on table "public"."faculties" to "authenticated";

grant references on table "public"."faculties" to "authenticated";

grant select on table "public"."faculties" to "authenticated";

grant trigger on table "public"."faculties" to "authenticated";

grant truncate on table "public"."faculties" to "authenticated";

grant update on table "public"."faculties" to "authenticated";

grant select on table "public"."faculties" to "powersync_role";

grant delete on table "public"."faculties" to "service_role";

grant insert on table "public"."faculties" to "service_role";

grant references on table "public"."faculties" to "service_role";

grant select on table "public"."faculties" to "service_role";

grant trigger on table "public"."faculties" to "service_role";

grant truncate on table "public"."faculties" to "service_role";

grant update on table "public"."faculties" to "service_role";

grant delete on table "public"."flashcards" to "anon";

grant insert on table "public"."flashcards" to "anon";

grant references on table "public"."flashcards" to "anon";

grant select on table "public"."flashcards" to "anon";

grant trigger on table "public"."flashcards" to "anon";

grant truncate on table "public"."flashcards" to "anon";

grant update on table "public"."flashcards" to "anon";

grant delete on table "public"."flashcards" to "authenticated";

grant insert on table "public"."flashcards" to "authenticated";

grant references on table "public"."flashcards" to "authenticated";

grant select on table "public"."flashcards" to "authenticated";

grant trigger on table "public"."flashcards" to "authenticated";

grant truncate on table "public"."flashcards" to "authenticated";

grant update on table "public"."flashcards" to "authenticated";

grant select on table "public"."flashcards" to "powersync_role";

grant delete on table "public"."flashcards" to "service_role";

grant insert on table "public"."flashcards" to "service_role";

grant references on table "public"."flashcards" to "service_role";

grant select on table "public"."flashcards" to "service_role";

grant trigger on table "public"."flashcards" to "service_role";

grant truncate on table "public"."flashcards" to "service_role";

grant update on table "public"."flashcards" to "service_role";

grant delete on table "public"."forms" to "anon";

grant insert on table "public"."forms" to "anon";

grant references on table "public"."forms" to "anon";

grant select on table "public"."forms" to "anon";

grant trigger on table "public"."forms" to "anon";

grant truncate on table "public"."forms" to "anon";

grant update on table "public"."forms" to "anon";

grant delete on table "public"."forms" to "authenticated";

grant insert on table "public"."forms" to "authenticated";

grant references on table "public"."forms" to "authenticated";

grant select on table "public"."forms" to "authenticated";

grant trigger on table "public"."forms" to "authenticated";

grant truncate on table "public"."forms" to "authenticated";

grant update on table "public"."forms" to "authenticated";

grant select on table "public"."forms" to "powersync_role";

grant delete on table "public"."forms" to "service_role";

grant insert on table "public"."forms" to "service_role";

grant references on table "public"."forms" to "service_role";

grant select on table "public"."forms" to "service_role";

grant trigger on table "public"."forms" to "service_role";

grant truncate on table "public"."forms" to "service_role";

grant update on table "public"."forms" to "service_role";

grant delete on table "public"."grades" to "anon";

grant insert on table "public"."grades" to "anon";

grant references on table "public"."grades" to "anon";

grant select on table "public"."grades" to "anon";

grant trigger on table "public"."grades" to "anon";

grant truncate on table "public"."grades" to "anon";

grant update on table "public"."grades" to "anon";

grant delete on table "public"."grades" to "authenticated";

grant insert on table "public"."grades" to "authenticated";

grant references on table "public"."grades" to "authenticated";

grant select on table "public"."grades" to "authenticated";

grant trigger on table "public"."grades" to "authenticated";

grant truncate on table "public"."grades" to "authenticated";

grant update on table "public"."grades" to "authenticated";

grant select on table "public"."grades" to "powersync_role";

grant delete on table "public"."grades" to "service_role";

grant insert on table "public"."grades" to "service_role";

grant references on table "public"."grades" to "service_role";

grant select on table "public"."grades" to "service_role";

grant trigger on table "public"."grades" to "service_role";

grant truncate on table "public"."grades" to "service_role";

grant update on table "public"."grades" to "service_role";

grant delete on table "public"."leitners" to "anon";

grant insert on table "public"."leitners" to "anon";

grant references on table "public"."leitners" to "anon";

grant select on table "public"."leitners" to "anon";

grant trigger on table "public"."leitners" to "anon";

grant truncate on table "public"."leitners" to "anon";

grant update on table "public"."leitners" to "anon";

grant delete on table "public"."leitners" to "authenticated";

grant insert on table "public"."leitners" to "authenticated";

grant references on table "public"."leitners" to "authenticated";

grant select on table "public"."leitners" to "authenticated";

grant trigger on table "public"."leitners" to "authenticated";

grant truncate on table "public"."leitners" to "authenticated";

grant update on table "public"."leitners" to "authenticated";

grant select on table "public"."leitners" to "powersync_role";

grant delete on table "public"."leitners" to "service_role";

grant insert on table "public"."leitners" to "service_role";

grant references on table "public"."leitners" to "service_role";

grant select on table "public"."leitners" to "service_role";

grant trigger on table "public"."leitners" to "service_role";

grant truncate on table "public"."leitners" to "service_role";

grant update on table "public"."leitners" to "service_role";

grant delete on table "public"."lesson_content_blocks" to "anon";

grant insert on table "public"."lesson_content_blocks" to "anon";

grant references on table "public"."lesson_content_blocks" to "anon";

grant select on table "public"."lesson_content_blocks" to "anon";

grant trigger on table "public"."lesson_content_blocks" to "anon";

grant truncate on table "public"."lesson_content_blocks" to "anon";

grant update on table "public"."lesson_content_blocks" to "anon";

grant delete on table "public"."lesson_content_blocks" to "authenticated";

grant insert on table "public"."lesson_content_blocks" to "authenticated";

grant references on table "public"."lesson_content_blocks" to "authenticated";

grant select on table "public"."lesson_content_blocks" to "authenticated";

grant trigger on table "public"."lesson_content_blocks" to "authenticated";

grant truncate on table "public"."lesson_content_blocks" to "authenticated";

grant update on table "public"."lesson_content_blocks" to "authenticated";

grant select on table "public"."lesson_content_blocks" to "powersync_role";

grant delete on table "public"."lesson_content_blocks" to "service_role";

grant insert on table "public"."lesson_content_blocks" to "service_role";

grant references on table "public"."lesson_content_blocks" to "service_role";

grant select on table "public"."lesson_content_blocks" to "service_role";

grant trigger on table "public"."lesson_content_blocks" to "service_role";

grant truncate on table "public"."lesson_content_blocks" to "service_role";

grant update on table "public"."lesson_content_blocks" to "service_role";

grant delete on table "public"."lesson_progress" to "anon";

grant insert on table "public"."lesson_progress" to "anon";

grant references on table "public"."lesson_progress" to "anon";

grant select on table "public"."lesson_progress" to "anon";

grant trigger on table "public"."lesson_progress" to "anon";

grant truncate on table "public"."lesson_progress" to "anon";

grant update on table "public"."lesson_progress" to "anon";

grant delete on table "public"."lesson_progress" to "authenticated";

grant insert on table "public"."lesson_progress" to "authenticated";

grant references on table "public"."lesson_progress" to "authenticated";

grant select on table "public"."lesson_progress" to "authenticated";

grant trigger on table "public"."lesson_progress" to "authenticated";

grant truncate on table "public"."lesson_progress" to "authenticated";

grant update on table "public"."lesson_progress" to "authenticated";

grant select on table "public"."lesson_progress" to "powersync_role";

grant delete on table "public"."lesson_progress" to "service_role";

grant insert on table "public"."lesson_progress" to "service_role";

grant references on table "public"."lesson_progress" to "service_role";

grant select on table "public"."lesson_progress" to "service_role";

grant trigger on table "public"."lesson_progress" to "service_role";

grant truncate on table "public"."lesson_progress" to "service_role";

grant update on table "public"."lesson_progress" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "powersync_role";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."libraries" to "anon";

grant insert on table "public"."libraries" to "anon";

grant references on table "public"."libraries" to "anon";

grant select on table "public"."libraries" to "anon";

grant trigger on table "public"."libraries" to "anon";

grant truncate on table "public"."libraries" to "anon";

grant update on table "public"."libraries" to "anon";

grant delete on table "public"."libraries" to "authenticated";

grant insert on table "public"."libraries" to "authenticated";

grant references on table "public"."libraries" to "authenticated";

grant select on table "public"."libraries" to "authenticated";

grant trigger on table "public"."libraries" to "authenticated";

grant truncate on table "public"."libraries" to "authenticated";

grant update on table "public"."libraries" to "authenticated";

grant select on table "public"."libraries" to "powersync_role";

grant delete on table "public"."libraries" to "service_role";

grant insert on table "public"."libraries" to "service_role";

grant references on table "public"."libraries" to "service_role";

grant select on table "public"."libraries" to "service_role";

grant trigger on table "public"."libraries" to "service_role";

grant truncate on table "public"."libraries" to "service_role";

grant update on table "public"."libraries" to "service_role";

grant delete on table "public"."modules" to "anon";

grant insert on table "public"."modules" to "anon";

grant references on table "public"."modules" to "anon";

grant select on table "public"."modules" to "anon";

grant trigger on table "public"."modules" to "anon";

grant truncate on table "public"."modules" to "anon";

grant update on table "public"."modules" to "anon";

grant delete on table "public"."modules" to "authenticated";

grant insert on table "public"."modules" to "authenticated";

grant references on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "authenticated";

grant trigger on table "public"."modules" to "authenticated";

grant truncate on table "public"."modules" to "authenticated";

grant update on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "powersync_role";

grant delete on table "public"."modules" to "service_role";

grant insert on table "public"."modules" to "service_role";

grant references on table "public"."modules" to "service_role";

grant select on table "public"."modules" to "service_role";

grant trigger on table "public"."modules" to "service_role";

grant truncate on table "public"."modules" to "service_role";

grant update on table "public"."modules" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant references on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant trigger on table "public"."notes" to "anon";

grant truncate on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant references on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant trigger on table "public"."notes" to "authenticated";

grant truncate on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "powersync_role";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant references on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant trigger on table "public"."notes" to "service_role";

grant truncate on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "powersync_role";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "powersync_role";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant select on table "public"."profiles" to "powersync_role";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."profiles" to "supabase_auth_admin";

grant insert on table "public"."profiles" to "supabase_auth_admin";

grant references on table "public"."profiles" to "supabase_auth_admin";

grant select on table "public"."profiles" to "supabase_auth_admin";

grant trigger on table "public"."profiles" to "supabase_auth_admin";

grant truncate on table "public"."profiles" to "supabase_auth_admin";

grant update on table "public"."profiles" to "supabase_auth_admin";

grant delete on table "public"."provinces" to "anon";

grant insert on table "public"."provinces" to "anon";

grant references on table "public"."provinces" to "anon";

grant select on table "public"."provinces" to "anon";

grant trigger on table "public"."provinces" to "anon";

grant truncate on table "public"."provinces" to "anon";

grant update on table "public"."provinces" to "anon";

grant delete on table "public"."provinces" to "authenticated";

grant insert on table "public"."provinces" to "authenticated";

grant references on table "public"."provinces" to "authenticated";

grant select on table "public"."provinces" to "authenticated";

grant trigger on table "public"."provinces" to "authenticated";

grant truncate on table "public"."provinces" to "authenticated";

grant update on table "public"."provinces" to "authenticated";

grant select on table "public"."provinces" to "powersync_role";

grant delete on table "public"."provinces" to "service_role";

grant insert on table "public"."provinces" to "service_role";

grant references on table "public"."provinces" to "service_role";

grant select on table "public"."provinces" to "service_role";

grant trigger on table "public"."provinces" to "service_role";

grant truncate on table "public"."provinces" to "service_role";

grant update on table "public"."provinces" to "service_role";

grant delete on table "public"."question_options" to "anon";

grant insert on table "public"."question_options" to "anon";

grant references on table "public"."question_options" to "anon";

grant select on table "public"."question_options" to "anon";

grant trigger on table "public"."question_options" to "anon";

grant truncate on table "public"."question_options" to "anon";

grant update on table "public"."question_options" to "anon";

grant delete on table "public"."question_options" to "authenticated";

grant insert on table "public"."question_options" to "authenticated";

grant references on table "public"."question_options" to "authenticated";

grant select on table "public"."question_options" to "authenticated";

grant trigger on table "public"."question_options" to "authenticated";

grant truncate on table "public"."question_options" to "authenticated";

grant update on table "public"."question_options" to "authenticated";

grant select on table "public"."question_options" to "powersync_role";

grant delete on table "public"."question_options" to "service_role";

grant insert on table "public"."question_options" to "service_role";

grant references on table "public"."question_options" to "service_role";

grant select on table "public"."question_options" to "service_role";

grant trigger on table "public"."question_options" to "service_role";

grant truncate on table "public"."question_options" to "service_role";

grant update on table "public"."question_options" to "service_role";

grant delete on table "public"."questions" to "anon";

grant insert on table "public"."questions" to "anon";

grant references on table "public"."questions" to "anon";

grant select on table "public"."questions" to "anon";

grant trigger on table "public"."questions" to "anon";

grant truncate on table "public"."questions" to "anon";

grant update on table "public"."questions" to "anon";

grant delete on table "public"."questions" to "authenticated";

grant insert on table "public"."questions" to "authenticated";

grant references on table "public"."questions" to "authenticated";

grant select on table "public"."questions" to "authenticated";

grant trigger on table "public"."questions" to "authenticated";

grant truncate on table "public"."questions" to "authenticated";

grant update on table "public"."questions" to "authenticated";

grant select on table "public"."questions" to "powersync_role";

grant delete on table "public"."questions" to "service_role";

grant insert on table "public"."questions" to "service_role";

grant references on table "public"."questions" to "service_role";

grant select on table "public"."questions" to "service_role";

grant trigger on table "public"."questions" to "service_role";

grant truncate on table "public"."questions" to "service_role";

grant update on table "public"."questions" to "service_role";

grant delete on table "public"."quiz_attempts" to "anon";

grant insert on table "public"."quiz_attempts" to "anon";

grant references on table "public"."quiz_attempts" to "anon";

grant select on table "public"."quiz_attempts" to "anon";

grant trigger on table "public"."quiz_attempts" to "anon";

grant truncate on table "public"."quiz_attempts" to "anon";

grant update on table "public"."quiz_attempts" to "anon";

grant delete on table "public"."quiz_attempts" to "authenticated";

grant insert on table "public"."quiz_attempts" to "authenticated";

grant references on table "public"."quiz_attempts" to "authenticated";

grant select on table "public"."quiz_attempts" to "authenticated";

grant trigger on table "public"."quiz_attempts" to "authenticated";

grant truncate on table "public"."quiz_attempts" to "authenticated";

grant update on table "public"."quiz_attempts" to "authenticated";

grant select on table "public"."quiz_attempts" to "powersync_role";

grant delete on table "public"."quiz_attempts" to "service_role";

grant insert on table "public"."quiz_attempts" to "service_role";

grant references on table "public"."quiz_attempts" to "service_role";

grant select on table "public"."quiz_attempts" to "service_role";

grant trigger on table "public"."quiz_attempts" to "service_role";

grant truncate on table "public"."quiz_attempts" to "service_role";

grant update on table "public"."quiz_attempts" to "service_role";

grant delete on table "public"."quizzes" to "anon";

grant insert on table "public"."quizzes" to "anon";

grant references on table "public"."quizzes" to "anon";

grant select on table "public"."quizzes" to "anon";

grant trigger on table "public"."quizzes" to "anon";

grant truncate on table "public"."quizzes" to "anon";

grant update on table "public"."quizzes" to "anon";

grant delete on table "public"."quizzes" to "authenticated";

grant insert on table "public"."quizzes" to "authenticated";

grant references on table "public"."quizzes" to "authenticated";

grant select on table "public"."quizzes" to "authenticated";

grant trigger on table "public"."quizzes" to "authenticated";

grant truncate on table "public"."quizzes" to "authenticated";

grant update on table "public"."quizzes" to "authenticated";

grant select on table "public"."quizzes" to "powersync_role";

grant delete on table "public"."quizzes" to "service_role";

grant insert on table "public"."quizzes" to "service_role";

grant references on table "public"."quizzes" to "service_role";

grant select on table "public"."quizzes" to "service_role";

grant trigger on table "public"."quizzes" to "service_role";

grant truncate on table "public"."quizzes" to "service_role";

grant update on table "public"."quizzes" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "powersync_role";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."schools" to "anon";

grant insert on table "public"."schools" to "anon";

grant references on table "public"."schools" to "anon";

grant select on table "public"."schools" to "anon";

grant trigger on table "public"."schools" to "anon";

grant truncate on table "public"."schools" to "anon";

grant update on table "public"."schools" to "anon";

grant delete on table "public"."schools" to "authenticated";

grant insert on table "public"."schools" to "authenticated";

grant references on table "public"."schools" to "authenticated";

grant select on table "public"."schools" to "authenticated";

grant trigger on table "public"."schools" to "authenticated";

grant truncate on table "public"."schools" to "authenticated";

grant update on table "public"."schools" to "authenticated";

grant select on table "public"."schools" to "powersync_role";

grant delete on table "public"."schools" to "service_role";

grant insert on table "public"."schools" to "service_role";

grant references on table "public"."schools" to "service_role";

grant select on table "public"."schools" to "service_role";

grant trigger on table "public"."schools" to "service_role";

grant truncate on table "public"."schools" to "service_role";

grant update on table "public"."schools" to "service_role";

grant delete on table "public"."subjects" to "anon";

grant insert on table "public"."subjects" to "anon";

grant references on table "public"."subjects" to "anon";

grant select on table "public"."subjects" to "anon";

grant trigger on table "public"."subjects" to "anon";

grant truncate on table "public"."subjects" to "anon";

grant update on table "public"."subjects" to "anon";

grant delete on table "public"."subjects" to "authenticated";

grant insert on table "public"."subjects" to "authenticated";

grant references on table "public"."subjects" to "authenticated";

grant select on table "public"."subjects" to "authenticated";

grant trigger on table "public"."subjects" to "authenticated";

grant truncate on table "public"."subjects" to "authenticated";

grant update on table "public"."subjects" to "authenticated";

grant select on table "public"."subjects" to "powersync_role";

grant delete on table "public"."subjects" to "service_role";

grant insert on table "public"."subjects" to "service_role";

grant references on table "public"."subjects" to "service_role";

grant select on table "public"."subjects" to "service_role";

grant trigger on table "public"."subjects" to "service_role";

grant truncate on table "public"."subjects" to "service_role";

grant update on table "public"."subjects" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "powersync_role";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."universities" to "anon";

grant insert on table "public"."universities" to "anon";

grant references on table "public"."universities" to "anon";

grant select on table "public"."universities" to "anon";

grant trigger on table "public"."universities" to "anon";

grant truncate on table "public"."universities" to "anon";

grant update on table "public"."universities" to "anon";

grant delete on table "public"."universities" to "authenticated";

grant insert on table "public"."universities" to "authenticated";

grant references on table "public"."universities" to "authenticated";

grant select on table "public"."universities" to "authenticated";

grant trigger on table "public"."universities" to "authenticated";

grant truncate on table "public"."universities" to "authenticated";

grant update on table "public"."universities" to "authenticated";

grant select on table "public"."universities" to "powersync_role";

grant delete on table "public"."universities" to "service_role";

grant insert on table "public"."universities" to "service_role";

grant references on table "public"."universities" to "service_role";

grant select on table "public"."universities" to "service_role";

grant trigger on table "public"."universities" to "service_role";

grant truncate on table "public"."universities" to "service_role";

grant update on table "public"."universities" to "service_role";

grant delete on table "public"."universities_faculties" to "anon";

grant insert on table "public"."universities_faculties" to "anon";

grant references on table "public"."universities_faculties" to "anon";

grant select on table "public"."universities_faculties" to "anon";

grant trigger on table "public"."universities_faculties" to "anon";

grant truncate on table "public"."universities_faculties" to "anon";

grant update on table "public"."universities_faculties" to "anon";

grant delete on table "public"."universities_faculties" to "authenticated";

grant insert on table "public"."universities_faculties" to "authenticated";

grant references on table "public"."universities_faculties" to "authenticated";

grant select on table "public"."universities_faculties" to "authenticated";

grant trigger on table "public"."universities_faculties" to "authenticated";

grant truncate on table "public"."universities_faculties" to "authenticated";

grant update on table "public"."universities_faculties" to "authenticated";

grant select on table "public"."universities_faculties" to "powersync_role";

grant delete on table "public"."universities_faculties" to "service_role";

grant insert on table "public"."universities_faculties" to "service_role";

grant references on table "public"."universities_faculties" to "service_role";

grant select on table "public"."universities_faculties" to "service_role";

grant trigger on table "public"."universities_faculties" to "service_role";

grant truncate on table "public"."universities_faculties" to "service_role";

grant update on table "public"."universities_faculties" to "service_role";


  create policy "allow_all_to_read"
  on "public"."answer_sheets"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete any answer"
  on "public"."answers"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any answer"
  on "public"."answers"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all answers"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any answer"
  on "public"."answers"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admins to view all bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to delete their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Allow users to insert their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Allow users to select their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Allow users to update their own bookmarks"
  on "public"."bookmarks"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Allow admin to update books"
  on "public"."books"
  as permissive
  for update
  to public
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admins to create books"
  on "public"."books"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."books"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Allow admins to create categories"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admins to update categories"
  on "public"."categories"
  as permissive
  for update
  to public
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."categories"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Admins can delete any certificate"
  on "public"."certificates"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any certificate"
  on "public"."certificates"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all certificates"
  on "public"."certificates"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any certificate"
  on "public"."certificates"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to view their own certificates"
  on "public"."certificates"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Admin can update code"
  on "public"."code"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can create code"
  on "public"."code"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."code"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Admin can manage course"
  on "public"."courses"
  as permissive
  for all
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow authenticated users to view published courses"
  on "public"."courses"
  as permissive
  for select
  to public
using ((is_published = true));



  create policy "Allow instructors to create courses"
  on "public"."courses"
  as permissive
  for insert
  to authenticated
with check (((public.get_current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])) AND (instructor_id = auth.uid())));



  create policy "Owner can manage deck_cards"
  on "public"."deck_cards"
  as permissive
  for all
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Allow users to manage their own decks"
  on "public"."decks"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Admin can create department"
  on "public"."departments"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admin to update"
  on "public"."departments"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."departments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can delete any enrollment"
  on "public"."enrollments"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any enrollment"
  on "public"."enrollments"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all enrollments"
  on "public"."enrollments"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any enrollment"
  on "public"."enrollments"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to enroll themselves"
  on "public"."enrollments"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Allow users to view their own enrollments"
  on "public"."enrollments"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Allow admin to insert"
  on "public"."faculties"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admin to update"
  on "public"."faculties"
  as permissive
  for update
  to public
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."faculties"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable delete for users based on user_id"
  on "public"."flashcards"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for users based on user_id"
  on "public"."flashcards"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "allow select builtin for anon"
  on "public"."flashcards"
  as permissive
  for select
  to anon
using ((creation = 'built-in'::public.creation_enum));



  create policy "allow select builtin or own for auth"
  on "public"."flashcards"
  as permissive
  for select
  to authenticated
using (((creation = 'built-in'::public.creation_enum) OR (user_id = auth.uid())));



  create policy "Allow admin to insert"
  on "public"."forms"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admin to update"
  on "public"."forms"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."forms"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Enable read access for all users"
  on "public"."grades"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Enable delete for users based on user_id"
  on "public"."leitners"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for users based on user_id"
  on "public"."leitners"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read for users based on user_id"
  on "public"."leitners"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable update for users based on user_id"
  on "public"."leitners"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read access for all users"
  on "public"."lesson_content_blocks"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete any lesson progress"
  on "public"."lesson_progress"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any lesson progress"
  on "public"."lesson_progress"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all lesson progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any lesson progress"
  on "public"."lesson_progress"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Enable read access for all users"
  on "public"."lessons"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Enable read access for all users"
  on "public"."libraries"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "PUBLIC ALLOW TO READ MODULES"
  on "public"."modules"
  as permissive
  for select
  to public
using (true);



  create policy "Enable Read for users based on user_id"
  on "public"."notes"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable delete for users based on user_id"
  on "public"."notes"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable insert for users based on user_id"
  on "public"."notes"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable update for users based on user_id"
  on "public"."notes"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Admins can delete any notification"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any notification"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any notification"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to update (mark as read) their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Allow users to view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Admins can delete any payment"
  on "public"."payments"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any payment"
  on "public"."payments"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any payment"
  on "public"."payments"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to view their own payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Admins can delete any profile"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow authenticated users to view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow users to insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((id = auth.uid()));



  create policy "Allow users to update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check (((id = auth.uid()) AND (role = ( SELECT p.role
   FROM public.profiles p
  WHERE (p.id = auth.uid())))));



  create policy "Enable read access for all users"
  on "public"."provinces"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Admins can delete any quiz attempt"
  on "public"."quiz_attempts"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any quiz attempt"
  on "public"."quiz_attempts"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all quiz attempts"
  on "public"."quiz_attempts"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any quiz attempt"
  on "public"."quiz_attempts"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow users to view their own quiz attempts"
  on "public"."quiz_attempts"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Anyone can read quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can delete any review"
  on "public"."reviews"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can insert any review"
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can select all reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Admins can update any review"
  on "public"."reviews"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow authenticated users to view all reviews"
  on "public"."reviews"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."schools"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."subjects"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Allow admins to delete tags"
  on "public"."tags"
  as permissive
  for delete
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow admins to update tags"
  on "public"."tags"
  as permissive
  for update
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow authenticated users to view tags"
  on "public"."tags"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow instructors and admins to create tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));



  create policy "Enable read access for all users"
  on "public"."universities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."universities_faculties"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_discussion_posts_updated_at BEFORE UPDATE ON public.discussion_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_discussion_threads_updated_at BEFORE UPDATE ON public.discussion_threads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lesson_content_blocks_updated_at BEFORE UPDATE ON public.lesson_content_blocks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sections_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created_create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile_creation();


