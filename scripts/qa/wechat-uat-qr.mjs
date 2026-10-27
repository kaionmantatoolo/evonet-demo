/**
 * Local UAT WeChat QR helper v5 — set amount via visible input, click Continue.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("scripts/qa/.wechat-uat-run");
fs.mkdirSync(OUT_DIR, { recursive: true });
const logsPath = path.join(OUT_DIR, "console.jsonl");
const netPath = path.join(OUT_DIR, "network.jsonl");
fs.writeFileSync(logsPath, "");
fs.writeFileSync(netPath, "");

function append(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + "\n");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });

page.on("console", (msg) => {
  const text = msg.text();
  if (
    /Check Order Status|inquiry|Init SDK|payment_|WXP|WeChat|order_created|Pending|Success|Failed|callback/i.test(
      text
    )
  ) {
    append(logsPath, { t: new Date().toISOString(), type: msg.type(), text });
    console.log("[console]", text.slice(0, 300));
  }
});

page.on("response", async (res) => {
  const url = res.url();
  if (!/inquiry|counter-uat|preCreate|qrPay|WXP|linkPayOrderInfo/i.test(url)) return;
  let bodyPreview = "";
  try {
    bodyPreview = (await res.text()).slice(0, 1800);
  } catch {
    /* ignore */
  }
  append(netPath, {
    t: new Date().toISOString(),
    status: res.status(),
    url,
    bodyPreview,
  });
  console.log(`[net ${res.status()}]`, url.slice(0, 160));
});

await page.addInitScript(() => {
  sessionStorage.setItem("evonet-demo-target-override", "UAT");
});

await page.goto("http://localhost:3000/evonet/dropin-test", {
  waitUntil: "networkidle",
  timeout: 90000,
});

// Turn OFF save-card so CTA is Pay/Continue without subscription clutter
const saveCard = page.getByRole("switch", {
  name: /Allow save card for next purchase/i,
});
if (await saveCard.count()) {
  const checked = await saveCard.getAttribute("data-state");
  if (checked === "checked" || (await saveCard.isChecked().catch(() => false))) {
    await saveCard.click();
    console.log("Disabled save-card");
  }
}

// Open Order accordion from the left config column
await page.getByRole("button", { name: /^Order & customer$/i }).click();
await page.waitForTimeout(400);
const amount = page.locator("#amount");
await amount.waitFor({ state: "visible", timeout: 15000 });
await amount.click();
await amount.fill("");
await amount.type("1.00", { delay: 30 });
await amount.blur();
console.log("Typed amount 1.00");

// Wait auto session recreate for 1.00
await page.waitForTimeout(2000);
const create = page.getByRole("button", { name: /^Create session$/i });
if (await create.isEnabled().catch(() => false)) {
  await create.click();
  console.log("Create session");
}

for (let i = 0; i < 45; i++) {
  const ready = await page.evaluate(() => {
    const chip = document.querySelector('[aria-label*="Environment"]')?.textContent || "";
    const hasWeChat = /WeChat Pay/.test(document.body.innerText);
    const total = (document.body.innerText.match(/Total[\s\S]{0,40}?HKD\s*([\d.]+)/) || [])[1];
    const sessionInput = Array.from(document.querySelectorAll("input")).find((el) =>
      /session/i.test(el.getAttribute("aria-label") || el.placeholder || "")
    );
    return {
      chip,
      hasWeChat,
      total,
      session: sessionInput?.value || "",
    };
  });
  if (
    ready.chip.includes("UAT") &&
    ready.hasWeChat &&
    ready.session &&
    !ready.session.includes("REPLACE") &&
    ready.total === "1.00"
  ) {
    console.log("Ready", ready);
    break;
  }
  if (i === 44) console.log("Proceeding anyway", ready);
  await page.waitForTimeout(1000);
}

const sessionID = await page.evaluate(() => {
  const sessionInput = Array.from(document.querySelectorAll("input")).find((el) =>
    /session/i.test(el.getAttribute("aria-label") || el.placeholder || "")
  );
  return sessionInput?.value || "";
});
console.log("sessionID", sessionID);

await page.getByText("WeChat Pay", { exact: true }).first().click({ force: true });
console.log("Selected WeChat Pay");
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(OUT_DIR, "01-wechat-selected.png") });

// Click Continue or Pay in the preview
const cta = page
  .locator("button, .van-button, .payment-btn, .base-button-primary")
  .filter({ hasText: /^(Continue|Pay)$/i });
if (await cta.count()) {
  await cta.last().click({ force: true });
  console.log("Clicked CTA", await cta.last().innerText());
} else {
  await page.getByRole("button", { name: /Continue|Pay/i }).last().click({ force: true });
  console.log("Clicked role CTA");
}

let qrFound = false;
for (let i = 0; i < 50; i++) {
  const state = await page.evaluate(() => ({
    popup: Boolean(document.querySelector(".qr-code-popup-container")),
    canvas: Boolean(document.querySelector("#cil-qrCode-container")),
    completed: Array.from(document.querySelectorAll("button")).some((b) =>
      /Completed|完成/i.test(b.textContent || "")
    ),
    text: /Pay with QR|二维码|QR code/i.test(document.body.innerText || ""),
  }));
  const net = fs.readFileSync(netPath, "utf8");
  if (state.popup || state.canvas || state.completed || state.text || /\/inquiry\b/.test(net)) {
    console.log("QR state", state);
    qrFound = true;
    break;
  }
  await page.waitForTimeout(1000);
}

await page.screenshot({ path: path.join(OUT_DIR, "02-qr.png"), fullPage: true });
const crop = page.locator(".qr-code-popup-container, #cil-qrCode-container").first();
if (await crop.count()) {
  await crop.screenshot({ path: path.join(OUT_DIR, "03-qr-crop.png") });
}

fs.writeFileSync(
  path.join(OUT_DIR, "status.json"),
  JSON.stringify({ sessionID, qrFound, outDir: OUT_DIR }, null, 2)
);
console.log("QR_FOUND=", qrFound);
console.log("OUT", OUT_DIR);
console.log("Keeping 4 minutes for scan…");
await page.waitForTimeout(240000);
await page.screenshot({ path: path.join(OUT_DIR, "04-after-wait.png"), fullPage: true });
await browser.close();
console.log("Done — check console.jsonl / network.jsonl");
