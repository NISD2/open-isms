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
        fr: "Quels sont les deux types de chiffrement que la politique de cryptographie doit couvrir ?",
        it: "Quali sono i due tipi di crittografia che la politica di crittografia deve coprire?",
        es: "¿Cuáles son los dos tipos de cifrado que debe abarcar la política de criptografía?",
        pl: "Jakie dwa rodzaje szyfrowania musi obejmować polityka kryptografii?",
      },
      options: [
        { en: "Encryption of emails and encryption of phone calls", de: "Verschlüsselung von E-Mails und Verschlüsselung von Telefonaten", nl: "Versleuteling van e-mails en versleuteling van telefoongesprekken", fr: "Le chiffrement des e-mails et le chiffrement des appels téléphoniques", it: "La crittografia delle e-mail e la crittografia delle telefonate", es: "El cifrado de los correos electrónicos y el cifrado de las llamadas telefónicas", pl: "Szyfrowanie wiadomości e-mail i szyfrowanie rozmów telefonicznych" },
        { en: "Encryption at rest and encryption in transit", de: "Verschlüsselung im Ruhezustand und Verschlüsselung bei der Übertragung", nl: "Versleuteling in rust en versleuteling in doorvoer", fr: "Le chiffrement au repos et le chiffrement en transit", it: "La crittografia dei dati a riposo e la crittografia dei dati in transito", es: "El cifrado en reposo y el cifrado en tránsito", pl: "Szyfrowanie danych w spoczynku i szyfrowanie danych w tranzycie" },
        { en: "Public key encryption and private key encryption", de: "Verschlüsselung mit öffentlichem und privatem Schlüssel", nl: "Versleuteling met openbare sleutel en met privésleutel", fr: "Le chiffrement à clé publique et le chiffrement à clé privée", it: "La crittografia a chiave pubblica e la crittografia a chiave privata", es: "El cifrado de clave pública y el cifrado de clave privada", pl: "Szyfrowanie kluczem publicznym i szyfrowanie kluczem prywatnym" },
        { en: "Full-disk encryption and file-level encryption", de: "Festplattenverschlüsselung und Verschlüsselung auf Dateiebene", nl: "Volledige schijfversleuteling en versleuteling op bestandsniveau", fr: "Le chiffrement intégral du disque et le chiffrement au niveau des fichiers", it: "La crittografia dell'intero disco e la crittografia a livello di file", es: "El cifrado de disco completo y el cifrado a nivel de archivo", pl: "Szyfrowanie całego dysku i szyfrowanie na poziomie plików" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The policy must cover encryption at rest (stored data) and encryption in transit (data in motion) - and must name where each applies.",
        de: "Die Richtlinie muss Verschlüsselung im Ruhezustand (gespeicherte Daten) und Verschlüsselung bei der Übertragung (Daten in Bewegung) abdecken - und benennen, wo jeweils welche gilt.",
        nl: "Het beleid moet versleuteling in rust (opgeslagen gegevens) en versleuteling in doorvoer (gegevens onderweg) omvatten - en moet benoemen waar elk van toepassing is.",
        fr: "La politique doit couvrir le chiffrement au repos (données stockées) et le chiffrement en transit (données en mouvement), et doit indiquer où chacun s'applique.",
        it: "La politica deve coprire la crittografia dei dati a riposo (dati archiviati) e la crittografia dei dati in transito (dati in movimento), e deve indicare dove si applica ciascuna.",
        es: "La política debe abarcar el cifrado en reposo (datos almacenados) y el cifrado en tránsito (datos en movimiento), y debe indicar dónde se aplica cada uno.",
        pl: "Polityka musi obejmować szyfrowanie danych w spoczynku (dane przechowywane) i szyfrowanie danych w tranzycie (dane w ruchu), a także wskazywać, gdzie każde z nich ma zastosowanie.",
      },
    },
    {
      id: "2.13.2",
      question: {
        en: "Why should the cryptography policy reference BSI TR-02102 rather than hardcoding specific algorithm names?",
        de: "Warum sollte die Kryptografierichtlinie auf BSI TR-02102 verweisen, anstatt bestimmte Algorithmen fest zu codieren?",
        nl: "Waarom zou het cryptografiebeleid moeten verwijzen naar BSI TR-02102 in plaats van specifieke algoritmenamen hard te coderen?",
        fr: "Pourquoi la politique de cryptographie devrait-elle renvoyer au BSI TR-02102 plutôt que de coder en dur des noms d'algorithmes précis ?",
        it: "Perché la politica di crittografia dovrebbe fare riferimento al BSI TR-02102 anziché fissare nomi di algoritmi specifici?",
        es: "¿Por qué la política de criptografía debe remitir al BSI TR-02102 en lugar de fijar nombres de algoritmos concretos?",
        pl: "Dlaczego polityka kryptografii powinna odwoływać się do BSI TR-02102, zamiast na stałe wpisywać konkretne nazwy algorytmów?",
      },
      options: [
        { en: "Because BSI TR-02102 is cheaper to implement", de: "Weil BSI TR-02102 günstiger umzusetzen ist", nl: "Omdat BSI TR-02102 goedkoper te implementeren is", fr: "Parce que le BSI TR-02102 est moins coûteux à mettre en œuvre", it: "Perché il BSI TR-02102 è più economico da attuare", es: "Porque el BSI TR-02102 es más barato de implementar", pl: "Ponieważ BSI TR-02102 jest tańszy we wdrożeniu" },
        { en: "Because the guideline is updated as research evolves, so the policy stays current automatically", de: "Weil die Richtlinie bei neuen Forschungsergebnissen aktualisiert wird und die Policy so automatisch aktuell bleibt", nl: "Omdat de richtlijn wordt bijgewerkt naarmate het onderzoek vordert, waardoor het beleid automatisch actueel blijft", fr: "Parce que la directive est mise à jour au fil de l'évolution de la recherche, de sorte que la politique reste automatiquement à jour", it: "Perché la linea guida viene aggiornata con l'evolversi della ricerca, così la politica resta automaticamente aggiornata", es: "Porque la directriz se actualiza a medida que evoluciona la investigación, de modo que la política se mantiene actualizada automáticamente", pl: "Ponieważ wytyczne są aktualizowane wraz z postępem badań, dzięki czemu polityka pozostaje automatycznie aktualna" },
        { en: "Because the auditor will not accept algorithm names", de: "Weil der Auditor keine Algorithmusnamen akzeptiert", nl: "Omdat de auditor geen algoritmenamen accepteert", fr: "Parce que l'auditeur n'acceptera pas les noms d'algorithmes", it: "Perché il revisore non accetterà nomi di algoritmi", es: "Porque el auditor no aceptará nombres de algoritmos", pl: "Ponieważ audytor nie zaakceptuje nazw algorytmów" },
        { en: "Because TR-02102 is legally required in the EU", de: "Weil TR-02102 in der EU gesetzlich vorgeschrieben ist", nl: "Omdat TR-02102 wettelijk verplicht is in de EU", fr: "Parce que le TR-02102 est légalement obligatoire dans l'UE", it: "Perché il TR-02102 è obbligatorio per legge nell'UE", es: "Porque el TR-02102 es obligatorio por ley en la UE", pl: "Ponieważ TR-02102 jest prawnie wymagany w UE" },
      ],
      correctIndex: 1,
      explanation: {
        en: "BSI updates TR-02102 as research evolves - referencing it by name means the policy stays current without needing to be rewritten when algorithms change.",
        de: "Das BSI aktualisiert TR-02102 mit dem Fortschritt der Forschung - der Verweis darauf sorgt dafür, dass die Richtlinie aktuell bleibt, ohne bei Algorithmusänderungen umgeschrieben werden zu müssen.",
        nl: "BSI werkt TR-02102 bij naarmate het onderzoek vordert - door er bij naam naar te verwijzen blijft het beleid actueel zonder herschreven te worden wanneer algoritmen veranderen.",
        fr: "Le BSI met à jour le TR-02102 au fil de l'évolution de la recherche : y renvoyer par son nom permet à la politique de rester à jour sans devoir être réécrite lorsque les algorithmes changent.",
        it: "Il BSI aggiorna il TR-02102 con l'evolversi della ricerca: farvi riferimento per nome significa che la politica resta aggiornata senza dover essere riscritta quando gli algoritmi cambiano.",
        es: "El BSI actualiza el TR-02102 a medida que evoluciona la investigación: remitir a él por su nombre significa que la política se mantiene actualizada sin necesidad de reescribirla cuando cambian los algoritmos.",
        pl: "BSI aktualizuje TR-02102 wraz z postępem badań - odwołanie się do niego po nazwie sprawia, że polityka pozostaje aktualna bez konieczności przepisywania jej przy zmianie algorytmów.",
      },
    },
    {
      id: "2.13.3",
      question: {
        en: "Where does cryptography most commonly fail in practice, according to the lesson?",
        de: "Wo scheitert Kryptografie in der Praxis laut der Lektion am häufigsten?",
        nl: "Waar faalt cryptografie in de praktijk het vaakst, volgens de les?",
        fr: "Où la cryptographie échoue-t-elle le plus souvent en pratique, selon la leçon ?",
        it: "Dove fallisce più comunemente la crittografia nella pratica, secondo la lezione?",
        es: "¿Dónde falla más comúnmente la criptografía en la práctica, según la lección?",
        pl: "Gdzie kryptografia najczęściej zawodzi w praktyce, według lekcji?",
      },
      options: [
        { en: "Choosing the wrong encryption algorithm", de: "Wahl des falschen Verschlüsselungsalgorithmus", nl: "Het kiezen van het verkeerde versleutelingsalgoritme", fr: "Le choix du mauvais algorithme de chiffrement", it: "La scelta dell'algoritmo di crittografia sbagliato", es: "La elección del algoritmo de cifrado equivocado", pl: "Wybór niewłaściwego algorytmu szyfrowania" },
        { en: "Key management - keys stored on the same server, unrestricted access, or never rotated", de: "Schlüsselmanagement - Schlüssel auf demselben Server gespeichert, uneingeschränkter Zugang oder nie rotiert", nl: "Sleutelbeheer - sleutels opgeslagen op dezelfde server, onbeperkte toegang, of nooit geroteerd", fr: "La gestion des clés : clés stockées sur le même serveur, accès non restreint ou jamais renouvelées", it: "La gestione delle chiavi: chiavi archiviate sullo stesso server, accesso non limitato o mai ruotate", es: "La gestión de claves: claves almacenadas en el mismo servidor, acceso sin restricciones o nunca rotadas", pl: "Zarządzanie kluczami - klucze przechowywane na tym samym serwerze, nieograniczony dostęp lub nigdy nierotowane" },
        { en: "Using encryption that is too strong for the data", de: "Verwendung einer zu starken Verschlüsselung für die Daten", nl: "Het gebruik van te sterke versleuteling voor de gegevens", fr: "L'utilisation d'un chiffrement trop fort pour les données", it: "L'uso di una crittografia troppo forte per i dati", es: "El uso de un cifrado demasiado fuerte para los datos", pl: "Stosowanie zbyt silnego szyfrowania dla danych" },
        { en: "Failing to encrypt physical documents", de: "Versäumnis, physische Dokumente zu verschlüsseln", nl: "Het nalaten fysieke documenten te versleutelen", fr: "Le fait de ne pas chiffrer les documents physiques", it: "Il mancato cifratura dei documenti fisici", es: "No cifrar los documentos físicos", pl: "Niezaszyfrowanie dokumentów fizycznych" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Key management is where cryptography fails - if the key is on the same server as the data, access is unrestricted, or keys are never rotated, the encryption is effectively useless.",
        de: "Schlüsselmanagement ist die Schwachstelle der Kryptografie - wenn der Schlüssel auf demselben Server wie die Daten liegt, der Zugang uneingeschränkt ist oder Schlüssel nie rotiert werden, ist die Verschlüsselung praktisch nutzlos.",
        nl: "Sleutelbeheer is waar cryptografie faalt - als de sleutel op dezelfde server staat als de gegevens, de toegang onbeperkt is of sleutels nooit worden geroteerd, is de versleuteling in feite nutteloos.",
        fr: "La gestion des clés est le point de défaillance de la cryptographie : si la clé se trouve sur le même serveur que les données, si l'accès n'est pas restreint ou si les clés ne sont jamais renouvelées, le chiffrement est en pratique inutile.",
        it: "La gestione delle chiavi è il punto in cui la crittografia fallisce: se la chiave si trova sullo stesso server dei dati, l'accesso non è limitato o le chiavi non vengono mai ruotate, la crittografia è di fatto inutile.",
        es: "La gestión de claves es donde falla la criptografía: si la clave está en el mismo servidor que los datos, el acceso no tiene restricciones o las claves nunca se rotan, el cifrado es en la práctica inútil.",
        pl: "Zarządzanie kluczami to miejsce, w którym kryptografia zawodzi - jeśli klucz znajduje się na tym samym serwerze co dane, dostęp jest nieograniczony lub klucze nigdy nie są rotowane, szyfrowanie jest w praktyce bezużyteczne.",
      },
    },
  ],
});

export default quiz;
