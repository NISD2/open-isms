import { EmailFrame } from "../components/frame";
import { CtaButton, Note, Para, Title } from "../components/parts";
import type { EmailLocale, WorkflowMailLocale } from "../locale";

/** Asked by the owner and waiting for the recipient, or done (accepted, or assigned by the operator). */
export type OwnershipNoticeKind = "requested" | "accepted" | "assigned";

export interface OwnershipTransferProps {
  readonly locale: WorkflowMailLocale;
  readonly kind: OwnershipNoticeKind;
  readonly companyName: string;
  /** The owner before. Null when the company had none left. */
  readonly fromName: string | null;
  readonly toName: string;
  /** When a request lapses, already formatted for the reader. Only for "requested". */
  readonly until: string | null;
  readonly teamUrl: string;
}

type Sentence = { readonly lead: string; readonly end: string };

export const OWNERSHIP_TRANSFER_COPY: Record<
  WorkflowMailLocale,
  {
    readonly subject: Record<
      OwnershipNoticeKind,
      (companyName: string, toName: string) => string
    >;
    readonly heading: Record<OwnershipNoticeKind, string>;
    /** The text before and after the company name, which is set in bold. */
    readonly body: Record<
      OwnershipNoticeKind,
      (p: { fromName: string | null; toName: string; until: string | null }) => Sentence
    >;
    readonly previous: (fromName: string) => string;
    readonly meaning: string;
    readonly button: string;
    readonly notYou: string;
  }
> = {
  en: {
    subject: {
      requested: (companyName) => `Ownership of ${companyName} is being handed over`,
      accepted: (companyName, toName) => `${toName} is now the owner of ${companyName}`,
      assigned: (companyName, toName) => `${toName} is now the owner of ${companyName}`,
    },
    heading: {
      requested: "Handover of ownership requested",
      accepted: "Ownership handed over",
      assigned: "New owner assigned",
    },
    body: {
      requested: ({ fromName, toName, until }) => ({
        lead: `${fromName ?? "The owner"} asked to hand ownership of `,
        end: ` to ${toName}. ${toName} can accept or decline it on the team page until ${until ?? "it lapses"}.`,
      }),
      accepted: ({ toName }) => ({
        lead: `${toName} accepted and is now the owner of `,
        end: ".",
      }),
      assigned: ({ toName }) => ({
        lead: `The team running this platform checked the request with your organization and made ${toName} the owner of `,
        end: ".",
      }),
    },
    previous: (fromName) => `The owner before was ${fromName}, who stays an admin.`,
    meaning:
      "The owner always stays an admin and cannot be removed. If the owner deletes their own account, the organization is deleted with it.",
    button: "Open the team page",
    notYou: "If you did not expect this, reply to this email.",
  },
  cs: {
    subject: {
      requested: (companyName) => `Předání vlastnictví organizace ${companyName}`,
      accepted: (companyName, toName) =>
        `Vlastníkem organizace ${companyName} je nyní ${toName}`,
      assigned: (companyName, toName) =>
        `Vlastníkem organizace ${companyName} je nyní ${toName}`,
    },
    heading: {
      requested: "Žádost o předání vlastnictví",
      accepted: "Vlastnictví předáno",
      assigned: "Určen nový vlastník",
    },
    body: {
      requested: ({ fromName, toName, until }) => ({
        lead: `Byla podána žádost o předání vlastnictví organizace `,
        end: ` od ${fromName ?? "dosavadního vlastníka"} na ${toName}. Přijmout nebo odmítnout ji lze na stránce týmu do ${until ?? "vypršení"}.`,
      }),
      accepted: ({ toName }) => ({
        lead: "Předání bylo přijato. Vlastníkem organizace ",
        end: ` je nyní ${toName}.`,
      }),
      assigned: ({ toName }) => ({
        lead: "Tým provozující tuto platformu žádost ověřil u vaší organizace. Vlastníkem organizace ",
        end: ` je nyní ${toName}.`,
      }),
    },
    previous: (fromName) => `Dosavadní vlastník ${fromName} zůstává administrátorem.`,
    meaning:
      "Vlastník je vždy administrátorem a nelze jej odebrat. Pokud vlastník smaže svůj účet, smaže se s ním i organizace.",
    button: "Otevřít stránku týmu",
    notYou: "Pokud jste to nečekali, odpovězte na tento e-mail.",
  },
};

export function ownershipTransferText(props: OwnershipTransferProps): string {
  const copy = OWNERSHIP_TRANSFER_COPY[props.locale];
  const { lead, end } = copy.body[props.kind](props);
  return [
    copy.heading[props.kind],
    "",
    `${lead}${props.companyName}${end}`,
    props.kind !== "requested" && props.fromName ? copy.previous(props.fromName) : "",
    "",
    copy.meaning,
    "",
    `${copy.button}: ${props.teamUrl}`,
    "",
    copy.notYou,
  ].join("\n");
}

/** A security notice to the old owner, the new one and the company's admins. */
export default function OwnershipTransferEmail(props: OwnershipTransferProps) {
  const copy = OWNERSHIP_TRANSFER_COPY[props.locale];
  const { lead, end } = copy.body[props.kind](props);
  return (
    <EmailFrame chrome={{ locale: props.locale }}>
      <Title>{copy.heading[props.kind]}</Title>
      <Para>
        {lead}
        <strong>{props.companyName}</strong>
        {end}
      </Para>
      {props.kind !== "requested" && props.fromName && (
        <Para>{copy.previous(props.fromName)}</Para>
      )}
      <Para>{copy.meaning}</Para>
      <CtaButton href={props.teamUrl}>{copy.button}</CtaButton>
      <Note>{copy.notYou}</Note>
    </EmailFrame>
  );
}

OwnershipTransferEmail.PreviewProps = {
  locale: "en",
  kind: "requested",
  companyName: "Stadtwerke Musterstadt",
  fromName: "Anna Beispiel",
  toName: "Jan Muster",
  until: "6 November 2026",
  teamUrl: "https://nisd2.eu/team",
} satisfies OwnershipTransferProps;

/** The code the owner types to confirm the handover, in every language the code mails exist in. */
export const OWNERSHIP_CODE_COPY: Record<
  EmailLocale,
  {
    readonly subjectPrefix: string;
    readonly heading: string;
    readonly intro: string;
    readonly expiryNote: string;
    readonly ignoreNote: string;
  }
> = {
  de: {
    subjectPrefix: "NISD2 Code für die Übergabe",
    heading: "Übergabe bestätigen",
    intro:
      "Geben Sie diesen Code auf der Teamseite ein, um die Inhaberschaft Ihrer Organisation an ein anderes Mitglied zu übergeben.",
    expiryNote: "Der Code ist 10 Minuten gültig.",
    ignoreNote:
      "Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail. Ohne den Code ändert sich nichts.",
  },
  en: {
    subjectPrefix: "NISD2 handover code",
    heading: "Confirm the handover",
    intro:
      "Enter this code on the team page to hand ownership of your organization to another member.",
    expiryNote: "The code is valid for 10 minutes.",
    ignoreNote:
      "If you did not ask for this, ignore this email. Nothing changes without the code.",
  },
  nl: {
    subjectPrefix: "NISD2 code voor de overdracht",
    heading: "Overdracht bevestigen",
    intro:
      "Voer deze code in op de teampagina om het eigendom van uw organisatie aan een ander lid over te dragen.",
    expiryNote: "De code is 10 minuten geldig.",
    ignoreNote:
      "Hebt u dit niet aangevraagd, negeer deze e-mail dan. Zonder de code verandert er niets.",
  },
  cs: {
    subjectPrefix: "NISD2 kód pro předání",
    heading: "Potvrzení předání",
    intro:
      "Zadejte tento kód na stránce týmu, abyste předali vlastnictví své organizace jinému členovi.",
    expiryNote: "Kód platí 10 minut.",
    ignoreNote:
      "Pokud jste o to nežádali, tento e-mail ignorujte. Bez kódu se nic nezmění.",
  },
};
