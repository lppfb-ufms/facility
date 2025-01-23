import { useLoaderData } from "@remix-run/react";
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
            },
          },
        },
      },
    },
  });

  return casosDeSucesso;
}

export default function CasosDeSucesso() {
  const casosDeSucesso = useLoaderData<typeof loader>();

  return (
    <Container title="Casos de Sucesso">
      <ul className="mt-4 flex flex-col gap-6 rounded-lg">
        {casosDeSucesso.map(
          ({ id, application, manufacturer, peptideProduct }) => (
            <li
              key={id}
              className="flex flex-col gap-1 rounded-2xl bg-neutral-50 p-4"
            >
              <p className="text-2xl font-bold">{peptideProduct}</p>
              <p>
                <b>Fabricante:</b> {manufacturer ?? "(sem dados)"}
              </p>
              {application !== undefined ? (
                <p className="italic">{application}</p>
              ) : (
                "(sem dados)"
              )}
            </li>
          ),
        )}
      </ul>
    </Container>
  );
}
