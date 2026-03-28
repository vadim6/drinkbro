import menuData from "@/menu.json";

export type CustomizationType = "toggle" | "select";

export interface CustomizationDef {
  label: string;
  type: CustomizationType;
  default: boolean | string;
  options?: string[];
}

export interface DrinkDef {
  id: string;
  name: string;
  emoji: string;
  customizations: string[];
}

export interface Menu {
  customizations: Record<string, CustomizationDef>;
  drinks: DrinkDef[];
}

export const menu = menuData as Menu;

export function getDrinkCustomizations(
  drink: DrinkDef
): Array<{ id: string } & CustomizationDef> {
  return drink.customizations
    .map((id) => {
      const def = menu.customizations[id];
      if (!def) return null;
      return { id, ...def };
    })
    .filter(Boolean) as Array<{ id: string } & CustomizationDef>;
}

export function defaultCustomizations(
  drink: DrinkDef
): Record<string, boolean | string> {
  const result: Record<string, boolean | string> = {};
  for (const id of drink.customizations) {
    const def = menu.customizations[id];
    if (def) result[id] = def.default;
  }
  return result;
}
