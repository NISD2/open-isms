import { z } from "zod";
export declare const SECTION: {
    readonly PROFILE: "profile";
    readonly SECURITY_PRACTICES: "security_practices";
    readonly SAAS_TECHNICAL: "saas_technical";
    readonly ON_PREM_TECHNICAL: "on_prem_technical";
    readonly PRO_SERVICES: "pro_services";
    readonly MANAGED_SERVICES: "managed_services";
};
export type SectionValue = typeof SECTION[keyof typeof SECTION];
export declare const sectionSchema: z.ZodNativeEnum<{
    readonly PROFILE: "profile";
    readonly SECURITY_PRACTICES: "security_practices";
    readonly SAAS_TECHNICAL: "saas_technical";
    readonly ON_PREM_TECHNICAL: "on_prem_technical";
    readonly PRO_SERVICES: "pro_services";
    readonly MANAGED_SERVICES: "managed_services";
}>;
export declare const FIELD_TYPE: {
    readonly STRING: "string";
    readonly TEXT: "text";
    readonly EMAIL: "email";
    readonly PHONE: "phone";
    readonly URL: "url";
    readonly COUNTRY: "country";
    readonly BOOLEAN: "boolean";
    readonly ENUM: "enum";
    readonly INTEGER: "integer";
};
export type FieldTypeValue = typeof FIELD_TYPE[keyof typeof FIELD_TYPE];
export declare const fieldTypeSchema: z.ZodNativeEnum<{
    readonly STRING: "string";
    readonly TEXT: "text";
    readonly EMAIL: "email";
    readonly PHONE: "phone";
    readonly URL: "url";
    readonly COUNTRY: "country";
    readonly BOOLEAN: "boolean";
    readonly ENUM: "enum";
    readonly INTEGER: "integer";
}>;
export declare const supplierFieldSchema: z.ZodObject<{
    id: z.ZodString;
    section: z.ZodNativeEnum<{
        readonly PROFILE: "profile";
        readonly SECURITY_PRACTICES: "security_practices";
        readonly SAAS_TECHNICAL: "saas_technical";
        readonly ON_PREM_TECHNICAL: "on_prem_technical";
        readonly PRO_SERVICES: "pro_services";
        readonly MANAGED_SERVICES: "managed_services";
    }>;
    type: z.ZodNativeEnum<{
        readonly STRING: "string";
        readonly TEXT: "text";
        readonly EMAIL: "email";
        readonly PHONE: "phone";
        readonly URL: "url";
        readonly COUNTRY: "country";
        readonly BOOLEAN: "boolean";
        readonly ENUM: "enum";
        readonly INTEGER: "integer";
    }>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodObject<{
            en: z.ZodString;
            de: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            en: string;
            de: string;
        }, {
            en: string;
            de: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }, {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }>, "many">>;
    label: z.ZodObject<{
        en: z.ZodString;
        de: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        en: string;
        de: string;
    }, {
        en: string;
        de: string;
    }>;
    description: z.ZodObject<{
        en: z.ZodString;
        de: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        en: string;
        de: string;
    }, {
        en: string;
        de: string;
    }>;
    /**
     * Primary citation, stable form:
     *   "NIS2 Art. 21(2)(j)"
     *   "CIR 2024/2690 §5.1.4(d)"
     *   "ENISA TIG §5.1.2"
     *   "GDPR Art. 28"
     *
     * Anchored to EU-level instruments only — the directive, the
     * implementing regulation, and ENISA's technical guidance. National
     * derivatives (BSI IT-Grundschutz, ANSSI, CCB CyFun, etc.) are
     * downstream and live in their own extension repos.
     */
    legalBasis: z.ZodString;
    required: z.ZodBoolean;
    visibleWhen: z.ZodOptional<z.ZodObject<{
        field: z.ZodString;
        equals: z.ZodUnion<[z.ZodBoolean, z.ZodString, z.ZodNumber]>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        equals: string | number | boolean;
    }, {
        field: string;
        equals: string | number | boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
    label: {
        en: string;
        de: string;
    };
    id: string;
    section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
    description: {
        en: string;
        de: string;
    };
    legalBasis: string;
    required: boolean;
    options?: {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }[] | undefined;
    visibleWhen?: {
        field: string;
        equals: string | number | boolean;
    } | undefined;
}, {
    type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
    label: {
        en: string;
        de: string;
    };
    id: string;
    section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
    description: {
        en: string;
        de: string;
    };
    legalBasis: string;
    required: boolean;
    options?: {
        value: string;
        label: {
            en: string;
            de: string;
        };
    }[] | undefined;
    visibleWhen?: {
        field: string;
        equals: string | number | boolean;
    } | undefined;
}>;
export declare const supplierQuestionnaireSchema: z.ZodObject<{
    version: z.ZodString;
    lastUpdated: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        section: z.ZodNativeEnum<{
            readonly PROFILE: "profile";
            readonly SECURITY_PRACTICES: "security_practices";
            readonly SAAS_TECHNICAL: "saas_technical";
            readonly ON_PREM_TECHNICAL: "on_prem_technical";
            readonly PRO_SERVICES: "pro_services";
            readonly MANAGED_SERVICES: "managed_services";
        }>;
        type: z.ZodNativeEnum<{
            readonly STRING: "string";
            readonly TEXT: "text";
            readonly EMAIL: "email";
            readonly PHONE: "phone";
            readonly URL: "url";
            readonly COUNTRY: "country";
            readonly BOOLEAN: "boolean";
            readonly ENUM: "enum";
            readonly INTEGER: "integer";
        }>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodObject<{
                en: z.ZodString;
                de: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                en: string;
                de: string;
            }, {
                en: string;
                de: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }, {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }>, "many">>;
        label: z.ZodObject<{
            en: z.ZodString;
            de: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            en: string;
            de: string;
        }, {
            en: string;
            de: string;
        }>;
        description: z.ZodObject<{
            en: z.ZodString;
            de: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            en: string;
            de: string;
        }, {
            en: string;
            de: string;
        }>;
        /**
         * Primary citation, stable form:
         *   "NIS2 Art. 21(2)(j)"
         *   "CIR 2024/2690 §5.1.4(d)"
         *   "ENISA TIG §5.1.2"
         *   "GDPR Art. 28"
         *
         * Anchored to EU-level instruments only — the directive, the
         * implementing regulation, and ENISA's technical guidance. National
         * derivatives (BSI IT-Grundschutz, ANSSI, CCB CyFun, etc.) are
         * downstream and live in their own extension repos.
         */
        legalBasis: z.ZodString;
        required: z.ZodBoolean;
        visibleWhen: z.ZodOptional<z.ZodObject<{
            field: z.ZodString;
            equals: z.ZodUnion<[z.ZodBoolean, z.ZodString, z.ZodNumber]>;
        }, "strip", z.ZodTypeAny, {
            field: string;
            equals: string | number | boolean;
        }, {
            field: string;
            equals: string | number | boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
        label: {
            en: string;
            de: string;
        };
        id: string;
        section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
        description: {
            en: string;
            de: string;
        };
        legalBasis: string;
        required: boolean;
        options?: {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }[] | undefined;
        visibleWhen?: {
            field: string;
            equals: string | number | boolean;
        } | undefined;
    }, {
        type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
        label: {
            en: string;
            de: string;
        };
        id: string;
        section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
        description: {
            en: string;
            de: string;
        };
        legalBasis: string;
        required: boolean;
        options?: {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }[] | undefined;
        visibleWhen?: {
            field: string;
            equals: string | number | boolean;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: string;
    lastUpdated: string;
    fields: {
        type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
        label: {
            en: string;
            de: string;
        };
        id: string;
        section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
        description: {
            en: string;
            de: string;
        };
        legalBasis: string;
        required: boolean;
        options?: {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }[] | undefined;
        visibleWhen?: {
            field: string;
            equals: string | number | boolean;
        } | undefined;
    }[];
}, {
    version: string;
    lastUpdated: string;
    fields: {
        type: "string" | "boolean" | "text" | "email" | "phone" | "url" | "country" | "enum" | "integer";
        label: {
            en: string;
            de: string;
        };
        id: string;
        section: "profile" | "security_practices" | "saas_technical" | "on_prem_technical" | "pro_services" | "managed_services";
        description: {
            en: string;
            de: string;
        };
        legalBasis: string;
        required: boolean;
        options?: {
            value: string;
            label: {
                en: string;
                de: string;
            };
        }[] | undefined;
        visibleWhen?: {
            field: string;
            equals: string | number | boolean;
        } | undefined;
    }[];
}>;
export declare const supplierResponseSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodBoolean, z.ZodNumber, z.ZodNull]>>;
export type SupplierField = z.infer<typeof supplierFieldSchema>;
export type SupplierQuestionnaire = z.infer<typeof supplierQuestionnaireSchema>;
export type SupplierResponse = z.infer<typeof supplierResponseSchema>;
//# sourceMappingURL=schema.d.ts.map