CREATE TABLE "transaction_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"transactionId" text NOT NULL,
	"senderId" text NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
