import { Form } from "@remix-run/react";
import { useState } from "react";
import { Container } from "~/components/container";
import { SelectInput, SubmitButton, TextInput } from "~/components/form";

export default function Pesquisa() {
  const queryItems = [
    { value: "nomeCientifico", label: "Nome Científico" },
    { value: "nomePopular", label: "Nome Popular" },
    { value: "origem", label: "Origem" },
    { value: "familia", label: "Família" },
  ];

  const [queryItemName, setQueryItemName] = useState(queryItems[0].value);

  return (
    <Container title="Pesquisa">
      <Form className="m-6 flex flex-col gap-4" method="get" action="resultado">
        <SelectInput
          label="Item de Pesquisa:"
          options={queryItems}
          onChange={(e) => setQueryItemName(e.target.value)}
        />
        <TextInput label="Pesquisar por:" name={queryItemName} required />
        <div className="my-5 self-center">
          <SubmitButton>Pesquisar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
