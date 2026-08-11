/**
 * Contrainte structurelle minimale d'un schema JSON-LD : tout objet portant
 * "@context" et "@type" y est assignable. Plus large que l'union fermee des
 * 10 schemas de schema.ts pour que ce composant, qui ne fait que serialiser,
 * n'ait pas a etre modifie chaque fois qu'un futur schema (Person, Review,
 * LocalBusiness, @graph...) est ajoute ailleurs.
 */
export type JsonLdData = { "@context": string; "@type": string } & Record<string, unknown>;

/** Injecte un bloc JSON-LD. Le remplacement de "<" protège d'une fermeture de script. */
export default function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
