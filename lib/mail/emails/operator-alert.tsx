import { EmailFrame } from "../components/frame";
import { BRAND, TO_OPERATORS } from "../layout";

export interface OperatorAlertProps {
  readonly lines: readonly string[];
}

/**
 * To the operators: an order, invoice or erasure a person has to finish by hand. Plain facts, one
 * per line; the subject says which kind ([RECHNUNG], [DSGVO]).
 */
export default function OperatorAlertEmail({ lines }: OperatorAlertProps) {
  return (
    <EmailFrame chrome={TO_OPERATORS}>
      {lines.map((line) => (
        <p
          key={line}
          style={{ color: BRAND.foreground, fontSize: "14px", margin: "0 0 8px" }}
        >
          {line}
        </p>
      ))}
    </EmailFrame>
  );
}

OperatorAlertEmail.PreviewProps = {
  lines: [
    "Die Rechnung RE-2026-0012 war bezahlt und ist mit der Gutschrift GS-2026-0003 storniert.",
    "5.712,00 € bis 31. Oktober 2026 in Qonto auf das Konto zurücküberweisen, von dem die Zahlung kam.",
  ],
} satisfies OperatorAlertProps;
