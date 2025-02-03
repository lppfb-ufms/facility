import { desc, getTableColumns, sql } from "drizzle-orm";
import { db } from "~/db/connection.server";
import { nomePopularTable } from "~/db/schema";

const search = "feijao";

const matchQuery = sql`to_tsvector(unaccent(${nomePopularTable.nome})), websearch_to_tsquery(${search})`;

export async function loader() {
  // console.log(await db.execute(sql`SHOW default_text_search_config;`));
  console.log(
    await db.execute(sql`ALTER TEXT SEARCH CONFIGURATION pg_catalog.english
ALTER MAPPING FOR hword, hword_part, word
WITH unaccent, portuguese_stem;`),
  );
  console.log(
    await db.execute(sql`SELECT * FROM ts_debug('english', 'feijão');`),
  );
  console.log(
    await db.execute(sql`SELECT * FROM websearch_to_tsquery(${search})`),
  );
  const results = await db
    .select({
      ...getTableColumns(nomePopularTable),
      rank: sql<number>`ts_rank(${matchQuery})`,
      rankCd: sql<number>`ts_rank_cd(${matchQuery})`,
      headline: sql<string>`ts_headline(unaccent(${nomePopularTable.nome}), websearch_to_tsquery(${search}), 'StartSel=**, StopSel=**')`,
    })
    .from(nomePopularTable)
    .where(
      sql`to_tsvector(unaccent(${nomePopularTable.nome})) @@ websearch_to_tsquery(${search})`,
    )
    .orderBy((t) => desc(t.rank));

  const splitByLengths = (input: string, lengths: Array<number>) => {
    const result = [];
    let currentLength = 0;
    for (const length of lengths) {
      result.push(input.slice(currentLength, currentLength + length));
      currentLength += length;
    }
    return result;
  };

  console.log(
    results.map((r) => {
      return {
        ...r,
        headline: splitByLengths(
          r.nome,
          r.headline.split("**").map((s) => s.length),
        ).join("**"),
      };
    }),
  );

  return results;
}

export default function Test() {
  return null;
}
