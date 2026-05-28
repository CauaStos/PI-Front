ALTER TYPE "public"."order_status" ADD VALUE 'finalizada' BEFORE 'cancelada';--> statement-breakpoint
ALTER TABLE "comandas" ADD COLUMN "closed_at" timestamp with time zone;