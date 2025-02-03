import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { Form, useActionData } from "react-router";
import {
  forward,
  minLength,
  object,
  partialCheck,
  pipe,
  string,
} from "valibot";
import { auth, lucia } from "~/.server/auth";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { passwordResetTokenTable, userTable } from "~/db/schema";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const token = params.token;
  if (!token) {
    return redirect("/password-reset");
  }
  const { session } = await auth(request);
  if (session) {
    return redirect("/");
  }
  return null;
}
const schema = pipe(
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
);

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const token = params.token;
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)));

  const dbToken = await db.query.passwordResetTokenTable.findFirst({
    where: eq(passwordResetTokenTable.tokenHash, tokenHash),
  });

  if (!dbToken || dbToken.expiresAt < new Date()) {
    return submission.reply({ formErrors: ["Token inválido"] });
  }

  await lucia.invalidateUserSessions(dbToken.userId);

  const { password } = submission.value;
  const passwordHash = await Bun.password.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    algorithm: "argon2id",
  });

  await db
    .update(userTable)
    .set({ passwordHash })
    .where(eq(userTable.id, dbToken.userId));

  await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, dbToken.userId));

  const session = await lucia.createSession(dbToken.userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
      "Referrer-Policy": "strict-origin",
    },
  });
}

export default function PasswordReset() {
  const lastResult = useActionData<typeof action>();

  const [form, fields] = useForm({
    defaultValue: {
      password: "",
      confirmPassword: "",
    },
    lastResult,
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
