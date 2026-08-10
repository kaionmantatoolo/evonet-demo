import { getStorefrontCopy } from "../../lib/storefrontCopy";

export interface DemoProductImage {
  src: string;
  alt: string;
  /** CSS object-position for cover crops (keeps face / logo in frame). */
  objectPosition?: string;
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
  id: "anon-founder-hoodie",
  name: "Founder Zip Hoodie",
  brand: "ANON TOKYO",
  description:
    "Heavyweight zip hoodie with the pink Founder shield on the left chest and gothic Anon Tokyo mark on the hood. Relaxed streetwear cut, silver hardware, and a clean studio look—built for bandwear demos and a sharp Evonet checkout.",
  price: 128,
  compareAtPrice: 168,
  fabric: "Heavyweight cotton fleece",
  fit: "Relaxed unisex fit",
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    {
      id: "black",
      label: "Black",
      swatch: "#111111",
      sku: "AT-HD-01-BLK",
      images: [
        {
          src: "/storefront/hoodie-black-front.png",
          alt: "Model wearing black Founder zip hoodie, front view",
          objectPosition: "50% 8%",
        },
        {
          src: "/storefront/hoodie-black-back.png",
          alt: "Model wearing black Founder zip hoodie, back with Anon Tokyo hood mark",
          objectPosition: "50% 12%",
        },
        {
          src: "/storefront/hoodie-black-hood.png",
          alt: "Close-up of gothic Anon Tokyo text on the black hoodie hood",
          objectPosition: "50% 42%",
        },
      ],
    },
    {
      id: "pink",
      label: "Anon Pink",
      swatch: "#ff8899",
      sku: "AT-HD-01-PNK",
      images: [
        {
          src: "/storefront/hoodie-pink-front.png",
          alt: "Model wearing pink Founder zip hoodie, front view",
          objectPosition: "50% 6%",
        },
        {
          src: "/storefront/hoodie-pink-back.png",
          alt: "Model wearing pink Founder zip hoodie, back with Anon Tokyo hood mark",
          objectPosition: "50% 10%",
        },
        {
          src: "/storefront/hoodie-pink-hood.png",
          alt: "Close-up of gothic Anon Tokyo text on the pink hoodie hood",
          objectPosition: "50% 40%",
        },
      ],
    },
    {
      id: "blue",
      label: "Tokyo Blue",
      swatch: "#3388bb",
      sku: "AT-HD-01-BLU",
      images: [
        {
          src: "/storefront/hoodie-blue-front.png",
          alt: "Model wearing blue Founder zip hoodie, front view",
          objectPosition: "50% 8%",
        },
        {
          src: "/storefront/hoodie-blue-back.png",
          alt: "Model wearing blue Founder zip hoodie, back with Anon Tokyo hood mark",
          objectPosition: "50% 12%",
        },
        {
          src: "/storefront/hoodie-blue-hood.png",
          alt: "Close-up of gothic Anon Tokyo text on the blue hoodie hood",
          objectPosition: "50% 38%",
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

/** Clone demo product with locale-specific name, copy, and color labels. */
export function getLocalizedDemoProduct(
  locale: string | undefined,
  unitPrice?: number
): DemoProduct {
  const copy = getStorefrontCopy(locale);
  const p = copy.product;
  const price = unitPrice ?? DEMO_PRODUCT.price;
  return {
    ...DEMO_PRODUCT,
    name: p.name,
    description: p.description,
    fabric: p.fabric,
    fit: p.fit,
    price,
    highlights: [...p.highlights],
    colors: DEMO_PRODUCT.colors.map((color) => ({
      ...color,
      label:
        color.id === "black"
          ? p.colors.black
          : color.id === "pink"
            ? p.colors.pink
            : color.id === "blue"
              ? p.colors.blue
              : color.label,
      images: color.images.map((image) => ({ ...image })),
    })),
  };
}
