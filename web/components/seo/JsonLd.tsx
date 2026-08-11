import React from "react";
import type { JsonLdSchema } from "@/lib/schema";

/** Injecte un bloc JSON-LD. Le remplacement de "<" protege d'une fermeture de script. */
export default function JsonLd({ data }: { data: JsonLdSchema }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
