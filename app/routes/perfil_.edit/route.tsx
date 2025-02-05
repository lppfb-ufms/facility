import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { Form, useNavigate } from "react-router";
import { email, object, pipe, string } from "valibot";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, session } = await auth(request);

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

  return {
    user: {
      displayName: user.displayName,
      email: user.email,
    },
  };
}

const schema = object({
  displayName: string(),
  email: pipe(string(), email()),
});

export async function action({ request }: Route.ActionArgs) {
  const { user, session } = await auth(request);

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

  const formData = await request.formData();
  const submission = parseWithValibot(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const sameEmail = user.email === submission.value.email;

  if (!sameEmail) {
    const emailUsed = await db.$count(
      userTable,
      eq(userTable.email, submission.value.email),
    );

    if (emailUsed !== 0) {
      return submission.reply({
        fieldErrors: { email: ["Email já utilizado"] },
      });
    }
  }

  await db
    .update(userTable)
    .set({
      ...submission.value,
      emailVerified: sameEmail,
    })
    .where(eq(userTable.id, user.id));

  return submission.reply();
}

export default function EditPerfil({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { user } = loaderData;
  const [form, fields] = useForm({
    defaultValue: user,
    lastResult: actionData,
    constraint: getValibotConstraint(schema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });
  const navigate = useNavigate();

  return (
    <Container title="Editar perfil">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex w-full flex-col gap-2"
      >
        <TextInput
          label="Nome"
          {...getInputProps(fields.displayName, { type: "text" })}
        />
        <FormErrorMessage errors={fields.displayName.errors} />
        <TextInput
          label="Email"
          autoComplete="email"
          {...getInputProps(fields.email, { type: "email" })}
        />
        <FormErrorMessage errors={fields.email.errors} />
        <div className="m-4 flex items-center justify-center gap-2">
          <SubmitButton>Salvar</SubmitButton>
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
          Perfil atualizado com sucesso.
        </p>
      ) : null}
    </Container>
  );
}
