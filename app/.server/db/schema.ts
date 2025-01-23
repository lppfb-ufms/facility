import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const organismoTable = pgTable(
  "organismo",
  {
    id: serial("id").primaryKey(),
    nomeCientifico: text("nome_cientifico").unique(),
    familia: text("familia"),
    origem: text("origem"),
  },
  (table) => ({
    nomeCientificoIdx: uniqueIndex("nome_cientifico_idx").on(
      table.nomeCientifico,
    ),
  }),
);

export const organismoRelations = relations(organismoTable, ({ many }) => ({
  organismoToNomePopular: many(organismoToNomePopularTable),
}));

export const nomePopularTable = pgTable(
  "nome_popular",
  {
    id: serial("id").primaryKey(),
    nome: text("nome").notNull().unique(),
  },
  (table) => ({
    nomeIdx: uniqueIndex("nome_idx").on(table.nome),
  }),
);

export const nomePopularRelations = relations(nomePopularTable, ({ many }) => ({
  organismoToNomePopular: many(organismoToNomePopularTable),
}));

export const organismoToNomePopularTable = pgTable(
  "organismo_to_nome_popular",
  {
    organismoId: integer("organismo_id")
      .notNull()
      .references(() => organismoTable.id, { onDelete: "cascade" }),
    nomePopularId: integer("nome_popular_id")
      .notNull()
      .references(() => nomePopularTable.id, { onDelete: "cascade" }),
  },
);

export const organismoToNomePopularRelations = relations(
  organismoToNomePopularTable,
  ({ one }) => ({
    organismo: one(organismoTable, {
      fields: [organismoToNomePopularTable.organismoId],
      references: [organismoTable.id],
    }),
    nomePopular: one(nomePopularTable, {
      fields: [organismoToNomePopularTable.nomePopularId],
      references: [nomePopularTable.id],
    }),
  }),
);

export const peptideoTable = pgTable("peptideo", {
  id: serial("id").primaryKey(),
  identificador: text("identificador"),
  sequencia: text("sequencia").notNull(),
  sintetico: boolean("sintetico").notNull().default(false),
  descobertaLPPFB: boolean("descoberta_lppfb").notNull().default(false),
  bancoDados: text("banco_dados"),
  palavrasChave: text("palavras_chave"),
  quantidadeAminoacidos: integer("quantidade_aminoacidos"),
  massaMolecular: numeric("massa_molecular"),
  massaMolar: numeric("massa_molar"),
  ensaioCelular: text("ensaio_celular"),
  microbiologia: text("microbiologia"),
  atividadeAntifungica: text("atividade_antifungica"),
  propriedadesFisicoQuimicas: text("propriedades_fisico_quimicas"),
  organismoId: integer("organismo_id"),
});

export const peptideoRelations = relations(peptideoTable, ({ one, many }) => ({
  organismo: one(organismoTable, {
    fields: [peptideoTable.organismoId],
    references: [organismoTable.id],
  }),
  funcaoBiologica: many(funcaoBiologicaTable),
  peptideoToCasoSucesso: many(peptideoToCasoSucessoTable),
  caracteristicasAdicionais: many(caracteristicasAdicionaisTable),
  peptideoToPublicacao: many(peptideoToPublicacaoTable),
}));

export const publicacaoTable = pgTable("publicacao", {
  id: serial("id").primaryKey(),
  doi: text("doi").unique(),
  titulo: text("titulo"),
});

export const publicacaoRelations = relations(publicacaoTable, ({ many }) => ({
  peptideoToPublicacao: many(peptideoToPublicacaoTable),
}));

export const peptideoToPublicacaoTable = pgTable("peptideo_to_publicacao", {
  peptideoId: integer("peptideo_id")
    .notNull()
    .references(() => peptideoTable.id, { onDelete: "cascade" }),
  publicacaoId: integer("publicacao_id")
    .notNull()
    .references(() => publicacaoTable.id, { onDelete: "cascade" }),
});

export const peptideoToPublicacaoRelations = relations(
  peptideoToPublicacaoTable,
  ({ one }) => ({
    peptideo: one(peptideoTable, {
      fields: [peptideoToPublicacaoTable.peptideoId],
      references: [peptideoTable.id],
    }),
    publicacao: one(publicacaoTable, {
      fields: [peptideoToPublicacaoTable.publicacaoId],
      references: [publicacaoTable.id],
    }),
  }),
);

export const funcaoBiologicaTable = pgTable("funcao_biologica", {
  id: serial("id").primaryKey(),
  value: text("value").notNull(),
  peptideoId: integer("peptideo_id")
    .notNull()
    .references(() => peptideoTable.id, { onDelete: "cascade" }),
});

export const funcaoBiologicaRelations = relations(
  funcaoBiologicaTable,
  ({ one }) => ({
    peptideo: one(peptideoTable, {
      fields: [funcaoBiologicaTable.peptideoId],
      references: [peptideoTable.id],
    }),
  }),
);

export const casoSucessoTable = pgTable("caso_sucesso", {
  id: serial("id").primaryKey(),
  peptideProduct: text("peptide_product"),
  manufacturer: text("manufacturer"),
  application: text("application"),
});

export const casoSucessoRelations = relations(casoSucessoTable, ({ many }) => ({
  peptideoToCasoSucesso: many(peptideoToCasoSucessoTable),
}));

export const peptideoToCasoSucessoTable = pgTable("peptideo_to_caso_sucesso", {
  peptideoId: integer("peptideo_id")
    .notNull()
    .references(() => peptideoTable.id, { onDelete: "cascade" }),
  casoSucessoId: integer("caso_sucesso_id")
    .notNull()
    .references(() => casoSucessoTable.id, { onDelete: "cascade" }),
});

export const peptideoToCasoSucessoRelations = relations(
  peptideoToCasoSucessoTable,
  ({ one }) => ({
    peptideo: one(peptideoTable, {
      fields: [peptideoToCasoSucessoTable.peptideoId],
      references: [peptideoTable.id],
    }),
    casoSucesso: one(casoSucessoTable, {
      fields: [peptideoToCasoSucessoTable.casoSucessoId],
      references: [casoSucessoTable.id],
    }),
  }),
);

export const caracteristicasAdicionaisTable = pgTable(
  "caracteristicas_adicionais",
  {
    id: serial("id").primaryKey(),
    value: text("value").notNull(),
    peptideoId: integer("peptideo_id")
      .notNull()
      .references(() => peptideoTable.id, { onDelete: "cascade" }),
  },
);

export const caracteristicasAdicionaisRelations = relations(
  caracteristicasAdicionaisTable,
  ({ one }) => ({
    peptideo: one(peptideoTable, {
      fields: [caracteristicasAdicionaisTable.peptideoId],
      references: [peptideoTable.id],
    }),
  }),
);

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export type User = typeof userTable.$inferSelect;

export const emailVerificationCodeTable = pgTable("email_verification_code", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now() + interval '15 minutes'`),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const passwordResetTokenTable = pgTable("password_reset_token", {
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now() + interval '30 minutes'`),
});

export const imageMetadataTable = pgTable("image_metadata", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull().unique(),
  alt: text("alt"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const glossarioTable = pgTable("glossario", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  definition: text("definition").notNull(),
  example: text("example").notNull(),
});
