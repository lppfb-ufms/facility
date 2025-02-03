import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { useState } from "react";
import { TbFileUpload } from "react-icons/tb";
import { Form, redirect, useNavigate } from "react-router";
import {
  file,
  maxSize,
  mimeType,
  minSize,
  object,
  optional,
  pipe,
  string,
} from "valibot";
import { auth, lucia } from "~/.server/auth";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { imageMetadataTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
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

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: object({
      alt: optional(string()),
      image: pipe(
        file(),
        minSize(1, "Arquivo vazio."),
        mimeType(
          [
            "image/apng",
            "image/avif",
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/webp",
          ],
          "Formato de arquivo não suportado.",
        ),
        maxSize(1024 * 1024 * 25, "Arquivo excedeu o tamanho máximo de 25MB."),
      ),
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    const path = await import("node:path");

    Bun.write(
      path.join("public/images/upload", submission.value.image.name),
      submission.value.image,
    );

    await db.insert(imageMetadataTable).values({
      fileName: submission.value.image.name,
      alt: submission.value.alt,
    });

    return redirect("/admin/fotos");
  } catch {
    return submission.reply({ formErrors: ["Erro ao enviar foto."] });
  }
}

export default function Upload({ actionData }: Route.ComponentProps) {
  const [filename, setFilename] = useState("");
  const navigate = useNavigate();

  const [form, fields] = useForm({
    lastResult: actionData,
  });

  return (
    <div className="mb-4 flex flex-col items-center justify-center gap-2">
      <Form
        method="post"
        encType="multipart/form-data"
        className="w-full lg:w-4/5"
        {...getFormProps(form)}
      >
        <label
          htmlFor={fields.image.id}
          className="mb-2 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50"
        >
          <TbFileUpload size="2rem" />
          Selecionar foto...
          {filename ? <p>Selecionado: {filename}</p> : null}
          <input
            accept="image/*"
            className="hidden"
            {...getInputProps(fields.image, { type: "file" })}
            onChange={(e) =>
              setFilename(e.target.files?.length ? e.target.files[0].name : "")
            }
          />
        </label>
        <FormErrorMessage errors={fields.image.errors} />
        <TextInput
          label="Descrição da imagem"
          {...getInputProps(fields.alt, { type: "text" })}
        />
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
        {form.errors !== undefined && form.errors.length > 0 && (
          <FormErrorMessage errors={form.errors} />
        )}
      </Form>
    </div>
  );
}
