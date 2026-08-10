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
    startDemo: string;
    validationWorkspace: string;
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
    validationTitleProd: string;
    validationBody: string;
    validationBodyProd: string;
    openWorkspace: string;
    footer: string;
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
    saveCardAccordion: string;
    allowSaveCard: string;
    allowSaveCardHint: string;
    userReference: string;
    userReferenceHint: string;
    includeRecurringModel: string;
    recurringModelPlaceholder: string;
    recurringSubscription: string;
    recurringUnscheduled: string;
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
    startDemo: "Start interactive demo",
    validationWorkspace: "Validation workspace",
    step1Title: "Set the experience",
    step1Body: "Pick style and interaction options, then preview instantly.",
    step2Title: "Walk the journey",
    step2Body: "See payment selection through completion in a real browser.",
    step3Title: "Align to launch",
    step3Body: "Give product and engineering one shared checkout reference.",
    choosePath: "Choose a path",
    guidedTitle: "Guided experience",
    guidedBody:
      "Best for customer meetings. Shape Drop-in and open a polished storefront preview.",
    openBuilder: "Open Builder",
    validationTitle: "Validation workspace",
    validationTitleProd: "Production validation",
    validationBody: "Inspect SDK options, events, and payment outcomes in detail.",
    validationBodyProd: "Full configuration for internal QA against live credentials.",
    openWorkspace: "Open workspace",
    footer: "Demo environment · Evonet Drop-in",
  },
  builder: {
    title: "Drop-in Builder",
    description:
      "Configure Evonet Drop-in SDK options with a guided interface, preview the result instantly, and copy JSON in one click.",
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
    saveCardAccordion: "Save card for next purchase",
    allowSaveCard: "Allow save card for next purchase",
    allowSaveCardHint:
      "Sends userInfo.reference and paymentMethod.recurringProcessingModel. Refresh the session after changing this.",
    userReference: "User reference (userInfo.reference)",
    userReferenceHint: "Stable shopper ID used to associate stored tokens.",
    includeRecurringModel: "Include recurring processing model",
    recurringModelPlaceholder: "Recurring model",
    recurringSubscription: "Subscription",
    recurringUnscheduled: "Unscheduled (auto-debit)",
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
    openStorefrontHint: "Preview this theme in a full ecommerce checkout demo.",
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
};
