"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Révèle son contenu quand il entre dans l'écran, une seule fois.
 *
 * L'état caché vit dans `.js .revele` (globals.css) et dépend de la classe `js`
 * posée sur <html> par le layout : sans JavaScript, rien n'est masqué. Ce
 * composant ne fait qu'ajouter `est-visible` au bon moment.
 *
 * `once` par construction : l'observateur se débranche au premier passage. Un
 * bloc qui rejoue son apparition à chaque remontée de la page fatigue plus
 * qu'il n'attire.
 */
export default function Reveal({
  children,
  delai = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Décalage en millisecondes, pour faire défiler une grille en cascade. */
  delai?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Deux cas où l'on montre tout de suite, sans observer : l'utilisateur a
    // demandé moins d'animations, ou le navigateur n'a pas IntersectionObserver.
    const sobre = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sobre || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // Un bloc déjà au-dessus de l'écran au montage a été dépassé sans jamais
    // être traversé : position de défilement restaurée au rechargement, ou
    // arrivée sur une ancre (/#faq). L'observateur ne dira rien — il ne signale
    // qu'un franchissement de seuil, et passer de « sous l'écran » à « au-dessus »
    // n'en franchit aucun. Sans ce test, le bloc resterait invisible pour de bon.
    if (el.getBoundingClientRect().bottom < 0) {
      setVisible(true);
      return;
    }

    // Un élément déjà à l'écran au chargement (le haut de page) est révélé
    // immédiatement par l'observateur, qui déclenche dès l'observation.
    const obs = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        setVisible(true);
        obs.disconnect();
      },
      // Le bloc doit être entré d'un dixième d'écran avant de se révéler :
      // déclencher au tout premier pixel donne une animation qu'on ne voit pas.
      { rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`revele ${visible ? "est-visible" : ""} ${className}`}
      style={delai ? { transitionDelay: `${delai}ms` } : undefined}
    >
      {children}
    </div>
  );
}
