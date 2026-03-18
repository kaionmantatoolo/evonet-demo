export type EvonetEnvironment =
  | "HKG_prod"
  | "HKG_test"
  | "UAT"
  | "TEST"
  | (string & {});

export type EvonetDropinMode = "embedded" | "fullPage";

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
  language?: string;
  isVerifyPaymentBrand?: boolean;
  /** When BIN verify approves: message template, {{paymentBrand}} or {{Card Issuer}} replaced with card brand */
  binApprovalMessage?: string;
  /** When BIN verify rejects: one of the predefined messages or custom string */
  binRejectMessage?: string;
  /** For testing: approve or reject the card on payment_method_selected */
  binVerifyAction?: "approve" | "reject";
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
    [key: string]: unknown;
  };
  appearance?: {
    colorBackground?: string;
    [key: string]: unknown;
  };
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

