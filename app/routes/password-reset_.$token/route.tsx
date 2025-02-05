import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { Form } from "react-router";
import {
  forward,
  minLength,
  object,
  partialCheck,
  pipe,
  string,
} from "valibot";
import {
  auth,
  createSession,
  generateSessionToken,
  invalidateUserSessions,
  verifyPasswordResetToken,
} from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { passwordResetTokenTable, userTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader({ request }: Route.LoaderArgs) {
  const { session } = await auth(request);
  if (session) {
    return redirect("/");
  }
  return null;
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: pipe(
      object({
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
    ),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const token = params.token;
  const userId = await verifyPasswordResetToken(token);
  if (!userId) {
    return submission.reply({ formErrors: ["Token inválido"] });
  }

  await invalidateUserSessions(userId);

  const { password } = submission.value;
  const passwordHash = await Bun.password.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    algorithm: "argon2id",
  });

  await db
    .update(userTable)
    .set({ passwordHash })
    .where(eq(userTable.id, userId));

  await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));

  const sessionToken = generateSessionToken();
  await createSession(sessionToken, userId);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(sessionToken),
      "Referrer-Policy": "strict-origin",
    },
  });
}

export default function PasswordReset({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
  });

  return (
    <Container title="Nova senha">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4"
      >
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
          <SubmitButton>Confirmar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
