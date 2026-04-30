import journal from "@/assets/product-journal.jpg";
import pen from "@/assets/product-pen.jpg";
import cards from "@/assets/product-cards.jpg";
import wax from "@/assets/product-wax.jpg";
import paper from "@/assets/product-paper.jpg";
import planner from "@/assets/product-planner.jpg";

export type Product = {
  id: string;
  name: string;
  category: "Journals" | "Writing" | "Cards" | "Paper" | "Sealing";
  price: number;
  image: string;
  short: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "sage-leather-journal",
    name: "Sage Leather Journal",
    category: "Journals",
    price: 48,
    image: journal,
    short: "Hand-bound, 192 pages of cream cotton paper.",
    description:
      "A quiet companion. Bound by hand in supple sage leather, filled with 192 pages of acid-free cream cotton paper that takes ink beautifully. Designed to lie flat, age gracefully, and follow you everywhere.",
  },
  {
    id: "brass-fountain-pen",
    name: "Atelier Fountain Pen",
    category: "Writing",
    price: 86,
    image: pen,
    short: "Solid brass body with a medium iridium nib.",
    description:
      "Weighted, balanced, deliberate. A solid brass pen finished by hand and fitted with a medium iridium nib that lays down a smooth, generous line. Ships in a linen sleeve.",
  },
  {
    id: "letterpress-card-set",
    name: "Letterpress Card Set",
    category: "Cards",
    price: 24,
    image: cards,
    short: "Set of ten blush cards with envelopes.",
    description:
      "Ten cotton-paper cards pressed by foot in a small Stockholm studio. Soft blush, deep impression, paired with cream envelopes and twine.",
  },
  {
    id: "wax-seal-kit",
    name: "Wax Seal Kit",
    category: "Sealing",
    price: 38,
    image: wax,
    short: "Brass seal, six wax sticks, snuffer.",
    description:
      "A small ritual to close a letter. Includes a brass floral seal, six dusty rose wax sticks, and a brass snuffer in a linen pouch.",
  },
  {
    id: "cotton-letter-paper",
    name: "Cotton Letter Paper",
    category: "Paper",
    price: 22,
    image: paper,
    short: "Twenty-five sheets, sage ribbon.",
    description:
      "Twenty-five heavyweight cotton sheets in soft cream, gathered with a sage satin ribbon. Made for slow correspondence.",
  },
  {
    id: "weekly-planner",
    name: "Weekly Planner",
    category: "Journals",
    price: 42,
    image: planner,
    short: "Undated, lay-flat, sage cloth cover.",
    description:
      "An undated weekly planner with a generous open spread, sage cloth cover, and a satin ribbon marker. Begin any week, any time.",
  },
];

export const categories = [
  "All",
  "Journals",
  "Writing",
  "Cards",
  "Paper",
  "Sealing",
] as const;

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
