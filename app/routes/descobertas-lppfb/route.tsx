import { eq, sql } from "drizzle-orm";
import { Link } from "react-router";
import { Container } from "~/components/container";
import { db } from "~/db/connection.server";
import {
  funcaoBiologicaTable,
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
  peptideoTable,
} from "~/db/schema";
import type { Route } from "./+types/route";

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

export default function Resultado({ loaderData }: Route.ComponentProps) {
  const descobertas = loaderData;

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
              <p className="text-neutral-800">
                <span className="font-medium">Nome popular: </span>
                {nomesPopulares.filter((nome) => nome !== "NULL").length > 0
                  ? nomesPopulares?.join(", ")
                  : "(sem dados)"}
              </p>
              <p className="break-words text-neutral-800">
                <span className="font-medium">Sequência: </span>
                {sequencia ?? "(sem dados)"}
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
