import { Suspense, use } from "react";
import { TbDatabasePlus } from "react-icons/tb";
import { Link } from "react-router";
import { db } from "~/db/connection.server";
import type { Route } from "./+types/route";

export function loader() {
  return {
    queryPromise: db.query.peptideoTable
      .findMany({
        columns: {
          id: true,
          identificador: true,
          sequencia: true,
        },
      })
      .execute(),
  };
}

export default function Peptideos({ loaderData }: Route.ComponentProps) {
  const { queryPromise } = loaderData;

  return (
    <>
      <div className="mb-4 flex flex-col items-center gap-2 border-b-2 border-b-neutral-100 pb-3">
        <Link
          to="inserir"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pr-4 pl-5 text-lg font-bold text-white"
        >
          Adicionar peptídeo <TbDatabasePlus size="2rem" />
        </Link>
      </div>

      <div className="m-4 flex items-center justify-between text-cyan-700">
        <Suspense fallback={<p>... registros encontrados</p>}>
          <ResultCount promise={queryPromise} />
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
                Sequência
              </th>
              <th scope="col" className="px-4 py-3" />
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
                </tr>
              </tbody>
            }
          >
            <TableData promise={queryPromise} />
          </Suspense>
        </table>
      </div>
    </>
  );
}

function ResultCount({
  promise,
}: { promise: Route.ComponentProps["loaderData"]["queryPromise"] }) {
  const data = use(promise);
  return <p>{data.length} registros encontrados</p>;
}

function TableData({
  promise,
}: { promise: Route.ComponentProps["loaderData"]["queryPromise"] }) {
  const data = use(promise);

  return (
    <tbody>
      {data.map(({ identificador, sequencia, id }) => (
        <tr
          key={id}
          className="even:bg-neutral-200] odd:bg-neutral-50"
          style={{ contentVisibility: "auto" }}
        >
          <td className="px-4 py-4">{identificador ?? "(sem dados)"}</td>
          <td className="max-w-lg px-4 py-4 font-mono break-words">
            {sequencia ?? "(sem dados)"}
          </td>
          <td className="px-4 py-4">
            <Link to={`/peptideo/${id}`} className="underline">
              Visualizar
            </Link>
          </td>
          <td className="px-4 py-4">
            <Link to={`/peptideo/edit/${id}`} className="underline">
              Editar
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
