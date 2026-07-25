ALTER TABLE "user" ADD COLUMN "bvnVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bvnVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bvnVerifiedName" text;