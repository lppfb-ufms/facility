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
    id: serial().primaryKey(),
    nomeCientifico: text().unique(),
    familia: text(),
    origem: text(),
  },
  (table) => [uniqueIndex().on(table.nomeCientifico)],
);

export const organismoRelations = relations(organismoTable, ({ many }) => ({
  organismoToNomePopular: many(organismoToNomePopularTable),
}));

export const nomePopularTable = pgTable(
  "nome_popular",
  {
    id: serial().primaryKey(),
    nome: text().notNull().unique(),
  },
  (table) => [uniqueIndex().on(table.nome)],
);

export const nomePopularRelations = relations(nomePopularTable, ({ many }) => ({
  organismoToNomePopular: many(organismoToNomePopularTable),
}));

export const organismoToNomePopularTable = pgTable(
  "organismo_to_nome_popular",
  {
    organismoId: integer()
      .notNull()
      .references(() => organismoTable.id, { onDelete: "cascade" }),
    nomePopularId: integer()
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
  id: serial().primaryKey(),
  identificador: text(),
  sequencia: text().notNull(),
  sintetico: boolean().notNull().default(false),
  descobertaLPPFB: boolean().notNull().default(false),
  bancoDados: text(),
  palavrasChave: text(),
  quantidadeAminoacidos: integer(),
  massaMolecular: numeric(),
  massaMolar: numeric(),
  ensaioCelular: text(),
  microbiologia: text(),
  atividadeAntifungica: text(),
  propriedadesFisicoQuimicas: text(),
  organismoId: integer(),
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
  id: serial().primaryKey(),
  doi: text().unique(),
  titulo: text(),
});

export const publicacaoRelations = relations(publicacaoTable, ({ many }) => ({
  peptideoToPublicacao: many(peptideoToPublicacaoTable),
}));

export const peptideoToPublicacaoTable = pgTable("peptideo_to_publicacao", {
  peptideoId: integer()
    .notNull()
    .references(() => peptideoTable.id, { onDelete: "cascade" }),
  publicacaoId: integer()
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
  id: serial().primaryKey(),
  value: text().notNull(),
  peptideoId: integer()
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
  id: serial().primaryKey(),
  peptideProduct: text(),
  manufacturer: text(),
  application: text(),
});

export const casoSucessoRelations = relations(casoSucessoTable, ({ many }) => ({
  peptideoToCasoSucesso: many(peptideoToCasoSucessoTable),
}));

export const peptideoToCasoSucessoTable = pgTable("peptideo_to_caso_sucesso", {
  peptideoId: integer()
    .notNull()
    .references(() => peptideoTable.id, { onDelete: "cascade" }),
  casoSucessoId: integer()
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
    id: serial().primaryKey(),
    value: text().notNull(),
    peptideoId: integer()
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
  id: serial().primaryKey(),
  displayName: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  emailVerified: boolean().notNull().default(false),
  isAdmin: boolean().notNull().default(false),
});

export type User = typeof userTable.$inferSelect;
export type UserInsert = typeof userTable.$inferInsert;

export const emailVerificationCodeTable = pgTable("email_verification_code", {
  id: serial().primaryKey(),
  code: text().notNull(),
  email: text().notNull(),
  expiresAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now() + interval '15 minutes'`),
  userId: integer()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const sessionTable = pgTable("session", {
  id: text().primaryKey(),
  userId: integer()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp({
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .default(sql`now() + interval '2 weeks'`),
});

export type Session = typeof sessionTable.$inferSelect;
export type SessionInsert = typeof sessionTable.$inferInsert;

export const passwordResetTokenTable = pgTable("password_reset_token", {
  tokenHash: text().notNull().unique(),
  userId: integer()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`now() + interval '30 minutes'`),
});

export const imageMetadataTable = pgTable("image_metadata", {
  id: serial().primaryKey(),
  fileName: text().notNull().unique(),
  alt: text(),
  uploadedAt: timestamp().notNull().defaultNow(),
});

export const glossarioTable = pgTable("glossario", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  definition: text().notNull(),
  example: text().notNull(),
});
