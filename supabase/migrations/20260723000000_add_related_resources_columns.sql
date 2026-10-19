-- Add columns to handle creator-selected related resources

alter table "public"."courses"
  add column "related_decks_ids" uuid[] not null default '{}',
  add column "related_quizzes_ids" uuid[] not null default '{}',
  add column "related_libraries_ids" uuid[] not null default '{}';

alter table "public"."decks"
  add column "related_courses_ids" uuid[] not null default '{}',
  add column "related_libraries_ids" uuid[] not null default '{}';

alter table "public"."quizzes"
  add column "related_courses_ids" uuid[] not null default '{}',
  add column "related_decks_ids" uuid[] not null default '{}';

alter table "public"."libraries"
  add column "related_courses_ids" uuid[] not null default '{}',
  add column "related_decks_ids" uuid[] not null default '{}';
