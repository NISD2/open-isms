import { classificationFields } from "./classification";
import { descriptionFields } from "./description";
import { timingFields } from "./timing";
import { geographicFields } from "./geographic";
import { causationFields } from "./causation";
import { impactFields } from "./impact";
import { responseFields } from "./response";
import { contactFields } from "./contact";
import { customerNotificationFields } from "./customer-notification";
import type { IncidentField } from "../schema";

export const allIncidentFields: ReadonlyArray<IncidentField> = [
  ...classificationFields,
  ...descriptionFields,
  ...timingFields,
  ...geographicFields,
  ...causationFields,
  ...impactFields,
  ...responseFields,
  ...contactFields,
  ...customerNotificationFields,
];
