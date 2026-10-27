import { chromium } from "playwright";

const snapshot = {
  appearance: {
    colorBackground: "#0a0b19",
    colorAction: "#8762f2",
    colorFormBackground: "#121421",
    colorPlaceholder: "#f4f6ff",
    colorPrimary: "#f4f6ff",
    colorSecondary: "#f4f6ff",
  },
  environment: "UAT",
  locale: "en-US",
  mode: "embedded",
  currency: "HKD",
  amount: 128,
  uiOption: {
    showSaveImage: false,
    card: { showCardHolderName: true, CVVForSavedCard: true },
  },
  savedAt: new Date().toISOString(),
};

const baseUrl = process.env.BASE_URL || "http://localhost:3002";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(`${baseUrl}/evonet/storefront`, {
  waitUntil: "domcontentloaded",
});
await page.evaluate((snap) => {
  sessionStorage.setItem("evonet-storefront-snapshot", JSON.stringify(snap));
}, snapshot);
await page.reload({ waitUntil: "networkidle" });

const addBtn = page.getByRole("button", { name: /add to bag/i }).first();
await addBtn.waitFor({ timeout: 20000 });
await addBtn.click();

const bagBtn = page.getByRole("button", { name: /bag/i }).first();
await bagBtn.click();
const checkoutBtn = page.getByRole("button", { name: /checkout/i }).first();
await checkoutBtn.waitFor({ timeout: 15000 });
await checkoutBtn.click();

const sessionErr = page.locator('text=/session|error|failed/i');
if (await sessionErr.count()) {
  const errText = await sessionErr.first().textContent();
  console.log("SESSION_ERROR", errText);
}

await page.waitForSelector('div[id^="evonet-dropin-"]', { timeout: 90000 });
await page.waitForTimeout(4000);

await page.evaluate(() => {
  const row = Array.from(document.querySelectorAll(".cil-payment-method-name"))
    .find((el) => /credit or debit card/i.test(el.textContent || ""));
  const title = row?.closest(".cil-channel-title");
  if (title instanceof HTMLElement) title.click();
});
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const row = Array.from(document.querySelectorAll(".cil-payment-method-name"))
    .find((el) => /credit or debit card/i.test(el.textContent || ""));
  const title = row?.closest(".cil-channel-title");
  if (title instanceof HTMLElement) title.click();
});
await page.waitForSelector('input[placeholder*="Card"], input[placeholder*="Holder"], .custom-input', {
  timeout: 15000,
}).catch(() => null);
await page.waitForTimeout(1500);

const result = await page.evaluate(() => {
  const host = document.querySelector('div[id^="evonet-dropin-"]');
  const root = document.documentElement;
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      className: el.className,
      bg: s.backgroundColor,
      color: s.color,
    };
  };
  const solidWhite = [];
  for (const el of document.querySelectorAll('div[id^="evonet-dropin-"] *')) {
    const s = getComputedStyle(el);
    const bg = s.backgroundColor;
    if (bg === "rgb(255, 255, 255)" || bg === "rgb(247, 248, 250)") {
      if (el.clientWidth > 20 && el.clientHeight > 10) {
        solidWhite.push({
          tag: el.tagName,
          className: el.className?.toString().slice(0, 140),
          bg,
          w: el.clientWidth,
          h: el.clientHeight,
        });
      }
    }
  }
  const formDescendants = host
    ? Array.from(host.querySelectorAll(".mobile-card-form-wrap *"))
        .map((el) => {
          const s = getComputedStyle(el);
          return {
            tag: el.tagName,
            className: el.className?.toString().slice(0, 100),
            bg: s.backgroundColor,
            color: s.color,
            src: el.tagName === "IFRAME" ? el.getAttribute("src")?.slice(0, 120) : undefined,
          };
        })
    : [];
  const inputs = Array.from(
    document.querySelectorAll(
      'div[id^="evonet-dropin-"] input, div[id^="evonet-dropin-"] .van-field__body, div[id^="evonet-dropin-"] .custom-input'
    )
  ).map((el) => {
    const s = getComputedStyle(el);
    return {
      tag: el.tagName,
      className: el.className?.toString().slice(0, 100),
      bg: s.backgroundColor,
      color: s.color,
      placeholder: el.getAttribute?.("placeholder"),
    };
  });
  return {
    rootFormBg: getComputedStyle(root)
      .getPropertyValue("--cil-dropIn-color-form-background")
      .trim(),
    rootPanelBg: getComputedStyle(root)
      .getPropertyValue("--cil-dropIn-color-background")
      .trim(),
    hostVanBg: host
      ? getComputedStyle(host).getPropertyValue("--van-background").trim()
      : null,
    fieldBody: pick(".van-field__body"),
    customInput: pick("input.custom-input"),
    cellGroup: pick(".van-cell-group"),
    subCard: pick(".sub-payment-method-card"),
    extraForm: pick(".extra-form-box"),
    mobileWrap: pick(".mobile-card-form-wrap"),
    cardForm: pick(".card-form-container"),
    vanCell: pick(".van-cell"),
    solidWhite: solidWhite.slice(0, 20),
    formDescendants,
    inputs,
    hostId: host?.id ?? null,
  };
});

await page.screenshot({
  path: "scripts/qa/.dark-theme-check.png",
  fullPage: true,
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
