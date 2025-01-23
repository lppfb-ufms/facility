import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { and, eq, inArray } from "drizzle-orm";
import { TbPlus, TbTrash } from "react-icons/tb";
import {
  array,
  boolean,
  fallback,
  integer,
  number,
  object,
  optional,
  pipe,
  setSpecificMessage,
  string,
  transform,
} from "valibot";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import {
  caracteristicasAdicionaisTable,
  funcaoBiologicaTable,
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
  peptideoTable,
  peptideoToPublicacaoTable,
  publicacaoTable,
} from "~/.server/db/schema";
import { Container } from "~/components/container";
import {
  CheckboxInput,
  FormErrorMessage,
  SubmitButton,
  TextAreaInput,
  TextInput,
} from "~/components/form";

export async function loader({ params, request }: LoaderFunctionArgs) {
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

  const { id } = params;

  const peptideo = await db.query.peptideoTable.findFirst({
    where: eq(peptideoTable.id, Number(id)),
    with: {
      organismo: {
        with: {
          organismoToNomePopular: {
            columns: {},
            with: {
              nomePopular: true,
            },
          },
        },
      },
      caracteristicasAdicionais: true,
      funcaoBiologica: true,
      peptideoToPublicacao: {
        columns: {},
        with: {
          publicacao: true,
        },
      },
    },
  });

  if (!peptideo) {
    return redirect("/");
  }

  const { organismo, ...rest } = peptideo;

  const nomePopular = organismo?.organismoToNomePopular.map(
    ({ nomePopular }) => nomePopular,
  );

  const publicacao = peptideo.peptideoToPublicacao.map(
    ({ publicacao }) => publicacao,
  );

  return {
    ...rest,
    publicacao,
    organismo: {
      ...organismo,
      nomePopular,
    },
  };
}

setSpecificMessage(string, "Campo obrigatório");
setSpecificMessage(number, "Número inválido");
setSpecificMessage(integer, "Informe um número inteiro");
const schema = object({
  id: pipe(number(), integer()),
  identificador: optional(string()),
  sequencia: string(),
  sintetico: fallback(boolean(), false),
  descobertaLPPFB: fallback(boolean(), false),
  quantidadeAminoacidos: pipe(
    string(),
    transform((qtd) => Number(qtd.replace(",", "."))),
    number(),
    integer(),
  ),
  massaMolecular: optional(
    pipe(
      string(),
      transform((qtd) => Number(qtd.replace(",", "."))),
      number(),
      transform((num) => num?.toString()),
    ),
  ),
  massaMolar: optional(
    pipe(
      string(),
      transform((qtd) => Number(qtd.replace(",", "."))),
      number(),
      transform((num) => num?.toString()),
    ),
  ),
  microbiologia: optional(string()),
  atividadeAntifungica: optional(string()),
  ensaioCelular: optional(string()),
  propriedadesFisicoQuimicas: optional(string()),
  funcaoBiologica: optional(
    array(
      object({
        id: optional(pipe(number(), integer())),
        value: string(),
      }),
    ),
  ),
  casoSucesso: optional(
    array(
      object({
        id: optional(pipe(number(), integer())),
        value: string(),
      }),
    ),
  ),
  caracteristicasAdicionais: optional(
    array(
      object({
        id: optional(pipe(number(), integer())),
        value: string(),
      }),
    ),
  ),
  publicacao: optional(
    array(
      object({
        id: optional(pipe(number(), integer())),
        doi: optional(string()),
        titulo: optional(string()),
      }),
    ),
  ),
  organismo: optional(
    object({
      id: optional(pipe(number(), integer())),
      nomeCientifico: optional(string()),
      origem: optional(string()),
      familia: optional(string()),
      nomePopular: optional(
        array(
          object({
            nome: string(),
            id: optional(pipe(number(), integer())),
          }),
        ),
      ),
    }),
  ),
});

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await auth(request);

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

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const {
    organismo,
    funcaoBiologica,
    caracteristicasAdicionais,
    casoSucesso,
    publicacao,
    ...peptideo
  } = submission.value;

  let organismoId = organismo?.id;
  if (!peptideo.sintetico && organismo) {
    const { nomePopular, ...restOfOrganismo } = organismo;

    if (organismoId === undefined) {
      const [{ insertedId }] = await db
        .insert(organismoTable)
        .values(restOfOrganismo)
        .returning({ insertedId: organismoTable.id });
      organismoId = insertedId;
    } else {
      await db
        .update(organismoTable)
        .set(restOfOrganismo)
        .where(eq(organismoTable.id, organismoId));
    }

    if (nomePopular && nomePopular.length > 0) {
      const previousIds = await db
        .select({ id: nomePopularTable.id })
        .from(nomePopularTable)
        .innerJoin(
          organismoToNomePopularTable,
          eq(organismoToNomePopularTable.nomePopularId, nomePopularTable.id),
        )
        .innerJoin(
          organismoTable,
          eq(organismoToNomePopularTable.organismoId, organismoTable.id),
        )
        .where(eq(organismoTable.id, organismoId));

      if (previousIds.length > 0) {
        const currentIds = new Set(
          nomePopular.map(({ id }) => id).filter((id) => id !== undefined),
        );
        const idsToDelete = previousIds.filter(({ id }) => !currentIds.has(id));
        if (idsToDelete.length > 0) {
          await db.delete(organismoToNomePopularTable).where(
            and(
              inArray(
                organismoToNomePopularTable.nomePopularId,
                idsToDelete.map(({ id }) => id),
              ),
              eq(organismoToNomePopularTable.organismoId, organismoId),
            ),
          );
        }
      }

      await Promise.all(
        nomePopular
          .filter(
            (nome): nome is { id: number; nome: string } =>
              typeof nome.id === "number",
          )
          .map(({ id, nome }) =>
            db
              .update(nomePopularTable)
              .set({ nome })
              .where(eq(nomePopularTable.id, id)),
          ),
      );

      const nomesToInsert = nomePopular.filter(({ id }) => id === undefined);
      if (nomesToInsert.length > 0) {
        const newIds = await db
          .insert(nomePopularTable)
          .values(nomesToInsert)
          .onConflictDoNothing()
          .returning({ id: nomePopularTable.id });
        const conflictedIds = await db
          .select({ id: nomePopularTable.id })
          .from(nomePopularTable)
          .where(
            inArray(
              nomePopularTable.nome,
              nomePopular
                .filter(({ id }) => id === undefined)
                .map(({ nome }) => nome),
            ),
          );
        await db
          .insert(organismoToNomePopularTable)
          .values(
            [...conflictedIds, ...newIds].map(({ id }) => ({
              organismoId: organismoId as number,
              nomePopularId: id,
            })),
          )
          .onConflictDoNothing();
      }
    }
  }

  const peptideoId = peptideo.id;
  await db
    .update(peptideoTable)
    .set({
      ...peptideo,
      organismoId,
    })
    .where(eq(peptideoTable.id, peptideoId));

  for (const { table, values } of [
    { table: funcaoBiologicaTable, values: funcaoBiologica },
    {
      table: caracteristicasAdicionaisTable,
      values: caracteristicasAdicionais,
    },
  ]) {
    if (values && values.length > 0) {
      const toUpdate = values.filter(
        (value): value is { id: number; value: string } =>
          typeof value.id === "number",
      );
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(({ id, value }) =>
            db.update(table).set({ value }).where(eq(table.id, id)),
          ),
        );
      }

      const remaining = values
        .filter(({ id }) => id === undefined)
        .map(({ value }) => ({ peptideoId, value }));
      if (remaining.length > 0) {
        await db.insert(table).values(remaining);
      }
    }
  }

  if (publicacao && publicacao.length > 0) {
    const previousIds = await db
      .select({ id: publicacaoTable.id })
      .from(publicacaoTable)
      .innerJoin(
        peptideoToPublicacaoTable,
        eq(peptideoToPublicacaoTable.publicacaoId, publicacaoTable.id),
      )
      .innerJoin(
        peptideoTable,
        eq(peptideoToPublicacaoTable.peptideoId, peptideoTable.id),
      )
      .where(eq(peptideoTable.id, peptideoId));

    if (previousIds.length > 0) {
      const currentIds = new Set(
        publicacao.map(({ id }) => id).filter((id) => id !== undefined),
      );
      const idsToDelete = previousIds
        .filter(({ id }) => !currentIds.has(id))
        .map(({ id }) => id);
      if (idsToDelete.length > 0) {
        await db
          .delete(peptideoToPublicacaoTable)
          .where(
            and(
              inArray(peptideoToPublicacaoTable.publicacaoId, idsToDelete),
              eq(peptideoToPublicacaoTable.peptideoId, peptideoId),
            ),
          );
      }
    }

    await Promise.all(
      publicacao
        .filter(
          (pub): pub is { id: number; doi?: string; titulo?: string } =>
            typeof pub.id === "number",
        )
        .map(({ id, doi, titulo }) =>
          db
            .update(publicacaoTable)
            .set({ doi, titulo })
            .where(eq(publicacaoTable.id, id)),
        ),
    );

    const pubToInsert = publicacao.filter(({ id }) => id === undefined);
    if (pubToInsert.length > 0) {
      const newIds = await db
        .insert(publicacaoTable)
        .values(pubToInsert)
        .onConflictDoNothing()
        .returning({ id: publicacaoTable.id });

      const ids = await db
        .select({ id: publicacaoTable.id })
        .from(publicacaoTable)
        .where(
          inArray(
            publicacaoTable.doi,
            publicacao
              .map(({ doi }) => doi)
              .filter((doi): doi is string => !!doi),
          ),
        );
      await db
        .insert(peptideoToPublicacaoTable)
        .values(
          [...ids, ...newIds].map(({ id }) => ({
            peptideoId: peptideoId,
            publicacaoId: id,
          })),
        )
        .onConflictDoNothing();
    }
  }

  return submission.reply();
}

export default function EditPeptideo() {
  const defaultValue = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    defaultValue,
    lastResult,
    constraint: getValibotConstraint(schema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });

  const organismo = fields.organismo.getFieldset();
  const nomesPopulares = organismo.nomePopular.getFieldList();
  const publicacao = fields.publicacao.getFieldList();
  const funcoesBiologicas = fields.funcaoBiologica.getFieldList();
  const caracteristicasAdicionais =
    fields.caracteristicasAdicionais.getFieldList();

  const navigate = useNavigate();

  return (
    <Container title="Editar Peptídeo">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex w-full flex-col gap-6"
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />
        <FormErrorMessage
          errors={Object.entries(form.allErrors).map(
            ([key, value]) => `${key}: ${value.join(", ")}`,
          )}
        />
        <fieldset className="flex flex-col gap-3">
          <CheckboxInput
            label="Descoberta LPPFB"
            {...getInputProps(fields.descobertaLPPFB, { type: "checkbox" })}
          />
          <TextInput
            label="Banco de dados"
            {...getInputProps(fields.bancoDados, { type: "text" })}
          />
          <FormErrorMessage errors={fields.bancoDados.errors} />
          <TextInput
            label="Identificador"
            {...getInputProps(fields.identificador, { type: "text" })}
          />
          <FormErrorMessage errors={fields.identificador.errors} />
          <TextAreaInput
            label="Sequência"
            rows={4}
            {...getTextareaProps(fields.sequencia)}
          />
          <FormErrorMessage errors={fields.sequencia.errors} />
          <TextInput
            label="Massa molecular (Da)"
            {...getInputProps(fields.massaMolecular, { type: "text" })}
          />
          <FormErrorMessage errors={fields.massaMolecular.errors} />
          <TextInput
            label="Massa molar (g/mol)"
            {...getInputProps(fields.massaMolar, { type: "text" })}
          />
          <FormErrorMessage errors={fields.massaMolar.errors} />
          <TextInput
            label="Quantidade de Aminoácidos"
            {...getInputProps(fields.quantidadeAminoacidos, { type: "text" })}
          />
          <FormErrorMessage errors={fields.quantidadeAminoacidos.errors} />
          <TextAreaInput
            label="Ensaio celular"
            rows={6}
            {...getTextareaProps(fields.ensaioCelular)}
          />
          <FormErrorMessage errors={fields.ensaioCelular.errors} />
          <TextAreaInput
            label="Microbiologia"
            rows={6}
            {...getTextareaProps(fields.microbiologia)}
          />
          <FormErrorMessage errors={fields.microbiologia.errors} />
          <TextAreaInput
            label="Atividade antifúngica"
            rows={6}
            {...getTextareaProps(fields.atividadeAntifungica)}
          />
          <FormErrorMessage errors={fields.atividadeAntifungica.errors} />
          <TextAreaInput
            label="Propriedades físico-químicas"
            rows={6}
            {...getTextareaProps(fields.propriedadesFisicoQuimicas)}
          />
          <FormErrorMessage errors={fields.propriedadesFisicoQuimicas.errors} />
          <TextInput
            label="Palavras-chave"
            {...getInputProps(fields.palavrasChave, { type: "text" })}
          />
          <FormErrorMessage errors={fields.palavrasChave.errors} />
        </fieldset>

        <fieldset
          className="flex flex-col gap-2"
          {...getFieldsetProps(fields.organismo)}
        >
          <legend className="mb-3 w-full border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
            Dados do Organismo
          </legend>
          <input
            {...getInputProps(organismo.id, { type: "hidden" })}
            key={undefined}
          />
          <CheckboxInput
            label="Sintético"
            {...getInputProps(fields.sintetico, { type: "checkbox" })}
            key={undefined}
          />
          <FormErrorMessage errors={fields.sintetico.errors} />
          <TextInput
            label="Espécie"
            {...getInputProps(organismo.nomeCientifico, { type: "text" })}
            disabled={fields.sintetico.value === "on"}
          />
          <FormErrorMessage errors={organismo.nomeCientifico.errors} />
          <TextInput
            label="Origem"
            {...getInputProps(organismo.origem, { type: "text" })}
            disabled={fields.sintetico.value === "on"}
          />
          <FormErrorMessage errors={organismo.origem.errors} />
          <TextInput
            label="Família"
            {...getInputProps(organismo.familia, { type: "text" })}
            disabled={fields.sintetico.value === "on"}
          />
          <FormErrorMessage errors={organismo.familia.errors} />

          <fieldset
            className="my-2 flex gap-2"
            {...getFieldsetProps(organismo.nomePopular)}
          >
            <legend
              className="mb-2 flex w-full items-center gap-3 text-cyan-600 aria-disabled:text-neutral-700"
              aria-disabled={fields.sintetico.value === "on"}
            >
              Nomes Populares
              <button
                className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white disabled:from-neutral-600 disabled:to-neutral-500"
                {...form.insert.getButtonProps({
                  name: organismo.nomePopular.name,
                })}
                disabled={fields.sintetico.value === "on"}
              >
                <TbPlus /> adicionar
              </button>
            </legend>
            <ul className="flex w-full flex-col gap-3">
              {nomesPopulares.map((item, index) => {
                const nome = item.getFieldset();
                return (
                  <li key={item.key} className="flex flex-col">
                    <input
                      {...getInputProps(nome.id, { type: "hidden" })}
                      key={undefined}
                    />
                    <div className="flex-grow">
                      <TextInput
                        {...getInputProps(nome.nome, { type: "text" })}
                        disabled={fields.sintetico.value === "on"}
                        key={undefined}
                      />
                    </div>
                    <FormErrorMessage errors={nome.nome.errors} />
                    <button
                      className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                      {...form.remove.getButtonProps({
                        name: organismo.nomePopular.name,
                        index,
                      })}
                    >
                      <TbTrash /> apagar
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </fieldset>

        <fieldset {...getFieldsetProps(fields.funcaoBiologica)}>
          <legend className="flex w-full items-center gap-4 border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
            Funções Biológicas
            <button
              className="my-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white"
              {...form.insert.getButtonProps({
                name: fields.funcaoBiologica.name,
              })}
            >
              <TbPlus /> adicionar
            </button>
          </legend>
          <ul className="mt-2 flex w-full flex-col gap-3">
            {funcoesBiologicas.map((item, index) => {
              const funcaoBiologica = item.getFieldset();
              return (
                <li key={item.key} className="flex flex-col">
                  <input
                    {...getInputProps(funcaoBiologica.id, { type: "hidden" })}
                    key={undefined}
                  />
                  <TextInput
                    {...getInputProps(funcaoBiologica.value, { type: "text" })}
                    key={undefined}
                  />
                  <FormErrorMessage errors={funcaoBiologica.value.errors} />
                  <button
                    className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                    {...form.remove.getButtonProps({
                      name: fields.funcaoBiologica.name,
                      index,
                    })}
                  >
                    <TbTrash /> apagar
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset {...getFieldsetProps(fields.publicacao)}>
          <legend className="flex w-full items-center gap-4 border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
            Publicações
            <button
              className="my-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white"
              {...form.insert.getButtonProps({
                name: fields.publicacao.name,
              })}
            >
              <TbPlus /> adicionar
            </button>
          </legend>
          {publicacao.map((item, index) => {
            const pub = item.getFieldset();
            return (
              <div
                key={item.key}
                className="m-2 flex flex-col gap-2 rounded-lg border border-neutral-100 p-2"
              >
                <input
                  {...getInputProps(pub.id, { type: "hidden" })}
                  key={undefined}
                />
                <TextInput
                  label="DOI"
                  {...getInputProps(pub.doi, { type: "text" })}
                  key={undefined}
                />
                <FormErrorMessage errors={pub.doi.errors} />
                <TextInput
                  label="Título"
                  {...getInputProps(pub.titulo, { type: "text" })}
                  key={undefined}
                />
                <FormErrorMessage errors={pub.titulo.errors} />
                <button
                  className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                  {...form.remove.getButtonProps({
                    name: fields.publicacao.name,
                    index,
                  })}
                >
                  <TbTrash /> apagar
                </button>
              </div>
            );
          })}
        </fieldset>
{/* 
        <fieldset {...getFieldsetProps(fields.casoSucesso)}>
          <legend className="flex w-full items-center gap-4 border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
            Casos de Sucesso
            <button
              className="my-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white"
              {...form.insert.getButtonProps({
                name: fields.casoSucesso.name,
              })}
            >
              <TbPlus /> adicionar
            </button>
          </legend>
          <ul className="mt-2 flex w-full flex-col gap-3">
            {casosSucesso.map((item, index) => {
              const caso = item.getFieldset();
              return (
                <li key={item.key} className="flex flex-col">
                  <input
                    {...getInputProps(caso.id, { type: "hidden" })}
                    key={undefined}
                  />
                  <TextAreaInput
                    label={`Caso nº ${index + 1}`}
                    rows={4}
                    {...getTextareaProps(caso.value)}
                  />
                  <FormErrorMessage errors={caso.value.errors} />
                  <button
                    className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                    {...form.remove.getButtonProps({
                      name: fields.casoSucesso.name,
                      index,
                    })}
                  >
                    <TbTrash /> apagar
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset> */}

        <fieldset {...getFieldsetProps(fields.caracteristicasAdicionais)}>
          <legend className="flex w-full items-center gap-4 border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
            Características Adicionais
            <button
              className="my-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white"
              {...form.insert.getButtonProps({
                name: fields.caracteristicasAdicionais.name,
              })}
            >
              <TbPlus /> adicionar
            </button>
          </legend>
          <ul className="mt-2 flex w-full flex-col gap-3">
            {caracteristicasAdicionais.map((item, index) => {
              const caracteristica = item.getFieldset();
              return (
                <li key={item.key} className="flex flex-col">
                  <input
                    {...getInputProps(caracteristica.id, { type: "hidden" })}
                    key={undefined}
                  />
                  <TextAreaInput
                    label={`Característica nº ${index + 1}`}
                    rows={4}
                    {...getTextareaProps(caracteristica.value)}
                  />
                  <FormErrorMessage errors={caracteristica.value.errors} />
                  <button
                    className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                    {...form.remove.getButtonProps({
                      name: fields.caracteristicasAdicionais.name,
                      index,
                    })}
                  >
                    <TbTrash /> apagar
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <FormErrorMessage
          errors={Object.entries(form.allErrors).map(
            ([key, value]) => `${key}: ${value.join(", ")}`,
          )}
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

      <Form
        action={`/peptideo/delete/${fields.id.value}`}
        method="post"
        onSubmit={(event) => {
          const response = confirm(
            "Tem certeza que deseja excluir este peptídeo?",
          );
          if (!response) {
            event.preventDefault();
          }
        }}
        className="mt-4 flex justify-center"
      >
        <button
          type="submit"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-6 py-2 text-lg font-bold text-white"
        >
          <TbTrash size="1.5rem" /> Apagar peptídeo
        </button>
      </Form>
      {lastResult?.status === "success" ? (
        <p
          className={
            "my-4 rounded-xl bg-cyan-100 px-4 py-2 text-base text-cyan-700"
          }
        >
          Peptídeo atualizado com sucesso.
        </p>
      ) : null}
    </Container>
  );
}
