export interface BinRule {
  /** First 6 digits of the card number to match */
  first6No: string;
  /** Promotion message shown on host page when this BIN matches and is allowed */
  message?: string;
  /** Default "allow". "block" → callbackVerification isValid: false */
  action?: "allow" | "block";
  /** Passed as callbackVerification.msg when blocked */
  rejectMessage?: string;
}

export type EvonetEnvironment =
  | "HKG_prod"
  | "HKG_test"
  | "UAT"
  | "TEST"
  | (string & {});

export type EvonetDropinMode = "embedded" | "fullPage" | "bottomUp";

/** Step 4 SDK `uiOption` (see Evonet SDK Parameter Reference). */
export interface EvonetSdkUiOption {
  showSaveImage?: boolean;
  card?: {
    showCardHolderName?: boolean;
    CVVForSavedCard?: boolean;
    showScanCardButton?: boolean;
    autoInvokeCardScanner?: boolean;
  };
  TnC?: {
    showTnC?: boolean;
    mode?: "checkbox" | "click2accept";
    url?: string;
  };
  /**
   * Checkout copy shown by Drop-in. Free-trial keys apply when
   * `transAmount.value` is `"0"` with Subscription; the rest apply to
   * one-off pay, save-card, and paid-subscription scenes.
   */
  customDescription?: {
    freeTrialDescription?: string;
    freeTrialBtnText?: string;
    payBtnText?: string;
    /** When true, Drop-in hides the amount on the pay CTA. Omitted/false keeps it. */
    hidePayAmount?: boolean;
    saveCardDescription?: string;
    subscribeBtnText?: string;
    /** When true, Drop-in hides the amount on the subscribe CTA. Omitted/false keeps it. */
    hideSubscribeAmount?: boolean;
    subscribeDescription?: string;
  };
  /**
   * Two-column web layout (method list + payment summary).
   * cil-dropin-components reads lowercase `columns` under uiOption
   * (docs examples sometimes show `Columns` — that key is ignored by the SDK).
   */
  columns?: boolean;
}

export interface EvonetSdkFontObject {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
}

  /** Layout / styling; hex strings per Evonet docs. */
export interface EvonetSdkAppearance {
  colorAction?: string;
  colorBackground?: string;
  colorBoxStroke?: string;
  colorDisabled?: string;
  colorError?: string;
  colorFormBackground?: string;
  colorFormBorder?: string;
  colorInverse?: string;
  colorBoxFillingOutline?: string;
  colorPlaceholder?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  logoPosition?: "left" | "middle" | "right";
  /**
   * Corner radii. Evonet Drop-in SDK requires CSS length strings
   * (e.g. `["10px","2px","50px","8px"]`), not bare numbers.
   */
  borderRadius?: string[];
  button?: EvonetSdkFontObject;
  heading?: EvonetSdkFontObject;
  subHeading?: EvonetSdkFontObject;
  label?: EvonetSdkFontObject;
  labelInfo?: EvonetSdkFontObject;
  inputField?: EvonetSdkFontObject;
  paragraph?: EvonetSdkFontObject;
  placeholder?: EvonetSdkFontObject;
  [key: string]: unknown;
}

export interface EvonetDropinConfig {
  type: "payment";
  sessionID: string;
  environment: EvonetEnvironment;
  mode: EvonetDropinMode;
  amount?: number;
  currency?: string;
  orderId?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingCountry?: string;
  billingCity?: string;
  billingPostalCode?: string;
  shippingCountry?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  /** BCP 47 locale sent to SDK `locale` (e.g. en-US, zh-TW). */
  language?: string;
  isVerifyPaymentBrand?: boolean;
  verifyOption?: {
    isVerifyPaymentBrand?: boolean;
    maxWaitTime?: string;
    [key: string]: unknown;
  };
  uiOption?: EvonetSdkUiOption;
  appearance?: EvonetSdkAppearance;
  /**
   * Convenience flag: host maps this to `uiOption.columns: true` for the SDK.
   * Prefer setting `uiOption.columns` directly when building SDK options.
   */
  Columns?: boolean;
  /** BIN conditions: checked in order against first6No (or dpanFirst6No). First match wins. action "block" rejects payment. */
  binRules?: BinRule[];
  [key: string]: unknown;
}

/** MIT / token checkout model for POST interaction (see Evonet Drop-in / LinkPay docs). */
export type EvonetRecurringProcessingModel =
  | "Subscription"
  | "Unscheduled";

export interface EvonetInteractionRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  environment: EvonetEnvironment;
  locale: string;
  /**
   * Optional runtime credential target override (UAT | PROD).
   * When omitted, derived from `environment` or NEXT_PUBLIC_EVONET_TARGET.
   */
  target?: "UAT" | "PROD" | string;
  /**
   * When true, interaction payload includes `allowAuthentication: true`.
   * When omitted/false, the field is not sent.
   */
  allowAuthentication?: boolean;
  /**
   * When true, interaction payload includes `userInfo.reference` and
   * `paymentMethod.recurringProcessingModel` so Drop-in can offer save-card / token flows.
   */
  saveCardForNextPurchase?: boolean;
  /** Required when `saveCardForNextPurchase` is true. Maps to `userInfo.reference`. */
  userInfoReference?: string;
  /** When false, skip sending `paymentMethod.recurringProcessingModel` in interaction payload. */
  includeRecurringProcessingModel?: boolean;
  /** Defaults to `Subscription` when save-card is enabled and this is omitted. */
  recurringProcessingModel?: EvonetRecurringProcessingModel;
  /**
   * Order/filter Drop-in payment methods via `merchantOrderInfo.enabledPaymentMethod`.
   * `*` = remaining methods in default order.
   */
  enabledPaymentMethod?: string[];
  /**
   * Absolute URL Evonet redirects to after wallet / Apple Pay / new-tab payments.
   * When omitted, server uses `EVONET_RETURN_URL`.
   */
  returnURL?: string;
}

export interface EvonetInteractionResponse {
  sessionID?: string;
  sessionId?: string;
  [key: string]: unknown;
}

/** MIT subsequent charge via POST /payment (token + Subscription). */
export interface EvonetTokenPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  token: string;
  environment?: EvonetEnvironment;
  target?: "UAT" | "PROD" | string;
  recurringProcessingModel?: EvonetRecurringProcessingModel;
  description?: string;
}

export interface EvonetTokenPaymentResponse {
  ok?: boolean;
  orderId?: string;
  resultCode?: string;
  resultMessage?: string;
  error?: string;
  raw?: unknown;
}

export interface EvonetDropinSdkOptions {
  id: string;
  type: "payment";
  sessionID: string;
  locale: string;
  mode: EvonetDropinMode;
  environment: EvonetEnvironment;
  isVerifyPaymentBrand?: boolean;
  verifyOption?: {
    isVerifyPaymentBrand?: boolean;
    maxWaitTime?: string;
    [key: string]: unknown;
  };
  uiOption?: EvonetSdkUiOption;
  appearance?: EvonetSdkAppearance;
  payment_method_select?: (event: unknown) => void;
  payment_method_selected?: (event: unknown) => void;
  payment_completed?: (event: unknown) => void;
  payment_failed?: (event: unknown) => void;
  payment_not_preformed?: (event: unknown) => void;
  payment_cancelled?: (event: unknown) => void;
  /** Fired when user taps Completed on the QR popup (does not mean paid). */
  order_created?: (event: unknown) => void;
  [key: string]: unknown;
}

export interface EvonetDropinInitOptions {
  containerId: string;
  config: EvonetDropinConfig;
  onEvent?: (event: EvonetDropinEvent) => void;
}

export type EvonetDropinEventType =
  | "payment_success"
  | "payment_fail"
  | "payment_pending"
  | "payment_cancelled"
  | "order_created"
  | "payment_method_selected"
  | "sdk_message"
  | "error"
  | (string & {});

export interface EvonetDropinEvent {
  type: EvonetDropinEventType;
  payload?: unknown;
}

export interface EvonetWindow extends Window {
  DropInSDK?: new (options: EvonetDropinSdkOptions) => unknown;
}

