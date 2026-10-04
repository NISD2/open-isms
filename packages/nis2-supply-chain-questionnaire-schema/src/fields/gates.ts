// Who sees which question. A supplier is asked only what fits what it reaches at its customers
// (NIS 2 Art. 21(1): measures in proportion to the exposure to risk; ENISA TIG §5.1.2: the
// sensitivity of the use). The profile questions these refer to are asked of everyone.

import type { SupplierField } from "../schema";

type Gate = NonNullable<SupplierField["visibleWhen"]>;

const yes = (field: string) => ({ field, equals: true });

/** Holds customer data or documents, electronically or on paper. */
export const PROCESSES_DATA: Gate = yes("processesCustomerData");

/** Signs in to customer systems. */
export const ACCESSES_SYSTEMS: Gate = yes("accessesCustomerSystems");

/** Enters customer premises, or holds keys, badges or codes. */
export const ACCESSES_PREMISES: Gate = yes("accessesCustomerPremises");

/** Reaches anything of the customer's: data, systems or premises. */
export const REACHES_CUSTOMER: Gate = {
  anyOf: [
    yes("processesCustomerData"),
    yes("accessesCustomerSystems"),
    yes("accessesCustomerPremises"),
  ],
};

/** Reaches anything digital: customer data or systems, or runs or ships software. */
export const REACHES_DIGITAL: Gate = {
  anyOf: [
    yes("processesCustomerData"),
    yes("accessesCustomerSystems"),
    yes("isSaas"),
    yes("isOnPrem"),
    yes("isManagedService"),
  ],
};

/** Runs IT for customers: software as a service, delivered software, or managed services. */
export const RUNS_IT: Gate = {
  anyOf: [yes("isSaas"), yes("isOnPrem"), yes("isManagedService")],
};

/** Develops software customers use: as a service or delivered. */
export const BUILDS_SOFTWARE: Gate = {
  anyOf: [yes("isSaas"), yes("isOnPrem")],
};

export const SAAS: Gate = yes("isSaas");
export const ON_PREM: Gate = yes("isOnPrem");
