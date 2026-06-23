import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "2.1",
  "passingScore": 75,
  "questions": [
    {
      "id": "2.1.1",
      "question": {
        "en": "Which organisation maintains the CycloneDX standard?",
        "de": "Welche Organisation pflegt den CycloneDX-Standard?",
        "nl": "Welke organisatie onderhoudt de CycloneDX-standaard?",
        "fr": "Quelle organisation maintient le standard CycloneDX ?",
        "it": "Quale organizzazione mantiene lo standard CycloneDX?",
        "es": "¿Qué organización mantiene el estándar CycloneDX?",
        "pl": "Która organizacja utrzymuje standard CycloneDX?",
        "cs": "Která organizace udržuje standard CycloneDX?",
        "pt": "Qual organização mantém o padrão CycloneDX?",
        "ro": "Ce organizație menține standardul CycloneDX?"
      },
      "options": [
        {
          "en": "ISO",
          "de": "ISO",
          "nl": "ISO",
          "fr": "ISO",
          "it": "ISO",
          "es": "ISO",
          "pl": "ISO",
          "cs": "ISO",
          "pt": "ISO",
          "ro": "ISO"
        },
        {
          "en": "Linux Foundation",
          "de": "Linux Foundation",
          "nl": "Linux Foundation",
          "fr": "Linux Foundation",
          "it": "Linux Foundation",
          "es": "Linux Foundation",
          "pl": "Linux Foundation",
          "cs": "Linux Foundation",
          "pt": "Linux Foundation",
          "ro": "Linux Foundation"
        },
        {
          "en": "OWASP",
          "de": "OWASP",
          "nl": "OWASP",
          "fr": "OWASP",
          "it": "OWASP",
          "es": "OWASP",
          "pl": "OWASP",
          "cs": "OWASP",
          "pt": "OWASP",
          "ro": "OWASP"
        },
        {
          "en": "NIST",
          "de": "NIST",
          "nl": "NIST",
          "fr": "NIST",
          "it": "NIST",
          "es": "NIST",
          "pl": "NIST",
          "cs": "NIST",
          "pt": "NIST",
          "ro": "NIST"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "CycloneDX is an OWASP project, the Open Web Application Security Project. SPDX is the Linux Foundation project. ISO/IEC 5962:2021 is the ISO standard for SBOM, which covers SPDX.",
        "de": "CycloneDX ist ein OWASP Projekt, das Open Web Application Security Project. SPDX ist das Projekt der Linux Foundation. ISO/IEC 5962:2021 ist der ISO-Standard für SBOM, der SPDX umfasst.",
        "nl": "CycloneDX is een OWASP-project, het Open Web Application Security Project. SPDX is het project van de Linux Foundation. ISO/IEC 5962:2021 is de ISO-norm voor SBOM, die SPDX omvat.",
        "fr": "CycloneDX est un projet OWASP, l'Open Web Application Security Project. SPDX est le projet de la Linux Foundation. ISO/IEC 5962:2021 est la norme ISO pour les SBOM, qui couvre SPDX.",
        "it": "CycloneDX è un progetto OWASP, l'Open Web Application Security Project. SPDX è il progetto della Linux Foundation. ISO/IEC 5962:2021 è lo standard ISO per SBOM, che copre SPDX.",
        "es": "CycloneDX es un proyecto de OWASP, el Open Web Application Security Project. SPDX es el proyecto de Linux Foundation. ISO/IEC 5962:2021 es el estándar ISO para SBOM, que cubre SPDX.",
        "pl": "CycloneDX jest projektem OWASP, Open Web Application Security Project. SPDX jest projektem Linux Foundation. ISO/IEC 5962:2021 jest standardem ISO dla SBOM, który obejmuje SPDX.",
        "cs": "CycloneDX je projekt OWASP, Open Web Application Security Project. SPDX je projekt Linux Foundation. ISO/IEC 5962:2021 je norma ISO pro SBOM, která zahrnuje SPDX.",
        "pt": "CycloneDX é um projeto OWASP, o Open Web Application Security Project. SPDX é o projeto da Linux Foundation. A ISO/IEC 5962:2021 é o padrão ISO para SBOM, que abrange o SPDX.",
        "ro": "CycloneDX este un proiect OWASP, Open Web Application Security Project. SPDX este proiectul Linux Foundation. ISO/IEC 5962:2021 este standardul ISO pentru SBOM, care include SPDX."
      }
    },
    {
      "id": "2.1.2",
      "question": {
        "en": "What does a VEX 'not_affected' statement with a 'code_not_reachable' justification document?",
        "de": "Was dokumentiert eine VEX 'not_affected'-Aussage mit der Begründung 'code_not_reachable'?",
        "nl": "Wat documenteert een VEX 'not_affected'-verklaring met de rechtvaardiging 'code_not_reachable'?",
        "fr": "Que documente une déclaration VEX 'not_affected' avec une justification 'code_not_reachable' ?",
        "it": "Cosa documenta un'asserzione VEX 'not_affected' con giustificazione 'code_not_reachable'?",
        "es": "¿Qué documenta una declaración VEX 'not_affected' con la justificación 'code_not_reachable'?",
        "pl": "Co dokumentuje oświadczenie VEX 'not_affected' z uzasadnieniem 'code_not_reachable'?",
        "cs": "Co dokládá prohlášení VEX 'not_affected' s odůvodněním 'code_not_reachable'?",
        "pt": "O que documenta uma declaração VEX 'not_affected' com a justificação 'code_not_reachable'?",
        "ro": "Ce documentează o declarație VEX 'not_affected' cu justificarea 'code_not_reachable'?"
      },
      "options": [
        {
          "en": "That the CVE has been patched in the next planned release",
          "de": "Dass die CVE in der nächsten geplanten Version behoben wurde",
          "nl": "Dat de CVE is verholpen in de volgende geplande release",
          "fr": "Que la CVE a été corrigée dans la prochaine version prévue",
          "it": "Che la CVE è stata corretta nella prossima release pianificata",
          "es": "Que la CVE ha sido parcheada en la próxima versión planificada",
          "pl": "Że luka CVE została załatana w następnym planowanym wydaniu",
          "cs": "Že zranitelnost CVE byla opravena v příštím plánovaném vydání",
          "pt": "Que a CVE foi corrigida na próxima versão planeada",
          "ro": "Că CVE a fost corectat în următoarea versiune planificată"
        },
        {
          "en": "That the vulnerable code exists in the component but cannot be reached in this product's execution context",
          "de": "Dass der verwundbare Code in der Komponente existiert, aber im Ausführungskontext dieses Produkts nicht erreicht werden kann",
          "nl": "Dat de kwetsbare code in het component aanwezig is maar niet kan worden bereikt in de uitvoeringscontext van dit product",
          "fr": "Que le code vulnérable existe dans le composant mais ne peut pas être atteint dans le contexte d'exécution de ce produit",
          "it": "Che il codice vulnerabile esiste nel componente ma non può essere raggiunto nel contesto di esecuzione di questo prodotto",
          "es": "Que el código vulnerable existe en el componente pero no puede alcanzarse en el contexto de ejecución de este producto",
          "pl": "Że podatny kod istnieje w komponencie, ale nie jest osiągalny w kontekście wykonania tego produktu",
          "cs": "Že zranitelný kód v komponentě existuje, ale v kontextu spuštění tohoto produktu není dosažitelný",
          "pt": "Que o código vulnerável existe no componente mas não pode ser alcançado no contexto de execução deste produto",
          "ro": "Că codul vulnerabil există în componentă, dar nu poate fi atins în contextul de execuție al acestui produs"
        },
        {
          "en": "That the component version is not affected by the CVE according to the NVD",
          "de": "Dass die Komponentenversion laut NVD nicht von der CVE betroffen ist",
          "nl": "Dat de componentversie volgens de NVD niet door de CVE wordt getroffen",
          "fr": "Que la version du composant n'est pas affectée par la CVE selon la NVD",
          "it": "Che la versione del componente non è interessata dalla CVE secondo l'NVD",
          "es": "Que la versión del componente no se ve afectada por la CVE según el NVD",
          "pl": "Że wersja komponentu nie jest dotknięta przez CVE zgodnie z NVD",
          "cs": "Že verze komponenty není podle NVD zranitelností CVE dotčena",
          "pt": "Que a versão do componente não é afetada pela CVE segundo o NVD",
          "ro": "Că versiunea componentei nu este afectată de CVE conform NVD"
        },
        {
          "en": "That the CVE has been disputed by the component vendor",
          "de": "Dass die CVE vom Komponentenhersteller angefochten wurde",
          "nl": "Dat de CVE door de componentleverancier wordt betwist",
          "fr": "Que la CVE a été contestée par le fournisseur du composant",
          "it": "Che la CVE è stata contestata dal fornitore del componente",
          "es": "Que la CVE ha sido disputada por el proveedor del componente",
          "pl": "Że CVE zostało zakwestionowane przez dostawcę komponentu",
          "cs": "Že zranitelnost CVE byla dodavatelem komponenty zpochybněna",
          "pt": "Que a CVE foi contestada pelo fornecedor do componente",
          "ro": "Că CVE a fost contestat de furnizorul componentei"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "A VEX 'not_affected' statement with 'code_not_reachable' means: the vulnerable code path exists in the component version you are using, but your product's architecture or configuration means that code path is never executed. This is a formal, machine-readable audit record of the investigation decision.",
        "de": "Eine VEX 'not_affected'-Aussage mit 'code_not_reachable' bedeutet: Der verwundbare Codepfad existiert in der von Ihnen verwendeten Komponentenversion, aber die Architektur oder Konfiguration Ihres Produkts bewirkt, dass dieser Codepfad nie ausgeführt wird. Dies ist ein formeller, maschinenlesbarer Prüfdatensatz der Untersuchungsentscheidung.",
        "nl": "Een VEX 'not_affected'-verklaring met 'code_not_reachable' betekent: het kwetsbare codepad bestaat in de componentversie die u gebruikt, maar de architectuur of configuratie van uw product zorgt ervoor dat dit codepad nooit wordt uitgevoerd. Dit is een formeel, machineleesbaar auditverslag van de onderzoeksbeslissing.",
        "fr": "Une déclaration VEX 'not_affected' avec 'code_not_reachable' signifie : le chemin de code vulnérable existe dans la version du composant que vous utilisez, mais l'architecture ou la configuration de votre produit signifie que ce chemin de code n'est jamais exécuté. Il s'agit d'un enregistrement d'audit formel et lisible par machine de la décision d'investigation.",
        "it": "Un'asserzione VEX 'not_affected' con 'code_not_reachable' significa: il percorso di codice vulnerabile esiste nella versione del componente che stai usando, ma l'architettura o la configurazione del tuo prodotto fa sì che quel percorso di codice non venga mai eseguito. Questo è un record di audit formale e leggibile da macchina della decisione di indagine.",
        "es": "Una declaración VEX 'not_affected' con 'code_not_reachable' significa: la ruta de código vulnerable existe en la versión del componente que está utilizando, pero la arquitectura o configuración de su producto implica que esa ruta de código nunca se ejecuta. Este es un registro formal de auditoría legible por máquina de la decisión de investigación.",
        "pl": "Takie oświadczenie VEX 'not_affected' z 'code_not_reachable' oznacza: podatna ścieżka kodu istnieje w używanej wersji komponentu, ale architektura lub konfiguracja produktu sprawia, że ta ścieżka nigdy nie jest wykonywana. Jest to formalny, czytelny maszynowo zapis audytu decyzji z dochodzenia.",
        "cs": "Prohlášení VEX 'not_affected' s odůvodněním 'code_not_reachable' znamená: zranitelná cesta kódu v používané verzi komponenty existuje, ale architektura nebo konfigurace produktu způsobuje, že tato cesta kódu se nikdy nespustí. Jde o formální strojově čitelný záznam o rozhodnutí z auditu.",
        "pt": "Uma declaração VEX 'not_affected' com 'code_not_reachable' significa: o caminho de código vulnerável existe na versão do componente que está a usar, mas a arquitetura ou configuração do seu produto faz com que esse caminho nunca seja executado. Trata-se de um registo formal e legível por máquina da decisão de investigação.",
        "ro": "O declarație VEX 'not_affected' cu 'code_not_reachable' înseamnă: calea de cod vulnerabilă există în versiunea componentei pe care o utilizați, dar arhitectura sau configurația produsului dvs. face ca acea cale de cod să nu fie executată niciodată. Aceasta este o înregistrare formală, lizibilă automat, a deciziei de investigare."
      }
    },
    {
      "id": "2.1.3",
      "question": {
        "en": "What are the four main sections of a CycloneDX SBOM document?",
        "de": "Was sind die vier Hauptabschnitte eines CycloneDX SBOM-Dokuments?",
        "nl": "Wat zijn de vier hoofdsecties van een CycloneDX SBOM-document?",
        "fr": "Quelles sont les quatre sections principales d'un document SBOM CycloneDX ?",
        "it": "Quali sono le quattro sezioni principali di un documento SBOM CycloneDX?",
        "es": "¿Cuáles son las cuatro secciones principales de un documento SBOM CycloneDX?",
        "pl": "Jakie są cztery główne sekcje dokumentu SBOM CycloneDX?",
        "cs": "Jaké jsou čtyři hlavní sekce dokumentu CycloneDX SBOM?",
        "pt": "Quais são as quatro secções principais de um documento CycloneDX SBOM?",
        "ro": "Care sunt cele patru secțiuni principale ale unui document SBOM CycloneDX?"
      },
      "options": [
        {
          "en": "Header, body, signatures, appendix",
          "de": "Header, Body, Signaturen, Anhang",
          "nl": "Header, body, signatures, appendix",
          "fr": "En-tête, corps, signatures, annexe",
          "it": "Header, body, signatures, appendix",
          "es": "Encabezado, cuerpo, firmas, apéndice",
          "pl": "Nagłówek, treść, podpisy, załącznik",
          "cs": "Hlavička, tělo, podpisy, příloha",
          "pt": "Cabeçalho, corpo, assinaturas, apêndice",
          "ro": "Antet, corp, semnături, anexă"
        },
        {
          "en": "Metadata, components, dependencies, vulnerabilities",
          "de": "Metadaten, Komponenten, Abhängigkeiten, Schwachstellen",
          "nl": "Metadata, components, dependencies, vulnerabilities",
          "fr": "Métadonnées, composants, dépendances, vulnérabilités",
          "it": "Metadata, components, dependencies, vulnerabilities",
          "es": "Metadatos, componentes, dependencias, vulnerabilidades",
          "pl": "Metadane, komponenty, zależności, podatności",
          "cs": "Metadata, komponenty, závislosti, zranitelnosti",
          "pt": "Metadados, componentes, dependências, vulnerabilidades",
          "ro": "Metadata, componente, dependențe, vulnerabilități"
        },
        {
          "en": "Document info, packages, relationships, files",
          "de": "Dokumentinformationen, Pakete, Beziehungen, Dateien",
          "nl": "Documentinfo, pakketten, relaties, bestanden",
          "fr": "Informations du document, packages, relations, fichiers",
          "it": "Informazioni sul documento, pacchetti, relazioni, file",
          "es": "Información del documento, paquetes, relaciones, archivos",
          "pl": "Informacje o dokumencie, pakiety, relacje, pliki",
          "cs": "Informace o dokumentu, balíčky, vztahy, soubory",
          "pt": "Informação do documento, pacotes, relacionamentos, ficheiros",
          "ro": "Informații document, pachete, relații, fișiere"
        },
        {
          "en": "Manifest, inventory, licenses, hashes",
          "de": "Manifest, Bestandsverzeichnis, Lizenzen, Hashes",
          "nl": "Manifest, inventory, licenses, hashes",
          "fr": "Manifeste, inventaire, licences, hachages",
          "it": "Manifest, inventory, licenses, hashes",
          "es": "Manifiesto, inventario, licencias, hashes",
          "pl": "Manifest, inwentarz, licencje, hashe",
          "cs": "Manifest, inventář, licence, hashe",
          "pt": "Manifesto, inventário, licenças, hashes",
          "ro": "Manifest, inventar, licențe, hash-uri"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "A CycloneDX document has: metadata (about the SBOM and the product), components (the component inventory), dependencies (the dependency graph), and optionally vulnerabilities (embedded CVE data). SPDX uses different section names: document creation information, packages, relationships.",
        "de": "Ein CycloneDX-Dokument enthält: Metadaten (über den SBOM und das Produkt), Komponenten (das Komponenteninventar), Abhängigkeiten (den Abhängigkeitsgraphen) und optional Schwachstellen (eingebettete CVE-Daten). SPDX verwendet andere Abschnittsnamen: Dokumenterstellungsinformationen, Pakete, Beziehungen.",
        "nl": "Een CycloneDX-document bevat: metadata (over de SBOM en het product), components (de componentinventaris), dependencies (de afhankelijkheidsgrafiek) en optioneel vulnerabilities (ingebedde CVE-gegevens). SPDX gebruikt andere sectienamen: document creation information, packages, relationships.",
        "fr": "Un document CycloneDX contient : des métadonnées (sur le SBOM et le produit), des composants (l'inventaire des composants), des dépendances (le graphe de dépendances), et éventuellement des vulnérabilités (données CVE intégrées). SPDX utilise des noms de sections différents : informations de création du document, packages, relations.",
        "it": "Un documento CycloneDX ha: metadata (riguardanti lo SBOM e il prodotto), components (l'inventario dei componenti), dependencies (il grafo delle dipendenze), e opzionalmente vulnerabilities (dati CVE incorporati). SPDX usa nomi di sezione diversi: document creation information, packages, relationships.",
        "es": "Un documento CycloneDX tiene: metadatos (sobre el SBOM y el producto), componentes (el inventario de componentes), dependencias (el grafo de dependencias), y opcionalmente vulnerabilidades (datos CVE integrados). SPDX utiliza nombres de sección diferentes: información de creación del documento, paquetes, relaciones.",
        "pl": "Dokument CycloneDX zawiera: metadane (dotyczące SBOM i produktu), komponenty (inwentarz komponentów), zależności (graf zależności) oraz opcjonalnie podatności (osadzone dane CVE). SPDX używa innych nazw sekcji: informacje o utworzeniu dokumentu, pakiety, relacje.",
        "cs": "Dokument CycloneDX obsahuje: metadata (o SBOM a produktu), komponenty (inventář komponent), závislosti (graf závislostí) a volitelně zranitelnosti (vložená data CVE). SPDX používá jiné názvy sekcí: informace o vytvoření dokumentu, balíčky, vztahy.",
        "pt": "Um documento CycloneDX contém: metadados (sobre o SBOM e o produto), componentes (o inventário de componentes), dependências (o grafo de dependências) e, opcionalmente, vulnerabilidades (dados CVE incorporados). O SPDX usa nomes de secções diferentes: informação de criação do documento, pacotes, relacionamentos.",
        "ro": "Un document CycloneDX conține: metadata (despre SBOM și produs), componente (inventarul componentelor), dependențe (graficul de dependențe) și, opțional, vulnerabilități (date CVE integrate). SPDX folosește nume de secțiuni diferite: informații de creare a documentului, pachete, relații."
      }
    },
    {
      "id": "2.1.4",
      "question": {
        "en": "Why is CycloneDX described as the preferred format for CRA Article 14 compliance workflows?",
        "de": "Warum wird CycloneDX als bevorzugtes Format für CRA Artikel 14 Compliance-Workflows beschrieben?",
        "nl": "Waarom wordt CycloneDX beschreven als het voorkeursformaat voor CRA Artikel 14-nalevingsworkflows?",
        "fr": "Pourquoi CycloneDX est-il décrit comme le format préféré pour les flux de travail de conformité à l'Article 14 du CRA ?",
        "it": "Perché CycloneDX è descritto come il formato preferito per i flussi di lavoro di conformità CRA Article 14?",
        "es": "¿Por qué se describe CycloneDX como el formato preferido para los flujos de trabajo de cumplimiento del Artículo 14 del CRA?",
        "pl": "Dlaczego CycloneDX jest opisywany jako preferowany format dla przepływów pracy zgodności z art. 14 CRA?",
        "cs": "Proč je CycloneDX označován jako preferovaný formát pro pracovní postupy souladu s CRA Article 14?",
        "pt": "Por que razão o CycloneDX é descrito como o formato preferido para fluxos de trabalho de conformidade com o artigo 14 do CRA?",
        "ro": "De ce este CycloneDX descris ca formatul preferat pentru fluxurile de lucru de conformitate cu articolul 14 din CRA?"
      },
      "options": [
        {
          "en": "Because the European Commission has officially designated CycloneDX as the required format",
          "de": "Weil die Europäische Kommission CycloneDX offiziell als erforderliches Format festgelegt hat",
          "nl": "Omdat de Europese Commissie CycloneDX officieel heeft aangewezen als het vereiste formaat",
          "fr": "Parce que la Commission européenne a officiellement désigné CycloneDX comme format requis",
          "it": "Perché la Commissione Europea ha designato ufficialmente CycloneDX come formato obbligatorio",
          "es": "Porque la Comisión Europea ha designado oficialmente CycloneDX como el formato requerido",
          "pl": "Ponieważ Komisja Europejska oficjalnie wyznaczyła CycloneDX jako wymagany format",
          "cs": "Protože Evropská komise CycloneDX oficiálně označila jako povinný formát",
          "pt": "Porque a Comissão Europeia designou oficialmente o CycloneDX como o formato obrigatório",
          "ro": "Pentru că Comisia Europeană a desemnat oficial CycloneDX ca format obligatoriu"
        },
        {
          "en": "Because it was designed for vulnerability management workflows and has native VEX support, and tools like Grype and Dependency-Track are built around it",
          "de": "Weil es für Schwachstellenmanagement-Workflows entwickelt wurde und native VEX-Unterstützung bietet und Tools wie Grype und Dependency-Track darauf aufbauen",
          "nl": "Omdat het is ontworpen voor kwetsbaarheidsbeheerworkflows en native VEX-ondersteuning heeft, en tools zoals Grype en Dependency-Track eromheen zijn gebouwd",
          "fr": "Parce qu'il a été conçu pour les flux de travail de gestion des vulnérabilités et dispose d'un support VEX natif, et que des outils comme Grype et Dependency-Track sont construits autour de lui",
          "it": "Perché è stato progettato per flussi di lavoro di gestione delle vulnerabilità e ha supporto nativo VEX, e strumenti come Grype e Dependency-Track sono costruiti attorno ad esso",
          "es": "Porque fue diseñado para flujos de trabajo de gestión de vulnerabilidades y tiene soporte nativo para VEX, y herramientas como Grype y Dependency-Track están construidas alrededor de él",
          "pl": "Ponieważ został zaprojektowany do przepływów pracy zarządzania podatnościami i ma natywne wsparcie VEX, a narzędzia takie jak Grype i Dependency-Track są wokół niego zbudowane",
          "cs": "Protože byl navržen pro pracovní postupy správy zranitelností, má nativní podporu VEX a nástroje jako Grype a Dependency-Track jsou na něm postaveny",
          "pt": "Porque foi concebido para fluxos de trabalho de gestão de vulnerabilidades e tem suporte nativo a VEX, e ferramentas como Grype e Dependency-Track são construídas em torno dele",
          "ro": "Pentru că a fost conceput pentru fluxuri de lucru de gestionare a vulnerabilităților și are suport nativ VEX, iar instrumente precum Grype și Dependency-Track sunt construite în jurul acestuia"
        },
        {
          "en": "Because it is the only format that supports PURL identifiers",
          "de": "Weil es das einzige Format ist, das PURL-Identifikatoren unterstützt",
          "nl": "Omdat het het enige formaat is dat PURL-identifiers ondersteunt",
          "fr": "Parce que c'est le seul format qui supporte les identifiants PURL",
          "it": "Perché è l'unico formato che supporta identificatori PURL",
          "es": "Porque es el único formato que admite identificadores PURL",
          "pl": "Ponieważ jest to jedyny format obsługujący identyfikatory PURL",
          "cs": "Protože je to jediný formát, který podporuje identifikátory PURL",
          "pt": "Porque é o único formato que suporta identificadores PURL",
          "ro": "Pentru că este singurul format care acceptă identificatori PURL"
        },
        {
          "en": "Because SPDX does not support component hashes",
          "de": "Weil SPDX Komponenten-Hashes nicht unterstützt",
          "nl": "Omdat SPDX geen componenthashes ondersteunt",
          "fr": "Parce que SPDX ne supporte pas les hachages de composants",
          "it": "Perché SPDX non supporta hash dei componenti",
          "es": "Porque SPDX no admite hashes de componentes",
          "pl": "Ponieważ SPDX nie obsługuje hashy komponentów",
          "cs": "Protože SPDX nepodporuje hashe komponent",
          "pt": "Porque o SPDX não suporta hashes de componentes",
          "ro": "Pentru că SPDX nu acceptă hash-uri de componente"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "CycloneDX was designed for security use cases from the start. Its native VEX support, Dependency-Track integration, and tooling ecosystem (Grype, Syft, cdxgen) make it the natural choice for the Article 14 monitoring and reporting loop. SPDX also qualifies for CRA compliance but was designed primarily for license management.",
        "de": "CycloneDX wurde von Anfang an für Sicherheitsanwendungsfälle entwickelt. Seine native VEX-Unterstützung, die Dependency-Track-Integration und das Tooling-Ökosystem (Grype, Syft, cdxgen) machen es zur natürlichen Wahl für die Artikel 14 Überwachungs- und Berichtsschleife. SPDX erfüllt ebenfalls die CRA-Compliance-Anforderungen, wurde aber primär für Lizenzmanagement entwickelt.",
        "nl": "CycloneDX is vanaf het begin ontworpen voor beveiligingsdoeleinden. De native VEX-ondersteuning, Dependency-Track-integratie en het tooling-ecosysteem (Grype, Syft, cdxgen) maken het de natuurlijke keuze voor de monitoring- en rapportageloop van Artikel 14. SPDX komt ook in aanmerking voor CRA-naleving maar is primair ontworpen voor licentiebeheer.",
        "fr": "CycloneDX a été conçu dès le départ pour des cas d'usage de sécurité. Son support VEX natif, son intégration avec Dependency-Track et son écosystème d'outils (Grype, Syft, cdxgen) en font le choix naturel pour la boucle de surveillance et de reporting de l'Article 14. SPDX est également admissible à la conformité CRA mais a été conçu principalement pour la gestion des licences.",
        "it": "CycloneDX è stato progettato fin dall'inizio per casi d'uso di sicurezza. Il suo supporto nativo VEX, l'integrazione con Dependency-Track e l'ecosistema di strumenti (Grype, Syft, cdxgen) lo rendono la scelta naturale per il ciclo di monitoraggio e reporting dell'Article 14. SPDX è anch'esso valido per la conformità CRA ma è stato progettato principalmente per la gestione delle licenze.",
        "es": "CycloneDX fue diseñado para casos de uso de seguridad desde el principio. Su soporte nativo para VEX, la integración con Dependency-Track y el ecosistema de herramientas (Grype, Syft, cdxgen) lo convierten en la elección natural para el bucle de monitorización e informes del Artículo 14. SPDX también califica para el cumplimiento del CRA pero fue diseñado principalmente para la gestión de licencias.",
        "pl": "CycloneDX został zaprojektowany od początku do przypadków użycia związanych z bezpieczeństwem. Jego natywne wsparcie VEX, integracja z Dependency-Track oraz ekosystem narzędzi (Grype, Syft, cdxgen) czynią go naturalnym wyborem dla pętli monitorowania i raportowania z art. 14. SPDX również kwalifikuje się do zgodności z CRA, ale został zaprojektowany przede wszystkim do zarządzania licencjami.",
        "cs": "CycloneDX byl od počátku navržen pro bezpečnostní případy použití. Jeho nativní podpora VEX, integrace s Dependency-Track a ekosystém nástrojů (Grype, Syft, cdxgen) z něj činí přirozenou volbu pro smyčku monitorování a hlášení podle Article 14. SPDX je pro soulad s CRA rovněž přípustný, byl však navržen primárně pro správu licencí.",
        "pt": "O CycloneDX foi concebido desde o início para casos de uso de segurança. O seu suporte nativo a VEX, a integração com Dependency-Track e o ecossistema de ferramentas (Grype, Syft, cdxgen) tornam-no a escolha natural para o ciclo de monitorização e comunicação do artigo 14. O SPDX também qualifica para conformidade com o CRA, mas foi concebido principalmente para gestão de licenças.",
        "ro": "CycloneDX a fost conceput de la început pentru cazuri de utilizare de securitate. Suportul său nativ VEX, integrarea cu Dependency-Track și ecosistemul de instrumente (Grype, Syft, cdxgen) îl fac alegerea naturală pentru bucla de monitorizare și raportare din articolul 14. SPDX este, de asemenea, eligibil pentru conformitatea cu CRA, dar a fost conceput în principal pentru gestionarea licențelor."
      }
    },
    {
      "id": "2.1.5",
      "question": {
        "en": "Which command generates a CycloneDX 1.6 JSON SBOM from a container image using Syft?",
        "de": "Welcher Befehl erzeugt ein CycloneDX 1.6 JSON SBOM aus einem Container-Image mit Syft?",
        "nl": "Welk commando genereert een CycloneDX 1.6 JSON SBOM van een containerimage met Syft?",
        "fr": "Quelle commande génère un SBOM CycloneDX 1.6 JSON à partir d'une image de conteneur en utilisant Syft ?",
        "it": "Quale comando genera un SBOM CycloneDX 1.6 JSON da un'immagine container usando Syft?",
        "es": "¿Qué comando genera un SBOM JSON CycloneDX 1.6 a partir de una imagen de contenedor usando Syft?",
        "pl": "Które polecenie generuje SBOM CycloneDX 1.6 JSON z obrazu kontenera przy użyciu Syft?",
        "cs": "Který příkaz vygeneruje CycloneDX 1.6 JSON SBOM z kontejnerového obrazu pomocí Syft?",
        "pt": "Qual comando gera um CycloneDX 1.6 JSON SBOM a partir de uma imagem de contentor usando Syft?",
        "ro": "Ce comandă generează un SBOM JSON CycloneDX 1.6 dintr-o imagine de container folosind Syft?"
      },
      "options": [
        {
          "en": "syft my-image:latest --format cdx",
          "de": "syft my-image:latest --format cdx",
          "nl": "syft my-image:latest --format cdx",
          "fr": "syft my-image:latest --format cdx",
          "it": "syft my-image:latest --format cdx",
          "es": "syft my-image:latest --format cdx",
          "pl": "syft my-image:latest --format cdx",
          "cs": "syft my-image:latest --format cdx",
          "pt": "syft my-image:latest --format cdx",
          "ro": "syft my-image:latest --format cdx"
        },
        {
          "en": "syft scan my-image:latest > sbom.json",
          "de": "syft scan my-image:latest > sbom.json",
          "nl": "syft scan my-image:latest > sbom.json",
          "fr": "syft scan my-image:latest > sbom.json",
          "it": "syft scan my-image:latest > sbom.json",
          "es": "syft scan my-image:latest > sbom.json",
          "pl": "syft scan my-image:latest > sbom.json",
          "cs": "syft scan my-image:latest > sbom.json",
          "pt": "syft scan my-image:latest > sbom.json",
          "ro": "syft scan my-image:latest > sbom.json"
        },
        {
          "en": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "de": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "nl": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "fr": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "it": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "es": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "pl": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "cs": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "pt": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json",
          "ro": "syft my-image:latest -o cyclonedx-json > sbom.cdx.json"
        },
        {
          "en": "syft generate --type cyclonedx my-image:latest",
          "de": "syft generate --type cyclonedx my-image:latest",
          "nl": "syft generate --type cyclonedx my-image:latest",
          "fr": "syft generate --type cyclonedx my-image:latest",
          "it": "syft generate --type cyclonedx my-image:latest",
          "es": "syft generate --type cyclonedx my-image:latest",
          "pl": "syft generate --type cyclonedx my-image:latest",
          "cs": "syft generate --type cyclonedx my-image:latest",
          "pt": "syft generate --type cyclonedx my-image:latest",
          "ro": "syft generate --type cyclonedx my-image:latest"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "The correct Syft command is: syft <target> -o cyclonedx-json > output-file.cdx.json. The -o flag sets the output format. cyclonedx-json produces CycloneDX 1.6 JSON by default.",
        "de": "Der korrekte Syft-Befehl lautet: syft <target> -o cyclonedx-json > output-file.cdx.json. Das -o-Flag legt das Ausgabeformat fest. cyclonedx-json erzeugt standardmäßig CycloneDX 1.6 JSON.",
        "nl": "Het juiste Syft-commando is: syft <target> -o cyclonedx-json > output-file.cdx.json. De vlag -o stelt het uitvoerformaat in. cyclonedx-json produceert standaard CycloneDX 1.6 JSON.",
        "fr": "La commande Syft correcte est : syft <target> -o cyclonedx-json > output-file.cdx.json. L'option -o définit le format de sortie. cyclonedx-json produit du CycloneDX 1.6 JSON par défaut.",
        "it": "Il comando Syft corretto è: syft <target> -o cyclonedx-json > output-file.cdx.json. Il flag -o imposta il formato di output. cyclonedx-json produce CycloneDX 1.6 JSON per impostazione predefinita.",
        "es": "El comando correcto de Syft es: syft <target> -o cyclonedx-json > output-file.cdx.json. El indicador -o establece el formato de salida. cyclonedx-json produce CycloneDX 1.6 JSON de forma predeterminada.",
        "pl": "Prawidłowe polecenie Syft to: syft <target> -o cyclonedx-json > output-file.cdx.json. Flaga -o ustawia format wyjściowy. cyclonedx-json domyślnie produkuje CycloneDX 1.6 JSON.",
        "cs": "Správný příkaz Syft je: syft <target> -o cyclonedx-json > output-file.cdx.json. Příznak -o nastavuje výstupní formát. cyclonedx-json ve výchozím nastavení vytváří CycloneDX 1.6 JSON.",
        "pt": "O comando Syft correto é: syft <target> -o cyclonedx-json > output-file.cdx.json. O sinalizador -o define o formato de saída. cyclonedx-json produz CycloneDX 1.6 JSON por predefinição.",
        "ro": "Comanda corectă Syft este: syft <target> -o cyclonedx-json > output-file.cdx.json. Indicatorul -o stabilește formatul de ieșire. cyclonedx-json produce implicit CycloneDX 1.6 JSON."
      }
    }
  ]
});

export default quiz;
