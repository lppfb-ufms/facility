import { useLoaderData } from "@remix-run/react";
import { db } from "~/.server/db/connection";
import { imageMetadataTable } from "~/.server/db/schema";
import { Container } from "~/components/container";

export async function loader() {
  const images = await db
    .select({
      id: imageMetadataTable.id,
      fileName: imageMetadataTable.fileName,
      alt: imageMetadataTable.alt,
    })
    .from(imageMetadataTable);
  return images;
}

export default function Fotos() {
  const images = useLoaderData<typeof loader>();

  return (
    <Container title="Fotos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map(({ fileName, alt, id }) => (
          <figure
            key={id}
            className="relative w-full overflow-hidden rounded-lg shadow-md"
          >
            <div className="relative pb-[100%]">
              <img
                src={`/images/upload/${fileName}`}
                alt={alt || ""}
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            {!!alt && (
              <figcaption className="bg-neutral-400 bg-opacity-5 p-4 text-center italic text-neutral-800">
                {alt}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </Container>
  );
}
