import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useActionData } from "react-router";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { email, object, pipe, string } from "valibot";
import { auth, createPasswordResetToken } from "~/.server/auth";
import { db } from "~/db/connection.server";
import { passwordResetTokenTable, userTable } from "~/db/schema";
import { transporter } from "~/.server/email";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: object({
      email: pipe(string("Campo obrigatório"), email("Email inválido")),
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
      formErrors: ["Email não encontrado"],
    });
  }

  const [lastToken] = await db
    .select({ expiresAt: passwordResetTokenTable.expiresAt })
    .from(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, user.id))
    .orderBy(passwordResetTokenTable.expiresAt)
    .limit(1);
  if (
    lastToken &&
    lastToken.expiresAt.getTime() - 28 * 60 * 1000 > Date.now()
  ) {
    return submission.reply({
      formErrors: [
        `Espere ${Intl.DateTimeFormat("pt-BR", { minute: "2-digit", second: "2-digit" }).format(new Date(lastToken.expiresAt.getTime() - 28 * 60 * 1000 - Date.now()))} antes de enviar outro link`,
      ],
    });
  }

  const resetToken = await createPasswordResetToken(user.id);
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const resetLink = `${baseUrl}/password-reset/${resetToken}`;

  transporter.sendMail({
    to: user.email,
    subject: "Redefinição de senha",
    text: `Link para redefinição de senha:\n${resetLink}\nVálido por 30 minutos.`,
  });

  return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await auth(request);

  if (session) {
    return redirect("/");
  }
  return null;
}

export default function Entrar() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    defaultValue: {
      email: "",
    },
    lastResult,
  });

  return (
    <Container title="Redefinição de senha">
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
        <FormErrorMessage errors={form.errors} />
        <div className="m-4 flex justify-center">
          <SubmitButton>Enviar link</SubmitButton>
        </div>
        {lastResult === null && (
          <div className="flex justify-center">
            <p
              className={
                "my-4 rounded-xl bg-cyan-100 px-4 py-2 text-base text-cyan-700"
              }
            >
              Link enviado.
            </p>
          </div>
        )}
      </Form>
    </Container>
  );
}
