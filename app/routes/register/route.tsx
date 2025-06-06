import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { count, eq, gte } from "drizzle-orm";
import type { Route } from "./+types/route";

import { Form, redirect } from "react-router";
import {
  email,
  forward,
  minLength,
  object,
  partialCheck,
  pipe,
  setSpecificMessage,
  string,
} from "valibot";
import { createSession, generateSessionToken } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { generateEmailVerificationCode, transporter } from "~/.server/email";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

setSpecificMessage(string, "Campo obrigatório");
const schema = pipe(
  object({
    displayName: string(),
    email: pipe(string(), email("Email inválido")),
    password: pipe(string(), minLength(8, "Mínimo de 8 caracteres")),
    confirmPassword: string(),
  }),
  forward(
    partialCheck(
      [["password"], ["confirmPassword"]],
      ({ confirmPassword, password }) => confirmPassword === password,
      "Confirmação diferente da primeira senha.",
    ),
    ["confirmPassword"],
  ),
);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { displayName, email, password } = submission.value;

  const [{ emailExists }] = await db
    .select({ emailExists: gte(count(userTable.id), 1) })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (emailExists) {
    return submission.reply({
      fieldErrors: { email: ["Email já cadastrado"] },
    });
  }

  const passwordHash = await Bun.password.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    algorithm: "argon2id",
  });

  const [{ userId }] = await db
    .insert(userTable)
    .values({
      id: Bun.randomUUIDv7(),
      displayName,
      email,
      passwordHash,
    })
    .returning({ userId: userTable.id });

  const verificationCode = await generateEmailVerificationCode(userId, email);
  await transporter.sendMail({
    to: email,
    subject: "Verificação de email",
    text: `Seu código de verificação é: ${verificationCode}. Válido por 15 minutos.`,
  });

  const token = generateSessionToken();
  createSession(token, userId);
  return redirect("/verify-email", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(token),
    },
  });
}

export default function Cadastrar({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    defaultValue: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    lastResult: actionData,
  });

  return (
    <Container title="Cadastrar">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4"
      >
        <TextInput
          label="Nome de exibição"
          autoComplete="name"
          {...getInputProps(fields.displayName, { type: "text" })}
        />
        <FormErrorMessage errors={fields.displayName.errors} />
        <TextInput
          label="Email"
          autoComplete="email"
          {...getInputProps(fields.email, { type: "email" })}
        />
        <FormErrorMessage errors={fields.email.errors} />
        <TextInput
          label="Senha"
          autoComplete="new-password"
          {...getInputProps(fields.password, { type: "password" })}
        />
        <FormErrorMessage errors={fields.password.errors} />
        <TextInput
          label="Confirmar Senha"
          {...getInputProps(fields.confirmPassword, { type: "password" })}
        />
        <FormErrorMessage errors={fields.confirmPassword.errors} />
        <div className="m-4 flex justify-center">
          <SubmitButton>Cadastrar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
