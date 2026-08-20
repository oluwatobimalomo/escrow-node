CREATE TABLE "product_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"sellerId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image" text,
	"price" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "listingId" text;--> statement-breakpoint
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_sellerId_user_id_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;