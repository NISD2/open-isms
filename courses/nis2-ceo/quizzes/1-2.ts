import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.2",
  passingScore: 75,
  questions: [
    {
      id: "1.2.1",
      question: {
        en: "What is the size threshold for most companies to fall in scope of NIS2?",
        de: "Ab welcher Unternehmensgröße fallen die meisten Unternehmen in den Anwendungsbereich von NIS2?",
        nl: "Wat is de drempelwaarde voor de omvang van bedrijven om onder de reikwijdte van NIS2 te vallen?",
        fr: "Quel est le seuil de taille à partir duquel la plupart des entreprises entrent dans le champ d'application de NIS2 ?",
        it: "Qual è la soglia dimensionale per cui la maggior parte delle imprese rientra nell'ambito di applicazione di NIS2?",
        es: "¿Cuál es el umbral de tamaño para que la mayoría de las empresas entren en el ámbito de aplicación de NIS2?",
        pl: "Jaki próg wielkości powoduje, że większość firm wchodzi w zakres NIS2?",
      },
      options: [
        { en: "250 or more employees, or 50 million euros in turnover", de: "250 oder mehr Beschäftigte oder 50 Millionen Euro Umsatz", nl: "250 of meer werknemers, of 50 miljoen euro omzet", fr: "250 employés ou plus, ou 50 millions d'euros de chiffre d'affaires", it: "250 o più dipendenti, oppure 50 milioni di euro di fatturato", es: "250 empleados o más, o 50 millones de euros de facturación", pl: "250 lub więcej pracowników albo 50 milionów euro obrotu" },
        { en: "50 or more employees, or more than 10 million euros in annual turnover", de: "50 oder mehr Beschäftigte oder mehr als 10 Millionen Euro Jahresumsatz", nl: "50 of meer werknemers, of meer dan 10 miljoen euro jaaromzet", fr: "50 employés ou plus, ou plus de 10 millions d'euros de chiffre d'affaires annuel", it: "50 o più dipendenti, oppure più di 10 milioni di euro di fatturato annuo", es: "50 empleados o más, o más de 10 millones de euros de facturación anual", pl: "50 lub więcej pracowników albo ponad 10 milionów euro rocznego obrotu" },
        { en: "10 or more employees, or more than 1 million euros in annual turnover", de: "10 oder mehr Beschäftigte oder mehr als 1 Million Euro Jahresumsatz", nl: "10 of meer werknemers, of meer dan 1 miljoen euro jaaromzet", fr: "10 employés ou plus, ou plus de 1 million d'euros de chiffre d'affaires annuel", it: "10 o più dipendenti, oppure più di 1 milione di euro di fatturato annuo", es: "10 empleados o más, o más de 1 millón de euros de facturación anual", pl: "10 lub więcej pracowników albo ponad 1 milion euro rocznego obrotu" },
        { en: "100 or more employees, or more than 25 million euros in annual turnover", de: "100 oder mehr Beschäftigte oder mehr als 25 Millionen Euro Jahresumsatz", nl: "100 of meer werknemers, of meer dan 25 miljoen euro jaaromzet", fr: "100 employés ou plus, ou plus de 25 millions d'euros de chiffre d'affaires annuel", it: "100 o più dipendenti, oppure più di 25 milioni di euro di fatturato annuo", es: "100 empleados o más, o más de 25 millones de euros de facturación anual", pl: "100 lub więcej pracowników albo ponad 25 milionów euro rocznego obrotu" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Most companies enter scope through fifty or more employees, or more than ten million euros in annual turnover.",
        de: "Die meisten Unternehmen fallen ab fünfzig oder mehr Beschäftigten oder mehr als zehn Millionen Euro Jahresumsatz in den Anwendungsbereich.",
        nl: "De meeste bedrijven vallen binnen de reikwijdte met vijftig of meer werknemers, of meer dan tien miljoen euro jaaromzet.",
        fr: "La plupart des entreprises entrent dans le champ d'application à partir de cinquante employés ou plus, ou de plus de dix millions d'euros de chiffre d'affaires annuel.",
        it: "La maggior parte delle imprese rientra nell'ambito di applicazione a partire da cinquanta o più dipendenti, oppure da più di dieci milioni di euro di fatturato annuo.",
        es: "La mayoría de las empresas entran en el ámbito de aplicación a partir de cincuenta empleados o más, o de más de diez millones de euros de facturación anual.",
        pl: "Większość firm wchodzi w zakres przy pięćdziesięciu lub więcej pracownikach albo przy ponad dziesięciu milionach euro rocznego obrotu.",
      },
    },
    {
      id: "1.2.2",
      question: {
        en: "What is the key difference between Essential and Important entities?",
        de: "Was ist der wesentliche Unterschied zwischen wesentlichen und wichtigen Einrichtungen?",
        nl: "Wat is het belangrijkste verschil tussen essentiële entiteiten en belangrijke entiteiten?",
        fr: "Quelle est la principale différence entre les entités essentielles et les entités importantes ?",
        it: "Qual è la differenza principale tra soggetti essenziali e soggetti importanti?",
        es: "¿Cuál es la diferencia clave entre las entidades esenciales y las entidades importantes?",
        pl: "Jaka jest kluczowa różnica między podmiotami kluczowymi a podmiotami ważnymi?",
      },
      options: [
        { en: "Essential entities must implement all ten measures; Important entities only implement five", de: "Wesentliche Einrichtungen müssen alle zehn Maßnahmen umsetzen; wichtige Einrichtungen nur fünf", nl: "Essentiële entiteiten moeten alle tien maatregelen implementeren; belangrijke entiteiten slechts vijf", fr: "Les entités essentielles doivent mettre en œuvre les dix mesures ; les entités importantes n'en mettent en œuvre que cinq", it: "I soggetti essenziali devono attuare tutte e dieci le misure; i soggetti importanti ne attuano solo cinque", es: "Las entidades esenciales deben implementar las diez medidas; las entidades importantes solo implementan cinco", pl: "Podmioty kluczowe muszą wdrożyć wszystkie dziesięć środków; podmioty ważne wdrażają tylko pięć" },
        { en: "Essential entities face proactive supervision (audit without cause); Important entities face reactive supervision (audit only when triggered)", de: "Wesentliche Einrichtungen unterliegen proaktiver Aufsicht (Prüfung ohne Anlass); wichtige Einrichtungen unterliegen reaktiver Aufsicht (Prüfung nur bei konkretem Anlass)", nl: "Essentiële entiteiten staan onder proactief toezicht (audit zonder aanleiding); belangrijke entiteiten staan onder reactief toezicht (audit alleen bij aanleiding)", fr: "Les entités essentielles font l'objet d'une surveillance proactive (audit sans motif) ; les entités importantes font l'objet d'une surveillance réactive (audit uniquement en cas de déclencheur)", it: "I soggetti essenziali sono soggetti a vigilanza proattiva (verifica senza motivo); i soggetti importanti sono soggetti a vigilanza reattiva (verifica solo in presenza di un motivo specifico)", es: "Las entidades esenciales están sujetas a supervisión proactiva (auditoría sin causa); las entidades importantes están sujetas a supervisión reactiva (auditoría solo cuando hay un motivo)", pl: "Podmioty kluczowe podlegają nadzorowi proaktywnemu (audyt bez przyczyny); podmioty ważne podlegają nadzorowi reaktywnemu (audyt tylko po wystąpieniu przesłanki)" },
        { en: "Important entities face higher fines than Essential entities", de: "Wichtige Einrichtungen müssen höhere Bußgelder zahlen als wesentliche Einrichtungen", nl: "Belangrijke entiteiten krijgen hogere boetes dan essentiële entiteiten", fr: "Les entités importantes encourent des amendes plus élevées que les entités essentielles", it: "I soggetti importanti subiscono sanzioni più elevate rispetto ai soggetti essenziali", es: "Las entidades importantes se enfrentan a multas más elevadas que las entidades esenciales", pl: "Podmioty ważne podlegają wyższym karom niż podmioty kluczowe" },
        { en: "Essential entities are in Annex II; Important entities are in Annex I", de: "Wesentliche Einrichtungen stehen in Anhang II; wichtige Einrichtungen in Anhang I", nl: "Essentiële entiteiten staan in Bijlage II; belangrijke entiteiten staan in Bijlage I", fr: "Les entités essentielles figurent à l'annexe II ; les entités importantes figurent à l'annexe I", it: "I soggetti essenziali sono nell'allegato II; i soggetti importanti sono nell'allegato I", es: "Las entidades esenciales figuran en el anexo II; las entidades importantes figuran en el anexo I", pl: "Podmioty kluczowe są w załączniku II; podmioty ważne są w załączniku I" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The substantive obligations apply equally. The difference is enforcement intensity: Essential entities face proactive supervision, Important entities face reactive supervision.",
        de: "Die inhaltlichen Pflichten gelten gleichermaßen. Der Unterschied liegt in der Aufsichtsintensität: Wesentliche Einrichtungen unterliegen proaktiver Aufsicht, wichtige Einrichtungen reaktiver Aufsicht.",
        nl: "De inhoudelijke verplichtingen gelden voor beiden gelijkelijk. Het verschil zit in de handhavingsintensiteit: essentiële entiteiten staan onder proactief toezicht, belangrijke entiteiten onder reactief toezicht.",
        fr: "Les obligations de fond s'appliquent de la même manière. La différence réside dans l'intensité du contrôle : les entités essentielles font l'objet d'une surveillance proactive, les entités importantes d'une surveillance réactive.",
        it: "Gli obblighi sostanziali si applicano allo stesso modo. La differenza sta nell'intensità della vigilanza: i soggetti essenziali sono soggetti a vigilanza proattiva, i soggetti importanti a vigilanza reattiva.",
        es: "Las obligaciones sustantivas se aplican por igual. La diferencia está en la intensidad de la supervisión: las entidades esenciales están sujetas a supervisión proactiva, las entidades importantes a supervisión reactiva.",
        pl: "Obowiązki merytoryczne mają zastosowanie w jednakowym stopniu. Różnica polega na intensywności nadzoru: podmioty kluczowe podlegają nadzorowi proaktywnemu, a podmioty ważne nadzorowi reaktywnemu.",
      },
    },
    {
      id: "1.2.3",
      question: {
        en: "Do Essential and Important entities have to implement different security measures?",
        de: "Müssen wesentliche und wichtige Einrichtungen unterschiedliche Sicherheitsmaßnahmen umsetzen?",
        nl: "Moeten essentiële entiteiten en belangrijke entiteiten verschillende beveiligingsmaatregelen implementeren?",
        fr: "Les entités essentielles et les entités importantes doivent-elles mettre en œuvre des mesures de sécurité différentes ?",
        it: "I soggetti essenziali e i soggetti importanti devono attuare misure di sicurezza diverse?",
        es: "¿Tienen las entidades esenciales y las entidades importantes que implementar medidas de seguridad diferentes?",
        pl: "Czy podmioty kluczowe i podmioty ważne muszą wdrażać różne środki bezpieczeństwa?",
      },
      options: [
        { en: "Yes, Essential entities have stricter technical requirements", de: "Ja, wesentliche Einrichtungen haben strengere technische Anforderungen", nl: "Ja, essentiële entiteiten hebben strengere technische vereisten", fr: "Oui, les entités essentielles ont des exigences techniques plus strictes", it: "Sì, i soggetti essenziali hanno requisiti tecnici più rigorosi", es: "Sí, las entidades esenciales tienen requisitos técnicos más estrictos", pl: "Tak, podmioty kluczowe mają surowsze wymagania techniczne" },
        { en: "Yes, Important entities have additional reporting duties", de: "Ja, wichtige Einrichtungen haben zusätzliche Meldepflichten", nl: "Ja, belangrijke entiteiten hebben aanvullende meldingsverplichtingen", fr: "Oui, les entités importantes ont des obligations de notification supplémentaires", it: "Sì, i soggetti importanti hanno obblighi di notifica aggiuntivi", es: "Sí, las entidades importantes tienen obligaciones de notificación adicionales", pl: "Tak, podmioty ważne mają dodatkowe obowiązki w zakresie zgłaszania" },
        { en: "No, both must implement the same ten measures under Article 21", de: "Nein, beide müssen die gleichen zehn Maßnahmen nach Artikel 21 umsetzen", nl: "Nee, beide moeten dezelfde tien maatregelen implementeren op grond van Artikel 21", fr: "Non, les deux doivent mettre en œuvre les mêmes dix mesures au titre de l'article 21", it: "No, entrambi devono attuare le stesse dieci misure ai sensi dell'articolo 21", es: "No, ambas deben implementar las mismas diez medidas en virtud del artículo 21", pl: "Nie, oba muszą wdrożyć te same dziesięć środków na podstawie artykułu 21" },
        { en: "No measures apply to Important entities", de: "Für wichtige Einrichtungen gelten keine Maßnahmen", nl: "Er gelden geen maatregelen voor belangrijke entiteiten", fr: "Aucune mesure ne s'applique aux entités importantes", it: "Nessuna misura si applica ai soggetti importanti", es: "No se aplica ninguna medida a las entidades importantes", pl: "Do podmiotów ważnych nie mają zastosowania żadne środki" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The ten measures under Article 21 apply equally to both categories. The difference is enforcement intensity, not compliance scope.",
        de: "Die zehn Maßnahmen nach Artikel 21 gelten gleichermaßen für beide Kategorien. Der Unterschied liegt in der Aufsichtsintensität, nicht im Umfang der Pflichten.",
        nl: "De tien maatregelen van Artikel 21 gelden voor beide categorieën gelijkelijk. Het verschil zit in de handhavingsintensiteit, niet in de reikwijdte van de naleving.",
        fr: "Les dix mesures de l'article 21 s'appliquent de la même manière aux deux catégories. La différence réside dans l'intensité du contrôle, et non dans l'étendue des obligations.",
        it: "Le dieci misure dell'articolo 21 si applicano allo stesso modo a entrambe le categorie. La differenza sta nell'intensità della vigilanza, non nell'ambito degli obblighi.",
        es: "Las diez medidas del artículo 21 se aplican por igual a ambas categorías. La diferencia está en la intensidad de la supervisión, no en el alcance de las obligaciones.",
        pl: "Dziesięć środków z artykułu 21 ma zastosowanie w jednakowym stopniu do obu kategorii. Różnica polega na intensywności nadzoru, a nie na zakresie obowiązków.",
      },
    },
  ],
});

export default quiz;
