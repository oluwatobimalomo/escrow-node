CREATE TABLE "questionnaire_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"participantId" text,
	"susResponses" jsonb NOT NULL,
	"susScore" numeric(5, 2) NOT NULL,
	"trustResponses" jsonb NOT NULL,
	"trustMean" numeric(4, 2) NOT NULL,
	"qualitative" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
