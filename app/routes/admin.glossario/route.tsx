import { TbPencil, TbTextPlus, TbTrash } from "react-icons/tb";
import { Form, Link } from "react-router";
import { db } from "~/db/connection.server";
import { glossarioTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader() {
  const glossarios = await db.select().from(glossarioTable);
  return glossarios;
}

export default function Glossario({ loaderData }: Route.ComponentProps) {
  const glossarios = loaderData;

  return (
    <>
      <div className="mb-4 flex flex-col items-center gap-2 border-b-2 border-b-neutral-100 pb-3">
        <Link
          to="inserir"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pr-4 pl-5 text-lg font-bold text-white"
        >
          Adicionar definição <TbTextPlus size="2rem" />
        </Link>
      </div>
      <ul className="flex flex-col gap-8">
        {glossarios.map(({ id, name, definition, example }) => (
          <li key={id}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-cyan-600">{name}</p>
                <blockquote className="text-sm text-neutral-700 italic">
                  {definition}
                </blockquote>
                <p className="text-sm text-neutral-700">ex.: {example}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`edit/${id}`}
                  className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-1 pr-4 pl-2 text-sm font-bold text-white"
                >
                  <TbPencil size="1.5rem" /> Editar
                </Link>
                <Form
                  action={`delete/${id}`}
                  method="post"
                  onSubmit={(event) => {
                    const response = confirm(
                      "Tem certeza que deseja excluir este item?",
                    );
                    if (!response) {
                      event.preventDefault();
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 py-1 pr-4 pl-2 text-sm font-bold text-white"
                  >
                    <TbTrash size="1.5rem" /> Apagar
                  </button>
                </Form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
