/**
 * La marque Wapy : bulle + monogramme W.
 *
 * SVG en ligne (et non `<img>`) pour rester net à toute taille et hériter la
 * couleur du texte : la bulle prend `currentColor`, donc `text-brand` suffit à
 * la colorer. Le W est tracé dans la couleur du fond (crème par défaut) pour
 * donner l'illusion d'un évidement.
 *
 * Le tracé maître et ses déclinaisons (inverse, monochrome, verrous) vivent
 * dans `audits/logos/livraison/`.
 */
const BULLE =
  "M24 10 H76 A16 16 0 0 1 92 26 V56 A16 16 0 0 1 76 72 H46 L26 90 V72 H24 " +
  "A16 16 0 0 1 8 56 V26 A16 16 0 0 1 24 10 Z";
const LETTRE = "M28 28 L37 55 L50 37 L63 55 L72 28";

export default function WapyMarque({
  className = "h-7 w-7",
  couleurLettre = "#F7F4EF",
}: {
  className?: string;
  /** Couleur du W : celle du fond sur lequel la marque est posée. */
  couleurLettre?: string;
}) {
  return (
    // Décoratif : le mot « Wapy » est toujours écrit à côté, l'annoncer deux
    // fois ferait bégayer les lecteurs d'écran.
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={BULLE} fill="currentColor" />
      <path
        d={LETTRE}
        fill="none"
        stroke={couleurLettre}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
