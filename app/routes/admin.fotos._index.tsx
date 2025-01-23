import { Form, Link, useLoaderData } from "@remix-run/react";
import { TbPencil, TbPhotoPlus, TbTrash } from "react-icons/tb";
import { db } from "~/.server/db/connection";
import { imageMetadataTable } from "~/.server/db/schema";

export async function loader() {
  const images = await db.select().from(imageMetadataTable);
  return images;
}

export default function Fotos() {
  const images = useLoaderData<typeof loader>();

  return (
    <>
      <div className="mb-4 flex flex-col items-center border-b-2 border-b-neutral-100 pb-3">
        <Link
          prefetch="intent"
          to="upload"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pr-4 pl-5 text-lg font-bold text-white"
        >
          Adicionar foto <TbPhotoPlus size="2rem" />
        </Link>
      </div>
      <ul className="flex flex-col gap-8">
        {images.map(({ fileName, alt, uploadedAt, id }) => (
          <li key={id}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-5">
                <img
                  src={`/images/upload/${fileName}`}
                  alt={alt || ""}
                  className="inset-0 aspect-square w-20 object-contain transition-transform duration-300 hover:scale-105"
                />
                <div className="flex flex-col gap-1">
                  <a
                    href={`/images/upload/${fileName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline"
                  >
                    {fileName}
                  </a>
                  <p className="text-sm text-neutral-700">
                    {`data de envio: ${new Intl.DateTimeFormat("pt-BR", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                    }).format(new Date(uploadedAt))}`}
                  </p>
                  <blockquote className="text-sm text-neutral-700 italic">
                    {alt ? `"${alt}"` : "(sem legenda)"}
                  </blockquote>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  prefetch="intent"
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
                      "Tem certeza que deseja excluir esta imagem?",
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
