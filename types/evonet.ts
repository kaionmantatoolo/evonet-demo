export interface BinRule {
  /** First 6 digits of the card number to match */
  first6No: string;
  /** Promotion message shown on host page when this BIN matches */
  message?: string;
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
  /** Two-column layout (per SDK examples). */
  Columns?: boolean;
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
  /** Corner radii [r1, r2, r3, r4]. */
  borderRadius?: number[];
  Columns?: boolean;
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
  /** BIN conditions: checked in order against first6No. First match wins. */
  binRules?: BinRule[];
  [key: string]: unknown;
}

export interface EvonetInteractionRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  environment: EvonetEnvironment;
  locale: string;
}

export interface EvonetInteractionResponse {
  sessionID?: string;
  sessionId?: string;
  [key: string]: unknown;
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

