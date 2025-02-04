import { Container } from "~/components/container";
import { db } from "~/db/connection.server";
import { glossarioTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function loader() {
  const glossary = await db.select().from(glossarioTable);

  return glossary;
}

export default function Faq({ loaderData }: Route.ComponentProps) {
  const glossary = loaderData;

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
    <li className="rounded-2xl text-neutral-800 bg-neutral-50 p-4">
      <h2 className="text-xl font-medium">{item.name}</h2>
      <p>{item.definition}</p>
      <p>
        <b>ex.:</b> <i>{item.example}</i>
      </p>
    </li>
  );
}
