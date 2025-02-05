import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { Form, useNavigate } from "react-router";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { imageMetadataTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;

  const image = await db.query.imageMetadataTable.findFirst({
    where: eq(imageMetadataTable.id, Number(id)),
  });
  if (!image) {
    return redirect("/admin/fotos");
  }

  return { image };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { session, user } = await auth(request);

  if (!session) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
      },
    });
  }

  if (session.fresh) {
    const sessionToken = await sessionCookie.parse(
      request.headers.get("cookie"),
    );
    return redirect(request.url, {
      headers: {
        "Set-Cookie": await sessionCookie.serialize(sessionToken),
      },
    });
  }

  if (!user.isAdmin || !user.emailVerified) {
    return redirect("/");
  }

  const formData = await request.formData();
  const alt = formData.get("alt");
  const id = params.id;

  await db
    .update(imageMetadataTable)
    .set({ alt: alt?.toString().trim() })
    .where(eq(imageMetadataTable.id, Number(id)));

  return { message: "Legenda alterada com sucesso", ok: true };
}

export default function EditFoto({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { image } = loaderData;
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex flex-col items-center justify-center gap-2">
      <Form
        method="post"
        encType="multipart/form-data"
        className="w-full lg:w-4/5"
      >
        <img
          src={`/images/upload/${image.fileName}`}
          alt={image.alt || ""}
          className="m-auto mb-4 h-auto w-4/5"
        />
        <TextInput
          label="Descrição da imagem"
          type="text"
          name="alt"
          defaultValue={image.alt ?? ""}
        />
        <div className="m-4 flex items-center justify-center gap-2">
          <SubmitButton>Enviar</SubmitButton>
          <button
            type="button"
            className="rounded-full bg-neutral-200 px-6 py-2 text-lg font-bold"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
        {actionData ? (
          <p
            className={`${actionData.ok ? "bg-cyan-100 text-cyan-700" : "bg-red-50 text-red-800"} rounded-xl px-4 py-2 text-base`}
          >
            {actionData.message}
          </p>
        ) : null}
      </Form>
    </div>
  );
}
