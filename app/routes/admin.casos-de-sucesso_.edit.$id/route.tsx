import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { Form, useNavigate } from "react-router";
import { object, optional, string } from "valibot";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { casoSucessoTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;

  const item = await db.query.casoSucessoTable.findFirst({
    where: eq(casoSucessoTable.id, Number(id)),
  });
  if (!item) {
    return redirect("/admin/glossario");
  }

  return item;
}

const schema = object({
  peptideProduct: optional(string()),
  application: optional(string()),
  manufacturer: optional(string()),
});

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
  const id = params.id;
  const submission = parseWithValibot(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(casoSucessoTable)
    .set(submission.value)
    .where(eq(casoSucessoTable.id, Number(id)));

  return submission.reply();
}

export default function EditGlossario({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    defaultValue: loaderData,
    lastResult: actionData,
    constraint: getValibotConstraint(schema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });
  const navigate = useNavigate();

  return (
    <>
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex w-full flex-col gap-2"
      >
        <TextInput
          label="Produto Peptídico"
          {...getInputProps(fields.peptideProduct, { type: "text" })}
        />
        <FormErrorMessage errors={fields.peptideProduct.errors} />
        <TextInput
          label="Fabricante"
          {...getInputProps(fields.manufacturer, { type: "text" })}
        />
        <FormErrorMessage errors={fields.manufacturer.errors} />
        <TextInput
          label="Aplicação"
          {...getInputProps(fields.application, { type: "text" })}
        />
        <FormErrorMessage errors={fields.application.errors} />
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
      </Form>
      {actionData?.status === "success" ? (
        <p
          className={
            "my-4 rounded-xl bg-cyan-100 px-4 py-2 text-base text-cyan-700"
          }
        >
          Definição atualizada com sucesso.
        </p>
      ) : null}
    </>
  );
}
