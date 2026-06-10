import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.13",
  passingScore: 75,
  questions: [
    {
      id: "2.13.1",
      question: {
        en: "What are the two types of encryption the cryptography policy must cover?",
        de: "Welche zwei Arten der Verschlüsselung muss die Kryptografierichtlinie abdecken?",
        nl: "Welke twee soorten versleuteling moet het cryptografiebeleid omvatten?",
      },
      options: [
        { en: "Encryption of emails and encryption of phone calls", de: "Verschlüsselung von E-Mails und Verschlüsselung von Telefonaten", nl: "Versleuteling van e-mails en versleuteling van telefoongesprekken" },
        { en: "Encryption at rest and encryption in transit", de: "Verschlüsselung im Ruhezustand und Verschlüsselung bei der Übertragung", nl: "Versleuteling in rust en versleuteling in doorvoer" },
        { en: "Public key encryption and private key encryption", de: "Verschlüsselung mit öffentlichem und privatem Schlüssel", nl: "Versleuteling met openbare sleutel en met privésleutel" },
        { en: "Full-disk encryption and file-level encryption", de: "Festplattenverschlüsselung und Verschlüsselung auf Dateiebene", nl: "Volledige schijfversleuteling en versleuteling op bestandsniveau" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The policy must cover encryption at rest (stored data) and encryption in transit (data in motion) - and must name where each applies.",
        de: "Die Richtlinie muss Verschlüsselung im Ruhezustand (gespeicherte Daten) und Verschlüsselung bei der Übertragung (Daten in Bewegung) abdecken - und benennen, wo jeweils welche gilt.",
        nl: "Het beleid moet versleuteling in rust (opgeslagen gegevens) en versleuteling in doorvoer (gegevens onderweg) omvatten - en moet benoemen waar elk van toepassing is.",
      },
    },
    {
      id: "2.13.2",
      question: {
        en: "Why should the cryptography policy reference BSI TR-02102 rather than hardcoding specific algorithm names?",
        de: "Warum sollte die Kryptografierichtlinie auf BSI TR-02102 verweisen, anstatt bestimmte Algorithmen fest zu codieren?",
        nl: "Waarom zou het cryptografiebeleid moeten verwijzen naar BSI TR-02102 in plaats van specifieke algoritmenamen hard te coderen?",
      },
      options: [
        { en: "Because BSI TR-02102 is cheaper to implement", de: "Weil BSI TR-02102 günstiger umzusetzen ist", nl: "Omdat BSI TR-02102 goedkoper te implementeren is" },
        { en: "Because the guideline is updated as research evolves, so the policy stays current automatically", de: "Weil die Richtlinie bei neuen Forschungsergebnissen aktualisiert wird und die Policy so automatisch aktuell bleibt", nl: "Omdat de richtlijn wordt bijgewerkt naarmate het onderzoek vordert, waardoor het beleid automatisch actueel blijft" },
        { en: "Because the auditor will not accept algorithm names", de: "Weil der Auditor keine Algorithmusnamen akzeptiert", nl: "Omdat de auditor geen algoritmenamen accepteert" },
        { en: "Because TR-02102 is legally required in the EU", de: "Weil TR-02102 in der EU gesetzlich vorgeschrieben ist", nl: "Omdat TR-02102 wettelijk verplicht is in de EU" },
      ],
      correctIndex: 1,
      explanation: {
        en: "BSI updates TR-02102 as research evolves - referencing it by name means the policy stays current without needing to be rewritten when algorithms change.",
        de: "Das BSI aktualisiert TR-02102 mit dem Fortschritt der Forschung - der Verweis darauf sorgt dafür, dass die Richtlinie aktuell bleibt, ohne bei Algorithmusänderungen umgeschrieben werden zu müssen.",
        nl: "BSI werkt TR-02102 bij naarmate het onderzoek vordert - door er bij naam naar te verwijzen blijft het beleid actueel zonder herschreven te worden wanneer algoritmen veranderen.",
      },
    },
    {
      id: "2.13.3",
      question: {
        en: "Where does cryptography most commonly fail in practice, according to the lesson?",
        de: "Wo scheitert Kryptografie in der Praxis laut der Lektion am häufigsten?",
        nl: "Waar faalt cryptografie in de praktijk het vaakst, volgens de les?",
      },
      options: [
        { en: "Choosing the wrong encryption algorithm", de: "Wahl des falschen Verschlüsselungsalgorithmus", nl: "Het kiezen van het verkeerde versleutelingsalgoritme" },
        { en: "Key management - keys stored on the same server, unrestricted access, or never rotated", de: "Schlüsselmanagement - Schlüssel auf demselben Server gespeichert, uneingeschränkter Zugang oder nie rotiert", nl: "Sleutelbeheer - sleutels opgeslagen op dezelfde server, onbeperkte toegang, of nooit geroteerd" },
        { en: "Using encryption that is too strong for the data", de: "Verwendung einer zu starken Verschlüsselung für die Daten", nl: "Het gebruik van te sterke versleuteling voor de gegevens" },
        { en: "Failing to encrypt physical documents", de: "Versäumnis, physische Dokumente zu verschlüsseln", nl: "Het nalaten fysieke documenten te versleutelen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Key management is where cryptography fails - if the key is on the same server as the data, access is unrestricted, or keys are never rotated, the encryption is effectively useless.",
        de: "Schlüsselmanagement ist die Schwachstelle der Kryptografie - wenn der Schlüssel auf demselben Server wie die Daten liegt, der Zugang uneingeschränkt ist oder Schlüssel nie rotiert werden, ist die Verschlüsselung praktisch nutzlos.",
        nl: "Sleutelbeheer is waar cryptografie faalt - als de sleutel op dezelfde server staat als de gegevens, de toegang onbeperkt is of sleutels nooit worden geroteerd, is de versleuteling in feite nutteloos.",
      },
    },
  ],
});

export default quiz;
