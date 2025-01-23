import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect, useActionData, useNavigate } from "@remix-run/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { object, optional, string } from "valibot";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { casoSucessoTable } from "~/.server/db/schema";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";

const schema = object({
  peptideProduct: optional(string()),
  application: optional(string()),
  manufacturer: optional(string()),
});

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

  const formData = await request.formData();
  const submission = parseWithValibot(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  await db.insert(casoSucessoTable).values(submission.value);
  return submission.reply();
}

export default function GlossarioInserir() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
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
          Definição inserida com sucesso.
        </p>
      ) : null}
    </>
  );
}
