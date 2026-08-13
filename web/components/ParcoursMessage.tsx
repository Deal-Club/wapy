import { BellRing, CheckCheck, FileText, MessageSquareText, type LucideIcon } from "lucide-react";

/**
 * Le trajet d'un message, de sa réception au récapitulatif du responsable.
 *
 * Ce schéma existait en image matricielle (`PARCOURS_MESSAGE`, toujours servie
 * par `/a-propos` et par les pages pays). Il est ici redessiné en HTML : le
 * texte devient net à toute taille, sélectionnable, indexable, et le fond suit
 * celui de la page au lieu de poser un rectangle crème sur du blanc.
 *
 * Les quatre temps sont ceux du code : réception sur le numéro connecté par QR
 * code (`saas/wa.py:73-79`), réponse tirée de la seule fiche
 * (`brain/brain.py:53-55`), conduite de la demande jusqu'à son enregistrement
 * (`brain/brain.py:56-70`), récapitulatif et alerte au responsable
 * (`saas/bot.py:55-100`). Aucun temps ne promet d'escalade sur information
 * manquante : ce n'est pas ce que fait le code.
 */
type Temps = {
  titre: string;
  detail: string;
  Icone: LucideIcon;
  /** Le dernier temps est ce qui SORT : il prend le vert, comme sur l'accueil. */
  sortie?: boolean;
};

const TEMPS: Temps[] = [
  {
    titre: "Le client écrit",
    detail: "Sur le numéro WhatsApp que vous utilisez déjà.",
    Icone: MessageSquareText,
  },
  {
    titre: "L'assistant lit votre fiche",
    detail: "Vos horaires, votre adresse, votre catalogue, vos consignes.",
    Icone: FileText,
  },
  {
    titre: "Il mène la demande jusqu'au bout",
    detail: "Il pose les questions qui manquent, puis confirme au client.",
    Icone: CheckCheck,
  },
  {
    titre: "Vous recevez le récapitulatif",
    detail: "Et l'alerte, dans les cas rares où un humain est indispensable.",
    Icone: BellRing,
    sortie: true,
  },
];

export default function ParcoursMessage() {
  return (
    <figure className="mt-2">
      {/*
        Géométrie du rail, à ne pas casser sans refaire le calcul : les pastilles
        d'icône mesurent 2,75 rem dans une carte à `p-5`, leur centre tombe donc
        à 42 px du haut de la carte. Le rail est posé à cette hauteur, entre les
        centres approximatifs de la première et de la dernière colonne.

        Il est déclaré AVANT les cartes et celles-ci sont `relative` : un
        élément positionné se peint au-dessus d'un bloc ordinaire, sans quoi le
        trait passerait par-dessus les cartes au lieu de disparaître dessous. Le
        rail ne se voit donc que dans les gouttières, ce qui est exactement le
        dessin voulu : quatre étapes reliées.

        Le rail n'apparaît qu'à partir de `lg`, la seule taille où les quatre
        temps tiennent sur une rangée. En dessous, la grille passe à deux
        colonnes puis à une : l'ordre de lecture suffit, un rail horizontal n'y
        relierait plus rien.
      */}
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rail en pointillés plutôt qu'un trait plein : sur un fond déjà très
            pâle, le filet uni disparaissait dans les gouttières, seul endroit
            où on le voit. */}
        <span
          aria-hidden="true"
          className="absolute left-[12.5%] right-[12.5%] top-[42px] hidden border-t border-dashed border-brand/35 lg:block"
        />
        {/* Le point qui parcourt le rail : le message avance d'un temps à
            l'autre. Il disparaît sous les cartes et réapparaît dans chaque
            gouttière, ce qui donne un déplacement par bonds plutôt qu'un
            curseur qui glisse. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[42px] hidden lg:block"
        >
          <span className="flux-rail absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
        </span>

        {TEMPS.map(({ titre, detail, Icone, sortie }) => (
          <li
            key={titre}
            className="relative rounded-xl2 border border-line bg-surface p-5 shadow-soft"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                sortie ? "bg-emerald-soft text-emerald-dark" : "bg-brand-soft text-brand"
              }`}
            >
              <Icone className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 font-display text-[0.95rem] font-bold leading-snug">{titre}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{detail}</p>
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 flex items-start gap-2 text-sm text-muted">
        <span aria-hidden="true" className="mt-2 h-px w-6 shrink-0 bg-brand/50" />
        Le trajet d&apos;un message, de sa réception à votre récapitulatif.
      </figcaption>
    </figure>
  );
}
