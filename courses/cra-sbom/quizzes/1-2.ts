import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "1.2",
  "passingScore": 75,
  "questions": [
    {
      "id": "1.2.1",
      "question": {
        "en": "What is a top-level dependency?",
        "de": "Was ist eine Abhängigkeit der obersten Ebene?",
        "nl": "Wat is een top-level dependency?",
        "fr": "Qu'est-ce qu'une dépendance de premier niveau ?",
        "it": "Che cos'è una dipendenza di primo livello?",
        "es": "¿Qué es una dependencia de primer nivel?",
        "pl": "Czym jest zależność najwyższego poziomu?",
        "cs": "Co je závislost nejvyšší úrovně?",
        "pt": "O que é uma dependência de nível superior?",
        "ro": "Ce este o dependență de nivel superior?"
      },
      "options": [
        {
          "en": "The most critical dependency in terms of security risk",
          "de": "Die kritischste Abhängigkeit hinsichtlich des Sicherheitsrisikos",
          "nl": "De meest kritieke afhankelijkheid in termen van beveiligingsrisico",
          "fr": "La dépendance la plus critique en termes de risque de sécurité",
          "it": "La dipendenza più critica in termini di rischio di sicurezza",
          "es": "La dependencia más crítica en términos de riesgo de seguridad",
          "pl": "Najbardziej krytyczna zależność pod względem ryzyka bezpieczeństwa",
          "cs": "Nejkritičtější závislost z hlediska bezpečnostního rizika",
          "pt": "A dependência mais crítica em termos de risco de segurança",
          "ro": "Dependența cea mai critică din punct de vedere al riscului de securitate"
        },
        {
          "en": "A component that your code directly imports or links against",
          "de": "Eine Komponente, die Ihr Code direkt importiert oder gegen die er verlinkt",
          "nl": "Een component die uw code direct importeert of waartegen deze linkt",
          "fr": "Un composant que votre code importe ou lie directement",
          "it": "Un componente che il tuo codice importa o collega direttamente",
          "es": "Un componente que su código importa o vincula directamente",
          "pl": "Komponent, który twój kod bezpośrednio importuje lub linkuje",
          "cs": "Komponenta, kterou váš kód přímo importuje nebo proti níž se linkuje",
          "pt": "Um componente que o seu código importa ou liga diretamente",
          "ro": "O componentă pe care codul dumneavoastră o importă sau o leagă direct"
        },
        {
          "en": "A dependency that is shared by more than three of your top-level libraries",
          "de": "Eine Abhängigkeit, die von mehr als drei Ihrer Bibliotheken der obersten Ebene gemeinsam genutzt wird",
          "nl": "Een afhankelijkheid die wordt gedeeld door meer dan drie van uw top-level libraries",
          "fr": "Une dépendance partagée par plus de trois de vos bibliothèques de premier niveau",
          "it": "Una dipendenza condivisa da più di tre delle tue librerie di primo livello",
          "es": "Una dependencia compartida por más de tres de sus bibliotecas de primer nivel",
          "pl": "Zależność współdzielona przez więcej niż trzy z twoich bibliotek najwyższego poziomu",
          "cs": "Závislost, kterou sdílí více než tři vaše knihovny nejvyšší úrovně",
          "pt": "Uma dependência partilhada por mais de três das suas bibliotecas de nível superior",
          "ro": "O dependență partajată de mai mult de trei biblioteci de nivel superior"
        },
        {
          "en": "Any component with a CVSS score above 7.0",
          "de": "Jede Komponente mit einem CVSS-Score über 7,0",
          "nl": "Elke component met een CVSS-score boven 7,0",
          "fr": "Tout composant avec un score CVSS supérieur à 7,0",
          "it": "Qualsiasi componente con un punteggio CVSS superiore a 7.0",
          "es": "Cualquier componente con una puntuación CVSS superior a 7.0",
          "pl": "Dowolny komponent z wynikiem CVSS powyżej 7.0",
          "cs": "Jakákoli komponenta s CVSS skóre vyšším než 7,0",
          "pt": "Qualquer componente com uma pontuação CVSS acima de 7.0",
          "ro": "Orice componentă cu un scor CVSS peste 7.0"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "A top-level dependency is one your code directly imports, listed in your own package manifest (package.json, pom.xml, requirements.txt, etc.). You chose it explicitly. CRA Annex I, Part II, point (1) requires the SBOM to cover at least these.",
        "de": "Eine Abhängigkeit der obersten Ebene ist eine, die Ihr Code direkt importiert und die in Ihrem eigenen Paketmanifest aufgeführt ist (package.json, pom.xml, requirements.txt usw.). Sie haben sie explizit ausgewählt. CRA Anhang I Teil II Nummer 1 verlangt, dass die SBOM mindestens diese abdeckt.",
        "nl": "Een top-level dependency is een die uw code direct importeert en die vermeld staat in uw eigen package manifest (package.json, pom.xml, requirements.txt, etc.). U hebt deze expliciet gekozen. CRA Bijlage I, Deel II, punt (1) vereist dat de SBOM ten minste deze dekt.",
        "fr": "Une dépendance de premier niveau est celle que votre code importe directement et qui figure dans votre propre manifeste de paquet (package.json, pom.xml, requirements.txt, etc.). Vous l'avez choisie explicitement. L'annexe I, partie II, point (1) du CRA exige que la SBOM couvre au moins celles-ci.",
        "it": "Una dipendenza di primo livello è una che il tuo codice importa direttamente, elencata nel tuo manifest del pacchetto (package.json, pom.xml, requirements.txt, ecc.). L'hai scelta esplicitamente. L'Allegato I, Parte II, punto (1) del CRA richiede che l'SBOM copra almeno queste.",
        "es": "Una dependencia de primer nivel es aquella que su código importa directamente, listada en su propio manifiesto de paquetes (package.json, pom.xml, requirements.txt, etc.). La eligió explícitamente. El Anexo I, Parte II, punto (1) del CRA requiere que el SBOM cubra al menos estas.",
        "pl": "Zależność najwyższego poziomu to taka, którą twój kod bezpośrednio importuje i która jest wymieniona w twoim własnym manifeście pakietów (package.json, pom.xml, requirements.txt itp.). Wybrałeś ją jawnie. CRA Załącznik I, Część II, punkt (1) wymaga, aby SBOM obejmował co najmniej te elementy.",
        "cs": "Závislost nejvyšší úrovně je taková, kterou váš kód přímo importuje a která je uvedena ve vašem vlastním manifestu balíčků (package.json, pom.xml, requirements.txt atd.). Vybrali jste ji explicitně. CRA Příloha I část II bod (1) vyžaduje, aby SBOM pokrýval alespoň tyto.",
        "pt": "Uma dependência de nível superior é aquela que o seu código importa diretamente, listada no seu próprio manifesto de pacotes (package.json, pom.xml, requirements.txt, etc.). Escolheu-a explicitamente. O Anexo I, Parte II, ponto (1) do CRA exige que o SBOM cubra pelo menos estas.",
        "ro": "O dependență de nivel superior este una pe care codul dumneavoastră o importă direct, listată în propriul manifest de pachete (package.json, pom.xml, requirements.txt etc.). Ați ales-o explicit. Anexa I, partea II, punctul (1) CRA impune ca SBOM-ul să acopere cel puțin acestea."
      }
    },
    {
      "id": "1.2.2",
      "question": {
        "en": "Log4Shell (CVE-2021-44228) affected thousands of applications whose developers had never directly imported log4j-core. What does this illustrate?",
        "de": "Log4Shell (CVE-2021-44228) betraf Tausende von Anwendungen, deren Entwickler log4j-core nie direkt importiert hatten. Was illustriert dies?",
        "nl": "Log4Shell (CVE-2021-44228) trof duizenden applicaties waarvan de ontwikkelaars log4j-core nooit direct hadden geïmporteerd. Wat illustreert dit?",
        "fr": "Log4Shell (CVE-2021-44228) a affecté des milliers d'applications dont les développeurs n'avaient jamais importé directement log4j-core. Que cela illustre-t-il ?",
        "it": "Log4Shell (CVE-2021-44228) ha interessato migliaia di applicazioni i cui sviluppatori non avevano mai importato direttamente log4j-core. Cosa illustra questo?",
        "es": "Log4Shell (CVE-2021-44228) afectó a miles de aplicaciones cuyos desarrolladores nunca importaron directamente log4j-core. ¿Qué ilustra esto?",
        "pl": "Log4Shell (CVE-2021-44228) dotknął tysiące aplikacji, których twórcy nigdy nie zaimportowali bezpośrednio log4j-core. Co to ilustruje?",
        "cs": "Log4Shell (CVE-2021-44228) ovlivnil tisíce aplikací, jejichž vývojáři nikdy přímo neimportovali log4j-core. Co to ilustruje?",
        "pt": "O Log4Shell (CVE-2021-44228) afetou milhares de aplicações cujos programadores nunca importaram diretamente o log4j-core. O que isto ilustra?",
        "ro": "Log4Shell (CVE-2021-44228) a afectat mii de aplicații ale căror dezvoltatori nu importaseră niciodată direct log4j-core. Ce ilustrează acest lucru?"
      },
      "options": [
        {
          "en": "That CVE scores overestimate real-world risk",
          "de": "Dass CVE-Scores das reale Risiko überschätzen",
          "nl": "Dat CVE-scores het reële risico overschatten",
          "fr": "Que les scores CVE surestiment le risque réel",
          "it": "Che i punteggi CVE sovrastimano il rischio reale",
          "es": "Que las puntuaciones CVE sobreestiman el riesgo en el mundo real",
          "pl": "Że wyniki CVE przeceniają rzeczywiste ryzyko",
          "cs": "Že skóre CVE přeceňují riziko v reálném světě",
          "pt": "Que as pontuações CVE sobrestimam o risco real",
          "ro": "Că scorurile CVE supraestimează riscul real"
        },
        {
          "en": "That top-level-only SBOMs fail to reveal transitive vulnerability exposure",
          "de": "Dass SBOMs nur auf Ebene der obersten Abhängigkeiten die transitive Vulnerabilitäts-Exposition nicht aufdecken",
          "nl": "Dat SBOMs die alleen top-level dekken de blootstelling aan transitieve kwetsbaarheden niet zichtbaar maken",
          "fr": "Que les SBOM limitées au premier niveau ne révèlent pas l'exposition aux vulnérabilités transitives",
          "it": "Che gli SBOM limitati al primo livello non rivelano l'esposizione a vulnerabilità transitive",
          "es": "Que los SBOM solo de primer nivel no revelan la exposición a vulnerabilidades transitivas",
          "pl": "Że SBOMy obejmujące tylko zależności najwyższego poziomu nie ujawniają narażenia na luki w zależnościach przechodnich",
          "cs": "Že SBOMy pouze nejvyšší úrovně neodhalují expozici tranzitivním zranitelnostem",
          "pt": "Que os SBOMs limitados ao nível superior não revelam a exposição transitiva a vulnerabilidades",
          "ro": "Că SBOM-urile limitate la nivel superior nu relevă expunerea la vulnerabilități tranzitive"
        },
        {
          "en": "That Java applications are inherently less secure",
          "de": "Dass Java-Anwendungen inhärent weniger sicher sind",
          "nl": "Dat Java-applicaties inherent minder veilig zijn",
          "fr": "Que les applications Java sont intrinsèquement moins sécurisées",
          "it": "Che le applicazioni Java sono intrinsecamente meno sicure",
          "es": "Que las aplicaciones Java son inherentemente menos seguras",
          "pl": "Że aplikacje Java są z natury mniej bezpieczne",
          "cs": "Že aplikace v Javě jsou inherentně méně bezpečné",
          "pt": "Que as aplicações Java são inerentemente menos seguras",
          "ro": "Că aplicațiile Java sunt inerent mai puțin sigure"
        },
        {
          "en": "That dependency scanning tools were not available before 2021",
          "de": "Dass Dependency-Scanning-Tools vor 2021 nicht verfügbar waren",
          "nl": "Dat tools voor het scannen van afhankelijkheden vóór 2021 niet beschikbaar waren",
          "fr": "Que les outils d'analyse des dépendances n'étaient pas disponibles avant 2021",
          "it": "Che gli strumenti di scansione delle dipendenze non erano disponibili prima del 2021",
          "es": "Que las herramientas de escaneo de dependencias no estaban disponibles antes de 2021",
          "pl": "Że narzędzia do skanowania zależności nie były dostępne przed 2021 rokiem",
          "cs": "Že nástroje pro skenování závislostí nebyly dostupné před rokem 2021",
          "pt": "Que as ferramentas de análise de dependências não estavam disponíveis antes de 2021",
          "ro": "Că instrumentele de scanare a dependențelor nu erau disponibile înainte de 2021"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Log4Shell was a transitive dependency, pulled in by a library that was itself a dependency. Teams with top-level-only SBOMs had no record of log4j-core and could not quickly determine whether they were affected. Full transitive SBOMs answered the question in a single scanner run.",
        "de": "Log4Shell war eine transitive Abhängigkeit, die durch eine Bibliothek gezogen wurde, die selbst eine Abhängigkeit war. Teams mit SBOMs nur auf Ebene der obersten Abhängigkeiten hatten keinen Eintrag für log4j-core und konnten nicht schnell feststellen, ob sie betroffen waren. Vollständige transitive SBOMs beantworteten die Frage in einem einzigen Scanner-Durchlauf.",
        "nl": "Log4Shell was een transitieve afhankelijkheid, binnengehaald door een library die zelf een afhankelijkheid was. Teams met SBOMs die alleen top-level dekten, hadden geen registratie van log4j-core en konden niet snel vaststellen of zij getroffen waren. Volledige transitieve SBOMs beantwoordden de vraag met één enkele scanner-run.",
        "fr": "Log4Shell était une dépendance transitive, incluse par une bibliothèque elle-même dépendance. Les équipes dotées de SBOM limitées au premier niveau n'avaient aucune trace de log4j-core et ne pouvaient pas déterminer rapidement si elles étaient concernées. Les SBOM transitives complètes répondaient à la question en une seule exécution de l'outil.",
        "it": "Log4Shell era una dipendenza transitiva, inclusa da una libreria che era essa stessa una dipendenza. I team con SBOM limitati al primo livello non avevano traccia di log4j-core e non potevano determinare rapidamente se fossero interessati. Gli SBOM transitivi completi hanno risposto alla domanda con una singola esecuzione dello scanner.",
        "es": "Log4Shell fue una dependencia transitiva, incorporada por una biblioteca que era a su vez una dependencia. Los equipos con SBOM solo de primer nivel no tenían registro de log4j-core y no podían determinar rápidamente si se veían afectados. Los SBOM transitivos completos respondieron la pregunta en una sola ejecución del escáner.",
        "pl": "Log4Shell był zależnością przechodnią, pobieraną przez bibliotekę, która sama była zależnością. Zespoły posiadające SBOMy tylko najwyższego poziomu nie miały zapisu log4j-core i nie mogły szybko ustalić, czy były narażone. Pełne SBOMy przechodnie odpowiadały na pytanie w ramach jednego uruchomienia skanera.",
        "cs": "Log4Shell byla tranzitivní závislost, stažená knihovnou, která sama byla závislostí. Týmy se SBOMy pouze nejvyšší úrovně neměly záznam o log4j-core a nemohly rychle určit, zda byli ovlivněni. Úplné tranzitivní SBOMy odpověděly na otázku jedním spuštěním skeneru.",
        "pt": "O Log4Shell era uma dependência transitiva, puxada por uma biblioteca que era ela própria uma dependência. Equipas com SBOMs apenas de nível superior não tinham registo do log4j-core e não conseguiam determinar rapidamente se estavam afetadas. SBOMs transitivos completos responderam à questão numa única execução do scanner.",
        "ro": "Log4Shell era o dependență tranzitivă, adusă de o bibliotecă care era ea însăși o dependență. Echipele cu SBOM-uri limitate la nivel superior nu aveau nicio înregistrare a log4j-core și nu puteau determina rapid dacă erau afectate. SBOM-urile tranzitive complete au răspuns la întrebare printr-o singură execuție a scanerului."
      }
    },
    {
      "id": "1.2.3",
      "question": {
        "en": "What does CRA Annex I, Part II, point (1) require as the minimum scope for SBOM coverage?",
        "de": "Was verlangt CRA Anhang I Teil II Nummer 1 als Mindestumfang für die SBOM-Abdeckung?",
        "nl": "Wat vereist CRA Bijlage I, Deel II, punt (1) als minimale reikwijdte voor SBOM-dekking?",
        "fr": "Que requiert l'annexe I, partie II, point (1) du CRA comme périmètre minimal pour la couverture de la SBOM ?",
        "it": "Cosa richiede l'Allegato I, Parte II, punto (1) del CRA come ambito minimo per la copertura dell'SBOM?",
        "es": "¿Qué requiere el Anexo I, Parte II, punto (1) del CRA como alcance mínimo para la cobertura del SBOM?",
        "pl": "Czego wymaga CRA Załącznik I, Część II, punkt (1) jako minimalny zakres pokrycia SBOM?",
        "cs": "Co vyžaduje CRA Příloha I část II bod (1) jako minimální rozsah pokrytí SBOM?",
        "pt": "O que exige o Anexo I, Parte II, ponto (1) do CRA como âmbito mínimo para a cobertura do SBOM?",
        "ro": "Ce impune Anexa I, partea II, punctul (1) CRA ca sferă minimă de acoperire pentru SBOM?"
      },
      "options": [
        {
          "en": "All components including OS packages and transitive dependencies at every level",
          "de": "Alle Komponenten einschließlich Betriebssystempaketen und transitiven Abhängigkeiten auf jeder Ebene",
          "nl": "Alle componenten inclusief OS-pakketten en transitieve afhankelijkheden op elk niveau",
          "fr": "Tous les composants, y compris les paquets du système d'exploitation et les dépendances transitives à tous les niveaux",
          "it": "Tutti i componenti inclusi i pacchetti del sistema operativo e le dipendenze transitive a ogni livello",
          "es": "Todos los componentes, incluidos los paquetes del sistema operativo y las dependencias transitivas en cada nivel",
          "pl": "Wszystkich komponentów, w tym pakietów systemu operacyjnego i zależności przechodnich na każdym poziomie",
          "cs": "Všechny komponenty včetně balíčků OS a tranzitivních závislostí na všech úrovních",
          "pt": "Todos os componentes, incluindo pacotes do SO e dependências transitivas em todos os níveis",
          "ro": "Toate componentele, inclusiv pachetele de sistem de operare și dependențele tranzitive de la fiecare nivel"
        },
        {
          "en": "Only components with a CVSS severity of High or Critical",
          "de": "Nur Komponenten mit einem CVSS-Schweregrad von Hoch oder Kritisch",
          "nl": "Alleen componenten met een CVSS-ernst van Hoog of Kritiek",
          "fr": "Uniquement les composants avec une gravité CVSS élevée ou critique",
          "it": "Solo i componenti con gravità CVSS Alta o Critica",
          "es": "Solo los componentes con una gravedad CVSS Alta o Crítica",
          "pl": "Tylko komponentów z poziomem istotności CVSS Wysoki lub Krytyczny",
          "cs": "Pouze komponenty s CVSS závažností Vysoká nebo Kritická",
          "pt": "Apenas componentes com severidade CVSS Alta ou Crítica",
          "ro": "Doar componentele cu o severitate CVSS Ridicată sau Critică"
        },
        {
          "en": "At least the top-level dependencies",
          "de": "Mindestens die Abhängigkeiten der obersten Ebene",
          "nl": "Ten minste de top-level dependencies",
          "fr": "Au moins les dépendances de premier niveau",
          "it": "Almeno le dipendenze di primo livello",
          "es": "Al menos las dependencias de primer nivel",
          "pl": "Co najmniej zależności najwyższego poziomu",
          "cs": "Alespoň závislosti nejvyšší úrovně",
          "pt": "Pelo menos as dependências de nível superior",
          "ro": "Cel puțin dependențele de nivel superior"
        },
        {
          "en": "Only components that have had a CVE published in the last 12 months",
          "de": "Nur Komponenten, für die in den letzten 12 Monaten eine CVE veröffentlicht wurde",
          "nl": "Alleen componenten waarvoor de afgelopen 12 maanden een CVE is gepubliceerd",
          "fr": "Uniquement les composants ayant fait l'objet d'un CVE publié au cours des 12 derniers mois",
          "it": "Solo i componenti per i quali è stato pubblicato un CVE negli ultimi 12 mesi",
          "es": "Solo los componentes que han tenido una CVE publicada en los últimos 12 meses",
          "pl": "Tylko komponentów, dla których opublikowano CVE w ciągu ostatnich 12 miesięcy",
          "cs": "Pouze komponenty, pro které bylo CVE zveřejněno v posledních 12 měsících",
          "pt": "Apenas componentes que tenham tido uma CVE publicada nos últimos 12 meses",
          "ro": "Doar componentele pentru care a fost publicat un CVE în ultimele 12 luni"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "Annex I, Part II, point (1) CRA requires the SBOM to cover 'at the very least the top-level dependencies.' This is the legal minimum. Best practice and most SBOM tooling goes further and covers the full transitive tree.",
        "de": "Anhang I Teil II Nummer 1 CRA verlangt, dass die SBOM mindestens die Abhängigkeiten der obersten Ebene abdeckt. Dies ist das gesetzliche Minimum. Best Practice und die meisten SBOM-Tools gehen weiter und decken den vollständigen transitiven Baum ab.",
        "nl": "Bijlage I, Deel II, punt (1) CRA vereist dat de SBOM 'ten minste de top-level dependencies' dekt. Dit is het wettelijke minimum. Best practice en de meeste SBOM-tools gaan verder en dekken de volledige transitieve boom.",
        "fr": "L'annexe I, partie II, point (1) du CRA exige que la SBOM couvre « au minimum les dépendances de premier niveau ». Il s'agit du minimum légal. La bonne pratique et la plupart des outils SBOM vont plus loin et couvrent l'arborescence transitive complète.",
        "it": "L'Allegato I, Parte II, punto (1) del CRA richiede che l'SBOM copra \"almeno le dipendenze di primo livello\". Questo è il minimo legale. La prassi migliore e la maggior parte degli strumenti SBOM vanno oltre e coprono l'intero albero transitivo.",
        "es": "El Anexo I, Parte II, punto (1) del CRA requiere que el SBOM cubra 'al menos las dependencias de primer nivel'. Este es el mínimo legal. La mejor práctica y la mayoría de las herramientas SBOM van más allá y cubren el árbol transitivo completo.",
        "pl": "Załącznik I, Część II, punkt (1) CRA wymaga, aby SBOM obejmował „co najmniej zależności najwyższego poziomu”. Jest to prawne minimum. Dobra praktyka oraz większość narzędzi SBOM idzie dalej i obejmuje pełne drzewo przechodnie.",
        "cs": "Příloha I část II bod (1) CRA vyžaduje, aby SBOM pokrýval „alespoň závislosti nejvyšší úrovně“. Toto je právní minimum. Osvědčený postup a většina nástrojů SBOM zachází dále a pokrývá úplný tranzitivní strom.",
        "pt": "O Anexo I, Parte II, ponto (1) do CRA exige que o SBOM cubra «pelo menos as dependências de nível superior». Este é o mínimo legal. A melhor prática e a maioria das ferramentas de SBOM vão mais longe e cobrem a árvore transitiva completa.",
        "ro": "Anexa I, partea II, punctul (1) CRA impune ca SBOM-ul să acopere „cel puțin dependențele de nivel superior”. Aceasta este cerința legală minimă. Cele mai bune practici și majoritatea instrumentelor SBOM merg mai departe și acoperă arborele tranzitiv complet."
      }
    },
    {
      "id": "1.2.4",
      "question": {
        "en": "Why do most SBOM tools (Syft, cdxgen) produce full transitive output by default?",
        "de": "Warum erzeugen die meisten SBOM-Tools (Syft, cdxgen) standardmäßig vollständige transitive Ausgaben?",
        "nl": "Waarom produceren de meeste SBOM-tools (Syft, cdxgen) standaard volledige transitieve output?",
        "fr": "Pourquoi la plupart des outils SBOM (Syft, cdxgen) produisent-ils par défaut une sortie transitive complète ?",
        "it": "Perché la maggior parte degli strumenti SBOM (Syft, cdxgen) produce per impostazione predefinita un output transitivo completo?",
        "es": "¿Por qué la mayoría de las herramientas SBOM (Syft, cdxgen) producen salida transitiva completa de forma predeterminada?",
        "pl": "Dlaczego większość narzędzi SBOM (Syft, cdxgen) domyślnie generuje pełny wynik przechodni?",
        "cs": "Proč většina nástrojů SBOM (Syft, cdxgen) produkuje ve výchozím nastavení úplný tranzitivní výstup?",
        "pt": "Porque é que a maioria das ferramentas de SBOM (Syft, cdxgen) produz por predefinição saída transitiva completa?",
        "ro": "De ce produc majoritatea instrumentelor SBOM (Syft, cdxgen) ieșire tranzitivă completă în mod implicit?"
      },
      "options": [
        {
          "en": "Because EU regulations require it for all product categories",
          "de": "Weil EU-Verordnungen dies für alle Produktkategorien vorschreiben",
          "nl": "Omdat EU-regelgeving dit voor alle productcategorieën vereist",
          "fr": "Parce que les réglementations européennes l'exigent pour toutes les catégories de produits",
          "it": "Perché le normative UE lo richiedono per tutte le categorie di prodotti",
          "es": "Porque las normativas de la UE lo exigen para todas las categorías de productos",
          "pl": "Ponieważ przepisy UE wymagają tego dla wszystkich kategorii produktów",
          "cs": "Protože to vyžadují předpisy EU pro všechny kategorie produktů",
          "pt": "Porque os regulamentos da UE o exigem para todas as categorias de produtos",
          "ro": "Pentru că reglementările UE o impun pentru toate categoriile de produse"
        },
        {
          "en": "Because full transitive coverage is best practice for vulnerability monitoring, and there is no technical cost argument for stopping at top-level when the tools do not",
          "de": "Weil vollständige transitive Abdeckung Best Practice für die Schwachstellenüberwachung ist und es kein technisches Kostenargument gibt, bei der Ebene der obersten Abhängigkeiten aufzuhören, wenn die Tools dies nicht tun",
          "nl": "Omdat volledige transitieve dekking best practice is voor kwetsbaarheidsmonitoring en er geen technisch kostenargument is om bij top-level te stoppen wanneer de tools dat niet doen",
          "fr": "Parce que la couverture transitive complète constitue la bonne pratique pour la surveillance des vulnérabilités et qu'il n'existe aucun argument technique de coût pour s'arrêter au premier niveau lorsque les outils ne l'imposent pas",
          "it": "Perché la copertura transitiva completa è la prassi migliore per il monitoraggio delle vulnerabilità e non esiste un argomento di costo tecnico per fermarsi al primo livello quando gli strumenti non lo fanno",
          "es": "Porque la cobertura transitiva completa es la mejor práctica para la supervisión de vulnerabilidades y no existe un argumento técnico de coste para detenerse en el primer nivel cuando las herramientas no lo hacen",
          "pl": "Ponieważ pełne pokrycie przechodnie jest najlepszą praktyką monitorowania podatności, a nie ma technicznego uzasadnienia dla zatrzymania się na poziomie najwyższym, gdy narzędzia tego nie wymagają",
          "cs": "Protože úplné tranzitivní pokrytí je osvědčeným postupem pro monitorování zranitelností a neexistuje technický argument pro náklady na zastavení na nejvyšší úrovni, když to nástroje neudělají",
          "pt": "Porque a cobertura transitiva completa é a melhor prática para a monitorização de vulnerabilidades e não existe argumento técnico de custo para parar no nível superior quando as ferramentas o não fazem",
          "ro": "Pentru că acoperirea tranzitivă completă reprezintă cea mai bună practică pentru monitorizarea vulnerabilităților și nu există un argument tehnic de cost pentru a opri la nivel superior atunci când instrumentele nu o fac"
        },
        {
          "en": "Because transitive dependencies change more frequently than top-level ones",
          "de": "Weil transitive Abhängigkeiten sich häufiger ändern als Abhängigkeiten der obersten Ebene",
          "nl": "Omdat transitieve afhankelijkheden vaker wijzigen dan top-level afhankelijkheden",
          "fr": "Parce que les dépendances transitives changent plus fréquemment que celles de premier niveau",
          "it": "Perché le dipendenze transitive cambiano più frequentemente di quelle di primo livello",
          "es": "Porque las dependencias transitivas cambian con más frecuencia que las de primer nivel",
          "pl": "Ponieważ zależności przechodnie zmieniają się częściej niż zależności najwyższego poziomu",
          "cs": "Protože tranzitivní závislosti se mění častěji než ty nejvyšší úrovně",
          "pt": "Porque as dependências transitivas mudam mais frequentemente que as de nível superior",
          "ro": "Pentru că dependențele tranzitive se modifică mai frecvent decât cele de nivel superior"
        },
        {
          "en": "Because VEX statements are only valid for transitive dependencies",
          "de": "Weil VEX-Statements nur für transitive Abhängigkeiten gültig sind",
          "nl": "Omdat VEX-statements alleen geldig zijn voor transitieve afhankelijkheden",
          "fr": "Parce que les déclarations VEX ne sont valables que pour les dépendances transitives",
          "it": "Perché le dichiarazioni VEX sono valide solo per le dipendenze transitive",
          "es": "Porque las declaraciones VEX solo son válidas para las dependencias transitivas",
          "pl": "Ponieważ oświadczenia VEX są ważne tylko dla zależności przechodnich",
          "cs": "Protože prohlášení VEX jsou platná pouze pro tranzitivní závislosti",
          "pt": "Porque as declarações VEX são válidas apenas para dependências transitivas",
          "ro": "Pentru că declarațiile VEX sunt valabile doar pentru dependențele tranzitive"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Tools like Syft read the full dependency tree from package lock files and container image layer metadata. Stopping at top-level would require extra configuration to strip information. Full transitive output is best practice and the default. Do not override it.",
        "de": "Tools wie Syft lesen den vollständigen Abhängigkeitsbaum aus Package-Lock-Dateien und Container-Image-Layer-Metadaten. Ein Stopp auf Ebene der obersten Abhängigkeiten würde eine zusätzliche Konfiguration erfordern, um Informationen zu entfernen. Die vollständige transitive Ausgabe ist Best Practice und Standard. Überschreiben Sie dies nicht.",
        "nl": "Tools zoals Syft lezen de volledige afhankelijkheidsboom uit package lock-bestanden en container image layer metadata. Stoppen bij top-level zou extra configuratie vereisen om informatie te verwijderen. Volledige transitieve output is best practice en de standaard. Overschrijf dit niet.",
        "fr": "Des outils comme Syft lisent l'arborescence complète des dépendances à partir des fichiers de verrouillage des paquets et des métadonnées des couches d'image de conteneur. S'arrêter au premier niveau nécessiterait une configuration supplémentaire pour supprimer des informations. La sortie transitive complète est la bonne pratique et le comportement par défaut. Ne la modifiez pas.",
        "it": "Strumenti come Syft leggono l'intero albero delle dipendenze dai file di lock dei pacchetti e dai metadati dei layer delle immagini container. Fermarsi al primo livello richiederebbe una configurazione aggiuntiva per rimuovere informazioni. L'output transitivo completo è la prassi migliore e l'impostazione predefinita. Non sovrascriverla.",
        "es": "Herramientas como Syft leen el árbol completo de dependencias de los archivos de bloqueo de paquetes y los metadatos de capas de imágenes de contenedor. Detenerse en el primer nivel requeriría configuración adicional para eliminar información. La salida transitiva completa es la mejor práctica y la opción predeterminada. No la anule.",
        "pl": "Narzędzia takie jak Syft odczytują pełne drzewo zależności z plików blokady pakietów oraz metadanych warstw obrazu kontenera. Zatrzymanie się na poziomie najwyższym wymagałoby dodatkowej konfiguracji w celu usunięcia informacji. Pełny wynik przechodni jest najlepszą praktyką i ustawieniem domyślnym. Nie należy go zmieniać.",
        "cs": "Nástroje jako Syft čtou úplný strom závislostí z uzamykacích souborů balíčků a metadat vrstev kontejnerových obrazů. Zastavení na nejvyšší úrovni by vyžadovalo dodatečnou konfiguraci k odstranění informací. Úplný tranzitivní výstup je osvědčeným postupem a výchozím nastavením. Nepřepisujte jej.",
        "pt": "Ferramentas como o Syft leem a árvore completa de dependências a partir de ficheiros de bloqueio de pacotes e metadados de camadas de imagens de contentores. Parar no nível superior exigiria configuração adicional para remover informação. A saída transitiva completa é a melhor prática e a predefinição. Não a substitua.",
        "ro": "Instrumente precum Syft citesc arborele complet de dependențe din fișierele de blocare a pachetelor și din metadatele straturilor de imagine container. Oprirea la nivel superior ar necesita o configurație suplimentară pentru a elimina informații. Ieșirea tranzitivă completă este cea mai bună practică și valoarea implicită. Nu o suprascrieți."
      }
    },
    {
      "id": "1.2.5",
      "question": {
        "en": "What is required to attach a VEX 'not_affected' statement for a CVE in a transitive dependency?",
        "de": "Was ist erforderlich, um eine VEX-not_affected-Erklärung für eine CVE in einer transitiven Abhängigkeit anzuhängen?",
        "nl": "Wat is vereist om een VEX 'not_affected'-statement voor een CVE in een transitieve afhankelijkheid te koppelen?",
        "fr": "Que faut-il pour joindre une déclaration VEX « not_affected » à un CVE dans une dépendance transitive ?",
        "it": "Cosa è necessario per allegare una dichiarazione VEX \"not_affected\" per un CVE in una dipendenza transitiva?",
        "es": "¿Qué se requiere para adjuntar una declaración VEX 'not_affected' para una CVE en una dependencia transitiva?",
        "pl": "Co jest wymagane, aby dołączyć oświadczenie VEX „not_affected” dla CVE w zależności przechodniej?",
        "cs": "Co je vyžadováno k připojení prohlášení VEX 'not_affected' pro CVE v tranzitivní závislosti?",
        "pt": "O que é necessário para anexar uma declaração VEX «not_affected» a uma CVE numa dependência transitiva?",
        "ro": "Ce este necesar pentru a atașa o declarație VEX „not_affected” pentru un CVE într-o dependență tranzitivă?"
      },
      "options": [
        {
          "en": "The CVE must have a CVSS score below 7.0",
          "de": "Die CVE muss einen CVSS-Score unter 7,0 haben",
          "nl": "De CVE moet een CVSS-score onder 7,0 hebben",
          "fr": "Le CVE doit avoir un score CVSS inférieur à 7,0",
          "it": "Il CVE deve avere un punteggio CVSS inferiore a 7.0",
          "es": "La CVE debe tener una puntuación CVSS inferior a 7.0",
          "pl": "CVE musi mieć wynik CVSS poniżej 7.0",
          "cs": "CVE musí mít CVSS skóre nižší než 7,0",
          "pt": "A CVE deve ter uma pontuação CVSS abaixo de 7.0",
          "ro": "CVE-ul trebuie să aibă un scor CVSS sub 7.0"
        },
        {
          "en": "The transitive component must be present in the SBOM",
          "de": "Die transitive Komponente muss in der SBOM vorhanden sein",
          "nl": "De transitieve component moet aanwezig zijn in de SBOM",
          "fr": "Le composant transitif doit figurer dans la SBOM",
          "it": "Il componente transitivo deve essere presente nell'SBOM",
          "es": "El componente transitivo debe estar presente en el SBOM",
          "pl": "Komponent przechodni musi być obecny w SBOM",
          "cs": "Tranzitivní komponenta musí být přítomna v SBOM",
          "pt": "O componente transitivo deve estar presente no SBOM",
          "ro": "Componenta tranzitivă trebuie să fie prezentă în SBOM"
        },
        {
          "en": "The component must be a top-level dependency",
          "de": "Die Komponente muss eine Abhängigkeit der obersten Ebene sein",
          "nl": "De component moet een top-level dependency zijn",
          "fr": "Le composant doit être une dépendance de premier niveau",
          "it": "Il componente deve essere una dipendenza di primo livello",
          "es": "El componente debe ser una dependencia de primer nivel",
          "pl": "Komponent musi być zależnością najwyższego poziomu",
          "cs": "Komponenta musí být závislostí nejvyšší úrovně",
          "pt": "O componente deve ser uma dependência de nível superior",
          "ro": "Componenta trebuie să fie o dependență de nivel superior"
        },
        {
          "en": "The CVE must not yet appear in the NVD",
          "de": "Die CVE darf noch nicht in der NVD erscheinen",
          "nl": "De CVE mag nog niet in de NVD voorkomen",
          "fr": "Le CVE ne doit pas encore apparaître dans la NVD",
          "it": "Il CVE non deve ancora comparire nel NVD",
          "es": "La CVE aún no debe aparecer en la NVD",
          "pl": "CVE nie może jeszcze występować w NVD",
          "cs": "CVE se nesmí dosud objevit v NVD",
          "pt": "A CVE ainda não deve aparecer na NVD",
          "ro": "CVE-ul nu trebuie să apară încă în NVD"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "A VEX statement is attached to a specific component entry in the SBOM. If the transitive component is not listed in the SBOM, there is no entry to attach the VEX statement to. This means you cannot formally document 'not affected' decisions for CVEs in dependencies your SBOM does not cover.",
        "de": "Eine VEX-Erklärung wird an einen bestimmten Komponenteneintrag in der SBOM angehängt. Wenn die transitive Komponente nicht in der SBOM aufgeführt ist, gibt es keinen Eintrag, an den die VEX-Erklärung angehängt werden kann. Dies bedeutet, dass Sie nicht-betroffen-Entscheidungen für CVEs in Abhängigkeiten, die Ihre SBOM nicht abdeckt, nicht formal dokumentieren können.",
        "nl": "Een VEX-statement wordt gekoppeld aan een specifieke componentvermelding in de SBOM. Als de transitieve component niet in de SBOM staat, is er geen vermelding waaraan het VEX-statement kan worden gekoppeld. Dit betekent dat u geen formele 'niet getroffen'-beslissingen kunt documenteren voor CVE's in afhankelijkheden die uw SBOM niet dekt.",
        "fr": "Une déclaration VEX est attachée à une entrée de composant spécifique dans la SBOM. Si le composant transitif n'est pas listé dans la SBOM, il n'existe aucune entrée à laquelle rattacher la déclaration VEX. Cela signifie que vous ne pouvez pas documenter formellement les décisions « non affecté » pour les CVE dans les dépendances que votre SBOM ne couvre pas.",
        "it": "Una dichiarazione VEX è allegata a una voce componente specifica nell'SBOM. Se il componente transitivo non è elencato nell'SBOM, non esiste una voce a cui allegare la dichiarazione VEX. Ciò significa che non è possibile documentare formalmente le decisioni \"not affected\" per i CVE nelle dipendenze che l'SBOM non copre.",
        "es": "Una declaración VEX se adjunta a una entrada de componente específica en el SBOM. Si el componente transitivo no figura en el SBOM, no hay ninguna entrada a la que adjuntar la declaración VEX. Esto significa que no puede documentar formalmente decisiones de 'no afectado' para CVE en dependencias que su SBOM no cubre.",
        "pl": "Oświadczenie VEX jest dołączane do konkretnego wpisu komponentu w SBOM. Jeżeli komponent przechodni nie jest wymieniony w SBOM, nie ma wpisu, do którego można dołączyć oświadczenie VEX. Oznacza to, że nie można formalnie udokumentować decyzji „nie dotyczy” dla CVE w zależnościach, których SBOM nie obejmuje.",
        "cs": "Prohlášení VEX je připojeno k specifickému záznamu komponenty v SBOM. Pokud tranzitivní komponenta není v SBOM uvedena, neexistuje záznam, ke kterému bylo možné prohlášení VEX připojit. To znamená, že nemůžete formálně dokumentovat rozhodnutí 'not affected' pro CVE v závislostech, které váš SBOM nepokrývá.",
        "pt": "Uma declaração VEX é anexada a uma entrada de componente específica no SBOM. Se o componente transitivo não estiver listado no SBOM, não existe entrada à qual anexar a declaração VEX. Isto significa que não pode documentar formalmente decisões de «não afetado» para CVEs em dependências que o seu SBOM não cobre.",
        "ro": "O declarație VEX este atașată unei intrări de componentă specifice din SBOM. Dacă componenta tranzitivă nu este listată în SBOM, nu există nicio intrare la care să atașați declarația VEX. Aceasta înseamnă că nu puteți documenta formal decizii „not affected” pentru CVE-urile din dependențele pe care SBOM-ul dumneavoastră nu le acoperă."
      }
    }
  ]
});

export default quiz;
