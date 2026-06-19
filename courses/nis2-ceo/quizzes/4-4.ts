import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.4",
  passingScore: 75,
  questions: [
    {
      id: "4.4.1",
      question: {
        en: "What exclusion did Zurich use to refuse the Mondelez NotPetya claim?",
        de: "Welchen Ausschluss nutzte Zurich, um den NotPetya-Anspruch von Mondelez abzulehnen?",
        nl: "Welke uitsluiting gebruikte Zurich om de Mondelez NotPetya-claim af te wijzen?",
        fr: "Quelle exclusion Zurich a-t-il utilisée pour refuser la demande NotPetya de Mondelez ?",
        it: "Quale esclusione ha utilizzato Zurich per rifiutare la richiesta NotPetya di Mondelez?",
        es: "¿Qué exclusión utilizó Zurich para rechazar la reclamación NotPetya de Mondelez?",
        pl: "Którego wyłączenia użył Zurich, aby odrzucić roszczenie Mondelez dotyczące NotPetya?",
      },
      options: [
        { en: "Pre-existing vulnerabilities exclusion", de: "Ausschluss bestehender Schwachstellen", nl: "Uitsluiting van reeds bestaande kwetsbaarheden", fr: "Exclusion des vulnérabilités préexistantes", it: "Esclusione delle vulnerabilità preesistenti", es: "Exclusión de vulnerabilidades preexistentes", pl: "Wyłączenie istniejących wcześniej podatności" },
        { en: "Acts-of-war exclusion", de: "Kriegshandlungsausschluss", nl: "Oorlogshandelingenuitsluiting", fr: "Exclusion des actes de guerre", it: "Esclusione degli atti di guerra", es: "Exclusión de actos de guerra", pl: "Wyłączenie aktów wojny" },
        { en: "Late notification clause", de: "Klausel zur verspaeteten Meldung", nl: "Clausule voor late melding", fr: "Clause de notification tardive", it: "Clausola di notifica tardiva", es: "Cláusula de notificación tardía", pl: "Klauzula spóźnionego powiadomienia" },
        { en: "Failure-to-maintain-security clause", de: "Klausel zur mangelnden Sicherheitspflege", nl: "Clausule voor onvoldoende beveiligingsonderhoud", fr: "Clause de défaut de maintien de la sécurité", it: "Clausola di mancato mantenimento della sicurezza", es: "Cláusula de incumplimiento del mantenimiento de la seguridad", pl: "Klauzula braku utrzymania bezpieczeństwa" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Zurich refused to pay by citing the acts-of-war exclusion. The case ran for nearly five years and settled for an undisclosed amount.",
        de: "Zurich verweigerte die Zahlung unter Berufung auf den Kriegshandlungsausschluss. Das Verfahren dauerte fast fünf Jahre und endete mit einem Vergleich ueber eine nicht genannte Summe.",
        nl: "Zurich weigerde te betalen door een beroep te doen op de oorlogshandelingenuitsluiting. De zaak liep bijna vijf jaar en werd geschikt voor een onbekend bedrag.",
        fr: "Zurich a refusé de payer en invoquant l'exclusion des actes de guerre. L'affaire a duré près de cinq ans et a été réglée pour un montant non divulgué.",
        it: "Zurich ha rifiutato di pagare invocando l'esclusione degli atti di guerra. Il caso è durato quasi cinque anni e si è concluso con un accordo per un importo non divulgato.",
        es: "Zurich se negó a pagar invocando la exclusión de actos de guerra. El caso se prolongó casi cinco años y se resolvió por un importe no revelado.",
        pl: "Zurich odmówił zapłaty, powołując się na wyłączenie aktów wojny. Sprawa trwała prawie pięć lat i zakończyła się ugodą na nieujawnioną kwotę.",
      },
    },
    {
      id: "4.4.2",
      question: {
        en: "What does the failure-to-maintain-security clause in a D&O policy do?",
        de: "Was bewirkt die Klausel zur mangelnden Sicherheitspflege in einer D&O-Police?",
        nl: "Wat doet de clausule voor onvoldoende beveiligingsonderhoud in een D&O-polis?",
        fr: "Que fait la clause de défaut de maintien de la sécurité dans une police D&O ?",
        it: "Cosa fa la clausola di mancato mantenimento della sicurezza in una polizza D&O?",
        es: "¿Qué hace la cláusula de incumplimiento del mantenimiento de la seguridad en una póliza D&O?",
        pl: "Co robi klauzula braku utrzymania bezpieczeństwa w polisie D&O?",
      },
      options: [
        { en: "Requires the insurer to audit your security annually", de: "Verpflichtet den Versicherer, Ihre Sicherheit jährlich zu prüfen", nl: "Verplicht de verzekeraar uw beveiliging jaarlijks te auditen", fr: "Oblige l'assureur à auditer votre sécurité chaque année", it: "Obbliga l'assicuratore a verificare la vostra sicurezza annualmente", es: "Obliga al asegurador a auditar su seguridad anualmente", pl: "Zobowiązuje ubezpieczyciela do corocznego audytu Twojego bezpieczeństwa" },
        { en: "Can void coverage if you did not keep up standard controls", de: "Kann die Deckung aufheben, wenn Sie Standard-Kontrollen nicht aufrechterhalten haben", nl: "Kan de dekking nietig verklaren als u standaardmaatregelen niet heeft gehandhaafd", fr: "Peut annuler la couverture si vous n'avez pas maintenu les contrôles standard", it: "Può annullare la copertura se non avete mantenuto i controlli standard", es: "Puede anular la cobertura si no mantuvo los controles estándar", pl: "Może unieważnić ochronę, jeśli nie utrzymywałeś standardowych kontroli" },
        { en: "Increases your premium if security standards are not met", de: "Erhoeht Ihre Praemie, wenn Sicherheitsstandards nicht eingehalten werden", nl: "Verhoogt uw premie als beveiligingsnormen niet worden nageleefd", fr: "Augmente votre prime si les normes de sécurité ne sont pas respectées", it: "Aumenta il vostro premio se gli standard di sicurezza non vengono rispettati", es: "Aumenta su prima si no se cumplen las normas de seguridad", pl: "Podnosi Twoją składkę, jeśli normy bezpieczeństwa nie są spełnione" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The failure-to-maintain-security clause can void coverage if you did not keep up standard controls.",
        de: "Die Klausel zur mangelnden Sicherheitspflege kann die Deckung aufheben, wenn Sie Standard-Kontrollen nicht aufrechterhalten haben.",
        nl: "De clausule voor onvoldoende beveiligingsonderhoud kan de dekking nietig verklaren als u standaardmaatregelen niet heeft gehandhaafd.",
        fr: "La clause de défaut de maintien de la sécurité peut annuler la couverture si vous n'avez pas maintenu les contrôles standard.",
        it: "La clausola di mancato mantenimento della sicurezza può annullare la copertura se non avete mantenuto i controlli standard.",
        es: "La cláusula de incumplimiento del mantenimiento de la seguridad puede anular la cobertura si no mantuvo los controles estándar.",
        pl: "Klauzula braku utrzymania bezpieczeństwa może unieważnić ochronę, jeśli nie utrzymywałeś standardowych kontroli.",
      },
    },
    {
      id: "4.4.3",
      question: {
        en: "Are regulator fines and penalties typically covered by cyber insurance policies?",
        de: "Werden regulatorische Bussgelder und Strafen in der Regel von Cyberversicherungen abgedeckt?",
        nl: "Worden regulatoire boetes en sancties doorgaans gedekt door cyberverzekeringen?",
        fr: "Les amendes et sanctions réglementaires sont-elles généralement couvertes par les polices de cyberassurance ?",
        it: "Le sanzioni e le penali normative sono generalmente coperte dalle polizze di cyberassicurazione?",
        es: "¿Cubren las pólizas de ciberseguro normalmente las multas y sanciones regulatorias?",
        pl: "Czy kary i grzywny regulacyjne są zazwyczaj objęte polisami cyberubezpieczenia?",
      },
      options: [
        { en: "Yes, they are always covered", de: "Ja, sie sind immer abgedeckt", nl: "Ja, ze zijn altijd gedekt", fr: "Oui, elles sont toujours couvertes", it: "Sì, sono sempre coperte", es: "Sí, siempre están cubiertas", pl: "Tak, są zawsze objęte" },
        { en: "Only if the policy includes a regulatory endorsement", de: "Nur wenn die Police einen regulatorischen Zusatz enthaelt", nl: "Alleen als de polis een regulatoire clausule bevat", fr: "Uniquement si la police comprend un avenant réglementaire", it: "Solo se la polizza include un'appendice normativa", es: "Solo si la póliza incluye un suplemento regulatorio", pl: "Tylko jeśli polisa zawiera aneks regulacyjny" },
        { en: "No, they are almost universally excluded from cyber policies", de: "Nein, sie sind nahezu ausnahmslos von Cyberpolicen ausgeschlossen", nl: "Nee, ze zijn vrijwel universeel uitgesloten van cyberpolissen", fr: "Non, elles sont presque systématiquement exclues des polices cyber", it: "No, sono quasi universalmente escluse dalle polizze cyber", es: "No, están casi universalmente excluidas de las pólizas cibernéticas", pl: "Nie, są niemal powszechnie wyłączone z polis cybernetycznych" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Regulator fines and penalties are almost universally excluded from cyber policies. Your cyber insurance does not pay NIS2 fines.",
        de: "Regulatorische Bussgelder und Strafen sind nahezu ausnahmslos von Cyberpolicen ausgeschlossen. Ihre Cyberversicherung zahlt keine NIS2-Bussgelder.",
        nl: "Regulatoire boetes en sancties zijn vrijwel universeel uitgesloten van cyberpolissen. Uw cyberverzekering betaalt geen NIS2-boetes.",
        fr: "Les amendes et sanctions réglementaires sont presque systématiquement exclues des polices cyber. Votre cyberassurance ne paie pas les amendes NIS2.",
        it: "Le sanzioni e le penali normative sono quasi universalmente escluse dalle polizze cyber. La vostra cyberassicurazione non paga le sanzioni NIS2.",
        es: "Las multas y sanciones regulatorias están casi universalmente excluidas de las pólizas cibernéticas. Su ciberseguro no paga las multas de NIS2.",
        pl: "Kary i grzywny regulacyjne są niemal powszechnie wyłączone z polis cybernetycznych. Twoje cyberubezpieczenie nie pokrywa kar NIS2.",
      },
    },
    {
      id: "4.4.4",
      question: {
        en: "What did Lloyd's of London do in 2023 following the Mondelez case?",
        de: "Was hat Lloyd's of London 2023 nach dem Mondelez-Fall getan?",
        nl: "Wat deed Lloyd's of London in 2023 na de Mondelez-zaak?",
        fr: "Qu'a fait Lloyd's of London en 2023 à la suite de l'affaire Mondelez ?",
        it: "Cosa ha fatto Lloyd's of London nel 2023 in seguito al caso Mondelez?",
        es: "¿Qué hizo Lloyd's of London en 2023 tras el caso Mondelez?",
        pl: "Co zrobił Lloyd's of London w 2023 roku po sprawie Mondelez?",
      },
      options: [
        { en: "Stopped underwriting cyber insurance entirely", de: "Die Zeichnung von Cyberversicherungen vollständig eingestellt", nl: "Stopte volledig met het afsluiten van cyberverzekeringen", fr: "A complètement cessé de souscrire des cyberassurances", it: "Ha smesso completamente di sottoscrivere cyberassicurazioni", es: "Dejó por completo de suscribir ciberseguros", pl: "Całkowicie przestał oferować cyberubezpieczenia" },
        { en: "Formally tightened the acts-of-war exclusion language", de: "Die Formulierung des Kriegshandlungsausschlusses formal verschaerft", nl: "Verscherpte formeel de taal van de oorlogshandelingenuitsluiting", fr: "A formellement durci la formulation de l'exclusion des actes de guerre", it: "Ha formalmente inasprito il testo dell'esclusione degli atti di guerra", es: "Endureció formalmente el texto de la exclusión de actos de guerra", pl: "Formalnie zaostrzył treść wyłączenia aktów wojny" },
        { en: "Created a new type of NIS2-specific policy", de: "Eine neue Art von NIS2-spezifischer Police entwickelt", nl: "Creëerde een nieuw type NIS2-specifieke polis", fr: "A créé un nouveau type de police spécifique à NIS2", it: "Ha creato un nuovo tipo di polizza specifica per NIS2", es: "Creó un nuevo tipo de póliza específica para NIS2", pl: "Stworzył nowy typ polisy specyficznej dla NIS2" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Lloyd's of London formally tightened the acts-of-war language in 2023. Every EU cyber policy written since then contains narrower language around state-attributed attacks.",
        de: "Lloyd's of London hat die Formulierung zum Kriegshandlungsausschluss 2023 formal verschaerft. Jede seitdem geschriebene EU-Cyberpolice enthaelt engere Formulierungen zu staatlich zugeordneten Angriffen.",
        nl: "Lloyd's of London verscherpte formeel de taal van de oorlogshandelingenuitsluiting in 2023. Elke sindsdien geschreven EU-cyberpolis bevat engere taal rond aanvallen die aan statelijke actoren worden toegeschreven.",
        fr: "Lloyd's of London a formellement durci la formulation des actes de guerre en 2023. Chaque police cyber de l'UE rédigée depuis lors contient une formulation plus restrictive concernant les attaques attribuées à des États.",
        it: "Lloyd's of London ha formalmente inasprito il testo sugli atti di guerra nel 2023. Ogni polizza cyber dell'UE redatta da allora contiene un testo più restrittivo in materia di attacchi attribuiti a Stati.",
        es: "Lloyd's of London endureció formalmente el texto sobre actos de guerra en 2023. Toda póliza cibernética de la UE redactada desde entonces contiene un texto más restrictivo sobre los ataques atribuidos a Estados.",
        pl: "Lloyd's of London formalnie zaostrzył treść dotyczącą aktów wojny w 2023 roku. Każda unijna polisa cybernetyczna sporządzona od tego czasu zawiera węższe sformułowania dotyczące ataków przypisywanych państwom.",
      },
    },
  ],
});

export default quiz;
