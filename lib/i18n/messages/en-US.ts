export interface SiteMessages {
  common: {
    language: string;
    theme: string;
    light: string;
    dark: string;
    copy: string;
    import: string;
    paste: string;
    apply: string;
    cancel: string;
    reset: string;
    jsonCopied: string;
    copyFailed: string;
    imported: string;
    pasted: string;
    pasteFailed: string;
    prodDemoWarningTitle: string;
    prodDemoWarningBody: string;
    prodDemoWarningNoRefund: string;
    prodDemoWarningSuffix: string;
  };
  home: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    choosePath: string;
    guidedTitle: string;
    guidedBody: string;
    openBuilder: string;
    validationTitle: string;
    validationBody: string;
    openWorkspace: string;
    footerTitle: string;
    footerBody: string;
    footerNote: string;
  };
  builder: {
    title: string;
    description: string;
    openAsStorefront: string;
    jumpToPreview: string;
    tabOrderInfo: string;
    tabPaymentUi: string;
    tabVisualStyling: string;
    orderInfo: string;
    paymentUi: string;
    amount: string;
    currency: string;
    locale: string;
    localeHint: string;
    mode: string;
    modeEmbedded: string;
    modeFullPage: string;
    modeBottomUp: string;
    descriptionLabel: string;
    currentSessionId: string;
    sessionSpentHint: string;
    allowAuthentication: string;
    allowAuthenticationHint: string;
    binVerificationAccordion: string;
    verifyPaymentBrand: string;
    verifyPaymentBrandHint: string;
    maxWaitTime: string;
    maxWaitTimeHint: string;
    binRulesHint: string;
    binRulesEmpty: string;
    binRuleLabel: (index: number) => string;
    binRuleBlocking: string;
    binRuleAllowing: string;
    binRuleIncomplete: string;
    removeBinRule: string;
    cardBin: string;
    cardBinIncompleteHint: string;
    binAction: string;
    binActionAllow: string;
    binActionBlock: string;
    promoMessage: string;
    rejectMessage: string;
    rejectMessagePlaceholder: string;
    addBinRule: string;
    saveCardAccordion: string;
    allowSaveCard: string;
    allowSaveCardHint: string;
    userReference: string;
    userReferenceHint: string;
    includeRecurringModel: string;
    recurringModelPlaceholder: string;
    recurringSubscription: string;
    recurringUnscheduled: string;
    freeTrial: string;
    freeTrialHint: string;
    freeTrialDescription: string;
    freeTrialBtnText: string;
    customPaymentCopyAccordion: string;
    payBtnText: string;
    payBtnTextHint: string;
    payBtnTextPlaceholder: string;
    payAmount: string;
    payAmountHint: string;
    amountDisplayDefault: string;
    amountDisplayShow: string;
    amountDisplayHide: string;
    saveCardDescription: string;
    saveCardDescriptionHint: string;
    saveCardDescriptionPlaceholder: string;
    saveCardCheckboxHiddenHint: string;
    paidSubscriptionCopy: string;
    subscribeBtnText: string;
    subscribeBtnTextHint: string;
    subscribeAmount: string;
    subscribeAmountHint: string;
    subscribeDescription: string;
    subscribeDescriptionHint: string;
    refreshSessionId: string;
    refreshSessionIdRequired: string;
    creatingSession: string;
    orderPaymentMethods: string;
    orderPaymentMethodsHint: string;
    showSaveImage: string;
    showSaveImageHint: string;
    columnsLayout: string;
    columnsLayoutHint: string;
    showCardHolderName: string;
    cvvForSavedCard: string;
    cardScannerTnc: string;
    showScanCardButton: string;
    autoInvokeCardScanner: string;
    showTermsAndConditions: string;
    tncMode: string;
    tncUrl: string;
    tncUrlHint: string;
    tncUrlInvalid: string;
    dropinPreview: string;
    autoRefresh: string;
    openStorefrontCta: string;
    openStorefrontHint: string;
    sessionSpentWarning: string;
    initializeReinit: string;
    refreshSessionAndReinit: string;
    previewDisabled: string;
    highlightUiControls: string;
    uiConfigTitle: string;
    uiConfigSubtitle: string;
    sdkRuntimeJson: string;
    importPanelHint: string;
    logoPosition: string;
    logoPositionHint: string;
    logoPositionLeft: string;
    logoPositionMiddle: string;
    logoPositionRight: string;
    modeLabelEmbedded: string;
    modeLabelFullPage: string;
    modeLabelBottomUp: string;
    sdkModeTitle: (mode: string) => string;
    sdkModeBody: (mode: string) => string;
    refreshSessionAndOpenPreview: string;
    initializeAndOpenPreview: string;
    openPreview: string;
    colors: string;
    radius: string;
    typography: string;
    moreTypographyFields: string;
    sharedFontFamilyCaption: string;
    brand: string;
    text: string;
    border: string;
    borderRadius: string;
  };
  pciSniff: {
    title: string;
    badge: string;
    subtitle: string;
    howToDemo: string;
    step1: string;
    step2: string;
    step3: string;
    creditOrDebitCard: string;
    newSession: string;
    loading: string;
    preparing: string;
    dropinReady: string;
    sessionFailed: string;
    cardFormOpen: string;
    merchantCheckout: string;
    waitingSession: string;
    loadingDropin: string;
    footer: string;
    builderLink: string;
    testCardsLink: string;
    envChipTitle: string;
    envChipAria: (target: string) => string;
    switchedTo: (target: string) => string;
    snifferTitle: string;
    snifferListening: string;
    snifferExposed: string;
    snifferHint: string;
    snifferWaiting: string;
    snifferFail: string;
    fieldPan: string;
    fieldExpiry: string;
    fieldCvv: string;
    readable: string;
    notSet: string;
    panEmptyHint: string;
    expiryEmptyHint: string;
    cvvEmptyHint: string;
    cvvPresentHint: string;
    architecture: string;
    architectureFail: string;
    architectureWait: string;
    hostedIframes: string;
    merchantSnippet: string;
    demoCardsPrefix: string;
    copied: string;
  };
}

export const EN_US: SiteMessages = {
  common: {
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    copy: "Copy",
    import: "Import",
    paste: "Paste",
    apply: "Apply",
    cancel: "Cancel",
    reset: "Reset",
    jsonCopied: "JSON copied",
    copyFailed: "Copy failed",
    imported: "Imported",
    pasted: "Pasted",
    pasteFailed: "Paste failed",
    prodDemoWarningTitle: "Demo only — do not complete real payments.",
    prodDemoWarningBody:
      "This site uses live production credentials for integration testing. Any payment you complete is a real charge and",
    prodDemoWarningNoRefund: "cannot be refunded",
    prodDemoWarningSuffix: " through this demo.",
  },
  home: {
    titleLine1: "Checkout,",
    titleLine2: "designed to feel effortless.",
    subtitle:
      "A client showcase for Drop-in. Shape the look, preview the journey, and share a clear checkout experience before go-live.",
    step1Title: "Set the experience",
    step1Body: "Pick style and interaction options, then preview instantly.",
    step2Title: "Walk the journey",
    step2Body: "See payment selection through completion in a real browser.",
    step3Title: "Align to launch",
    step3Body: "Give product and engineering one shared checkout reference.",
    choosePath: "Choose a path",
    guidedTitle: "Guided experience",
    guidedBody:
      "See how Drop-in can fit your brand. Adjust look and payment options, preview live, and open a storefront-style checkout—a simple way to explore customization.",
    openBuilder: "Open Builder",
    validationTitle: "Validation workspace",
    validationBody:
      "For your developers integrating Drop-in. Inspect SDK options, watch live events, and review payment outcomes to understand how Drop-in behaves end to end.",
    openWorkspace: "Open workspace",
    footerTitle: "Evonet Drop-in Demo",
    footerBody:
      "Explore brand customization in Builder, or review Drop-in behavior in the workspace—so your team can evaluate checkout before go-live.",
    footerNote: "Demo environment · Not a live merchant checkout",
  },
  builder: {
    title: "Drop-in Builder",
    description:
      "Customize Drop-in for your brand. Adjust options, preview live, and copy UI config JSON in one click.",
    openAsStorefront: "Open as storefront",
    jumpToPreview: "Jump to preview",
    tabOrderInfo: "Order Info",
    tabPaymentUi: "Payment UI",
    tabVisualStyling: "Visual Styling",
    orderInfo: "Order Info",
    paymentUi: "Payment UI",
    amount: "Amount",
    currency: "Currency",
    locale: "Drop-in locale",
    localeHint:
      "Language for Drop-in SDK, session, and storefront preview. Site chrome language is separate (header switcher).",
    mode: "Mode",
    modeEmbedded: "Embedded in the Builder preview card and storefront checkout drawer.",
    modeFullPage:
      "Real SDK fullPage — Builder preview + storefront checkout use a full-viewport stage.",
    modeBottomUp:
      "Real SDK bottomUp — Builder preview + storefront checkout use a full-viewport stage.",
    descriptionLabel: "Description",
    currentSessionId: "Current Session ID:",
    sessionSpentHint: "Spent after the last payment result — refresh before Re-init.",
    allowAuthentication: "Allow authentication",
    allowAuthenticationHint:
      "When enabled, sends allowAuthentication=true on session create. Off by default (field omitted). Refresh the session after changing this.",
    binVerificationAccordion: "BIN verification",
    verifyPaymentBrand: "Enable BIN check",
    verifyPaymentBrandHint:
      "Match the first 6 digits of the card (or Apple Pay dpan). Rules can show a promo or block payment; unmatched BINs are allowed.",
    maxWaitTime: "Max wait time (seconds)",
    maxWaitTimeHint:
      "Default: 10. Apple Pay must receive the verification callback before this timeout.",
    binRulesHint:
      "Rules are checked in order. Allow shows a promo message; Block rejects the card. BIN must be exactly 6 digits.",
    binRulesEmpty: "No BIN rules yet. Every card is allowed until you add one.",
    binRuleLabel: (index) => `Rule ${index}`,
    binRuleBlocking: "Blocking",
    binRuleAllowing: "Allowing",
    binRuleIncomplete: "Incomplete",
    removeBinRule: "Remove",
    cardBin: "Card BIN (6 digits)",
    cardBinIncompleteHint: "Enter 6 digits — this rule is ignored until then.",
    binAction: "Action",
    binActionAllow: "Allow (promo)",
    binActionBlock: "Block",
    promoMessage: "Promotion message",
    rejectMessage: "Reject message",
    rejectMessagePlaceholder: "Card not accepted",
    addBinRule: "+ Add BIN rule",
    saveCardAccordion: "Save card for next purchase",
    allowSaveCard: "Allow save card for next purchase",
    allowSaveCardHint:
      "Sends userInfo.reference and paymentMethod.recurringProcessingModel. With Subscription, Open as storefront launches the Fan Club membership demo. Refresh the session after changing this.",
    userReference: "User reference (userInfo.reference)",
    userReferenceHint: "Stable shopper ID used to associate stored tokens.",
    includeRecurringModel: "Include recurring processing model",
    recurringModelPlaceholder: "Recurring model",
    recurringSubscription: "Subscription",
    recurringUnscheduled: "Unscheduled (auto-debit)",
    freeTrial: "Free trial (0 subscription)",
    freeTrialHint:
      "Sets amount to 0, requires save-card + Subscription, and sends uiOption.customDescription for Drop-in free-trial copy.",
    freeTrialDescription: "Free trial description",
    freeTrialBtnText: "Free trial button text",
    customPaymentCopyAccordion: "Custom payment copy",
    payBtnText: "Pay button text",
    payBtnTextHint:
      "Leave empty to keep the SDK default. Sent as uiOption.customDescription.payBtnText.",
    payBtnTextPlaceholder: "Pay",
    payAmount: "Pay button amount",
    payAmountHint:
      "uiOption.customDescription.hidePayAmount. SDK default omits the field (amount shown). Hide sends true.",
    amountDisplayDefault: "SDK default",
    amountDisplayShow: "Show amount",
    amountDisplayHide: "Hide amount",
    saveCardDescription: "Save-card checkbox text",
    saveCardDescriptionHint:
      "Shown on the Credit or Debit Card form when save-card is on and recurring model is off. uiOption.customDescription.saveCardDescription.",
    saveCardDescriptionPlaceholder: "Save this card for next purchase",
    saveCardCheckboxHiddenHint:
      "Drop-in does not show a save-card checkbox while Subscription / Unscheduled is on. Open Credit or Debit Card to see subscription copy instead. Turn off “Include recurring processing model” — the session refreshes automatically and the checkbox appears on the card form.",
    paidSubscriptionCopy: "Paid subscription copy",
    subscribeBtnText: "Subscribe button text",
    subscribeBtnTextHint:
      "uiOption.customDescription.subscribeBtnText — CTA for a non-zero pay-and-subscribe checkout.",
    subscribeAmount: "Subscribe button amount",
    subscribeAmountHint:
      "uiOption.customDescription.hideSubscribeAmount. SDK default omits the field (amount shown). Hide sends true.",
    subscribeDescription: "Subscribe description",
    subscribeDescriptionHint:
      "uiOption.customDescription.subscribeDescription — body copy for a non-zero pay-and-subscribe checkout.",
    refreshSessionId: "Refresh Session ID",
    refreshSessionIdRequired: "Refresh Session ID (required)",
    creatingSession: "Creating Session...",
    orderPaymentMethods: "Order Payment Methods",
    orderPaymentMethodsHint:
      "Order of payment methods in Drop-in (enabledPaymentMethod). Use * for remaining methods. Refresh session after changing.",
    showSaveImage: "Show Save Image",
    showSaveImageHint: "Allow saving QR code to device (not card storage).",
    columnsLayout: "Columns Layout",
    columnsLayoutHint:
      "Sent as uiOption.columns (lowercase). Web + wide viewport; method list + Payment Summary side by side.",
    showCardHolderName: "Show Card Holder Name",
    cvvForSavedCard: "CVV For Saved Card",
    cardScannerTnc: "Card scanner & TnC",
    showScanCardButton: "Show Scan Card Button",
    autoInvokeCardScanner: "Auto Invoke Card Scanner",
    showTermsAndConditions: "Show Terms and Conditions",
    tncMode: "TnC Mode",
    tncUrl: "TnC URL",
    tncUrlHint:
      "Required when TnC is enabled. Use a full page URL; https:// is added automatically if omitted.",
    tncUrlInvalid: "Enter a valid http(s) URL.",
    dropinPreview: "Drop-in Preview",
    autoRefresh: "Auto refresh",
    openStorefrontCta: "Open as storefront",
    openStorefrontHint:
      "Apparel shop by default. Enable Save card + Subscription to open the ANON TOKYO Fan Club membership demo instead.",
    sessionSpentWarning:
      "This session was already used for a payment. Re-init alone will fail — refresh the session first (button below does both).",
    initializeReinit: "Initialize / Re-init",
    refreshSessionAndReinit: "Refresh & Re-init",
    previewDisabled: "Preview is disabled because sessionID is missing or placeholder.",
    highlightUiControls: "Highlight controls",
    uiConfigTitle: "UI Config JSON (UI Options + Appearance only)",
    uiConfigSubtitle: "UI options + appearance JSON",
    sdkRuntimeJson: "SDK runtime payload JSON",
    importPanelHint:
      "Paste a saved UI Config JSON (uiOption + appearance) to restore those controls. Order Info is not changed.",
    logoPosition: "Logo Position",
    logoPositionHint: "Horizontal alignment of payment method logos in each row",
    logoPositionLeft: "left (default)",
    logoPositionMiddle: "middle",
    logoPositionRight: "right",
    modeLabelEmbedded: "Embedded",
    modeLabelFullPage: "Full page",
    modeLabelBottomUp: "Bottom sheet",
    sdkModeTitle: (mode) => `SDK ${mode} mode`,
    sdkModeBody: (mode) =>
      `Drop-in runs with real SDK ${mode} in a full-viewport stage (not an app sheet wrapping embedded).`,
    refreshSessionAndOpenPreview: "Refresh & open preview",
    initializeAndOpenPreview: "Initialize & open preview",
    openPreview: "Open preview",
    colors: "Colors",
    radius: "Radius",
    typography: "Typography",
    moreTypographyFields: "More typography fields",
    sharedFontFamilyCaption:
      "Shared font family fallback for labels, buttons, headings, inputs",
    brand: "Brand",
    text: "Text",
    border: "Border",
    borderRadius: "Border Radius",
  },
  pciSniff: {
    title: "PCI DOM Sniff Demo",
    badge: "Internal QA",
    subtitle:
      "Live proof that merchant JS can read Drop-in card fields from the parent DOM.",
    howToDemo: "How to demo",
    step1: "Click {method} in Drop-in.",
    step2: "Type sandbox Visa {pan} · Exp {exp} · CVV {cvv}",
    step3: "Watch the sniffer panel light up — that is live merchant-readable CHD.",
    creditOrDebitCard: "Credit or Debit Card",
    newSession: "New session",
    loading: "Loading…",
    preparing: "Preparing Drop-in session…",
    dropinReady: "Drop-in ready — open Credit or Debit Card and type a test PAN",
    sessionFailed: "Session failed",
    cardFormOpen: "Card form open — watch the sniffer fill in real time",
    merchantCheckout: "Merchant checkout · Drop-in",
    waitingSession: "Waiting for session…",
    loadingDropin: "Loading Evonet Drop-in…",
    footer: "Internal PCI architecture demo · Do not use real cards",
    builderLink: "Drop-in Builder",
    testCardsLink: "Test cards",
    envChipTitle: "Tap 5 times to switch UAT / PROD",
    envChipAria: (target) => `Environment ${target}. Tap 5 times to switch.`,
    switchedTo: (target) => `Switched to ${target}`,
    snifferTitle: "Merchant DOM sniffer",
    snifferListening: "Listening for card fields…",
    snifferExposed: "CHD exposed to merchant JS",
    snifferHint:
      "Same-origin scrape — what a merchant (or XSS) can read without entering any iframe.",
    snifferWaiting: "Waiting",
    snifferFail: "FAIL · PCI risk",
    fieldPan: "Card number (PAN)",
    fieldExpiry: "Expiry",
    fieldCvv: "CVV / CVC",
    readable: "Readable",
    notSet: "Not set",
    panEmptyHint: "Type a test card in Drop-in →",
    expiryEmptyHint: "MM/YY",
    cvvEmptyHint: "—",
    cvvPresentHint: "Field is in top document — type CVV to reveal",
    architecture: "Architecture",
    architectureFail: "Inputs in merchant document",
    architectureWait: "No CHD inputs found yet",
    hostedIframes: "Hosted card iframes",
    merchantSnippet: "Merchant one-liner",
    demoCardsPrefix: "Demo cards:",
    copied: "Copied",
  },
};
