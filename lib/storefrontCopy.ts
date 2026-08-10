export type StorefrontLocale = "en-US" | "zh-TW" | "zh-CN" | "ja-JP";

export interface StorefrontCopy {
  navTagline: string;
  backToBuilder: string;
  builderShort: string;
  openBag: string;
  promoBar: (currency: string) => string;
  editorialTitle: string;
  editorialBody: string;
  viewBag: string;
  footerMeta: string;
  closeToStorefront: string;
  addedToBag: string;
  view: string;
  colorLabel: string;
  sizeLabel: string;
  buyNow: (currency: string, price: string) => string;
  buyNowShort: (currency: string, price: string) => string;
  addToBag: string;
  fabric: string;
  sku: string;
  bagTitle: string;
  closeBag: string;
  bagEmpty: string;
  keepBrowsing: string;
  subtotal: string;
  shippingNote: string;
  checkout: string;
  decreaseQty: (label: string) => string;
  increaseQty: (label: string) => string;
  sizeLine: (color: string, size: string) => string;
  secureCheckout: string;
  poweredByEvonet: string;
  closeCheckout: string;
  orderItems: (count: number) => string;
  qty: (n: number) => string;
  checkoutEmpty: string;
  continueShopping: string;
  orderStatus: string;
  orderNumber: string;
  paymentReference: string;
  note: string;
  estimatedDelivery: string;
  deliveryNote: string;
  orderDetails: string;
  tryCheckoutAgain: string;
  backToProduct: string;
  itemsCount: (count: number) => string;
  status: {
    success: { eyebrow: string; title: string; body: string };
    failed: { eyebrow: string; title: string; body: string };
    cancelled: { eyebrow: string; title: string; body: string };
    pending: { eyebrow: string; title: string; body: string };
  };
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  loadingPayment: string;
  showImage: (n: number) => string;
  sessionFailed: string;
  sessionUnexpected: string;
  product: {
    name: string;
    description: string;
    fabric: string;
    fit: string;
    colors: { black: string; pink: string; blue: string };
    highlights: [string, string, string];
  };
}

const EN: StorefrontCopy = {
  navTagline: "Official bandwear",
  backToBuilder: "Back to Builder",
  builderShort: "Builder",
  openBag: "Open bag",
  promoBar: (currency) =>
    `Complimentary shipping on orders over ${currency} 500 · Easy 30-day returns`,
  editorialTitle: "Form a lifelong band. Create fashion for a lifetime.",
  editorialBody:
    "ANON TOKYO costume design meets your Drop-in Builder palette—CTAs, accents, and the payment panel share one visual language when you pay with Evonet.",
  viewBag: "View bag",
  footerMeta: "Demo storefront · Theme from Builder",
  closeToStorefront: "Close to return to the storefront",
  addedToBag: "Added to bag",
  view: "View",
  colorLabel: "Color",
  sizeLabel: "Size",
  buyNow: (currency, price) => `Buy now — ${currency} ${price}`,
  buyNowShort: (currency, price) => `Buy now · ${currency} ${price}`,
  addToBag: "Add to bag",
  fabric: "Fabric",
  sku: "SKU",
  bagTitle: "Your bag",
  closeBag: "Close bag",
  bagEmpty: "Your bag is empty. Add the Founder Zip Hoodie to continue.",
  keepBrowsing: "Keep browsing",
  subtotal: "Subtotal",
  shippingNote: "Shipping calculated at checkout.",
  checkout: "Checkout",
  decreaseQty: (label) => `Decrease ${label}`,
  increaseQty: (label) => `Increase ${label}`,
  sizeLine: (color, size) => `${color} · Size ${size}`,
  secureCheckout: "Secure checkout",
  poweredByEvonet: "Powered by Evonet Drop-in",
  closeCheckout: "Close checkout",
  orderItems: (count) =>
    count === 1 ? `Order · ${count} item` : `Order · ${count} items`,
  qty: (n) => `Qty ${n}`,
  checkoutEmpty: "Buy now or checkout from your bag to load Drop-in here.",
  continueShopping: "Continue shopping",
  orderStatus: "Order status",
  orderNumber: "Order number",
  paymentReference: "Payment reference",
  note: "Note",
  estimatedDelivery: "Estimated delivery",
  deliveryNote: "1–2 business days · Free returns within 30 days",
  orderDetails: "Order details",
  tryCheckoutAgain: "Try checkout again",
  backToProduct: "Back to product",
  itemsCount: (count) => (count === 1 ? `${count} item` : `${count} items`),
  status: {
    success: {
      eyebrow: "Order confirmed",
      title: "Thank you — your order is placed",
      body: "We’ve emailed a receipt and started packing. You’ll get tracking updates as soon as it ships.",
    },
    failed: {
      eyebrow: "Payment unsuccessful",
      title: "We couldn’t complete your payment",
      body: "Nothing was charged. You can try checkout again with the same bag, or continue shopping.",
    },
    cancelled: {
      eyebrow: "Payment cancelled",
      title: "Checkout was cancelled",
      body: "Your bag is still here. Resume when you’re ready — no charge was made.",
    },
    pending: {
      eyebrow: "Payment pending",
      title: "We’re confirming your payment",
      body: "This can take a moment for some payment methods. Hang tight — we’ll update this page when it’s ready.",
    },
  },
  emptyTitle: "Open from Builder first",
  emptyBody:
    "Configure appearance and order amount in Drop-in Builder, then click Open as storefront. Your Builder settings stay in place when you return.",
  emptyCta: "Back to Builder",
  loadingPayment: "Loading payment methods",
  showImage: (n) => `Show image ${n}`,
  sessionFailed: "Failed to create session via Evonet interaction API.",
  sessionUnexpected: "Unexpected session error.",
  product: {
    name: "Founder Zip Hoodie",
    description:
      "Heavyweight zip hoodie with the pink Founder shield on the left chest and gothic Anon Tokyo mark on the hood. Relaxed streetwear cut, silver hardware, and a clean studio look—built for bandwear demos and a sharp Evonet checkout.",
    fabric: "Heavyweight cotton fleece",
    fit: "Relaxed unisex fit",
    colors: { black: "Black", pink: "Anon Pink", blue: "Tokyo Blue" },
    highlights: [
      "Free shipping over HKD 500",
      "30-day easy returns",
      "Ships in 1–2 business days",
    ],
  },
};

const ZH_TW: StorefrontCopy = {
  ...EN,
  navTagline: "官方演出服飾",
  backToBuilder: "返回 Builder",
  builderShort: "Builder",
  openBag: "開啟購物袋",
  promoBar: (currency) =>
    `滿 ${currency} 500 免運 · 30 天輕鬆退換`,
  editorialTitle: "組一輩子樂隊，做一輩子服裝。",
  editorialBody:
    "ANON TOKYO 服裝設計與 Drop-in Builder 色盤合流——按鈕、強調色與付款面板在 Evonet 結帳時使用同一套視覺語言。",
  viewBag: "查看購物袋",
  footerMeta: "示範店面 · 主題來自 Builder",
  closeToStorefront: "關閉以返回店面",
  addedToBag: "已加入購物袋",
  view: "查看",
  colorLabel: "顏色",
  sizeLabel: "尺寸",
  buyNow: (currency, price) => `立即購買 — ${currency} ${price}`,
  buyNowShort: (currency, price) => `立即購買 · ${currency} ${price}`,
  addToBag: "加入購物袋",
  fabric: "材質",
  sku: "貨號",
  bagTitle: "你的購物袋",
  closeBag: "關閉購物袋",
  bagEmpty: "購物袋是空的。請先加入 Founder Zip Hoodie。",
  keepBrowsing: "繼續瀏覽",
  subtotal: "小計",
  shippingNote: "運費於結帳時計算。",
  checkout: "結帳",
  decreaseQty: (label) => `減少 ${label}`,
  increaseQty: (label) => `增加 ${label}`,
  sizeLine: (color, size) => `${color} · 尺寸 ${size}`,
  secureCheckout: "安全結帳",
  poweredByEvonet: "由 Evonet Drop-in 提供",
  closeCheckout: "關閉結帳",
  orderItems: (count) => `訂單 · ${count} 件`,
  qty: (n) => `數量 ${n}`,
  checkoutEmpty: "請立即購買或從購物袋結帳，以載入 Drop-in。",
  continueShopping: "繼續購物",
  orderStatus: "訂單狀態",
  orderNumber: "訂單編號",
  paymentReference: "付款參考號",
  note: "備註",
  estimatedDelivery: "預計配送",
  deliveryNote: "1–2 個工作天 · 30 天內免費退貨",
  orderDetails: "訂單詳情",
  tryCheckoutAgain: "重新結帳",
  backToProduct: "返回商品",
  itemsCount: (count) => `${count} 件`,
  status: {
    success: {
      eyebrow: "訂單已確認",
      title: "謝謝 — 訂單已成立",
      body: "我們已寄出收據並開始備貨。出貨後會再提供追蹤資訊。",
    },
    failed: {
      eyebrow: "付款失敗",
      title: "無法完成付款",
      body: "尚未扣款。可用同一購物袋再試一次，或繼續購物。",
    },
    cancelled: {
      eyebrow: "付款已取消",
      title: "結帳已取消",
      body: "購物袋仍在。準備好時再繼續即可，尚未產生費用。",
    },
    pending: {
      eyebrow: "付款處理中",
      title: "正在確認付款",
      body: "部分付款方式需要一點時間。請稍候，完成後我們會更新此頁。",
    },
  },
  emptyTitle: "請先從 Builder 開啟",
  emptyBody:
    "在 Drop-in Builder 設定外觀與訂單金額，然後點「Open as storefront」。返回時 Builder 設定會保留。",
  emptyCta: "返回 Builder",
  loadingPayment: "正在載入付款方式",
  showImage: (n) => `顯示圖片 ${n}`,
  sessionFailed: "透過 Evonet interaction API 建立 session 失敗。",
  sessionUnexpected: "建立 session 時發生未預期錯誤。",
  product: {
    name: "Founder 拉鍊連帽外套",
    description:
      "厚磅拉鍊連帽外套，左胸粉色 Founder 徽章，帽後哥德字樣 Anon Tokyo。寬鬆街頭剪裁、銀色五金，適合樂隊服飾示範與 Evonet 結帳體驗。",
    fabric: "厚磅棉質刷毛",
    fit: "寬鬆中性剪裁",
    colors: { black: "黑色", pink: "Anon 粉", blue: "Tokyo 藍" },
    highlights: ["滿 HKD 500 免運", "30 天輕鬆退換", "1–2 個工作天出貨"],
  },
};

const ZH_CN: StorefrontCopy = {
  ...EN,
  navTagline: "官方演出服饰",
  backToBuilder: "返回 Builder",
  builderShort: "Builder",
  openBag: "打开购物袋",
  promoBar: (currency) =>
    `满 ${currency} 500 免运 · 30 天轻松退换`,
  editorialTitle: "组一辈子乐队，做一辈子服装。",
  editorialBody:
    "ANON TOKYO 服装设计与 Drop-in Builder 色盘合流——按钮、强调色与付款面板在 Evonet 结账时使用同一套视觉语言。",
  viewBag: "查看购物袋",
  footerMeta: "演示店面 · 主题来自 Builder",
  closeToStorefront: "关闭以返回店面",
  addedToBag: "已加入购物袋",
  view: "查看",
  colorLabel: "颜色",
  sizeLabel: "尺码",
  buyNow: (currency, price) => `立即购买 — ${currency} ${price}`,
  buyNowShort: (currency, price) => `立即购买 · ${currency} ${price}`,
  addToBag: "加入购物袋",
  fabric: "材质",
  sku: "货号",
  bagTitle: "你的购物袋",
  closeBag: "关闭购物袋",
  bagEmpty: "购物袋是空的。请先加入 Founder Zip Hoodie。",
  keepBrowsing: "继续浏览",
  subtotal: "小计",
  shippingNote: "运费在结账时计算。",
  checkout: "结账",
  decreaseQty: (label) => `减少 ${label}`,
  increaseQty: (label) => `增加 ${label}`,
  sizeLine: (color, size) => `${color} · 尺码 ${size}`,
  secureCheckout: "安全结账",
  poweredByEvonet: "由 Evonet Drop-in 提供",
  closeCheckout: "关闭结账",
  orderItems: (count) => `订单 · ${count} 件`,
  qty: (n) => `数量 ${n}`,
  checkoutEmpty: "请立即购买或从购物袋结账，以加载 Drop-in。",
  continueShopping: "继续购物",
  orderStatus: "订单状态",
  orderNumber: "订单编号",
  paymentReference: "付款参考号",
  note: "备注",
  estimatedDelivery: "预计配送",
  deliveryNote: "1–2 个工作日 · 30 天内免费退货",
  orderDetails: "订单详情",
  tryCheckoutAgain: "重新结账",
  backToProduct: "返回商品",
  itemsCount: (count) => `${count} 件`,
  status: {
    success: {
      eyebrow: "订单已确认",
      title: "谢谢 — 订单已提交",
      body: "我们已发送收据并开始备货。发货后会提供物流追踪。",
    },
    failed: {
      eyebrow: "付款失败",
      title: "无法完成付款",
      body: "尚未扣款。可用同一购物袋再试，或继续购物。",
    },
    cancelled: {
      eyebrow: "付款已取消",
      title: "结账已取消",
      body: "购物袋仍在。准备好后再继续即可，尚未产生费用。",
    },
    pending: {
      eyebrow: "付款处理中",
      title: "正在确认付款",
      body: "部分付款方式需要一点时间。请稍候，完成后我们会更新此页。",
    },
  },
  emptyTitle: "请先从 Builder 打开",
  emptyBody:
    "在 Drop-in Builder 配置外观与订单金额，然后点击「Open as storefront」。返回时 Builder 设置会保留。",
  emptyCta: "返回 Builder",
  loadingPayment: "正在加载付款方式",
  showImage: (n) => `显示图片 ${n}`,
  sessionFailed: "通过 Evonet interaction API 创建 session 失败。",
  sessionUnexpected: "创建 session 时发生意外错误。",
  product: {
    name: "Founder 拉链连帽衫",
    description:
      "厚磅拉链连帽衫，左胸粉色 Founder 徽章，帽后哥特字样 Anon Tokyo。宽松街头剪裁、银色五金，适合乐队服饰演示与 Evonet 结账体验。",
    fabric: "厚磅棉质抓绒",
    fit: "宽松中性剪裁",
    colors: { black: "黑色", pink: "Anon 粉", blue: "Tokyo 蓝" },
    highlights: ["满 HKD 500 免运", "30 天轻松退换", "1–2 个工作日出货"],
  },
};

const JA: StorefrontCopy = {
  ...EN,
  navTagline: "公式バンドウェア",
  backToBuilder: "Builder に戻る",
  builderShort: "Builder",
  openBag: "バッグを開く",
  promoBar: (currency) =>
    `${currency} 500 以上で送料無料 · 30日間かんたん返品`,
  editorialTitle: "一生のバンドを、一生のファッションを。",
  editorialBody:
    "ANON TOKYO の衣装デザインが Drop-in Builder のパレットと響き合います。CTA・アクセント・決済パネルが Evonet で同じビジュアル言語になります。",
  viewBag: "バッグを見る",
  footerMeta: "デモストアフロント · Builder のテーマ",
  closeToStorefront: "閉じてストアフロントに戻る",
  addedToBag: "バッグに追加しました",
  view: "見る",
  colorLabel: "カラー",
  sizeLabel: "サイズ",
  buyNow: (currency, price) => `今すぐ購入 — ${currency} ${price}`,
  buyNowShort: (currency, price) => `今すぐ購入 · ${currency} ${price}`,
  addToBag: "バッグに追加",
  fabric: "素材",
  sku: "SKU",
  bagTitle: "バッグ",
  closeBag: "バッグを閉じる",
  bagEmpty: "バッグは空です。Founder Zip Hoodie を追加してください。",
  keepBrowsing: "買い物を続ける",
  subtotal: "小計",
  shippingNote: "送料はチェックアウト時に計算されます。",
  checkout: "チェックアウト",
  decreaseQty: (label) => `${label} を減らす`,
  increaseQty: (label) => `${label} を増やす`,
  sizeLine: (color, size) => `${color} · サイズ ${size}`,
  secureCheckout: "セキュアチェックアウト",
  poweredByEvonet: "Evonet Drop-in 提供",
  closeCheckout: "チェックアウトを閉じる",
  orderItems: (count) => `注文 · ${count} 点`,
  qty: (n) => `数量 ${n}`,
  checkoutEmpty: "今すぐ購入、またはバッグからチェックアウトして Drop-in を読み込みます。",
  continueShopping: "買い物を続ける",
  orderStatus: "注文ステータス",
  orderNumber: "注文番号",
  paymentReference: "支払い参照番号",
  note: "メモ",
  estimatedDelivery: "お届け予定",
  deliveryNote: "1〜2営業日 · 30日以内無料返品",
  orderDetails: "注文詳細",
  tryCheckoutAgain: "もう一度チェックアウト",
  backToProduct: "商品に戻る",
  itemsCount: (count) => `${count} 点`,
  status: {
    success: {
      eyebrow: "注文確定",
      title: "ありがとうございます — ご注文を受け付けました",
      body: "領収書をメールでお送りし、梱包を開始しました。発送次第、追跡情報をお知らせします。",
    },
    failed: {
      eyebrow: "支払い失敗",
      title: "お支払いを完了できませんでした",
      body: "課金は行われていません。同じバッグでもう一度試すか、買い物を続けてください。",
    },
    cancelled: {
      eyebrow: "支払いキャンセル",
      title: "チェックアウトがキャンセルされました",
      body: "バッグはそのままです。準備ができたら再開してください。課金はありません。",
    },
    pending: {
      eyebrow: "支払い確認中",
      title: "お支払いを確認しています",
      body: "一部の決済方法では少し時間がかかります。完了次第このページを更新します。",
    },
  },
  emptyTitle: "まず Builder から開いてください",
  emptyBody:
    "Drop-in Builder で外観と注文金額を設定し、「Open as storefront」をクリックしてください。戻っても Builder の設定は保持されます。",
  emptyCta: "Builder に戻る",
  loadingPayment: "支払い方法を読み込み中",
  showImage: (n) => `画像 ${n} を表示`,
  sessionFailed: "Evonet interaction API でのセッション作成に失敗しました。",
  sessionUnexpected: "予期しないセッションエラーが発生しました。",
  product: {
    name: "Founder ジップフーディー",
    description:
      "左胸のピンク Founder シールドとフードのゴシック「Anon Tokyo」入りヘビーウェイトジップフーディー。リラックスしたストリートシルエットとシルバー金具で、バンドウェアデモと Evonet チェックアウトに最適。",
    fabric: "ヘビーウェイトコットンフリース",
    fit: "リラックスユニセックスフィット",
    colors: { black: "ブラック", pink: "Anon ピンク", blue: "Tokyo ブルー" },
    highlights: [
      "HKD 500 以上送料無料",
      "30日間かんたん返品",
      "1〜2営業日で発送",
    ],
  },
};

const COPY_BY_LOCALE: Record<StorefrontLocale, StorefrontCopy> = {
  "en-US": EN,
  "zh-TW": ZH_TW,
  "zh-CN": ZH_CN,
  "ja-JP": JA,
};

export function normalizeStorefrontLocale(locale: string | undefined): StorefrontLocale {
  const raw = (locale ?? "en-US").trim();
  if (raw in COPY_BY_LOCALE) return raw as StorefrontLocale;
  const base = raw.split("-")[0]?.toLowerCase();
  if (base === "zh") {
    if (/tw|hk|hant/i.test(raw)) return "zh-TW";
    return "zh-CN";
  }
  if (base === "ja") return "ja-JP";
  return "en-US";
}

export function getStorefrontCopy(locale: string | undefined): StorefrontCopy {
  return COPY_BY_LOCALE[normalizeStorefrontLocale(locale)];
}

export function storefrontHtmlLang(locale: string | undefined): string {
  return normalizeStorefrontLocale(locale);
}
