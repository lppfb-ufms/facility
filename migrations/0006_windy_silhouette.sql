CREATE TABLE IF NOT EXISTS "peptideo_to_caso_sucesso" (
	"peptideo_id" integer NOT NULL,
	"caso_sucesso_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caso_sucesso" RENAME COLUMN "value" TO "peptide_product";--> statement-breakpoint
ALTER TABLE "caso_sucesso" DROP CONSTRAINT "caso_sucesso_peptideo_id_peptideo_id_fk";
--> statement-breakpoint
ALTER TABLE "caso_sucesso" ADD COLUMN "manufacturer" text;--> statement-breakpoint
ALTER TABLE "caso_sucesso" ADD COLUMN "application" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peptideo_to_caso_sucesso" ADD CONSTRAINT "peptideo_to_caso_sucesso_peptideo_id_peptideo_id_fk" FOREIGN KEY ("peptideo_id") REFERENCES "public"."peptideo"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "peptideo_to_caso_sucesso" ADD CONSTRAINT "peptideo_to_caso_sucesso_caso_sucesso_id_caso_sucesso_id_fk" FOREIGN KEY ("caso_sucesso_id") REFERENCES "public"."caso_sucesso"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "caso_sucesso" DROP COLUMN IF EXISTS "peptideo_id";