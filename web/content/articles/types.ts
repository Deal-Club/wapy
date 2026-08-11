export type Post = {
  slug: string;
  title: string;        // <title> + H1
  description: string;  // meta description (~155 car.)
  keywords: string[];
  date: string;         // ISO (publication)
  updated?: string;
  readingMin: number;
  excerpt: string;      // carte d'index
  body: string;         // HTML sémantique (rendu dans .article)
};
