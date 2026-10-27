/**
 * Merchant-side CHD sniff helpers for the PCI demo.
 * Simulates what any script on the merchant origin can read from Drop-in.
 */

export type PciSniffFieldKind = "pan" | "expiry" | "cvv" | "holder" | "other";

export interface PciSniffField {
  kind: PciSniffFieldKind;
  name: string | null;
  type: string | null;
  placeholder: string | null;
  value: string;
  digits: string;
  inTopDocument: boolean;
  inShadow: boolean;
}

export interface PciSniffSnapshot {
  capturedAt: string;
  href: string;
  fields: PciSniffField[];
  iframeCount: number;
  hostedCardIframeCount: number;
  panExposed: boolean;
  expiryExposed: boolean;
  cvvExposed: boolean;
  architectureFail: boolean;
  overallFail: boolean;
}

function classifyInput(el: HTMLInputElement): PciSniffFieldKind {
  const name = `${el.name || ""} ${el.id || ""}`.toLowerCase();
  const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
  const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
  const aria = (el.getAttribute("aria-label") || "").toLowerCase();
  const blob = `${name} ${autocomplete} ${placeholder} ${aria}`;
  const digits = (el.value || "").replace(/\D/g, "");

  if (
    blob.includes("cardnumber") ||
    blob.includes("card_number") ||
    blob.includes("card-number") ||
    autocomplete.includes("cc-number") ||
    placeholder.includes("card number") ||
    (el.name === "cardNumber")
  ) {
    return "pan";
  }
  if (
    blob.includes("cvc") ||
    blob.includes("cvv") ||
    blob.includes("security") ||
    autocomplete.includes("cc-csc") ||
    el.name === "cvc"
  ) {
    return "cvv";
  }
  if (
    blob.includes("expir") ||
    autocomplete.includes("cc-exp") ||
    el.name === "expiryDate" ||
    placeholder.includes("mm/yy")
  ) {
    return "expiry";
  }
  if (
    blob.includes("holder") ||
    autocomplete.includes("cc-name") ||
    el.name === "holderName"
  ) {
    return "holder";
  }
  if (el.type === "tel" && digits.length >= 13) {
    return "pan";
  }
  return "other";
}

function collectInputs(root: ParentNode, inShadow: boolean, out: PciSniffField[]) {
  root.querySelectorAll("input").forEach((node) => {
    if (!(node instanceof HTMLInputElement)) return;
    const kind = classifyInput(node);
    if (kind === "other") return;
    const value = node.value || "";
    out.push({
      kind,
      name: node.name || null,
      type: node.type || null,
      placeholder: node.getAttribute("placeholder"),
      value,
      digits: value.replace(/\D/g, ""),
      inTopDocument: node.ownerDocument === document,
      inShadow,
    });
  });

  root.querySelectorAll("*").forEach((node) => {
    if (node instanceof Element && node.shadowRoot) {
      collectInputs(node.shadowRoot, true, out);
    }
  });
}

/** Run in the browser (merchant page context). */
export function sniffPciDom(): PciSniffSnapshot {
  const fields: PciSniffField[] = [];
  collectInputs(document, false, fields);

  const iframes = Array.from(document.querySelectorAll("iframe"));
  const hostedCardIframeCount = iframes.filter((f) =>
    /card|secure|hosted|payment-field|cil-secure/i.test(
      `${f.src} ${f.name} ${f.id} ${f.className} ${f.title}`
    )
  ).length;

  const pan = fields.find((f) => f.kind === "pan");
  const expiry = fields.find((f) => f.kind === "expiry");
  const cvv = fields.find((f) => f.kind === "cvv");

  const panExposed = Boolean(pan && pan.digits.length >= 13 && pan.inTopDocument);
  const expiryExposed = Boolean(expiry && expiry.digits.length >= 4 && expiry.inTopDocument);
  const cvvExposed = Boolean(cvv && cvv.digits.length >= 3 && cvv.inTopDocument);
  const architectureFail = Boolean(
    (pan && pan.inTopDocument) ||
      (expiry && expiry.inTopDocument) ||
      (cvv && cvv.inTopDocument)
  );

  return {
    capturedAt: new Date().toISOString(),
    href: typeof location !== "undefined" ? location.href : "",
    fields,
    iframeCount: iframes.length,
    hostedCardIframeCount,
    panExposed,
    expiryExposed,
    cvvExposed,
    architectureFail,
    overallFail: architectureFail || panExposed || expiryExposed || cvvExposed,
  };
}

export function maskPan(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 10) return d ? `${d.slice(0, 2)}…` : "";
  return `${d.slice(0, 6)}${"•".repeat(Math.max(0, d.length - 10))}${d.slice(-4)}`;
}

export const MERCHANT_SNIFF_SNIPPET = `// Runs on the merchant page (same origin as Drop-in host)
const pan = document.querySelector('input[name="cardNumber"]')?.value;
const exp = document.querySelector('input[name="expiryDate"]')?.value;
const cvc = document.querySelector('input[name="cvc"]')?.value;
console.log({ pan, exp, cvc });`;
