import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "1.1",
  "passingScore": 75,
  "questions": [
    {
      "id": "1.1.1",
      "question": {
        "en": "Which field allows a vulnerability scanner to look up a component in a CVE database?",
        "de": "Welches Feld ermöglicht es einem Schwachstellen-Scanner, eine Komponente in einer CVE-Datenbank nachzuschlagen?",
        "nl": "Welk veld stelt een kwetsbaarheidsscanner in staat een component op te zoeken in een CVE-database?",
        "fr": "Quel champ permet à un scanner de vulnérabilités de rechercher un composant dans une base de données CVE ?",
        "it": "Quale campo consente a uno scanner di vulnerabilità di cercare un componente in un database CVE?",
        "es": "¿Qué campo permite a un escáner de vulnerabilidades buscar un componente en una base de datos CVE?",
        "pl": "Które pole umożliwia skanerowi podatności wyszukanie komponentu w bazie danych CVE?",
        "cs": "Které pole umožňuje skeneru zranitelností vyhledat komponentu v databázi CVE?",
        "pt": "Qual campo permite que um scanner de vulnerabilidades procure um componente numa base de dados CVE?",
        "ro": "Ce câmp permite unui scaner de vulnerabilități să caute o componentă într-o bază de date CVE?"
      },
      "options": [
        {
          "en": "The component name field",
          "de": "Das Feld für den Komponentennamen",
          "nl": "Het veld met de componentnaam",
          "fr": "Le champ nom du composant",
          "it": "Il campo nome del componente",
          "es": "El campo del nombre del componente",
          "pl": "Pole nazwy komponentu",
          "cs": "Pole s názvem komponenty",
          "pt": "O campo nome do componente",
          "ro": "Câmpul cu numele componentei"
        },
        {
          "en": "The PURL (Package URL)",
          "de": "Die PURL (Package URL)",
          "nl": "De PURL (Package URL)",
          "fr": "Le PURL (Package URL)",
          "it": "Il PURL (Package URL)",
          "es": "El PURL (Package URL)",
          "pl": "PURL (Package URL)",
          "cs": "PURL (Package URL)",
          "pt": "O PURL (Package URL)",
          "ro": "PURL (Package URL)"
        },
        {
          "en": "The supplier field",
          "de": "Das Lieferantenfeld",
          "nl": "Het leveranciersveld",
          "fr": "Le champ fournisseur",
          "it": "Il campo fornitore",
          "es": "El campo del proveedor",
          "pl": "Pole dostawcy",
          "cs": "Pole dodavatele",
          "pt": "O campo fornecedor",
          "ro": "Câmpul furnizorului"
        },
        {
          "en": "The license identifier",
          "de": "Die Lizenzkennung",
          "nl": "De licentie-identifier",
          "fr": "L'identifiant de licence",
          "it": "L'identificatore della licenza",
          "es": "El identificador de licencia",
          "pl": "Identyfikator licencji",
          "cs": "Identifikátor licence",
          "pt": "O identificador de licença",
          "ro": "Identificatorul licenței"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "The PURL (Package URL) is the standard unique identifier for SBOM components. Vulnerability databases use PURLs to link CVE records to specific packages and versions, making them the anchor for automated vulnerability scanning.",
        "de": "Die PURL (Package URL) ist die standardisierte eindeutige Kennung für SBOM-Komponenten. Schwachstellendatenbanken verwenden PURLs, um CVE-Einträge mit spezifischen Paketen und Versionen zu verknüpfen, sodass sie den Anker für die automatisierte Schwachstellensuche bilden.",
        "nl": "De PURL (Package URL) is de standaard unieke identifier voor SBOM-componenten. Kwetsbaarheidsdatabases gebruiken PURLs om CVE-records te koppelen aan specifieke pakketten en versies, waardoor ze het anker vormen voor geautomatiseerde kwetsbaarheidsscanning.",
        "fr": "Le PURL (Package URL) est l'identifiant unique standard pour les composants SBOM. Les bases de données de vulnérabilités utilisent les PURL pour lier les enregistrements CVE à des packages et versions spécifiques, en faisant l'ancre pour l'analyse automatisée des vulnérabilités.",
        "it": "Il PURL (Package URL) è l'identificatore univoco standard per i componenti SBOM. I database delle vulnerabilità utilizzano i PURL per collegare i record CVE a pacchetti e versioni specifici, rendendoli l'ancora per la scansione automatizzata delle vulnerabilità.",
        "es": "El PURL (Package URL) es el identificador único estándar para los componentes SBOM. Las bases de datos de vulnerabilidades utilizan PURLs para vincular registros CVE a paquetes y versiones específicos, convirtiéndolos en el ancla para el escaneo automatizado de vulnerabilidades.",
        "pl": "PURL (Package URL) to standardowy unikalny identyfikator komponentów SBOM. Bazy danych podatności używają PURL do łączenia rekordów CVE z określonymi pakietami i wersjami, co czyni je punktem odniesienia dla automatycznego skanowania podatności.",
        "cs": "PURL (Package URL) je standardní jedinečný identifikátor komponent SBOM. Databáze zranitelností používají PURL k propojení záznamů CVE s konkrétními balíčky a verzemi, což z nich činí základ pro automatizované skenování zranitelností.",
        "pt": "O PURL (Package URL) é o identificador único padrão para componentes SBOM. As bases de dados de vulnerabilidades usam PURLs para ligar registos CVE a pacotes e versões específicos, tornando-os a âncora para a análise automatizada de vulnerabilidades.",
        "ro": "PURL (Package URL) este identificatorul unic standard pentru componentele SBOM. Bazele de date de vulnerabilități utilizează PURL-uri pentru a lega înregistrările CVE de pachete și versiuni specifice, făcându-le ancora pentru scanarea automată a vulnerabilităților."
      }
    },
    {
      "id": "1.1.2",
      "question": {
        "en": "Why must the SBOM record an exact version string rather than a version range?",
        "de": "Warum muss die SBOM eine exakte Versionszeichenfolge anstelle eines Versionsbereichs erfassen?",
        "nl": "Waarom moet de SBOM een exacte versietekenreeks vastleggen in plaats van een versiebereik?",
        "fr": "Pourquoi le SBOM doit-il enregistrer une chaîne de version exacte plutôt qu'une plage de versions ?",
        "it": "Perché l'SBOM deve registrare una stringa di versione esatta anziché un intervallo di versioni?",
        "es": "¿Por qué debe el SBOM registrar una cadena de versión exacta en lugar de un rango de versión?",
        "pl": "Dlaczego rekord SBOM musi zawierać dokładny ciąg wersji, a nie zakres wersji?",
        "cs": "Proč musí SBOM zaznamenávat přesný řetězec verze namísto rozsahu verzí?",
        "pt": "Por que motivo o SBOM deve registar uma cadeia de versão exata em vez de um intervalo de versões?",
        "ro": "De ce trebuie ca SBOM-ul să înregistreze un șir de versiune exact în loc de un interval de versiune?"
      },
      "options": [
        {
          "en": "Because Annex VII CRA requires a specific version format",
          "de": "Weil Anhang VII CRA ein spezifisches Versionsformat vorschreibt",
          "nl": "Omdat Bijlage VII CRA een specifiek versieformaat vereist",
          "fr": "Parce que l'annexe VII du CRA exige un format de version spécifique",
          "it": "Perché l'Allegato VII CRA richiede un formato di versione specifico",
          "es": "Porque el Anexo VII CRA requiere un formato de versión específico",
          "pl": "Ponieważ załącznik VII CRA wymaga określonego formatu wersji",
          "cs": "Protože Příloha VII CRA vyžaduje specifický formát verze",
          "pt": "Porque o Anexo VII do CRA exige um formato de versão específico",
          "ro": "Pentru că Anexa VII CRA impune un format specific de versiune"
        },
        {
          "en": "Because a CVE typically affects a version range and is fixed in a specific version. Without the exact version, you cannot determine exposure",
          "de": "Weil eine CVE in der Regel einen Versionsbereich betrifft und in einer bestimmten Version behoben wird. Ohne die exakte Version können Sie die Exposition nicht bestimmen.",
          "nl": "Omdat een CVE doorgaans een versiebereik treft en wordt verholpen in een specifieke versie. Zonder de exacte versie kunt u de blootstelling niet bepalen",
          "fr": "Parce qu'une CVE affecte typiquement une plage de versions et est corrigée dans une version spécifique. Sans la version exacte, vous ne pouvez pas déterminer l'exposition",
          "it": "Perché una CVE in genere colpisce un intervallo di versioni ed è corretta in una versione specifica. Senza la versione esatta, non è possibile determinare l'esposizione",
          "es": "Porque un CVE suele afectar a un rango de versiones y se corrige en una versión específica. Sin la versión exacta, no se puede determinar la exposición",
          "pl": "Ponieważ CVE zazwyczaj dotyczy zakresu wersji i jest naprawiane w konkretnej wersji. Bez dokładnej wersji nie można określić narażenia",
          "cs": "Protože CVE obvykle ovlivňuje rozsah verzí a je opravena v konkrétní verzi. Bez přesné verze nelze určit expozici",
          "pt": "Porque uma CVE afeta tipicamente um intervalo de versões e é corrigida numa versão específica. Sem a versão exata, não é possível determinar a exposição",
          "ro": "Pentru că un CVE afectează de obicei un interval de versiune și este remediat într-o versiune specifică. Fără versiunea exactă, nu puteți determina expunerea"
        },
        {
          "en": "Because PURL syntax does not support ranges",
          "de": "Weil die PURL-Syntax keine Bereiche unterstützt",
          "nl": "Omdat de PURL-syntaxis geen bereiken ondersteunt",
          "fr": "Parce que la syntaxe PURL ne prend pas en charge les plages",
          "it": "Perché la sintassi PURL non supporta gli intervalli",
          "es": "Porque la sintaxis PURL no admite rangos",
          "pl": "Ponieważ składnia PURL nie obsługuje zakresów",
          "cs": "Protože syntaxe PURL nepodporuje rozsahy",
          "pt": "Porque a sintaxe PURL não suporta intervalos",
          "ro": "Pentru că sintaxa PURL nu acceptă intervale"
        },
        {
          "en": "Because the supplier field requires a matching version",
          "de": "Weil das Lieferantenfeld eine passende Version erfordert",
          "nl": "Omdat het leveranciersveld een overeenkomende versie vereist",
          "fr": "Parce que le champ fournisseur exige une version correspondante",
          "it": "Perché il campo fornitore richiede una versione corrispondente",
          "es": "Porque el campo del proveedor requiere una versión coincidente",
          "pl": "Ponieważ pole dostawcy wymaga pasującej wersji",
          "cs": "Protože pole dodavatele vyžaduje odpovídající verzi",
          "pt": "Porque o campo fornecedor exige uma versão correspondente",
          "ro": "Pentru că câmpul furnizorului necesită o versiune corespunzătoare"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "CVEs are fixed in specific versions. A version range like '>=2.0' does not tell a scanner which binary is actually deployed, so it cannot determine whether that binary is affected by a given CVE.",
        "de": "CVEs werden in spezifischen Versionen behoben. Ein Versionsbereich wie '>=2.0' zeigt einem Scanner nicht, welche Binärdatei tatsächlich eingesetzt ist, sodass er nicht feststellen kann, ob diese Binärdatei von einer bestimmten CVE betroffen ist.",
        "nl": "CVE's worden verholpen in specifieke versies. Een versiebereik zoals '>=2.0' vertelt een scanner niet welke binaire versie daadwerkelijk is uitgerold, dus kan niet worden bepaald of die binaire versie wordt getroffen door een gegeven CVE.",
        "fr": "Les CVE sont corrigées dans des versions spécifiques. Une plage de versions comme '>=2.0' n'indique pas à un scanner quel binaire est réellement déployé, donc il ne peut pas déterminer si ce binaire est affecté par une CVE donnée.",
        "it": "Le CVE sono corrette in versioni specifiche. Un intervallo di versioni come '>=2.0' non indica a uno scanner quale binario è effettivamente distribuito, quindi non può determinare se quel binario è interessato da una determinata CVE.",
        "es": "Los CVE se corrigen en versiones específicas. Un rango de versión como '>=2.0' no indica a un escáner qué binario está realmente implementado, por lo que no puede determinar si ese binario se ve afectado por un CVE dado.",
        "pl": "CVE są naprawiane w konkretnych wersjach. Zakres wersji taki jak '>=2.0' nie informuje skanera, który plik binarny jest faktycznie wdrożony, więc nie można ustalić, czy dany plik binarny jest dotknięty CVE.",
        "cs": "CVE jsou opravena v konkrétních verzích. Rozsah verzí jako '>=2.0' neříká skeneru, který binární soubor je skutečně nasazen, takže nelze určit, zda je tento binární soubor ovlivněn daným CVE.",
        "pt": "As CVEs são corrigidas em versões específicas. Um intervalo de versões como '>=2.0' não indica a um scanner qual o binário realmente implementado, pelo que não é possível determinar se esse binário é afetado por uma CVE específica.",
        "ro": "CVE-urile sunt remediate în versiuni specifice. Un interval de versiune precum '>=2.0' nu indică scanerului ce binar este de fapt implementat, deci nu poate determina dacă acel binar este afectat de un anumit CVE."
      }
    },
    {
      "id": "1.1.3",
      "question": {
        "en": "What does a hash field in an SBOM component entry verify?",
        "de": "Was verifiziert ein Hash-Feld in einem SBOM-Komponenteneintrag?",
        "nl": "Wat verifieert een hashveld in een SBOM-componentvermelding?",
        "fr": "Que vérifie un champ de hachage dans une entrée de composant SBOM ?",
        "it": "Cosa verifica il campo hash in una voce di componente SBOM?",
        "es": "¿Qué verifica un campo de hash en una entrada de componente SBOM?",
        "pl": "Co weryfikuje pole skrótu w rekordzie komponentu SBOM?",
        "cs": "Co ověřuje pole hash v položce komponenty SBOM?",
        "pt": "O que verifica um campo de hash numa entrada de componente SBOM?",
        "ro": "Ce verifică un câmp hash într-o intrare de componentă SBOM?"
      },
      "options": [
        {
          "en": "That the component was downloaded from an approved registry",
          "de": "Dass die Komponente aus einem genehmigten Registry heruntergeladen wurde",
          "nl": "Dat de component is gedownload van een goedgekeurd register",
          "fr": "Que le composant a été téléchargé depuis un registre approuvé",
          "it": "Che il componente sia stato scaricato da un registro approvato",
          "es": "Que el componente se descargó de un registro aprobado",
          "pl": "Że komponent został pobrany z zatwierdzonego rejestru",
          "cs": "Že komponenta byla stažena z schváleného registru",
          "pt": "Que o componente foi descarregado de um registo aprovado",
          "ro": "Că componenta a fost descărcată dintr-un registru aprobat"
        },
        {
          "en": "That the component has no known vulnerabilities",
          "de": "Dass die Komponente keine bekannten Schwachstellen aufweist",
          "nl": "Dat de component geen bekende kwetsbaarheden heeft",
          "fr": "Que le composant n'a pas de vulnérabilités connues",
          "it": "Che il componente non abbia vulnerabilità note",
          "es": "Que el componente no tiene vulnerabilidades conocidas",
          "pl": "Że komponent nie ma znanych podatności",
          "cs": "Že komponenta nemá žádné známé zranitelnosti",
          "pt": "Que o componente não tem vulnerabilidades conhecidas",
          "ro": "Că componenta nu are vulnerabilități cunoscute"
        },
        {
          "en": "That the component file has not been tampered with since the SBOM was generated",
          "de": "Dass die Komponentendatei seit der Erstellung der SBOM nicht manipuliert wurde",
          "nl": "Dat het componentbestand niet is gemanipuleerd sinds de SBOM is gegenereerd",
          "fr": "Que le fichier du composant n'a pas été altéré depuis la génération du SBOM",
          "it": "Che il file del componente non sia stato manomesso dalla generazione dell'SBOM",
          "es": "Que el archivo del componente no ha sido manipulado desde que se generó el SBOM",
          "pl": "Że plik komponentu nie został zmodyfikowany od momentu wygenerowania SBOM",
          "cs": "Že soubor komponenty nebyl od vygenerování SBOM změněn",
          "pt": "Que o ficheiro do componente não foi alterado desde que o SBOM foi gerado",
          "ro": "Că fișierul componentei nu a fost modificat de la generarea SBOM-ului"
        },
        {
          "en": "That the PURL matches the version field",
          "de": "Dass die PURL mit dem Versionsfeld übereinstimmt",
          "nl": "Dat de PURL overeenkomt met het versieveld",
          "fr": "Que le PURL correspond au champ de version",
          "it": "Che il PURL corrisponda al campo versione",
          "es": "Que el PURL coincide con el campo de versión",
          "pl": "Że PURL pasuje do pola wersji",
          "cs": "Že PURL odpovídá poli verze",
          "pt": "Que o PURL corresponde ao campo de versão",
          "ro": "Că PURL corespunde câmpului de versiune"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "A hash is a fingerprint of the component file. It lets you verify integrity: that the component deployed is exactly the one the SBOM documents. It does not indicate vulnerability status or registry origin.",
        "de": "Ein Hash ist ein Fingerabdruck der Komponentendatei. Er ermöglicht die Überprüfung der Integrität: dass die eingesetzte Komponente genau der in der SBOM dokumentierten entspricht. Er gibt keinen Aufschluss über den Schwachstellenstatus oder den Registry-Ursprung.",
        "nl": "Een hash is een vingerafdruk van het componentbestand. Hiermee kunt u de integriteit verifiëren: dat de uitgerolde component precies degene is die de SBOM documenteert. Het geeft geen indicatie van de kwetsbaarheidsstatus of de herkomst van het register.",
        "fr": "Un hachage est une empreinte du fichier du composant. Il permet de vérifier l'intégrité : que le composant déployé est exactement celui documenté par le SBOM. Il n'indique pas le statut de vulnérabilité ni l'origine du registre.",
        "it": "Un hash è un'impronta digitale del file del componente. Consente di verificare l'integrità: che il componente distribuito sia esattamente quello documentato dall'SBOM. Non indica lo stato delle vulnerabilità né l'origine dal registro.",
        "es": "Un hash es una huella digital del archivo del componente. Permite verificar la integridad: que el componente implementado es exactamente el que documenta el SBOM. No indica el estado de vulnerabilidad ni el origen del registro.",
        "pl": "Skrót jest odciskiem palca pliku komponentu. Pozwala zweryfikować integralność: że wdrożony komponent jest dokładnie tym, który dokumentuje SBOM. Nie wskazuje statusu podatności ani pochodzenia z rejestru.",
        "cs": "Hash je otisk souboru komponenty. Umožňuje ověřit integritu: že nasazená komponenta je přesně ta, kterou dokumentuje SBOM. Neindikuje stav zranitelnosti ani původ registru.",
        "pt": "Um hash é uma impressão digital do ficheiro do componente. Permite verificar a integridade: que o componente implementado é exatamente aquele que o SBOM documenta. Não indica o estado de vulnerabilidade nem a origem do registo.",
        "ro": "Un hash este o amprentă a fișierului componentei. Permite verificarea integrității: componenta implementată este exact cea documentată în SBOM. Nu indică starea vulnerabilităților sau originea din registru."
      }
    },
    {
      "id": "1.1.4",
      "question": {
        "en": "What does the SBOM metadata section document?",
        "de": "Was dokumentiert der Metadatenabschnitt der SBOM?",
        "nl": "Wat documenteert de metadata-sectie van de SBOM?",
        "fr": "Que documente la section de métadonnées du SBOM ?",
        "it": "Cosa documenta la sezione di metadati dell'SBOM?",
        "es": "¿Qué documenta la sección de metadatos del SBOM?",
        "pl": "Co dokumentuje sekcja metadanych SBOM?",
        "cs": "Co dokumentuje sekce metadat SBOM?",
        "pt": "O que documenta a secção de metadados do SBOM?",
        "ro": "Ce documentează secțiunea de metadate a SBOM-ului?"
      },
      "options": [
        {
          "en": "The vulnerability status of each component",
          "de": "Den Schwachstellenstatus jeder Komponente",
          "nl": "De kwetsbaarheidsstatus van elke component",
          "fr": "Le statut de vulnérabilité de chaque composant",
          "it": "Lo stato delle vulnerabilità di ciascun componente",
          "es": "El estado de vulnerabilidad de cada componente",
          "pl": "Status podatności każdego komponentu",
          "cs": "Stav zranitelnosti každé komponenty",
          "pt": "O estado de vulnerabilidade de cada componente",
          "ro": "Starea de vulnerabilitate a fiecărei componente"
        },
        {
          "en": "When the SBOM was generated, which tool generated it, and what product it describes",
          "de": "Wann die SBOM erstellt wurde, welches Tool sie erzeugt hat und welches Produkt sie beschreibt",
          "nl": "Wanneer de SBOM is gegenereerd, welk hulpmiddel deze heeft gegenereerd en welk product het beschrijft",
          "fr": "Quand le SBOM a été généré, quel outil l'a généré et quel produit il décrit",
          "it": "Quando è stato generato l'SBOM, quale strumento lo ha generato e quale prodotto descrive",
          "es": "Cuándo se generó el SBOM, qué herramienta lo generó y qué producto describe",
          "pl": "Kiedy wygenerowano SBOM, które narzędzie go utworzyło oraz jaki produkt opisuje",
          "cs": "Kdy byl SBOM vygenerován, který nástroj jej vygeneroval a jaký produkt popisuje",
          "pt": "Quando o SBOM foi gerado, qual ferramenta o gerou e qual produto descreve",
          "ro": "Când a fost generat SBOM-ul, ce instrument l-a generat și ce produs descrie"
        },
        {
          "en": "The license obligations for all components",
          "de": "Die Lizenzpflichten für alle Komponenten",
          "nl": "De licentieverplichtingen voor alle componenten",
          "fr": "Les obligations de licence pour tous les composants",
          "it": "Gli obblighi di licenza per tutti i componenti",
          "es": "Las obligaciones de licencia para todos los componentes",
          "pl": "Obowiązki licencyjne dla wszystkich komponentów",
          "cs": "Licenční povinnosti pro všechny komponenty",
          "pt": "As obrigações de licença para todos os componentes",
          "ro": "Obligațiile de licență pentru toate componentele"
        },
        {
          "en": "The supplier contact information for each component",
          "de": "Die Lieferantenkontaktinformationen für jede Komponente",
          "nl": "De contactgegevens van de leverancier voor elke component",
          "fr": "Les informations de contact du fournisseur pour chaque composant",
          "it": "Le informazioni di contatto del fornitore per ciascun componente",
          "es": "La información de contacto del proveedor para cada componente",
          "pl": "Dane kontaktowe dostawcy dla każdego komponentu",
          "cs": "Kontaktní informace dodavatele pro každou komponentu",
          "pt": "A informação de contacto do fornecedor para cada componente",
          "ro": "Informațiile de contact ale furnizorului pentru fiecare componentă"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "SBOM metadata covers the document itself: the generation timestamp, the tool that created it, and the top-level product it describes. Auditors check metadata first to verify the SBOM is current and properly attributed.",
        "de": "Die SBOM-Metadaten betreffen das Dokument selbst: den Zeitstempel der Erstellung, das Tool, das es erzeugt hat, und das übergeordnete Produkt, das es beschreibt. Prüfer prüfen Metadaten zuerst, um zu verifizieren, dass die SBOM aktuell und korrekt zugeordnet ist.",
        "nl": "SBOM-metadata betreft het document zelf: het tijdstempel van generatie, het hulpmiddel dat het heeft gemaakt en het product op hoofdniveau dat het beschrijft. Auditors controleren metadata eerst om te verifiëren dat de SBOM actueel is en correct is toegeschreven.",
        "fr": "Les métadonnées du SBOM couvrent le document lui-même : l'horodatage de génération, l'outil qui l'a créé et le produit de niveau supérieur qu'il décrit. Les auditeurs vérifient d'abord les métadonnées pour confirmer que le SBOM est actuel et correctement attribué.",
        "it": "I metadati dell'SBOM riguardano il documento stesso: il timestamp di generazione, lo strumento che lo ha creato e il prodotto di primo livello che descrive. Gli auditor controllano prima i metadati per verificare che l'SBOM sia aggiornato e correttamente attribuito.",
        "es": "Los metadatos del SBOM cubren el propio documento. Incluyen la marca de tiempo de generación, la herramienta que lo creó y el producto de nivel superior que describe. Los auditores revisan primero los metadatos para verificar que el SBOM está actualizado y correctamente atribuido.",
        "pl": "Metadane SBOM obejmują sam dokument: znacznik czasu wygenerowania, narzędzie, które go utworzyło, oraz produkt najwyższego poziomu, który opisuje. Audytorzy sprawdzają najpierw metadane, aby potwierdzić, że SBOM jest aktualny i prawidłowo przypisany.",
        "cs": "Metadata SBOM pokrývají samotný dokument: časové razítko vygenerování, nástroj, který jej vytvořil, a produkt nejvyšší úrovně, který popisuje. Auditoři kontrolují metadata jako první, aby ověřili, že SBOM je aktuální a správně přiřazený.",
        "pt": "Os metadados do SBOM abrangem o próprio documento: o timestamp de geração, a ferramenta que o criou e o produto de nível superior que descreve. Os auditores verificam primeiro os metadados para confirmar que o SBOM está atualizado e devidamente atribuído.",
        "ro": "Metadatele SBOM acoperă documentul în sine: marcajul temporal al generării, instrumentul care l-a creat și produsul de nivel superior pe care îl descrie. Auditorii verifică mai întâi metadatele pentru a confirma că SBOM-ul este actual și atribuit corect."
      }
    },
    {
      "id": "1.1.5",
      "question": {
        "en": "Which format satisfies the CRA Annex I, Part II, point (1) requirement for a 'machine-readable' SBOM?",
        "de": "Welches Format erfüllt die Anforderung von CRA Anhang I Teil II Nummer 1 für eine 'maschinenlesbare' SBOM?",
        "nl": "Welk formaat voldoet aan de eis in Bijlage I Deel II punt (1) van de CRA voor een 'machineleesbare' SBOM?",
        "fr": "Quel format satisfait à l'exigence de l'annexe I, partie II, point (1) du CRA pour un SBOM 'lisible par machine' ?",
        "it": "Quale formato soddisfa il requisito di Allegato I, Parte II, punto (1) CRA per un SBOM 'machine-readable'?",
        "es": "¿Qué formato satisface el requisito del Anexo I, Parte II, punto (1) del CRA para un SBOM 'legible por máquina'?",
        "pl": "Który format spełnia wymaganie załącznika I część II punkt (1) CRA dotyczące 'maszynowo czytelnego' SBOM?",
        "cs": "Který formát splňuje požadavek CRA Příloha I Část II bod (1) na 'strojově čitelný' SBOM?",
        "pt": "Qual formato satisfaz o requisito do Anexo I, Parte II, ponto (1) do CRA para um SBOM 'legível por máquina'?",
        "ro": "Ce format îndeplinește cerința din Anexa I, Partea II, punctul (1) CRA pentru un SBOM 'lizibil automat'?"
      },
      "options": [
        {
          "en": "A PDF listing all component names and versions",
          "de": "Ein PDF, das alle Komponentennamen und Versionen auflistet",
          "nl": "Een PDF met een lijst van alle componentnamen en versies",
          "fr": "Un PDF listant tous les noms et versions de composants",
          "it": "Un PDF che elenca tutti i nomi e le versioni dei componenti",
          "es": "Un PDF que enumera todos los nombres y versiones de los componentes",
          "pl": "Plik PDF zawierający listę wszystkich nazw i wersji komponentów",
          "cs": "PDF obsahující seznam všech názvů a verzí komponent",
          "pt": "Um PDF que lista todos os nomes e versões de componentes",
          "ro": "Un PDF care listează toate numele și versiunile componentelor"
        },
        {
          "en": "A spreadsheet with component name, version, and supplier columns",
          "de": "Eine Tabelle mit Spalten für Komponentenname, Version und Lieferant",
          "nl": "Een spreadsheet met kolommen voor componentnaam, versie en leverancier",
          "fr": "Une feuille de calcul avec des colonnes nom du composant, version et fournisseur",
          "it": "Un foglio di calcolo con colonne per nome del componente, versione e fornitore",
          "es": "Una hoja de cálculo con columnas de nombre del componente, versión y proveedor",
          "pl": "Arkusz kalkulacyjny z kolumnami nazwy komponentu, wersji i dostawcy",
          "cs": "Tabulka se sloupci názvu komponenty, verze a dodavatele",
          "pt": "Uma folha de cálculo com colunas de nome do componente, versão e fornecedor",
          "ro": "O foaie de calcul cu coloane pentru numele componentei, versiune și furnizor"
        },
        {
          "en": "CycloneDX JSON or SPDX JSON, formats a vulnerability scanner can parse without human intervention",
          "de": "CycloneDX JSON oder SPDX JSON, Formate, die ein Schwachstellen-Scanner ohne menschliches Eingreifen parsen kann",
          "nl": "CycloneDX JSON of SPDX JSON, formaten die een kwetsbaarheidsscanner kan parseren zonder menselijke tussenkomst",
          "fr": "CycloneDX JSON ou SPDX JSON, formats qu'un scanner de vulnérabilités peut analyser sans intervention humaine",
          "it": "CycloneDX JSON o SPDX JSON, formati che uno scanner di vulnerabilità può analizzare senza intervento umano",
          "es": "CycloneDX JSON o SPDX JSON, formatos que un escáner de vulnerabilidades puede analizar sin intervención humana",
          "pl": "CycloneDX JSON lub SPDX JSON, formaty, które skaner podatności może przetworzyć bez interwencji człowieka",
          "cs": "CycloneDX JSON nebo SPDX JSON, formáty, které skener zranitelností dokáže analyzovat bez lidského zásahu",
          "pt": "CycloneDX JSON ou SPDX JSON, formatos que um scanner de vulnerabilidades pode analisar sem intervenção humana",
          "ro": "CycloneDX JSON sau SPDX JSON, formate pe care un scaner de vulnerabilități le poate analiza fără intervenție umană"
        },
        {
          "en": "Any file that lists component names alphabetically",
          "de": "Jede Datei, die Komponentennamen alphabetisch auflistet",
          "nl": "Elk bestand dat componentnamen alfabetisch oplijst",
          "fr": "Tout fichier qui liste les noms de composants par ordre alphabétique",
          "it": "Qualsiasi file che elenca i nomi dei componenti in ordine alfabetico",
          "es": "Cualquier archivo que enumere los nombres de los componentes alfabéticamente",
          "pl": "Dowolny plik zawierający nazwy komponentów w kolejności alfabetycznej",
          "cs": "Jakýkoli soubor, který uvádí názvy komponent abecedně",
          "pt": "Qualquer ficheiro que liste os nomes dos componentes por ordem alfabética",
          "ro": "Orice fișier care listează numele componentelor în ordine alfabetică"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "Machine-readable means a tool can parse it programmatically. CycloneDX JSON and SPDX JSON both satisfy this. A PDF or spreadsheet cannot be processed by a vulnerability scanner without manual extraction.",
        "de": "Maschinenlesbar bedeutet, dass ein Tool sie programmatisch parsen kann. CycloneDX JSON und SPDX JSON erfüllen diese Anforderung. Ein PDF oder eine Tabelle kann von einem Schwachstellen-Scanner nicht ohne manuelle Extraktion verarbeitet werden.",
        "nl": "Machineleesbaar betekent dat een hulpmiddel het programmatisch kan parseren. Zowel CycloneDX JSON als SPDX JSON voldoen hieraan. Een PDF of spreadsheet kan niet door een kwetsbaarheidsscanner worden verwerkt zonder handmatige extractie.",
        "fr": "Lisible par machine signifie qu'un outil peut l'analyser de manière programmatique. CycloneDX JSON et SPDX JSON satisfont tous deux à cela. Un PDF ou une feuille de calcul ne peut pas être traité par un scanner de vulnérabilités sans extraction manuelle.",
        "it": "Machine-readable significa che uno strumento può analizzarlo programmaticamente. Sia CycloneDX JSON sia SPDX JSON soddisfano questo requisito. Un PDF o un foglio di calcolo non può essere elaborato da uno scanner di vulnerabilità senza estrazione manuale.",
        "es": "Legible por máquina significa que una herramienta puede analizarlo mediante programación. Tanto CycloneDX JSON como SPDX JSON cumplen este requisito. Un PDF o una hoja de cálculo no pueden ser procesados por un escáner de vulnerabilidades sin extracción manual.",
        "pl": "Maszynowo czytelny oznacza, że narzędzie może go przetworzyć programowo. CycloneDX JSON i SPDX JSON spełniają to wymaganie. Pliku PDF ani arkusza kalkulacyjnego nie można przetworzyć przez skaner podatności bez ręcznego wyodrębnienia.",
        "cs": "Strojově čitelný znamená, že nástroj jej dokáže programově analyzovat. CycloneDX JSON i SPDX JSON toto splňují. PDF nebo tabulku nelze zpracovat skenerem zranitelností bez ruční extrakce.",
        "pt": "Legível por máquina significa que uma ferramenta pode analisá-lo programaticamente. Tanto o CycloneDX JSON como o SPDX JSON satisfazem isto. Um PDF ou folha de cálculo não pode ser processado por um scanner de vulnerabilidades sem extração manual.",
        "ro": "Lizibil automat înseamnă că un instrument îl poate analiza programatic. Atât CycloneDX JSON cât și SPDX JSON îndeplinesc această cerință. Un PDF sau o foaie de calcul nu poate fi procesat de un scaner de vulnerabilități fără extracție manuală."
      }
    }
  ]
});

export default quiz;
