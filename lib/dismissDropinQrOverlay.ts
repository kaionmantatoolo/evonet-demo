/**
 * cil-dropin-components closes `window.open` on inquiry Success (`me()`), but
 * the in-page WeChat/QR `van-popup` stays mounted — covering merchant success UI.
 */
export function dismissDropinQrOverlays(): void {
  if (typeof document === "undefined") {
    return;
  }

  const hide = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.setProperty("display", "none", "important");
    el.setAttribute("aria-hidden", "true");
  };

  document
    .querySelectorAll<HTMLElement>(".qr-code-popup-container")
    .forEach((inner) => {
      const popup = inner.closest<HTMLElement>(".van-popup");
      if (popup) {
        hide(popup);
        const prev = popup.previousElementSibling;
        if (
          prev instanceof HTMLElement &&
          prev.classList.contains("van-overlay")
        ) {
          hide(prev);
        }
        return;
      }
      hide(inner);
    });

  // Full-screen Drop-in custom popups that wrap QR (teleport to body).
  document
    .querySelectorAll<HTMLElement>(".dropin-popup-custom-container.van-popup")
    .forEach((popup) => {
      if (popup.querySelector(".qr-code-popup-container")) {
        hide(popup);
        const prev = popup.previousElementSibling;
        if (
          prev instanceof HTMLElement &&
          prev.classList.contains("van-overlay")
        ) {
          hide(prev);
        }
      }
    });
}
