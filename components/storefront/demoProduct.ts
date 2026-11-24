import {
  normalizeStorefrontLocale,
  type StorefrontLocale,
} from "../../lib/storefrontCopy";

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

/** The iOS shop opens on this product. */
export const DEFAULT_APPAREL_ID = "anon-unisex-shirt";

const CROP = "50% 15%";

interface ApparelText {
  brand: string;
  name: string;
  description: string;
  fabric: string;
  fit: string;
  sizes: string[];
  color: string;
  highlights: string[];
}

interface ApparelSpec {
  id: string;
  price: number;
  colorId: string;
  swatch: string;
  sku: string;
  imagePrefix: string;
}

const SPECS: ApparelSpec[] = [
  {
    id: "anon-unisex-shirt",
    price: 440,
    colorId: "navy",
    swatch: "#1A2447",
    sku: "AT-SHT-01-NVY",
    imagePrefix: "shirt",
  },
  {
    id: "anon-blouse",
    price: 457,
    colorId: "white",
    swatch: "#F5F5F5",
    sku: "AT-BLS-01-WHT",
    imagePrefix: "blouse",
  },
  {
    id: "anon-fj-blouson",
    price: 1100,
    colorId: "splatter",
    swatch: "#ED2E8C",
    sku: "AT-BLZ-01-SPT",
    imagePrefix: "blouson",
  },
];

const SHIP = {
  "en-US": ["Free shipping over HKD 500", "30-day easy returns", "Ships in 1–2 business days"],
  "zh-TW": ["滿 HKD 500 免運", "30 天輕鬆退換", "1–2 個工作天出貨"],
  "zh-CN": ["满 HKD 500 免运", "30 天轻松退换", "1–2 个工作日出货"],
  "ja-JP": ["HKD 500 以上送料無料", "30日間かんたん返品", "1〜2営業日で発送"],
  "ko-KR": ["HKD 500 이상 무료 배송", "30일 간편 반품", "영업일 1–2일 내 발송"],
} as const;

const ALSO: Record<StorefrontLocale, string> = {
  "en-US": "Also in the shop",
  "zh-TW": "其他商品",
  "zh-CN": "其他商品",
  "ja-JP": "ほかの商品",
  "ko-KR": "다른 상품",
};

const COPY: Record<StorefrontLocale, ApparelText[]> = {
  "en-US": [
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo Unisex Shirt",
      description:
        "Oversized navy short-sleeve shirt covered in pale Anon Tokyo calligraphy, with a small chest monogram. Worn open over a tee.",
      fabric: "Cotton shirting",
      fit: "Free size, close to L",
      sizes: ["Free"],
      color: "Navy",
      highlights: [...SHIP["en-US"]],
    },
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo Blouse",
      description:
        "White georgette blouse with a ruffled collar, pintucks, pearl buttons and one jewel button. Black script ribbon and an AT charm finish the cuff.",
      fabric: "Georgette",
      fit: "Free size, close to M",
      sizes: ["Free"],
      color: "White",
      highlights: [...SHIP["en-US"]],
    },
    {
      brand: "FASHION JOURNEY",
      name: "Fashion Journey Blouson",
      description:
        "Limited white hooded blouson with hot-pink and black paint splatter and two chest pockets.",
      fabric: "Cotton twill",
      fit: "Regular unisex fit",
      sizes: ["M", "L"],
      color: "Splatter",
      highlights: [
        "Fashion Journey limited piece",
        "30-day easy returns",
        "Ships in 1–2 business days",
      ],
    },
  ],
  "zh-TW": [
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 中性襯衫",
      description:
        "海軍藍寬鬆短袖襯衫，滿版淺色 Anon Tokyo 書法字，胸口有小字母標。可敞開穿在 T 恤外。",
      fabric: "棉質襯衫布",
      fit: "均碼，接近 L",
      sizes: ["均碼"],
      color: "海軍藍",
      highlights: [...SHIP["zh-TW"]],
    },
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 雪紡襯衫",
      description:
        "白色雪紡襯衫，荷葉領、褶襉、珍珠鈕同顆寶石鈕。袖口有黑色字樣織帶同 AT 吊飾。",
      fabric: "雪紡",
      fit: "均碼，接近 M",
      sizes: ["均碼"],
      color: "白色",
      highlights: [...SHIP["zh-TW"]],
    },
    {
      brand: "FASHION JOURNEY",
      name: "Fashion Journey 限定外套",
      description: "限定白色連帽外套，熱粉同黑色潑彩，胸前兩個口袋。",
      fabric: "棉斜紋",
      fit: "標準中性剪裁",
      sizes: ["M", "L"],
      color: "潑彩",
      highlights: ["Fashion Journey 限定", "30 天輕鬆退換", "1–2 個工作天出貨"],
    },
  ],
  "zh-CN": [
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 中性衬衫",
      description:
        "海军蓝宽松短袖衬衫，满版浅色 Anon Tokyo 书法字，胸口有小字母标。可敞开穿在 T 恤外。",
      fabric: "棉质衬衫布",
      fit: "均码，接近 L",
      sizes: ["均码"],
      color: "海军蓝",
      highlights: [...SHIP["zh-CN"]],
    },
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 雪纺衬衫",
      description:
        "白色雪纺衬衫，荷叶领、褶裥、珍珠扣和一颗宝石扣。袖口有黑色字样织带和 AT 吊饰。",
      fabric: "雪纺",
      fit: "均码，接近 M",
      sizes: ["均码"],
      color: "白色",
      highlights: [...SHIP["zh-CN"]],
    },
    {
      brand: "FASHION JOURNEY",
      name: "Fashion Journey 限定外套",
      description: "限定白色连帽外套，热粉和黑色泼彩，胸前两个口袋。",
      fabric: "棉斜纹",
      fit: "标准中性剪裁",
      sizes: ["M", "L"],
      color: "泼彩",
      highlights: ["Fashion Journey 限定", "30 天轻松退换", "1–2 个工作日出货"],
    },
  ],
  "ja-JP": [
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo ユニセックスシャツ",
      description:
        "淡い Anon Tokyo カリグラフィーを全面にあしらったネイビーのオーバーサイズ半袖シャツ。胸元に小さなモノグラム。Tシャツの上から開けて着用。",
      fabric: "コットンシャツ地",
      fit: "フリーサイズ、L 相当",
      sizes: ["フリー"],
      color: "ネイビー",
      highlights: [...SHIP["ja-JP"]],
    },
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo ブラウス",
      description:
        "フリル襟、ピンタック、パールボタンとジュエルボタンの白いジョーゼットブラウス。袖口に黒のスクリプトリボンと AT チャーム。",
      fabric: "ジョーゼット",
      fit: "フリーサイズ、M 相当",
      sizes: ["フリー"],
      color: "ホワイト",
      highlights: [...SHIP["ja-JP"]],
    },
    {
      brand: "FASHION JOURNEY",
      name: "Fashion Journey 限定ブルゾン",
      description:
        "ホットピンクとブラックのスプラッター、胸ポケット二つ付きの限定ホワイトフーデッドブルゾン。",
      fabric: "コットンツイル",
      fit: "レギュラーユニセックスフィット",
      sizes: ["M", "L"],
      color: "スプラッター",
      highlights: ["Fashion Journey 限定", "30日間かんたん返品", "1〜2営業日で発送"],
    },
  ],
  "ko-KR": [
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 유니섹스 셔츠",
      description:
        "연한 Anon Tokyo 캘리그라피가 전체 프린트된 네이비 오버사이즈 반소매 셔츠. 가슴에 작은 모노그램. 티셔츠 위에 열어 입습니다.",
      fabric: "코튼 셔츠 원단",
      fit: "프리 사이즈, L에 가까움",
      sizes: ["프리"],
      color: "네이비",
      highlights: [...SHIP["ko-KR"]],
    },
    {
      brand: "ANON TOKYO",
      name: "Anon Tokyo 블라우스",
      description:
        "러플 칼라, 핀턱, 진주 버튼과 주얼 버튼이 있는 화이트 조젯 블라우스. 소매에 블랙 스크립트 리본과 AT 참.",
      fabric: "조젯",
      fit: "프리 사이즈, M에 가까움",
      sizes: ["프리"],
      color: "화이트",
      highlights: [...SHIP["ko-KR"]],
    },
    {
      brand: "FASHION JOURNEY",
      name: "Fashion Journey 한정 블루종",
      description:
        "핫핑크와 블랙 스플래터, 가슴 포켓 두 개가 있는 한정 화이트 후드 블루종.",
      fabric: "코튼 트윌",
      fit: "레귤러 유니섹스 핏",
      sizes: ["M", "L"],
      color: "스플래터",
      highlights: ["Fashion Journey 한정", "30일 간편 반품", "영업일 1–2일 내 발송"],
    },
  ],
};

function gallery(prefix: string, alt: string): DemoProductImage[] {
  return ["front", "side", "back"].map((view) => ({
    src: `/storefront/${prefix}-${view}.png`,
    alt,
    objectPosition: CROP,
  }));
}

function toProduct(spec: ApparelSpec, text: ApparelText): DemoProduct {
  return {
    id: spec.id,
    name: text.name,
    brand: text.brand,
    description: text.description,
    price: spec.price,
    fabric: text.fabric,
    fit: text.fit,
    sizes: text.sizes,
    highlights: text.highlights,
    colors: [
      {
        id: spec.colorId,
        label: text.color,
        swatch: spec.swatch,
        sku: spec.sku,
        images: gallery(spec.imagePrefix, text.name),
      },
    ],
  };
}

/** iOS demo catalog: shirt, blouse, blouson. Prices are the app's HKD amounts. */
export function getLocalizedApparel(locale: string | undefined): DemoProduct[] {
  const key = normalizeStorefrontLocale(locale);
  return SPECS.map((spec, index) => toProduct(spec, COPY[key][index]));
}

export function alsoInTheShop(locale: string | undefined): string {
  return ALSO[normalizeStorefrontLocale(locale)];
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
