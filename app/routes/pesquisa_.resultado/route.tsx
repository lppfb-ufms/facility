import { type SQL, eq, ilike, or, sql } from "drizzle-orm";
import { TbFlaskFilled } from "react-icons/tb";
import type { Route } from "./+types/route";

import { NavLink, useNavigate } from "react-router";
import { Container } from "~/components/container";
import { db } from "~/db/connection.server";
import {
  funcaoBiologicaTable,
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
  peptideoTable,
} from "~/db/schema";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);

  const nomePopular = searchParams.get("nomePopular");
  const nomeCientifico = searchParams.get("nomeCientifico");
  const origem = searchParams.get("origem");
  const familia = searchParams.get("familia");
  const sequencia = searchParams.get("sequencia");
  const identificador = searchParams.get("identificador");
  const palavrasChave = searchParams.get("palavrasChave");
  const bancoDados = searchParams.get("bancoDados");
  const funcoesBiologicas = searchParams.get("funcoesBiologicas");
  const microbiologia = searchParams.get("microbiologia");
  const atividadeAntifungica = searchParams.get("atividadeAntifungica");
  const propriedadesFisicoQuimicas = searchParams.get(
    "propriedadesFisicoQuimicas",
  );

  // ilike = case-insensitive like
  // postgres only
  const likes = [
    // unaccent hack, waiting on collation support
    // depends on https://github.com/drizzle-team/drizzle-orm/issues/638
    // https://www.answeroverflow.com/m/1159982488429543545 | https://archive.is/a0bFQ
    // https://www.postgresql.org/docs/current/collation.html#ICU-CUSTOM-COLLATIONS | https://archive.is/vyGPm
    !!nomePopular &&
      sql`unaccent(${nomePopularTable.nome}) ilike unaccent(${`%${nomePopular}%`})`,
    !!nomeCientifico &&
      ilike(organismoTable.nomeCientifico, `%${nomeCientifico}%`),
    !!origem && ilike(organismoTable.origem, `%${origem}%`),
    !!familia && ilike(organismoTable.familia, `%${familia}%`),
    !!sequencia && ilike(peptideoTable.sequencia, `%${sequencia}%`),
    !!identificador && ilike(peptideoTable.identificador, `%${identificador}%`),
    !!palavrasChave && ilike(peptideoTable.palavrasChave, `%${palavrasChave}%`),
    !!bancoDados && ilike(peptideoTable.bancoDados, `%${bancoDados}%`),
    !!funcoesBiologicas &&
      ilike(funcaoBiologicaTable.value, `%${funcoesBiologicas}%`),
    !!microbiologia && ilike(peptideoTable.microbiologia, `%${microbiologia}%`),
    !!atividadeAntifungica &&
      ilike(peptideoTable.atividadeAntifungica, `%${atividadeAntifungica}%`),
    !!propriedadesFisicoQuimicas &&
      ilike(
        peptideoTable.propriedadesFisicoQuimicas,
        `%${propriedadesFisicoQuimicas}%`,
      ),
  ].filter((like): like is SQL<unknown> => like !== false);

  const results = await db
    .select({
      descobertaLPPFB: peptideoTable.descobertaLPPFB,
      sintetico: peptideoTable.sintetico,
      peptideoId: peptideoTable.id,
      identificador: peptideoTable.identificador,
      bancoDados: peptideoTable.bancoDados,
      palavrasChave: peptideoTable.palavrasChave,
      nomeCientifico: organismoTable.nomeCientifico,
      nomesPopulares: sql<
        Array<string>
      >`array_agg(distinct ${nomePopularTable.nome})`,
      funcaoBiologica: sql<
        Array<string>
      >`array_agg(distinct ${funcaoBiologicaTable.value})`,
    })
    .from(peptideoTable)
    .leftJoin(organismoTable, eq(peptideoTable.organismoId, organismoTable.id))
    .leftJoin(
      organismoToNomePopularTable,
      eq(organismoTable.id, organismoToNomePopularTable.organismoId),
    )
    .leftJoin(
      nomePopularTable,
      eq(nomePopularTable.id, organismoToNomePopularTable.nomePopularId),
    )
    .leftJoin(
      funcaoBiologicaTable,
      eq(peptideoTable.id, funcaoBiologicaTable.peptideoId),
    )
    .where(or(...likes))
    .groupBy(
      peptideoTable.id,
      peptideoTable.identificador,
      peptideoTable.sequencia,
      organismoTable.nomeCientifico,
    );

  return results;
}

export default function Resultado({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <Container>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="w-min rounded-full bg-neutral-100 px-6 py-2 text-lg font-bold"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>
        <p className="mx-2 text-sm text-neutral-800">
          {loaderData.length} resultados encontrados
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-6 rounded-lg">
        {loaderData.map(
          ({
            peptideoId,
            identificador,
            sintetico,
            nomeCientifico,
            nomesPopulares,
            palavrasChave,
            bancoDados,
            descobertaLPPFB,
            funcaoBiologica,
          }) => (
            <li
              key={peptideoId}
              className="flex flex-col gap-1 rounded-2xl bg-neutral-50 p-4"
            >
              <NavLink
                to={`/peptideo/${peptideoId}`}
                className="text-2xl font-bold text-cyan-600 hover:underline"
              >
                {identificador ? identificador : "(sem identificador)"}
                {!sintetico ? (
                  nomeCientifico ? (
                    <i> - {nomeCientifico}</i>
                  ) : (
                    " - (sem nome científico)"
                  )
                ) : null}
              </NavLink>
              {descobertaLPPFB ? (
                <div className="flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-500 px-2 text-sm font-bold text-white">
                  <TbFlaskFilled /> Descoberta do LPPFB
                </div>
              ) : (
                <p className="text-neutral-800">
                  <span className="font-medium">Banco de dados: </span>
                  {bancoDados ?? "(sem dados)"}
                </p>
              )}
              <p className="text-neutral-800">
                <span className="font-medium">Nome popular: </span>
                {nomesPopulares.filter((nome) => nome !== "NULL").length > 0
                  ? nomesPopulares?.join(", ")
                  : "(sem dados)"}
              </p>
              <p className="text-neutral-800">
                <span className="font-medium">Palavras-chave: </span>
                {palavrasChave ?? "(sem dados)"}
              </p>
              <p className="text-neutral-800">
                <span className="font-medium">Funções biológicas: </span>
                {funcaoBiologica.filter((value) => value !== "NULL").length > 0
                  ? funcaoBiologica?.join(", ")
                  : "(sem dados)"}
              </p>
            </li>
          ),
        )}
      </ul>
    </Container>
  );
}
