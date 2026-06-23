import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "2.2",
  "passingScore": 75,
  "questions": [
    {
      "id": "2.2.1",
      "question": {
        "en": "What is the ISO standard designation for SPDX?",
        "de": "Welche ISO-Standardbezeichnung trägt SPDX?",
        "nl": "Wat is de ISO-standaardaanduiding voor SPDX?",
        "fr": "Quelle est la désignation de la norme ISO pour SPDX ?",
        "it": "Qual è la designazione dello standard ISO per SPDX?",
        "es": "¿Cuál es la designación de la norma ISO para SPDX?",
        "pl": "Jakie jest oznaczenie normy ISO dla SPDX?",
        "cs": "Jaké je označení ISO standardu pro SPDX?",
        "pt": "Qual é a designação da norma ISO para o SPDX?",
        "ro": "Care este denumirea standardului ISO pentru SPDX?"
      },
      "options": [
        {
          "en": "ISO/IEC 27001:2022",
          "de": "ISO/IEC 27001:2022",
          "nl": "ISO/IEC 27001:2022",
          "fr": "ISO/IEC 27001:2022",
          "it": "ISO/IEC 27001:2022",
          "es": "ISO/IEC 27001:2022",
          "pl": "ISO/IEC 27001:2022",
          "cs": "ISO/IEC 27001:2022",
          "pt": "ISO/IEC 27001:2022",
          "ro": "ISO/IEC 27001:2022"
        },
        {
          "en": "ISO/IEC 5962:2021",
          "de": "ISO/IEC 5962:2021",
          "nl": "ISO/IEC 5962:2021",
          "fr": "ISO/IEC 5962:2021",
          "it": "ISO/IEC 5962:2021",
          "es": "ISO/IEC 5962:2021",
          "pl": "ISO/IEC 5962:2021",
          "cs": "ISO/IEC 5962:2021",
          "pt": "ISO/IEC 5962:2021",
          "ro": "ISO/IEC 5962:2021"
        },
        {
          "en": "ISO 22301:2019",
          "de": "ISO 22301:2019",
          "nl": "ISO 22301:2019",
          "fr": "ISO 22301:2019",
          "it": "ISO 22301:2019",
          "es": "ISO 22301:2019",
          "pl": "ISO 22301:2019",
          "cs": "ISO 22301:2019",
          "pt": "ISO 22301:2019",
          "ro": "ISO 22301:2019"
        },
        {
          "en": "ISO/IEC 29147:2018",
          "de": "ISO/IEC 29147:2018",
          "nl": "ISO/IEC 29147:2018",
          "fr": "ISO/IEC 29147:2018",
          "it": "ISO/IEC 29147:2018",
          "es": "ISO/IEC 29147:2018",
          "pl": "ISO/IEC 29147:2018",
          "cs": "ISO/IEC 29147:2018",
          "pt": "ISO/IEC 29147:2018",
          "ro": "ISO/IEC 29147:2018"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "SPDX is ISO/IEC 5962:2021, the international standard for Software Package Data Exchange, published by ISO in 2021. It is the only SBOM format that is also an ISO standard.",
        "de": "SPDX ist ISO/IEC 5962:2021, der internationale Standard für Software Package Data Exchange, veröffentlicht von ISO im Jahr 2021. Es ist das einzige SBOM-Format, das auch ein ISO-Standard ist.",
        "nl": "SPDX is ISO/IEC 5962:2021, de internationale standaard voor Software Package Data Exchange, gepubliceerd door ISO in 2021. Het is het enige SBOM-formaat dat ook een ISO-standaard is.",
        "fr": "SPDX est la norme ISO/IEC 5962:2021, la norme internationale pour l'échange de données sur les packages logiciels, publiée par l'ISO en 2021. C'est le seul format de SBOM qui est également une norme ISO.",
        "it": "SPDX è ISO/IEC 5962:2021, lo standard internazionale per lo scambio di dati sui pacchetti software, pubblicato da ISO nel 2021. È l'unico formato SBOM che è anche uno standard ISO.",
        "es": "SPDX es ISO/IEC 5962:2021, la norma internacional para el Intercambio de Datos de Paquetes de Software, publicada por ISO en 2021. Es el único formato de SBOM que también es una norma ISO.",
        "pl": "SPDX to ISO/IEC 5962:2021, międzynarodowa norma dotycząca wymiany danych o pakietach oprogramowania, opublikowana przez ISO w 2021 r. Jest to jedyny format SBOM, który jest jednocześnie normą ISO.",
        "cs": "SPDX je ISO/IEC 5962:2021, mezinárodní standard pro Software Package Data Exchange, publikovaný ISO v roce 2021. Je to jediný formát SBOM, který je zároveň standardem ISO.",
        "pt": "O SPDX é a ISO/IEC 5962:2021, a norma internacional para a Troca de Dados de Pacotes de Software, publicada pela ISO em 2021. É o único formato de SBOM que também é uma norma ISO.",
        "ro": "SPDX este ISO/IEC 5962:2021, standardul internațional pentru Schimbul de Date ale Pachetelor Software, publicat de ISO în 2021. Este singurul format SBOM care este și un standard ISO."
      }
    },
    {
      "id": "2.2.2",
      "question": {
        "en": "What is SPDX's original design purpose, which distinguishes it from CycloneDX?",
        "de": "Welches war der ursprüngliche Designzweck von SPDX, der es von CycloneDX unterscheidet?",
        "nl": "Wat is het oorspronkelijke ontwerpdoel van SPDX, dat het onderscheidt van CycloneDX?",
        "fr": "Quel est l'objectif de conception initial de SPDX, qui le distingue de CycloneDX ?",
        "it": "Qual è lo scopo progettuale originale di SPDX, che lo distingue da CycloneDX?",
        "es": "¿Cuál es el propósito de diseño original de SPDX, que lo distingue de CycloneDX?",
        "pl": "Jaki był pierwotny cel projektu SPDX, który odróżnia go od CycloneDX?",
        "cs": "Jaký je původní účel návrhu SPDX, který jej odlišuje od CycloneDX?",
        "pt": "Qual é o propósito de design original do SPDX, que o distingue do CycloneDX?",
        "ro": "Care este scopul inițial de proiectare al SPDX, care îl diferențiază de CycloneDX?"
      },
      "options": [
        {
          "en": "Vulnerability tracking and active exploitation monitoring",
          "de": "Verfolgung von Schwachstellen und Überwachung aktiver Ausnutzung",
          "nl": "Volgen van kwetsbaarheden en monitoring van actieve exploitatie",
          "fr": "Suivi des vulnérabilités et surveillance de l'exploitation active",
          "it": "Monitoraggio delle vulnerabilità e monitoraggio dello sfruttamento attivo",
          "es": "Seguimiento de vulnerabilidades y monitorización de explotación activa",
          "pl": "Śledzenie podatności i monitorowanie aktywnego wykorzystywania",
          "cs": "Sledování zranitelností a monitorování aktivního zneužívání",
          "pt": "Monitorização de vulnerabilidades e de exploração ativa",
          "ro": "Urmărirea vulnerabilităților și monitorizarea exploatării active"
        },
        {
          "en": "Open-source license compliance and attribution tracking",
          "de": "Einhaltung von Open-Source-Lizenzen und Nachverfolgung von Attribuierungen",
          "nl": "Naleving van open-sourcelicenties en attributietracking",
          "fr": "Conformité aux licences open source et suivi des attributions",
          "it": "Conformità alle licenze open source e monitoraggio delle attribuzioni",
          "es": "Cumplimiento de licencias de código abierto y seguimiento de atribución",
          "pl": "Zgodność z licencjami open source i śledzenie atrybucji",
          "cs": "Soulad s licencemi open-source a sledování atribucí",
          "pt": "Conformidade com licenças de código aberto e rastreamento de atribuição",
          "ro": "Conformitatea cu licențele open-source și urmărirea atribuirii"
        },
        {
          "en": "Container image scanning and OS package detection",
          "de": "Scannen von Container-Images und Erkennung von Betriebssystempaketen",
          "nl": "Scannen van containerimages en detectie van OS-pakketten",
          "fr": "Analyse des images de conteneurs et détection des packages du système d'exploitation",
          "it": "Scansione delle immagini dei container e rilevamento dei pacchetti del sistema operativo",
          "es": "Escaneo de imágenes de contenedores y detección de paquetes del SO",
          "pl": "Skanowanie obrazów kontenerów i wykrywanie pakietów systemu operacyjnego",
          "cs": "Skenování kontejnerových obrazů a detekce balíčků OS",
          "pt": "Digitalização de imagens de contentores e deteção de pacotes do SO",
          "ro": "Scanarea imaginilor container și detectarea pachetelor OS"
        },
        {
          "en": "Supply chain provenance and code signing",
          "de": "Herkunftsnachweis in der Lieferkette und Codesignierung",
          "nl": "Herkomst van de toeleveringsketen en codeondertekening",
          "fr": "Provenance de la chaîne d'approvisionnement et signature du code",
          "it": "Provenienza della catena di approvvigionamento e firma del codice",
          "es": "Procedencia de la cadena de suministro y firma de código",
          "pl": "Pochodzenie łańcucha dostaw i podpisywanie kodu",
          "cs": "Provenience dodavatelského řetězce a podepisování kódu",
          "pt": "Proveniência da cadeia de fornecimento e assinatura de código",
          "ro": "Proveniența lanțului de aprovizionare și semnarea codului"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "SPDX was created at the Linux Foundation in 2010 to solve the open-source license compliance problem: tracking which licenses apply to which components and what obligations they create. It has grown to cover vulnerability management fields, but its original design is license-focused.",
        "de": "SPDX wurde 2010 von der Linux Foundation geschaffen, um das Problem der Einhaltung von Open-Source-Lizenzen zu lösen: die Nachverfolgung, welche Lizenzen für welche Komponenten gelten und welche Pflichten sie begründen. Es hat sich weiterentwickelt und deckt nun auch Felder des Schwachstellenmanagements ab, doch sein ursprüngliches Design ist auf Lizenzen ausgerichtet.",
        "nl": "SPDX is in 2010 bij de Linux Foundation gecreëerd om het probleem van open-source-licentiecompliance op te lossen: bijhouden welke licenties van toepassing zijn op welke componenten en welke verplichtingen zij creëren. Het is uitgegroeid tot het dekken van velden voor kwetsbaarheidsbeheer, maar het oorspronkelijke ontwerp is gericht op licenties.",
        "fr": "SPDX a été créé à la Linux Foundation en 2010 pour résoudre le problème de conformité aux licences open source : suivre les licences applicables aux composants et les obligations qu'elles créent. Il a évolué pour inclure des champs de gestion des vulnérabilités, mais sa conception initiale est centrée sur les licences.",
        "it": "SPDX è stato creato presso la Linux Foundation nel 2010 per risolvere il problema della conformità alle licenze open source: tracciare quali licenze si applicano a quali componenti e quali obblighi creano. Si è evoluto per coprire campi di gestione delle vulnerabilità, ma il suo design originale è focalizzato sulle licenze.",
        "es": "SPDX se creó en la Linux Foundation en 2010 para resolver el problema del cumplimiento de licencias de código abierto: rastrear qué licencias se aplican a qué componentes y qué obligaciones generan. Ha crecido para cubrir campos de gestión de vulnerabilidades, pero su diseño original está centrado en licencias.",
        "pl": "SPDX powstał w Linux Foundation w 2010 r. w celu rozwiązania problemu zgodności licencji open source: śledzenia, które licencje dotyczą poszczególnych komponentów i jakie obowiązki one tworzą. Format rozszerzono o pola zarządzania podatnościami, ale jego pierwotny projekt koncentruje się na licencjach.",
        "cs": "SPDX byl vytvořen v Linux Foundation v roce 2010 k řešení problému souladu s licencemi open-source: sledování, které licence se vztahují na které komponenty a jaké povinnosti z nich vyplývají. Rozrostl se tak, aby pokrýval oblasti správy zranitelností, ale jeho původní návrh je zaměřen na licence.",
        "pt": "O SPDX foi criado na Linux Foundation em 2010 para resolver o problema de conformidade com licenças de código aberto: rastrear quais licenças se aplicam a quais componentes e que obrigações criam. Expandiu-se para abranger áreas de gestão de vulnerabilidades, mas o seu design original é focado em licenças.",
        "ro": "SPDX a fost creat la Linux Foundation în 2010 pentru a rezolva problema conformității cu licențele open-source: urmărirea licențelor care se aplică componentelor și a obligațiilor pe care le creează. S-a extins pentru a acoperi domenii de gestionare a vulnerabilităților, dar designul său inițial este axat pe licențe."
      }
    },
    {
      "id": "2.2.3",
      "question": {
        "en": "Which platform natively exports SPDX 2.3 JSON without requiring local tooling installation?",
        "de": "Welche Plattform exportiert nativ SPDX 2.3 JSON, ohne dass eine lokale Tool-Installation erforderlich ist?",
        "nl": "Welk platform exporteert native SPDX 2.3 JSON zonder dat lokale tooling-installatie vereist is?",
        "fr": "Quelle plateforme exporte nativement SPDX 2.3 JSON sans nécessiter l'installation d'outils locaux ?",
        "it": "Quale piattaforma esporta nativamente SPDX 2.3 JSON senza richiedere l'installazione di strumenti locali?",
        "es": "¿Qué plataforma exporta de forma nativa SPDX 2.3 JSON sin requerir la instalación de herramientas locales?",
        "pl": "Która platforma natywnie eksportuje SPDX 2.3 JSON bez konieczności instalacji lokalnych narzędzi?",
        "cs": "Která platforma nativně exportuje SPDX 2.3 JSON bez nutnosti instalace lokálního nástroje?",
        "pt": "Qual plataforma exporta nativamente SPDX 2.3 JSON sem exigir a instalação de ferramentas locais?",
        "ro": "Care platformă exportă nativ SPDX 2.3 JSON fără a necesita instalarea de instrumente locale?"
      },
      "options": [
        {
          "en": "Docker Hub",
          "de": "Docker Hub",
          "nl": "Docker Hub",
          "fr": "Docker Hub",
          "it": "Docker Hub",
          "es": "Docker Hub",
          "pl": "Docker Hub",
          "cs": "Docker Hub",
          "pt": "Docker Hub",
          "ro": "Docker Hub"
        },
        {
          "en": "OWASP Dependency-Track",
          "de": "OWASP Dependency-Track",
          "nl": "OWASP Dependency-Track",
          "fr": "OWASP Dependency-Track",
          "it": "OWASP Dependency-Track",
          "es": "OWASP Dependency-Track",
          "pl": "OWASP Dependency-Track",
          "cs": "OWASP Dependency-Track",
          "pt": "OWASP Dependency-Track",
          "ro": "OWASP Dependency-Track"
        },
        {
          "en": "GitHub's dependency graph",
          "de": "GitHubs Abhängigkeitsgraph",
          "nl": "GitHub's dependency graph",
          "fr": "GitHub's dependency graph",
          "it": "Grafico delle dipendenze di GitHub",
          "es": "Gráfico de dependencias de GitHub",
          "pl": "Graf zależności GitHub",
          "cs": "GitHub's dependency graph",
          "pt": "Gráfico de dependências do GitHub",
          "ro": "Graficul de dependențe GitHub"
        },
        {
          "en": "The NVD (National Vulnerability Database)",
          "de": "Die NVD (National Vulnerability Database)",
          "nl": "The NVD (National Vulnerability Database)",
          "fr": "The NVD (National Vulnerability Database)",
          "it": "The NVD (National Vulnerability Database)",
          "es": "La NVD (Base de Datos Nacional de Vulnerabilidades)",
          "pl": "NVD (National Vulnerability Database)",
          "cs": "The NVD (National Vulnerability Database)",
          "pt": "A NVD (National Vulnerability Database)",
          "ro": "NVD (National Vulnerability Database)"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "GitHub's dependency graph exports SPDX 2.3 JSON from the repository API endpoint. This provides an SBOM without running any local tools, making it the fastest way to get started for teams with code on GitHub.",
        "de": "GitHubs Abhängigkeitsgraph exportiert SPDX 2.3 JSON über den Repository-API-Endpunkt. Dies liefert eine SBOM, ohne lokale Tools ausführen zu müssen, und ist damit der schnellste Einstieg für Teams mit Code auf GitHub.",
        "nl": "GitHub's dependency graph exporteert SPDX 2.3 JSON via het repository-API-eindpunt. Dit levert een SBOM zonder dat lokale tools hoeven te worden uitgevoerd, waardoor het de snelste manier is om te beginnen voor teams met code op GitHub.",
        "fr": "GitHub's dependency graph exporte SPDX 2.3 JSON depuis le point de terminaison API du référentiel. Cela fournit un SBOM sans exécuter d'outils locaux, ce qui constitue le moyen le plus rapide pour démarrer pour les équipes dont le code est sur GitHub.",
        "it": "Il grafico delle dipendenze di GitHub esporta SPDX 2.3 JSON dall'endpoint API del repository. Questo fornisce un SBOM senza eseguire strumenti locali, rendendolo il modo più rapido per iniziare per i team con codice su GitHub.",
        "es": "El gráfico de dependencias de GitHub exporta SPDX 2.3 JSON desde el punto final de la API del repositorio. Esto proporciona un SBOM sin ejecutar ninguna herramienta local, lo que lo convierte en la forma más rápida de empezar para los equipos con código en GitHub.",
        "pl": "Graf zależności GitHub eksportuje SPDX 2.3 JSON z punktu końcowego API repozytorium. Zapewnia to SBOM bez uruchamiania żadnych lokalnych narzędzi, co stanowi najszybszy sposób rozpoczęcia pracy dla zespołów posiadających kod na GitHub.",
        "cs": "GitHub's dependency graph exportuje SPDX 2.3 JSON z koncového bodu API úložiště. Tím poskytuje SBOM bez spouštění lokálních nástrojů, což je nejrychlejší způsob, jak začít pro týmy s kódem na GitHubu.",
        "pt": "O gráfico de dependências do GitHub exporta SPDX 2.3 JSON a partir do endpoint da API do repositório. Isto fornece um SBOM sem executar quaisquer ferramentas locais, tornando-o a forma mais rápida de começar para equipas com código no GitHub.",
        "ro": "Graficul de dependențe GitHub exportă SPDX 2.3 JSON din punctul final API al depozitului. Aceasta furnizează un SBOM fără a rula instrumente locale, fiind cea mai rapidă modalitate de a începe pentru echipele cu cod pe GitHub."
      }
    },
    {
      "id": "2.2.4",
      "question": {
        "en": "Both CycloneDX and SPDX satisfy the CRA Annex I, Part II, point (1) format requirement. What is the basis for this?",
        "de": "Sowohl CycloneDX als auch SPDX erfüllen die Formatvorgabe nach CRA Anhang I Teil II Nummer 1. Worauf beruht das?",
        "nl": "Zowel CycloneDX als SPDX voldoen aan de eis van Bijlage I, deel II, punt (1) CRA voor het formaat. Wat is de basis hiervoor?",
        "fr": "CycloneDX et SPDX satisfont tous deux à l'exigence de format de l'Annexe I, partie II, point (1) du CRA. Sur quelle base ?",
        "it": "Entrambi CycloneDX e SPDX soddisfano il requisito di formato del CRA Allegato I, Parte II, punto (1). Qual è la base per questo?",
        "es": "Tanto CycloneDX como SPDX cumplen el requisito de formato del Anexo I, Parte II, punto (1) del CRA. ¿Cuál es la base para ello?",
        "pl": "Zarówno CycloneDX, jak i SPDX spełniają wymaganie formatu określone w CRA Załącznik I część II punkt (1). Jaka jest podstawa tego faktu?",
        "cs": "Oba CycloneDX a SPDX splňují požadavek na formát CRA Příloha I Část II bod (1). Na čem je toto založeno?",
        "pt": "Tanto o CycloneDX como o SPDX satisfazem o requisito de formato do Anexo I, Parte II, ponto (1) do CRA. Qual é a base para isto?",
        "ro": "Atât CycloneDX, cât și SPDX îndeplinesc cerința de format din Anexa I, Partea II, punctul (1) CRA. Care este baza pentru aceasta?"
      },
      "options": [
        {
          "en": "Both are mandated by ENISA's SBOM technical guidelines",
          "de": "Beide werden durch die technischen Leitlinien von ENISA für SBOMs vorgeschrieben",
          "nl": "Beide worden voorgeschreven door de technische richtlijnen van ENISA voor SBOM.",
          "fr": "Les deux sont imposés par les lignes directrices techniques SBOM d'ENISA",
          "it": "Entrambi sono previsti dalle linee guida tecniche SBOM di ENISA",
          "es": "Ambos son exigidos por las directrices técnicas de SBOM de ENISA",
          "pl": "Oba są wymagane przez wytyczne techniczne SBOM ENISA",
          "cs": "Oba jsou vyžadovány technickými pokyny ENISA pro SBOM",
          "pt": "Ambos são exigidos pelas orientações técnicas de SBOM da ENISA",
          "ro": "Ambele sunt obligatorii conform ghidurilor tehnice SBOM ale ENISA"
        },
        {
          "en": "Both are 'commonly used and machine-readable' formats, the exact words of Annex I, Part II, point (1)",
          "de": "Beide sind Formate, die 'weit verbreitet und maschinenlesbar' sind, genau die Formulierung von Anhang I Teil II Nummer 1",
          "nl": "Both are 'commonly used and machine-readable' formats, the exact words of Bijlage I, deel II, punt (1)",
          "fr": "Les deux sont des formats 'couramment utilisés et lisibles par machine', les termes exacts de l'Annexe I, partie II, point (1)",
          "it": "Entrambi sono formati 'comunemente usati e leggibili da macchina', le esatte parole dell'Allegato I, Parte II, punto (1)",
          "es": "Ambos son formatos 'comúnmente utilizados y legibles por máquina', las palabras exactas del Anexo I, Parte II, punto (1)",
          "pl": "Oba są formatami powszechnie używanymi i czytelnymi maszynowo, zgodnie z dokładnym brzmieniem Załącznik I część II punkt (1)",
          "cs": "Oba jsou formáty 'běžně používané a strojově čitelné', přesná slova Přílohy I Část II bod (1)",
          "pt": "Ambos são formatos 'comumente utilizados e legíveis por máquina', as palavras exatas do Anexo I, Parte II, ponto (1)",
          "ro": "Ambele sunt formate „comun utilizate și lizibile automat”, cuvintele exacte din Anexa I, Partea II, punctul (1)"
        },
        {
          "en": "Both have been reviewed and certified by a notified conformity assessment body",
          "de": "Beide wurden von einer notifizierten Konformitätsbewertungsstelle geprüft und zertifiziert",
          "nl": "Beide zijn beoordeeld en gecertificeerd door een aangemelde conformiteitsbeoordelingsinstantie.",
          "fr": "Les deux ont été examinés et certifiés par un organisme notifié d'évaluation de la conformité",
          "it": "Entrambi sono stati esaminati e certificati da un organismo notificato di valutazione della conformità",
          "es": "Ambos han sido revisados y certificados por un organismo de evaluación de la conformidad notificado",
          "pl": "Oba zostały zweryfikowane i certyfikowane przez jednostkę oceny zgodności",
          "cs": "Oba byly přezkoumány a certifikovány notifikovaným orgánem posuzování shody",
          "pt": "Ambos foram revistos e certificados por um organismo notificado de avaliação da conformidade",
          "ro": "Ambele au fost revizuite și certificate de un organism de evaluare a conformității notificat"
        },
        {
          "en": "Both are referenced by name in CRA Recital 41",
          "de": "Beide werden namentlich in CRA Erwägungsgrund 41 genannt",
          "nl": "Beide worden bij naam genoemd in CRA overweging 41",
          "fr": "Les deux sont mentionnés nommément au considérant 41 du CRA",
          "it": "Entrambi sono citati per nome nel Considerando 41 del CRA",
          "es": "Ambos se mencionan por nombre en el Considerando 41 del CRA",
          "pl": "Oba są wymienione z nazwy w CRA Motyw 41",
          "cs": "Oba jsou uvedeny jménem v recitálu 41 CRA",
          "pt": "Ambos são referenciados pelo nome no Considerando 41 do CRA",
          "ro": "Ambele sunt menționate nominal în Considerentul 41 CRA"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Annex I, Part II, point (1) CRA requires the SBOM to be in a 'commonly used and machine-readable format.' Neither CycloneDX nor SPDX is named in the regulation. Both satisfy the requirement because both are widely used across hundreds of organisations and both are machine-parseable.",
        "de": "Anhang I Teil II Nummer 1 CRA verlangt, dass die SBOM in einem 'weit verbreiteten und maschinenlesbaren Format' vorliegt. Weder CycloneDX noch SPDX werden in der Verordnung namentlich genannt. Beide erfüllen die Anforderung, weil beide in Hunderten von Organisationen weit verbreitet sind und beide maschinenlesbar sind.",
        "nl": "Bijlage I, deel II, punt (1) CRA vereist dat de SBOM in een 'commonly used and machine-readable format' is. Noch CycloneDX noch SPDX wordt in de verordening met naam genoemd. Beide voldoen aan de eis omdat beide in honderden organisaties wijd worden gebruikt en beide machine-parseerbaar zijn.",
        "fr": "L'Annexe I, partie II, point (1) du CRA exige que le SBOM soit dans un format 'couramment utilisé et lisible par machine'. Ni CycloneDX ni SPDX n'est nommé dans le règlement. Les deux satisfont à l'exigence car les deux sont largement utilisés dans des centaines d'organisations et sont tous deux analysables par machine.",
        "it": "L'Allegato I, Parte II, punto (1) CRA richiede che l'SBOM sia in un formato 'comunemente usato e leggibile da macchina'. Né CycloneDX né SPDX sono nominati nel regolamento. Entrambi soddisfano il requisito perché entrambi sono ampiamente utilizzati in centinaia di organizzazioni e entrambi sono analizzabili automaticamente.",
        "es": "El Anexo I, Parte II, punto (1) del CRA exige que el SBOM esté en un formato 'comúnmente utilizado y legible por máquina'. Ni CycloneDX ni SPDX se nombran en el reglamento. Ambos cumplen el requisito porque ambos se utilizan ampliamente en cientos de organizaciones y ambos son analizables por máquina.",
        "pl": "Załącznik I część II punkt (1) CRA wymaga, aby SBOM był w formacie powszechnie używanym i czytelnym maszynowo. Ani CycloneDX, ani SPDX nie są wymienione w rozporządzeniu. Oba spełniają wymaganie, ponieważ oba są szeroko stosowane w setkach organizacji i oba są możliwe do odczytania maszynowego.",
        "cs": "Příloha I Část II bod (1) CRA vyžaduje, aby SBOM byl ve 'běžně používaném a strojově čitelném formátu'. Ani CycloneDX ani SPDX není v nařízení jmenován. Oba požadavek splňují, protože oba jsou široce používány stovkami organizací a oba jsou strojově zpracovatelné.",
        "pt": "O Anexo I, Parte II, ponto (1) do CRA exige que o SBOM esteja num formato 'comumente utilizado e legível por máquina'. Nem o CycloneDX nem o SPDX são nomeados no regulamento. Ambos satisfazem o requisito porque ambos são amplamente utilizados em centenas de organizações e ambos são analisáveis por máquina.",
        "ro": "Anexa I, Partea II, punctul (1) CRA impune ca SBOM să fie într-un format „comun utilizat și lizibil automat”. Nici CycloneDX, nici SPDX nu sunt numite în regulament. Ambele îndeplinesc cerința deoarece sunt utilizate pe scară largă în sute de organizații și sunt analizabile automat."
      }
    },
    {
      "id": "2.2.5",
      "question": {
        "en": "If your primary driver is CRA Article 14 vulnerability reporting compliance, which format is the more natural fit and why?",
        "de": "Wenn Ihr Hauptanliegen die Einhaltung der Schwachstellenmeldung nach CRA Artikel 14 ist, welches Format passt dann natürlicher und warum?",
        "nl": "Als uw primaire drijfveer CRA Artikel 14-naleving voor kwetsbaarheidsrapportage is, welk formaat past dan beter en waarom?",
        "fr": "Si votre principal objectif est la conformité au reporting des vulnérabilités de l'Article 14 du CRA, quel format convient le mieux et pourquoi ?",
        "it": "Se il tuo driver principale è la conformità alla segnalazione delle vulnerabilità ai sensi dell'Articolo 14 CRA, quale formato è più naturale e perché?",
        "es": "Si su principal impulsor es el cumplimiento de la notificación de vulnerabilidades del Artículo 14 del CRA, ¿qué formato es el más natural y por qué?",
        "pl": "Jeśli głównym celem jest zgodność z CRA Artykuł 14 w zakresie raportowania podatności, który format jest bardziej naturalnym wyborem i dlaczego?",
        "cs": "Pokud je vaším primárním cílem soulad s hlášením zranitelností podle CRA Článek 14, který formát je přirozenější volbou a proč?",
        "pt": "Se o seu principal impulsionador é a conformidade com a comunicação de vulnerabilidades do Artigo 14 do CRA, qual formato é o mais natural e porquê?",
        "ro": "Dacă principalul obiectiv este conformitatea cu raportarea vulnerabilităților din Articolul 14 CRA, care format se potrivește mai natural și de ce?"
      },
      "options": [
        {
          "en": "SPDX, because it is an ISO standard and ISO standards are preferred by market surveillance authorities",
          "de": "SPDX, weil es ein ISO-Standard ist und ISO-Standards von den Marktüberwachungsbehörden bevorzugt werden",
          "nl": "SPDX, omdat het een ISO-norm is en ISO-normen de voorkeur hebben van markttoezichtautoriteiten",
          "fr": "SPDX, car il s'agit d'une norme ISO et les normes ISO sont préférées par les autorités de surveillance du marché",
          "it": "SPDX, perché è uno standard ISO e gli standard ISO sono preferiti dalle autorità di vigilanza del mercato",
          "es": "SPDX, porque es una norma ISO y las normas ISO son preferidas por las autoridades de vigilancia del mercado",
          "pl": "SPDX, ponieważ jest normą ISO, a normy ISO są preferowane przez organy nadzoru rynku",
          "cs": "SPDX, protože je to ISO standard a ISO standardy jsou upřednostňovány orgány dohledu trhu",
          "pt": "SPDX, porque é uma norma ISO e as normas ISO são preferidas pelas autoridades de vigilância do mercado",
          "ro": "SPDX, deoarece este un standard ISO, iar standardele ISO sunt preferate de autoritățile de supraveghere a pieței"
        },
        {
          "en": "CycloneDX, because it was designed for vulnerability management, has native VEX support, and has more mature tooling (Grype, Dependency-Track) for the Article 14 monitoring loop",
          "de": "CycloneDX, weil es für das Schwachstellenmanagement konzipiert wurde, native VEX-Unterstützung bietet und über ausgereiftere Werkzeuge (Grype, Dependency-Track) für die Überwachungsschleife nach Artikel 14 verfügt",
          "nl": "CycloneDX, omdat het is ontworpen voor kwetsbaarheidsbeheer, heeft native VEX-ondersteuning en beschikt over volwassener tooling (Grype, Dependency-Track) voor de monitoringlus van Artikel 14.",
          "fr": "CycloneDX, car il a été conçu pour la gestion des vulnérabilités, dispose d'un support natif de VEX et possède des outils plus matures (Grype, Dependency-Track) pour la boucle de surveillance de l'Article 14",
          "it": "CycloneDX, perché è stato progettato per la gestione delle vulnerabilità, ha supporto nativo VEX e dispone di strumenti più maturi (Grype, Dependency-Track) per il ciclo di monitoraggio dell'Articolo 14",
          "es": "CycloneDX, porque fue diseñado para la gestión de vulnerabilidades, tiene soporte nativo de VEX y cuenta con herramientas más maduras (Grype, Dependency-Track) para el bucle de monitorización del Artículo 14",
          "pl": "CycloneDX, ponieważ został zaprojektowany do zarządzania podatnościami, posiada natywne wsparcie VEX i ma bardziej dojrzałe narzędzia (Grype, Dependency-Track) do pętli monitorowania Artykuł 14",
          "cs": "CycloneDX, protože byl navržen pro správu zranitelností, má nativní podporu VEX a má vyspělejší nástroje (Grype, Dependency-Track) pro monitorovací smyčku podle Článku 14",
          "pt": "CycloneDX, porque foi concebido para a gestão de vulnerabilidades, tem suporte nativo a VEX e tem ferramentas mais maduras (Grype, Dependency-Track) para o ciclo de monitorização do Artigo 14",
          "ro": "CycloneDX, deoarece a fost conceput pentru gestionarea vulnerabilităților, are suport nativ VEX și dispune de instrumente mai mature (Grype, Dependency-Track) pentru bucla de monitorizare din Articolul 14"
        },
        {
          "en": "Neither: you must produce both formats to satisfy Article 14",
          "de": "Keines: Sie müssen beide Formate erstellen, um Artikel 14 zu erfüllen",
          "nl": "Geen van beide: u moet beide formaten produceren om te voldoen aan Artikel 14",
          "fr": "Ni l'un ni l'autre : vous devez produire les deux formats pour satisfaire l'Article 14",
          "it": "Nessuno dei due: è necessario produrre entrambi i formati per soddisfare l'Articolo 14",
          "es": "Ninguno: debe producir ambos formatos para cumplir con el Artículo 14",
          "pl": "Żaden: należy wytwarzać oba formaty, aby spełnić Artykuł 14",
          "cs": "Ani jeden: musíte vytvářet oba formáty, abyste splnili Článek 14",
          "pt": "Nenhum: deve produzir ambos os formatos para satisfazer o Artigo 14",
          "ro": "Niciunul: trebuie să produceți ambele formate pentru a satisface Articolul 14"
        },
        {
          "en": "SPDX, because its multi-format output (JSON, YAML, RDF) is required for ENISA's reporting platform",
          "de": "SPDX, weil seine Multi-Format-Ausgabe (JSON, YAML, RDF) für die Meldeplattform von ENISA erforderlich ist",
          "nl": "SPDX, omdat de multi-format uitvoer (JSON, YAML, RDF) vereist is voor het rapportageplatform van ENISA.",
          "fr": "SPDX, car sa sortie multi-formats (JSON, YAML, RDF) est requise pour la plateforme de reporting d'ENISA",
          "it": "SPDX, perché il suo output multi-formato (JSON, YAML, RDF) è richiesto per la piattaforma di segnalazione di ENISA",
          "es": "SPDX, porque su salida en múltiples formatos (JSON, YAML, RDF) es necesaria para la plataforma de informes de ENISA",
          "pl": "SPDX, ponieważ jego wieloformatowe wyjście (JSON, YAML, RDF) jest wymagane dla platformy raportowania ENISA",
          "cs": "SPDX, protože jeho víceformátový výstup (JSON, YAML, RDF) je vyžadován pro ohlašovací platformu ENISA",
          "pt": "SPDX, porque o seu output multi-formato (JSON, YAML, RDF) é exigido para a plataforma de relatórios da ENISA",
          "ro": "SPDX, deoarece ieșirea sa multi-format (JSON, YAML, RDF) este necesară pentru platforma de raportare a ENISA"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "CycloneDX was designed for security operations from the start. Its native VEX support lets you formally document 'not affected' decisions. Grype natively consumes CycloneDX and outputs CycloneDX vulnerability results. Dependency-Track is built around CycloneDX. For Article 14 compliance, this toolchain is more mature than the SPDX equivalent.",
        "de": "CycloneDX wurde von Anfang an für Sicherheitsoperationen entwickelt. Seine native VEX-Unterstützung ermöglicht die formale Dokumentation von 'nicht betroffen'-Entscheidungen. Grype verarbeitet CycloneDX nativ und gibt CycloneDX-Schwachstellenergebnisse aus. Dependency-Track basiert auf CycloneDX. Für die Einhaltung von Artikel 14 ist diese Toolchain ausgereifter als das SPDX-Pendant.",
        "nl": "CycloneDX is vanaf het begin ontworpen voor beveiligingsoperaties. De native VEX-ondersteuning laat u formele 'not affected'-beslissingen documenteren. Grype verwerkt CycloneDX native en produceert CycloneDX-kwetsbaarheidsresultaten. Dependency-Track is gebouwd rond CycloneDX. Voor Artikel 14-naleving is deze toolchain volwassener dan het SPDX-equivalent.",
        "fr": "CycloneDX a été conçu dès le départ pour les opérations de sécurité. Son support natif de VEX permet de documenter formellement les décisions 'non affecté'. Grype consomme nativement CycloneDX et produit des résultats de vulnérabilité CycloneDX. Dependency-Track est construit autour de CycloneDX. Pour la conformité à l'Article 14, cette chaîne d'outils est plus mature que l'équivalent SPDX.",
        "it": "CycloneDX è stato progettato fin dall'inizio per le operazioni di sicurezza. Il suo supporto nativo VEX consente di documentare formalmente le decisioni 'non interessato'. Grype consuma nativamente CycloneDX e produce risultati di vulnerabilità in CycloneDX. Dependency-Track è costruito attorno a CycloneDX. Per la conformità all'Articolo 14, questa toolchain è più matura dell'equivalente SPDX.",
        "es": "CycloneDX se diseñó para operaciones de seguridad desde el principio. Su soporte nativo de VEX le permite documentar formalmente las decisiones 'no afectado'. Grype consume de forma nativa CycloneDX y genera resultados de vulnerabilidades de CycloneDX. Dependency-Track está construido en torno a CycloneDX. Para el cumplimiento del Artículo 14, esta cadena de herramientas es más madura que la equivalente de SPDX.",
        "pl": "CycloneDX został zaprojektowany z myślą o operacjach bezpieczeństwa od samego początku. Natywne wsparcie VEX pozwala formalnie dokumentować decyzje nie dotyczy. Grype natywnie konsumuje CycloneDX i zwraca wyniki podatności w formacie CycloneDX. Dependency-Track jest zbudowany wokół CycloneDX. W kontekście zgodności z Artykuł 14 ten łańcuch narzędzi jest bardziej dojrzały niż odpowiednik SPDX.",
        "cs": "CycloneDX byl od počátku navržen pro bezpečnostní operace. Jeho nativní podpora VEX umožňuje formálně dokumentovat rozhodnutí 'neovlivněno'. Grype nativně přijímá CycloneDX a vydává výsledky zranitelností v CycloneDX. Dependency-Track je postaven kolem CycloneDX. Pro soulad s Článkem 14 je tento toolchain vyspělejší než ekvivalent SPDX.",
        "pt": "O CycloneDX foi concebido para operações de segurança desde o início. O seu suporte nativo a VEX permite documentar formalmente decisões de 'não afetado'. O Grype consome nativamente CycloneDX e produz resultados de vulnerabilidades em CycloneDX. O Dependency-Track é construído em torno do CycloneDX. Para a conformidade com o Artigo 14, esta cadeia de ferramentas é mais madura do que o equivalente do SPDX.",
        "ro": "CycloneDX a fost conceput de la început pentru operațiuni de securitate. Suportul său nativ VEX permite documentarea formală a deciziilor „neafectat”. Grype consumă nativ CycloneDX și produce rezultate de vulnerabilități în CycloneDX. Dependency-Track este construit în jurul CycloneDX. Pentru conformitatea cu Articolul 14, acest lanț de instrumente este mai matur decât echivalentul SPDX."
      }
    }
  ]
});

export default quiz;
