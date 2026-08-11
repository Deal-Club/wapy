/**
 * Contrainte structurelle minimale d'un schéma JSON-LD : tout objet portant
 * "@context" et "@type" y est assignable. Plus large que l'union fermée des
 * 10 schémas de schema.ts pour que ce composant, qui ne fait que sérialiser,
 * n'ait pas à être modifié chaque fois qu'un futur schéma (Person, Review,
 * LocalBusiness, @graph...) est ajouté ailleurs.
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
