import { Link } from "react-router";
import { db } from "~/db/connection.server";
import type { Route } from "./+types/route";

export async function loader() {
  return await db.query.peptideoTable.findMany({
    columns: {
      id: true,
      identificador: true,
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
  });
}

export default function ListPanel({ loaderData }: Route.ComponentProps) {
  const data = loaderData;

  return (
    <>
      <div className="m-4 flex items-center justify-between text-cyan-700">
        <p>{data.length} registros encontrados</p>
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
              <th scope="col" className="px-4 py-3" />
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map(({ identificador, organismo, id }) => (
              <tr key={id} className="odd:bg-neutral-50 even:bg-neutral-200">
                <td className="px-4 py-4">{identificador ?? "(sem dados)"}</td>
                {organismo?.nomeCientifico ? (
                  <td className="px-4 py-4 italic">
                    {organismo.nomeCientifico}
                  </td>
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
        </table>
      </div>
    </>
  );
}
