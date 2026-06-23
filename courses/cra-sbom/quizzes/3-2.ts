import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "3.2",
  "passingScore": 75,
  "questions": [
    {
      "id": "3.2.1",
      "question": {
        "en": "What triggers a need to regenerate the SBOM?",
        "de": "Was löst die Notwendigkeit aus, die SBOM neu zu generieren?",
        "nl": "Wat maakt het nodig om de SBOM opnieuw te genereren?",
        "fr": "Qu'est-ce qui déclenche le besoin de régénérer le SBOM ?",
        "it": "Cosa attiva la necessità di rigenerare l'SBOM?",
        "es": "¿Qué desencadena la necesidad de regenerar el SBOM?",
        "pl": "Co powoduje potrzebę ponownego wygenerowania SBOM?",
        "cs": "Co vyvolává potřebu regenerovat SBOM?",
        "pt": "O que desencadeia a necessidade de regenerar a SBOM?",
        "ro": "Ce declanșează necesitatea regenerării SBOM?"
      },
      "options": [
        {
          "en": "Only when a new CVE is published that affects a listed component",
          "de": "Nur wenn eine neue CVE veröffentlicht wird, die eine aufgeführte Komponente betrifft",
          "nl": "Alleen wanneer een nieuwe CVE wordt gepubliceerd die een vermeld component treft",
          "fr": "Uniquement lorsqu'une nouvelle CVE est publiée et affecte un composant répertorié",
          "it": "Solo quando viene pubblicata una nuova CVE che riguarda un componente elencato",
          "es": "Solo cuando se publica una nueva CVE que afecta a un componente listado",
          "pl": "Tylko gdy opublikowane zostanie nowe CVE wpływające na wymieniony komponent",
          "cs": "Pouze když je zveřejněna nová CVE, která ovlivňuje uvedenou komponentu",
          "pt": "Apenas quando é publicada uma nova CVE que afeta um componente listado",
          "ro": "Doar atunci când este publicat un nou CVE care afectează o componentă listată"
        },
        {
          "en": "When component inventory changes, such as a dependency update, OS patch, or transitive dependency shift, which makes the current SBOM stale",
          "de": "Wenn sich der Komponentenbestand ändert, etwa durch eine Abhängigkeitsaktualisierung, ein OS-Patch oder eine Verschiebung transitiver Abhängigkeiten, wodurch die aktuelle SBOM veraltet ist",
          "nl": "Wanneer de componentinventaris verandert, zoals een afhankelijkheidsupdate, OS-patch of verschuiving in transitieve afhankelijkheden, waardoor de huidige SBOM verouderd raakt",
          "fr": "Lorsqu'un changement survient dans l'inventaire des composants, par exemple une mise à jour de dépendance, un correctif du système d'exploitation ou un changement dans les dépendances transitives, ce qui rend le SBOM actuel obsolète",
          "it": "Quando l'inventario dei componenti cambia, ad esempio un aggiornamento di dipendenza, una patch del sistema operativo o un cambiamento nelle dipendenze transitive, che rende obsoleto l'SBOM attuale",
          "es": "Cuando cambia el inventario de componentes, como una actualización de dependencia, un parche del SO o un cambio en dependencias transitivas, lo que hace que el SBOM actual quede obsoleto",
          "pl": "Gdy zmienia się inwentarz komponentów, na przykład aktualizacja zależności, łatka systemu operacyjnego lub zmiana zależności przechodniej, co powoduje, że bieżący SBOM staje się nieaktualny",
          "cs": "Když se změní inventář komponent, například aktualizace závislosti, záplata OS nebo posun tranzitivní závislosti, což činí aktuální SBOM zastaralým",
          "pt": "Quando o inventário de componentes muda, como uma atualização de dependência, patch do SO ou alteração em dependência transitiva, o que torna a SBOM atual obsoleta",
          "ro": "Când inventarul componentelor se schimbă, cum ar fi o actualizare de dependență, un patch de sistem de operare sau o modificare a dependențelor tranzitive, ceea ce face ca SBOM-ul actual să devină învechit"
        },
        {
          "en": "Only when the product's version number changes by a major release",
          "de": "Nur wenn sich die Versionsnummer des Produkts durch eine Hauptversion ändert",
          "nl": "Alleen wanneer het versienummer van het product verandert door een grote release",
          "fr": "Uniquement lorsque le numéro de version du produit change lors d'une version majeure",
          "it": "Solo quando il numero di versione del prodotto cambia con un rilascio maggiore",
          "es": "Solo cuando el número de versión del producto cambia por una versión principal",
          "pl": "Tylko gdy numer wersji produktu zmienia się w wyniku wydania głównego",
          "cs": "Pouze když se číslo verze produktu změní při hlavním vydání",
          "pt": "Apenas quando o número de versão do produto muda por uma release principal",
          "ro": "Doar atunci când numărul de versiune al produsului se schimbă printr-o lansare majoră"
        },
        {
          "en": "On a fixed annual schedule, regardless of component changes",
          "de": "Nach einem festen jährlichen Zeitplan, unabhängig von Komponentenänderungen",
          "nl": "Volgens een vast jaarlijks schema, ongeacht veranderingen in componenten",
          "fr": "Selon un calendrier annuel fixe, indépendamment des changements de composants",
          "it": "Secondo un calendario annuale fisso, indipendentemente dai cambiamenti dei componenti",
          "es": "Según un calendario anual fijo, independientemente de los cambios en los componentes",
          "pl": "Według stałego harmonogramu rocznego, niezależnie od zmian komponentów",
          "cs": "Podle pevného ročního plánu bez ohledu na změny komponent",
          "pt": "Num calendário anual fixo, independentemente de alterações nos componentes",
          "ro": "Conform unui program anual fix, indiferent de modificările componentelor"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "The SBOM reflects the component inventory at a specific point in time. Any change to the components, a dependency update, an OS security patch, or a change in how transitive dependencies are resolved, makes the existing SBOM stale. This is why SBOM generation must be triggered at build time, not on a schedule.",
        "de": "Die SBOM spiegelt den Komponentenbestand zu einem bestimmten Zeitpunkt wider. Jede Änderung an den Komponenten, eine Abhängigkeitsaktualisierung, ein OS-Sicherheitspatch oder eine Änderung bei der Auflösung transitiver Abhängigkeiten macht die bestehende SBOM veraltet. Deshalb muss die SBOM-Generierung zur Build-Zeit ausgelöst werden, nicht nach einem Zeitplan.",
        "nl": "De SBOM weerspiegelt de componentinventaris op een specifiek moment. Elke wijziging in de componenten, een afhankelijkheidsupdate, een OS-beveiligingspatch of een wijziging in hoe transitieve afhankelijkheden worden opgelost, maakt de bestaande SBOM verouderd. Daarom moet de SBOM-generatie op bouwtijd worden getriggerd, niet volgens een schema.",
        "fr": "Le SBOM reflète l'inventaire des composants à un moment précis. Tout changement apporté aux composants, une mise à jour de dépendance, un correctif de sécurité du système d'exploitation ou un changement dans la résolution des dépendances transitives rend le SBOM existant obsolète. C'est pourquoi la génération du SBOM doit être déclenchée au moment de la compilation, et non selon un calendrier.",
        "it": "L'SBOM riflette l'inventario dei componenti in un momento specifico. Qualsiasi modifica ai componenti, un aggiornamento di dipendenza, una patch di sicurezza del sistema operativo o un cambiamento nel modo in cui vengono risolte le dipendenze transitive rende obsoleto l'SBOM esistente. Per questo motivo la generazione dell'SBOM deve essere attivata al momento della build, non secondo un calendario.",
        "es": "El SBOM refleja el inventario de componentes en un momento específico. Cualquier cambio en los componentes, una actualización de dependencia, un parche de seguridad del SO o un cambio en la resolución de dependencias transitivas hace que el SBOM existente quede obsoleto. Por eso la generación del SBOM debe activarse en el momento de la compilación, no según un calendario.",
        "pl": "SBOM odzwierciedla inwentarz komponentów w określonym momencie. Każda zmiana komponentów, aktualizacja zależności, łatka bezpieczeństwa systemu operacyjnego lub zmiana w sposobie rozwiązywania zależności przechodnich powoduje, że istniejący SBOM staje się nieaktualny. Dlatego generowanie SBOM musi być wyzwalane w czasie kompilacji, a nie według harmonogramu.",
        "cs": "SBOM odráží inventář komponent v konkrétním okamžiku. Jakákoli změna komponent, aktualizace závislosti, bezpečnostní záplata OS nebo změna v tom, jak jsou tranzitivní závislosti vyřešeny, činí existující SBOM zastaralým. Proto musí být generování SBOM spuštěno v době sestavení, nikoli podle plánu.",
        "pt": "A SBOM reflete o inventário de componentes num ponto específico no tempo. Qualquer alteração aos componentes, uma atualização de dependência, um patch de segurança do SO ou uma alteração na forma como as dependências transitivas são resolvidas torna a SBOM existente obsoleta. É por isso que a geração da SBOM deve ser acionada no momento da compilação, não num calendário.",
        "ro": "SBOM reflectă inventarul componentelor la un moment specific în timp. Orice modificare a componentelor, o actualizare de dependență, un patch de securitate al sistemului de operare sau o modificare în modul în care sunt rezolvate dependențele tranzitive face ca SBOM-ul existent să devină învechit. De aceea generarea SBOM trebuie declanșată la momentul construirii, nu conform unui program."
      }
    },
    {
      "id": "3.2.2",
      "question": {
        "en": "What vulnerability feeds does Grype scan against when you run it against an SBOM?",
        "de": "Gegen welche Schwachstellen-Feeds scannt Grype, wenn Sie es gegen eine SBOM ausführen?",
        "nl": "Tegen welke kwetsbaarheidsfeeds scant Grype wanneer u het uitvoert tegen een SBOM?",
        "fr": "Contre quels flux de vulnérabilités Grype effectue-t-il une analyse lorsqu'il est exécuté sur un SBOM ?",
        "it": "Contro quali feed di vulnerabilità esegue la scansione Grype quando lo si esegue su un SBOM?",
        "es": "¿Contra qué fuentes de vulnerabilidades escanea Grype cuando se ejecuta contra un SBOM?",
        "pl": "Jakie źródła informacji o podatnościach skanuje Grype, gdy uruchamiasz go na SBOM?",
        "cs": "Proti jakým zdrojům zranitelností Grype skenuje, když jej spustíte proti SBOM?",
        "pt": "Quais feeds de vulnerabilidades o Grype consulta quando é executado contra uma SBOM?",
        "ro": "Împotriva căror fluxuri de vulnerabilități scanează Grype atunci când îl rulați pe un SBOM?"
      },
      "options": [
        {
          "en": "Only the NVD (National Vulnerability Database)",
          "de": "Nur die NVD (National Vulnerability Database)",
          "nl": "Alleen de NVD (National Vulnerability Database)",
          "fr": "Uniquement la NVD (National Vulnerability Database)",
          "it": "Solo l'NVD (National Vulnerability Database)",
          "es": "Solo la NVD (National Vulnerability Database)",
          "pl": "Tylko NVD (National Vulnerability Database)",
          "cs": "Pouze proti NVD (National Vulnerability Database)",
          "pt": "Apenas a NVD (National Vulnerability Database)",
          "ro": "Doar NVD (National Vulnerability Database)"
        },
        {
          "en": "NVD, GitHub Advisory Database, and OS-specific advisories (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus language-specific feeds (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "de": "NVD, GitHub Advisory Database und betriebssystemspezifische Advisories (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) sowie sprachspezifische Feeds (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "nl": "NVD, GitHub Advisory Database en OS-specifieke adviezen (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus taalspecifieke feeds (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "fr": "NVD, GitHub Advisory Database et les avis spécifiques aux systèmes d'exploitation (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) ainsi que les flux spécifiques aux langages (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "it": "NVD, GitHub Advisory Database e advisory specifiche per sistema operativo (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) più feed specifici per linguaggio (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "es": "NVD, GitHub Advisory Database y avisos específicos de SO (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) además de fuentes específicas de lenguajes (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "pl": "NVD, GitHub Advisory Database oraz doradztwa specyficzne dla systemów operacyjnych (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus źródła specyficzne dla języków (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "cs": "NVD, GitHub Advisory Database a specifické poradenské zdroje OS (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus zdroje specifické pro jazyky (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "pt": "NVD, GitHub Advisory Database e avisos específicos de SO (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) mais feeds específicos de linguagem (PyPI, npm, Go, Maven, NuGet, Ruby)",
          "ro": "NVD, GitHub Advisory Database și consiliile specifice sistemului de operare (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus fluxuri specifice limbajului (PyPI, npm, Go, Maven, NuGet, Ruby)"
        },
        {
          "en": "Only the ENISA vulnerability database via the Single Reporting Platform",
          "de": "Nur die ENISA-Schwachstellendatenbank über die Single Reporting Platform",
          "nl": "Alleen de ENISA-kwetsbaarheidsdatabase via het Single Reporting Platform",
          "fr": "Uniquement la base de données de vulnérabilités d'ENISA via la Single Reporting Platform",
          "it": "Solo il database delle vulnerabilità di ENISA tramite la Single Reporting Platform",
          "es": "Solo la base de datos de vulnerabilidades de ENISA a través de la Single Reporting Platform",
          "pl": "Tylko baza podatności ENISA za pośrednictwem Single Reporting Platform",
          "cs": "Pouze proti databázi zranitelností ENISA prostřednictvím Single Reporting Platform",
          "pt": "Apenas a base de dados de vulnerabilidades da ENISA através da Single Reporting Platform",
          "ro": "Doar baza de date de vulnerabilități ENISA prin Single Reporting Platform"
        },
        {
          "en": "Only CVEs published in the last 12 months",
          "de": "Nur CVEs, die in den letzten 12 Monaten veröffentlicht wurden",
          "nl": "Alleen CVE's die in de afgelopen 12 maanden zijn gepubliceerd",
          "fr": "Uniquement les CVE publiées au cours des 12 derniers mois",
          "it": "Solo le CVE pubblicate negli ultimi 12 mesi",
          "es": "Solo las CVE publicadas en los últimos 12 meses",
          "pl": "Tylko CVE opublikowane w ciągu ostatnich 12 miesięcy",
          "cs": "Pouze proti CVE zveřejněným v posledních 12 měsících",
          "pt": "Apenas CVEs publicadas nos últimos 12 meses",
          "ro": "Doar CVE-uri publicate în ultimele 12 luni"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Grype aggregates multiple vulnerability feeds: NVD, GitHub Advisory Database, and OS-distribution-specific advisories for Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle, and SUSE. It also covers language-ecosystem feeds for PyPI, npm, Go modules, Maven, NuGet, and Ruby gems. This breadth is why Grype catches vulnerabilities that a pure NVD scan misses.",
        "de": "Grype aggregiert mehrere Schwachstellen-Feeds: NVD, GitHub Advisory Database und betriebsverteilungsspezifische Advisories für Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle und SUSE. Es deckt auch Sprach-Ökosystem-Feeds für PyPI, npm, Go-Module, Maven, NuGet und Ruby Gems ab. Diese Breite ist der Grund, warum Grype Schwachstellen erfasst, die ein reiner NVD-Scan verpasst.",
        "nl": "Grype aggregeert meerdere kwetsbaarheidsfeeds: NVD, GitHub Advisory Database en OS-distributiespecifieke adviezen voor Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle en SUSE. Het dekt ook taalecosysteemfeeds voor PyPI, npm, Go-modules, Maven, NuGet en Ruby-gems. Deze breedte is waarom Grype kwetsbaarheden vangt die een pure NVD-scan mist.",
        "fr": "Grype agrège plusieurs flux de vulnérabilités : NVD, GitHub Advisory Database et les avis spécifiques aux distributions de systèmes d'exploitation pour Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle et SUSE. Il couvre également les flux des écosystèmes de langages pour PyPI, npm, Go modules, Maven, NuGet et Ruby gems. Cette étendue explique pourquoi Grype détecte des vulnérabilités qu'une analyse pure NVD ne repère pas.",
        "it": "Grype aggrega più feed di vulnerabilità: NVD, GitHub Advisory Database e advisory specifiche per distribuzione del sistema operativo per Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle e SUSE. Copre inoltre feed ecosistema-specifici per PyPI, npm, moduli Go, Maven, NuGet e gemme Ruby. Questa ampiezza è il motivo per cui Grype individua vulnerabilità che una scansione solo NVD non rileva.",
        "es": "Grype agrega múltiples fuentes de vulnerabilidades: NVD, GitHub Advisory Database y avisos específicos de distribuciones de SO para Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle y SUSE. También cubre fuentes de ecosistemas de lenguajes para PyPI, npm, módulos Go, Maven, NuGet y gemas Ruby. Esta amplitud es la razón por la que Grype detecta vulnerabilidades que un escaneo puro de NVD pasa por alto.",
        "pl": "Grype agreguje wiele źródeł informacji o podatnościach: NVD, GitHub Advisory Database oraz doradztwa specyficzne dla dystrybucji systemów operacyjnych dla Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle i SUSE. Obejmuje także źródła ekosystemów językowych dla PyPI, npm, modułów Go, Maven, NuGet i gemów Ruby. Ta szerokość jest powodem, dla którego Grype wykrywa podatności, które pomija czysty skan NVD.",
        "cs": "Grype agreguje více zdrojů zranitelností: NVD, GitHub Advisory Database a poradenské zdroje specifické pro distribuce OS pro Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle a SUSE. Pokrývá také zdroje ekosystémů jazyků pro PyPI, npm, Go modules, Maven, NuGet a Ruby gems. Díky této šíři Grype zachytí zranitelnosti, které čistý sken NVD přehlédne.",
        "pt": "Grype agrega múltiplos feeds de vulnerabilidades: NVD, GitHub Advisory Database e avisos específicos de distribuição de SO para Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle e SUSE. Abrange também feeds de ecossistemas de linguagem para PyPI, npm, módulos Go, Maven, NuGet e Ruby gems. Esta amplitude é o motivo pelo qual o Grype deteta vulnerabilidades que uma análise pura da NVD não identifica.",
        "ro": "Grype agregă multiple fluxuri de vulnerabilități: NVD, GitHub Advisory Database și consilii specifice distribuțiilor de sistem de operare pentru Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle și SUSE. Acoperă de asemenea fluxuri specifice ecosistemelor de limbaj pentru PyPI, npm, module Go, Maven, NuGet și pachete Ruby. Această amploare explică de ce Grype detectează vulnerabilități pe care o scanare pur NVD le omite."
      }
    },
    {
      "id": "3.2.3",
      "question": {
        "en": "What is the CISA KEV catalogue and why is it relevant to the Article 14 reporting decision?",
        "de": "Was ist der CISA KEV-Katalog und warum ist er für die Entscheidung zur Artikel 14-Meldung relevant?",
        "nl": "Wat is de CISA KEV-catalogus en waarom is deze relevant voor de Artikel 14-meldingsbeslissing?",
        "fr": "Qu'est-ce que le catalogue CISA KEV et pourquoi est-il pertinent pour la décision de notification au titre de l'article 14 ?",
        "it": "Che cos'è il catalogo CISA KEV e perché è rilevante per la decisione di segnalazione ai sensi dell'Articolo 14?",
        "es": "¿Qué es el catálogo CISA KEV y por qué es relevante para la decisión de notificación del Artículo 14?",
        "pl": "Czym jest katalog CISA KEV i dlaczego jest istotny dla decyzji o zgłaszaniu zgodnie z Artykułem 14?",
        "cs": "Co je katalog CISA KEV a proč je relevantní pro rozhodnutí o hlášení podle Článku 14?",
        "pt": "O que é o catálogo CISA KEV e por que é relevante para a decisão de comunicação do Artigo 14?",
        "ro": "Ce este catalogul CISA KEV și de ce este relevant pentru decizia de raportare din Articolul 14?"
      },
      "options": [
        {
          "en": "A list of all CVEs published in the current year, used to calculate CVSS scores",
          "de": "Eine Liste aller im aktuellen Jahr veröffentlichten CVEs, die zur Berechnung von CVSS-Scores verwendet wird",
          "nl": "Een lijst van alle CVE's die in het huidige jaar zijn gepubliceerd, gebruikt om CVSS-scores te berekenen",
          "fr": "Une liste de toutes les CVE publiées dans l'année en cours, utilisée pour calculer les scores CVSS",
          "it": "Un elenco di tutte le CVE pubblicate nell'anno in corso, usato per calcolare i punteggi CVSS",
          "es": "Una lista de todas las CVE publicadas en el año en curso, utilizada para calcular puntuaciones CVSS",
          "pl": "Lista wszystkich CVE opublikowanych w bieżącym roku, używana do obliczania wyników CVSS",
          "cs": "Seznam všech CVE zveřejněných v aktuálním roce, používaný k výpočtu skóre CVSS",
          "pt": "Uma lista de todas as CVEs publicadas no ano corrente, usada para calcular pontuações CVSS",
          "ro": "O listă a tuturor CVE-urilor publicate în anul curent, utilizată pentru calcularea scorurilor CVSS"
        },
        {
          "en": "The CISA Known Exploited Vulnerabilities catalogue: it lists CVEs currently being used in real attacks, which is the actual trigger for the Article 14 24-hour reporting obligation",
          "de": "Der CISA Known Exploited Vulnerabilities-Katalog: Er listet CVEs auf, die derzeit in realen Angriffen verwendet werden, was der eigentliche Auslöser für die 24-Stunden-Meldepflicht nach Artikel 14 ist",
          "nl": "De CISA Known Exploited Vulnerabilities-catalogus: deze bevat CVE's die momenteel in echte aanvallen worden gebruikt, wat de werkelijke trigger is voor de meldingsverplichting van Artikel 14 binnen 24 uur",
          "fr": "Le catalogue CISA Known Exploited Vulnerabilities : il répertorie les CVE actuellement exploitées dans de véritables attaques, ce qui constitue le déclencheur réel de l'obligation de notification dans les 24 heures au titre de l'article 14",
          "it": "Il catalogo CISA Known Exploited Vulnerabilities: elenca le CVE attualmente usate in attacchi reali, che è il vero trigger per l'obbligo di segnalazione entro 24 ore ai sensi dell'Articolo 14",
          "es": "El catálogo CISA Known Exploited Vulnerabilities: enumera las CVE que se están utilizando actualmente en ataques reales, que es el desencadenante real de la obligación de notificación en 24 horas del Artículo 14",
          "pl": "Katalog CISA Known Exploited Vulnerabilities: zawiera listę CVE aktualnie wykorzystywanych w rzeczywistych atakach, co stanowi rzeczywisty wyzwalacz obowiązku zgłaszania w ciągu 24 godzin zgodnie z Artykułem 14",
          "cs": "Katalog CISA Known Exploited Vulnerabilities: uvádí CVE, které se aktuálně používají v reálných útocích, což je skutečný spouštěč 24hodinové oznamovací povinnosti podle Článku 14",
          "pt": "O catálogo CISA Known Exploited Vulnerabilities: lista CVEs atualmente usadas em ataques reais, que constitui o acionador efetivo da obrigação de comunicação no prazo de 24 horas do Artigo 14",
          "ro": "Catalogul CISA Known Exploited Vulnerabilities: listează CVE-uri utilizate în prezent în atacuri reale, ceea ce constituie declanșatorul efectiv al obligației de raportare în 24 de ore din Articolul 14"
        },
        {
          "en": "A German BSI publication listing vulnerabilities relevant to CRA-scope products only",
          "de": "Eine deutsche BSI-Veröffentlichung, die nur Schwachstellen auflistet, die für CRA-Umfang-Produkte relevant sind",
          "nl": "Een Duitse BSI-publicatie met kwetsbaarheden die alleen relevant zijn voor CRA-scopeproducten",
          "fr": "Une publication du BSI allemand répertoriant uniquement les vulnérabilités pertinentes pour les produits relevant du champ d'application du CRA",
          "it": "Una pubblicazione del BSI tedesco che elenca vulnerabilità rilevanti solo per prodotti rientranti nell'ambito del CRA",
          "es": "Una publicación del BSI alemán que enumera vulnerabilidades relevantes solo para productos dentro del ámbito del CRA",
          "pl": "Niemiecka publikacja BSI zawierająca listę podatności istotnych tylko dla produktów objętych zakresem CRA",
          "cs": "Publikace německého BSI uvádějící zranitelnosti relevantní pouze pro produkty v působnosti CRA",
          "pt": "Uma publicação do BSI alemão que lista vulnerabilidades relevantes apenas para produtos no âmbito do CRA",
          "ro": "O publicație a BSI germană care listează vulnerabilități relevante doar pentru produsele din domeniul de aplicare CRA"
        },
        {
          "en": "A European Commission database that replaces the NVD for EU compliance purposes",
          "de": "Eine Datenbank der Europäischen Kommission, die die NVD für EU-Compliance-Zwecke ersetzt",
          "nl": "Een database van de Europese Commissie die de NVD vervangt voor EU-nalevingsdoeleinden",
          "fr": "Une base de données de la Commission européenne qui remplace la NVD aux fins de la conformité à la réglementation de l'UE",
          "it": "Un database della Commissione europea che sostituisce l'NVD ai fini della conformità UE",
          "es": "Una base de datos de la Comisión Europea que sustituye a la NVD para fines de cumplimiento con la UE",
          "pl": "Baza danych Komisji Europejskiej zastępująca NVD do celów zgodności z przepisami UE",
          "cs": "Databáze Evropské komise, která nahrazuje NVD pro účely souladu s předpisy EU",
          "pt": "Uma base de dados da Comissão Europeia que substitui a NVD para efeitos de conformidade com a UE",
          "ro": "O bază de date a Comisiei Europene care înlocuiește NVD pentru scopuri de conformitate UE"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Article 14 CRA requires reporting of 'actively exploited vulnerabilities', not just discovered ones. The CISA KEV catalogue identifies which CVEs are currently being exploited in the wild. A component in your SBOM with a KEV-listed CVE is a strong indicator that the Article 14 reporting trigger may apply.",
        "de": "Artikel 14 CRA erfordert die Meldung von 'aktiv ausgenutzten Schwachstellen', nicht nur entdeckten. Der CISA KEV-Katalog identifiziert, welche CVEs derzeit in freier Wildbahn ausgenutzt werden. Eine Komponente in Ihrer SBOM mit einem KEV-gelisteten CVE ist ein starker Indikator dafür, dass der Auslöser für die Artikel 14-Meldung gelten könnte.",
        "nl": "Artikel 14 CRA vereist melding van 'actief uitgebuitte kwetsbaarheden', niet alleen ontdekte. De CISA KEV-catalogus identificeert welke CVE's momenteel in het wild worden uitgebuit. Een component in uw SBOM met een KEV-vermelde CVE is een sterke indicator dat de trigger voor Artikel 14-melding van toepassing kan zijn.",
        "fr": "L'article 14 du CRA exige la notification des « vulnérabilités activement exploitées », et non seulement des vulnérabilités découvertes. Le catalogue CISA KEV identifie les CVE actuellement exploitées dans la nature. Un composant figurant dans votre SBOM et associé à une CVE répertoriée dans le KEV constitue un indicateur fort que le déclencheur de notification au titre de l'article 14 peut s'appliquer.",
        "it": "L'Articolo 14 CRA richiede la segnalazione di vulnerabilità attivamente sfruttate, non solo di quelle scoperte. Il catalogo CISA KEV identifica quali CVE sono attualmente sfruttate in ambiente reale. Un componente nel proprio SBOM con una CVE elencata in KEV è un forte indicatore che il trigger di segnalazione dell'Articolo 14 può applicarsi.",
        "es": "El Artículo 14 del CRA exige la notificación de vulnerabilidades activamente explotadas, no solo de las descubiertas. El catálogo CISA KEV identifica qué CVE se están explotando actualmente en el mundo real. Un componente en su SBOM con una CVE incluida en el KEV es un indicador fuerte de que puede aplicarse el desencadenante de notificación del Artículo 14.",
        "pl": "Artykuł 14 CRA wymaga zgłaszania 'aktywnie wykorzystywanych podatności', a nie tylko odkrytych. Katalog CISA KEV identyfikuje, które CVE są obecnie wykorzystywane w warunkach rzeczywistych. Komponent w Twoim SBOM z CVE wymienionym w KEV jest silnym wskaźnikiem, że może mieć zastosowanie wyzwalacz zgłaszania zgodnie z Artykułem 14.",
        "cs": "Článek 14 CRA vyžaduje hlášení aktivně zneužívaných zranitelností, nikoli pouze objevených. Katalog CISA KEV identifikuje, které CVE se aktuálně zneužívají v praxi. Komponenta ve vašem SBOM s CVE uvedeným v KEV je silným indikátorem, že se může uplatnit spouštěč hlášení podle Článku 14.",
        "pt": "O Artigo 14 do CRA exige a comunicação de vulnerabilidades ativamente exploradas, não apenas descobertas. O catálogo CISA KEV identifica quais CVEs estão a ser exploradas atualmente no terreno. Um componente na sua SBOM com uma CVE listada no KEV é um indicador forte de que o acionador de comunicação do Artigo 14 pode aplicar-se.",
        "ro": "Articolul 14 CRA impune raportarea 'vulnerabilităților exploatate activ', nu doar a celor descoperite. Catalogul CISA KEV identifică CVE-urile exploatate în prezent în mediul real. O componentă din SBOM cu un CVE listat în KEV reprezintă un indicator puternic că declanșatorul de raportare din Articolul 14 poate fi aplicabil."
      }
    },
    {
      "id": "3.2.4",
      "question": {
        "en": "A monitoring scan finds that a component in your SBOM has a CVSS 9.8 vulnerability. What must you determine before deciding whether to file an Article 14 report?",
        "de": "Ein Monitoring-Scan stellt fest, dass eine Komponente in Ihrer SBOM eine CVSS-9.8-Schwachstelle aufweist. Was müssen Sie feststellen, bevor Sie entscheiden, ob Sie einen Artikel 14-Bericht einreichen?",
        "nl": "Een monitoring-scan vindt dat een component in uw SBOM een CVSS 9.8-kwetsbaarheid heeft. Wat moet u bepalen voordat u besluit of u een Artikel 14-rapport indient?",
        "fr": "Une analyse de surveillance révèle qu'un composant de votre SBOM présente une vulnérabilité CVSS 9.8. Que devez-vous déterminer avant de décider si vous devez déposer une notification au titre de l'article 14 ?",
        "it": "Una scansione di monitoraggio rileva che un componente nel proprio SBOM presenta una vulnerabilità con CVSS 9.8. Che cosa si deve determinare prima di decidere se presentare una segnalazione ai sensi dell'Articolo 14?",
        "es": "Un escaneo de supervisión detecta que un componente en su SBOM tiene una vulnerabilidad con CVSS 9.8. ¿Qué debe determinar antes de decidir si presenta un informe del Artículo 14?",
        "pl": "Skan monitorujący stwierdza, że komponent w Twoim SBOM ma podatność o wyniku CVSS 9.8. Co musisz ustalić przed podjęciem decyzji o złożeniu raportu zgodnie z Artykułem 14?",
        "cs": "Monitorovací sken zjistí, že komponenta ve vašem SBOM má zranitelnost s CVSS 9.8. Co musíte určit, než se rozhodnete, zda podat hlášení podle Článku 14?",
        "pt": "Uma análise de monitorização deteta que um componente na sua SBOM tem uma vulnerabilidade com CVSS 9.8. O que deve determinar antes de decidir se deve apresentar uma comunicação do Artigo 14?",
        "ro": "O scanare de monitorizare constată că o componentă din SBOM are o vulnerabilitate cu CVSS 9.8. Ce trebuie să determinați înainte de a decide dacă depuneți un raport conform Articolului 14?"
      },
      "options": [
        {
          "en": "Whether the CVE was published more than 30 days ago",
          "de": "Ob die CVE vor mehr als 30 Tagen veröffentlicht wurde",
          "nl": "Of de CVE meer dan 30 dagen geleden is gepubliceerd",
          "fr": "Si la CVE a été publiée il y a plus de 30 jours",
          "it": "Se la CVE è stata pubblicata più di 30 giorni fa",
          "es": "Si la CVE se publicó hace más de 30 días",
          "pl": "Czy CVE zostało opublikowane więcej niż 30 dni temu",
          "cs": "Zda bylo CVE zveřejněno před více než 30 dny",
          "pt": "Se a CVE foi publicada há mais de 30 dias",
          "ro": "Dacă CVE-ul a fost publicat cu mai mult de 30 de zile în urmă"
        },
        {
          "en": "Whether the vulnerability is actively exploited in the wild: CVSS score alone does not trigger Article 14, active exploitation does",
          "de": "Ob die Schwachstelle in freier Wildbahn aktiv ausgenutzt wird: Der CVSS-Score allein löst Artikel 14 nicht aus, die aktive Ausnutzung schon",
          "nl": "Of de kwetsbaarheid actief in het wild wordt uitgebuit: alleen de CVSS-score triggert Artikel 14 niet, actieve uitbuiting doet dat",
          "fr": "Si la vulnérabilité est activement exploitée dans la nature : le seul score CVSS ne déclenche pas l'article 14, c'est l'exploitation active qui le fait",
          "it": "Se la vulnerabilità è attivamente sfruttata in ambiente reale: il solo punteggio CVSS non attiva l'Articolo 14, lo fa lo sfruttamento attivo",
          "es": "Si la vulnerabilidad se está explotando activamente en el mundo real: la puntuación CVSS por sí sola no activa el Artículo 14, lo hace la explotación activa",
          "pl": "Czy podatność jest aktywnie wykorzystywana w warunkach rzeczywistych: sam wynik CVSS nie wyzwala Artykułu 14, robi to aktywne wykorzystanie",
          "cs": "Zda je zranitelnost aktivně zneužívána v praxi: samotné skóre CVSS nespouští Článek 14, aktivní zneužívání ano",
          "pt": "Se a vulnerabilidade está a ser ativamente explorada no terreno: a pontuação CVSS por si só não aciona o Artigo 14, a exploração ativa é que o faz",
          "ro": "Dacă vulnerabilitatea este exploatată activ în mediul real: scorul CVSS singur nu declanșează Articolul 14, exploatarea activă o face"
        },
        {
          "en": "Whether the component is a top-level or transitive dependency",
          "de": "Ob die Komponente eine Top-Level- oder transitive Abhängigkeit ist",
          "nl": "Of het component een top-level of transitieve afhankelijkheid is",
          "fr": "Si le composant est une dépendance de premier niveau ou transitive",
          "it": "Se il componente è una dipendenza di primo livello o transitiva",
          "es": "Si el componente es una dependencia de nivel superior o transitiva",
          "pl": "Czy komponent jest zależnością najwyższego poziomu czy przechodnią",
          "cs": "Zda je komponenta závislostí nejvyšší úrovně nebo tranzitivní závislostí",
          "pt": "Se o componente é uma dependência de nível superior ou transitiva",
          "ro": "Dacă componenta este o dependență de nivel superior sau tranzitivă"
        },
        {
          "en": "Whether your product is classified as Important Class I or II under the CRA",
          "de": "Ob Ihr Produkt nach dem CRA als Wichtig Klasse I oder II eingestuft ist",
          "nl": "Of uw product is geclassificeerd als Important Class I of II onder de CRA",
          "fr": "Si votre produit est classé Important classe I ou II au titre du CRA",
          "it": "Se il prodotto è classificato come Important Classe I o II ai sensi del CRA",
          "es": "Si su producto está clasificado como Importante Clase I o II según el CRA",
          "pl": "Czy Twój produkt jest sklasyfikowany jako Important Class I lub II zgodnie z CRA",
          "cs": "Zda je váš produkt klasifikován jako Important Class I nebo II podle CRA",
          "pt": "Se o seu produto está classificado como Important Class I ou II ao abrigo do CRA",
          "ro": "Dacă produsul este clasificat ca Important Clasa I sau II conform CRA"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Article 14(1) CRA uses the phrase 'actively exploited vulnerability' as the trigger. A high CVSS score means the vulnerability is severe if exploited, not that it is being actively exploited. Check the CISA KEV catalogue and threat intelligence feeds. Document the assessment either way, using a VEX statement if the conclusion is 'not affected.'",
        "de": "Artikel 14(1) CRA verwendet den Ausdruck 'aktiv ausgenutzte Schwachstelle' als Auslöser. Ein hoher CVSS-Score bedeutet, dass die Schwachstelle schwerwiegend ist, wenn sie ausgenutzt wird, nicht dass sie aktiv ausgenutzt wird. Prüfen Sie den CISA KEV-Katalog und Threat-Intelligence-Feeds. Dokumentieren Sie die Bewertung in jedem Fall, gegebenenfalls mit einer VEX-Erklärung, wenn das Ergebnis 'nicht betroffen' lautet.",
        "nl": "Artikel 14(1) CRA gebruikt de term 'actief uitgebuitte kwetsbaarheid' als trigger. Een hoge CVSS-score betekent dat de kwetsbaarheid ernstig is als hij wordt uitgebuit, niet dat hij actief wordt uitgebuit. Controleer de CISA KEV-catalogus en threat intelligence feeds. Documenteer de beoordeling hoe dan ook, met een VEX-statement als de conclusie 'niet getroffen' is.",
        "fr": "L'article 14(1) du CRA utilise l'expression « vulnérabilité activement exploitée » comme déclencheur. Un score CVSS élevé signifie que la vulnérabilité est grave si elle est exploitée, et non qu'elle est activement exploitée. Consultez le catalogue CISA KEV et les flux de renseignement sur les menaces. Documentez l'évaluation dans tous les cas, en utilisant une déclaration VEX si la conclusion est « non affecté ».",
        "it": "L'Articolo 14(1) CRA usa l'espressione vulnerabilità attivamente sfruttata come trigger. Un punteggio CVSS elevato significa che la vulnerabilità è grave se sfruttata, non che è attivamente sfruttata. Verificare il catalogo CISA KEV e i feed di threat intelligence. Documentare la valutazione in ogni caso, usando un'istruzione VEX se la conclusione è non interessato.",
        "es": "El Artículo 14(1) del CRA utiliza la expresión vulnerabilidad activamente explotada como desencadenante. Una puntuación CVSS alta significa que la vulnerabilidad es grave si se explota, no que se esté explotando activamente. Consulte el catálogo CISA KEV y las fuentes de inteligencia de amenazas. Documente la evaluación de cualquier manera, utilizando una declaración VEX si la conclusión es no afectado.",
        "pl": "Artykuł 14(1) CRA używa wyrażenia 'aktywnie wykorzystywana podatność' jako wyzwalacza. Wysoki wynik CVSS oznacza, że podatność jest poważna, jeśli zostanie wykorzystana, a nie że jest aktywnie wykorzystywana. Sprawdź katalog CISA KEV i źródła informacji o zagrożeniach. Udokumentuj ocenę w każdym przypadku, używając oświadczenia VEX, jeśli wniosek brzmi 'nie dotyczy'.",
        "cs": "Článek 14(1) CRA používá výraz aktivně zneužívaná zranitelnost jako spouštěč. Vysoké skóre CVSS znamená, že zranitelnost je závažná, pokud je zneužita, nikoli že je aktivně zneužívána. Zkontrolujte katalog CISA KEV a zdroje threat intelligence. Dokumentujte posouzení v každém případě, v případě závěru not affected použijte výrok VEX.",
        "pt": "O Artigo 14(1) do CRA utiliza a expressão vulnerabilidade ativamente explorada como acionador. Uma pontuação CVSS elevada significa que a vulnerabilidade é grave se explorada, não que está a ser ativamente explorada. Consulte o catálogo CISA KEV e feeds de inteligência de ameaças. Documente a avaliação em qualquer caso, usando uma declaração VEX se a conclusão for não afetado.",
        "ro": "Articolul 14(1) CRA utilizează expresia 'vulnerabilitate exploatată activ' ca declanșator. Un scor CVSS ridicat înseamnă că vulnerabilitatea este gravă dacă este exploatată, nu că este exploatată activ. Verificați catalogul CISA KEV și fluxurile de informații despre amenințări. Documentați evaluarea în orice caz, utilizând o declarație VEX dacă concluzia este 'neafectat'."
      }
    },
    {
      "id": "3.2.5",
      "question": {
        "en": "What advantage does OWASP Dependency-Track provide for a manufacturer with multiple CRA-scope products?",
        "de": "Welchen Vorteil bietet OWASP Dependency-Track einem Hersteller mit mehreren CRA-Umfang-Produkten?",
        "nl": "Welk voordeel biedt OWASP Dependency-Track voor een fabrikant met meerdere CRA-scopeproducten?",
        "fr": "Quel avantage OWASP Dependency-Track apporte-t-il à un fabricant proposant plusieurs produits relevant du champ d'application du CRA ?",
        "it": "Quale vantaggio offre OWASP Dependency-Track a un produttore con più prodotti rientranti nell'ambito del CRA?",
        "es": "¿Qué ventaja proporciona OWASP Dependency-Track a un fabricante con varios productos dentro del ámbito del CRA?",
        "pl": "Jaką zaletę zapewnia OWASP Dependency-Track producentowi z wieloma produktami objętymi zakresem CRA?",
        "cs": "Jakou výhodu poskytuje OWASP Dependency-Track výrobci s více produkty v působnosti CRA?",
        "pt": "Que vantagem oferece o OWASP Dependency-Track a um fabricante com múltiplos produtos no âmbito do CRA?",
        "ro": "Ce avantaj oferă OWASP Dependency-Track pentru un producător cu mai multe produse din domeniul de aplicare CRA?"
      },
      "options": [
        {
          "en": "It automatically files Article 14 reports to ENISA on your behalf",
          "de": "Es reicht automatisch Artikel 14-Berichte bei ENISA in Ihrem Namen ein",
          "nl": "Het dient automatisch Artikel 14-rapporten in bij ENISA namens u",
          "fr": "Il dépose automatiquement les notifications au titre de l'article 14 auprès d'ENISA en votre nom",
          "it": "Presenta automaticamente le segnalazioni ai sensi dell'Articolo 14 a ENISA per conto dell'utente",
          "es": "Presenta automáticamente los informes del Artículo 14 a ENISA en su nombre",
          "pl": "Automatycznie składa raporty zgodnie z Artykułem 14 do ENISA w Twoim imieniu",
          "cs": "Automaticky podává hlášení podle Článku 14 ENISA vaším jménem",
          "pt": "Apresenta automaticamente comunicações do Artigo 14 à ENISA em seu nome",
          "ro": "Depune automat rapoarte conform Articolului 14 către ENISA în numele dumneavoastră"
        },
        {
          "en": "It provides centralised continuous monitoring: you upload SBOMs for all products and receive automated alerts when a new CVE affects any component across the portfolio",
          "de": "Es bietet zentralisierte kontinuierliche Überwachung: Sie laden SBOMs für alle Produkte hoch und erhalten automatisierte Warnungen, wenn eine neue CVE eine Komponente im gesamten Portfolio betrifft",
          "nl": "Het biedt gecentraliseerde continue monitoring: u uploadt SBOM's voor alle producten en ontvangt geautomatiseerde waarschuwingen wanneer een nieuwe CVE een component in de hele portefeuille treft",
          "fr": "Il fournit une surveillance continue centralisée : vous téléversez les SBOM de tous les produits et recevez des alertes automatisées lorsqu'une nouvelle CVE affecte un composant quelconque du portefeuille",
          "it": "Fornisce monitoraggio continuo centralizzato: si caricano gli SBOM per tutti i prodotti e si ricevono avvisi automatici quando una nuova CVE riguarda un componente in tutto il portafoglio",
          "es": "Proporciona supervisión continua centralizada: carga SBOM para todos los productos y recibe alertas automáticas cuando una nueva CVE afecta a cualquier componente del conjunto",
          "pl": "Zapewnia scentralizowane ciągłe monitorowanie: przesyłasz SBOM dla wszystkich produktów i otrzymujesz automatyczne alerty, gdy nowe CVE wpływa na dowolny komponent w całym portfelu",
          "cs": "Poskytuje centralizované průběžné monitorování: nahrajete SBOM pro všechny produkty a dostáváte automatická upozornění, když nová CVE ovlivní jakoukoli komponentu v celém portfoliu",
          "pt": "Fornece monitorização contínua centralizada: carrega SBOMs de todos os produtos e recebe alertas automáticos quando uma nova CVE afeta qualquer componente do portfólio",
          "ro": "Oferă monitorizare continuă centralizată: încărcați SBOM-uri pentru toate produsele și primiți alerte automate atunci când un nou CVE afectează orice componentă din portofoliu"
        },
        {
          "en": "It generates SBOMs automatically from source code repositories without requiring Syft or cdxgen",
          "de": "Es generiert SBOMs automatisch aus Quellcode-Repositorys, ohne Syft oder cdxgen zu benötigen",
          "nl": "Het genereert automatisch SBOM's uit broncode-repositories zonder Syft of cdxgen te vereisen",
          "fr": "Il génère automatiquement les SBOM à partir des référentiels de code source sans nécessiter Syft ni cdxgen",
          "it": "Genera automaticamente gli SBOM dai repository del codice sorgente senza richiedere Syft o cdxgen",
          "es": "Genera SBOM automáticamente a partir de repositorios de código fuente sin necesidad de Syft o cdxgen",
          "pl": "Generuje SBOM automatycznie z repozytoriów kodu źródłowego bez konieczności używania Syft lub cdxgen",
          "cs": "Generuje SBOM automaticky ze zdrojových repozitářů bez nutnosti použít Syft nebo cdxgen",
          "pt": "Gera SBOMs automaticamente a partir de repositórios de código-fonte sem exigir Syft ou cdxgen",
          "ro": "Generează SBOM-uri automat din depozitele de cod sursă fără a necesita Syft sau cdxgen"
        },
        {
          "en": "It validates that SBOMs conform to CRA Annex I, Part II, point (1) and issues a compliance certificate",
          "de": "Es validiert, dass SBOMs mit CRA Anhang I Teil II Nummer 1 konform sind, und stellt ein Compliance-Zertifikat aus",
          "nl": "Het valideert dat SBOM's voldoen aan CRA Bijlage I, deel II, punt (1) en geeft een conformiteitscertificaat af",
          "fr": "Il valide que les SBOM sont conformes à l'annexe I, partie II, point (1) du CRA et délivre un certificat de conformité",
          "it": "Convalida che gli SBOM siano conformi all'Allegato I Parte II punto (1) del CRA e rilascia un certificato di conformità",
          "es": "Valida que los SBOM cumplan con el Anexo I Parte II punto (1) del CRA y emite un certificado de conformidad",
          "pl": "Waliduje, czy SBOM są zgodne z Załącznikiem I część II punkt (1) CRA i wydaje certyfikat zgodności",
          "cs": "Ověřuje, že SBOM odpovídají Příloze I část II bod (1) CRA, a vydává osvědčení o souladu",
          "pt": "Valida que as SBOMs cumprem o Anexo I do CRA, Parte II, ponto (1) e emite um certificado de conformidade",
          "ro": "Validează că SBOM-urile respectă CRA Anexa I, Partea II, punctul (1) și emite un certificat de conformitate"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "OWASP Dependency-Track is a centralised SBOM management platform. It continuously monitors uploaded SBOMs against vulnerability feeds and alerts you when new CVEs affect any component. For a manufacturer with multiple products, this replaces a manual daily scan loop with an automated alert system, scaling the Article 14 monitoring obligation across a portfolio.",
        "de": "OWASP Dependency-Track ist eine zentralisierte SBOM-Management-Plattform. Sie überwacht kontinuierlich hochgeladene SBOMs gegen Schwachstellen-Feeds und warnt Sie, wenn neue CVEs eine Komponente betreffen. Für einen Hersteller mit mehreren Produkten ersetzt dies eine manuelle tägliche Scan-Schleife durch ein automatisiertes Warnsystem und skaliert die Artikel 14-Überwachungspflicht über ein Portfolio.",
        "nl": "OWASP Dependency-Track is een gecentraliseerd SBOM-beheerplatform. Het monitort continu geüploade SBOM's tegen kwetsbaarheidsfeeds en waarschuwt u wanneer nieuwe CVE's een component treffen. Voor een fabrikant met meerdere producten vervangt dit een handmatige dagelijkse scanlus door een geautomatiseerd waarschuwingssysteem, waardoor de monitoringverplichting van Artikel 14 over een portefeuille wordt geschaald.",
        "fr": "OWASP Dependency-Track est une plateforme centralisée de gestion des SBOM. Elle surveille en continu les SBOM téléversés par rapport aux flux de vulnérabilités et vous alerte lorsqu'une nouvelle CVE affecte un composant. Pour un fabricant proposant plusieurs produits, cela remplace une boucle de balayage manuel quotidienne par un système d'alerte automatisé, permettant de mettre à l'échelle l'obligation de surveillance au titre de l'article 14 sur un portefeuille.",
        "it": "OWASP Dependency-Track è una piattaforma centralizzata di gestione degli SBOM. Monitora continuamente gli SBOM caricati rispetto ai feed di vulnerabilità e avvisa quando nuove CVE riguardano un componente. Per un produttore con più prodotti, questo sostituisce un ciclo manuale di scansione giornaliera con un sistema di avvisi automatizzato, scalando l'obbligo di monitoraggio dell'Articolo 14 su un portafoglio.",
        "es": "OWASP Dependency-Track es una plataforma centralizada de gestión de SBOM. Supervisa continuamente los SBOM cargados frente a fuentes de vulnerabilidades y le avisa cuando nuevas CVE afectan a cualquier componente. Para un fabricante con varios productos, esto sustituye un bucle manual de escaneo diario por un sistema de alertas automatizado, escalando la obligación de supervisión del Artículo 14 en todo el conjunto.",
        "pl": "OWASP Dependency-Track to scentralizowana platforma zarządzania SBOM. Ciągle monitoruje przesłane SBOM pod kątem źródeł informacji o podatnościach i alertuje, gdy nowe CVE wpływają na dowolny komponent. Dla producenta z wieloma produktami zastępuje to ręczną codzienną pętlę skanowania zautomatyzowanym systemem alertów, skalując obowiązek monitorowania zgodnie z Artykułem 14 w całym portfelu.",
        "cs": "OWASP Dependency-Track je centralizovaná platforma pro správu SBOM. Průběžně monitoruje nahrané SBOM proti zdrojům zranitelností a upozorňuje vás, když nové CVE ovlivní jakoukoli komponentu. Pro výrobce s více produkty nahrazuje ruční denní skenovací smyčku automatizovaným systémem upozornění a škáluje povinnost monitorování podle Článku 14 napříč portfoliem.",
        "pt": "OWASP Dependency-Track é uma plataforma centralizada de gestão de SBOM. Monitoriza continuamente as SBOMs carregadas contra feeds de vulnerabilidades e alerta quando novas CVEs afetam qualquer componente. Para um fabricante com múltiplos produtos, substitui um ciclo manual de análise diária por um sistema de alertas automatizado, escalando a obrigação de monitorização do Artigo 14 em todo o portfólio.",
        "ro": "OWASP Dependency-Track este o platformă centralizată de gestionare a SBOM. Monitorizează continuu SBOM-urile încărcate față de fluxurile de vulnerabilități și vă alertează atunci când noi CVE-uri afectează orice componentă. Pentru un producător cu mai multe produse, aceasta înlocuiește o buclă manuală zilnică de scanare cu un sistem automat de alerte, scalând obligația de monitorizare din Articolul 14 pe întregul portofoliu."
      }
    }
  ]
});

export default quiz;
