export const eventServices = {
  trailer: "Evenimente private — rulotă",
  bar: "Evenimente private — bar mobil",
};

export const isEventService = (selection: string) =>
  Object.values(eventServices).includes(selection);

export const serviceOptions = [
  "Cafea + apă",
  "Cafea și espressoare",
  "Abonament de cafea",
  "Abonament Vero Aqua — 31 € + TVA/lună",
  "Filtre pentru apă și cafea",
  "Prăjire și blenduri personalizate",
  "Cafea de probă",
  "Cafea pentru espresso sau filtru",
  "Consultanță pentru filtrarea apei",
  "Instalare sistem de filtrare",
  "Schimb filtre și mentenanță",
  ...Object.values(eventServices),
];

export function normalizeService(selection: string): string {
  if (serviceOptions.includes(selection)) return selection;
  if (/blend|prăjire/i.test(selection))
    return "Prăjire și blenduri personalizate";
  if (/probă/i.test(selection)) return "Cafea de probă";
  if (/consult/i.test(selection)) return "Consultanță pentru filtrarea apei";
  if (/instal/i.test(selection)) return "Instalare sistem de filtrare";
  if (/mentenanță/i.test(selection)) return "Schimb filtre și mentenanță";
  if (/filtr|espressor/i.test(selection)) return "Filtre pentru apă și cafea";
  if (/Vero|31|Totul inclus/i.test(selection))
    return "Abonament Vero Aqua — 31 € + TVA/lună";
  if (/abonament|Ritualul/i.test(selection)) return "Abonament de cafea";
  if (/aleg cafeaua/i.test(selection))
    return "Cafea pentru espresso sau filtru";
  if (/cafea|Barista/i.test(selection)) return "Cafea și espressoare";
  return "Cafea + apă";
}
