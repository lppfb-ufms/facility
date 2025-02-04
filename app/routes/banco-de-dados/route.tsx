import { Suspense, use } from "react";
import { Link } from "react-router";
import { Container } from "~/components/container";
import { db } from "~/db/connection.server";
import type { Route } from ".react-router/types/app/routes/banco-de-dados/+types/route";

export async function loader() {
  const query = db.query.peptideoTable
    .findMany({
      columns: {
        id: true,
        identificador: true,
        sequencia: true,
      },
      with: {
        organismo: {
          columns: {
            nomeCientifico: true,
          },
          with: {
            organismoToNomePopular: {
              columns: {},
              with: {
                nomePopular: true,
              },
            },
          },
        },
      },
    })
    .execute();

  return { query };
}

export default function ListPanel({ loaderData }: Route.ComponentProps) {
  const { query } = loaderData;

  return (
    <Container title="Banco de Dados">
      <div className="m-4 flex items-center justify-between text-cyan-700">
        <Suspense fallback={<p>... registros encontrados</p>}>
          <ResultCount promise={query} />
        </Suspense>
      </div>

      <div className="relative my-2 w-full overflow-x-auto rounded-lg border border-neutral-100">
        <table className="w-full text-left">
          <thead className="bg-gradient-to-t from-neutral-200 to-neutral-100 text-lg font-bold outline">
            <tr>
              <th scope="col" className="px-4 py-3">
                Identificador
              </th>
              <th scope="col" className="px-4 py-3">
                Nome científico
              </th>
              <th scope="col" className="px-4 py-3">
                Nome popular
              </th>
              <th scope="col" className="px-4 py-3">
                Sequência
              </th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <Suspense
            fallback={
              <tbody>
                <tr>
                  <td className="p-4">...</td>
                  <td className="p-4">...</td>
                  <td className="p-4">...</td>
                  <td className="p-4">...</td>
                  <td className="p-4">...</td>
                </tr>
              </tbody>
            }
          >
            <TableData promise={query} />
          </Suspense>
        </table>
      </div>
    </Container>
  );
}

function ResultCount({
  promise,
}: { promise: Route.ComponentProps["loaderData"]["query"] }) {
  const data = use(promise);
  return <p>{data.length} registros encontrados</p>;
}

function TableData({
  promise,
}: { promise: Route.ComponentProps["loaderData"]["query"] }) {
  const data = use(promise);

  return (
    <tbody>
      {data.map(({ identificador, sequencia, organismo, id }) => (
        <tr
          key={id}
          className="even:bg-neutral-200] odd:bg-neutral-50"
          style={{ contentVisibility: "auto" }}
        >
          <td className="px-4 py-4">{identificador ?? "(sem dados)"}</td>
          {organismo?.nomeCientifico ? (
            <td className="px-4 py-4 italic">{organismo.nomeCientifico}</td>
          ) : (
            <td className="px-4 py-4">(sem dados)</td>
          )}
          <td className="px-4 py-4">
            {organismo?.organismoToNomePopular &&
            organismo?.organismoToNomePopular.length > 0
              ? organismo?.organismoToNomePopular
                  ?.map(({ nomePopular: { nome } }) => nome)
                  .join(", ")
              : "(sem dados)"}
          </td>
          <td className="max-w-lg px-4 py-4 font-mono break-words">
            {sequencia ?? "(sem dados)"}
          </td>
          <td className="px-4 py-4">
            <Link to={`/peptideo/${id}`} className="underline">
              Visualizar
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
