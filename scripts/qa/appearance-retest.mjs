/**
 * Re-run Drop-in appearance cases on UAT and PROD.
 * BASE_URL=http://127.0.0.1:3010 node scripts/qa/appearance-retest.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3010";
const outDir = path.resolve("scripts/qa/.appearance-retest");
fs.mkdirSync(outDir, { recursive: true });

const darkAppearance = {
  colorBackground: "#0a0b19",
  colorFormBackground: "#121421",
  colorAction: "#8762f2",
  colorPrimary: "#f4f6ff",
  colorSecondary: "#f4f6ff",
  colorPlaceholder: "#f4f6ff",
};

function hex(color) {
  const m = String(color || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!m) return null;
  const n = (v) => Number(v).toString(16).padStart(2, "0");
  return `#${n(m[1])}${n(m[2])}${n(m[3])}${m[4] && Number(m[4]) < 1 ? `/${m[4]}` : ""}`;
}

async function boot(page, target) {
  await page.addInitScript((value) => {
    sessionStorage.setItem("evonet-demo-target-override", value);
  }, target);
  await page.goto(`${baseUrl}/evonet/dropin-builder`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cil-payment-method-name", { timeout: 90000 });
}

async function importAppearance(page, appearance) {
  await page.getByRole("button", { name: /^(Import|匯入|导入|インポート|가져오기)$/ }).click();
  await page.getByLabel("Import UI config JSON").fill(JSON.stringify({
    uiOption: { card: { showCardHolderName: true } },
    appearance,
  }));
  await page.getByRole("button", { name: /^(Apply|套用|应用|適用|적용)$/ }).click();
  await page.waitForTimeout(600);
  // Appearance edits only patch parent CSS variables. The test case inits Drop-in
  // with appearance, so reconstruct the SDK before opening the card iframe.
  await page.getByRole("button", { name: /Initialize \/ Re-init|初始化/ }).click();
  await page.waitForTimeout(2000);
  await page.waitForSelector(".cil-payment-method-name", { timeout: 90000 });
}

async function openCard(page) {
  await page.evaluate(() => {
    const row = [...document.querySelectorAll(".cil-payment-method-name")]
      .find((el) => /credit or debit/i.test(el.textContent || ""));
    const target = row?.closest(".card-channel-wrap, .cil-channel-title");
    if (target instanceof HTMLElement) target.click();
  });
  await page.waitForTimeout(1500);
}

async function iframeFields(page) {
  const frame = page.frames().find((item) => /DropIn\/sensitive/i.test(item.url()));
  if (!frame) return { url: null, fields: [] };
  const fields = await frame.evaluate(() =>
    [...document.querySelectorAll("input.field-input")].map((el) => {
      const style = getComputedStyle(el);
      const placeholder = getComputedStyle(el, "::placeholder");
      return {
        placeholder: el.placeholder,
        background: style.backgroundColor,
        color: style.color,
        placeholderColor: placeholder.color,
        placeholderOpacity: placeholder.opacity,
      };
    })
  );
  return { url: frame.url(), fields };
}

async function openCvv(page) {
  const frame = page.frames().find((item) => /DropIn\/sensitive/i.test(item.url()));
  if (!frame) return null;
  await frame.locator("img.cvv-icon").click({ timeout: 8000 });
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const dialog = document.querySelector(".van-dialog");
    if (!(dialog instanceof HTMLElement)) return null;
    const style = getComputedStyle(dialog);
    return {
      background: style.backgroundColor,
      color: style.color,
      text: (dialog.innerText || "").trim().slice(0, 160),
    };
  });
}

async function rings(page) {
  const names = await page.evaluate(() =>
    [...document.querySelectorAll(".cil-payment-method-name")]
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
  );
  const samples = [];
  for (const [index, name] of names.entries()) {
    await page.evaluate((label) => {
      const row = [...document.querySelectorAll(".cil-payment-method-name")]
        .find((el) => (el.textContent || "").trim() === label);
      const target = row?.closest(".cil-channel-title, .card-channel-wrap");
      if (target instanceof HTMLElement) target.click();
    }, name);
    await page.waitForTimeout(400);
    const ring = await page.evaluate(() => {
      const el = document.querySelector(
        ".cil-channel-title.channel-checked, .card-channel-wrap.card-channel-checked"
      );
      if (!(el instanceof HTMLElement)) return null;
      const after = getComputedStyle(el, "::after");
      const list = el.closest(".cil-payment-method-conatiner");
      if (!(list instanceof HTMLElement)) return { left: after.left, right: after.right };
      const listStyle = getComputedStyle(list);
      const titleRect = el.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const border = parseFloat(listStyle.borderLeftWidth) || 0;
      const left = parseFloat(after.left);
      const right = parseFloat(after.right);
      const ringLeft = titleRect.left + left;
      const ringRight = titleRect.right - right;
      const innerLeft = listRect.left + border;
      const innerRight = listRect.right - (parseFloat(listStyle.borderRightWidth) || border);
      const form = document.querySelector(".mobile-card-form-wrap");
      return {
        className: el.className,
        left: after.left,
        right: after.right,
        borderColor: after.borderTopColor,
        leftInset: Math.round((ringLeft - innerLeft) * 10) / 10,
        rightInset: Math.round((innerRight - ringRight) * 10) / 10,
        formBottom: form instanceof HTMLElement ? form.getBoundingClientRect().bottom : null,
        ringBottom: titleRect.bottom + (parseFloat(after.bottom) || 0) * -1,
      };
    });
    samples.push({
      index,
      name,
      role: index === 0 ? "first" : index === names.length - 1 ? "last" : "middle",
      ring,
    });
  }
  return samples;
}

async function shell(page) {
  return page.evaluate(() => {
    const interesting = [];
    const root = document.querySelector("[id^='evonet-dropin-']");
    const walk = (el) => {
      if (!(el instanceof HTMLElement)) return;
      const style = getComputedStyle(el);
      const bg = style.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") {
        interesting.push({
          className: String(el.className).slice(0, 80),
          background: bg,
        });
      }
      [...el.children].forEach(walk);
    };
    if (root) walk(root);
    const amount = document.querySelector(".footer-summary-wrap");
    return {
      painted: interesting.slice(0, 12),
      amount: amount instanceof HTMLElement
        ? {
            color: getComputedStyle(amount).color,
            background: getComputedStyle(amount).backgroundColor,
            text: (amount.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
          }
        : null,
      whiteParents: interesting.filter((item) => item.background === "rgb(255, 255, 255)").length,
    };
  });
}

async function measure(target, appearance, shot) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const result = { target, appearance: appearance ? "dark" : "default" };
  try {
    await boot(page, target);
    if (appearance) await importAppearance(page, appearance);
    await openCard(page);
    result.iframe = await iframeFields(page);
    result.shell = await shell(page);
    if (appearance) {
      result.dialog = await openCvv(page);
      await openCard(page);
      result.rings = await rings(page);
    } else {
      result.rings = await rings(page);
    }
    if (shot) {
      await page.screenshot({ path: path.join(outDir, shot), fullPage: false });
    }
  } catch (error) {
    result.error = String(error?.stack || error);
    await page.screenshot({ path: path.join(outDir, `${target}-${result.appearance}-error.png`), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
  return result;
}

const report = {
  uatDark: await measure("UAT", darkAppearance, "uat-dark.png"),
  uatDefault: await measure("UAT", null, "uat-default.png"),
  prodDark: await measure("PROD", darkAppearance, "prod-dark.png"),
};
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

function summarize(run) {
  const fields = run.iframe?.fields || [];
  return {
    error: run.error || null,
    iframe: run.iframe?.url || null,
    fields: fields.map((field) => ({
      name: field.placeholder,
      background: hex(field.background),
      color: hex(field.color),
      placeholder: hex(field.placeholderColor),
      placeholderOpacity: field.placeholderOpacity,
    })),
    dialog: run.dialog
      ? { background: hex(run.dialog.background), color: hex(run.dialog.color), text: run.dialog.text }
      : null,
    rings: (run.rings || []).map((sample) => ({
      name: sample.name,
      role: sample.role,
      left: sample.ring?.left,
      leftInset: sample.ring?.leftInset,
      rightInset: sample.ring?.rightInset,
    })),
    amount: run.shell?.amount
      ? { ...run.shell.amount, color: hex(run.shell.amount.color) }
      : null,
    whitePainted: run.shell?.whiteParents ?? null,
  };
}

const summary = {
  uatDark: summarize(report.uatDark),
  uatDefault: summarize(report.uatDefault),
  prodDark: summarize(report.prodDark),
};
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
