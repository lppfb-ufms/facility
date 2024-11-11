import { NavLink, useLoaderData } from "@remix-run/react";
import { db } from "~/.server/db/connection";
import { Container } from "~/components/container";

export async function loader() {
  const casosDeSucesso = await db.query.casoSucessoTable.findMany({
    columns: {
      id: true,
      application: true,
      manufacturer: true,
      peptideProduct: true,
    },
    with: {
      peptideoToCasoSucesso: {
        columns: {},
        with: {
          peptideo: {
            columns: {
              id: true,
              identificador: true,
              sintetico: true,
            },
            with: {
              organismo: {
                columns: {
                  nomeCientifico: true,
                },
              },
            }
          },
        },
      }
    },
  });

  return casosDeSucesso;
}

export default function CasosDeSucesso() {
  const casosDeSucesso = useLoaderData<typeof loader>();

  return (
    <Container title="Casos de Sucesso">
      <ul className="mt-4 flex flex-col gap-6 rounded-lg bg-neutral-50 px-4 py-2 text-lg">
        {casosDeSucesso.map(({ id, peptideoId, value, peptideo }) => (
          <li key={id} className="flex flex-col gap-1">
            <NavLink
              to={`/peptideo/${peptideoId}`}
              className="text-2xl font-bold text-cyan-600 hover:underline"
            >
              {peptideo.identificador
                ? peptideo.identificador
                : "(sem identificador)"}
              {!peptideo.sintetico ? (
                peptideo.organismo?.nomeCientifico ? (
                  <i> - {peptideo.organismo.nomeCientifico}</i>
                ) : (
                  " - (sem nome científico)"
                )
              ) : null}
            </NavLink>
            <p className="text-xl italic">{value}</p>
          </li>
        ))}
      </ul>
    </Container>
  );
}
