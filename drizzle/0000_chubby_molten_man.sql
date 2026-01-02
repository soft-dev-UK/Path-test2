CREATE TABLE "artworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_user_id" text NOT NULL,
	"title" text NOT NULL,
	"strokes_data" text NOT NULL,
	"is_dark_bg" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
