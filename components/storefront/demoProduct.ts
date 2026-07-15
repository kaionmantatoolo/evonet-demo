export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currencyHint: string;
  imageLabel: string;
}

/** Default demo SKU for the storefront preview. */
export const DEMO_PRODUCT: DemoProduct = {
  id: "evo-demo-hoodie",
  name: "Evonet Studio Hoodie",
  description:
    "Soft mid-weight cotton hoodie for demos. Use Buy now to open Drop-in with your Builder theme.",
  price: 128,
  currencyHint: "Uses Builder currency (default HKD).",
  imageLabel: "Studio Hoodie",
};
