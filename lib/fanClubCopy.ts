import { normalizeStorefrontLocale } from "./storefrontCopy";
import type { StorefrontLocale } from "./storefrontCopy";

export interface FanClubPlan {
  id: string;
  brand: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  intervalLabel: string;
  benefits: string[];
  billingNote: string;
}

export interface FanClubCopy {
  navTagline: string;
  backToBuilder: string;
  builderShort: string;
  myMembership: string;
  joinCta: (currency: string, price: string) => string;
  joinShort: (currency: string, price: string) => string;
  perMonth: string;
  benefitsTitle: string;
  lookbookTitle: string;
  billingConsent: string;
  secureCheckout: string;
  poweredByEvonet: string;
  closeCheckout: string;
  checkoutTitle: string;
  checkoutEmpty: string;
  loadingPayment: string;
  sessionFailed: string;
  sessionUnexpected: string;
  membershipTitle: string;
  statusActive: string;
  statusCancelled: string;
  planLabel: string;
  nextBill: string;
  tokenLabel: string;
  recurringRefLabel: string;
  recurringModelLabel: string;
  chargeHistory: string;
  billNow: string;
  billing: string;
  cancelMembership: string;
  cancelledNote: string;
  noTokenHint: string;
  billSuccess: string;
  billFailed: string;
  tokenPending: string;
  tokenMissing: string;
  rejoinedHint: string;
  emptyChargeHistory: string;
  continueBrowsing: string;
  viewMembership: string;
  footerMeta: string;
  status: {
    success: { eyebrow: string; title: string; body: string };
    failed: { eyebrow: string; title: string; body: string };
    cancelled: { eyebrow: string; title: string; body: string };
    pending: { eyebrow: string; title: string; body: string };
  };
  plan: {
    name: string;
    tagline: string;
    description: string;
    intervalLabel: string;
    benefits: [string, string, string, string];
    billingNote: string;
  };
}

const EN: FanClubCopy = {
  navTagline: "Monthly membership",
  backToBuilder: "Back to Builder",
  builderShort: "Builder",
  myMembership: "My membership",
  joinCta: (currency, price) => `Join Fan Club — ${currency} ${price}/mo`,
  joinShort: (currency, price) => `Join · ${currency} ${price}/mo`,
  perMonth: "/ month",
  benefitsTitle: "Member benefits",
  lookbookTitle: "Shop the collection",
  billingConsent:
    "By joining you authorize a recurring monthly charge at the plan price. Cancel anytime from My membership — no further Bill now charges after cancel.",
  secureCheckout: "Secure membership checkout",
  poweredByEvonet: "Powered by Evonet Drop-in · Subscription",
  closeCheckout: "Close checkout",
  checkoutTitle: "Join Fan Club",
  checkoutEmpty: "Start membership checkout to load Drop-in here.",
  loadingPayment: "Loading payment methods",
  sessionFailed: "Failed to create session via Evonet interaction API.",
  sessionUnexpected: "Unexpected session error.",
  membershipTitle: "Your Fan Club membership",
  statusActive: "Active",
  statusCancelled: "Cancelled",
  planLabel: "Plan",
  nextBill: "Next bill",
  tokenLabel: "Saved token",
  recurringRefLabel: "recurringReference",
  recurringModelLabel: "Recurring model",
  chargeHistory: "Charge history",
  billNow: "Bill now",
  billing: "Billing…",
  cancelMembership: "Cancel membership",
  cancelledNote:
    "Membership cancelled. Saved token cleared locally — Bill now is disabled.",
  noTokenHint: "No token on file. Complete a successful join payment first.",
  billSuccess: "Renewal charge succeeded.",
  billFailed: "Renewal charge failed.",
  tokenPending: "Confirming saved card token…",
  tokenMissing:
    "Payment succeeded but no token was returned yet. Try refreshing membership, or check Evonet webhook / interaction query.",
  rejoinedHint: "You already have a membership record — open My membership.",
  emptyChargeHistory: "No charges yet.",
  continueBrowsing: "Back to Fan Club",
  viewMembership: "View membership",
  footerMeta: "Demo Fan Club · Theme from Builder",
  status: {
    success: {
      eyebrow: "Welcome aboard",
      title: "You’re in the Fan Club",
      body: "Your card is saved for monthly renewals. Open My membership to Bill now or cancel.",
    },
    failed: {
      eyebrow: "Payment unsuccessful",
      title: "We couldn’t complete membership checkout",
      body: "Nothing was charged. You can try joining again.",
    },
    cancelled: {
      eyebrow: "Checkout cancelled",
      title: "Membership checkout was cancelled",
      body: "No charge was made. Join again when you’re ready.",
    },
    pending: {
      eyebrow: "Payment pending",
      title: "We’re confirming your payment",
      body: "Hang tight — we’ll update this page when membership is ready.",
    },
  },
  plan: {
    name: "Monthly Fan Club",
    tagline: "ANON TOKYO members · early drops & studio access",
    description:
      "A recurring membership demo for Evonet Subscription: first payment saves your card (CIT), then Bill now runs merchant-initiated renewals with the stored token.",
    intervalLabel: "Billed monthly",
    benefits: [
      "Early access to ANON TOKYO drops",
      "Member-only studio notes & fits",
      "Cancel anytime from My membership",
      "Demo Bill now for MIT renewals",
    ],
    billingNote: "Monthly recurring · cancel anytime",
  },
};

const ZH_TW: FanClubCopy = {
  ...EN,
  navTagline: "月費會員",
  backToBuilder: "返回 Builder",
  myMembership: "我的會員",
  joinCta: (currency, price) => `加入 Fan Club — ${currency} ${price}/月`,
  joinShort: (currency, price) => `加入 · ${currency} ${price}/月`,
  perMonth: "/ 月",
  benefitsTitle: "會員權益",
  lookbookTitle: "本季商品",
  billingConsent:
    "加入即表示你同意依方案金額每月定期扣款。可隨時在「我的會員」取消——取消後無法再使用 Bill now。",
  secureCheckout: "安全會員結帳",
  poweredByEvonet: "由 Evonet Drop-in 提供 · Subscription",
  closeCheckout: "關閉結帳",
  checkoutTitle: "加入 Fan Club",
  checkoutEmpty: "開始會員結帳以載入 Drop-in。",
  loadingPayment: "正在載入付款方式",
  sessionFailed: "無法透過 Evonet interaction API 建立工作階段。",
  sessionUnexpected: "未預期的工作階段錯誤。",
  membershipTitle: "你的 Fan Club 會員",
  statusActive: "生效中",
  statusCancelled: "已取消",
  planLabel: "方案",
  nextBill: "下次扣款",
  tokenLabel: "已存 token",
  chargeHistory: "扣款紀錄",
  billNow: "立即扣款",
  billing: "扣款中…",
  cancelMembership: "取消會員",
  cancelledNote: "會員已取消。本地已清除 token，Bill now 已停用。",
  noTokenHint: "尚無 token。請先完成成功的入會付款。",
  billSuccess: "續扣成功。",
  billFailed: "續扣失敗。",
  tokenPending: "正在確認已存卡 token…",
  tokenMissing:
    "付款成功但尚未取得 token。請稍後重新整理會員，或檢查 webhook / interaction 查詢。",
  rejoinedHint: "你已有會員紀錄——請開啟「我的會員」。",
  emptyChargeHistory: "尚無扣款紀錄。",
  continueBrowsing: "返回 Fan Club",
  viewMembership: "查看會員",
  footerMeta: "示範 Fan Club · 主題來自 Builder",
  status: {
    success: {
      eyebrow: "歡迎加入",
      title: "你已加入 Fan Club",
      body: "卡片已存檔供每月續扣。開啟「我的會員」可 Bill now 或取消。",
    },
    failed: {
      eyebrow: "付款失敗",
      title: "無法完成會員結帳",
      body: "未扣款。你可以再試一次加入。",
    },
    cancelled: {
      eyebrow: "已取消結帳",
      title: "會員結帳已取消",
      body: "未扣款。準備好時可再次加入。",
    },
    pending: {
      eyebrow: "付款處理中",
      title: "正在確認付款",
      body: "請稍候——會員就緒後會更新此頁。",
    },
  },
  plan: {
    name: "Fan Club 月費",
    tagline: "ANON TOKYO 會員 · 搶先與工作室情報",
    description:
      "Evonet Subscription 循環付款示範：首次付款存卡（CIT），之後以 Bill now 用 token 發起商戶端續扣（MIT）。",
    intervalLabel: "按月計費",
    benefits: [
      "搶先取得 ANON TOKYO 新品",
      "會員限定工作室筆記與版型",
      "可隨時在「我的會員」取消",
      "Bill now 示範 MIT 續扣",
    ],
    billingNote: "每月循環 · 可隨時取消",
  },
};

const ZH_CN: FanClubCopy = {
  ...EN,
  navTagline: "月费会员",
  backToBuilder: "返回 Builder",
  myMembership: "我的会员",
  joinCta: (currency, price) => `加入 Fan Club — ${currency} ${price}/月`,
  joinShort: (currency, price) => `加入 · ${currency} ${price}/月`,
  perMonth: "/ 月",
  benefitsTitle: "会员权益",
  lookbookTitle: "本季商品",
  billingConsent:
    "加入即表示你同意按方案金额每月定期扣款。可随时在「我的会员」取消——取消后无法再使用 Bill now。",
  secureCheckout: "安全会员结账",
  poweredByEvonet: "由 Evonet Drop-in 提供 · Subscription",
  closeCheckout: "关闭结账",
  checkoutTitle: "加入 Fan Club",
  checkoutEmpty: "开始会员结账以加载 Drop-in。",
  loadingPayment: "正在加载支付方式",
  sessionFailed: "无法通过 Evonet interaction API 创建会话。",
  sessionUnexpected: "意外的会话错误。",
  membershipTitle: "你的 Fan Club 会员",
  statusActive: "生效中",
  statusCancelled: "已取消",
  planLabel: "方案",
  nextBill: "下次扣款",
  tokenLabel: "已存 token",
  chargeHistory: "扣款记录",
  billNow: "立即扣款",
  billing: "扣款中…",
  cancelMembership: "取消会员",
  cancelledNote: "会员已取消。本地已清除 token，Bill now 已停用。",
  noTokenHint: "尚无 token。请先完成成功的入会付款。",
  billSuccess: "续扣成功。",
  billFailed: "续扣失败。",
  tokenPending: "正在确认已存卡 token…",
  tokenMissing:
    "付款成功但尚未取得 token。请稍后刷新会员，或检查 webhook / interaction 查询。",
  rejoinedHint: "你已有会员记录——请打开「我的会员」。",
  emptyChargeHistory: "尚无扣款记录。",
  continueBrowsing: "返回 Fan Club",
  viewMembership: "查看会员",
  footerMeta: "示范 Fan Club · 主题来自 Builder",
  status: {
    success: {
      eyebrow: "欢迎加入",
      title: "你已加入 Fan Club",
      body: "卡片已存档供每月续扣。打开「我的会员」可 Bill now 或取消。",
    },
    failed: {
      eyebrow: "付款失败",
      title: "无法完成会员结账",
      body: "未扣款。你可以再试一次加入。",
    },
    cancelled: {
      eyebrow: "已取消结账",
      title: "会员结账已取消",
      body: "未扣款。准备好时可再次加入。",
    },
    pending: {
      eyebrow: "付款处理中",
      title: "正在确认付款",
      body: "请稍候——会员就绪后会更新此页。",
    },
  },
  plan: {
    name: "Fan Club 月费",
    tagline: "ANON TOKYO 会员 · 抢先与工作室情报",
    description:
      "Evonet Subscription 循环付款示范：首次付款存卡（CIT），之后以 Bill now 用 token 发起商户端续扣（MIT）。",
    intervalLabel: "按月计费",
    benefits: [
      "抢先获取 ANON TOKYO 新品",
      "会员限定工作室笔记与版型",
      "可随时在「我的会员」取消",
      "Bill now 示范 MIT 续扣",
    ],
    billingNote: "每月循环 · 可随时取消",
  },
};

const JA: FanClubCopy = {
  ...EN,
  navTagline: "月額メンバーシップ",
  backToBuilder: "Builder に戻る",
  myMembership: "マイメンバーシップ",
  joinCta: (currency, price) => `Fan Club に加入 — ${currency} ${price}/月`,
  joinShort: (currency, price) => `加入 · ${currency} ${price}/月`,
  perMonth: "/ 月",
  benefitsTitle: "メンバー特典",
  lookbookTitle: "コレクション",
  billingConsent:
    "加入により、プラン金額の毎月の継続課金に同意します。「マイメンバーシップ」からいつでも解約でき、解約後は Bill now を使えません。",
  secureCheckout: "セキュアな会員チェックアウト",
  poweredByEvonet: "Powered by Evonet Drop-in · Subscription",
  closeCheckout: "チェックアウトを閉じる",
  checkoutTitle: "Fan Club に加入",
  checkoutEmpty: "会員チェックアウトを開始して Drop-in を読み込みます。",
  loadingPayment: "支払い方法を読み込み中",
  sessionFailed: "Evonet interaction API でセッションを作成できませんでした。",
  sessionUnexpected: "予期しないセッションエラーです。",
  membershipTitle: "Fan Club メンバーシップ",
  statusActive: "有効",
  statusCancelled: "解約済み",
  planLabel: "プラン",
  nextBill: "次回請求",
  tokenLabel: "保存済みトークン",
  chargeHistory: "課金履歴",
  billNow: "今すぐ請求",
  billing: "請求中…",
  cancelMembership: "メンバーシップを解約",
  cancelledNote:
    "解約しました。ローカルのトークンを削除し、Bill now は無効です。",
  noTokenHint: "トークンがありません。先に入会決済を完了してください。",
  billSuccess: "更新課金に成功しました。",
  billFailed: "更新課金に失敗しました。",
  tokenPending: "保存カードのトークンを確認中…",
  tokenMissing:
    "決済は成功しましたがトークンが未取得です。メンバーシップを更新するか、webhook / interaction 照会を確認してください。",
  rejoinedHint: "既存のメンバーシップがあります — マイメンバーシップを開いてください。",
  emptyChargeHistory: "課金履歴はまだありません。",
  continueBrowsing: "Fan Club に戻る",
  viewMembership: "メンバーシップを見る",
  footerMeta: "デモ Fan Club · テーマは Builder から",
  status: {
    success: {
      eyebrow: "ようこそ",
      title: "Fan Club に加入しました",
      body: "カードを保存し月次更新に備えます。マイメンバーシップから Bill now または解約できます。",
    },
    failed: {
      eyebrow: "決済失敗",
      title: "会員チェックアウトを完了できませんでした",
      body: "課金は行われていません。もう一度お試しください。",
    },
    cancelled: {
      eyebrow: "チェックアウト取消",
      title: "会員チェックアウトは取り消されました",
      body: "課金は行われていません。準備ができたら再度加入できます。",
    },
    pending: {
      eyebrow: "決済保留",
      title: "決済を確認しています",
      body: "メンバーシップ準備ができ次第、このページを更新します。",
    },
  },
  plan: {
    name: "月額 Fan Club",
    tagline: "ANON TOKYO メンバー · 先行ドロップとスタジオ情報",
    description:
      "Evonet Subscription のデモ：初回決済でカード保存（CIT）、その後 Bill now でトークンによる加盟店起点の更新課金（MIT）。",
    intervalLabel: "毎月請求",
    benefits: [
      "ANON TOKYO ドロップへの先行アクセス",
      "メンバー限定のスタジオノート",
      "マイメンバーシップからいつでも解約",
      "Bill now で MIT 更新をデモ",
    ],
    billingNote: "毎月継続 · いつでも解約可",
  },
};

const KO: FanClubCopy = {
  ...EN,
  navTagline: "월간 멤버십",
  backToBuilder: "Builder로 돌아가기",
  myMembership: "내 멤버십",
  joinCta: (currency, price) => `Fan Club 가입 — ${currency} ${price}/월`,
  joinShort: (currency, price) => `가입 · ${currency} ${price}/월`,
  perMonth: "/ 월",
  benefitsTitle: "멤버 혜택",
  lookbookTitle: "컬렉션",
  billingConsent:
    "가입 시 플랜 금액의 월간 정기 결제에 동의합니다. 「내 멤버십」에서 언제든 해지할 수 있으며, 해지 후에는 Bill now를 사용할 수 없습니다.",
  secureCheckout: "안전한 멤버십 결제",
  poweredByEvonet: "Powered by Evonet Drop-in · Subscription",
  closeCheckout: "결제 닫기",
  checkoutTitle: "Fan Club 가입",
  checkoutEmpty: "멤버십 결제를 시작해 Drop-in을 불러오세요.",
  loadingPayment: "결제 수단 불러오는 중",
  sessionFailed: "Evonet interaction API로 세션 생성에 실패했습니다.",
  sessionUnexpected: "예기치 않은 세션 오류가 발생했습니다.",
  membershipTitle: "Fan Club 멤버십",
  statusActive: "활성",
  statusCancelled: "해지됨",
  planLabel: "플랜",
  nextBill: "다음 결제",
  tokenLabel: "저장된 토큰",
  chargeHistory: "결제 내역",
  billNow: "지금 청구",
  billing: "청구 중…",
  cancelMembership: "멤버십 해지",
  cancelledNote:
    "멤버십이 해지되었습니다. 로컬 토큰이 삭제되어 Bill now가 비활성화됩니다.",
  noTokenHint: "토큰이 없습니다. 먼저 가입 결제를 완료하세요.",
  billSuccess: "갱신 청구에 성공했습니다.",
  billFailed: "갱신 청구에 실패했습니다.",
  tokenPending: "저장된 카드 토큰 확인 중…",
  tokenMissing:
    "결제는 성공했지만 토큰을 아직 받지 못했습니다. 멤버십을 새로고침하거나 webhook / interaction 조회를 확인하세요.",
  rejoinedHint: "이미 멤버십 기록이 있습니다 — 내 멤버십을 여세요.",
  emptyChargeHistory: "결제 내역이 아직 없습니다.",
  continueBrowsing: "Fan Club으로 돌아가기",
  viewMembership: "멤버십 보기",
  footerMeta: "데모 Fan Club · 테마는 Builder에서",
  status: {
    success: {
      eyebrow: "환영합니다",
      title: "Fan Club에 가입했습니다",
      body: "카드가 저장되어 월간 갱신에 사용됩니다. 내 멤버십에서 Bill now 또는 해지할 수 있습니다.",
    },
    failed: {
      eyebrow: "결제 실패",
      title: "멤버십 결제를 완료할 수 없습니다",
      body: "청구되지 않았습니다. 다시 가입을 시도할 수 있습니다.",
    },
    cancelled: {
      eyebrow: "결제 취소",
      title: "멤버십 결제가 취소되었습니다",
      body: "청구되지 않았습니다. 준비가 되면 다시 가입하세요.",
    },
    pending: {
      eyebrow: "결제 대기",
      title: "결제를 확인하는 중",
      body: "멤버십이 준비되면 이 페이지가 업데이트됩니다.",
    },
  },
  plan: {
    name: "월간 Fan Club",
    tagline: "ANON TOKYO 멤버 · 조기 드롭과 스튜디오 정보",
    description:
      "Evonet Subscription 데모: 첫 결제로 카드 저장(CIT), 이후 Bill now로 토큰 기반 가맹점 개시 갱신(MIT).",
    intervalLabel: "매월 청구",
    benefits: [
      "ANON TOKYO 드롭 조기 액세스",
      "멤버 전용 스튜디오 노트",
      "내 멤버십에서 언제든 해지",
      "Bill now로 MIT 갱신 데모",
    ],
    billingNote: "매월 정기 · 언제든 해지",
  },
};

const COPY_BY_LOCALE: Record<StorefrontLocale, FanClubCopy> = {
  "en-US": EN,
  "zh-TW": ZH_TW,
  "zh-CN": ZH_CN,
  "ja-JP": JA,
  "ko-KR": KO,
};

export function getFanClubCopy(locale: string | undefined): FanClubCopy {
  return COPY_BY_LOCALE[normalizeStorefrontLocale(locale)];
}

export function getLocalizedFanClubPlan(
  locale: string | undefined,
  unitPrice: number
): FanClubPlan {
  const copy = getFanClubCopy(locale);
  return {
    id: "anon-fan-club-monthly",
    brand: "ANON TOKYO",
    name: copy.plan.name,
    tagline: copy.plan.tagline,
    description: copy.plan.description,
    price: unitPrice,
    intervalLabel: copy.plan.intervalLabel,
    benefits: [...copy.plan.benefits],
    billingNote: copy.plan.billingNote,
  };
}
