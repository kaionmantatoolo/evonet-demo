/**
 * Acceptance pass for Drop-in Appearance (local SDK, host paint overrides removed).
 * BASE_URL=http://127.0.0.1:3010 node scripts/qa/appearance-acceptance.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3010";
const outDir = path.resolve("scripts/qa/.appearance-acceptance");
fs.mkdirSync(outDir, { recursive: true });

const darkConfig = {
  uiOption: {
    card: { showCardHolderName: true },
  },
  appearance: {
    mutilKey: "Georgia, serif",
    colorBackground: "#0a0b19",
    colorFormBackground: "#121421",
    colorAction: "#8762f2",
    colorPrimary: "#f4f6ff",
    colorSecondary: "#f4f6ff",
    colorPlaceholder: "#f4f6ff",
  },
};

function rgbClose(actual, hex, tolerance = 8) {
  const m = String(actual || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return false;
  const want = hex.replace("#", "");
  const r = parseInt(want.slice(0, 2), 16);
  const g = parseInt(want.slice(2, 4), 16);
  const b = parseInt(want.slice(4, 6), 16);
  return (
    Math.abs(Number(m[1]) - r) <= tolerance &&
    Math.abs(Number(m[2]) - g) <= tolerance &&
    Math.abs(Number(m[3]) - b) <= tolerance
  );
}

function isWhite(color) {
  return rgbClose(color, "#ffffff", 2) || rgbClose(color, "#f7f8fa", 2);
}

async function importConfig(page, config) {
  const importBtn = page.getByRole("button", {
    name: /^(Import|匯入|导入|インポート|가져오기)$/,
  });
  await importBtn.click();
  const area = page.getByLabel("Import UI config JSON");
  await area.waitFor({ timeout: 10000 });
  await area.fill(JSON.stringify(config));
  await page
    .getByRole("button", { name: /^(Apply|套用|应用|適用|적용)$/ })
    .click();
  await page.waitForTimeout(1500);
}

async function clickMethod(page, pattern) {
  const clicked = await page.evaluate((source) => {
    const re = new RegExp(source, "i");
    const row = Array.from(
      document.querySelectorAll(".cil-payment-method-name")
    ).find((el) => re.test(el.textContent || ""));
    const title = row?.closest(".cil-channel-title, .card-channel-wrap, [class*='channel']");
    const target = title instanceof HTMLElement ? title : row;
    if (!(target instanceof HTMLElement)) return false;
    target.click();
    return true;
  }, pattern.source);
  await page.waitForTimeout(900);
  return clicked;
}

async function measureParent(page) {
  return page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!(el instanceof HTMLElement)) return null;
      const s = getComputedStyle(el);
      return {
        sel,
        bg: s.backgroundColor,
        color: s.color,
        text: (el.innerText || "").trim().slice(0, 80),
      };
    };
    const before = (sel) => {
      const el = document.querySelector(sel);
      if (!(el instanceof HTMLElement)) return null;
      const s = getComputedStyle(el, "::before");
      return { sel: `${sel}::before`, bg: s.backgroundColor };
    };
    const names = Array.from(
      document.querySelectorAll(".cil-payment-method-name")
    ).map((el) => (el.textContent || "").trim());
    const separators = Array.from(
      document.querySelectorAll(
        ".cil-channel-wrap, .cil-channel-title, .payment-method-item, .cil-payment-method-item"
      )
    ).slice(0, 12);
    const borders = Array.from(
      document.querySelectorAll(".cil-channel-title, .card-channel-wrap")
    ).map((el) => {
      const s = getComputedStyle(el);
      return {
        cls: el.className,
        borderTop: s.borderTopWidth + " " + s.borderTopColor,
        borderBottom: s.borderBottomWidth + " " + s.borderBottomColor,
      };
    });
    const ring = (el) => {
      if (!(el instanceof HTMLElement)) return null;
      const cs = getComputedStyle(el, "::after");
      const titleRect = el.getBoundingClientRect();
      const list = el.closest(".cil-payment-method-conatiner");
      if (!(list instanceof HTMLElement)) return { cls: el.className, missingList: true };
      const listCs = getComputedStyle(list);
      const listRect = list.getBoundingClientRect();
      const border = parseFloat(listCs.borderLeftWidth) || 0;
      const left = parseFloat(cs.left);
      const right = parseFloat(cs.right);
      const top = parseFloat(cs.top);
      const bottom = parseFloat(cs.bottom);
      if (![left, right, top, bottom].every((n) => Number.isFinite(n))) {
        return { cls: el.className, raw: { left: cs.left, right: cs.right, top: cs.top, bottom: cs.bottom } };
      }
      const ringLeft = titleRect.left + left;
      const ringRight = titleRect.right - right;
      const ringTop = titleRect.top + top;
      const ringBottom = titleRect.bottom - bottom;
      const innerLeft = listRect.left + border;
      const innerRight = listRect.right - (parseFloat(listCs.borderRightWidth) || border);
      const innerTop = listRect.top + (parseFloat(listCs.borderTopWidth) || border);
      const innerBottom = listRect.bottom - (parseFloat(listCs.borderBottomWidth) || border);
      return {
        cls: el.className,
        borderColor: cs.borderTopColor,
        left: cs.left,
        right: cs.right,
        insets: {
          left: Math.round((ringLeft - innerLeft) * 10) / 10,
          right: Math.round((innerRight - ringRight) * 10) / 10,
          top: Math.round((ringTop - innerTop) * 10) / 10,
          bottom: Math.round((innerBottom - ringBottom) * 10) / 10,
        },
        ringBottom,
      };
    };
    const checked = document.querySelector(
      ".cil-channel-title.channel-checked, .card-channel-wrap.card-channel-checked"
    );
    const form = document.querySelector(
      ".mobile-card-form-wrap, .extra-form-box, .sub-payment-method-card"
    );
    const formRect = form instanceof HTMLElement ? form.getBoundingClientRect() : null;
    const checkedRing = ring(checked);
    const payBtn = document.querySelector(
      ".cil-payment-method-footer button, .pay-btn, .van-button, button.loading-button"
    );
    const payFont = payBtn instanceof HTMLElement ? getComputedStyle(payBtn).fontFamily : null;
    const footer = document.querySelector(
      ".cil-payment-method-footer, .footer-summary-wrap, .fixed-footer"
    );
    const amount = document.querySelector(".amount-value-field, .footer-summary-wrap");
    const placeholderVar = getComputedStyle(document.documentElement).getPropertyValue(
      "--cil-dropIn-color-input-placeholder"
    );
    return {
      names,
      panels: [
        pick(".sub-payment-method-card"),
        pick(".extra-form-box"),
        pick(".mobile-card-form-wrap"),
        pick(".van-cell-group"),
        pick(".van-field__body"),
        pick("input.custom-input"),
        before(".extra-form-box"),
      ].filter(Boolean),
      borders,
      checkedRing,
      formBottom: formRect ? formRect.bottom : null,
      payFont,
      payText: payBtn instanceof HTMLElement ? (payBtn.innerText || "").trim().slice(0, 40) : null,
      footer: footer instanceof HTMLElement
        ? {
            bg: getComputedStyle(footer).backgroundColor,
            color: getComputedStyle(footer).color,
          }
        : null,
      amount: amount instanceof HTMLElement
        ? {
            cls: amount.className,
            color: getComputedStyle(amount).color,
            bg: getComputedStyle(amount).backgroundColor,
            text: (amount.innerText || "").trim().slice(0, 40),
          }
        : null,
      placeholderVar: placeholderVar.trim(),
      iframes: Array.from(document.querySelectorAll("iframe")).map((f) => f.src).slice(0, 8),
    };
  });
}

async function measureIframe(page) {
  const frames = page.frames().filter((frame) => /DropIn\/sensitive/i.test(frame.url()));
  const results = [];
  for (const frame of frames) {
    try {
      const fields = await frame.evaluate(() => {
        const nodes = Array.from(
          document.querySelectorAll("input, .van-field, .van-field__body, label, [class*='field']")
        ).slice(0, 20);
        return nodes.map((el) => {
          const s = getComputedStyle(el);
          return {
            tag: el.tagName,
            cls: el.className,
            placeholder: el.getAttribute?.("placeholder"),
            bg: s.backgroundColor,
            color: s.color,
            opacity: s.opacity,
          };
        });
      });
      results.push({ url: frame.url(), fields });
    } catch (error) {
      results.push({ url: frame.url(), error: String(error) });
    }
  }
  return results;
}

async function openCvvDialog(page) {
  const frames = page.frames().filter((frame) => /DropIn\/sensitive/i.test(frame.url()));
  for (const frame of frames) {
    const clicked = await frame
      .evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll("button, [role='button'], i, span, div, svg")
        );
        const hit = candidates.find((el) => {
          const label = `${el.getAttribute("aria-label") || ""} ${el.className || ""} ${el.textContent || ""}`;
          return /\?|help|cvv|cvc|question|icon-info|van-icon/i.test(label) && (el.textContent || "").trim().length < 8;
        });
        if (hit instanceof HTMLElement) {
          hit.click();
          return hit.className || hit.tagName;
        }
        return null;
      })
      .catch(() => null);
    if (clicked) {
      await page.waitForTimeout(600);
      return { where: "iframe", clicked };
    }
  }
  const parentClick = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("button, i, span, div"));
    const hit = candidates.find((el) => {
      const label = `${el.className || ""} ${el.getAttribute("aria-label") || ""}`;
      return /cvv|cvc|question|icon-question|van-icon-question/i.test(label);
    });
    if (hit instanceof HTMLElement) {
      hit.click();
      return hit.className || hit.tagName;
    }
    return null;
  });
  await page.waitForTimeout(600);
  return { where: "parent", clicked: parentClick };
}

async function measureDialog(page) {
  const read = async (target) =>
    target.evaluate(() => {
      const dialog = document.querySelector(".van-dialog, .van-popup");
      if (!(dialog instanceof HTMLElement)) return null;
      const s = getComputedStyle(dialog);
      const title = dialog.querySelector(".van-dialog__header, .van-dialog__message, .van-popup__title");
      const body = dialog.querySelector(".van-dialog__message, .van-dialog__content");
      const titleStyle = title instanceof HTMLElement ? getComputedStyle(title) : null;
      const bodyStyle = body instanceof HTMLElement ? getComputedStyle(body) : null;
      return {
        cls: dialog.className,
        bg: s.backgroundColor,
        color: s.color,
        titleColor: titleStyle?.color || null,
        bodyColor: bodyStyle?.color || null,
        text: (dialog.innerText || "").trim().slice(0, 180),
      };
    });
  const parent = await read(page);
  if (parent) return { where: "parent", dialog: parent };
  for (const frame of page.frames()) {
    try {
      const dialog = await read(frame);
      if (dialog) return { where: frame.url(), dialog };
    } catch {
      /* cross-origin frame without execution access */
    }
  }
  return null;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const report = { baseUrl, steps: [] };

try {
  await page.goto(`${baseUrl}/evonet/dropin-builder`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cil-payment-method-name", { timeout: 90000 });
  report.steps.push("dropin-ready");

  await importConfig(page, darkConfig);
  await page.waitForSelector(".cil-payment-method-name", { timeout: 90000 });
  await page.waitForTimeout(1200);
  await clickMethod(page, /credit or debit card/i);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "01-dark-card.png"), fullPage: false });

  const darkParent = await measureParent(page);
  const darkIframe = await measureIframe(page);
  const methods = darkParent.names;
  const ringSamples = [];
  for (const [index, name] of methods.entries()) {
    if (!name) continue;
    await clickMethod(page, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    const snap = await measureParent(page);
    ringSamples.push({
      index,
      name,
      role: index === 0 ? "first" : index === methods.length - 1 ? "last" : "middle",
      ring: snap.checkedRing,
      formBottom: snap.formBottom,
    });
  }
  await clickMethod(page, /credit or debit card/i);
  await page.waitForTimeout(800);
  const cvvOpen = await openCvvDialog(page);
  await page.screenshot({ path: path.join(outDir, "02-cvv.png"), fullPage: false });
  const dialog = await measureDialog(page);

  const otherPanels = [];
  for (const pattern of [/google pay/i, /apple pay/i, /wechat/i, /alipay/i, /octopus/i]) {
    const name = methods.find((item) => pattern.test(item));
    if (!name) continue;
    await clickMethod(page, pattern);
    const snap = await measureParent(page);
    otherPanels.push({ name, panels: snap.panels });
  }

  report.dark = { parent: darkParent, iframe: darkIframe, ringSamples, cvvOpen, dialog, otherPanels };

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cil-payment-method-name", { timeout: 90000 });
  await page.waitForTimeout(1500);
  await clickMethod(page, /credit or debit card/i);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "03-light-card.png"), fullPage: false });
  const lightParent = await measureParent(page);
  const lightRings = [];
  const lightNames = lightParent.names;
  for (const [index, name] of lightNames.entries()) {
    if (!name || index > 2 && index < lightNames.length - 1) continue;
    await clickMethod(page, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    const snap = await measureParent(page);
    lightRings.push({
      index,
      name,
      role: index === 0 ? "first" : index === lightNames.length - 1 ? "last" : "middle",
      ring: snap.checkedRing,
    });
  }
  report.light = { parent: lightParent, rings: lightRings };
} catch (error) {
  report.error = String(error?.stack || error);
  await page.screenshot({ path: path.join(outDir, "error.png"), fullPage: true }).catch(() => {});
} finally {
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}

const fail = [];
const pass = [];
function judge(id, ok, detail) {
  (ok ? pass : fail).push({ id, detail });
}

const dark = report.dark;
if (!dark) {
  judge("setup", false, report.error || "no dark measurements");
} else {
  const whitePanels = (dark.parent.panels || []).filter((panel) => isWhite(panel.bg));
  judge(
    "1 expanded panel not white",
    whitePanels.length === 0 && (dark.parent.panels || []).length > 0,
    whitePanels.length ? whitePanels : dark.parent.panels
  );

  const iframeFields = (dark.iframe || []).flatMap((frame) => frame.fields || []);
  const iframeBgs = iframeFields.map((field) => field.bg).filter(Boolean);
  const iframeOk =
    iframeFields.length > 0 &&
    iframeFields.every((field) => !isWhite(field.bg) && (rgbClose(field.bg, "#121421") || rgbClose(field.color, "#f4f6ff") || field.bg === "rgba(0, 0, 0, 0)"));
  const painted = iframeFields.filter((field) => field.bg && field.bg !== "rgba(0, 0, 0, 0)");
  judge(
    "2 iframe fields use colorFormBackground",
    painted.length > 0 && painted.every((field) => rgbClose(field.bg, "#121421")) && iframeFields.some((field) => rgbClose(field.color, "#f4f6ff") || rgbClose(field.color, "#000000") === false),
    { iframeBgs: [...new Set(iframeBgs)].slice(0, 8), sample: iframeFields.slice(0, 6), frames: (dark.iframe || []).map((f) => f.url || f.error) }
  );

  const dialog = dark.dialog?.dialog;
  judge(
    "3 CVV dialog",
    Boolean(dialog) && rgbClose(dialog.bg, "#0a0b19") && (rgbClose(dialog.color, "#f4f6ff") || rgbClose(dialog.titleColor, "#f4f6ff") || rgbClose(dialog.bodyColor, "#f4f6ff")),
    { open: dark.cvvOpen, dialog }
  );

  const ringPass = (sample) => {
    const insets = sample?.ring?.insets;
    if (!insets) return false;
    return insets.left >= 0 && insets.right >= 0 && insets.top >= -1 && insets.bottom >= -1;
  };
  const roles = ["first", "middle", "last"];
  const darkRingOk = roles.every((role) => (dark.ringSamples || []).some((sample) => sample.role === role && ringPass(sample)));
  const lightRingOk = roles.every((role) => (report.light?.rings || []).some((sample) => sample.role === role && ringPass(sample)));
  judge("4 selection ring dark+light", darkRingOk && lightRingOk, {
    dark: (dark.ringSamples || []).map((s) => ({ name: s.name, role: s.role, insets: s.ring?.insets, left: s.ring?.left })),
    light: (report.light?.rings || []).map((s) => ({ name: s.name, role: s.role, insets: s.ring?.insets, left: s.ring?.left })),
  });

  const lightPanels = report.light?.parent?.panels || [];
  const lightHasForm = lightPanels.some((panel) => panel.bg);
  const lightNotDark = lightPanels.every((panel) => !rgbClose(panel.bg, "#121421") && !rgbClose(panel.bg, "#0a0b19"));
  judge("5 light theme still light", lightHasForm && lightNotDark, lightPanels);

  const otherWhite = (dark.otherPanels || []).flatMap((entry) =>
    (entry.panels || []).filter((panel) => isWhite(panel.bg)).map((panel) => ({ name: entry.name, ...panel }))
  );
  judge("6 other method panels not hardcoded white", otherWhite.length === 0, dark.otherPanels || otherWhite);

  const footerOk =
    rgbClose(dark.parent.footer?.bg, "#0a0b19") || rgbClose(dark.parent.amount?.color, "#f4f6ff");
  judge("7 footer / total tokens", footerOk, { footer: dark.parent.footer, amount: dark.parent.amount });

  const cardSample = (dark.ringSamples || []).find((sample) => /credit or debit/i.test(sample.name || ""));
  const encloses =
    cardSample?.ring?.ringBottom &&
    cardSample.formBottom &&
    cardSample.ring.ringBottom >= cardSample.formBottom - 4;
  judge("E card ring wraps fields", Boolean(encloses), {
    ringBottom: cardSample?.ring?.ringBottom,
    formBottom: cardSample?.formBottom,
    cls: cardSample?.ring?.cls,
  });

  judge(
    "G button font follows mutilKey",
    /georgia/i.test(dark.parent.payFont || ""),
    dark.parent.payFont
  );
  judge(
    "H placeholder default #757575",
    rgbClose(report.light?.parent?.placeholderVar, "#757575") || /757575/i.test(report.light?.parent?.placeholderVar || ""),
    report.light?.parent?.placeholderVar
  );
}

const summary = {
  error: report.error || null,
  pass: pass.map((item) => item.id),
  fail: fail.map((item) => ({ id: item.id, detail: item.detail })),
};
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
