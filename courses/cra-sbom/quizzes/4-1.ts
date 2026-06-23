import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "4.1",
  "passingScore": 75,
  "questions": [
    {
      "id": "4.1.1",
      "question": {
        "en": "Which CRA article requires manufacturers to produce a software bill of materials?",
        "de": "Welcher CRA-Artikel verpflichtet Hersteller zur Erstellung einer Software Bill of Materials?",
        "nl": "Welk CRA-artikel verplicht fabrikanten tot het produceren van een software bill of materials?",
        "fr": "Quel article du CRA exige des fabricants qu'ils produisent une nomenclature logicielle ?",
        "it": "Quale articolo del CRA richiede ai fabbricanti di produrre una distinta base del software?",
        "es": "¿Qué artículo del CRA exige a los fabricantes que elaboren una lista de materiales de software?",
        "pl": "Który artykuł CRA wymaga od producentów sporządzenia zestawienia materiałów oprogramowania?",
        "cs": "Který článek CRA vyžaduje od výrobců vytvoření seznamu softwarových komponent?",
        "pt": "Que artigo do CRA exige que os fabricantes produzam uma lista de materiais de software?",
        "ro": "Ce articol CRA impune producătorilor să producă o listă a materialelor software?"
      },
      "options": [
        {
          "en": "Article 14(1)",
          "de": "Artikel 14(1)",
          "nl": "Artikel 14(1)",
          "fr": "Article 14(1)",
          "it": "Articolo 14(1)",
          "es": "Artículo 14(1)",
          "pl": "Artykuł 14(1)",
          "cs": "Článek 14(1)",
          "pt": "Artigo 14(1)",
          "ro": "Articolul 14(1)"
        },
        {
          "en": "Article 13(5)",
          "de": "Artikel 13(5)",
          "nl": "Artikel 13(5)",
          "fr": "Article 13(5)",
          "it": "Articolo 13(5)",
          "es": "Artículo 13(5)",
          "pl": "Artykuł 13(5)",
          "cs": "Článek 13(5)",
          "pt": "Artigo 13(5)",
          "ro": "Articolul 13(5)"
        },
        {
          "en": "Article 31(3)",
          "de": "Artikel 31(3)",
          "nl": "Artikel 31(3)",
          "fr": "Article 31(3)",
          "it": "Articolo 31(3)",
          "es": "Artículo 31(3)",
          "pl": "Artykuł 31(3)",
          "cs": "Článek 31(3)",
          "pt": "Artigo 31(3)",
          "ro": "Articolul 31(3)"
        },
        {
          "en": "Annex I, Part II, point (1)",
          "de": "Anhang I Teil II Nummer 1",
          "nl": "Bijlage I, Deel II, punt (1)",
          "fr": "Annexe I, Partie II, point (1)",
          "it": "Allegato I, Parte II, punto (1)",
          "es": "Anexo I, Parte II, punto (1)",
          "pl": "Załącznik I, Część II, punkt (1)",
          "cs": "Příloha I, část II, bod (1)",
          "pt": "Anexo I, Parte II, ponto (1)",
          "ro": "Anexa I, Partea II, punctul (1)"
        }
      ],
      "correctIndex": 3,
      "explanation": {
        "en": "Annex I, Part II, point (1) is the SBOM clause. It requires manufacturers to identify and document components in a commonly used, machine-readable format covering at least the top-level dependencies. Article 13(5) covers due diligence on third-party components. Article 13(13) covers retention. Article 14 covers vulnerability reporting.",
        "de": "Anhang I Teil II Nummer 1 ist die SBOM-Klausel. Sie verpflichtet Hersteller, Komponenten in einem gängigen, maschinenlesbaren Format zu identifizieren und zu dokumentieren, das mindestens die obersten Abhängigkeiten abdeckt. Artikel 13(5) behandelt die Sorgfaltspflicht bei Drittanbieterkomponenten. Artikel 13(13) behandelt die Aufbewahrung. Artikel 14 behandelt die Schwachstellenmeldung.",
        "nl": "Bijlage I, Deel II, punt (1) is de SBOM-clausule. Hierin worden fabrikanten verplicht componenten te identificeren en te documenteren in een algemeen gebruikt, machineleesbaar formaat dat ten minste de top-level dependencies omvat. Artikel 13(5) behandelt due diligence voor componenten van derden. Artikel 13(13) behandelt de bewaartermijn. Artikel 14 behandelt de melding van kwetsbaarheden.",
        "fr": "L'annexe I, partie II, point (1) est la clause relative au SBOM. Elle impose aux fabricants d'identifier et de documenter les composants dans un format courant lisible par machine couvrant au moins les dépendances de premier niveau. L'article 13(5) porte sur la diligence raisonnable concernant les composants tiers. L'article 13(13) porte sur la conservation. L'article 14 porte sur la notification des vulnérabilités.",
        "it": "Allegato I, Parte II, punto (1) è la clausola relativa all'SBOM. Richiede ai fabbricanti di identificare e documentare i componenti in un formato comunemente usato e leggibile da macchina che copra almeno le dipendenze di primo livello. L'articolo 13(5) riguarda la due diligence sui componenti di terzi. L'articolo 13(13) riguarda la conservazione. L'articolo 14 riguarda la segnalazione delle vulnerabilità.",
        "es": "Anexo I, Parte II, punto (1) es la cláusula de SBOM. Exige a los fabricantes que identifiquen y documenten los componentes en un formato de uso común legible por máquina que cubra al menos las dependencias de nivel superior. El Artículo 13(5) cubre la diligencia debida sobre los componentes de terceros. El Artículo 13(13) cubre la retención. El Artículo 14 cubre la notificación de vulnerabilidades.",
        "pl": "Załącznik I, Część II, punkt (1) to klauzula SBOM. Wymaga od producentów identyfikacji i udokumentowania komponentów w powszechnie stosowanym, czytelnym maszynowo formacie obejmującym co najmniej zależności najwyższego poziomu. Artykuł 13(5) dotyczy należytej staranności w zakresie komponentów stron trzecich. Artykuł 13(13) dotyczy przechowywania. Artykuł 14 dotyczy zgłaszania podatności.",
        "cs": "Příloha I, část II, bod (1) je klauzule o SBOM. Vyžaduje od výrobců identifikaci a dokumentaci komponent ve všeobecně používaném strojově čitelném formátu pokrývajícím alespoň závislosti nejvyšší úrovně. Článek 13(5) upravuje náležitou péči u komponent třetích stran. Článek 13(13) upravuje uchovávání. Článek 14 upravuje hlášení zranitelností.",
        "pt": "O Anexo I, Parte II, ponto (1) é a cláusula do SBOM. Exige que os fabricantes identifiquem e documentem componentes num formato comum, legível por máquina, que cubra pelo menos as dependências de nível superior. O Artigo 13(5) abrange a devida diligência sobre componentes de terceiros. O Artigo 13(13) abrange a retenção. O Artigo 14 abrange a comunicação de vulnerabilidades.",
        "ro": "Anexa I, Partea II, punctul (1) este clauza SBOM. Aceasta impune producătorilor să identifice și să documenteze componentele într-un format utilizat în mod obișnuit, lizibil de mașină, care acoperă cel puțin dependențele de nivel superior. Articolul 13(5) acoperă diligența necesară privind componentele terțe. Articolul 13(13) acoperă păstrarea. Articolul 14 acoperă raportarea vulnerabilităților."
      }
    },
    {
      "id": "4.1.2",
      "question": {
        "en": "What is the connection between the SBOM and CRA Article 14 vulnerability reporting?",
        "de": "Welcher Zusammenhang besteht zwischen der SBOM und der CRA-Schwachstellenmeldung nach Artikel 14?",
        "nl": "Wat is het verband tussen de SBOM en CRA Artikel 14 voor de melding van kwetsbaarheden?",
        "fr": "Quel est le lien entre le SBOM et la notification des vulnérabilités prévue à l'article 14 du CRA ?",
        "it": "Qual è il collegamento tra l'SBOM e la segnalazione delle vulnerabilità ai sensi dell'articolo 14 del CRA?",
        "es": "¿Cuál es la conexión entre el SBOM y la notificación de vulnerabilidades del Artículo 14 del CRA?",
        "pl": "Jaki jest związek między SBOM a zgłaszaniem podatności na podstawie artykułu 14 CRA?",
        "cs": "Jaká je souvislost mezi SBOM a hlášením zranitelností podle článku 14 CRA?",
        "pt": "Qual a ligação entre o SBOM e a comunicação de vulnerabilidades do Artigo 14 do CRA?",
        "ro": "Care este legătura dintre SBOM și raportarea vulnerabilităților conform Articolului 14 din CRA?"
      },
      "options": [
        {
          "en": "The SBOM must be submitted to ENISA when filing an Article 14 report",
          "de": "Die SBOM muss bei Einreichung eines Berichts nach Artikel 14 an ENISA übermittelt werden.",
          "nl": "De SBOM moet bij indiening van een melding op grond van Artikel 14 aan ENISA worden verstrekt",
          "fr": "Le SBOM doit être transmis à ENISA lors du dépôt d'un rapport au titre de l'article 14",
          "it": "L'SBOM deve essere presentato all'ENISA al momento della presentazione di una segnalazione ai sensi dell'articolo 14",
          "es": "El SBOM debe presentarse a ENISA al presentar un informe del Artículo 14",
          "pl": "SBOM należy przedłożyć ENISA przy składaniu zgłoszenia na podstawie artykułu 14",
          "cs": "SBOM musí být předložen ENISA při podání hlášení podle článku 14",
          "pt": "O SBOM deve ser submetido à ENISA ao apresentar um relatório do Artigo 14",
          "ro": "SBOM trebuie transmis către ENISA la depunerea unui raport conform Articolului 14"
        },
        {
          "en": "The SBOM is the component inventory that enables automated vulnerability monitoring: without it, you cannot identify which CVEs affect your product",
          "de": "Die SBOM ist das Komponenteninventar, das automatisiertes Schwachstellenmonitoring ermöglicht: Ohne sie können Sie nicht feststellen, welche CVEs Ihr Produkt betreffen.",
          "nl": "De SBOM vormt het componentenoverzicht dat geautomatiseerde monitoring van kwetsbaarheden mogelijk maakt: zonder dit overzicht kunt u niet vaststellen welke CVE's uw product raken",
          "fr": "Le SBOM constitue l'inventaire des composants qui permet la surveillance automatisée des vulnérabilités. Sans lui, il est impossible d'identifier les CVE qui affectent le produit",
          "it": "L'SBOM è l'inventario dei componenti che consente il monitoraggio automatizzato delle vulnerabilità: senza di esso non è possibile identificare quali CVE interessano il prodotto",
          "es": "El SBOM es el inventario de componentes que permite la supervisión automatizada de vulnerabilidades: sin él, no puede identificar qué CVE afectan a su producto",
          "pl": "SBOM to inwentarz komponentów umożliwiający automatyczne monitorowanie podatności: bez niego nie można zidentyfikować CVE wpływających na produkt",
          "cs": "SBOM je inventář komponent, který umožňuje automatické monitorování zranitelností: bez něj nelze identifikovat, která CVE se týkají vašeho produktu",
          "pt": "O SBOM é o inventário de componentes que permite a monitorização automatizada de vulnerabilidades: sem ele, não é possível identificar que CVEs afetam o produto",
          "ro": "SBOM este inventarul componentelor care permite monitorizarea automată a vulnerabilităților: fără acesta nu puteți identifica ce CVE afectează produsul dumneavoastră"
        },
        {
          "en": "Article 14 requires the SBOM to be made public when a vulnerability is reported",
          "de": "Artikel 14 verlangt, dass die SBOM bei Meldung einer Schwachstelle öffentlich gemacht wird.",
          "nl": "Artikel 14 verplicht de openbaarmaking van de SBOM wanneer een kwetsbaarheid wordt gemeld",
          "fr": "L'article 14 exige que le SBOM soit rendu public lors de la notification d'une vulnérabilité",
          "it": "L'articolo 14 richiede che l'SBOM sia reso pubblico quando viene segnalata una vulnerabilità",
          "es": "El Artículo 14 exige que el SBOM se haga público cuando se notifica una vulnerabilidad",
          "pl": "Artykuł 14 wymaga upublicznienia SBOM w momencie zgłoszenia podatności",
          "cs": "Článek 14 vyžaduje zveřejnění SBOM při hlášení zranitelnosti",
          "pt": "O Artigo 14 exige que o SBOM seja tornado público quando uma vulnerabilidade é comunicada",
          "ro": "Articolul 14 impune ca SBOM să fie făcut public atunci când se raportează o vulnerabilitate"
        },
        {
          "en": "The SBOM is only relevant to Article 14 if the product has more than 50 top-level dependencies",
          "de": "Die SBOM ist für Artikel 14 nur relevant, wenn das Produkt mehr als 50 oberste Abhängigkeiten hat.",
          "nl": "De SBOM is alleen relevant voor Artikel 14 als het product meer dan 50 top-level dependencies bevat",
          "fr": "Le SBOM n'est pertinent pour l'article 14 que si le produit compte plus de 50 dépendances de premier niveau",
          "it": "L'SBOM è rilevante per l'articolo 14 solo se il prodotto ha più di 50 dipendenze di primo livello",
          "es": "El SBOM solo es relevante para el Artículo 14 si el producto tiene más de 50 dependencias de nivel superior",
          "pl": "SBOM ma znaczenie dla artykułu 14 tylko wtedy, gdy produkt zawiera więcej niż 50 zależności najwyższego poziomu",
          "cs": "SBOM je relevantní pro článek 14 pouze tehdy, má-li produkt více než 50 závislostí nejvyšší úrovně",
          "pt": "O SBOM só é relevante para o Artigo 14 se o produto tiver mais de 50 dependências de nível superior",
          "ro": "SBOM este relevant pentru Articolul 14 doar dacă produsul are mai mult de 50 de dependențe de nivel superior"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "The Article 14 24-hour reporting obligation applies to actively exploited vulnerabilities in your product. To monitor for these, you need to know what components your product contains, which is exactly what the SBOM provides. No SBOM means no automated monitoring and no ability to meet the reporting obligation.",
        "de": "Die 24-Stunden-Meldepflicht nach Artikel 14 gilt für aktiv ausgenutzte Schwachstellen in Ihrem Produkt. Um diese zu überwachen, müssen Sie wissen, welche Komponenten Ihr Produkt enthält, genau das liefert die SBOM. Keine SBOM bedeutet kein automatisiertes Monitoring und keine Möglichkeit, die Meldepflicht zu erfüllen.",
        "nl": "De meldingsverplichting van 24 uur op grond van Artikel 14 geldt voor actief misbruikte kwetsbaarheden in uw product. Om deze te kunnen monitoren, moet u weten welke componenten uw product bevat; dat is precies wat de SBOM biedt. Zonder SBOM is geautomatiseerde monitoring onmogelijk en kunt u de meldingsverplichting niet nakomen.",
        "fr": "L'obligation de notification dans les 24 heures prévue à l'article 14 s'applique aux vulnérabilités activement exploitées dans le produit. Pour les détecter, il faut savoir quels composants contient le produit, ce que fournit précisément le SBOM. L'absence de SBOM empêche toute surveillance automatisée et toute capacité à respecter l'obligation de notification.",
        "it": "L'obbligo di segnalazione entro 24 ore previsto dall'articolo 14 si applica alle vulnerabilità attivamente sfruttate nel prodotto. Per monitorarle è necessario sapere quali componenti contiene il prodotto, ed è proprio questo che fornisce l'SBOM. Senza SBOM non c'è monitoraggio automatizzato e non si può adempiere all'obbligo di segnalazione.",
        "es": "La obligación de notificación en 24 horas del Artículo 14 se aplica a las vulnerabilidades explotadas activamente en su producto. Para supervisarlas, debe saber qué componentes contiene su producto, que es exactamente lo que proporciona el SBOM. Sin SBOM no hay supervisión automatizada ni capacidad para cumplir la obligación de notificación.",
        "pl": "Obowiązek zgłaszania w ciągu 24 godzin na podstawie artykułu 14 dotyczy aktywnie wykorzystywanych podatności w produkcie. Aby je monitorować, trzeba wiedzieć, jakie komponenty zawiera produkt, a właśnie to zapewnia SBOM. Brak SBOM oznacza brak automatycznego monitorowania i brak możliwości spełnienia obowiązku zgłaszania.",
        "cs": "Povinnost hlášení do 24 hodin podle článku 14 se vztahuje na aktivně zneužívané zranitelnosti ve vašem produktu. K jejich monitorování potřebujete vědět, jaké komponenty váš produkt obsahuje, což přesně poskytuje SBOM. Bez SBOM není možné automatické monitorování ani splnění povinnosti hlášení.",
        "pt": "A obrigação de comunicação no prazo de 24 horas do Artigo 14 aplica-se a vulnerabilidades exploradas ativamente no produto. Para monitorizar essas vulnerabilidades, é necessário saber que componentes o produto contém, o que é exatamente o que o SBOM fornece. Sem SBOM não há monitorização automatizada nem capacidade de cumprir a obrigação de comunicação.",
        "ro": "Obligația de raportare în 24 de ore din Articolul 14 se aplică vulnerabilităților exploatate activ în produsul dumneavoastră. Pentru a le monitoriza, trebuie să știți ce componente conține produsul, ceea ce oferă exact SBOM. Fără SBOM nu există monitorizare automată și nicio posibilitate de a îndeplini obligația de raportare."
      }
    },
    {
      "id": "4.1.3",
      "question": {
        "en": "CycloneDX's VEX feature allows you to attach a 'not_affected' statement to a CVE. What justification would you use if the vulnerable code path exists but is never reached in your product's execution context?",
        "de": "Die VEX-Funktion von CycloneDX ermöglicht es, eine 'not_affected'-Erklärung an eine CVE anzuhängen. Welche Begründung würden Sie verwenden, wenn der verwundbare Codepfad existiert, aber im Ausführungskontext Ihres Produkts nie erreicht wird?",
        "nl": "De VEX-functionaliteit van CycloneDX maakt het mogelijk een 'not_affected'-verklaring aan een CVE te koppelen. Welke rechtvaardiging gebruikt u wanneer het kwetsbare codepad bestaat maar in de uitvoeringscontext van uw product nooit wordt bereikt?",
        "fr": "La fonctionnalité VEX de CycloneDX permet d'associer une mention « not_affected » à une CVE. Quelle justification utiliser si le chemin de code vulnérable existe mais n'est jamais atteint dans le contexte d'exécution du produit ?",
        "it": "La funzionalità VEX di CycloneDX consente di allegare un'affermazione 'not_affected' a una CVE. Quale giustificazione usereste se il percorso di codice vulnerabile esiste ma non viene mai raggiunto nel contesto di esecuzione del prodotto?",
        "es": "La función VEX de CycloneDX permite adjuntar una declaración 'not_affected' a un CVE. ¿Qué justificación utilizaría si la ruta de código vulnerable existe pero nunca se alcanza en el contexto de ejecución de su producto?",
        "pl": "Funkcja VEX w CycloneDX pozwala dołączyć do CVE oświadczenie 'not_affected'. Jakiego uzasadnienia użyjesz, jeśli podatliwa ścieżka kodu istnieje, ale nigdy nie jest osiągana w kontekście wykonywania produktu?",
        "cs": "Funkce VEX v CycloneDX umožňuje připojit k CVE prohlášení 'not_affected'. Jaké odůvodnění použijete, pokud zranitelná cesta kódu existuje, ale v kontextu provádění vašeho produktu není nikdy dosažena?",
        "pt": "A funcionalidade VEX do CycloneDX permite anexar uma declaração 'not_affected' a um CVE. Que justificação usaria se o caminho de código vulnerável existir mas nunca for alcançado no contexto de execução do produto?",
        "ro": "Funcția VEX din CycloneDX permite atașarea unei declarații 'not_affected' la un CVE. Ce justificare ați utiliza dacă calea de cod vulnerabilă există, dar nu este atinsă niciodată în contextul de execuție al produsului dumneavoastră?"
      },
      "options": [
        {
          "en": "code_not_present",
          "de": "code_not_present",
          "nl": "code_not_present",
          "fr": "code_not_present",
          "it": "code_not_present",
          "es": "code_not_present",
          "pl": "code_not_present",
          "cs": "code_not_present",
          "pt": "code_not_present",
          "ro": "code_not_present"
        },
        {
          "en": "requires_configuration",
          "de": "requires_configuration",
          "nl": "requires_configuration",
          "fr": "requires_configuration",
          "it": "requires_configuration",
          "es": "requires_configuration",
          "pl": "requires_configuration",
          "cs": "requires_configuration",
          "pt": "requires_configuration",
          "ro": "requires_configuration"
        },
        {
          "en": "code_not_reachable",
          "de": "code_not_reachable",
          "nl": "code_not_reachable",
          "fr": "code_not_reachable",
          "it": "code_not_reachable",
          "es": "code_not_reachable",
          "pl": "code_not_reachable",
          "cs": "code_not_reachable",
          "pt": "code_not_reachable",
          "ro": "code_not_reachable"
        },
        {
          "en": "protected_at_perimeter",
          "de": "protected_at_perimeter",
          "nl": "protected_at_perimeter",
          "fr": "protected_at_perimeter",
          "it": "protected_at_perimeter",
          "es": "protected_at_perimeter",
          "pl": "protected_at_perimeter",
          "cs": "protected_at_perimeter",
          "pt": "protected_at_perimeter",
          "ro": "protected_at_perimeter"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "'code_not_reachable' is the correct VEX justification when the vulnerable code path exists in the component version you are using, but your product's architecture or configuration means that code path is never executed. 'code_not_present' would mean the vulnerable code does not exist in your version at all.",
        "de": "'code_not_reachable' ist die korrekte VEX-Begründung, wenn der verwundbare Codepfad in der verwendeten Komponentenversion existiert, aber die Architektur oder Konfiguration Ihres Produkts bedeutet, dass dieser Codepfad nie ausgeführt wird. 'code_not_present' würde bedeuten, dass der verwundbare Code in Ihrer Version überhaupt nicht existiert.",
        "nl": "'code_not_reachable' is de juiste VEX-rechtvaardiging wanneer het kwetsbare codepad bestaat in de componentversie die u gebruikt, maar de architectuur of configuratie van uw product maakt dat dit codepad nooit wordt uitgevoerd. 'code_not_present' zou betekenen dat de kwetsbare code in uw versie helemaal niet aanwezig is.",
        "fr": "« code_not_reachable » est la justification VEX correcte lorsque le chemin de code vulnérable existe dans la version du composant utilisée, mais que l'architecture ou la configuration du produit fait que ce chemin n'est jamais exécuté. « code_not_present » signifierait que le code vulnérable n'existe pas du tout dans la version utilisée.",
        "it": "'code_not_reachable' è la giustificazione VEX corretta quando il percorso di codice vulnerabile esiste nella versione del componente utilizzata, ma l'architettura o la configurazione del prodotto fa sì che tale percorso non venga mai eseguito. 'code_not_present' significherebbe che il codice vulnerabile non esiste affatto nella versione in uso.",
        "es": "'code_not_reachable' es la justificación VEX correcta cuando la ruta de código vulnerable existe en la versión del componente que utiliza, pero la arquitectura o la configuración de su producto implica que esa ruta de código nunca se ejecuta. 'code_not_present' significaría que el código vulnerable no existe en absoluto en su versión.",
        "pl": "'code_not_reachable' to poprawne uzasadnienie VEX, gdy podatliwa ścieżka kodu istnieje w używanej wersji komponentu, ale architektura lub konfiguracja produktu sprawia, że ta ścieżka nigdy nie jest wykonywana. 'code_not_present' oznaczałoby, że podatliwy kod w ogóle nie występuje w danej wersji.",
        "cs": "'code_not_reachable' je správné odůvodnění VEX, když zranitelná cesta kódu existuje ve verzi komponenty, kterou používáte, ale architektura nebo konfigurace vašeho produktu znamená, že tato cesta kódu není nikdy spuštěna. 'code_not_present' by znamenalo, že zranitelný kód ve vaší verzi vůbec neexistuje.",
        "pt": "'code_not_reachable' é a justificação VEX correta quando o caminho de código vulnerável existe na versão do componente que está a usar, mas a arquitetura ou configuração do produto faz com que esse caminho de código nunca seja executado. 'code_not_present' significaria que o código vulnerável não existe de todo na versão.",
        "ro": "'code_not_reachable' este justificarea VEX corectă atunci când calea de cod vulnerabilă există în versiunea componentei pe care o utilizați, dar arhitectura sau configurația produsului dumneavoastră înseamnă că acea cale de cod nu este executată niciodată. 'code_not_present' ar însemna că codul vulnerabil nu există deloc în versiunea dumneavoastră."
      }
    },
    {
      "id": "4.1.4",
      "question": {
        "en": "A manufacturer places a product on the EU market in January 2027. The product's declared support period is 8 years. Until when must the SBOM be retained?",
        "de": "Ein Hersteller bringt ein Produkt im Januar 2027 auf den EU-Markt. Die erklärte Supportdauer des Produkts beträgt 8 Jahre. Bis wann muss die SBOM aufbewahrt werden?",
        "nl": "Een fabrikant brengt een product in januari 2027 op de EU-markt. De aangegeven ondersteuningsperiode bedraagt 8 jaar. Tot wanneer moet de SBOM worden bewaard?",
        "fr": "Un fabricant met un produit sur le marché de l'Union en janvier 2027. La période de soutien déclarée du produit est de 8 ans. Jusqu'à quand le SBOM doit-il être conservé ?",
        "it": "Un fabbricante immette un prodotto sul mercato UE nel gennaio 2027. Il periodo di supporto dichiarato per il prodotto è di 8 anni. Fino a quando deve essere conservato l'SBOM?",
        "es": "Un fabricante comercializa un producto en el mercado de la UE en enero de 2027. El período de soporte declarado del producto es de 8 años. ¿Hasta cuándo debe conservarse el SBOM?",
        "pl": "Producent wprowadza produkt na rynek UE w styczniu 2027 r. Deklarowany okres wsparcia produktu wynosi 8 lat. Do kiedy należy przechowywać SBOM?",
        "cs": "Výrobce uvádí produkt na trh EU v lednu 2027. Deklarovaná doba podpory produktu je 8 let. Do kdy musí být SBOM uchováván?",
        "pt": "Um fabricante coloca um produto no mercado da UE em janeiro de 2027. O período de suporte declarado do produto é de 8 anos. Até quando deve o SBOM ser retido?",
        "ro": "Un producător introduce un produs pe piața UE în ianuarie 2027. Perioada de suport declarată a produsului este de 8 ani. Până când trebuie păstrat SBOM?"
      },
      "options": [
        {
          "en": "Until January 2037 (10 years from first placement)",
          "de": "Bis Januar 2037 (10 Jahre ab erstmaligem Inverkehrbringen)",
          "nl": "Tot januari 2037 (10 jaar vanaf eerste plaatsing)",
          "fr": "Jusqu'en janvier 2037 (10 ans à compter de la première mise sur le marché)",
          "it": "Fino al gennaio 2037 (10 anni dalla prima immissione)",
          "es": "Hasta enero de 2037 (10 años desde la primera comercialización)",
          "pl": "Do stycznia 2037 r. (10 lat od pierwszego wprowadzenia)",
          "cs": "Do ledna 2037 (10 let od prvního uvedení na trh)",
          "pt": "Até janeiro de 2037 (10 anos a contar da primeira colocação)",
          "ro": "Până în ianuarie 2037 (10 ani de la prima introducere pe piață)"
        },
        {
          "en": "Until January 2032 (support period: 8 years minus 2 years already elapsed)",
          "de": "Bis Januar 2032 (Supportdauer: 8 Jahre minus 2 Jahre bereits verstrichen)",
          "nl": "Tot januari 2032 (ondersteuningsperiode: 8 jaar minus 2 jaar die al zijn verstreken)",
          "fr": "Jusqu'en janvier 2032 (période de soutien de 8 ans moins 2 ans déjà écoulés)",
          "it": "Fino al gennaio 2032 (periodo di supporto: 8 anni meno 2 anni già trascorsi)",
          "es": "Hasta enero de 2032 (período de soporte: 8 años menos 2 años ya transcurridos)",
          "pl": "Do stycznia 2032 r. (okres wsparcia: 8 lat minus 2 lata, które już upłynęły)",
          "cs": "Do ledna 2032 (doba podpory: 8 let minus 2 roky již uplynulé)",
          "pt": "Até janeiro de 2032 (período de suporte: 8 anos menos 2 anos já decorridos)",
          "ro": "Până în ianuarie 2032 (perioada de suport: 8 ani minus 2 ani deja scursi)"
        },
        {
          "en": "Until January 2035 (support period: 8 years from placement)",
          "de": "Bis Januar 2035 (Supportdauer: 8 Jahre ab Inverkehrbringen)",
          "nl": "Tot januari 2035 (ondersteuningsperiode: 8 jaar vanaf plaatsing)",
          "fr": "Jusqu'en janvier 2035 (période de soutien de 8 ans à compter de la mise sur le marché)",
          "it": "Fino al gennaio 2035 (periodo di supporto: 8 anni dall'immissione)",
          "es": "Hasta enero de 2035 (período de soporte: 8 años desde la comercialización)",
          "pl": "Do stycznia 2035 r. (okres wsparcia: 8 lat od wprowadzenia)",
          "cs": "Do ledna 2035 (doba podpory: 8 let od uvedení na trh)",
          "pt": "Até janeiro de 2035 (período de suporte: 8 anos a contar da colocação)",
          "ro": "Până în ianuarie 2035 (perioada de suport: 8 ani de la introducere)"
        },
        {
          "en": "Until January 2037 because 10 years is always longer than the support period",
          "de": "Bis Januar 2037, weil 10 Jahre immer länger als die Supportdauer sind",
          "nl": "Tot januari 2037 omdat 10 jaar altijd langer is dan de ondersteuningsperiode",
          "fr": "Jusqu'en janvier 2037 car 10 ans sont toujours supérieurs à la période de soutien",
          "it": "Fino al gennaio 2037 perché 10 anni è sempre più lungo del periodo di supporto",
          "es": "Hasta enero de 2037 porque 10 años siempre es más largo que el período de soporte",
          "pl": "Do stycznia 2037 r., ponieważ 10 lat jest zawsze dłuższe niż okres wsparcia",
          "cs": "Do ledna 2037, protože 10 let je vždy delší než doba podpory",
          "pt": "Até janeiro de 2037 porque 10 anos é sempre mais longo que o período de suporte",
          "ro": "Până în ianuarie 2037 deoarece 10 ani este întotdeauna mai mult decât perioada de suport"
        }
      ],
      "correctIndex": 0,
      "explanation": {
        "en": "The retention period is 10 years from first placement on the market, or for the support period, whichever is longer. 10 years from January 2027 = January 2037. The support period is 8 years = January 2035. 10 years (January 2037) is longer, so that is the retention deadline. Note: if the support period were 12 years instead, the deadline would be January 2039.",
        "de": "Die Aufbewahrungsfrist beträgt 10 Jahre ab erstmaligem Inverkehrbringen oder für die Supportdauer, je nachdem, welcher Zeitraum länger ist. 10 Jahre ab Januar 2027 ergeben Januar 2037. Die Supportdauer beträgt 8 Jahre und endet im Januar 2035. 10 Jahre (Januar 2037) sind länger, daher ist dies die Aufbewahrungsfrist. Hinweis: Betrüge die Supportdauer stattdessen 12 Jahre, läge die Frist im Januar 2039.",
        "nl": "De bewaartermijn bedraagt 10 jaar vanaf de eerste plaatsing op de markt, of de ondersteuningsperiode, afhankelijk van welke termijn langer is. 10 jaar vanaf januari 2027 = januari 2037. De ondersteuningsperiode is 8 jaar = januari 2035. 10 jaar (januari 2037) is langer, dus dat is de bewaartermijn. Opmerking: als de ondersteuningsperiode 12 jaar zou bedragen, zou de termijn januari 2039 zijn.",
        "fr": "La période de conservation est de 10 ans à compter de la première mise sur le marché ou de la période de soutien, la durée la plus longue étant retenue. Dix ans à compter de janvier 2027 correspondent à janvier 2037. La période de soutien est de 8 ans, soit janvier 2035. Dix ans (janvier 2037) étant plus longs, cette date constitue l'échéance de conservation. Note : si la période de soutien était de 12 ans, l'échéance serait janvier 2039.",
        "it": "Il periodo di conservazione è di 10 anni dalla prima immissione sul mercato oppure per il periodo di supporto, a seconda di quale sia più lungo. 10 anni dal gennaio 2027 equivalgono al gennaio 2037. Il periodo di supporto è di 8 anni, quindi gennaio 2035. Essendo 10 anni (gennaio 2037) il termine più lungo, quello è la scadenza di conservazione. Nota: se il periodo di supporto fosse di 12 anni, la scadenza sarebbe gennaio 2039.",
        "es": "El período de conservación es de 10 años desde la primera comercialización en el mercado, o durante el período de soporte, el que sea más largo. 10 años desde enero de 2027 equivalen a enero de 2037. El período de soporte es de 8 años, es decir, hasta enero de 2035. 10 años (enero de 2037) es más largo, por lo que esa es la fecha límite de conservación. Nota: si el período de soporte fuera de 12 años, la fecha límite sería enero de 2039.",
        "pl": "Okres przechowywania wynosi 10 lat od pierwszego wprowadzenia na rynek lub okres wsparcia, w zależności od tego, który jest dłuższy. 10 lat od stycznia 2027 r. = styczeń 2037 r. Okres wsparcia wynosi 8 lat = styczeń 2035 r. 10 lat (styczeń 2037 r.) jest dłuższe, więc jest to termin przechowywania. Uwaga: gdyby okres wsparcia wynosił 12 lat, termin upływałby w styczniu 2039 r.",
        "cs": "Doba uchovávání je 10 let od prvního uvedení na trh nebo doba podpory, podle toho, která je delší. 10 let od ledna 2027 = leden 2037. Doba podpory je 8 let = leden 2035. 10 let (leden 2037) je delší, takže to je lhůta uchovávání. Poznámka: pokud by doba podpory byla místo toho 12 let, lhůta by byla leden 2039.",
        "pt": "O período de retenção é de 10 anos a contar da primeira colocação no mercado, ou o período de suporte, consoante o que for mais longo. 10 anos a contar de janeiro de 2027 = janeiro de 2037. O período de suporte é de 8 anos = janeiro de 2035. 10 anos (janeiro de 2037) é mais longo, pelo que essa é a data-limite de retenção. Nota: se o período de suporte fosse de 12 anos, a data-limite seria janeiro de 2039.",
        "ro": "Perioada de păstrare este de 10 ani de la prima introducere pe piață sau pe durata perioadei de suport, oricare este mai lungă. 10 ani de la ianuarie 2027 = ianuarie 2037. Perioada de suport este de 8 ani = ianuarie 2035. 10 ani (ianuarie 2037) este mai lung, deci acesta este termenul de păstrare. Notă: dacă perioada de suport ar fi de 12 ani în schimb, termenul ar fi ianuarie 2039."
      }
    },
    {
      "id": "4.1.5",
      "question": {
        "en": "Which combination of tools represents best practice for generating a complete SBOM for a containerised application?",
        "de": "Welche Kombination von Tools stellt die Best Practice für die Erstellung einer vollständigen SBOM für eine containerisierte Anwendung dar?",
        "nl": "Welke combinatie van tools vormt de beste praktijk voor het genereren van een volledige SBOM voor een gecontaineriseerde toepassing?",
        "fr": "Quelle combinaison d'outils représente la bonne pratique pour générer un SBOM complet d'une application conteneurisée ?",
        "it": "Quale combinazione di strumenti rappresenta la best practice per generare un SBOM completo per un'applicazione containerizzata?",
        "es": "¿Qué combinación de herramientas representa la mejor práctica para generar un SBOM completo para una aplicación en contenedores?",
        "pl": "Które połączenie narzędzi stanowi najlepszą praktykę generowania kompletnego SBOM dla aplikacji konteneryzowanej?",
        "cs": "Která kombinace nástrojů představuje osvědčený postup pro vytvoření úplného SBOM pro kontejnerizovanou aplikaci?",
        "pt": "Que combinação de ferramentas representa a melhor prática para gerar um SBOM completo para uma aplicação contentorizada?",
        "ro": "Ce combinație de instrumente reprezintă cea mai bună practică pentru generarea unui SBOM complet pentru o aplicație containerizată?"
      },
      "options": [
        {
          "en": "Only Syft against the container image",
          "de": "Nur Syft gegen das Container-Image",
          "nl": "Alleen Syft tegen de container image",
          "fr": "Uniquement Syft sur l'image du conteneur",
          "it": "Solo Syft sull'immagine del container",
          "es": "Solo Syft contra la imagen del contenedor",
          "pl": "Tylko Syft wobec obrazu kontenera",
          "cs": "Pouze Syft proti obrazu kontejneru",
          "pt": "Apenas Syft contra a imagem do contentor",
          "ro": "Doar Syft pe imaginea container"
        },
        {
          "en": "Only cdxgen against the source code",
          "de": "Nur cdxgen gegen den Quellcode",
          "nl": "Alleen cdxgen tegen de broncode",
          "fr": "Uniquement cdxgen sur le code source",
          "it": "Solo cdxgen sul codice sorgente",
          "es": "Solo cdxgen contra el código fuente",
          "pl": "Tylko cdxgen wobec kodu źródłowego",
          "cs": "Pouze cdxgen proti zdrojovému kódu",
          "pt": "Apenas cdxgen contra o código-fonte",
          "ro": "Doar cdxgen pe codul sursă"
        },
        {
          "en": "cdxgen against source code (for full transitive application dependencies) combined with Syft against the container image (for OS and runtime packages), merged into one SBOM",
          "de": "cdxgen gegen den Quellcode (für vollständige transitive Anwendungsabhängigkeiten) kombiniert mit Syft gegen das Container-Image (für OS- und Laufzeitpakete), zusammengeführt in einer SBOM",
          "nl": "cdxgen tegen de broncode (voor volledige transitieve applicatieafhankelijkheden) gecombineerd met Syft tegen de container image (voor OS- en runtime-pakketten), samengevoegd tot één SBOM",
          "fr": "cdxgen sur le code source (pour l'intégralité des dépendances transitives de l'application) combiné à Syft sur l'image du conteneur (pour les paquets du système d'exploitation et de l'environnement d'exécution), fusionnés dans un seul SBOM",
          "it": "cdxgen sul codice sorgente (per le dipendenze applicative transitive complete) combinato con Syft sull'immagine del container (per i pacchetti del sistema operativo e del runtime), fuso in un unico SBOM",
          "es": "cdxgen contra el código fuente (para todas las dependencias transitivas de la aplicación) combinado con Syft contra la imagen del contenedor (para paquetes de sistema operativo y tiempo de ejecución), fusionados en un solo SBOM",
          "pl": "cdxgen wobec kodu źródłowego (w celu uzyskania pełnego grafu zależności aplikacji) w połączeniu z Syft wobec obrazu kontenera (w celu uzyskania pakietów systemu operacyjnego i środowiska uruchomieniowego), scalone w jeden SBOM",
          "cs": "cdxgen proti zdrojovému kódu (pro úplný tranzitivní graf závislostí aplikace) v kombinaci se Syft proti obrazu kontejneru (pro balíčky OS a runtime), sloučené do jednoho SBOM",
          "pt": "cdxgen contra o código-fonte (para todas as dependências transitivas da aplicação) combinado com Syft contra a imagem do contentor (para pacotes do SO e runtime), fundidos num único SBOM",
          "ro": "cdxgen pe codul sursă (pentru dependențele complete transitive ale aplicației) combinat cu Syft pe imaginea container (pentru pachetele OS și runtime), fuzionat într-un singur SBOM"
        },
        {
          "en": "GitHub dependency graph export combined with a manual review of package manifests",
          "de": "GitHub-Abhängigkeitsgraph-Export kombiniert mit einer manuellen Prüfung von Paketmanifesten",
          "nl": "Export van de GitHub dependency graph gecombineerd met een handmatige controle van package manifests",
          "fr": "Export du graphe de dépendances de GitHub combiné à un examen manuel des manifestes de paquets",
          "it": "Esportazione del grafico delle dipendenze di GitHub combinata con una revisione manuale dei manifest dei pacchetti",
          "es": "Exportación del gráfico de dependencias de GitHub combinada con una revisión manual de los manifiestos de paquetes",
          "pl": "Eksport grafu zależności GitHub w połączeniu z ręcznym przeglądem manifestów pakietów",
          "cs": "Export grafu závislostí GitHub v kombinaci s ručním přezkumem manifestů balíčků",
          "pt": "Exportação do gráfico de dependências do GitHub combinada com uma revisão manual dos manifestos de pacotes",
          "ro": "Exportul graficului de dependențe GitHub combinat cu o revizuire manuală a manifestelor pachetelor"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "Syft excels at OS and runtime package detection from the built artifact. cdxgen excels at producing the full transitive application dependency graph from lock files. Neither is complete alone. Combining both and merging the output gives you OS packages, runtime, and full application dependencies, the complete picture for Article 14 monitoring.",
        "de": "Syft eignet sich hervorragend zur Erkennung von OS- und Laufzeitpaketen aus dem gebauten Artefakt. cdxgen eignet sich hervorragend zur Erzeugung des vollständigen transitiven Anwendungsabhängigkeitsgraphen aus Lock-Dateien. Keines der beiden Tools ist allein vollständig. Die Kombination beider und das Zusammenführen der Ausgabe liefert OS-Pakete, Laufzeit und vollständige Anwendungsabhängigkeiten, das vollständige Bild für das Monitoring nach Artikel 14.",
        "nl": "Syft excelleert in detectie van OS- en runtime-pakketten uit het gebouwde artefact. cdxgen excelleert in het produceren van de volledige transitieve afhankelijkheidsgrafiek van lock files. Geen van beide is alleen volledig. Door beide te combineren en de uitvoer samen te voegen, verkrijgt u OS-pakketten, runtime en volledige applicatieafhankelijkheden: het volledige beeld voor monitoring op grond van Artikel 14.",
        "fr": "Syft excelle dans la détection des paquets du système d'exploitation et de l'environnement d'exécution à partir de l'artefact construit. cdxgen excelle dans la production du graphe complet des dépendances transitives de l'application à partir des fichiers de verrouillage. Aucun des deux n'est complet à lui seul. La combinaison des deux et la fusion des résultats fournissent les paquets du système d'exploitation, de l'environnement d'exécution et l'intégralité des dépendances de l'application, soit l'image complète requise pour la surveillance au titre de l'article 14.",
        "it": "Syft eccelle nel rilevamento dei pacchetti del sistema operativo e del runtime dall'artefatto compilato. cdxgen eccelle nella produzione del grafo completo delle dipendenze applicative transitive dai file di lock. Nessuno dei due è completo da solo. Combinando entrambi e fondendo l'output si ottengono i pacchetti del sistema operativo, del runtime e le dipendenze applicative complete, il quadro completo per il monitoraggio ai sensi dell'articolo 14.",
        "es": "Syft destaca en la detección de paquetes de sistema operativo y tiempo de ejecución a partir del artefacto compilado. cdxgen destaca en la producción del gráfico completo de dependencias transitivas de la aplicación a partir de archivos de bloqueo. Ninguno es completo por sí solo. Combinar ambos y fusionar la salida proporciona paquetes de sistema operativo, tiempo de ejecución y todas las dependencias de la aplicación, la imagen completa para la supervisión del Artículo 14.",
        "pl": "Syft doskonale sprawdza się w wykrywaniu pakietów systemu operacyjnego i środowiska uruchomieniowego z artefaktu zbudowanego. cdxgen doskonale sprawdza się w tworzeniu pełnego, przechodniego grafu zależności aplikacji z plików blokad. Żadne z nich nie jest kompletne samodzielnie. Połączenie obu i scalenie wyników daje pakiety systemu operacyjnego, środowisko uruchomieniowe oraz pełne zależności aplikacji, czyli pełny obraz potrzebny do monitorowania na podstawie artykułu 14.",
        "cs": "Syft vyniká detekcí balíčků OS a runtime z postaveného artefaktu. cdxgen vyniká vytvářením úplného tranzitivního grafu závislostí aplikace ze souborů zámků. Žádný z nich sám o sobě není úplný. Kombinace obou a sloučení výstupu poskytuje balíčky OS, runtime a úplné závislosti aplikace, úplný přehled pro monitorování podle článku 14.",
        "pt": "O Syft destaca-se na deteção de pacotes do SO e runtime a partir do artefacto compilado. O cdxgen destaca-se na produção do gráfico completo de dependências transitivas da aplicação a partir de ficheiros de bloqueio. Nenhum é completo sozinho. Combinar ambos e fundir a saída dá pacotes do SO, runtime e todas as dependências da aplicação, a imagem completa para a monitorização do Artigo 14.",
        "ro": "Syft excelează la detectarea pachetelor OS și runtime din artifactul construit. cdxgen excelează la producerea graficului complet al dependențelor transitive ale aplicației din fișierele de blocare. Niciunul nu este complet singur. Combinarea ambelor și fuzionarea rezultatului oferă pachete OS, runtime și dependențe complete ale aplicației, imaginea completă pentru monitorizarea conform Articolului 14."
      }
    },
    {
      "id": "4.1.6",
      "question": {
        "en": "Where does a PURL for an npm package appear in an SPDX 2.3 document?",
        "de": "Wo erscheint eine PURL für ein npm-Paket in einem SPDX-2.3-Dokument?",
        "nl": "Waar verschijnt een PURL voor een npm-pakket in een SPDX 2.3-document?",
        "fr": "Où apparaît un PURL pour un paquet npm dans un document SPDX 2.3 ?",
        "it": "Dove compare un PURL per un pacchetto npm in un documento SPDX 2.3?",
        "es": "¿Dónde aparece un PURL para un paquete npm en un documento SPDX 2.3?",
        "pl": "Gdzie w dokumencie SPDX 2.3 pojawia się PURL pakietu npm?",
        "cs": "Kde se PURL pro balíček npm objevuje v dokumentu SPDX 2.3?",
        "pt": "Onde aparece um PURL para um pacote npm num documento SPDX 2.3?",
        "ro": "Unde apare un PURL pentru un pachet npm într-un document SPDX 2.3?"
      },
      "options": [
        {
          "en": "As a first-class 'purl' field directly on the package object",
          "de": "Als erstklassiges 'purl'-Feld direkt auf dem Paketobjekt",
          "nl": "Als een eersteklas 'purl'-veld rechtstreeks op het package-object",
          "fr": "Comme champ « purl » de premier niveau directement sur l'objet paquet",
          "it": "Come campo 'purl' di prima classe direttamente sull'oggetto package",
          "es": "Como campo 'purl' de primera clase directamente en el objeto del paquete",
          "pl": "Jako pierwszorzędne pole 'purl' bezpośrednio na obiekcie pakietu",
          "cs": "Jako prvotřídní pole 'purl' přímo na objektu balíčku",
          "pt": "Como campo 'purl' de primeira classe diretamente no objeto do pacote",
          "ro": "Ca un câmp 'purl' de primă clasă direct pe obiectul pachet"
        },
        {
          "en": "Inside the externalRefs array with referenceType 'purl' and referenceCategory 'PACKAGE-MANAGER'",
          "de": "Innerhalb des externalRefs-Arrays mit referenceType 'purl' und referenceCategory 'PACKAGE-MANAGER'",
          "nl": "Binnen de externalRefs-array met referenceType 'purl' en referenceCategory 'PACKAGE-MANAGER'",
          "fr": "Dans le tableau externalRefs avec referenceType « purl » et referenceCategory « PACKAGE-MANAGER »",
          "it": "All'interno dell'array externalRefs con referenceType 'purl' e referenceCategory 'PACKAGE-MANAGER'",
          "es": "Dentro de la matriz externalRefs con referenceType 'purl' y referenceCategory 'PACKAGE-MANAGER'",
          "pl": "Wewnątrz tablicy externalRefs z wartością referenceType 'purl' i referenceCategory 'PACKAGE-MANAGER'",
          "cs": "Uvnitř pole externalRefs s referenceType 'purl' a referenceCategory 'PACKAGE-MANAGER'",
          "pt": "Dentro do array externalRefs com referenceType 'purl' e referenceCategory 'PACKAGE-MANAGER'",
          "ro": "În interiorul matricei externalRefs cu referenceType 'purl' și referenceCategory 'PACKAGE-MANAGER'"
        },
        {
          "en": "In the SPDXID field as a purl: URI",
          "de": "Im SPDXID-Feld als purl:-URI",
          "nl": "In het SPDXID-veld als een purl: URI",
          "fr": "Dans le champ SPDXID sous la forme d'une URI purl:",
          "it": "Nel campo SPDXID come URI purl:",
          "es": "En el campo SPDXID como un URI purl:",
          "pl": "W polu SPDXID jako identyfikator URI purl:",
          "cs": "V poli SPDXID jako purl: URI",
          "pt": "No campo SPDXID como um URI purl:",
          "ro": "În câmpul SPDXID ca un URI purl:"
        },
        {
          "en": "SPDX 2.3 does not support PURLs: they are a CycloneDX-only feature",
          "de": "SPDX 2.3 unterstützt PURLs nicht: Sie sind ein CycloneDX-only-Feature",
          "nl": "SPDX 2.3 ondersteunt geen PURLs: dit is een exclusieve CycloneDX-functionaliteit",
          "fr": "SPDX 2.3 ne prend pas en charge les PURL : il s'agit d'une fonctionnalité exclusive à CycloneDX",
          "it": "SPDX 2.3 non supporta i PURL: sono una funzionalità esclusiva di CycloneDX",
          "es": "SPDX 2.3 no admite PURL: son una característica exclusiva de CycloneDX",
          "pl": "SPDX 2.3 nie obsługuje PURL: są one funkcją wyłącznie CycloneDX",
          "cs": "SPDX 2.3 nepodporuje PURL: jsou to funkce pouze pro CycloneDX",
          "pt": "O SPDX 2.3 não suporta PURLs: são uma funcionalidade exclusiva do CycloneDX",
          "ro": "SPDX 2.3 nu acceptă PURL: acestea sunt o funcție exclusivă CycloneDX"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "In SPDX 2.3, the PURL lives inside the externalRefs array on the package object: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX has a first-class 'purl' field directly on the component. Both formats support PURLs.",
        "de": "In SPDX 2.3 befindet sich die PURL innerhalb des externalRefs-Arrays auf dem Paketobjekt: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX verfügt über ein erstklassiges 'purl'-Feld direkt auf der Komponente. Beide Formate unterstützen PURLs.",
        "nl": "In SPDX 2.3 bevindt de PURL zich binnen de externalRefs-array op het package-object: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX heeft een eersteklas 'purl'-veld rechtstreeks op het component. Beide formaten ondersteunen PURLs.",
        "fr": "Dans SPDX 2.3, le PURL figure dans le tableau externalRefs de l'objet paquet : { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX dispose d'un champ « purl » de premier niveau directement sur le composant. Les deux formats prennent en charge les PURL.",
        "it": "In SPDX 2.3 il PURL si trova all'interno dell'array externalRefs sull'oggetto package: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX ha un campo 'purl' di prima classe direttamente sul component. Entrambi i formati supportano i PURL.",
        "es": "En SPDX 2.3, el PURL reside dentro de la matriz externalRefs en el objeto del paquete: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX tiene un campo 'purl' de primera clase directamente en el componente. Ambos formatos admiten PURL.",
        "pl": "W SPDX 2.3 PURL znajduje się wewnątrz tablicy externalRefs na obiekcie pakietu: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX posiada pierwszorzędne pole 'purl' bezpośrednio na komponencie. Oba formaty obsługują PURL.",
        "cs": "Ve SPDX 2.3 žije PURL uvnitř pole externalRefs na objektu balíčku: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX má prvotřídní pole 'purl' přímo na komponentě. Oba formáty podporují PURL.",
        "pt": "No SPDX 2.3, o PURL reside dentro do array externalRefs no objeto do pacote: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. O CycloneDX tem um campo 'purl' de primeira classe diretamente no componente. Ambos os formatos suportam PURLs.",
        "ro": "În SPDX 2.3, PURL se află în interiorul matricei externalRefs pe obiectul pachet: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX are un câmp 'purl' de primă clasă direct pe componentă. Ambele formate acceptă PURL."
      }
    },
    {
      "id": "4.1.7",
      "question": {
        "en": "What is the minimum scope for SBOM coverage under CRA Annex I, Part II, point (1), and what does best practice add?",
        "de": "Was ist der Mindestumfang der SBOM-Abdeckung gemäß CRA Anhang I Teil II Nummer 1, und was fügt die Best Practice hinzu?",
        "nl": "Wat is de minimale reikwijdte voor SBOM-dekking onder CRA Bijlage I, Deel II, punt (1), en wat voegt beste praktijk toe?",
        "fr": "Quel est le périmètre minimal de couverture du SBOM au titre de l'annexe I, partie II, point (1) du CRA, et que prévoit la bonne pratique en complément ?",
        "it": "Qual è l'ambito minimo di copertura dell'SBOM ai sensi dell'allegato I, Parte II, punto (1) del CRA e cosa aggiunge la best practice?",
        "es": "¿Cuál es el alcance mínimo de cobertura del SBOM según Anexo I, Parte II, punto (1) del CRA, y qué añade la mejor práctica?",
        "pl": "Jaki jest minimalny zakres pokrycia SBOM na podstawie Załącznika I, Część II, punkt (1) CRA i co dodaje najlepsza praktyka?",
        "cs": "Jaký je minimální rozsah pokrytí SBOM podle přílohy I, část II, bod (1) CRA a co přidává osvědčený postup?",
        "pt": "Qual o âmbito mínimo de cobertura do SBOM segundo o Anexo I, Parte II, ponto (1) do CRA, e o que acrescenta a melhor prática?",
        "ro": "Care este domeniul minim de acoperire SBOM conform Anexei I, Partea II, punctul (1) din CRA și ce adaugă cea mai bună practică?"
      },
      "options": [
        {
          "en": "Minimum: all components including OS packages. Best practice: add file-level hashes for every file",
          "de": "Minimum: alle Komponenten einschließlich OS-Paketen. Best Practice: Hinzufügen von dateiebene Hashes für jede Datei",
          "nl": "Minimum: alle componenten inclusief OS-pakketten. Beste praktijk: voeg bestandsniveau-hashes toe voor elk bestand",
          "fr": "Minimal : tous les composants, y compris les paquets du système d'exploitation. Bonne pratique : ajout de hachages au niveau des fichiers pour chaque fichier",
          "it": "Minimo: tutti i componenti inclusi i pacchetti del sistema operativo. Best practice: aggiungere hash a livello di file per ogni file",
          "es": "Mínimo: todos los componentes, incluidos los paquetes de sistema operativo. Mejor práctica: añadir hashes a nivel de archivo para cada archivo",
          "pl": "Minimum: wszystkie komponenty, w tym pakiety systemu operacyjnego. Najlepsza praktyka: dodać skróty na poziomie plików dla każdego pliku",
          "cs": "Minimum: všechny komponenty včetně balíčků OS. Osvědčený postup: přidat hash úrovně souborů pro každý soubor",
          "pt": "Mínimo: todos os componentes incluindo pacotes do SO. Melhor prática: adicionar hashes ao nível do ficheiro para cada ficheiro",
          "ro": "Minim: toate componentele inclusiv pachetele OS. Cea mai bună practică: adăugați hash-uri la nivel de fișier pentru fiecare fișier"
        },
        {
          "en": "Minimum: top-level dependencies only. Best practice: full transitive dependency coverage, because transitive components are where vulnerabilities like Log4Shell hide",
          "de": "Minimum: nur oberste Abhängigkeiten. Best Practice: vollständige transitive Abhängigkeitsabdeckung, weil transitive Komponenten der Ort sind, an dem Schwachstellen wie Log4Shell verborgen sind",
          "nl": "Minimum: alleen top-level dependencies. Beste praktijk: volledige transitieve afhankelijkheidsdekking, omdat transitieve componenten de plek zijn waar kwetsbaarheden zoals Log4Shell zich verbergen",
          "fr": "Minimal : dépendances de premier niveau uniquement. Bonne pratique : couverture complète des dépendances transitives, car les composants transitifs sont ceux dans lesquels se cachent des vulnérabilités comme Log4Shell",
          "it": "Minimo: solo le dipendenze di primo livello. Best practice: copertura completa delle dipendenze transitive, perché i componenti transitivi sono dove si nascondono vulnerabilità come Log4Shell",
          "es": "Mínimo: solo dependencias de nivel superior. Mejor práctica: cobertura completa de dependencias transitivas, porque los componentes transitivos son donde se ocultan vulnerabilidades como Log4Shell",
          "pl": "Minimum: tylko zależności najwyższego poziomu. Najlepsza praktyka: pełne pokrycie zależności przechodnich, ponieważ w komponentach przechodnich kryją się podatności takie jak Log4Shell",
          "cs": "Minimum: pouze závislosti nejvyšší úrovně. Osvědčený postup: úplné pokrytí tranzitivních závislostí, protože právě v tranzitivních komponentách se skrývají zranitelnosti jako Log4Shell",
          "pt": "Mínimo: apenas dependências de nível superior. Melhor prática: cobertura completa de dependências transitivas, porque os componentes transitivos são onde se escondem vulnerabilidades como Log4Shell",
          "ro": "Minim: doar dependențele de nivel superior. Cea mai bună practică: acoperire completă a dependențelor transitive, deoarece componentele transitive sunt locul unde se ascund vulnerabilități precum Log4Shell"
        },
        {
          "en": "Minimum: components with CVEs only. Best practice: add all components regardless of known vulnerabilities",
          "de": "Minimum: nur Komponenten mit CVEs. Best Practice: Hinzufügen aller Komponenten unabhängig von bekannten Schwachstellen",
          "nl": "Minimum: alleen componenten met CVE's. Beste praktijk: voeg alle componenten toe ongeacht bekende kwetsbaarheden",
          "fr": "Minimal : composants présentant des CVE uniquement. Bonne pratique : ajout de tous les composants, indépendamment des vulnérabilités connues",
          "it": "Minimo: solo i componenti con CVE. Best practice: aggiungere tutti i componenti indipendentemente dalle vulnerabilità note",
          "es": "Mínimo: solo componentes con CVE. Mejor práctica: añadir todos los componentes independientemente de las vulnerabilidades conocidas",
          "pl": "Minimum: tylko komponenty z CVE. Najlepsza praktyka: dodać wszystkie komponenty niezależnie od znanych podatności",
          "cs": "Minimum: pouze komponenty s CVE. Osvědčený postup: přidat všechny komponenty bez ohledu na známé zranitelnosti",
          "pt": "Mínimo: apenas componentes com CVEs. Melhor prática: adicionar todos os componentes independentemente de vulnerabilidades conhecidas",
          "ro": "Minim: doar componentele cu CVE. Cea mai bună practică: adăugați toate componentele indiferent de vulnerabilitățile cunoscute"
        },
        {
          "en": "Minimum and best practice are identical: the CRA specifies full transitive coverage",
          "de": "Minimum und Best Practice sind identisch: die CRA schreibt vollständige transitive Abdeckung vor",
          "nl": "Minimum en beste praktijk zijn identiek: de CRA schrijft volledige transitieve dekking voor",
          "fr": "Le minimum et les bonnes pratiques sont identiques : le CRA spécifie une couverture transitive complète.",
          "it": "Il requisito minimo e la best practice sono identici: il CRA specifica la copertura transitiva completa",
          "es": "El mínimo y la mejor práctica son idénticos: el CRA especifica cobertura transitiva completa.",
          "pl": "Wymagania minimalne i najlepsze praktyki są identyczne: CRA określa pełne pokrycie transytywne.",
          "cs": "Minimum a nejlepší praxe jsou totožné: CRA specifikuje plné tranzitivní pokrytí",
          "pt": "O mínimo e a melhor prática são idênticos: o CRA especifica cobertura transitiva completa",
          "ro": "Practicile minime și cele mai bune sunt identice: CRA specifică o acoperire tranzitivă completă."
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Annex I, Part II, point (1) CRA sets the minimum at top-level dependencies. Best practice, per ENISA guidance and the NTIA minimum elements, is full transitive coverage. Log4Shell illustrated the risk of top-level-only SBOMs. Most SBOM tools produce full transitive output by default.",
        "de": "Anhang I Teil II Nummer 1 CRA legt das Minimum bei Abhängigkeiten der obersten Ebene fest. Best Practice gemäß ENISA-Leitlinien und den NTIA-Mindestanforderungen ist vollständige transitive Abdeckung. Log4Shell verdeutlichte das Risiko von SBOMs nur auf oberster Ebene. Die meisten SBOM-Tools erzeugen standardmäßig vollständige transitive Ausgaben.",
        "nl": "Bijlage I, deel II, punt (1) CRA stelt het minimum vast op afhankelijkheden op topniveau. Beste praktijk, volgens ENISA-richtlijnen en de minimum elementen van de NTIA, is volledige transitieve dekking. Log4Shell illustreerde het risico van SBOMs die alleen op topniveau zijn. De meeste SBOM-tools produceren standaard volledige transitieve output.",
        "fr": "L'annexe I, partie II, point (1) du CRA fixe le minimum aux dépendances de premier niveau. Les bonnes pratiques, selon les orientations d'ENISA et les éléments minimaux du NTIA, consistent en une couverture transitive complète. Log4Shell a illustré le risque des SBOM limités au premier niveau. La plupart des outils SBOM produisent par défaut une sortie transitive complète.",
        "it": "L'Allegato I, Parte II, punto (1) del CRA stabilisce il minimo alle dipendenze di primo livello. La best practice, secondo le indicazioni ENISA e gli elementi minimi NTIA, è la copertura transitiva completa. Log4Shell ha illustrato il rischio degli SBOM limitati al primo livello. La maggior parte degli strumenti SBOM produce output transitivi completi per impostazione predefinita.",
        "es": "El Anexo I, Parte II, punto (1) del CRA establece el mínimo en las dependencias de nivel superior. La mejor práctica, según las orientaciones de ENISA y los elementos mínimos de la NTIA, es la cobertura transitiva completa. Log4Shell ilustró el riesgo de los SBOM solo de nivel superior. La mayoría de las herramientas de SBOM generan por defecto una salida transitiva completa.",
        "pl": "Załącznik I, Część II, punkt (1) CRA określa minimum na poziomie zależności najwyższego rzędu. Najlepsza praktyka, zgodnie z wytycznymi ENISA i minimalnymi elementami NTIA, to pełne pokrycie transytywne. Log4Shell pokazało ryzyko SBOM ograniczonych do najwyższego poziomu. Większość narzędzi SBOM domyślnie generuje pełne dane transytywne.",
        "cs": "Příloha I, část II, bod (1) CRA stanoví minimum na závislostech nejvyšší úrovně. Nejlepší praxe podle pokynů ENISA a minimálních prvků NTIA je plné tranzitivní pokrytí. Log4Shell ilustroval riziko SBOMů pouze nejvyšší úrovně. Většina nástrojů SBOM produkuje plný tranzitivní výstup ve výchozím nastavení.",
        "pt": "O Anexo I, Parte II, ponto (1) do CRA define o mínimo nas dependências de nível superior. A melhor prática, conforme as orientações da ENISA e os elementos mínimos da NTIA, é a cobertura transitiva completa. O Log4Shell ilustrou o risco de SBOMs apenas de nível superior. A maioria das ferramentas de SBOM produz saída transitiva completa por predefinição.",
        "ro": "Anexa I, Partea II, punctul (1) CRA stabilește minimul la dependențele de nivel superior. Cea mai bună practică, conform orientărilor ENISA și elementelor minime NTIA, este acoperirea tranzitivă completă. Log4Shell a ilustrat riscul SBOM-urilor limitate la nivel superior. Majoritatea instrumentelor SBOM produc ieșire tranzitivă completă în mod implicit."
      }
    },
    {
      "id": "4.1.8",
      "question": {
        "en": "What is the Single Reporting Platform (SRP) and when does it become operational?",
        "de": "Was ist die Single Reporting Platform (SRP) und wann wird sie betriebsbereit?",
        "nl": "Wat is het Single Reporting Platform (SRP) en wanneer wordt het operationeel?",
        "fr": "Qu'est-ce que la plateforme unique de signalement (SRP) et quand devient-elle opérationnelle ?",
        "it": "Che cos'è la Single Reporting Platform (SRP) e quando diventa operativa?",
        "es": "¿Qué es la Plataforma Única de Notificación (SRP) y cuándo entra en funcionamiento?",
        "pl": "Czym jest Single Reporting Platform (SRP) i kiedy staje się operacyjna?",
        "cs": "Co je Single Reporting Platform (SRP) a kdy se stane operační?",
        "pt": "O que é a Plataforma Única de Comunicação (SRP) e quando se torna operacional?",
        "ro": "Ce este Platforma Unică de Raportare (SRP) și când devine operațională?"
      },
      "options": [
        {
          "en": "An ENISA-operated platform for receiving CRA Article 14 vulnerability and incident reports, operational September 11, 2026",
          "de": "Eine von ENISA betriebene Plattform zum Empfang von CRA Artikel 14 Schwachstellen- und Vorfallmeldungen, betriebsbereit am 11. September 2026",
          "nl": "Een door ENISA beheerd platform voor het ontvangen van kwetsbaarheids- en incidentmeldingen op grond van artikel 14 CRA, operationeel vanaf 11 september 2026",
          "fr": "Une plateforme exploitée par ENISA pour recevoir les signalements de vulnérabilités et d'incidents au titre de l'article 14 du CRA, opérationnelle le 11 septembre 2026.",
          "it": "Una piattaforma gestita da ENISA per ricevere le segnalazioni di vulnerabilità e incidenti ai sensi dell'articolo 14 CRA, operativa l'11 settembre 2026",
          "es": "Una plataforma operada por ENISA para recibir notificaciones de vulnerabilidades e incidentes conforme al Artículo 14 del CRA, operativa el 11 de septiembre de 2026.",
          "pl": "Platforma obsługiwana przez ENISA do przyjmowania raportów o lukach i incydentach zgodnie z artykułem 14 CRA, operacyjna od 11 września 2026.",
          "cs": "ENISA provozovaná platforma pro příjem hlášení o zranitelnostech a incidente podle CRA článek 14, operační od 11. září 2026",
          "pt": "Uma plataforma operada pela ENISA para receber relatórios de vulnerabilidades e incidentes do Artigo 14 do CRA, operacional September 11, 2026",
          "ro": "O platformă operată de ENISA pentru primirea rapoartelor de vulnerabilități și incidente conform Articolului 14 CRA, operațională la 11 septembrie 2026."
        },
        {
          "en": "A BSI database for German manufacturers to register their SBOMs, operational December 2027",
          "de": "Eine BSI-Datenbank für deutsche Hersteller zur Registrierung ihrer SBOMs, betriebsbereit im Dezember 2027",
          "nl": "Een BSI-database waarmee Duitse fabrikanten hun SBOMs kunnen registreren, operationeel in december 2027",
          "fr": "Une base de données du BSI permettant aux fabricants allemands d'enregistrer leurs SBOM, opérationnelle en décembre 2027.",
          "it": "Un database del BSI per i produttori tedeschi per registrare i propri SBOM, operativo a dicembre 2027",
          "es": "Una base de datos del BSI para que los fabricantes alemanes registren sus SBOM, operativa en diciembre de 2027.",
          "pl": "Baza danych BSI dla producentów niemieckich do rejestrowania SBOM, operacyjna od grudnia 2027.",
          "cs": "Databáze BSI pro německé výrobce k registraci jejich SBOMů, operační od prosince 2027",
          "pt": "Uma base de dados do BSI para os fabricantes alemães registarem as suas SBOMs, operacional December 2027",
          "ro": "O bază de date BSI pentru producătorii germani de a-și înregistra SBOM-urile, operațională în decembrie 2027."
        },
        {
          "en": "A European Commission portal for filing conformity assessments, operational January 2026",
          "de": "Ein Portal der Europäischen Kommission zur Einreichung von Konformitätsbewertungen, betriebsbereit im Januar 2026",
          "nl": "Een portaal van de Europese Commissie voor het indienen van conformiteitsbeoordelingen, operationeel in januari 2026",
          "fr": "Un portail de la Commission européenne pour le dépôt des évaluations de conformité, opérationnel en janvier 2026.",
          "it": "Un portale della Commissione europea per la presentazione delle valutazioni di conformità, operativo a gennaio 2026",
          "es": "Un portal de la Comisión Europea para presentar evaluaciones de conformidad, operativo en enero de 2026.",
          "pl": "Portal Komisji Europejskiej do składania ocen zgodności, operacyjny od stycznia 2026.",
          "cs": "Portál Evropské komise pro podávání posouzení shody, operační od ledna 2026",
          "pt": "Um portal da Comissão Europeia para submeter avaliações de conformidade, operacional January 2026",
          "ro": "Un portal al Comisiei Europene pentru depunerea evaluărilor de conformitate, operațional în ianuarie 2026."
        },
        {
          "en": "An industry consortium platform for sharing SBOM data between manufacturers",
          "de": "Eine Plattform eines Industriekonsortiums zum Austausch von SBOM-Daten zwischen Herstellern",
          "nl": "Een platform van een industrieel consortium voor het delen van SBOM-gegevens tussen fabrikanten",
          "fr": "Une plateforme d'un consortium industriel pour le partage de données SBOM entre fabricants.",
          "it": "Una piattaforma di un consorzio industriale per la condivisione di dati SBOM tra produttori",
          "es": "Una plataforma de un consorcio industrial para compartir datos de SBOM entre fabricantes.",
          "pl": "Platforma konsorcjum branżowego do wymiany danych SBOM między producentami.",
          "cs": "Platforma průmyslového konsorcia pro sdílení dat SBOM mezi výrobci",
          "pt": "Uma plataforma de consórcio industrial para partilhar dados de SBOM entre fabricantes",
          "ro": "O platformă a unui consorțiu industrial pentru partajarea datelor SBOM între producători."
        }
      ],
      "correctIndex": 0,
      "explanation": {
        "en": "The Single Reporting Platform (SRP) is operated by ENISA. It receives CRA Article 14 vulnerability and incident reports from manufacturers. It becomes operational on September 11, 2026, the same date the Article 14 reporting obligations come into force. Before that date, national CSIRTs receive reports through their existing channels.",
        "de": "Die Single Reporting Platform (SRP) wird von der ENISA betrieben. Sie empfängt CRA Artikel 14 Schwachstellen- und Vorfallmeldungen von Herstellern. Sie wird am 11. September 2026 betriebsbereit, dem gleichen Datum, an dem die Meldepflichten nach Artikel 14 in Kraft treten. Vor diesem Datum erhalten nationale CSIRTs Meldungen über ihre bestehenden Kanäle.",
        "nl": "Het Single Reporting Platform (SRP) wordt beheerd door ENISA. Het ontvangt kwetsbaarheids- en incidentmeldingen op grond van artikel 14 CRA van fabrikanten. Het wordt operationeel op 11 september 2026, dezelfde datum waarop de meldingsverplichtingen van artikel 14 in werking treden. Voor die datum ontvangen nationale CSIRTs meldingen via hun bestaande kanalen.",
        "fr": "La plateforme unique de signalement (SRP) est exploitée par ENISA. Elle reçoit les signalements de vulnérabilités et d'incidents au titre de l'article 14 du CRA provenant des fabricants. Elle devient opérationnelle le 11 septembre 2026, date à laquelle les obligations de signalement de l'article 14 entrent en vigueur. Avant cette date, les CSIRT nationaux reçoivent les signalements via leurs canaux existants.",
        "it": "La Single Reporting Platform (SRP) è gestita da ENISA. Riceve le segnalazioni di vulnerabilità e incidenti ai sensi dell'articolo 14 CRA dai produttori. Diventa operativa l'11 settembre 2026, la stessa data in cui entrano in vigore gli obblighi di segnalazione di cui all'articolo 14. Prima di tale data, i CSIRT nazionali ricevono le segnalazioni attraverso i canali esistenti.",
        "es": "La Plataforma Única de Notificación (SRP) es operada por ENISA. Recibe notificaciones de vulnerabilidades e incidentes conforme al Artículo 14 del CRA procedentes de los fabricantes. Entra en funcionamiento el 11 de septiembre de 2026, la misma fecha en que las obligaciones de notificación del Artículo 14 comienzan a aplicarse. Antes de esa fecha, los CSIRT nacionales reciben las notificaciones a través de sus canales existentes.",
        "pl": "Single Reporting Platform (SRP) jest obsługiwana przez ENISA. Odbiera raporty o lukach i incydentach zgodnie z artykułem 14 CRA od producentów. Staje się operacyjna 11 września 2026, w tym samym dniu, w którym wchodzą w życie obowiązki sprawozdawcze z artykułu 14. Przed tą datą krajowe CSIRT przyjmują raporty za pośrednictwem istniejących kanałów.",
        "cs": "Single Reporting Platform (SRP) provozuje ENISA. Přijímá hlášení o zranitelnostech a incidente podle CRA článek 14 od výrobců. Stane se operační 11. září 2026, tedy ve stejný den, kdy vstoupí v platnost povinnosti hlášení podle článku 14. Před tímto datem přijímají hlášení národní CSIRT prostřednictvím stávajících kanálů.",
        "pt": "A Plataforma Única de Comunicação (SRP) é operada pela ENISA. Recebe relatórios de vulnerabilidades e incidentes do Artigo 14 do CRA dos fabricantes. Torna-se operacional em September 11, 2026, a mesma data em que as obrigações de comunicação do Artigo 14 entram em vigor. Antes dessa data, as CSIRTs nacionais recebem os relatórios através dos seus canais existentes.",
        "ro": "Platforma Unică de Raportare (SRP) este operată de ENISA. Aceasta primește rapoarte de vulnerabilități și incidente conform Articolului 14 CRA de la producători. Devine operațională la 11 septembrie 2026, aceeași dată la care obligațiile de raportare din Articolul 14 intră în vigoare. Până la acea dată, CSIRT-urile naționale primesc rapoarte prin canalele existente."
      }
    }
  ]
});

export default quiz;
