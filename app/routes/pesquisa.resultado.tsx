import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, useLoaderData, useNavigate } from "@remix-run/react";
import { eq, ilike, or, sql } from "drizzle-orm";
import { TbFlaskFilled } from "react-icons/tb";
import { Container } from "~/components/container";
import { db } from "~/db.server/connection";
import {
  organismoTable,
  peptideoTable,
  casoSucessoTable,
  nomePopularTable,
  funcaoBiologicaTable,
  organismoToNomePopularTable,
} from "~/db.server/schema";

export async function loader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);

  const nomePopular = searchParams.get("nomePopular");
  const nomeCientifico = searchParams.get("nomeCientifico");
  const origem = searchParams.get("origem");
  const familia = searchParams.get("familia");
  const casoSucesso = searchParams.get("casoSucesso");

  // ilike = case-insensitive like
  // postgres only
  const likes = [
    // unaccent hack, waiting on collation support
    // depends on https://github.com/drizzle-team/drizzle-orm/issues/638
    // https://www.answeroverflow.com/m/1159982488429543545 | https://archive.is/a0bFQ
    // https://www.postgresql.org/docs/current/collation.html#ICU-CUSTOM-COLLATIONS | https://archive.is/vyGPm
    nomePopular
      ? sql`unaccent(${nomePopularTable.nome}) ilike unaccent(${`%${nomePopular}%`})`
      : null,
    nomeCientifico
      ? ilike(organismoTable.nomeCientifico, `%${nomeCientifico}%`)
      : null,
    origem ? ilike(organismoTable.origem, `%${origem}%`) : null,
    familia ? ilike(organismoTable.familia, `%${familia}%`) : null,
    casoSucesso ? ilike(casoSucessoTable.value, `%${casoSucesso}%`) : null,
  ].filter((like) => like !== null);

  const results = await db
    .select({
      descobertaLPPFB: peptideoTable.descobertaLPPFB,
      sintetico: peptideoTable.sintetico,
      peptideoId: peptideoTable.id,
      identificador: peptideoTable.identificador,
      bancoDados: peptideoTable.bancoDados,
      palavrasChave: peptideoTable.palavrasChave,
      nomeCientifico: organismoTable.nomeCientifico,
      nomesPopulares: sql<Array<string>>`array_agg(${nomePopularTable.nome})`,
      funcaoBiologica: sql<
        Array<string>
      >`array_agg(${funcaoBiologicaTable.value})`,
    })
    .from(peptideoTable)
    .leftJoin(
      casoSucessoTable,
      eq(peptideoTable.id, casoSucessoTable.peptideoId),
    )
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

  return json(results);
}

export default function Resultado() {
  const data = useLoaderData<typeof loader>();

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
        <p className="text-sm text-neutral-800">
          {data.length} resultados encontrados
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-6 rounded-lg bg-neutral-50 px-4 py-2 text-lg">
        {data.map(
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
            <li key={peptideoId} className="flex flex-col gap-1">
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
                <p className="text-sm text-neutral-900">
                  <span className="font-bold">Banco de dados: </span>
                  {bancoDados ?? "(sem dados)"}
                </p>
              )}
              <p className="text-sm text-neutral-900">
                <span className="font-bold">Nome popular: </span>
                {nomesPopulares.filter((nome) => nome !== "NULL").length > 0
                  ? nomesPopulares?.join(", ")
                  : "(sem dados)"}
              </p>
              <p className="text-sm text-neutral-900">
                <span className="font-bold">Palavras-chave: </span>
                {palavrasChave ?? "(sem dados)"}
              </p>
              <p className="text-sm text-neutral-900">
                <span className="font-bold">Funções biológicas: </span>
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
