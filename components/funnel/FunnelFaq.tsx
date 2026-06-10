"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqKeys = [1, 2, 3, 4, 5, 6] as const;

export function FunnelFaq() {
  const t = useTranslations("funnel");

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqKeys.map((n) => (
        <AccordionItem key={n} value={`q${n}`}>
          <AccordionTrigger>{t(`faq.q${n}`)}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t(`faq.a${n}`)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
