import {
  type FieldName,
  type FormId,
  FormProvider,
  getFieldsetProps,
  getFormProps,
  getInputProps,
  getTextareaProps,
  useField,
  useForm,
  useFormMetadata,
} from "@conform-to/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { inArray } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { TbPlus, TbTrash } from "react-icons/tb";
import type { Route } from "./+types/route";

import { Form, redirect, useNavigate } from "react-router";
import {
  type InferOutput,
  array,
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
import {
  CheckboxInput,
  FormErrorMessage,
  SubmitButton,
  TextAreaInput,
  TextInput,
} from "~/components/form";
import { db } from "~/db/connection.server";
import {
  caracteristicasAdicionaisTable,
  funcaoBiologicaTable,
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
  peptideoTable,
  peptideoToPublicacaoTable,
  publicacaoTable,
} from "~/db/schema";

export async function action({ request }: Route.ActionArgs) {
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
    publicacao,
    ...peptideo
  } = submission.value;

  let organismoId: number | undefined;
  if (!peptideo.sintetico && organismo) {
    const { nomePopular, ...restOfOrganismo } = organismo;
    const [{ insertedId }] = await db
      .insert(organismoTable)
      .values(restOfOrganismo)
      .returning({ insertedId: organismoTable.id });
    organismoId = insertedId;

    if (nomePopular !== undefined) {
      const ids = await db
        .select({ id: nomePopularTable.id })
        .from(nomePopularTable)
        .where(
          inArray(
            nomePopularTable.nome,
            nomePopular.map(({ nome }) => nome),
          ),
        );
      const newIds = await db
        .insert(nomePopularTable)
        .values(nomePopular)
        .onConflictDoNothing()
        .returning({ id: nomePopularTable.id });

      await db
        .insert(organismoToNomePopularTable)
        .values(
          [...ids, ...newIds].map(({ id }) => ({
            organismoId: insertedId,
            nomePopularId: id,
          })),
        )
        .onConflictDoNothing();
    }
  }

  const [{ peptideoId }] = await db
    .insert(peptideoTable)
    .values({
      ...peptideo,
      organismoId,
    })
    .returning({ peptideoId: peptideoTable.id });

  for (const { table, values } of [
    { table: funcaoBiologicaTable, values: funcaoBiologica },
    {
      table: caracteristicasAdicionaisTable,
      values: caracteristicasAdicionais,
    },
  ]) {
    if (values && values.length > 0) {
      await db
        .insert(table)
        .values(values.map(({ value }) => ({ peptideoId, value })));
    }
  }

  if (publicacao && publicacao.length > 0) {
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
    const newIds = await db
      .insert(publicacaoTable)
      .values(
        publicacao.map(({ doi, titulo }) => ({
          doi,
          titulo,
        })),
      )
      .onConflictDoNothing({
        target: publicacaoTable.doi,
      })
      .returning({ id: publicacaoTable.id });

    await db
      .insert(peptideoToPublicacaoTable)
      .values(
        [...ids, ...newIds].map(({ id }) => ({
          peptideoId,
          publicacaoId: id,
        })),
      )
      .onConflictDoNothing();
  }

  return submission.reply();
}

setSpecificMessage(string, "Campo obrigatório");
setSpecificMessage(number, "Número inválido");
setSpecificMessage(integer, "Informe um número inteiro");
const schema = object({
  ...createInsertSchema(peptideoTable).entries,
  funcaoBiologica: optional(array(createInsertSchema(funcaoBiologicaTable))),
  caracteristicasAdicionais: optional(
    array(createInsertSchema(caracteristicasAdicionaisTable)),
  ),
  publicacao: optional(array(createInsertSchema(publicacaoTable))),
  organismo: optional(
    object({
      nomePopular: optional(array(createInsertSchema(nomePopularTable))),
      ...createInsertSchema(organismoTable).entries,
    }),
  ),
  quantidadeAminoacidos: optional(
    pipe(
      string(),
      transform((qtd) => Number(qtd.replace(",", "."))),
      number(),
      integer(),
    ),
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
});

export default function InsertPanel({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
    constraint: getValibotConstraint(schema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });

  const navigate = useNavigate();

  const publicacao = fields.publicacao.getFieldList();
  const funcoesBiologicas = fields.funcaoBiologica.getFieldList();
  const caracteristicasAdicionais =
    fields.caracteristicasAdicionais.getFieldList();

  return (
    <FormProvider context={form.context}>
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

        <OrganismoForm
          formId={form.id}
          organismo={fields.organismo.name}
          sintetico={fields.sintetico.name}
        />

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

        <div className="flex items-center justify-center gap-5">
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
      {actionData?.status === "success" ? (
        <p
          className={
            "my-4 rounded-xl bg-cyan-100 px-4 py-2 text-base text-cyan-700"
          }
        >
          Peptídeo inserido com sucesso.
        </p>
      ) : null}
    </FormProvider>
  );
}

function OrganismoForm({
  formId,
  organismo,
  sintetico,
}: {
  organismo: FieldName<InferOutput<typeof schema>["organismo"]>;
  sintetico: FieldName<
    InferOutput<typeof schema>["sintetico"],
    InferOutput<typeof schema>,
    Array<string> | undefined
  >;
  formId: FormId<InferOutput<typeof schema>>;
}) {
  const [organismoMeta] = useField(organismo);
  const [sinteticoMeta] = useField(sintetico);

  const organismoFieldset = organismoMeta.getFieldset();

  return (
    <fieldset
      className="flex flex-col gap-2"
      {...getFieldsetProps(organismoMeta)}
    >
      <legend className="mb-3 w-full border-b-2 border-neutral-100 text-xl font-bold text-cyan-600">
        Dados do Organismo
      </legend>
      <input {...getInputProps(organismoFieldset.id, { type: "hidden" })} />
      <CheckboxInput
        label="Sintético"
        {...getInputProps(sinteticoMeta, { type: "checkbox" })}
      />
      <FormErrorMessage errors={sinteticoMeta.errors} />
      <TextInput
        label="Espécie"
        {...getInputProps(organismoFieldset.nomeCientifico, { type: "text" })}
        disabled={sinteticoMeta.value === "on"}
      />
      <FormErrorMessage errors={organismoFieldset.nomeCientifico.errors} />
      <TextInput
        label="Origem"
        {...getInputProps(organismoFieldset.origem, { type: "text" })}
        disabled={sinteticoMeta.value === "on"}
      />
      <FormErrorMessage errors={organismoFieldset.origem.errors} />
      <TextInput
        label="Família"
        {...getInputProps(organismoFieldset.familia, { type: "text" })}
        disabled={sinteticoMeta.value === "on"}
      />
      <FormErrorMessage errors={organismoFieldset.familia.errors} />

      <NomesPopularesForm
        formId={formId}
        nomePopular={organismoFieldset.nomePopular.name}
        sinteticoValue={sinteticoMeta.value}
      />
    </fieldset>
  );
}

function NomesPopularesForm({
  formId,
  nomePopular,
  sinteticoValue,
}: {
  formId: FormId<InferOutput<typeof schema>>;
  nomePopular: FieldName<Array<{ id?: number | undefined; nome: string }>>;
  sinteticoValue: string | undefined;
}) {
  const form = useFormMetadata(formId);
  const [nomePopularMeta] = useField(nomePopular);

  const nomesPopulares = nomePopularMeta.getFieldList();

  return (
    <fieldset
      className="my-2 flex gap-2"
      {...getFieldsetProps(nomePopularMeta)}
    >
      <legend
        className="mb-2 flex w-full items-center gap-3 text-cyan-600 aria-disabled:text-neutral-700"
        aria-disabled={sinteticoValue === "on"}
      >
        Nomes Populares
        <button
          className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white disabled:from-neutral-600 disabled:to-neutral-500"
          {...form.insert.getButtonProps({
            name: nomePopular,
          })}
          disabled={sinteticoValue === "on"}
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
                  disabled={sinteticoValue === "on"}
                  key={undefined}
                />
              </div>
              <FormErrorMessage errors={nome.nome.errors} />
              <button
                className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                {...form.remove.getButtonProps({
                  name: nomePopular,
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
  );
}
