"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteLocale } from "@/components/SiteLocaleProvider";
import {
  AppearanceColorRow,
  AppearanceSliderRow,
  AppearanceTextRow,
} from "./AppearanceParameterRow";
import { AppearanceSectionCard } from "./AppearanceSectionCard";

const POPULAR_FONT_OPTIONS = [
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto Serif", value: '"Roboto Serif", serif' },
  { label: "Roboto Mono", value: '"Roboto Mono", monospace' },
] as const;

const FONT_SIZE_OPTIONS = [
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
] as const;

const FONT_WEIGHT_OPTIONS = ["300", "400", "500", "600", "700"] as const;

const TYPOGRAPHY_GROUPS = [
  "button",
  "heading",
  "subHeading",
  "label",
  "labelInfo",
  "inputField",
  "paragraph",
  "placeholder",
] as const;

const TYPOGRAPHY_CAPTIONS: Record<(typeof TYPOGRAPHY_GROUPS)[number], string> = {
  button: "Pay / primary button label size",
  heading: "“Choose a payment method” and section headings",
  subHeading: "Subheading text (uses colorSecondary)",
  label: "Field labels above inputs",
  labelInfo: "Small helper / info labels near fields",
  inputField: "Typed text inside inputs & selects",
  paragraph: "Body / TnC / checkbox copy (uses colorSecondary)",
  placeholder: "Placeholder text size inside inputs",
};

/** Figma Parameter row: ~66px tall with 16px padding; list gap ≈ 9px. */
const TYPOGRAPHY_ROW_CLASS =
  "min-h-[66px] rounded-md bg-muted/70 px-4 py-4 text-[#5d5d5d] dark:text-foreground";

/** SDK maps A[0]→input+dialog, A[1]→checkbox, A[2]→button; A[3] is unused by Drop-in. */
const RADIUS_CAPTIONS = [
  "Inputs, selects, dialogs / cards (SDK borderRadius[0])",
  "Checkboxes & radio corners (SDK borderRadius[1])",
  "Pay / primary buttons (SDK borderRadius[2])",
  "Not applied by Drop-in SDK (kept for API shape / Figma parity)",
] as const;

type TypographyGroup = (typeof TYPOGRAPHY_GROUPS)[number];

export type AppearanceTypographyState = Record<
  TypographyGroup,
  {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    letterSpacing?: string;
    lineHeight?: string;
  }
>;

export interface AppearanceColorsState {
  colorAction: string;
  colorBackground: string;
  colorFormBackground: string;
  colorDisabled: string;
  colorPrimary: string;
  colorSecondary: string;
  colorPlaceholder: string;
  colorError: string;
  colorInverse: string;
  colorBoxStroke: string;
  colorFormBorder: string;
  colorBoxFillingOutline: string;
}

export interface AppearanceTabsProps {
  colors: AppearanceColorsState;
  onColorChange: (key: keyof AppearanceColorsState, value: string) => void;
  onResetBrand: () => void;
  onResetText: () => void;
  onResetBorder: () => void;
  borderRadius: [number, number, number, number];
  onBorderRadiusChange: (index: 0 | 1 | 2 | 3, value: number) => void;
  onResetRadius: () => void;
  logoPosition: "left" | "middle" | "right";
  onLogoPositionChange: (value: "left" | "middle" | "right") => void;
  typography: AppearanceTypographyState;
  onTypographyChange: (
    group: TypographyGroup,
    field: keyof AppearanceTypographyState[TypographyGroup],
    value: string
  ) => void;
  onSharedFontFamilyChange: (value: string) => void;
  onResetTypography: () => void;
  /** Highlight matching Drop-in preview regions for this appearance key. */
  onPulseKey?: (key: string) => void;
}

/** Shared list rhythm for Colors Brand / Text / Border parameter stacks. */
const COLOR_SECTION_CONTENT_CLASS = "space-y-0 px-4 py-2 [&>*]:py-4";

/** Figma Appearance sub-tabs: gray chips, Evonet blue active fill. */
const APPEARANCE_TABS_LIST_CLASS =
  "h-auto w-full gap-[5px] rounded-md border-0 bg-transparent p-0 py-1";
const APPEARANCE_TABS_TRIGGER_CLASS =
  "h-8 flex-1 rounded-[2px] bg-[#f2f2f2] px-[7px] text-sm font-normal text-black shadow-none data-[state=active]:bg-[#1a86e8] data-[state=active]:font-bold data-[state=active]:text-white data-[state=active]:shadow-none dark:bg-muted dark:text-foreground dark:data-[state=active]:bg-[#1a86e8] dark:data-[state=active]:text-white";

export function AppearanceTabs({
  colors,
  onColorChange,
  onResetBrand,
  onResetText,
  onResetBorder,
  borderRadius,
  onBorderRadiusChange,
  onResetRadius,
  logoPosition,
  onLogoPositionChange,
  typography,
  onTypographyChange,
  onSharedFontFamilyChange,
  onResetTypography,
  onPulseKey,
}: AppearanceTabsProps) {
  const { messages } = useSiteLocale();
  const t = messages.builder;
  const sharedFontFamily = typography.button.fontFamily ?? "";
  const pulse = (key: string) => onPulseKey?.(key);

  return (
    <Tabs defaultValue="colors" className="w-full gap-4">
      <TabsList className={APPEARANCE_TABS_LIST_CLASS}>
        <TabsTrigger
          value="colors"
          data-builder-tab="appearance"
          className={APPEARANCE_TABS_TRIGGER_CLASS}
        >
          {t.colors}
        </TabsTrigger>
        <TabsTrigger
          value="radius"
          data-builder-tab="appearance"
          className={APPEARANCE_TABS_TRIGGER_CLASS}
        >
          {t.radius}
        </TabsTrigger>
        <TabsTrigger
          value="typography"
          data-builder-tab="appearance"
          className={APPEARANCE_TABS_TRIGGER_CLASS}
        >
          {t.typography}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="colors" className="space-y-5">
        <AppearanceSectionCard
          title={t.brand}
          onReset={onResetBrand}
          contentClassName={COLOR_SECTION_CONTENT_CLASS}
        >
          <AppearanceColorRow
            label="colorAction"
            caption="Pay button fill, checked radios/checkboxes, See All links, selection ring accent"
            value={colors.colorAction}
            placeholder="#212121"
            onChange={(value) => onColorChange("colorAction", value)}
            onPulse={() => pulse("colorAction")}
          />
          <AppearanceColorRow
            label="colorBackground"
            caption="Drop-in page / panel background"
            value={colors.colorBackground}
            placeholder="#ffffff"
            onChange={(value) => onColorChange("colorBackground", value)}
            onPulse={() => pulse("colorBackground")}
          />
          <AppearanceColorRow
            label="colorFormBackground"
            caption="Input, select, and card-form field backgrounds"
            value={colors.colorFormBackground}
            placeholder="#ffffff"
            onChange={(value) => onColorChange("colorFormBackground", value)}
            onPulse={() => pulse("colorFormBackground")}
          />
          <AppearanceColorRow
            label="colorDisabled"
            caption="Disabled Pay / primary button fill"
            value={colors.colorDisabled}
            placeholder="#9ca3af"
            onChange={(value) => onColorChange("colorDisabled", value)}
            onPulse={() => pulse("colorDisabled")}
          />
        </AppearanceSectionCard>

        <AppearanceSectionCard
          title={t.text}
          onReset={onResetText}
          contentClassName={COLOR_SECTION_CONTENT_CLASS}
        >
          <AppearanceColorRow
            label="colorPrimary"
            caption="Payment method names, headings, input typed text"
            value={colors.colorPrimary}
            placeholder="#212121"
            onChange={(value) => onColorChange("colorPrimary", value)}
            onPulse={() => pulse("colorPrimary")}
          />
          <AppearanceColorRow
            label="colorSecondary"
            caption="Subheadings, paragraphs, TnC / checkbox body copy"
            value={colors.colorSecondary}
            placeholder="#757575"
            onChange={(value) => onColorChange("colorSecondary", value)}
            onPulse={() => pulse("colorSecondary")}
          />
          <AppearanceColorRow
            label="colorPlaceholder"
            caption="Input placeholders (e.g. Card Holder Name)"
            value={colors.colorPlaceholder}
            placeholder="#9ca3af"
            onChange={(value) => onColorChange("colorPlaceholder", value)}
            onPulse={() => pulse("colorPlaceholder")}
          />
          <AppearanceColorRow
            label="colorError"
            caption="Validation messages, error icons, invalid field borders"
            value={colors.colorError}
            placeholder="#dc2626"
            onChange={(value) => onColorChange("colorError", value)}
            onPulse={() => pulse("colorError")}
          />
          <AppearanceColorRow
            label="colorInverse"
            caption="Text/icon color on Pay & primary buttons"
            value={colors.colorInverse}
            placeholder="#0f172a"
            onChange={(value) => onColorChange("colorInverse", value)}
            onPulse={() => pulse("colorInverse")}
          />
        </AppearanceSectionCard>

        <AppearanceSectionCard
          title={t.border}
          onReset={onResetBorder}
          contentClassName={COLOR_SECTION_CONTENT_CLASS}
        >
          <AppearanceColorRow
            label="colorBoxStroke"
            caption="Payment method list border, row dividers, and (via SDK) input borders"
            value={colors.colorBoxStroke}
            placeholder="#d1d5db"
            onChange={(value) => onColorChange("colorBoxStroke", value)}
            onPulse={() => pulse("colorBoxStroke")}
          />
          <AppearanceColorRow
            label="colorFormBorder"
            caption="Accepted by SDK API; Drop-in currently paints input borders from colorBoxStroke"
            value={colors.colorFormBorder}
            placeholder="#d1d5db"
            onChange={(value) => onColorChange("colorFormBorder", value)}
            onPulse={() => pulse("colorFormBorder")}
          />
          <AppearanceColorRow
            label="colorBoxFillingOutline"
            caption="Selected-method outline, focused input border, checked token cards"
            value={colors.colorBoxFillingOutline}
            placeholder="#e5e7eb"
            onChange={(value) => onColorChange("colorBoxFillingOutline", value)}
            onPulse={() => pulse("colorBoxFillingOutline")}
          />
        </AppearanceSectionCard>
      </TabsContent>

      <TabsContent value="radius" className="space-y-4">
        <AppearanceSectionCard
          title={t.borderRadius}
          onReset={onResetRadius}
          contentClassName={COLOR_SECTION_CONTENT_CLASS}
        >
          {RADIUS_CAPTIONS.map((caption, index) => (
            <AppearanceSliderRow
              key={caption}
              label={`borderRadius ${index + 1}`}
              caption={caption}
              value={borderRadius[index]}
              min={0}
              max={100}
              onChange={(value) =>
                onBorderRadiusChange(index as 0 | 1 | 2 | 3, value)
              }
              onPulse={() => pulse(`borderRadius${index}`)}
            />
          ))}
          <div
            className="space-y-2 border-t pt-3"
            onFocusCapture={() => pulse("logoPosition")}
          >
            <Label>{t.logoPosition}</Label>
            <p className="text-xs text-muted-foreground">
              {t.logoPositionHint}
            </p>
            <Select
              value={logoPosition}
              onValueChange={(value) => {
                pulse("logoPosition");
                onLogoPositionChange(value as "left" | "middle" | "right");
              }}
            >
              <SelectTrigger className="w-full" aria-label={t.logoPosition}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{t.logoPositionLeft}</SelectItem>
                <SelectItem value="middle">{t.logoPositionMiddle}</SelectItem>
                <SelectItem value="right">{t.logoPositionRight}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AppearanceSectionCard>
      </TabsContent>

      <TabsContent value="typography" className="space-y-4">
        <AppearanceSectionCard
          title={t.typography}
          onReset={onResetTypography}
          contentClassName="space-y-3.5 px-3 py-4"
        >
          <AppearanceTextRow
            label="multiKey"
            caption={t.sharedFontFamilyCaption}
            className={TYPOGRAPHY_ROW_CLASS}
            onPulse={() => pulse("multiKey")}
          >
            <Select
              value={sharedFontFamily || "none"}
              onValueChange={(value) => {
                pulse("multiKey");
                onSharedFontFamilyChange(value === "none" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full" aria-label="Font family">
                <SelectValue placeholder="inherit/default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(inherit/default)</SelectItem>
                {POPULAR_FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.label} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AppearanceTextRow>

          {TYPOGRAPHY_GROUPS.map((group) => (
            <AppearanceTextRow
              key={group}
              label={group}
              caption={TYPOGRAPHY_CAPTIONS[group]}
              className={TYPOGRAPHY_ROW_CLASS}
              onPulse={() => pulse(group)}
            >
              <Select
                value={typography[group].fontSize || "none"}
                onValueChange={(value) => {
                  pulse(group);
                  onTypographyChange(
                    group,
                    "fontSize",
                    value === "none" ? "" : value
                  );
                }}
              >
                <SelectTrigger className="w-full" aria-label={`${group} font size`}>
                  <SelectValue placeholder="inherit/default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(inherit/default)</SelectItem>
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size.replace("px", "pt")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AppearanceTextRow>
          ))}

          <Accordion type="single" collapsible className="rounded-none border px-3">
            <AccordionItem value="more" className="border-0">
              <AccordionTrigger>{t.moreTypographyFields}</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {TYPOGRAPHY_GROUPS.map((group) => (
                  <div
                    key={group}
                    className="space-y-3 rounded-none border p-3"
                    onFocusCapture={() => pulse(group)}
                  >
                    <p className="text-sm font-medium capitalize">{group}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>fontWeight</Label>
                        <Select
                          value={typography[group].fontWeight || "none"}
                          onValueChange={(value) => {
                            pulse(group);
                            onTypographyChange(
                              group,
                              "fontWeight",
                              value === "none" ? "" : value
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="inherit/default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">(inherit/default)</SelectItem>
                            {FONT_WEIGHT_OPTIONS.map((weight) => (
                              <SelectItem key={weight} value={weight}>
                                {weight}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${group}-letterSpacing`}>
                          letterSpacing
                        </Label>
                        <Input
                          id={`${group}-letterSpacing`}
                          value={typography[group].letterSpacing ?? ""}
                          onChange={(event) => {
                            pulse(group);
                            onTypographyChange(
                              group,
                              "letterSpacing",
                              event.target.value
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`${group}-lineHeight`}>lineHeight</Label>
                        <Input
                          id={`${group}-lineHeight`}
                          value={typography[group].lineHeight ?? ""}
                          onChange={(event) => {
                            pulse(group);
                            onTypographyChange(
                              group,
                              "lineHeight",
                              event.target.value
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </AppearanceSectionCard>
      </TabsContent>
    </Tabs>
  );
}

export { TYPOGRAPHY_GROUPS };
