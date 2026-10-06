import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AccessPanel } from "@/components/partner-contract/AccessPanel";
import { PartnerAgreement } from "@/components/partner-contract/PartnerAgreement";
import { ProductBrief } from "@/components/partner-contract/ProductBrief";
import { routing } from "@/i18n/routing";
import { SELLER } from "@/lib/billing/seller";
import { db } from "@/lib/db";
import { partnerAccessShown } from "@/lib/partner-contract/access";
import {
  partnerContractPageMessages,
  partnerContractTranslator,
} from "@/lib/partner-contract/document";
import { partnerContract } from "@/schema";

/**
 * A partner agreement, as it was offered, and the place to accept it. The token in the link is the
 * only credential, as on /supplier-access, so the page is never indexed. A withdrawn offer is gone.
 */
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

const loadOffer = cache(async (token: string) => {
  if (token.length !== 64) return null;
  const row = await db.query.partnerContract.findFirst({
    where: eq(partnerContract.token, token),
  });
  return row && !row.withdrawnAt ? row : null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const offer = await loadOffer((await params).token);
  const title = offer
    ? partnerContractTranslator(offer.locale)("partnerContract.page.metaTitle")
    : undefined;
  return { title, robots: { index: false, follow: false } };
}

export default async function PartnerAgreementPage({ params }: PageProps) {
  const { token } = await params;
  const offer = await loadOffer(token);
  if (!offer) notFound();

  const { body } = offer;
  const accepted =
    offer.signedAt && offer.signerName && offer.signerEmail
      ? { name: offer.signerName, email: offer.signerEmail, at: offer.signedAt }
      : null;
  const messages = partnerContractPageMessages(offer.locale);
  const access = await partnerAccessShown(db, offer);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">nisd2</span>
          <a
            href={`mailto:${SELLER.email}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {SELLER.email}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <ProductBrief
          locale={offer.locale}
          access={
            access ? (
              <AccessPanel
                token={token}
                locale={offer.locale}
                messages={messages}
                email={access.email}
                entry={access.entry}
                localePrefix={
                  offer.locale === routing.defaultLocale ? "" : `/${offer.locale}`
                }
                contactEmail={SELLER.email}
              />
            ) : null
          }
        />
        <PartnerAgreement
          token={token}
          locale={offer.locale}
          messages={messages}
          company={offer.partnerCompany}
          contactEmail={SELLER.email}
          seller={{ director: SELLER.director, email: SELLER.email }}
          offeredAt={offer.createdAt}
          prefill={{
            name: offer.partnerContactName ?? "",
            email: offer.partnerEmail ?? "",
          }}
          accepted={accepted}
        >
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {body.title}
          </h1>
          <div className="mt-6 space-y-2 text-[15px] leading-7">
            {body.parties.map((line, i) => (
              <p
                key={line}
                className={i % 2 === 0 ? "text-sm text-muted-foreground" : "font-medium"}
              >
                {line}
              </p>
            ))}
          </div>
          <div className="mt-10 space-y-8">
            {body.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-base font-semibold">{section.heading}</h2>
                {section.blocks.map((block) =>
                  block.kind === "text" ? (
                    <p key={block.text} className="max-w-[62ch] text-[15px] leading-7">
                      {block.text}
                    </p>
                  ) : (
                    <ul
                      key={block.items.join("|")}
                      className="max-w-[62ch] list-disc space-y-1 pl-5 text-[15px] leading-7"
                    >
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
          </div>
        </PartnerAgreement>
      </main>
    </div>
  );
}
