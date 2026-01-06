CREATE TABLE "received_artworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"receiver_id" text NOT NULL,
	"artwork_id" integer NOT NULL,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "received_artworks" ADD CONSTRAINT "received_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE no action ON UPDATE no action;