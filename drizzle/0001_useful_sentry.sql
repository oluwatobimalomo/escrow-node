ALTER TABLE "disputes" ADD COLUMN "resolvedById" text;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "adminNote" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "refundAmount" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "refundReference" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banReason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banExpires" timestamp;