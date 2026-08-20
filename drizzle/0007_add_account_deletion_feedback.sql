CREATE TABLE "account_deletion_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"userEmail" text NOT NULL,
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
