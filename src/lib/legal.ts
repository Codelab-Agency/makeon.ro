/** Public legal/contact configuration. Complete and approve before launch;
 * bump the terms version when publishing a materially revised document.
 */
export const legal = {
  version: "2026-10-05",
  updated: "5 octombrie 2026",
  draft: true,
  company: { name: "", cui: "", registration: "", address: "" },
  email: "contact@makeon.ro",
  phone: "+40 744 524 728",
  phoneHref: "tel:+40744524728",
  terms: "/termeni-si-conditii",
  privacy: "/politica-de-confidentialitate",
  cookies: "/politica-de-cookie-uri",
  sal: "https://reclamatiisal.anpc.ro/",
  anpc: "https://anpc.ro/",
} as const;
