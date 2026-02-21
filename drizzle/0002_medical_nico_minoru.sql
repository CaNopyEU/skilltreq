DELETE FROM "skills" WHERE "sport" = 'acrobatics';--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "sport" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."sport";--> statement-breakpoint
CREATE TYPE "public"."sport" AS ENUM('calisthenics-beginner', 'calisthenics-intermediate', 'calisthenics-expert');--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "sport" SET DATA TYPE "public"."sport" USING "sport"::"public"."sport";