import journal from "@/assets/product-journal.jpg";
import pen from "@/assets/product-pen.jpg";
import cards from "@/assets/product-cards.jpg";
import wax from "@/assets/product-wax.jpg";
import paper from "@/assets/product-paper.jpg";
import planner from "@/assets/product-planner.jpg";

// Shape used by the cart and product pages. DB products satisfy this too.
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  short: string;
  description: string;
  trade_type?: "imported" | "exported";
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
      "A quiet companion. Bound by hand in supple sage leather, filled with 192 pages of acid-free cream cotton paper that takes ink beautifully.",
  },
  {
    id: "brass-fountain-pen",
    name: "Atelier Fountain Pen",
    category: "Writing",
    price: 86,
    image: pen,
    short: "Solid brass body with a medium iridium nib.",
    description: "Weighted, balanced, deliberate. A solid brass pen with medium iridium nib.",
  },
  {
    id: "letterpress-card-set",
    name: "Letterpress Card Set",
    category: "Cards",
    price: 24,
    image: cards,
    short: "Set of ten blush cards with envelopes.",
    description: "Ten cotton-paper cards pressed by foot, paired with cream envelopes and twine.",
  },
  {
    id: "wax-seal-kit",
    name: "Wax Seal Kit",
    category: "Sealing",
    price: 38,
    image: wax,
    short: "Brass seal, six wax sticks, snuffer.",
    description: "Brass floral seal, six dusty rose wax sticks, brass snuffer.",
  },
  {
    id: "cotton-letter-paper",
    name: "Cotton Letter Paper",
    category: "Paper",
    price: 22,
    image: paper,
    short: "Twenty-five sheets, sage ribbon.",
    description: "Twenty-five heavyweight cotton sheets in soft cream.",
  },
  {
    id: "weekly-planner",
    name: "Weekly Planner",
    category: "Journals",
    price: 42,
    image: planner,
    short: "Undated, lay-flat, sage cloth cover.",
    description: "Undated weekly planner with sage cloth cover and satin ribbon marker.",
  },
];

export const categories = ["All", "Journals", "Writing", "Cards", "Paper", "Sealing"] as const;

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
