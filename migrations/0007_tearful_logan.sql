ALTER TABLE "image_metadata" DROP CONSTRAINT "image_metadata_file_name_unique";--> statement-breakpoint
ALTER TABLE "organismo" DROP CONSTRAINT "organismo_nome_cientifico_unique";--> statement-breakpoint
ALTER TABLE "password_reset_token" DROP CONSTRAINT "password_reset_token_token_hash_unique";--> statement-breakpoint
DROP INDEX "nome_idx";--> statement-breakpoint
DROP INDEX "nome_cientifico_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "nome_popular_nome_index" ON "nome_popular" USING btree ("nome");--> statement-breakpoint
CREATE UNIQUE INDEX "organismo_nome_cientifico_index" ON "organismo" USING btree ("nome_cientifico");--> statement-breakpoint
ALTER TABLE "image_metadata" ADD CONSTRAINT "image_metadata_fileName_unique" UNIQUE("file_name");--> statement-breakpoint
ALTER TABLE "organismo" ADD CONSTRAINT "organismo_nomeCientifico_unique" UNIQUE("nome_cientifico");--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_tokenHash_unique" UNIQUE("token_hash");