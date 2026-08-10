import type { Source } from "./types";

export const SOURCES: Record<string, Source> = {
  "insae-benin-rgph4": {
    id: "insae-benin-rgph4",
    label: "INSAE Bénin, RGPH4",
    url: "https://instad.bj/",
    consulteLe: "2026-08-10",
  },
  "ansd-senegal-rgphae": {
    id: "ansd-senegal-rgphae",
    label: "ANSD Sénégal, RGPHAE",
    url: "https://www.ansd.sn/",
    consulteLe: "2026-08-10",
  },
  "ins-cotedivoire-rgph": {
    id: "ins-cotedivoire-rgph",
    label: "INS Côte d'Ivoire, RGPH",
    url: "https://www.ins.ci/",
    consulteLe: "2026-08-10",
  },
  "bucrep-cameroun-rgph": {
    id: "bucrep-cameroun-rgph",
    label: "BUCREP Cameroun, RGPH",
    url: "https://bucrep.cm/",
    consulteLe: "2026-08-10",
  },
  "inseed-togo-rgph": {
    id: "inseed-togo-rgph",
    label: "INSEED Togo, RGPH",
    url: "https://inseed.tg/",
    consulteLe: "2026-08-10",
  },
};

export function sourceExiste(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SOURCES, id);
}
