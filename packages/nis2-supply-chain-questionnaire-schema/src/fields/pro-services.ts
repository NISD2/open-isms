// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const proServicesFields: SupplierField[] = [
  {
    id: "proServicesNdaInPlace",
    section: "pro_services",
    type: "boolean",
    label: {
      en: "NDA in place with all consultants",
      de: "NDA mit allen Beratern abgeschlossen",
      fr: "NDA conclu avec tous les consultants",
      it: "NDA stipulato con tutti i consulenti",
      es: "NDA firmado con todos los consultores",
      pl: "NDA zawarte ze wszystkimi konsultantami",
      cs: "NDA uzavřené se všemi konzultanty",
      pt: "NDA celebrado com todos os consultores",
      ro: "NDA încheiat cu toți consultanții",
    },
    description: {
      en: "Tick yes if every consultant signs a confidentiality agreement before being assigned to customer work. Either as part of the employment contract or as a separate NDA.",
      de: "Ja, wenn jeder Berater vor dem Einsatz beim Kunden eine Vertraulichkeitsvereinbarung unterschreibt. Entweder als Bestandteil des Arbeitsvertrags oder als separates NDA.",
      fr: "Cochez oui si chaque consultant signe un accord de confidentialité avant d'être affecté à une mission client. Soit dans le cadre du contrat de travail, soit sous la forme d'un NDA distinct.",
      it: "Selezionare sì se ogni consulente firma un accordo di riservatezza prima di essere assegnato al lavoro presso il cliente. Come parte del contratto di lavoro oppure come NDA separato.",
      es: "Marque sí si cada consultor firma un acuerdo de confidencialidad antes de ser asignado al trabajo con el cliente. Ya sea como parte del contrato laboral o como un NDA independiente.",
      pl: "Zaznacz tak, jeśli każdy konsultant podpisuje umowę o zachowaniu poufności przed przydzieleniem do pracy u klienta. Jako część umowy o pracę albo jako odrębne NDA.",
      cs: "Zaškrtněte ano, pokud každý konzultant podepíše dohodu o mlčenlivosti před přidělením k práci u zákazníka. Buď jako součást pracovní smlouvy, nebo jako samostatné NDA.",
      pt: "Assinale sim se cada consultor assinar um acordo de confidencialidade antes de ser afetado ao trabalho com o cliente. Quer como parte do contrato de trabalho, quer como um NDA separado.",
      ro: "Bifați da dacă fiecare consultant semnează un acord de confidențialitate înainte de a fi repartizat la activitatea pentru client. Fie ca parte a contractului de muncă, fie ca un NDA separat.",
    },
    legalBasis: "ENISA TIG §5.1.4",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
  {
    id: "proServicesCustomerPremisesPolicy",
    section: "pro_services",
    type: "boolean",
    label: {
      en: "Documented customer-premises behaviour policy",
      de: "Dokumentierte Verhaltensrichtlinie auf Kundenstandort",
      fr: "Politique de comportement documentée sur le site du client",
      it: "Politica di comportamento documentata presso la sede del cliente",
      es: "Política de conducta documentada en las instalaciones del cliente",
      pl: "Udokumentowana polityka zachowania w siedzibie klienta",
      cs: "Dokumentovaná pravidla chování v prostorách zákazníka",
      pt: "Política de conduta documentada nas instalações do cliente",
      ro: "Politică de conduită documentată la sediul clientului",
    },
    description: {
      en: "Tick yes if you have a written code of conduct for consultants working on customer premises: badge handling, locked-screen rule, what to do if data leaves the site.",
      de: "Ja, wenn Sie eine schriftliche Verhaltensrichtlinie für Berater im Kundeneinsatz haben: Umgang mit Ausweisen, Sperrbildschirm-Pflicht, Verhalten beim Datenexport vom Standort.",
      fr: "Cochez oui si vous disposez d'un code de conduite écrit pour les consultants travaillant sur le site du client : gestion des badges, règle de verrouillage de l'écran, conduite à tenir si des données quittent le site.",
      it: "Selezionare sì se si dispone di un codice di condotta scritto per i consulenti che operano presso la sede del cliente: gestione dei badge, obbligo di blocco dello schermo, comportamento da tenere se i dati lasciano la sede.",
      es: "Marque sí si dispone de un código de conducta escrito para los consultores que trabajan en las instalaciones del cliente: gestión de credenciales, regla de bloqueo de pantalla, qué hacer si los datos salen del emplazamiento.",
      pl: "Zaznacz tak, jeśli masz pisemny kodeks postępowania dla konsultantów pracujących w siedzibie klienta: obsługa identyfikatorów, obowiązek blokowania ekranu, postępowanie w przypadku wyniesienia danych z lokalizacji.",
      cs: "Zaškrtněte ano, pokud máte písemný kodex chování pro konzultanty pracující v prostorách zákazníka: zacházení s průkazy, povinnost zamykání obrazovky, postup při vynesení dat z lokality.",
      pt: "Assinale sim se dispuser de um código de conduta escrito para os consultores que trabalham nas instalações do cliente: gestão de cartões de acesso, regra de bloqueio de ecrã, o que fazer se os dados saírem do local.",
      ro: "Bifați da dacă dispuneți de un cod de conduită scris pentru consultanții care lucrează la sediul clientului: gestionarea ecusoanelor, regula de blocare a ecranului, ce trebuie făcut dacă datele părăsesc locația.",
    },
    legalBasis: "ENISA TIG §5.1.4",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
];
