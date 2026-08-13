import Link from "next/link";
import { Check, QrCode } from "lucide-react";
import WapyMarque from "@/components/WapyMarque";
import { JOURS_ESSAI } from "@/content/plans";

/**
 * La colonne de rassurance des pages de connexion et d'inscription.
 *
 * Un formulaire seul au milieu d'une page blanche ne dit ni où l'on est ni ce
 * qu'on obtient en le remplissant. Ces trois lignes sont les mêmes que celles
 * de `/tarifs`, et pour la même raison : elles sont tenues par le code
 * (`saas/billing.py:14,69` pour l'essai et l'ouverture des fonctions,
 * `saas/app.py:243-247` pour l'absence de moyen de paiement, `saas/wa.py:73-79`
 * pour la connexion par QR code).
 *
 * Masquée sous `lg` : sur un téléphone, ce qui compte est le formulaire.
 */
const PROMESSES = [
  `${JOURS_ESSAI} jours d'essai, toutes fonctions ouvertes`,
  "Aucun moyen de paiement à fournir",
  "Sur le compte WhatsApp que vous utilisez déjà",
];

export default function PanneauAuth({ titre, texte }: { titre: string; texte: string }) {
  return (
    <aside className="hidden lg:block">
      <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-brand">
        <WapyMarque className="h-7 w-7" />
        Wapy
      </Link>

      <h2 className="mt-8 font-display text-3xl font-bold leading-tight">{titre}</h2>
      <p className="mt-4 max-w-md leading-relaxed text-muted">{texte}</p>

      <ul className="mt-8 space-y-3">
        {PROMESSES.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-soft text-emerald-dark">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-muted">{p}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 flex items-center gap-2 text-sm text-muted">
        <QrCode aria-hidden="true" className="h-4 w-4 text-brand" strokeWidth={1.75} />
        <Link href="/comment-ca-marche" className="font-semibold text-brand hover:text-brand-dark">
          Voir les étapes de la mise en route
        </Link>
      </p>
    </aside>
  );
}
