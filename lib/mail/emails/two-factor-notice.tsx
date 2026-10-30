import { EmailFrame } from "../components/frame";
import { Note, Para, Title } from "../components/parts";
import type { WorkflowMailLocale } from "../locale";

/** What happened to the person's second factor. */
export type TwoFactorNoticeKind = "enabled" | "disabled" | "failures" | "locked";

export interface TwoFactorNoticeProps {
  readonly locale: WorkflowMailLocale;
  readonly kind: TwoFactorNoticeKind;
  readonly host: string;
  /** An address a person reads (replyAddress), never the no-reply sender. */
  readonly contact: string;
}

type Copy = { readonly subject: string; readonly heading: string; readonly body: string };

export const TWO_FACTOR_NOTICE_COPY: Record<
  WorkflowMailLocale,
  Record<TwoFactorNoticeKind, (host: string) => Copy> & {
    readonly notYou: (contact: string) => string;
  }
> = {
  en: {
    enabled: (host) => ({
      subject: `Two-factor sign-in is on for your account at ${host}`,
      heading: "Two-factor sign-in turned on",
      body: `An authenticator app was set up for your account at ${host}. From now on a password sign-in also asks for a code from that app. Every other session of yours was signed out.`,
    }),
    disabled: (host) => ({
      subject: `Two-factor sign-in is off for your account at ${host}`,
      heading: "Two-factor sign-in turned off",
      body: `The authenticator app was removed from your account at ${host}. A password sign-in no longer asks for a code. Every other session of yours was signed out.`,
    }),
    failures: (host) => ({
      subject: `Wrong sign-in codes for your account at ${host}`,
      heading: "Ten wrong codes in a row",
      body: `Someone entered your password at ${host} correctly and then ten wrong codes in a row. If that was not you, your password is known to someone else: change it now.`,
    }),
    locked: (host) => ({
      subject: `Sign-in codes paused for your account at ${host}`,
      heading: "Codes from the app paused",
      body: `After one hundred wrong codes in a row, ${host} no longer accepts codes from your app. Sign in with one of your recovery codes, which also ends the pause, and change your password.`,
    }),
    notYou: (contact) => `If this was not you or you need help, write to ${contact}.`,
  },
  cs: {
    enabled: (host) => ({
      subject: `Dvoufázové přihlášení je pro váš účet na ${host} zapnuté`,
      heading: "Dvoufázové přihlášení zapnuto",
      body: `K vašemu účtu na ${host} byla nastavena ověřovací aplikace. Přihlášení heslem bude nově vyžadovat i kód z této aplikace. Všechna vaše ostatní přihlášení byla ukončena.`,
    }),
    disabled: (host) => ({
      subject: `Dvoufázové přihlášení je pro váš účet na ${host} vypnuté`,
      heading: "Dvoufázové přihlášení vypnuto",
      body: `Ověřovací aplikace byla z vašeho účtu na ${host} odebrána. Přihlášení heslem už kód nevyžaduje. Všechna vaše ostatní přihlášení byla ukončena.`,
    }),
    failures: (host) => ({
      subject: `Chybné přihlašovací kódy k vašemu účtu na ${host}`,
      heading: "Deset chybných kódů za sebou",
      body: `Někdo na ${host} zadal správně vaše heslo a pak desetkrát za sebou chybný kód. Pokud jste to nebyli vy, zná vaše heslo někdo jiný: změňte ho hned.`,
    }),
    locked: (host) => ({
      subject: `Kódy pro přihlášení k vašemu účtu na ${host} jsou pozastavené`,
      heading: "Kódy z aplikace pozastaveny",
      body: `Po stu chybných kódech za sebou ${host} kódy z vaší aplikace nepřijímá. Přihlaste se jedním ze záložních kódů, čímž pozastavení skončí, a změňte heslo.`,
    }),
    notYou: (contact) =>
      `Pokud jste to nebyli vy nebo potřebujete pomoc, napište na ${contact}.`,
  },
};

/** A security notice about the person's own second factor. */
export default function TwoFactorNoticeEmail({
  locale,
  kind,
  host,
  contact,
}: TwoFactorNoticeProps) {
  const copy = TWO_FACTOR_NOTICE_COPY[locale];
  const text = copy[kind](host);
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{text.heading}</Title>
      <Para>{text.body}</Para>
      <Note>{copy.notYou(contact)}</Note>
    </EmailFrame>
  );
}

TwoFactorNoticeEmail.PreviewProps = {
  locale: "en",
  kind: "failures",
  host: "nisd2.eu",
  contact: "contact@example.com",
} satisfies TwoFactorNoticeProps;
