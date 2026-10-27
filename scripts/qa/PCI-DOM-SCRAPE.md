# QA: Drop-in PCI DOM scrape (merchant CHD access)

## Verdict

**FAIL — merchants can read full PAN (and expiry) from the Drop-in DOM on the parent page.**

Card fields are plain same-document `<input>` elements, not cross-origin hosted fields. Any merchant script (or XSS) can do:

```js
document.querySelector('input[name="cardNumber"]').value
document.querySelector('input[name="expiryDate"]').value
document.querySelector('input[name="cvc"]').value
```

This is incompatible with SAQ A / “iframe-only CHD” expectations for Drop-in.

## Interactive team demo

Open the live sniffer UI:

```text
http://localhost:3000/evonet/pci-sniff
# or
https://dropin-demo.evonetonline.com/evonet/pci-sniff
```

1. Click **Credit or Debit Card**
2. Type sandbox Visa `4895330111111119` / `12/31` / `123`
3. The right-hand panel shows CHD becoming readable in real time

## How to run automated scrape

```bash
# local (dev server on :3000)
npm run qa:pci-dom-scrape

# production demo
BASE_URL=https://dropin-demo.evonetonline.com npm run qa:pci-dom-scrape
```

Artifacts: `scripts/qa/out/pci-dom-scrape-report.json`, `scripts/qa/out/pci-dom-scrape.png`

Test cards: [Evonet sandbox test cards](https://developer.evonetonline.com/docs/test-card-number)

## Evidence

### Local Builder (`http://127.0.0.1:3000/evonet/dropin-builder`)

| Check | Result |
| --- | --- |
| Visa `489533******1119` full PAN via `input[name=cardNumber]` | **Readable** |
| Mastercard `520474******1002` full PAN | **Readable** |
| Expiry `input[name=expiryDate]` | **Readable** |
| CVV `input[name=cvc]` present in top document | **Yes (same-origin field)** |
| Hosted / secure card iframes for PAN | **None** (iframes observed were Google Pay only) |
| Overall | **FAIL** |

### Production demo (`https://dropin-demo.evonetonline.com/evonet/dropin-builder`)

Same result: **FAIL** — full PAN + expiry readable; CHD inputs in top document; **0** card-hosting iframes.

## Why this matters (PCI)

- Drop-in currently renders CHD in the **merchant origin** document.
- Merchants integrating Drop-in therefore process / can access CHD in browser JS → typically **SAQ A-EP / D** style scope, not SAQ A.
- Demo host already listens to card-number `input` events and reads `node.value` (`EvonetDropinHost`), which only works because fields are not isolated.

## Expected secure shape

- PAN / expiry / CVV inside **cross-origin** iframes (or equivalent hosted fields) owned by Evonet.
- Merchant page can detect focus/validity/brand events, but **cannot** read `.value` of CHD inputs.
- Automated criterion in this QA: PASS only when parent-page scrape cannot obtain full PAN/CVV/expiry.
