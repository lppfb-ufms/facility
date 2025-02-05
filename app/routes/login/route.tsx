import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { Form, Link } from "react-router";
import { email, object, pipe, string } from "valibot";
import { createSession, generateSessionToken } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
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

  const token = generateSessionToken();
  await createSession(token, user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(token),
    },
  });
}

export default function Entrar({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    defaultValue: {
      email: "",
      password: "",
    },
    lastResult: actionData,
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
