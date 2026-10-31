CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"biller" text NOT NULL,
	"reference" text NOT NULL,
	"phone" text NOT NULL,
	"amount_fils" integer NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
