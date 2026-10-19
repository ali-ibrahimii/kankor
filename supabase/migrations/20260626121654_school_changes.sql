drop trigger if exists "set_answer_sheets_updated_at" on "public"."answer_sheets";

drop trigger if exists "set_answers_updated_at" on "public"."answers";

drop trigger if exists "set_bookmarks_updated_at" on "public"."bookmarks";

drop trigger if exists "set_books_updated_at" on "public"."books";

drop trigger if exists "set_categories_updated_at" on "public"."categories";

drop trigger if exists "set_certificates_updated_at" on "public"."certificates";

drop trigger if exists "set_code_updated_at" on "public"."code";

drop trigger if exists "set_courses_updated_at" on "public"."courses";

drop trigger if exists "set_deck_cards_updated_at" on "public"."deck_cards";

drop trigger if exists "set_decks_updated_at" on "public"."decks";

drop trigger if exists "set_departments_updated_at" on "public"."departments";

drop trigger if exists "set_discussion_posts_updated_at" on "public"."discussion_posts";

drop trigger if exists "set_discussion_threads_updated_at" on "public"."discussion_threads";

drop trigger if exists "set_enrollments_updated_at" on "public"."enrollments";

drop trigger if exists "set_faculties_updated_at" on "public"."faculties";

drop trigger if exists "set_flashcards_updated_at" on "public"."flashcards";

drop trigger if exists "set_forms_updated_at" on "public"."forms";

drop trigger if exists "set_grades_updated_at" on "public"."grades";

drop trigger if exists "set_leitners_updated_at" on "public"."leitners";

drop trigger if exists "set_lesson_content_blocks_updated_at" on "public"."lesson_content_blocks";

drop trigger if exists "set_lesson_progress_updated_at" on "public"."lesson_progress";

drop trigger if exists "set_lessons_updated_at" on "public"."lessons";

drop trigger if exists "set_libraries_updated_at" on "public"."libraries";

drop trigger if exists "set_modules_updated_at" on "public"."modules";

drop trigger if exists "set_notes_updated_at" on "public"."notes";

drop trigger if exists "set_notifications_updated_at" on "public"."notifications";

drop trigger if exists "set_payments_updated_at" on "public"."payments";

drop trigger if exists "set_profiles_updated_at" on "public"."profiles";

drop trigger if exists "set_provinces_updated_at" on "public"."provinces";

drop trigger if exists "set_question_options_updated_at" on "public"."question_options";

drop trigger if exists "set_questions_updated_at" on "public"."questions";

drop trigger if exists "set_quiz_attempts_updated_at" on "public"."quiz_attempts";

drop trigger if exists "set_quizzes_updated_at" on "public"."quizzes";

drop trigger if exists "set_reviews_updated_at" on "public"."reviews";

drop trigger if exists "set_school_members_updated_at" on "public"."school_members";

drop trigger if exists "set_schools_updated_at" on "public"."schools";

drop trigger if exists "set_subjects_updated_at" on "public"."subjects";

drop trigger if exists "set_tags_updated_at" on "public"."tags";

drop trigger if exists "set_universities_updated_at" on "public"."universities";

drop trigger if exists "set_universities_faculties_updated_at" on "public"."universities_faculties";

drop policy "Admins can delete any answer" on "public"."answers";

drop policy "Admins can insert any answer" on "public"."answers";

drop policy "Admins can select all answers" on "public"."answers";

drop policy "Admins can update any answer" on "public"."answers";

drop policy "Instructors can view answers for their course quizzes" on "public"."answers";

drop policy "Students can view their own answers" on "public"."answers";

drop policy "Allow admins to view all bookmarks" on "public"."bookmarks";

drop policy "Allow admin to update books" on "public"."books";

drop policy "Allow admins to create books" on "public"."books";

drop policy "Allow admins to create categories" on "public"."categories";

drop policy "Allow admins to update categories" on "public"."categories";

drop policy "Admins can delete any certificate" on "public"."certificates";

drop policy "Admins can insert any certificate" on "public"."certificates";

drop policy "Admins can select all certificates" on "public"."certificates";

drop policy "Admins can update any certificate" on "public"."certificates";

drop policy "Admin can update code" on "public"."code";

drop policy "Admins can create code" on "public"."code";

drop policy "Admin can manage course" on "public"."courses";

drop policy "Allow instructors to create courses" on "public"."courses";

drop policy "Admin can create department" on "public"."departments";

drop policy "Allow admin to update" on "public"."departments";

drop policy "Authors and staff can delete discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can update discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users and staff can view discussion posts" on "public"."discussion_posts";

drop policy "Enrolled users can create discussion posts" on "public"."discussion_posts";

drop policy "Authors and staff can delete discussion threads" on "public"."discussion_threads";

drop policy "Authors and staff can update discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users and staff can view discussion threads" on "public"."discussion_threads";

drop policy "Enrolled users can create discussion threads" on "public"."discussion_threads";

drop policy "Admins can delete any enrollment" on "public"."enrollments";

drop policy "Admins can insert any enrollment" on "public"."enrollments";

drop policy "Admins can select all enrollments" on "public"."enrollments";

drop policy "Admins can update any enrollment" on "public"."enrollments";

drop policy "Allow admin to insert" on "public"."faculties";

drop policy "Allow admin to update" on "public"."faculties";

drop policy "allow select builtin for anon" on "public"."flashcards";

drop policy "allow select builtin or own for auth" on "public"."flashcards";

drop policy "Allow admin to insert" on "public"."forms";

drop policy "Allow admin to update" on "public"."forms";

drop policy "Admins can delete any lesson progress" on "public"."lesson_progress";

drop policy "Admins can insert any lesson progress" on "public"."lesson_progress";

drop policy "Admins can select all lesson progress" on "public"."lesson_progress";

drop policy "Admins can update any lesson progress" on "public"."lesson_progress";

drop policy "Admins can delete any notification" on "public"."notifications";

drop policy "Admins can insert any notification" on "public"."notifications";

drop policy "Admins can select all notifications" on "public"."notifications";

drop policy "Admins can update any notification" on "public"."notifications";

drop policy "Admins can delete any payment" on "public"."payments";

drop policy "Admins can insert any payment" on "public"."payments";

drop policy "Admins can select all payments" on "public"."payments";

drop policy "Admins can update any payment" on "public"."payments";

drop policy "Admins can delete any profile" on "public"."profiles";

drop policy "Admins can insert any profile" on "public"."profiles";

drop policy "Admins can select all profiles" on "public"."profiles";

drop policy "Admins can update any profile" on "public"."profiles";

drop policy "Allow users to update their own profile" on "public"."profiles";

drop policy "Instructors and admins manage question options" on "public"."question_options";

drop policy "Instructors and admins manage questions" on "public"."questions";

drop policy "Admins can delete any quiz attempt" on "public"."quiz_attempts";

drop policy "Admins can insert any quiz attempt" on "public"."quiz_attempts";

drop policy "Admins can select all quiz attempts" on "public"."quiz_attempts";

drop policy "Admins can update any quiz attempt" on "public"."quiz_attempts";

drop policy "Enrolled users and staff can view lesson quizzes" on "public"."quizzes";

drop policy "Instructors and admins manage quizzes" on "public"."quizzes";

drop policy "Admins can delete any review" on "public"."reviews";

drop policy "Admins can insert any review" on "public"."reviews";

drop policy "Admins can select all reviews" on "public"."reviews";

drop policy "Admins can update any review" on "public"."reviews";

drop policy "School members can see their fellow members" on "public"."school_members";

drop policy "School owner and super admin can manage school_members" on "public"."school_members";

drop policy "Allow admins to delete tags" on "public"."tags";

drop policy "Allow admins to update tags" on "public"."tags";

drop policy "Allow instructors and admins to create tags" on "public"."tags";

revoke references on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

alter table "public"."schools" drop constraint "schools_manager_fkey";

alter table "public"."answer_sheets" drop constraint "answer_sheets_lesson_id_fkey";

alter table "public"."answers" drop constraint "answers_question_id_fkey";

alter table "public"."answers" drop constraint "answers_quiz_attempt_id_fkey";

alter table "public"."bookmarks" drop constraint "bookmarks_user_id_fkey";

alter table "public"."books" drop constraint "books_grade_id_fkey1";

alter table "public"."books" drop constraint "books_subject_id_fkey";

alter table "public"."categories" drop constraint "categories_parent_fkey";

alter table "public"."certificates" drop constraint "certificates_course_id_fkey";

alter table "public"."certificates" drop constraint "certificates_user_id_fkey";

alter table "public"."code" drop constraint "code_department_id_fkey";

alter table "public"."code" drop constraint "code_university_id_fkey";

alter table "public"."courses" drop constraint "courses_book_id_fkey";

alter table "public"."courses" drop constraint "courses_grade_id_fkey";

alter table "public"."courses" drop constraint "courses_instructor_id_fkey";

alter table "public"."courses" drop constraint "courses_subject_id_fkey";

alter table "public"."deck_cards" drop constraint "deck_cards_deck_id_fkey";

alter table "public"."deck_cards" drop constraint "deck_cards_flashcard_id_fkey";

alter table "public"."deck_cards" drop constraint "deck_cards_user_id_fkey";

alter table "public"."decks" drop constraint "decks_book_id_fkey";

alter table "public"."decks" drop constraint "decks_user_id_fkey";

alter table "public"."departments" drop constraint "departments_faculty_id_fkey";

alter table "public"."discussion_posts" drop constraint "discussion_posts_parent_post_id_fkey";

alter table "public"."discussion_posts" drop constraint "discussion_posts_thread_id_fkey";

alter table "public"."discussion_posts" drop constraint "discussion_posts_user_id_fkey";

alter table "public"."discussion_threads" drop constraint "discussion_threads_course_id_fkey";

alter table "public"."discussion_threads" drop constraint "discussion_threads_lesson_id_fkey";

alter table "public"."discussion_threads" drop constraint "discussion_threads_user_id_fkey";

alter table "public"."enrollments" drop constraint "enrollments_course_id_fkey";

alter table "public"."enrollments" drop constraint "enrollments_last_accessed_lesson_id_fkey";

alter table "public"."enrollments" drop constraint "enrollments_user_id_fkey";

alter table "public"."enrollments" drop constraint "fk_enrollments_certificate_id";

alter table "public"."flashcards" drop constraint "flashcard_user_id_fkey";

alter table "public"."flashcards" drop constraint "flashcards_book_id_fkey";

alter table "public"."flashcards" drop constraint "flashcards_grade_id_fkey";

alter table "public"."forms" drop constraint "forms_category_id_fkey";

alter table "public"."forms" drop constraint "forms_province_id_fkey";

alter table "public"."grades" drop constraint "grades_category_id_fkey";

alter table "public"."leitners" drop constraint "leitners_book_id_fkey";

alter table "public"."leitners" drop constraint "leitners_deck_id_fkey";

alter table "public"."leitners" drop constraint "leitners_user_id_fkey";

alter table "public"."lesson_content_blocks" drop constraint "lesson_content_blocks_lesson_id_fkey";

alter table "public"."lesson_progress" drop constraint "lesson_progress_enrollment_id_fkey";

alter table "public"."lesson_progress" drop constraint "lesson_progress_lesson_id_fkey";

alter table "public"."lesson_progress" drop constraint "lesson_progress_user_id_fkey";

alter table "public"."lessons" drop constraint "lessons_book_id_fkey";

alter table "public"."lessons" drop constraint "lessons_course_id_fkey";

alter table "public"."lessons" drop constraint "lessons_module_id_fkey";

alter table "public"."libraries" drop constraint "libraries_book_id_fkey";

alter table "public"."libraries" drop constraint "libraries_category_id_fkey";

alter table "public"."libraries" drop constraint "libraries_grade_id_fkey";

alter table "public"."libraries" drop constraint "libraries_subject_id_fkey";

alter table "public"."modules" drop constraint "modules_book_id_fkey";

alter table "public"."modules" drop constraint "modules_course_id_fkey";

alter table "public"."notes" drop constraint "notes_user_id_fkey";

alter table "public"."notifications" drop constraint "notifications_actor_id_fkey";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey";

alter table "public"."payments" drop constraint "payments_course_id_fkey";

alter table "public"."payments" drop constraint "payments_enrollment_id_fkey";

alter table "public"."payments" drop constraint "payments_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_province_id_fkey";

alter table "public"."profiles" drop constraint "profiles_school_id_fkey";

alter table "public"."question_options" drop constraint "question_options_question_id_fkey";

alter table "public"."questions" drop constraint "questions_image_content_block_id_fkey";

alter table "public"."questions" drop constraint "questions_quiz_id_fkey";

alter table "public"."quiz_attempts" drop constraint "quiz_attempts_enrollment_id_fkey";

alter table "public"."quiz_attempts" drop constraint "quiz_attempts_quiz_id_fkey";

alter table "public"."quiz_attempts" drop constraint "quiz_attempts_user_id_fkey";

alter table "public"."quizzes" drop constraint "quizzes_lesson_id_fkey";

alter table "public"."quizzes" drop constraint "quizzes_school_id_fkey";

alter table "public"."reviews" drop constraint "reviews_course_id_fkey";

alter table "public"."reviews" drop constraint "reviews_user_id_fkey";

alter table "public"."school_members" drop constraint "school_members_school_id_fkey";

alter table "public"."school_members" drop constraint "school_members_user_id_fkey";

alter table "public"."universities" drop constraint "universities_province_id_fkey";

alter table "public"."universities_faculties" drop constraint "universities_faculties_faculty_id_fkey";

alter table "public"."universities_faculties" drop constraint "universities_faculties_university_id_fkey";

drop function if exists "public"."admin_update_user_role"(p_user_id uuid, p_new_role user_role);

drop function if exists "public"."create_app_notification"(p_user_id uuid, p_type notification_type, p_title text, p_message text, p_related_entity_type text, p_related_entity_id uuid, p_actor_id uuid);

drop function if exists "public"."is_user_a"(role user_role, user_id uuid);

drop function if exists "public"."get_course_details"(p_course_slug text, p_course_id uuid);

drop function if exists "public"."get_quiz_questions_for_attempt"(p_quiz_attempt_id uuid, p_user_id uuid);

drop index if exists "public"."idx_schools_manager";

drop index if exists "public"."idx_schools_manager_created";

alter table "public"."bookmarks" alter column "item_type" set data type public.bookmarkable_item_type using "item_type"::text::public.bookmarkable_item_type;

alter table "public"."courses" alter column "language" set default 'fa'::public.language_enum;

alter table "public"."courses" alter column "language" set data type public.language_enum using "language"::text::public.language_enum;

alter table "public"."courses" alter column "level" set default 'all_levels'::public.course_level;

alter table "public"."courses" alter column "level" set data type public.course_level using "level"::text::public.course_level;

alter table "public"."deck_cards" alter column "status" set default 'new'::public.card_status;

alter table "public"."deck_cards" alter column "status" set data type public.card_status using "status"::text::public.card_status;

alter table "public"."decks" alter column "algorithm" set default 'fsrs'::public.flashcard_algorithm;

alter table "public"."decks" alter column "algorithm" set data type public.flashcard_algorithm using "algorithm"::text::public.flashcard_algorithm;

alter table "public"."decks" alter column "creation" set default 'built-in'::public.creation_enum;

alter table "public"."decks" alter column "creation" set data type public.creation_enum using "creation"::text::public.creation_enum;

alter table "public"."flashcards" alter column "creation" set default 'built-in'::public.creation_enum;

alter table "public"."flashcards" alter column "creation" set data type public.creation_enum using "creation"::text::public.creation_enum;

alter table "public"."lesson_content_blocks" alter column "block_type" set data type public.lesson_content_type using "block_type"::text::public.lesson_content_type;

alter table "public"."lessons" alter column "content_type" set default 'video'::public.lesson_content_type;

alter table "public"."lessons" alter column "content_type" set data type public.lesson_content_type using "content_type"::text::public.lesson_content_type;

alter table "public"."notifications" alter column "type" set data type public.notification_type using "type"::text::public.notification_type;

alter table "public"."payments" alter column "status" set default 'pending'::public.payment_status;

alter table "public"."payments" alter column "status" set data type public.payment_status using "status"::text::public.payment_status;

alter table "public"."profiles" alter column "instructor_status" set data type public.account_status using "instructor_status"::text::public.account_status;

alter table "public"."profiles" alter column "role" set default 'student'::public.user_role;

alter table "public"."profiles" alter column "role" set data type public.user_role using "role"::text::public.user_role;

alter table "public"."questions" alter column "question_type" set data type public.question_type using "question_type"::text::public.question_type;

alter table "public"."quizzes" alter column "show_correct_answers_after" set default 'attempt'::public.show_correct_answers;

alter table "public"."quizzes" alter column "show_correct_answers_after" set data type public.show_correct_answers using "show_correct_answers_after"::text::public.show_correct_answers;

alter table "public"."school_members" alter column "role" set default 'viewer'::public.school_member_role;

alter table "public"."school_members" alter column "role" set data type public.school_member_role using "role"::text::public.school_member_role;

alter table "public"."schools" drop column "manager";

alter table "public"."schools" add column "user_id" uuid;

alter table "public"."schools" alter column "status" set default 'pending'::public.account_status;

alter table "public"."schools" alter column "status" set data type public.account_status using "status"::text::public.account_status;

CREATE UNIQUE INDEX school_members_school_id_user_id_idx ON public.school_members USING btree (school_id, user_id);

CREATE INDEX idx_schools_manager ON public.schools USING btree (user_id);

CREATE INDEX idx_schools_manager_created ON public.schools USING btree (user_id, created_at DESC);

alter table "public"."schools" add constraint "schools_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."schools" validate constraint "schools_user_id_fkey";

alter table "public"."answer_sheets" add constraint "answer_sheets_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."answer_sheets" validate constraint "answer_sheets_lesson_id_fkey";

alter table "public"."answers" add constraint "answers_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) not valid;

alter table "public"."answers" validate constraint "answers_question_id_fkey";

alter table "public"."answers" add constraint "answers_quiz_attempt_id_fkey" FOREIGN KEY (quiz_attempt_id) REFERENCES public.quiz_attempts(id) not valid;

alter table "public"."answers" validate constraint "answers_quiz_attempt_id_fkey";

alter table "public"."bookmarks" add constraint "bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."bookmarks" validate constraint "bookmarks_user_id_fkey";

alter table "public"."books" add constraint "books_grade_id_fkey1" FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON DELETE SET NULL not valid;

alter table "public"."books" validate constraint "books_grade_id_fkey1";

alter table "public"."books" add constraint "books_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) not valid;

alter table "public"."books" validate constraint "books_subject_id_fkey";

alter table "public"."categories" add constraint "categories_parent_fkey" FOREIGN KEY (parent) REFERENCES public.categories(id) not valid;

alter table "public"."categories" validate constraint "categories_parent_fkey";

alter table "public"."certificates" add constraint "certificates_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."certificates" validate constraint "certificates_course_id_fkey";

alter table "public"."certificates" add constraint "certificates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."certificates" validate constraint "certificates_user_id_fkey";

alter table "public"."code" add constraint "code_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) not valid;

alter table "public"."code" validate constraint "code_department_id_fkey";

alter table "public"."code" add constraint "code_university_id_fkey" FOREIGN KEY (university_id) REFERENCES public.universities(id) not valid;

alter table "public"."code" validate constraint "code_university_id_fkey";

alter table "public"."courses" add constraint "courses_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."courses" validate constraint "courses_book_id_fkey";

alter table "public"."courses" add constraint "courses_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."courses" validate constraint "courses_grade_id_fkey";

alter table "public"."courses" add constraint "courses_instructor_id_fkey" FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."courses" validate constraint "courses_instructor_id_fkey";

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

alter table "public"."decks" add constraint "decks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."decks" validate constraint "decks_user_id_fkey";

alter table "public"."departments" add constraint "departments_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) not valid;

alter table "public"."departments" validate constraint "departments_faculty_id_fkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_parent_post_id_fkey" FOREIGN KEY (parent_post_id) REFERENCES public.discussion_posts(id) ON DELETE CASCADE not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_parent_post_id_fkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_thread_id_fkey" FOREIGN KEY (thread_id) REFERENCES public.discussion_threads(id) not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_thread_id_fkey";

alter table "public"."discussion_posts" add constraint "discussion_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."discussion_posts" validate constraint "discussion_posts_user_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_course_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_lesson_id_fkey";

alter table "public"."discussion_threads" add constraint "discussion_threads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."discussion_threads" validate constraint "discussion_threads_user_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."enrollments" validate constraint "enrollments_course_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_last_accessed_lesson_id_fkey" FOREIGN KEY (last_accessed_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL not valid;

alter table "public"."enrollments" validate constraint "enrollments_last_accessed_lesson_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_user_id_fkey";

alter table "public"."enrollments" add constraint "fk_enrollments_certificate_id" FOREIGN KEY (certificate_id) REFERENCES public.certificates(id) ON DELETE SET NULL not valid;

alter table "public"."enrollments" validate constraint "fk_enrollments_certificate_id";

alter table "public"."flashcards" add constraint "flashcard_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."flashcards" validate constraint "flashcard_user_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."flashcards" validate constraint "flashcards_book_id_fkey";

alter table "public"."flashcards" add constraint "flashcards_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."flashcards" validate constraint "flashcards_grade_id_fkey";

alter table "public"."forms" add constraint "forms_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."forms" validate constraint "forms_category_id_fkey";

alter table "public"."forms" add constraint "forms_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.provinces(id) not valid;

alter table "public"."forms" validate constraint "forms_province_id_fkey";

alter table "public"."grades" add constraint "grades_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."grades" validate constraint "grades_category_id_fkey";

alter table "public"."leitners" add constraint "leitners_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."leitners" validate constraint "leitners_book_id_fkey";

alter table "public"."leitners" add constraint "leitners_deck_id_fkey" FOREIGN KEY (deck_id) REFERENCES public.decks(id) not valid;

alter table "public"."leitners" validate constraint "leitners_deck_id_fkey";

alter table "public"."leitners" add constraint "leitners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."leitners" validate constraint "leitners_user_id_fkey";

alter table "public"."lesson_content_blocks" add constraint "lesson_content_blocks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."lesson_content_blocks" validate constraint "lesson_content_blocks_lesson_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_enrollment_id_fkey";

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

alter table "public"."libraries" add constraint "libraries_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."libraries" validate constraint "libraries_book_id_fkey";

alter table "public"."libraries" add constraint "libraries_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."libraries" validate constraint "libraries_category_id_fkey";

alter table "public"."libraries" add constraint "libraries_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES public.grades(id) not valid;

alter table "public"."libraries" validate constraint "libraries_grade_id_fkey";

alter table "public"."libraries" add constraint "libraries_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) not valid;

alter table "public"."libraries" validate constraint "libraries_subject_id_fkey";

alter table "public"."modules" add constraint "modules_book_id_fkey" FOREIGN KEY (book_id) REFERENCES public.books(id) not valid;

alter table "public"."modules" validate constraint "modules_book_id_fkey";

alter table "public"."modules" add constraint "modules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."modules" validate constraint "modules_course_id_fkey";

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

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_province_id_fkey";

alter table "public"."profiles" add constraint "profiles_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_school_id_fkey";

alter table "public"."question_options" add constraint "question_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) not valid;

alter table "public"."question_options" validate constraint "question_options_question_id_fkey";

alter table "public"."questions" add constraint "questions_image_content_block_id_fkey" FOREIGN KEY (image_content_block_id) REFERENCES public.lesson_content_blocks(id) not valid;

alter table "public"."questions" validate constraint "questions_image_content_block_id_fkey";

alter table "public"."questions" add constraint "questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) not valid;

alter table "public"."questions" validate constraint "questions_quiz_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_enrollment_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_quiz_id_fkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_user_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) not valid;

alter table "public"."quizzes" validate constraint "quizzes_lesson_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) not valid;

alter table "public"."quizzes" validate constraint "quizzes_school_id_fkey";

alter table "public"."reviews" add constraint "reviews_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) not valid;

alter table "public"."reviews" validate constraint "reviews_course_id_fkey";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."school_members" add constraint "school_members_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE not valid;

alter table "public"."school_members" validate constraint "school_members_school_id_fkey";

alter table "public"."school_members" add constraint "school_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."school_members" validate constraint "school_members_user_id_fkey";

alter table "public"."universities" add constraint "universities_province_id_fkey" FOREIGN KEY (province_id) REFERENCES public.provinces(id) not valid;

alter table "public"."universities" validate constraint "universities_province_id_fkey";

alter table "public"."universities_faculties" add constraint "universities_faculties_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE not valid;

alter table "public"."universities_faculties" validate constraint "universities_faculties_faculty_id_fkey";

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

CREATE OR REPLACE FUNCTION public.create_school_members_on_schools_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    insert into public.school_members (
        school_id,
        user_id,
        role
    )
    values (
        new.id,
        new.user_id,
        'owner'
    )
    on conflict (school_id, user_id) do nothing;

    return new;
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

CREATE OR REPLACE FUNCTION public.complete_and_grade_quiz_attempt(p_quiz_attempt_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  instructor_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_awaiting_manual_grade int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise warning 'Quiz attempt % is already completed.', p_quiz_attempt_id;
    return quiz_attempt_record;
  end if;

  select * into quiz_record from public.quizzes where id = quiz_attempt_record.quiz_id;
  if quiz_record is null then
    raise exception 'Associated quiz (ID %) not found for attempt %.', quiz_attempt_record.quiz_id, p_quiz_attempt_id;
  end if;

  select * into lesson_record from public.lessons where id = quiz_record.lesson_id;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is not null;

  select count(*)
  into num_questions_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = p_quiz_attempt_id and a.is_correct is null;

  if num_questions_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set
      score = total_score_for_attempt,
      completed_at = now(),
      updated_at = now()
    where id = p_quiz_attempt_id
    returning * into quiz_attempt_record;

    perform public.create_app_notification(
      p_user_id := p_user_id,
      p_type := 'quiz_graded',
      p_title := 'Quiz Submitted: ' || quiz_record.title,
      p_message := 'Your quiz "' || quiz_record.title || '" has been submitted. Some questions require manual grading. Provisional score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    select c.instructor_id into instructor_id_val
    from public.courses c
    join public.lessons l on l.course_id = c.id
    where l.id = quiz_record.lesson_id;

    perform public.create_app_notification(
      p_user_id := instructor_id_val,
      p_type := 'new_assignment_submission',
      p_title := 'Quiz Needs Grading: ' || quiz_record.title,
      p_message := coalesce((select pf.full_name from public.profiles pf where pf.id = p_user_id), 'A student') || ' submitted the quiz "' || quiz_record.title || '" which requires manual grading.',
      p_related_entity_type := 'quiz_attempt',
      p_related_entity_id := p_quiz_attempt_id,
      p_actor_id := p_user_id
    );

    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = now(),
    updated_at = now()
  where id = p_quiz_attempt_id
  returning * into quiz_attempt_record;

  if is_quiz_passed and lesson_record.is_mandatory then
    perform public.complete_lesson_for_user(quiz_record.lesson_id, p_user_id);
  end if;

  perform public.create_app_notification(
    p_user_id := p_user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Graded: ' || quiz_record.title,
    p_message := 'Your quiz "' || quiz_record.title || '" has been graded. Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := p_quiz_attempt_id,
    p_actor_id := null
  );

  return quiz_attempt_record;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_lesson_for_user(p_lesson_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.lesson_progress
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  enrollment_record public.enrollments;
  lesson_record public.lessons;
  course_record public.courses;
  user_profile public.profiles;
  updated_lesson_progress public.lesson_progress;
  total_mandatory_lessons_in_course int;
  completed_mandatory_lessons_by_user int;
  total_lessons_in_course int;
  completed_lessons_by_user int;
  new_course_progress_percentage smallint;
  new_certificate_id uuid;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into lesson_record from public.lessons where id = p_lesson_id;
  if lesson_record is null then
    raise exception 'Lesson not found: ID %', p_lesson_id;
  end if;

  select * into course_record from public.courses where id = lesson_record.course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  select * into enrollment_record
  from public.enrollments
  where user_id = p_user_id and course_id = course_record.id;

  if enrollment_record is null then
    raise exception 'User % is not enrolled in the course "%" containing this lesson.', user_profile.full_name, course_record.title;
  end if;

  if enrollment_record.completed_at is not null then
    raise warning 'Course "%" is already marked as completed by user %.', course_record.title, user_profile.full_name;
  end if;

  insert into public.lesson_progress (enrollment_id, lesson_id, user_id, is_completed, completed_at, last_accessed_at)
  values (enrollment_record.id, p_lesson_id, p_user_id, true, now(), now())
  on conflict (enrollment_id, lesson_id) do update
  set
    is_completed = true,
    completed_at = coalesce(public.lesson_progress.completed_at, now()),
    last_accessed_at = now()
  returning * into updated_lesson_progress;

  select count(*) into total_mandatory_lessons_in_course
  from public.lessons l_count
  where l_count.course_id = course_record.id and l_count.is_mandatory = true;

  if total_mandatory_lessons_in_course > 0 then
    select count(distinct lp.lesson_id) into completed_mandatory_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id
      and l_check.course_id = course_record.id
      and l_check.is_mandatory = true
      and lp.is_completed = true;

    new_course_progress_percentage = least(100, (completed_mandatory_lessons_by_user * 100 / total_mandatory_lessons_in_course))::smallint;
  else
    select count(*) into total_lessons_in_course from public.lessons l_count where l_count.course_id = course_record.id;

    select count(distinct lp.lesson_id) into completed_lessons_by_user
    from public.lesson_progress lp
    join public.lessons l_check on lp.lesson_id = l_check.id
    where lp.enrollment_id = enrollment_record.id and l_check.course_id = course_record.id and lp.is_completed = true;

    if total_lessons_in_course > 0 and completed_lessons_by_user = total_lessons_in_course then
      new_course_progress_percentage = 100;
    elsif total_lessons_in_course = 0 then
      new_course_progress_percentage = 100;
    else
      new_course_progress_percentage = enrollment_record.progress_percentage;
    end if;
  end if;

  update public.enrollments
  set
    progress_percentage = new_course_progress_percentage,
    last_accessed_lesson_id = p_lesson_id,
    updated_at = now()
  where id = enrollment_record.id;

  if new_course_progress_percentage = 100 and enrollment_record.completed_at is null then
    update public.enrollments
    set completed_at = now()
    where id = enrollment_record.id;

    insert into public.certificates (user_id, course_id, course_title, user_full_name, verification_code)
    values (
      p_user_id,
      course_record.id,
      course_record.title,
      user_profile.full_name,
      upper(substr(md5(random()::text || clock_timestamp()::text), 1, 16))
    ) returning id into new_certificate_id;

    update public.enrollments set certificate_id = new_certificate_id where id = enrollment_record.id;

    perform public.create_app_notification(
      p_user_id := p_user_id,
      p_type := 'course_completion',
      p_title := 'Congratulations! Course Completed: ' || course_record.title,
      p_message := 'You have successfully completed "' || course_record.title || '". Your certificate is now available.',
      p_related_entity_type := 'certificate',
      p_related_entity_id := new_certificate_id,
      p_actor_id := null
    );

    perform public.create_app_notification(
      p_user_id := course_record.instructor_id,
      p_type := 'course_completion',
      p_title := 'Student Completed Course: ' || course_record.title,
      p_message := coalesce(user_profile.full_name, 'A student') || ' has completed your course "' || course_record.title || '".',
      p_related_entity_type := 'enrollment',
      p_related_entity_id := enrollment_record.id,
      p_actor_id := p_user_id
    );
  end if;

  return updated_lesson_progress;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.enroll_user_in_course(p_course_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.enrollments
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  course_record public.courses;
  new_enrollment public.enrollments;
  current_enrollment_count int;
  user_profile public.profiles;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided to enroll in a course.';
  end if;

  select * into course_record from public.courses where id = p_course_id;
  select * into user_profile from public.profiles where id = p_user_id;

  if course_record is null then
    raise exception 'Course not found: ID %', p_course_id;
  end if;
  if user_profile is null then
    raise exception 'User profile not found: ID %', p_user_id;
  end if;

  if not course_record.is_published then
    raise exception 'Cannot enroll in an unpublished course: %', course_record.title;
  end if;

  -- Check if already enrolled
  if exists (select 1 from public.enrollments where user_id = p_user_id and course_id = p_course_id) then
    raise exception 'User % is already enrolled in course %.', user_profile.full_name, course_record.title;
  end if;

  -- Check enrollment limit (courses.enrollment_limit = -1 means unlimited)
  if course_record.enrollment_limit <> -1 then
    select count(*) into current_enrollment_count from public.enrollments where course_id = p_course_id;
    if current_enrollment_count >= course_record.enrollment_limit then
      raise exception 'Enrollment limit reached for course: %.', course_record.title;
    end if;
  end if;

  insert into public.enrollments (user_id, course_id)
  values (p_user_id, p_course_id)
  returning * into new_enrollment;

  -- Notification for instructor
  perform public.create_app_notification(
    p_user_id := course_record.instructor_id,
    p_type := 'new_course_enrollment',
    p_title := 'New Enrollment: ' || course_record.title,
    p_message := user_profile.full_name || ' has enrolled in your course "' || course_record.title || '".',
    p_related_entity_type := 'courses',
    p_related_entity_id := p_course_id,
    p_actor_id := p_user_id
  );

  return new_enrollment;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.epoch_to_timestamp(epoch text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
AS $function$ begin return timestamp with time zone 'epoch' + ((epoch::bigint) / 1000) * interval '1 second';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_course_details(p_course_slug text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, title text, slug text, subtitle text, description text, instructor_id uuid, instructor_full_name text, instructor_avatar_url text, level public.course_level, language public.language_enum, cover_image_url text, promo_video_url text, welcome_message text, learning_objectives text[], prerequisites text[], is_published boolean, published_at timestamp with time zone, is_free boolean, price numeric, currency character, enrollment_limit integer, estimated_duration_hours integer, created_at timestamp with time zone, updated_at timestamp with time zone, average_rating numeric, total_reviews bigint, total_enrollments bigint, total_lessons integer, modules jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
begin
  if p_course_slug is null and p_course_id is null then
    raise exception 'Either course slug or course ID must be provided.';
  end if;

  return query
  select
    c.id,
    c.title,
    c.slug,
    c.subtitle,
    c.description,
    c.instructor_id,
    p.full_name as instructor_full_name,
    p.avatar_url as instructor_avatar_url,
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
    (select avg(r.rating)::numeric(2,1) from public.reviews r where r.course_id = c.id) as average_rating,
    (select count(r.id) from public.reviews r where r.course_id = c.id) as total_reviews,
    (select count(e.id) from public.enrollments e where e.course_id = c.id) as total_enrollments,
    (select count(l.id)::integer from public.lessons l where l.course_id = c.id) as total_lessons,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'order_index', m.order_index,
          'lessons', (
            select jsonb_agg(
              jsonb_build_object(
                'id', l.id,
                'title', l.title,
                'content_type', l.content_type,
                'order_index', l.order_index,
                'estimated_duration_minutes', l.estimated_duration_minutes,
                'is_previewable', l.is_previewable
              ) order by l.order_index asc
            )
            from public.lessons l
            where l.module_id = m.id
          )
        ) order by m.order_index asc
      )
      from public.modules m
      where m.course_id = c.id
    ) as modules
  from public.courses c
  left join public.profiles p on c.instructor_id = p.id
  where (p_course_slug is not null and c.slug = p_course_slug)
     or (p_course_id is not null and c.id = p_course_id);
end;
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

CREATE OR REPLACE FUNCTION public.get_quiz_by_entrance_code(p_entrance_code text)
 RETURNS public.quizzes
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
declare
  found_quiz public.quizzes;
begin
  if p_entrance_code is null or btrim(p_entrance_code) = '' then
    raise exception 'An entrance code must be provided.';
  end if;

  select * into found_quiz
  from public.quizzes
  where entrance_code = upper(btrim(p_entrance_code));

  if found_quiz is null then
    raise exception 'No quiz found for that entrance code.';
  end if;

  return found_quiz;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_attempt_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(question_id uuid, question_text text, question_type public.question_type, order_index smallint, points smallint, hint text, image_content_block_id uuid, option_id uuid, option_text text, option_order_index smallint, match_target_text text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
declare
  attempt_record public.quiz_attempts;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  return query
  select
    q.id,
    q.question_text,
    q.question_type,
    q.order_index,
    q.points,
    q.hint,
    q.image_content_block_id,
    qo.id,
    qo.option_text,
    qo.order_index,
    qo.match_target_text
  from public.questions q
  left join public.question_options qo on qo.question_id = q.id
  where q.quiz_id = attempt_record.quiz_id
  order by q.order_index asc, qo.order_index asc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_school_member_role(p_school_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.school_member_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role public.school_member_role;
begin
  select sm.role
  into v_role
  from public.school_members sm
  where sm.school_id = p_school_id
    and sm.user_id = p_user_id;

  return v_role;
end;
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

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  if jwt_role is not null then
    begin
      return jwt_role::public.user_role;
    exception
      when invalid_text_representation then
        null;
    end;
  end if;

  select role
  into db_role
  from public.profiles
  where id = get_user_role.user_id;

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

CREATE OR REPLACE FUNCTION public.instructor_grade_answer_and_update_quiz(p_answer_id uuid, p_is_correct boolean, p_points_awarded numeric, p_instructor_feedback text DEFAULT NULL::text, p_instructor_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  answer_record public.answers;
  question_id_val uuid;
  quiz_attempt_id_val uuid;
  quiz_attempt_record public.quiz_attempts;
  quiz_record public.quizzes;
  lesson_rec public.lessons;
  course_id_val uuid;
  total_score_for_attempt numeric(6,2);
  is_quiz_passed boolean;
  num_questions_still_awaiting_manual_grade int;
  was_already_passed boolean;
begin
  select a.quiz_attempt_id, a.question_id
  into quiz_attempt_id_val, question_id_val
  from public.answers a
  where a.id = p_answer_id;

  if quiz_attempt_id_val is null then
    raise exception 'Answer ID % not found.', p_answer_id;
  end if;

  select qz.* into quiz_record
  from public.quizzes qz
  join public.questions q on qz.id = q.quiz_id
  where q.id = question_id_val;

  course_id_val := public.get_course_id_from_lesson(quiz_record.lesson_id);

  if not (public.is_course_instructor(p_instructor_id, course_id_val) or public.get_current_user_role() = 'admin') then
    raise exception 'Permission denied: Not an instructor for this course or an admin.';
  end if;

  update public.answers
  set
    is_correct = p_is_correct,
    points_awarded = p_points_awarded,
    feedback = coalesce(p_instructor_feedback, feedback)
  where id = p_answer_id
  returning * into answer_record;

  select * into quiz_attempt_record from public.quiz_attempts where id = answer_record.quiz_attempt_id;
  was_already_passed := quiz_attempt_record.passed is true;

  select coalesce(sum(a.points_awarded), 0)
  into total_score_for_attempt
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.points_awarded is not null;

  select count(*)
  into num_questions_still_awaiting_manual_grade
  from public.answers a
  where a.quiz_attempt_id = quiz_attempt_record.id and a.is_correct is null and a.id <> p_answer_id;

  if num_questions_still_awaiting_manual_grade > 0 then
    update public.quiz_attempts
    set score = total_score_for_attempt, updated_at = now()
    where id = quiz_attempt_record.id
    returning * into quiz_attempt_record;

    raise notice 'Answer graded. Quiz attempt % still has % other questions awaiting manual grading.', quiz_attempt_record.id, num_questions_still_awaiting_manual_grade;
    return quiz_attempt_record;
  end if;

  if quiz_record.passing_score_percentage is not null and quiz_attempt_record.max_score_possible > 0 then
    is_quiz_passed = (total_score_for_attempt * 100.0 / quiz_attempt_record.max_score_possible) >= quiz_record.passing_score_percentage;
  elsif quiz_record.passing_score_percentage is null then
    is_quiz_passed = true;
  else
    is_quiz_passed = false;
  end if;

  update public.quiz_attempts
  set
    score = total_score_for_attempt,
    passed = is_quiz_passed,
    completed_at = coalesce(quiz_attempt_record.completed_at, now()),
    feedback_from_instructor = coalesce(quiz_attempt_record.feedback_from_instructor, '') || 'Answer ID ' || p_answer_id || ' graded. ',
    updated_at = now()
  where id = quiz_attempt_record.id
  returning * into quiz_attempt_record;

  if is_quiz_passed and not was_already_passed then
    select * into lesson_rec from public.lessons where id = quiz_record.lesson_id;
    if lesson_rec.is_mandatory then
      perform public.complete_lesson_for_user(quiz_record.lesson_id, quiz_attempt_record.user_id);
    end if;
  end if;

  perform public.create_app_notification(
    p_user_id := quiz_attempt_record.user_id,
    p_type := 'quiz_graded',
    p_title := 'Quiz Update: ' || quiz_record.title,
    p_message := 'An answer in your quiz "' || quiz_record.title || '" has been graded by the instructor. New Score: ' || total_score_for_attempt || '/' || quiz_attempt_record.max_score_possible || '. Status: ' || (case when is_quiz_passed then 'Passed' else 'Failed' end) || '.',
    p_related_entity_type := 'quiz_attempt',
    p_related_entity_id := quiz_attempt_record.id,
    p_actor_id := p_instructor_id
  );

  return quiz_attempt_record;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_published_status(p_course_id uuid, p_is_published boolean)
 RETURNS public.courses
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  updated_course public.courses;
  current_user_id uuid := auth.uid();
  current_user_role public.user_role;
begin
  select public.get_current_user_role() into current_user_role;

  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'Course not found for ID: %', p_course_id;
  end if;

  if not (public.is_course_instructor(current_user_id, p_course_id) or current_user_role = 'admin') then
    raise exception 'Permission denied: Only the course instructor or an admin can change publication status.';
  end if;

  update public.courses
  set
    is_published = p_is_published,
    published_at = case
                     when p_is_published = true and published_at is null then now()
                     when p_is_published = false then null
                     else published_at
                   end,
    updated_at = now()
  where id = p_course_id
  returning * into updated_course;

  return updated_course;
end;
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

CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  enrollment_record public.enrollments;
  quiz_record public.quizzes;
  lesson_record public.lessons;
  course_id_val uuid;
  previous_attempts_count smallint;
  new_quiz_attempt public.quiz_attempts;
  max_score_possible_for_quiz numeric(6,2);
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_record from public.quizzes where id = p_quiz_id;
  if quiz_record is null then
    raise exception 'Quiz not found: ID %', p_quiz_id;
  end if;

  if quiz_record.lesson_id is not null then
    -- Lesson-attached quiz: requires an active enrollment in the owning course.
    select * into lesson_record from public.lessons where id = quiz_record.lesson_id;
    if lesson_record is null then
      raise exception 'Associated lesson for quiz ID % not found (Lesson ID %)', p_quiz_id, quiz_record.lesson_id;
    end if;

    course_id_val := public.get_course_id_from_lesson(lesson_record.id);
    if course_id_val is null then
      raise exception 'Could not determine course for the quiz ID %.', p_quiz_id;
    end if;

    select * into enrollment_record
    from public.enrollments
    where user_id = p_user_id and course_id = course_id_val;

    if enrollment_record is null then
      raise exception 'User is not enrolled in the course containing this quiz.';
    end if;

    if enrollment_record.completed_at is not null then
      raise warning 'User has already completed this course. Still allowing quiz attempt.';
    end if;
  else
    -- Standalone quiz: no lesson/course/enrollment. Reaching this point already
    -- means the caller knows p_quiz_id, which (for a standalone quiz) is only
    -- discoverable via get_quiz_by_entrance_code(), so no further access check
    -- is needed here. enrollment_record stays null and quiz_attempts.enrollment_id
    -- is nullable to support exactly this case.
    enrollment_record := null;
  end if;

  select count(*) into previous_attempts_count
  from public.quiz_attempts
  where user_id = p_user_id and quiz_id = p_quiz_id;

  if quiz_record.max_attempts is not null and previous_attempts_count >= quiz_record.max_attempts then
    raise exception 'Maximum number of attempts (%) reached for quiz "%".', quiz_record.max_attempts, quiz_record.title;
  end if;

  select coalesce(sum(q.points), 0) into max_score_possible_for_quiz
  from public.questions q
  where q.quiz_id = p_quiz_id;

  insert into public.quiz_attempts (enrollment_id, quiz_id, user_id, attempt_number, max_score_possible)
  values (enrollment_record.id, p_quiz_id, p_user_id, previous_attempts_count + 1, max_score_possible_for_quiz)
  returning * into new_quiz_attempt;

  return new_quiz_attempt;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.start_standalone_quiz_attempt(p_entrance_code text, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.quiz_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  found_quiz public.quizzes;
begin
  found_quiz := public.get_quiz_by_entrance_code(p_entrance_code);

  if found_quiz.lesson_id is not null then
    raise exception 'Quiz "%" is attached to a course lesson; use start_quiz_attempt() with enrollment instead of an entrance code.', found_quiz.title;
  end if;

  return public.start_quiz_attempt(found_quiz.id, p_user_id);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_quiz_answer(p_quiz_attempt_id uuid, p_question_id uuid, p_selected_option_ids uuid[] DEFAULT NULL::uuid[], p_answer_text text DEFAULT NULL::text, p_structured_answer jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS public.answers
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  quiz_attempt_record public.quiz_attempts;
  question_record public.questions;
  new_answer_record public.answers;
  is_answer_correct boolean := null;
  points_awarded_for_answer numeric(5,2) := 0;
  answer_feedback text := null;
  correct_ids uuid[];
  selected_ids_count int;
  correct_ids_count int;
  matching_correct_ids_count int;
  incorrectly_selected_ids_count int;
begin
  if p_user_id is null then
    raise exception 'User ID must be provided.';
  end if;

  select * into quiz_attempt_record from public.quiz_attempts where id = p_quiz_attempt_id;
  if quiz_attempt_record is null then
    raise exception 'Quiz attempt not found: ID %', p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.user_id <> p_user_id then
    raise exception 'Permission denied: User % does not own quiz attempt %.', p_user_id, p_quiz_attempt_id;
  end if;

  if quiz_attempt_record.completed_at is not null then
    raise exception 'Cannot submit answers: Quiz attempt % is already completed.', p_quiz_attempt_id;
  end if;

  select * into question_record from public.questions where id = p_question_id and quiz_id = quiz_attempt_record.quiz_id;
  if question_record is null then
    raise exception 'Question ID % not found or does not belong to quiz ID %.', p_question_id, quiz_attempt_record.quiz_id;
  end if;

  case question_record.question_type
    when 'multiple_choice_single_correct', 'true_false', 'yes_no' then
      if array_length(p_selected_option_ids, 1) = 1 then
        select qo.is_correct, qo.feedback
        into is_answer_correct, answer_feedback
        from public.question_options qo
        where qo.question_id = p_question_id and qo.id = p_selected_option_ids[1];

        is_answer_correct := coalesce(is_answer_correct, false);
      else
        is_answer_correct := false;
        answer_feedback := 'Please select exactly one option.';
      end if;

    when 'multiple_choice_multiple_correct' then
      select array_agg(id) into correct_ids from public.question_options where question_id = p_question_id and is_correct = true;
      correct_ids_count := coalesce(array_length(correct_ids, 1), 0);
      selected_ids_count := coalesce(array_length(p_selected_option_ids, 1), 0);

      if selected_ids_count = 0 then
        is_answer_correct := (correct_ids_count = 0);
      else
        select count(*) into matching_correct_ids_count from unnest(p_selected_option_ids) sel_id where sel_id = any(correct_ids);
        select count(*) into incorrectly_selected_ids_count from unnest(p_selected_option_ids) sel_id where sel_id <> all(coalesce(correct_ids, array[]::uuid[]));

        if matching_correct_ids_count = correct_ids_count and incorrectly_selected_ids_count = 0 then
          is_answer_correct := true;
        else
          is_answer_correct := false;
          answer_feedback := 'One or more selected options are incorrect, or not all correct options were chosen.';
        end if;
      end if;

    when 'short_answer_text', 'long_answer_text', 'fill_in_the_blanks', 'matching', 'ordering', 'image_based_question' then
      is_answer_correct := null;
      answer_feedback := 'This answer will be reviewed by an instructor or requires specific processing.';

    else
      is_answer_correct := null;
      answer_feedback := 'Grading for this question type is not yet implemented.';
  end case;

  if is_answer_correct = true then
    points_awarded_for_answer := question_record.points;
  end if;

  insert into public.answers (
    quiz_attempt_id,
    question_id,
    selected_option_ids,
    answer_text,
    structured_answer,
    is_correct,
    points_awarded,
    feedback
  )
  values (
    p_quiz_attempt_id,
    p_question_id,
    p_selected_option_ids,
    p_answer_text,
    p_structured_answer,
    is_answer_correct,
    points_awarded_for_answer,
    answer_feedback
  )
  on conflict (quiz_attempt_id, question_id) do update set
    selected_option_ids = excluded.selected_option_ids,
    answer_text = excluded.answer_text,
    structured_answer = excluded.structured_answer,
    is_correct = excluded.is_correct,
    points_awarded = excluded.points_awarded,
    feedback = excluded.feedback,
    submitted_at = now()
  returning * into new_answer_record;

  return new_answer_record;
end;
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

grant delete on table "public"."school_members" to "anon";

grant insert on table "public"."school_members" to "anon";

grant select on table "public"."school_members" to "anon";

grant update on table "public"."school_members" to "anon";

grant delete on table "public"."school_members" to "authenticated";

grant insert on table "public"."school_members" to "authenticated";

grant select on table "public"."school_members" to "authenticated";

grant update on table "public"."school_members" to "authenticated";

grant delete on table "public"."school_members" to "service_role";

grant insert on table "public"."school_members" to "service_role";

grant select on table "public"."school_members" to "service_role";

grant update on table "public"."school_members" to "service_role";


  create policy "schools owner can delete"
  on "public"."schools"
  as permissive
  for delete
  to authenticated
using (public.is_owner(user_id));



  create policy "schools owner can insert"
  on "public"."schools"
  as permissive
  for insert
  to authenticated
with check (public.is_owner(user_id));



  create policy "schools owner can update"
  on "public"."schools"
  as permissive
  for update
  to authenticated
using (public.is_owner(user_id))
with check (public.is_owner(user_id));



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



  create policy "Instructors can view answers for their course quizzes"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using (public.is_course_instructor(auth.uid(), ( SELECT l.course_id
   FROM ((public.quiz_attempts qa
     JOIN public.quizzes q ON ((qa.quiz_id = q.id)))
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (qa.id = answers.quiz_attempt_id))));



  create policy "Students can view their own answers"
  on "public"."answers"
  as permissive
  for select
  to authenticated
using ((( SELECT qa.user_id
   FROM public.quiz_attempts qa
  WHERE (qa.id = answers.quiz_attempt_id)) = auth.uid()));



  create policy "Allow admins to view all bookmarks"
  on "public"."bookmarks"
  as permissive
  for select
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role));



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



  create policy "Admin can manage course"
  on "public"."courses"
  as permissive
  for all
  to authenticated
using ((public.get_current_user_role() = 'admin'::public.user_role))
with check ((public.get_current_user_role() = 'admin'::public.user_role));



  create policy "Allow instructors to create courses"
  on "public"."courses"
  as permissive
  for insert
  to authenticated
with check (((public.get_current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])) AND (instructor_id = auth.uid())));



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



  create policy "Authors and staff can delete discussion posts"
  on "public"."discussion_posts"
  as permissive
  for delete
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Authors and staff can update discussion posts"
  on "public"."discussion_posts"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))))
with check (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users and staff can view discussion posts"
  on "public"."discussion_posts"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id)))));



  create policy "Enrolled users can create discussion posts"
  on "public"."discussion_posts"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))) OR public.is_enrolled(auth.uid(), ( SELECT t.course_id
   FROM public.discussion_threads t
  WHERE (t.id = discussion_posts.thread_id))))));



  create policy "Authors and staff can delete discussion threads"
  on "public"."discussion_threads"
  as permissive
  for delete
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), course_id)));



  create policy "Authors and staff can update discussion threads"
  on "public"."discussion_threads"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), course_id)))
with check (((user_id = auth.uid()) OR (public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), course_id)));



  create policy "Enrolled users and staff can view discussion threads"
  on "public"."discussion_threads"
  as permissive
  for select
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), course_id) OR public.is_enrolled(auth.uid(), course_id)));



  create policy "Enrolled users can create discussion threads"
  on "public"."discussion_threads"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), course_id) OR public.is_enrolled(auth.uid(), course_id))));



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



  create policy "Allow users to update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((id = auth.uid()))
with check (((id = auth.uid()) AND (role = ( SELECT p.role
   FROM public.profiles p
  WHERE (p.id = auth.uid())))));



  create policy "Instructors and admins manage question options"
  on "public"."question_options"
  as permissive
  for all
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT l.course_id
   FROM ((public.questions q2
     JOIN public.quizzes q ON ((q2.quiz_id = q.id)))
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (q2.id = question_options.question_id)))))
with check (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT l.course_id
   FROM ((public.questions q2
     JOIN public.quizzes q ON ((q2.quiz_id = q.id)))
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (q2.id = question_options.question_id)))));



  create policy "Instructors and admins manage questions"
  on "public"."questions"
  as permissive
  for all
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT l.course_id
   FROM (public.quizzes q
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (q.id = questions.quiz_id)))))
with check (((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), ( SELECT l.course_id
   FROM (public.quizzes q
     JOIN public.lessons l ON ((q.lesson_id = l.id)))
  WHERE (q.id = questions.quiz_id)))));



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



  create policy "Enrolled users and staff can view lesson quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to authenticated
using (((lesson_id IS NOT NULL) AND ((public.get_current_user_role() = 'admin'::public.user_role) OR public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(lesson_id)) OR public.is_enrolled(auth.uid(), public.get_course_id_from_lesson(lesson_id)))));



  create policy "Instructors and admins manage quizzes"
  on "public"."quizzes"
  as permissive
  for all
  to authenticated
using (((public.get_current_user_role() = 'admin'::public.user_role) OR ((lesson_id IS NOT NULL) AND public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(lesson_id)))))
with check (((public.get_current_user_role() = 'admin'::public.user_role) OR ((lesson_id IS NOT NULL) AND public.is_course_instructor(auth.uid(), public.get_course_id_from_lesson(lesson_id)))));



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



  create policy "School members can see their fellow members"
  on "public"."school_members"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.school_members me
  WHERE ((me.school_id = school_members.school_id) AND (me.user_id = auth.uid())))));



  create policy "School owner and super admin can manage school_members"
  on "public"."school_members"
  as permissive
  for all
  to authenticated
using ((public.is_school_owner(school_id) OR public.is_admin()))
with check ((public.is_school_owner(school_id) OR public.is_admin()));



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



  create policy "Allow instructors and admins to create tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check ((public.get_current_user_role() = ANY (ARRAY['instructor'::public.user_role, 'admin'::public.user_role])));


CREATE TRIGGER on_schools_created AFTER INSERT ON public.schools FOR EACH ROW EXECUTE FUNCTION public.create_school_members_on_schools_created();

CREATE TRIGGER set_answer_sheets_updated_at BEFORE UPDATE ON public.answer_sheets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_answers_updated_at BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_code_updated_at BEFORE UPDATE ON public.code FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_deck_cards_updated_at BEFORE UPDATE ON public.deck_cards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_decks_updated_at BEFORE UPDATE ON public.decks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_discussion_posts_updated_at BEFORE UPDATE ON public.discussion_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_discussion_threads_updated_at BEFORE UPDATE ON public.discussion_threads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_faculties_updated_at BEFORE UPDATE ON public.faculties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_leitners_updated_at BEFORE UPDATE ON public.leitners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lesson_content_blocks_updated_at BEFORE UPDATE ON public.lesson_content_blocks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_libraries_updated_at BEFORE UPDATE ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_provinces_updated_at BEFORE UPDATE ON public.provinces FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_question_options_updated_at BEFORE UPDATE ON public.question_options FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_school_members_updated_at BEFORE UPDATE ON public.school_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_universities_faculties_updated_at BEFORE UPDATE ON public.universities_faculties FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

drop trigger if exists "on_auth_user_created_create_profile" on "auth"."users";

CREATE TRIGGER on_auth_user_created_create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile_creation();


