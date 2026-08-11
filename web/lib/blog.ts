// Les articles vivent désormais dans content/articles/, un fichier par article.
// Ce module ne subsiste que pour ne casser aucun import existant.
export type { Post } from "@/content/articles";
export { POSTS, tagFor, getPost, related } from "@/content/articles";
