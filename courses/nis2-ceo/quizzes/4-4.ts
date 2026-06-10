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
      },
      options: [
        { en: "Pre-existing vulnerabilities exclusion", de: "Ausschluss bestehender Schwachstellen", nl: "Uitsluiting van reeds bestaande kwetsbaarheden" },
        { en: "Acts-of-war exclusion", de: "Kriegshandlungsausschluss", nl: "Oorlogshandelingenuitsluiting" },
        { en: "Late notification clause", de: "Klausel zur verspaeteten Meldung", nl: "Clausule voor late melding" },
        { en: "Failure-to-maintain-security clause", de: "Klausel zur mangelnden Sicherheitspflege", nl: "Clausule voor onvoldoende beveiligingsonderhoud" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Zurich refused to pay by citing the acts-of-war exclusion. The case ran for nearly five years and settled for an undisclosed amount.",
        de: "Zurich verweigerte die Zahlung unter Berufung auf den Kriegshandlungsausschluss. Das Verfahren dauerte fast fünf Jahre und endete mit einem Vergleich ueber eine nicht genannte Summe.",
        nl: "Zurich weigerde te betalen door een beroep te doen op de oorlogshandelingenuitsluiting. De zaak liep bijna vijf jaar en werd geschikt voor een onbekend bedrag.",
      },
    },
    {
      id: "4.4.2",
      question: {
        en: "What does the failure-to-maintain-security clause in a D&O policy do?",
        de: "Was bewirkt die Klausel zur mangelnden Sicherheitspflege in einer D&O-Police?",
        nl: "Wat doet de clausule voor onvoldoende beveiligingsonderhoud in een D&O-polis?",
      },
      options: [
        { en: "Requires the insurer to audit your security annually", de: "Verpflichtet den Versicherer, Ihre Sicherheit jährlich zu prüfen", nl: "Verplicht de verzekeraar uw beveiliging jaarlijks te auditen" },
        { en: "Can void coverage if you did not keep up standard controls", de: "Kann die Deckung aufheben, wenn Sie Standard-Kontrollen nicht aufrechterhalten haben", nl: "Kan de dekking nietig verklaren als u standaardmaatregelen niet heeft gehandhaafd" },
        { en: "Increases your premium if security standards are not met", de: "Erhoeht Ihre Praemie, wenn Sicherheitsstandards nicht eingehalten werden", nl: "Verhoogt uw premie als beveiligingsnormen niet worden nageleefd" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The failure-to-maintain-security clause can void coverage if you did not keep up standard controls.",
        de: "Die Klausel zur mangelnden Sicherheitspflege kann die Deckung aufheben, wenn Sie Standard-Kontrollen nicht aufrechterhalten haben.",
        nl: "De clausule voor onvoldoende beveiligingsonderhoud kan de dekking nietig verklaren als u standaardmaatregelen niet heeft gehandhaafd.",
      },
    },
    {
      id: "4.4.3",
      question: {
        en: "Are regulator fines and penalties typically covered by cyber insurance policies?",
        de: "Werden regulatorische Bussgelder und Strafen in der Regel von Cyberversicherungen abgedeckt?",
        nl: "Worden regulatoire boetes en sancties doorgaans gedekt door cyberverzekeringen?",
      },
      options: [
        { en: "Yes, they are always covered", de: "Ja, sie sind immer abgedeckt", nl: "Ja, ze zijn altijd gedekt" },
        { en: "Only if the policy includes a regulatory endorsement", de: "Nur wenn die Police einen regulatorischen Zusatz enthaelt", nl: "Alleen als de polis een regulatoire clausule bevat" },
        { en: "No, they are almost universally excluded from cyber policies", de: "Nein, sie sind nahezu ausnahmslos von Cyberpolicen ausgeschlossen", nl: "Nee, ze zijn vrijwel universeel uitgesloten van cyberpolissen" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Regulator fines and penalties are almost universally excluded from cyber policies. Your cyber insurance does not pay NIS2 fines.",
        de: "Regulatorische Bussgelder und Strafen sind nahezu ausnahmslos von Cyberpolicen ausgeschlossen. Ihre Cyberversicherung zahlt keine NIS2-Bussgelder.",
        nl: "Regulatoire boetes en sancties zijn vrijwel universeel uitgesloten van cyberpolissen. Uw cyberverzekering betaalt geen NIS2-boetes.",
      },
    },
    {
      id: "4.4.4",
      question: {
        en: "What did Lloyd's of London do in 2023 following the Mondelez case?",
        de: "Was hat Lloyd's of London 2023 nach dem Mondelez-Fall getan?",
        nl: "Wat deed Lloyd's of London in 2023 na de Mondelez-zaak?",
      },
      options: [
        { en: "Stopped underwriting cyber insurance entirely", de: "Die Zeichnung von Cyberversicherungen vollständig eingestellt", nl: "Stopte volledig met het afsluiten van cyberverzekeringen" },
        { en: "Formally tightened the acts-of-war exclusion language", de: "Die Formulierung des Kriegshandlungsausschlusses formal verschaerft", nl: "Verscherpte formeel de taal van de oorlogshandelingenuitsluiting" },
        { en: "Created a new type of NIS2-specific policy", de: "Eine neue Art von NIS2-spezifischer Police entwickelt", nl: "Creëerde een nieuw type NIS2-specifieke polis" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Lloyd's of London formally tightened the acts-of-war language in 2023. Every EU cyber policy written since then contains narrower language around state-attributed attacks.",
        de: "Lloyd's of London hat die Formulierung zum Kriegshandlungsausschluss 2023 formal verschaerft. Jede seitdem geschriebene EU-Cyberpolice enthaelt engere Formulierungen zu staatlich zugeordneten Angriffen.",
        nl: "Lloyd's of London verscherpte formeel de taal van de oorlogshandelingenuitsluiting in 2023. Elke sindsdien geschreven EU-cyberpolis bevat engere taal rond aanvallen die aan statelijke actoren worden toegeschreven.",
      },
    },
  ],
});

export default quiz;
