CREATE TYPE "public"."progress_status" AS ENUM('locked', 'in_progress', 'unlocked', 'mastered');--> statement-breakpoint
CREATE TYPE "public"."sport" AS ENUM('calisthenics');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbr" text,
	"category_id" text,
	"sport" "sport" NOT NULL,
	"difficulty" integer NOT NULL,
	"description" text,
	"type" text DEFAULT 'skill' NOT NULL,
	"progressions" jsonb,
	"tutorials" jsonb,
	"requires" jsonb DEFAULT '[]'::jsonb,
	"mastery_criteria" text
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"status" "progress_status" DEFAULT 'locked' NOT NULL,
	"current_step" integer DEFAULT 0,
	"note" text,
	"started_at" timestamp with time zone,
	"mastered_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_progress_user_id_skill_id_pk" PRIMARY KEY("user_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;