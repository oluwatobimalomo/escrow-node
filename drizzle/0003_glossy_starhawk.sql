CREATE TABLE "payoutAccounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"bankCode" text NOT NULL,
	"bankName" text NOT NULL,
	"accountNumber" text NOT NULL,
	"accountName" text NOT NULL,
	"paystackRecipientCode" text NOT NULL,
	"isDefault" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platformFeeAmount" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payoutAmount" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payoutStatus" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payoutScheduledAt" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payoutReference" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payoutAt" timestamp;--> statement-breakpoint
ALTER TABLE "payoutAccounts" ADD CONSTRAINT "payoutAccounts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;