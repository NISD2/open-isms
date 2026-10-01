/**
 * Who sells the licence and issues the invoice: the company behind nisd2.eu, as entered in the
 * commercial register. The order page's invoice preview and the structured data print it from
 * here; the legal pages state the same facts in their own sentences (messages/info, messages/billing).
 */
export const SELLER = {
  name: "Kardashev Catalyst UG (haftungsbeschränkt)",
  street: "Trierer Str. 6",
  city: "50676 Köln",
  register: "Amtsgericht Köln, HRB 126993",
  vatId: "DE462889433",
} as const;
