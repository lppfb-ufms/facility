import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, useActionData, useLoaderData, useNavigate } from "react-router";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { object, string } from "valibot";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/db/connection.server";
import { glossarioTable } from "~/db/schema";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  const item = await db.query.glossarioTable.findFirst({
    where: eq(glossarioTable.id, Number(id)),
  });
  if (!item) {
    return redirect("/admin/glossario");
  }

  return item;
}

const schema = object({
  name: string(),
  definition: string(),
  example: string(),
});

export async function action({ request, params }: ActionFunctionArgs) {
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
  const id = params.id;
  const submission = parseWithValibot(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db
    .update(glossarioTable)
    .set(submission.value)
    .where(eq(glossarioTable.id, Number(id)));

  return submission.reply();
}

export default function EditGlossario() {
  const item = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    defaultValue: item,
    lastResult,
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
          label="Nome"
          {...getInputProps(fields.name, { type: "text" })}
        />
        <FormErrorMessage errors={fields.name.errors} />
        <TextInput
          label="Definição"
          {...getInputProps(fields.definition, { type: "text" })}
        />
        <FormErrorMessage errors={fields.definition.errors} />
        <TextInput
          label="Exemplo"
          {...getInputProps(fields.example, { type: "text" })}
        />
        <FormErrorMessage errors={fields.example.errors} />
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
      {lastResult?.status === "success" ? (
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
