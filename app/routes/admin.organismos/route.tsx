import { Suspense, use } from "react";
import { TbHeartPlus } from "react-icons/tb";
import { Link } from "react-router";
import { db } from "~/db/connection.server";
import type { Route } from "./+types/route";

export function loader() {
  return {
    queryPromise: db.query.organismoTable
      .findMany({
        columns: {
          id: true,
          nomeCientifico: true,
          familia: true,
          origem: true,
        },
        with: {
          organismoToNomePopular: {
            columns: {},
            with: {
              nomePopular: true,
            },
          },
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
          Adicionar organismo <TbHeartPlus size="2rem" />
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
                Nome Científico
              </th>
              <th scope="col" className="px-4 py-3">
                Nome Popular
              </th>
              <th scope="col" className="px-4 py-3">
                Família
              </th>
              <th scope="col" className="px-4 py-3">
                Origem
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
      {data.map(
        ({ id, nomeCientifico, organismoToNomePopular, familia, origem }) => (
          <tr
            key={id}
            className="even:bg-neutral-200] odd:bg-neutral-50"
            style={{ contentVisibility: "auto" }}
          >
            {nomeCientifico ? (
              <td className="px-4 py-4 italic">{nomeCientifico}</td>
            ) : (
              <td className="px-4 py-4">(sem dados)</td>
            )}
            <td className="px-4 py-4">
              {organismoToNomePopular && organismoToNomePopular.length > 0
                ? organismoToNomePopular
                    ?.map(({ nomePopular: { nome } }) => nome)
                    .join(", ")
                : "(sem dados)"}
            </td>
            <td className="px-4 py-4">{familia ?? "(sem dados)"}</td>
            <td className="px-4 py-4">{origem ?? "(sem dados)"}</td>
            <td className="px-4 py-4">
              <Link to={`${id}`} className="underline">
                Editar
              </Link>
            </td>
          </tr>
        ),
      )}
    </tbody>
  );
}
