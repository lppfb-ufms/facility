import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { type ActionFunctionArgs, redirect } from "react-router";
import { Form, Link, useActionData } from "react-router";
import { email, object, pipe, string } from "valibot";
import { lucia } from "~/.server/auth";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: object({
      email: pipe(string("Campo obrigatório"), email("Email inválido")),
      password: string("Campo obrigatório"),
    }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, submission.value.email));

  if (!user) {
    return submission.reply({
      formErrors: ["Email ou senha inválidos"],
    });
  }

  const validPassword = await Bun.password.verify(
    user.passwordHash,
    submission.value.password,
  );
  if (!validPassword) {
    return submission.reply({
      formErrors: ["Email ou senha inválidos"],
    });
  }

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}

export default function Entrar() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    defaultValue: {
      email: "",
      password: "",
    },
    lastResult,
  });

  return (
    <Container title="Entrar">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4"
      >
        <TextInput
          label="Email"
          autoComplete="email"
          {...getInputProps(fields.email, { type: "email" })}
        />
        <FormErrorMessage errors={fields.email.errors} />
        <div className="flex flex-col gap-2">
          <TextInput
            label="Senha"
            autoComplete="current-password"
            {...getInputProps(fields.password, { type: "password" })}
          />
          <Link
            to="/password-reset"
            className="mx-2 mt-2 self-center text-cyan-600 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <FormErrorMessage errors={fields.password.errors} />
        <FormErrorMessage errors={form.errors} />
        <div className="m-4 flex justify-center">
          <SubmitButton>Entrar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
