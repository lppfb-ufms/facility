import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
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
  casoSucesso: many(casoSucessoTable),
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
  peptideoId: integer("peptideo_id").notNull(),
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
  value: text("value").notNull(),
  peptideoId: integer("peptideo_id").notNull(),
});

export const casoSucessoRelations = relations(casoSucessoTable, ({ one }) => ({
  peptideo: one(peptideoTable, {
    fields: [casoSucessoTable.peptideoId],
    references: [peptideoTable.id],
  }),
}));

export const caracteristicasAdicionaisTable = pgTable(
  "caracteristicas_adicionais",
  {
    id: serial("id").primaryKey(),
    value: text("value").notNull(),
    peptideoId: integer("peptideo_id").notNull(),
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

export const rolesEnum = pgEnum("roles", [
  "read",
  "update",
  "insert",
  "delete",
  "admin",
]);

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: rolesEnum("role").notNull().default("read"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof userTable.$inferSelect;

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
