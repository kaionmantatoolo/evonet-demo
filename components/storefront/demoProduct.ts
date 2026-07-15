export interface DemoProductImage {
  src: string;
  alt: string;
}

export interface DemoProductColor {
  id: string;
  label: string;
  swatch: string;
  sku: string;
  images: DemoProductImage[];
}

export interface DemoProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  fabric: string;
  fit: string;
  sizes: string[];
  colors: DemoProductColor[];
  highlights: string[];
}

/** Images for a color variant; falls back to the first color. */
export function productImagesForColor(
  product: DemoProduct,
  colorId: string
): DemoProductImage[] {
  const color =
    product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  return color?.images ?? [];
}

export function productThumbForColor(
  product: DemoProduct,
  colorId: string
): DemoProductImage | undefined {
  return productImagesForColor(product, colorId)[0];
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
  fabric: "420gsm organic cotton fleece",
  fit: "Relaxed unisex fit",
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    {
      id: "charcoal",
      label: "Charcoal",
      swatch: "#3f3f46",
      sku: "AN-HD-01-CHA",
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
          alt: "Close-up of charcoal hoodie ribbed cuff texture",
        },
      ],
    },
    {
      id: "sand",
      label: "Sand",
      swatch: "#d6c6b0",
      sku: "AN-HD-01-SND",
      images: [
        {
          src: "/storefront/hoodie-flat-sand.png",
          alt: "Sand hoodie laid flat on concrete",
        },
        {
          src: "/storefront/hoodie-lifestyle-sand.png",
          alt: "Sand hoodie worn in café light",
        },
        {
          src: "/storefront/hoodie-detail-sand.png",
          alt: "Close-up of sand hoodie ribbed cuff texture",
        },
      ],
    },
    {
      id: "ink",
      label: "Ink",
      swatch: "#1e293b",
      sku: "AN-HD-01-INK",
      images: [
        {
          src: "/storefront/hoodie-flat-ink.png",
          alt: "Ink hoodie laid flat on concrete",
        },
        {
          src: "/storefront/hoodie-lifestyle-ink.png",
          alt: "Ink hoodie worn in café light",
        },
        {
          src: "/storefront/hoodie-detail-ink.png",
          alt: "Close-up of ink hoodie ribbed cuff texture",
        },
      ],
    },
  ],
  highlights: [
    "Free shipping over HKD 500",
    "30-day easy returns",
    "Ships in 1–2 business days",
  ],
};
