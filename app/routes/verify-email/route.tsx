import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/route";

import { Form, redirect, useFetcher } from "react-router";
import { object, string } from "valibot";
import {
  auth,
  createSession,
  generateSessionToken,
  invalidateUserSessions,
} from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { verifyVerificationCode } from "~/.server/email";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

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
  const submission = parseWithValibot(formData, {
    schema: object({ code: string("Código inválido") }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { code } = submission.value;

  const codeValid = await verifyVerificationCode(user, code);

  if (!codeValid) {
    return submission.reply({
      fieldErrors: { code: ["Código inválido"] },
    });
  }

  await invalidateUserSessions(user.id);
  await db
    .update(userTable)
    .set({ emailVerified: true })
    .where(eq(userTable.id, user.id));

  const token = await generateSessionToken();
  await createSession(token, user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize(token),
    },
  });
}

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

  if (user.emailVerified) {
    return redirect("/");
  }

  return null;
}

export default function VerifyEmail({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    defaultValue: {
      code: "",
    },
    lastResult: actionData,
  });

  const resendEmail = useFetcher();

  return (
    <Container title="Verificação de email">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4"
      >
        <TextInput
          label="Código de verificação"
          {...getInputProps(fields.code, { type: "text" })}
        />
        <FormErrorMessage errors={fields.code.errors} />
        {/* link to resend email */}
        <p className="flex gap-1 text-center text-sm text-neutral-700">
          Não recebeu o código de verificação?
          <button
            type="reset"
            className="text-cyan-600 hover:underline"
            onClick={() =>
              resendEmail.submit(null, {
                action: "/verify-email/generate-new-code",
                method: "post",
              })
            }
          >
            Reenviar
          </button>
        </p>
        <div className="m-4 flex justify-center">
          <SubmitButton>Enviar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
