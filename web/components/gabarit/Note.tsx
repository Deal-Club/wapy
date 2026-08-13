import { Info } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Une précision, une limite, une réserve : le texte qu'il faut lire mais qui
 * n'est pas l'argument.
 *
 * Volontairement plus discret qu'une carte : une note qui se présente comme une
 * carte se lit comme un argument de plus, alors qu'elle dit souvent l'inverse
 * (ce que l'outil ne fait pas, ce qui n'est pas publié, ce qui reste à
 * vérifier).
 */
export default function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-cream p-5">
      <Info aria-hidden="true" className="h-5 w-5 shrink-0 text-brand" strokeWidth={1.75} />
      <div className="text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}
