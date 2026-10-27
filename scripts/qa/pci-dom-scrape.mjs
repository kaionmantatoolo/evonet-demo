#!/usr/bin/env node
/**
 * PCI QA: Can a merchant page scrape full PAN / CVV / expiry from Drop-in DOM?
 *
 * Simulates a malicious (or careless) merchant script reading payment fields
 * after a shopper types sandbox test cards into Evonet Drop-in.
 *
 * Usage:
 *   node scripts/qa/pci-dom-scrape.mjs
 *   BASE_URL=https://dropin-demo.evonetonline.com node scripts/qa/pci-dom-scrape.mjs
 *   BASE_URL=http://127.0.0.1:3000 PATH=/evonet/dropin-builder node scripts/qa/pci-dom-scrape.mjs
 *
 * Exit codes:
 *   0 — PASS (no CHD readable from parent DOM)
 *   1 — FAIL (CHD readable — PCI risk)
 *   2 — harness / setup error
 */

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "scripts/qa/out");

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const PAGE_PATH =
  process.env.PATH_SUFFIX ||
  process.env.DROPIN_PATH ||
  "/evonet/dropin-builder";
const TARGET_URL = `${BASE_URL}${PAGE_PATH.startsWith("/") ? PAGE_PATH : `/${PAGE_PATH}`}`;
const HEADLESS = process.env.HEADLESS !== "0";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 120_000);

/** Sandbox cards from https://developer.evonetonline.com/docs/test-card-number */
const TEST_CARDS = [
  {
    brand: "Visa",
    case: "No 3DS (Success)",
    pan: "4895330111111119",
    expiry: "1231",
    cvv: "123",
  },
  {
    brand: "Mastercard",
    case: "No 3DS (Success)",
    pan: "5204740000001002",
    expiry: "1231",
    cvv: "456",
  },
];

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskPan(pan) {
  const d = digits(pan);
  if (d.length < 8) return "***";
  return `${d.slice(0, 6)}******${d.slice(-4)}`;
}

async function ensurePlaywright() {
  try {
    return require("playwright");
  } catch {
    console.error(
      "[pci-dom-scrape] playwright not installed. Run:\n  npm i -D playwright && npx playwright install chromium"
    );
    process.exit(2);
  }
}

/**
 * Merchant-side CHD scrape — same document as Drop-in host page.
 * This is what a merchant (or XSS) can do without crossing iframe boundaries.
 */
function scrapeMerchantDomChd(expected) {
  const expectedPan = String(expected.pan || "").replace(/\D/g, "");
  const expectedExpiry = String(expected.expiry || "").replace(/\D/g, "");
  const expectedCvv = String(expected.cvv || "").replace(/\D/g, "");

  const classify = (el) => {
    const name = `${el.name || ""} ${el.id || ""}`.toLowerCase();
    const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const blob = `${name} ${autocomplete} ${placeholder} ${aria}`;
    const value = el.value || "";
    const d = value.replace(/\D/g, "");

    if (
      blob.includes("cardnumber") ||
      blob.includes("card_number") ||
      blob.includes("card-number") ||
      autocomplete.includes("cc-number") ||
      placeholder.includes("card number") ||
      (el.type === "tel" && d.length >= 13)
    ) {
      return "pan";
    }
    if (
      blob.includes("cvc") ||
      blob.includes("cvv") ||
      blob.includes("security") ||
      autocomplete.includes("cc-csc")
    ) {
      return "cvv";
    }
    if (
      blob.includes("expir") ||
      blob.includes("expiry") ||
      autocomplete.includes("cc-exp") ||
      (d.length === 4 && /^\d{2}\/?\d{2}$/.test(value.replace(/\s/g, "")))
    ) {
      return "expiry";
    }
    if (blob.includes("holder") || blob.includes("name") || autocomplete.includes("cc-name")) {
      return "holder";
    }
    return "other";
  };

  const inputs = Array.from(document.querySelectorAll("input")).map((el) => {
    const kind = classify(el);
    const value = el.value || "";
    const d = value.replace(/\D/g, "");
    let inShadow = false;
    try {
      inShadow = el.getRootNode() instanceof ShadowRoot;
    } catch {
      inShadow = false;
    }
    return {
      kind,
      name: el.name || null,
      id: el.id || null,
      type: el.type || null,
      autocomplete: el.getAttribute("autocomplete"),
      placeholder: el.getAttribute("placeholder"),
      value,
      digits: d,
      inShadow,
      sameOriginReadable: true,
    };
  });

  // Also walk open shadow roots (Stencil / web components)
  const shadowInputs = [];
  const walk = (root) => {
    root.querySelectorAll("*").forEach((node) => {
      if (node.shadowRoot) {
        node.shadowRoot.querySelectorAll("input").forEach((el) => {
          const kind = classify(el);
          const value = el.value || "";
          shadowInputs.push({
            kind,
            name: el.name || null,
            id: el.id || null,
            type: el.type || null,
            autocomplete: el.getAttribute("autocomplete"),
            placeholder: el.getAttribute("placeholder"),
            value,
            digits: value.replace(/\D/g, ""),
            inShadow: true,
            sameOriginReadable: true,
          });
        });
        walk(node.shadowRoot);
      }
    });
  };
  walk(document);

  const all = [...inputs, ...shadowInputs];
  const iframes = Array.from(document.querySelectorAll("iframe")).map((f) => ({
    src: f.src || null,
    name: f.name || null,
    id: f.id || null,
    className: f.className || null,
    title: f.title || null,
  }));

  const panHits = all.filter(
    (i) =>
      i.kind === "pan" ||
      (expectedPan && i.digits.includes(expectedPan)) ||
      (expectedPan && i.value.replace(/\s/g, "").includes(expectedPan))
  );
  const cvvHits = all.filter(
    (i) =>
      (i.kind === "cvv" && i.digits.length >= 3) ||
      (expectedCvv && i.digits === expectedCvv && i.kind !== "pan")
  );
  const expiryHits = all.filter(
    (i) =>
      (i.kind === "expiry" && i.digits.length >= 4) ||
      (expectedExpiry && i.digits === expectedExpiry)
  );

  const panReadable = panHits.some(
    (i) => i.digits === expectedPan || i.digits.includes(expectedPan)
  );
  const cvvReadable = cvvHits.some((i) => i.digits === expectedCvv);
  const expiryReadable = expiryHits.some((i) => i.digits === expectedExpiry);

  const bodyText = document.body?.innerText || "";
  const panInPlainText = expectedPan ? bodyText.replace(/\D/g, "").includes(expectedPan) : false;

  return {
    location: location.href,
    iframeCount: iframes.length,
    iframes,
    inputCount: all.length,
    inputs: all.filter((i) => i.value),
    findings: {
      panReadable,
      cvvReadable,
      expiryReadable,
      panInPlainText,
      panHits: panHits.map((i) => ({
        kind: i.kind,
        name: i.name,
        digitsLength: i.digits.length,
        inShadow: i.inShadow,
        matchedFullPan: i.digits === expectedPan,
      })),
      cvvHits: cvvHits.map((i) => ({
        kind: i.kind,
        name: i.name,
        digitsLength: i.digits.length,
        inShadow: i.inShadow,
      })),
      expiryHits: expiryHits.map((i) => ({
        kind: i.kind,
        name: i.name,
        digitsLength: i.digits.length,
        value: i.value,
        inShadow: i.inShadow,
      })),
    },
  };
}

async function waitForDropin(page) {
  await page.waitForFunction(
    () => {
      const root =
        document.querySelector("[id^='evonet-dropin-']") ||
        document.querySelector(".cil-dropIn-container");
      if (!root) return false;
      const text = root.innerText || "";
      const hasInputs = root.querySelectorAll("input,button,[role='radio'],[role='button']").length > 0;
      return hasInputs || /card|visa|pay|支付|カード/i.test(text);
    },
    { timeout: TIMEOUT_MS }
  );
}

async function openCardForm(page) {
  // Wait until Drop-in finishes listing methods
  await page
    .locator(".cil-payment-method-name", { hasText: /Credit or Debit Card|Cards?|银行卡|銀行卡|クレジットカード/i })
    .first()
    .waitFor({ state: "attached", timeout: 60_000 });

  const method = page
    .locator(".cil-payment-method-name", {
      hasText: /Credit or Debit Card|Cards?|银行卡|銀行卡|クレジットカード/i,
    })
    .first();

  // Channel title overlay often intercepts normal clicks
  await method.click({ force: true, timeout: 10_000 });

  await page.locator('input[name="cardNumber"]').waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function fillCardFields(page, card) {
  const panInput = page.locator('input[name="cardNumber"]').first();
  await panInput.waitFor({ state: "visible", timeout: 15_000 });
  await panInput.click({ force: true });
  await panInput.fill("");
  await panInput.pressSequentially(card.pan, { delay: 20 });

  const expiry = page.locator('input[name="expiryDate"]').first();
  if (await expiry.count()) {
    await expiry.click({ force: true });
    await expiry.fill("");
    await expiry.pressSequentially(card.expiry, { delay: 20 });
  }

  const cvv = page.locator('input[name="cvc"]').first();
  if (await cvv.count()) {
    await cvv.click({ force: true });
    await cvv.fill("");
    // Ant/custom tel inputs sometimes ignore fill(); type CHD digit-by-digit
    await page.keyboard.type(card.cvv, { delay: 40 });
  }

  const holder = page.locator('input[name="holderName"]').first();
  if (await holder.count()) {
    await holder.click({ force: true });
    await holder.fill("PCI QA TEST");
  }

  // Let Vue / SDK format settle
  await page.waitForTimeout(800);

  // Architecture check: CHD fields live in merchant document (not hosted iframe)
  const architecture = await page.evaluate(() => {
    const pick = (name) => {
      const el = document.querySelector(`input[name="${name}"]`);
      return {
        present: !!el,
        inTopDocument: !!el && el.ownerDocument === document,
        digitsLength: (el?.value || "").replace(/\D/g, "").length,
      };
    };
    return {
      cardNumber: pick("cardNumber"),
      expiryDate: pick("expiryDate"),
      cvc: pick("cvc"),
    };
  });
  return architecture;
}

async function createSessionIfNeeded(page) {
  // dropin-builder auto-creates; dropin-test may need a button
  const buttons = [
    page.getByRole("button", { name: /create session|start|load drop-?in|initialize/i }),
    page.getByRole("button", { name: /apply|refresh|重建|创建会话/i }),
  ];
  for (const btn of buttons) {
    if (await btn.count()) {
      const first = btn.first();
      if (await first.isVisible().catch(() => false)) {
        await first.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }
  }
}

async function run() {
  const { chromium } = await ensurePlaywright();
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`[pci-dom-scrape] target=${TARGET_URL}`);
  console.log(`[pci-dom-scrape] headless=${HEADLESS}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);

  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl: TARGET_URL,
    docs: "https://developer.evonetonline.com/docs/test-card-number",
    criterion:
      "PASS only if merchant parent page cannot read full PAN, CVV, or expiry from DOM (hosted fields / cross-origin iframe expected).",
    results: [],
  };

  try {
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    await createSessionIfNeeded(page);
    await waitForDropin(page);
    await openCardForm(page);

    for (const card of TEST_CARDS) {
      console.log(
        `[pci-dom-scrape] filling ${card.brand} ${card.case} (${maskPan(card.pan)})`
      );
      const architecture = await fillCardFields(page, card);

      const scrape = await page.evaluate(scrapeMerchantDomChd, {
        pan: card.pan,
        expiry: card.expiry,
        cvv: card.cvv,
      });

      // Redact CHD from persisted report — keep lengths + match flags only
      const safeInputs = (scrape.inputs || []).map((i) => ({
        kind: i.kind,
        name: i.name,
        id: i.id,
        type: i.type,
        placeholder: i.placeholder,
        autocomplete: i.autocomplete,
        inShadow: i.inShadow,
        sameOriginReadable: i.sameOriginReadable,
        digitsLength: i.digits?.length ?? 0,
        valueRedacted: true,
      }));

      // Architecture FAIL if CHD inputs are in merchant top document
      const architectureFail =
        architecture?.cardNumber?.inTopDocument === true ||
        architecture?.expiryDate?.inTopDocument === true ||
        architecture?.cvc?.inTopDocument === true;

      const valueFail =
        scrape.findings.panReadable ||
        scrape.findings.cvvReadable ||
        scrape.findings.expiryReadable;

      const failed = architectureFail || valueFail;

      const entry = {
        brand: card.brand,
        case: card.case,
        panMasked: maskPan(card.pan),
        verdict: failed ? "FAIL" : "PASS",
        pciRisk: failed
          ? "Merchant (same-origin) JS can read cardholder data from Drop-in DOM"
          : "No full CHD matched in merchant DOM scrape",
        evidence: {
          architecture,
          panReadable: scrape.findings.panReadable,
          cvvReadable: scrape.findings.cvvReadable,
          expiryReadable: scrape.findings.expiryReadable,
          panInPlainText: scrape.findings.panInPlainText,
          iframeCount: scrape.iframeCount,
          iframes: scrape.iframes,
          panHits: scrape.findings.panHits,
          cvvHits: scrape.findings.cvvHits,
          expiryHits: scrape.findings.expiryHits.map((h) => ({
            kind: h.kind,
            name: h.name,
            digitsLength: h.digitsLength,
            inShadow: h.inShadow,
          })),
          sampleInputs: safeInputs.filter((i) =>
            ["pan", "cvv", "expiry", "holder"].includes(i.kind)
          ),
        },
      };
      report.results.push(entry);

      console.log(
        `[pci-dom-scrape] ${entry.verdict} pan=${scrape.findings.panReadable} cvv=${scrape.findings.cvvReadable} expiry=${scrape.findings.expiryReadable} topDocFields=${architectureFail} iframes=${scrape.iframeCount}`
      );
    }

    // Screenshot evidence (no need to show PAN clearly; fields may be filled)
    const shotPath = path.join(OUT_DIR, "pci-dom-scrape.png");
    await page.screenshot({ path: shotPath, fullPage: true });
    report.screenshot = shotPath;
  } catch (err) {
    report.harnessError = String(err?.stack || err);
    console.error("[pci-dom-scrape] harness error:", err);
  } finally {
    await browser.close();
  }

  const anyFail = report.results.some((r) => r.verdict === "FAIL");
  const overall = report.harnessError ? "ERROR" : anyFail ? "FAIL" : "PASS";
  report.overall = overall;

  const jsonPath = path.join(OUT_DIR, "pci-dom-scrape-report.json");
  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  console.log(`[pci-dom-scrape] report → ${jsonPath}`);
  console.log(`[pci-dom-scrape] OVERALL=${overall}`);

  if (report.harnessError) process.exit(2);
  process.exit(anyFail ? 1 : 0);
}

run();
