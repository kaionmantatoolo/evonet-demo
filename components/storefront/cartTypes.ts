export interface StorefrontCartLine {
  id: string;
  size: string;
  colorId: string;
  colorLabel: string;
  quantity: number;
}

export function cartLineId(colorId: string, size: string): string {
  return `${colorId}__${size}`;
}

export function cartLineCount(lines: StorefrontCartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function formatCartLineLabel(line: StorefrontCartLine): string {
  return `${line.colorLabel} · Size ${line.size}`;
}
