/**
 * Forms — Schema-driven form factory with LLM prefill
 */

// Form factory
export { SchemaForm } from "./schema-form";
export { introspectSchema, type FieldMeta, type FieldType } from "./schema-introspect";
export { renderFieldInput, type FieldOverride, type LabeledOption } from "./field-renderer";

// LLM prefill
export { useLLMPrefill, type UseLLMPrefillOptions, type UseLLMPrefillReturn, type LLMFieldMeta } from "./use-llm-prefill";
export { LLMPrefillButton, LLMPrefillModal } from "./llm-prefill-modal";
export { extractFromText } from "./llm-prefill-action";


// Document parsing
export { parseDocument, isSupported, getFileType, normalizeText, ACCEPT_STRING, SUPPORTED_FORMATS_LABEL } from "./document-parser";
