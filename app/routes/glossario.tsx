import { useLoaderData } from "react-router";
import { db } from "~/db/connection.server";
import { glossarioTable } from "~/db/schema";
import { Container } from "~/components/container";

export async function loader() {
  const glossary = await db.select().from(glossarioTable);

  return glossary;
}

export default function Faq() {
  const glossary = useLoaderData<typeof loader>();

  return (
    <Container title="Glossário">
      <ul className="grid gap-5 lg:grid-cols-2">
        {glossary.map((item) => (
          <GlossaryListItem key={item.id} item={item} />
        ))}
      </ul>
    </Container>
  );
}

function GlossaryListItem({
  item,
}: {
  item: { name: string; definition: string; example: string };
}) {
  return (
    <li className="rounded-2xl bg-neutral-50 p-4">
      <h2 className="text-xl font-bold">{item.name}</h2>
      <p>{item.definition}</p>
      <p>
        <b>ex.:</b> <i>{item.example}</i>
      </p>
    </li>
  );
}
