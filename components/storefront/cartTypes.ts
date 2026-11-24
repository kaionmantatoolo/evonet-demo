export interface StorefrontCartLine {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  imageSrc?: string;
  imageAlt?: string;
  size: string;
  colorId: string;
  colorLabel: string;
  quantity: number;
}

export function cartLineId(
  productId: string,
  colorId: string,
  size: string
): string {
  return `${productId}__${colorId}__${size}`;
}

export function cartLineCount(lines: StorefrontCartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartLineAmount(lines: StorefrontCartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export function formatCartLineLabel(line: StorefrontCartLine): string {
  return `${line.colorLabel} · Size ${line.size}`;
}
