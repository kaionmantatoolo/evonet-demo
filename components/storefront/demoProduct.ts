export interface DemoProductImage {
  src: string;
  alt: string;
}

export interface DemoProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  fabric: string;
  fit: string;
  sizes: string[];
  colors: { id: string; label: string; swatch: string }[];
  images: DemoProductImage[];
  highlights: string[];
}

/** Default demo SKU for the storefront preview. */
export const DEMO_PRODUCT: DemoProduct = {
  id: "evo-studio-hoodie",
  name: "Studio Heavyweight Hoodie",
  brand: "ATELIER NORTH",
  description:
    "A mid-season staple in dense cotton jersey. Soft brushed interior, clean set-in sleeves, and a quietly structured hood—built for everyday wear and clean payment demos.",
  price: 128,
  compareAtPrice: 168,
  sku: "AN-HD-01-CHA",
  fabric: "420gsm organic cotton fleece",
  fit: "Relaxed unisex fit",
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    { id: "charcoal", label: "Charcoal", swatch: "#3f3f46" },
    { id: "sand", label: "Sand", swatch: "#d6c6b0" },
    { id: "ink", label: "Ink", swatch: "#1e293b" },
  ],
  images: [
    {
      src: "/storefront/hoodie-flat.png",
      alt: "Charcoal hoodie laid flat on concrete",
    },
    {
      src: "/storefront/hoodie-lifestyle.png",
      alt: "Charcoal hoodie worn in café light",
    },
    {
      src: "/storefront/hoodie-detail.png",
      alt: "Close-up of hoodie ribbed cuff texture",
    },
  ],
  highlights: [
    "Free shipping over HKD 500",
    "30-day easy returns",
    "Ships in 1–2 business days",
  ],
};
