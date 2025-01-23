import { NavLink, useLoaderData } from "@remix-run/react";
import { TbPhotoPlus } from "react-icons/tb";
import { db } from "~/.server/db/connection";
import { imageMetadataTable } from "~/.server/db/schema";

export async function loader() {
  const images = await db
    .select({
      fileName: imageMetadataTable.fileName,
      alt: imageMetadataTable.alt,
    })
    .from(imageMetadataTable);
  return images;
}

export default function Fotos() {
  const images = useLoaderData<typeof loader>();

  return (
    <>
      <div className="mb-4 flex flex-col items-center gap-2">
        <NavLink
          prefetch="intent"
          to="upload"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pl-5 pr-4 text-lg font-bold text-white"
        >
          Adicionar foto <TbPhotoPlus size="2rem" />
        </NavLink>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map(({ fileName, alt }) => (
          <div
            key={fileName}
            className="relative w-full overflow-hidden rounded-lg pb-[100%] shadow-md"
          >
            <img
              src={`/images/upload/${fileName}`}
              alt={alt || ""}
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </>
  );
}
