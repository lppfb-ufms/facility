import {
  type ActionFunctionArgs,
  MaxPartSizeExceededError,
  NodeOnDiskFile,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createFileUploadHandler as createFileUploadHandler,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { Form, redirect, useActionData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { TbFileUpload } from "react-icons/tb";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { imageMetadataTable } from "~/.server/db/schema";
import { SubmitButton, TextInput } from "~/components/form";

export async function action({ request }: ActionFunctionArgs) {
  const { session, user } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    return redirect(request.url, {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (!user.isAdmin || !user.emailVerified) {
    return redirect("/");
  }

  try {
    const formData = await parseMultipartFormData(
      request,
      composeUploadHandlers(
        createFileUploadHandler({
          maxPartSize: 25_000_000, // 25MB
          file: ({ filename }) => filename,
          filter: ({ contentType, name }) =>
            contentType.startsWith("image/") && name === "image",
          avoidFileConflicts: true,
          directory: `${process.env.UPLOAD_DIRECTORY}/images/upload`,
        }),
        // parse alt text into memory
        createMemoryUploadHandler({
          filter: ({ name }) => {
            return name === "alt";
          },
        }),
        // TODO: maybe this API will change in the future, should implement some tests
        // or is the type checking from TS enough?
        ({ filename, contentType }) => {
          throw new Error(
            `Falha ao realizar upload de "${filename}": Tipo de conteúdo "${contentType}" não é suportado.`,
          );
        },
      ),
    );
    const file = formData.get("image");
    if (!(file instanceof NodeOnDiskFile)) {
      return { message: "Falha ao realizar upload da imagem", ok: false };
    }

    const alt = formData.get("alt");

    await db.insert(imageMetadataTable).values({
      fileName: file.name,
      alt: alt?.toString().trim(),
    });

    return { message: "Imagem enviada com sucesso", ok: true };
  } catch (error) {
    if (error instanceof MaxPartSizeExceededError) {
      return {
        message: "Arquivo excedeu o tamanho máximo de 25MB",
        ok: false,
      };
    }
    if (error instanceof Error) {
      return { message: error.message, ok: false };
    }
  }
}

export default function Upload() {
  const data = useActionData<typeof action>();
  const [filename, setFilename] = useState("");
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex flex-col items-center justify-center gap-2">
      <Form
        method="post"
        encType="multipart/form-data"
        className="w-full lg:w-4/5"
      >
        <label className="mb-2 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50">
          <TbFileUpload size="2rem" />
          Selecionar foto...
          {filename ? <p>Selecionado: {filename}</p> : null}
          <input
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setFilename(e.target.files?.length ? e.target.files[0].name : "")
            }
          />
        </label>
        <TextInput label="Descrição da imagem" type="text" name="alt" />
        <div className="m-4 flex items-center justify-center gap-2">
          <SubmitButton>Enviar</SubmitButton>
          <button
            type="button"
            className="rounded-full bg-neutral-200 px-6 py-2 text-lg font-bold"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
        </div>
        {data ? (
          <p
            className={`${data.ok ? "bg-cyan-100 text-cyan-700" : "bg-red-50 text-red-800"} rounded-xl px-4 py-2 text-base`}
          >
            {data.message}
          </p>
        ) : null}
      </Form>
    </div>
  );
}
