import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.4",
  passingScore: 75,
  questions: [
    {
      id: "3.4.1",
      question: {
        en: "When your team says \"We have never had a problem,\" what logical error are they making?",
        de: "Wenn Ihr Team sagt \"Wir hatten noch nie ein Problem\" - welchen logischen Fehler begeht es?",
        nl: "Als uw team zegt \"We hebben nooit een probleem gehad\" - welke logische fout maken ze dan?",
      },
      options: [
        { en: "Appeal to authority", de: "Autoritaetsargument", nl: "Beroep op autoriteit" },
        { en: "Survivor bias - treating the absence of past incidents as proof that current controls work", de: "Survivorship Bias - das Ausbleiben vergangener Vorfaelle als Beweis zu werten, dass die aktuellen Kontrollen funktionieren", nl: "Survivorship bias - het ontbreken van eerdere incidenten beschouwen als bewijs dat de huidige controles werken" },
        { en: "False equivalence", de: "Falsche Aequivalenz", nl: "Valse gelijkwaardigheid" },
        { en: "Confirmation bias", de: "Bestaetigungsfehler", nl: "Bevestigingsvertekening" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Using the absence of past incidents as evidence of present control is survivor bias. The correct reply is to ask for current test results.",
        de: "Das Ausbleiben vergangener Vorfaelle als Beweis für bestehende Kontrollen zu nutzen, ist Survivorship Bias. Die richtige Antwort ist, nach aktuellen Testergebnissen zu fragen.",
        nl: "Het gebruik van het ontbreken van eerdere incidenten als bewijs voor huidige controle is survivorship bias. Het juiste antwoord is om te vragen naar actuele testresultaten.",
      },
    },
    {
      id: "3.4.2",
      question: {
        en: "Why does the lesson say refusing to sign is your strongest tool?",
        de: "Warum bezeichnet die Lektion die Verweigerung der Unterschrift als Ihr staerkstes Instrument?",
        nl: "Waarom zegt de les dat weigeren te tekenen uw sterkste instrument is?",
      },
      options: [
        { en: "Because it delays the audit and gives you more time", de: "Weil es das Audit verzoegert und Ihnen mehr Zeit gibt", nl: "Omdat het de audit uitstelt en u meer tijd geeft" },
        { en: "Because it forces the right work to happen before your name goes on a document", de: "Weil es erzwingt, dass die richtige Arbeit erledigt wird, bevor Ihr Name auf einem Dokument steht", nl: "Omdat het afdwingt dat het juiste werk wordt gedaan voordat uw naam op een document staat" },
        { en: "Because it transfers liability to the CISO", de: "Weil es die Haftung auf den CISO uebertraegt", nl: "Omdat het de aansprakelijkheid overdraagt aan de CISO" },
        { en: "Because the regulator rewards companies that delay sign-offs", de: "Weil die Aufsichtsbehörde Unternehmen belohnt, die Freigaben verzoegern", nl: "Omdat de toezichthouder bedrijven beloont die goedkeuringen uitstellen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Refusing to sign is the tool the law gave you to force the right work to happen before your name goes on a document.",
        de: "Die Verweigerung der Unterschrift ist das Werkzeug, das Ihnen das Gesetz gegeben hat, um die richtige Arbeit zu erzwingen, bevor Ihr Name auf einem Dokument steht.",
        nl: "Weigeren te tekenen is het instrument dat de wet u heeft gegeven om af te dwingen dat het juiste werk wordt gedaan voordat uw naam op een document staat.",
      },
    },
    {
      id: "3.4.3",
      question: {
        en: "When your team says \"We will fix it after the audit,\" what is the correct response?",
        de: "Wenn Ihr Team sagt \"Wir beheben es nach dem Audit\" - was ist die richtige Antwort?",
        nl: "Als uw team zegt \"We lossen het op na de audit\" - wat is dan het juiste antwoord?",
      },
      options: [
        { en: "\"That is a reasonable approach to prioritisation\"", de: "\"Das ist ein vernuenftiger Ansatz zur Priorisierung\"", nl: "\"Dat is een redelijke aanpak voor prioritering\"" },
        { en: "\"If it is known, it is already a finding. Fix it now and I will sign the fix.\"", de: "\"Wenn es bekannt ist, ist es bereits eine Feststellung. Beheben Sie es jetzt, und ich unterschreibe die Behebung.\"", nl: "\"Als het bekend is, is het al een bevinding. Los het nu op en ik onderteken de oplossing.\"" },
        { en: "\"Let the auditor decide whether it needs fixing\"", de: "\"Lassen Sie den Auditor entscheiden, ob es behoben werden muss\"", nl: "\"Laat de auditor beslissen of het moet worden opgelost\"" },
        { en: "\"Document it as a residual risk and I will accept it\"", de: "\"Dokumentieren Sie es als Restrisiko und ich akzeptiere es\"", nl: "\"Documenteer het als restrisico en ik accepteer het\"" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A known gap that the plan is to hide is already a finding. The correct response is to fix it now and sign the fix.",
        de: "Eine bekannte Lücke, die man verbergen will, ist bereits eine Feststellung. Die richtige Antwort ist, sie jetzt zu beheben und die Behebung zu unterschreiben.",
        nl: "Een bekende lacune die men van plan is te verbergen, is al een bevinding. Het juiste antwoord is om het nu op te lossen en de oplossing te ondertekenen.",
      },
    },
    {
      id: "3.4.4",
      question: {
        en: "What is the lesson's rule for detecting a broken sign-off process?",
        de: "Wie lautet die Regel der Lektion, um einen defekten Freigabeprozess zu erkennen?",
        nl: "Wat is de regel van de les voor het herkennen van een gebrekkig goedkeuringsproces?",
      },
      options: [
        { en: "If the document has not changed since last year", de: "Wenn sich das Dokument seit letztem Jahr nicht geändert hat", nl: "Als het document niet is gewijzigd since vorig jaar" },
        { en: "If the CISO is not present at the signing", de: "Wenn der CISO bei der Unterschrift nicht anwesend ist", nl: "Als de CISO niet aanwezig is bij de ondertekening" },
        { en: "If the explanation feels faster than the document, the process is broken", de: "Wenn die Erklaerung schneller wirkt als das Dokument, ist der Prozess defekt", nl: "Als de toelichting sneller aanvoelt dan het document, is het proces gebrekkig" },
        { en: "If the budget has not been updated", de: "Wenn das Budget nicht aktualisiert wurde", nl: "Als het budget niet is bijgewerkt" },
      ],
      correctIndex: 2,
      explanation: {
        en: "If the explanation feels faster than the document, the process is broken. Refusing costs hours. Signing blind costs years.",
        de: "Wenn die Erklaerung schneller wirkt als das Dokument, ist der Prozess defekt. Verweigern kostet Stunden. Blind unterschreiben kostet Jahre.",
        nl: "Als de toelichting sneller aanvoelt dan het document, is het proces gebrekkig. Weigeren kost uren. Blind tekenen kost jaren.",
      },
    },
  ],
});

export default quiz;
