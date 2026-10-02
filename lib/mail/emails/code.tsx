import { EmailFrame } from "../components/frame";
import { CodeBlock, Para, Title } from "../components/parts";
import { BRAND } from "../layout";
import type { EmailLocale } from "../locale";

export interface CodeProps {
  readonly locale: EmailLocale;
  readonly heading: string;
  readonly intro: string;
  readonly code: string;
  readonly expiryNote: string;
  readonly ignoreNote: string;
}

/** A one-time code: to verify an address at sign-up, or to reset a password. */
export default function CodeEmail({
  locale,
  heading,
  intro,
  code,
  expiryNote,
  ignoreNote,
}: CodeProps) {
  return (
    <EmailFrame chrome={{ locale }}>
      <Title>{heading}</Title>
      <Para>{intro}</Para>
      <CodeBlock code={code} />
      <p
        style={{
          color: BRAND.mutedForeground,
          fontSize: "13px",
          margin: "16px 0 0",
          lineHeight: 1.5,
        }}
      >
        {expiryNote} {ignoreNote}
      </p>
    </EmailFrame>
  );
}

CodeEmail.PreviewProps = {
  locale: "de",
  heading: "E-Mail bestätigen",
  intro:
    "Bitte gib diesen Code in der Anmeldung ein, um deine E-Mail-Adresse zu bestätigen.",
  code: "482913",
  expiryNote: "Der Code ist 10 Minuten gültig.",
  ignoreNote: "Falls du dich nicht registriert hast, ignoriere diese E-Mail.",
} satisfies CodeProps;
