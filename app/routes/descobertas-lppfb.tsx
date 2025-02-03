import { eq, sql } from "drizzle-orm";
import { Link, useLoaderData } from "react-router";
import { Container } from "~/components/container";
import { db } from "~/db/connection.server";
import {
  funcaoBiologicaTable,
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
  peptideoTable,
} from "~/db/schema";

export async function loader() {
  const descobertas = await db
    .select({
      peptideoId: peptideoTable.id,
      identificador: peptideoTable.identificador,
      sintetico: peptideoTable.sintetico,
      sequencia: peptideoTable.sequencia,
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
    .where(eq(peptideoTable.descobertaLPPFB, true))
    .groupBy(
      peptideoTable.id,
      peptideoTable.identificador,
      peptideoTable.sintetico,
      peptideoTable.sequencia,
      organismoTable.nomeCientifico,
    );
  return descobertas;
}

export default function Resultado() {
  const descobertas = useLoaderData<typeof loader>();

  return (
    <Container title="Descobertas do LPPFB">
      <ul className="mt-4 flex flex-col gap-6 rounded-lg">
        {descobertas.map(
          ({
            peptideoId,
            identificador,
            sintetico,
            nomeCientifico,
            nomesPopulares,
            sequencia,
            funcaoBiologica,
          }) => (
            <li
              key={peptideoId}
              className="flex flex-col gap-1 rounded-2xl bg-neutral-50 px-4 py-2"
            >
              <Link
                prefetch="intent"
                to={`/peptideo/${peptideoId}`}
                className="mt-1 text-2xl font-bold text-cyan-600 hover:underline"
              >
                {identificador ? identificador : "(sem identificador)"}
                {!sintetico ? (
                  nomeCientifico ? (
                    <i> - {nomeCientifico}</i>
                  ) : (
                    " - (sem nome científico)"
                  )
                ) : null}
              </Link>
              <p className="text-neutral-900">
                <b>Nome popular: </b>
                {nomesPopulares.filter((nome) => nome !== "NULL").length > 0
                  ? nomesPopulares?.join(", ")
                  : "(sem dados)"}
              </p>
              <p className="break-words text-neutral-900">
                <b>Sequência: </b>
                {sequencia ?? "(sem dados)"}
              </p>
              <p className="text-neutral-900">
                <b>Funções biológicas: </b>
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
