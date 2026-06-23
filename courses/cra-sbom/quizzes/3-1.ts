import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "3.1",
  "passingScore": 75,
  "questions": [
    {
      "id": "3.1.1",
      "question": {
        "en": "What is the key difference between source-time SBOM tools (like cdxgen) and image-scanning tools (like Syft)?",
        "de": "Was ist der wesentliche Unterschied zwischen SBOM-Tools zur Erstellungszeit (wie cdxgen) und Image-Scanning-Tools (wie Syft)?",
        "nl": "Wat is het belangrijkste verschil tussen source-time SBOM-tools (zoals cdxgen) en image-scanning-tools (zoals Syft)?",
        "fr": "Quelle est la différence clé entre les outils SBOM au moment de la source (comme cdxgen) et les outils d'analyse d'image (comme Syft) ?",
        "it": "Qual è la differenza principale tra gli strumenti SBOM source-time (come cdxgen) e gli strumenti di scansione delle immagini (come Syft)?",
        "es": "¿Cuál es la diferencia clave entre las herramientas de SBOM en tiempo de origen (como cdxgen) y las herramientas de escaneo de imágenes (como Syft)?",
        "pl": "Jaka jest kluczowa różnica między narzędziami SBOM działającymi na etapie źródła (takimi jak cdxgen) a narzędziami skanującymi obrazy (takimi jak Syft)?",
        "cs": "Jaký je klíčový rozdíl mezi nástroji pro tvorbu SBOM ze zdrojového kódu (jako cdxgen) a nástroji pro skenování obrazů (jako Syft)?",
        "pt": "Qual é a principal diferença entre as ferramentas de SBOM em tempo de origem (como cdxgen) e as ferramentas de análise de imagem (como Syft)?",
        "ro": "Care este diferența cheie între instrumentele SBOM de la sursă (cum ar fi cdxgen) și instrumentele de scanare a imaginilor (cum ar fi Syft)?"
      },
      "options": [
        {
          "en": "Source-time tools only support CycloneDX, image-scanning tools only support SPDX",
          "de": "SBOM-Tools zur Erstellungszeit unterstützen nur CycloneDX, Image-Scanning-Tools nur SPDX",
          "nl": "Source-time-tools ondersteunen alleen CycloneDX, image-scanning-tools ondersteunen alleen SPDX",
          "fr": "Les outils au moment de la source ne prennent en charge que CycloneDX, les outils d'analyse d'image ne prennent en charge que SPDX",
          "it": "Gli strumenti source-time supportano solo CycloneDX, gli strumenti di scansione delle immagini supportano solo SPDX",
          "es": "Las herramientas en tiempo de origen solo admiten CycloneDX; las herramientas de escaneo de imágenes solo admiten SPDX",
          "pl": "Narzędzia działające na etapie źródła obsługują wyłącznie CycloneDX, a narzędzia skanujące obrazy wyłącznie SPDX",
          "cs": "Nástroje ze zdrojového kódu podporují pouze CycloneDX, nástroje pro skenování obrazů podporují pouze SPDX",
          "pt": "As ferramentas em tempo de origem suportam apenas o CycloneDX, as ferramentas de análise de imagem suportam apenas o SPDX",
          "ro": "Instrumentele de la sursă suportă doar CycloneDX, instrumentele de scanare a imaginilor suportă doar SPDX"
        },
        {
          "en": "Source-time tools read package manifests and produce full transitive application dependency graphs; image scanners examine built artifacts and find OS and runtime packages",
          "de": "SBOM-Tools zur Erstellungszeit lesen Paketmanifeste und erzeugen vollständige transitive Anwendungsabhängigkeitsgraphen. Image-Scanner untersuchen gebaute Artefakte und finden Betriebssystem- und Laufzeitpakete",
          "nl": "Source-time-tools lezen package manifests en produceren volledige transitieve afhankelijkheidsgrafen voor applicaties; image scanners onderzoeken gebouwde artefacten en vinden OS- en runtime-pakketten",
          "fr": "Les outils au moment de la source lisent les manifestes de paquets et produisent des graphes complets de dépendances transitives des applications ; les analyseurs d'image examinent les artefacts construits et trouvent les paquets OS et runtime",
          "it": "Gli strumenti source-time leggono i manifest dei pacchetti e producono grafi completi delle dipendenze transitive delle applicazioni; gli scanner di immagini esaminano gli artefatti compilati e trovano pacchetti del sistema operativo e del runtime",
          "es": "Las herramientas en tiempo de origen leen manifiestos de paquetes y producen gráficos completos de dependencias transitivas de la aplicación; los escáneres de imágenes examinan artefactos construidos e identifican paquetes del sistema operativo y del entorno de ejecución",
          "pl": "Narzędzia działające na etapie źródła odczytują manifesty pakietów i tworzą pełne grafy zależności aplikacji z uwzględnieniem zależności przechodnich. Skanery obrazów analizują zbudowane artefakty i wykrywają pakiety systemu operacyjnego oraz środowiska uruchomieniowego",
          "cs": "Nástroje ze zdrojového kódu čtou manifesty balíčků a vytvářejí úplné tranzitivní grafy závislostí aplikace; skenery obrazů zkoumají sestavené artefakty a nacházejí balíčky operačního systému a runtime",
          "pt": "As ferramentas em tempo de origem leem manifestos de pacotes e produzem gráficos completos de dependências transitivas de aplicações; os analisadores de imagem examinam artefatos compilados e encontram pacotes do SO e de runtime",
          "ro": "Instrumentele de la sursă citesc manifestele pachetelor și produc grafuri complete de dependențe transitive ale aplicației; scanerele de imagini examinează artefacte construite și găsesc pachete OS și runtime"
        },
        {
          "en": "Image-scanning tools are more accurate for application dependencies because they see the actual binary",
          "de": "Image-Scanning-Tools sind genauer für Anwendungsabhängigkeiten, weil sie die tatsächliche Binärdatei sehen",
          "nl": "Image-scanning-tools zijn nauwkeuriger voor applicatieafhankelijkheden omdat zij de daadwerkelijke binary zien",
          "fr": "Les outils d'analyse d'image sont plus précis pour les dépendances applicatives car ils voient le binaire réel",
          "it": "Gli strumenti di scansione delle immagini sono più precisi per le dipendenze delle applicazioni perché vedono il binario effettivo",
          "es": "Las herramientas de escaneo de imágenes son más precisas para las dependencias de la aplicación porque ven el binario real",
          "pl": "Narzędzia skanujące obrazy zapewniają większą dokładność w zakresie zależności aplikacji, ponieważ widzą rzeczywisty plik binarny",
          "cs": "Nástroje pro skenování obrazů jsou přesnější pro závislosti aplikace, protože vidí skutečný binární soubor",
          "pt": "As ferramentas de análise de imagem são mais precisas para dependências de aplicações porque veem o binário real",
          "ro": "Instrumentele de scanare a imaginilor sunt mai precise pentru dependențele aplicației deoarece văd binarul real"
        },
        {
          "en": "Source-time tools require internet access; image-scanning tools work offline",
          "de": "SBOM-Tools zur Erstellungszeit benötigen Internetzugang. Image-Scanning-Tools arbeiten offline",
          "nl": "Source-time-tools vereisen internettoegang; image-scanning-tools werken offline",
          "fr": "Les outils au moment de la source nécessitent un accès internet ; les outils d'analyse d'image fonctionnent hors ligne",
          "it": "Gli strumenti source-time richiedono accesso a internet; gli strumenti di scansione delle immagini funzionano offline",
          "es": "Las herramientas en tiempo de origen requieren acceso a Internet; las herramientas de escaneo de imágenes funcionan sin conexión",
          "pl": "Narzędzia działające na etapie źródła wymagają dostępu do internetu. Narzędzia skanujące obrazy działają w trybie offline",
          "cs": "Nástroje ze zdrojového kódu vyžadují přístup k internetu; nástroje pro skenování obrazů fungují offline",
          "pt": "As ferramentas em tempo de origem requerem acesso à internet; as ferramentas de análise de imagem funcionam offline",
          "ro": "Instrumentele de la sursă necesită acces la internet; instrumentele de scanare a imaginilor funcționează offline"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Source-time tools (cdxgen) read lock files like package-lock.json or pom.xml and produce the full transitive dependency graph. Image scanners (Syft) examine a built artifact (container image or directory) and identify packages from OS package databases and embedded language manifests. Neither is complete alone: combine both for full coverage.",
        "de": "SBOM-Tools zur Erstellungszeit (cdxgen) lesen Sperrdateien wie package-lock.json oder pom.xml und erzeugen den vollständigen transitiven Abhängigkeitsgraphen. Image-Scanner (Syft) untersuchen ein gebautes Artefakt (Container-Image oder Verzeichnis) und identifizieren Pakete aus Betriebssystem-Paketdatenbanken sowie eingebetteten Sprachmanifesten. Keines der Verfahren ist allein vollständig. Kombinieren Sie beide für eine vollständige Abdeckung.",
        "nl": "Source-time-tools (cdxgen) lezen lock files zoals package-lock.json of pom.xml en produceren de volledige transitieve afhankelijkheidsgraaf. Image scanners (Syft) onderzoeken een gebouwd artefact (container image of directory) en identificeren pakketten uit OS-pakketdatabases en embedded language manifests. Geen van beide is op zichzelf volledig: combineer beide voor volledige dekking.",
        "fr": "Les outils au moment de la source (cdxgen) lisent les fichiers de verrouillage comme package-lock.json ou pom.xml et produisent le graphe complet des dépendances transitives. Les analyseurs d'image (Syft) examinent un artefact construit (image de conteneur ou répertoire) et identifient les paquets à partir des bases de données de paquets OS et des manifestes de langage intégrés. Aucun n'est complet seul : combinez les deux pour une couverture totale.",
        "it": "Gli strumenti source-time (cdxgen) leggono i file di lock come package-lock.json o pom.xml e producono il grafo completo delle dipendenze transitive. Gli scanner di immagini (Syft) esaminano un artefatto compilato (immagine container o directory) e identificano i pacchetti dai database dei pacchetti del sistema operativo e dai manifest dei linguaggi incorporati. Nessuno dei due è completo da solo: combinateli entrambi per una copertura completa.",
        "es": "Las herramientas en tiempo de origen (cdxgen) leen archivos de bloqueo como package-lock.json o pom.xml y producen el gráfico completo de dependencias transitivas. Los escáneres de imágenes (Syft) examinan un artefacto construido (imagen de contenedor o directorio) e identifican paquetes a partir de bases de datos de paquetes del sistema operativo y manifiestos de lenguaje incrustados. Ninguno es completo por sí solo: combine ambos para una cobertura total.",
        "pl": "Narzędzia działające na etapie źródła (cdxgen) odczytują pliki blokady takie jak package-lock.json lub pom.xml i tworzą pełny graf zależności przechodnich. Skanery obrazów (Syft) analizują zbudowany artefakt (obraz kontenera lub katalog) i identyfikują pakiety na podstawie baz pakietów systemu operacyjnego oraz osadzonych manifestów językowych. Żadne z tych rozwiązań nie jest kompletne samodzielnie. Należy je połączyć, aby uzyskać pełne pokrycie.",
        "cs": "Nástroje ze zdrojového kódu (cdxgen) čtou soubory zámků jako package-lock.json nebo pom.xml a vytvářejí úplný tranzitivní graf závislostí. Skenery obrazů (Syft) zkoumají sestavený artefakt (obraz kontejneru nebo adresář) a identifikují balíčky z databází balíčků operačního systému a vestavěných manifestů jazyků. Žádný z nich není sám o sobě úplný: kombinujte oba pro úplné pokrytí.",
        "pt": "As ferramentas em tempo de origem (cdxgen) leem ficheiros de bloqueio como package-lock.json ou pom.xml e produzem o gráfico completo de dependências transitivas. Os analisadores de imagem (Syft) examinam um artefato compilado (imagem de contentor ou diretório) e identificam pacotes a partir de bases de dados de pacotes do SO e manifestos de linguagens incorporados. Nenhum é completo sozinho: combine ambos para cobertura total.",
        "ro": "Instrumentele de la sursă (cdxgen) citesc fișiere de blocare precum package-lock.json sau pom.xml și produc graficul complet de dependențe transitive. Scanerele de imagini (Syft) examinează un artefact construit (imagine container sau director) și identifică pachete din bazele de date de pachete OS și manifestele de limbaj încorporate. Niciunul nu este complet singur: combinați-le pe ambele pentru acoperire completă."
      }
    },
    {
      "id": "3.1.2",
      "question": {
        "en": "When should SBOM generation be triggered in the build pipeline?",
        "de": "Wann sollte die SBOM-Erzeugung in der Build-Pipeline ausgelöst werden?",
        "nl": "Wanneer moet SBOM-generatie in de build pipeline worden geactiveerd?",
        "fr": "Quand la génération du SBOM doit-elle être déclenchée dans le pipeline de build ?",
        "it": "Quando deve essere attivata la generazione dell'SBOM nella pipeline di build?",
        "es": "¿Cuándo debe activarse la generación de SBOM en la cadena de compilación?",
        "pl": "Kiedy należy uruchamiać generowanie SBOM w potoku budowy?",
        "cs": "Kdy by mělo být spuštěno generování SBOM v sestavovacím pipeline?",
        "pt": "Quando deve ser acionada a geração de SBOM no pipeline de compilação?",
        "ro": "Când ar trebui declanșată generarea SBOM în pipeline-ul de build?"
      },
      "options": [
        {
          "en": "Once per quarter, during a scheduled compliance review",
          "de": "Einmal pro Quartal während einer geplanten Compliance-Prüfung",
          "nl": "Eenmaal per kwartaal, tijdens een geplande compliance review",
          "fr": "Une fois par trimestre, lors d'un examen de conformité programmé",
          "it": "Una volta al trimestre, durante una revisione programmata della conformità",
          "es": "Una vez por trimestre, durante una revisión programada de cumplimiento",
          "pl": "Raz na kwartał podczas zaplanowanego przeglądu zgodności",
          "cs": "Jednou za čtvrtletí, během plánovaného přezkumu souladu",
          "pt": "Uma vez por trimestre, durante uma revisão de conformidade agendada",
          "ro": "O dată pe trimestru, în timpul unei revizuiri de conformitate programate"
        },
        {
          "en": "As part of every build that produces a release artifact: one SBOM per release, generated at build time",
          "de": "Als Teil jedes Builds, der ein Release-Artefakt erzeugt: eine SBOM pro Release, erzeugt zur Build-Zeit",
          "nl": "Als onderdeel van elke build die een release artefact produceert: één SBOM per release, gegenereerd op build-tijd",
          "fr": "Dans le cadre de chaque build qui produit un artefact de release : un SBOM par release, généré au moment du build",
          "it": "Come parte di ogni build che produce un artefatto di rilascio: un SBOM per rilascio, generato al momento della build",
          "es": "Como parte de cada compilación que produce un artefacto de versión: un SBOM por versión, generado en el momento de la compilación",
          "pl": "W ramach każdej budowy, która tworzy artefakt wydania: jeden SBOM na wydanie, generowany w momencie budowy",
          "cs": "Jako součást každého buildu, který produkuje release artefakt: jeden SBOM na release, generovaný v době buildu",
          "pt": "Como parte de cada compilação que produz um artefato de lançamento: um SBOM por lançamento, gerado no momento da compilação",
          "ro": "Ca parte a fiecărui build care produce un artefact de lansare: un SBOM per lansare, generat la momentul build-ului"
        },
        {
          "en": "Only before a conformity assessment or audit",
          "de": "Nur vor einer Konformitätsbewertung oder einem Audit",
          "nl": "Alleen voorafgaand aan een conformiteitsbeoordeling of audit",
          "fr": "Uniquement avant une évaluation de conformité ou un audit",
          "it": "Solo prima di una valutazione di conformità o di un audit",
          "es": "Solo antes de una evaluación de conformidad o auditoría",
          "pl": "Tylko przed oceną zgodności lub audytem",
          "cs": "Pouze před posouzením shody nebo auditem",
          "pt": "Apenas antes de uma avaliação de conformidade ou auditoria",
          "ro": "Doar înainte de o evaluare de conformitate sau audit"
        },
        {
          "en": "When the product's dependency tree changes by more than 10 percent",
          "de": "Wenn sich der Abhängigkeitsbaum des Produkts um mehr als 10 Prozent ändert",
          "nl": "Wanneer de dependency tree van het product met meer dan tien procent verandert",
          "fr": "Lorsque l'arborescence des dépendances du produit change de plus de 10 pour cent",
          "it": "Quando l'albero delle dipendenze del prodotto cambia di più del 10 percento",
          "es": "Cuando el árbol de dependencias del producto cambia en más de un 10 por ciento",
          "pl": "Gdy drzewo zależności produktu zmieni się o więcej niż 10 procent",
          "cs": "Když se strom závislostí produktu změní o více než 10 procent",
          "pt": "Quando a árvore de dependências do produto muda em mais de 10 por cento",
          "ro": "Când arborele de dependențe al produsului se schimbă cu mai mult de 10 procente"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "The SBOM must reflect the exact component inventory of the released product. Manual or scheduled generation creates a gap between the SBOM and the actual artifact. Generating it as part of the build, from the same artifact, ensures accuracy and creates the audit trail the 10-year retention rule requires.",
        "de": "Die SBOM muss den genauen Komponentenbestand des freigegebenen Produkts widerspiegeln. Manuelle oder terminierte Erzeugung erzeugt eine Lücke zwischen SBOM und tatsächlichem Artefakt. Die Erzeugung als Teil des Builds aus demselben Artefakt stellt die Genauigkeit sicher und erzeugt die Prüfspur, die die 10-jährige Aufbewahrungsregel erfordert.",
        "nl": "De SBOM moet de exacte componentenvoorraad van het released product weergeven. Handmatige of geplande generatie creëert een kloof tussen de SBOM en het daadwerkelijke artefact. Genereren als onderdeel van de build, vanuit hetzelfde artefact, waarborgt nauwkeurigheid en creëert het audit trail dat de tienjarige bewaartermijn vereist.",
        "fr": "Le SBOM doit refléter l'inventaire exact des composants du produit publié. Une génération manuelle ou planifiée crée un écart entre le SBOM et l'artefact réel. Le générer dans le cadre du build, à partir du même artefact, garantit l'exactitude et crée la piste d'audit requise par la règle de conservation de 10 ans.",
        "it": "L'SBOM deve riflettere l'inventario esatto dei componenti del prodotto rilasciato. La generazione manuale o programmata crea un divario tra l'SBOM e l'artefatto effettivo. Generarlo come parte della build, dallo stesso artefatto, garantisce accuratezza e crea la traccia di audit richiesta dalla regola di conservazione di 10 anni.",
        "es": "El SBOM debe reflejar el inventario exacto de componentes del producto publicado. La generación manual o programada crea una brecha entre el SBOM y el artefacto real. Generarlo como parte de la compilación, a partir del mismo artefacto, garantiza la exactitud y crea la pista de auditoría que exige la regla de retención de 10 años.",
        "pl": "SBOM musi odzwierciedlać dokładny inwentarz komponentów wydanego produktu. Ręczne lub zaplanowane generowanie tworzy lukę między SBOM a rzeczywistym artefaktem. Generowanie SBOM w ramach procesu budowy z tego samego artefaktu zapewnia dokładność i tworzy ścieżkę audytu wymaganą przez zasadę przechowywania przez 10 lat.",
        "cs": "SBOM musí odrážet přesný inventář komponent vydaného produktu. Ruční nebo plánované generování vytváří mezeru mezi SBOM a skutečným artefaktem. Jeho generování jako součást buildu, ze stejného artefaktu, zajišťuje přesnost a vytváří auditní stopu, kterou vyžaduje pravidlo uchovávání po dobu 10 let.",
        "pt": "A SBOM deve refletir o inventário exato de componentes do produto lançado. A geração manual ou agendada cria uma lacuna entre a SBOM e o artefato real. Gerá-la como parte da compilação, a partir do mesmo artefato, garante precisão e cria o trilho de auditoria que a regra de retenção de 10 anos requer.",
        "ro": "SBOM-ul trebuie să reflecte inventarul exact de componente al produsului lansat. Generarea manuală sau programată creează un decalaj între SBOM și artefactul real. Generarea lui ca parte a build-ului, din același artefact, asigură acuratețea și creează pista de audit pe care o cere regula de păstrare de 10 ani."
      }
    },
    {
      "id": "3.1.3",
      "question": {
        "en": "How should the SBOM be linked to the release artifact it documents?",
        "de": "Wie sollte die SBOM mit dem Release-Artefakt verknüpft werden, das sie dokumentiert?",
        "nl": "Hoe moet de SBOM aan het release artefact dat het documenteert worden gekoppeld?",
        "fr": "Comment le SBOM doit-il être lié à l'artefact de release qu'il documente ?",
        "it": "Come dovrebbe essere collegato l'SBOM all'artefatto di rilascio che documenta?",
        "es": "¿Cómo debe vincularse el SBOM al artefacto de versión que documenta?",
        "pl": "Jak należy powiązać SBOM z artefaktem wydania, którego dotyczy?",
        "cs": "Jak by měl být SBOM propojen s release artefaktem, který dokumentuje?",
        "pt": "Como deve a SBOM ser ligada ao artefato de lançamento que documenta?",
        "ro": "Cum ar trebui legat SBOM-ul de artefactul de lansare pe care îl documentează?"
      },
      "options": [
        {
          "en": "By embedding the SBOM inside the binary",
          "de": "Durch Einbettung der SBOM in die Binärdatei",
          "nl": "Door de SBOM in de binary in te bedden",
          "fr": "En intégrant le SBOM dans le binaire",
          "it": "Incorporando l'SBOM all'interno del binario",
          "es": "Incrustando el SBOM dentro del binario",
          "pl": "Poprzez osadzenie SBOM wewnątrz pliku binarnego",
          "cs": "Vložením SBOM do binárního souboru",
          "pt": "Ao incorporar a SBOM dentro do binário",
          "ro": "Prin încorporarea SBOM-ului în interiorul binarului"
        },
        {
          "en": "By tagging the SBOM filename or metadata with the product version and build SHA, and attaching it as a release asset",
          "de": "Durch Kennzeichnung des SBOM-Dateinamens oder der Metadaten mit der Produktversion und dem Build-SHA sowie durch Anfügen als Release-Asset",
          "nl": "Door de SBOM-bestandsnaam of metadata te taggen met de productversie en build SHA, en deze als release asset bij te voegen",
          "fr": "En étiquetant le nom de fichier ou les métadonnées du SBOM avec la version du produit et le SHA du build, et en l'attachant comme actif de release",
          "it": "Etichettando il nome file o i metadati dell'SBOM con la versione del prodotto e la build SHA, e allegandolo come asset di rilascio",
          "es": "Etiquetando el nombre de archivo o los metadatos del SBOM con la versión del producto y el SHA de la compilación, y adjuntándolo como activo de la versión",
          "pl": "Poprzez oznaczenie nazwy pliku SBOM lub metadanych wersją produktu i skrótem SHA budowy oraz dołączenie go jako zasobu wydania",
          "cs": "Označením názvu souboru SBOM nebo metadat verzí produktu a build SHA a připojením jako release asset",
          "pt": "Ao etiquetar o nome do ficheiro ou metadados da SBOM com a versão do produto e o SHA da compilação, e anexá-la como ativo de lançamento",
          "ro": "Prin etichetarea numelui de fișier sau metadatelor SBOM cu versiunea produsului și SHA-ul build-ului, și atașarea lui ca asset de lansare"
        },
        {
          "en": "By storing the SBOM in a separate system that is accessed via the product serial number",
          "de": "Durch Speicherung der SBOM in einem separaten System, das über die Produktseriennummer erreichbar ist",
          "nl": "Door de SBOM in een apart systeem op te slaan dat via het product serienummer wordt benaderd",
          "fr": "En stockant le SBOM dans un système distinct accessible via le numéro de série du produit",
          "it": "Memorizzando l'SBOM in un sistema separato accessibile tramite il numero di serie del prodotto",
          "es": "Almacenando el SBOM en un sistema separado al que se accede mediante el número de serie del producto",
          "pl": "Poprzez przechowywanie SBOM w osobnym systemie, do którego uzyskuje się dostęp za pomocą numeru seryjnego produktu",
          "cs": "Uložením SBOM v samostatném systému, ke kterému se přistupuje prostřednictvím sériového čísla produktu",
          "pt": "Ao armazenar a SBOM num sistema separado que é acedido através do número de série do produto",
          "ro": "Prin stocarea SBOM-ului într-un sistem separat accesat prin numărul serial al produsului"
        },
        {
          "en": "By emailing the SBOM to the market surveillance authority at each release",
          "de": "Durch E-Mail-Versand der SBOM an die Marktüberwachungsbehörde bei jedem Release",
          "nl": "Door de SBOM bij elke release per e-mail aan de markttoezichtautoriteit te sturen",
          "fr": "En envoyant le SBOM par courriel à l'autorité de surveillance du marché à chaque release",
          "it": "Inviando l'SBOM via email all'autorità di vigilanza del mercato a ogni rilascio",
          "es": "Enviando el SBOM por correo electrónico a la autoridad de vigilancia del mercado en cada versión",
          "pl": "Poprzez przesłanie SBOM pocztą elektroniczną do organu nadzoru rynku przy każdym wydaniu",
          "cs": "Odesláním SBOM e-mailem orgánu dohledu nad trhem při každém releasu",
          "pt": "Ao enviar a SBOM por email para a autoridade de vigilância do mercado em cada lançamento",
          "ro": "Prin trimiterea prin email a SBOM-ului către autoritatea de supraveghere a pieței la fiecare lansare"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Tagging the SBOM with the product version and build SHA creates the traceable link between the documentation and the artifact. Attaching it as a release asset (GitHub Release, GitLab artifact) keeps it co-located with the release. This is the foundation of the 10-year audit trail.",
        "de": "Die Kennzeichnung der SBOM mit Produktversion und Build-SHA stellt die nachvollziehbare Verbindung zwischen Dokumentation und Artefakt her. Das Anfügen als Release-Asset (GitHub Release, GitLab-Artifact) hält sie am selben Ort wie das Release. Dies bildet die Grundlage der 10-jährigen Prüfspur.",
        "nl": "Het taggen van de SBOM met de productversie en build SHA creëert de traceerbare koppeling tussen de documentatie en het artefact. Het bijvoegen als release asset (GitHub Release, GitLab artifact) houdt deze bij de release. Dit vormt de basis van het tienjarige audit trail.",
        "fr": "L'étiquetage du SBOM avec la version du produit et le SHA du build crée le lien traçable entre la documentation et l'artefact. L'attacher comme actif de release (GitHub Release, artefact GitLab) le maintient co-localisé avec la release. C'est la base de la piste d'audit de 10 ans.",
        "it": "Etichettare l'SBOM con la versione del prodotto e la build SHA crea il collegamento tracciabile tra la documentazione e l'artefatto. Allegarlo come asset di rilascio (GitHub Release, GitLab artifact) lo mantiene co-locato con il rilascio. Questa è la base della traccia di audit di 10 anni.",
        "es": "Etiquetar el SBOM con la versión del producto y el SHA de la compilación crea el vínculo trazable entre la documentación y el artefacto. Adjuntarlo como activo de la versión (GitHub Release, artefacto de GitLab) lo mantiene ubicado junto con la versión. Esta es la base de la pista de auditoría de 10 años.",
        "pl": "Oznaczenie SBOM wersją produktu i skrótem SHA budowy tworzy identyfikowalne powiązanie między dokumentacją a artefaktem. Dołączenie go jako zasobu wydania (GitHub Release, artefakt GitLab) zapewnia współlokację z wydaniem. Stanowi to podstawę ścieżki audytu przez 10 lat.",
        "cs": "Označení SBOM verzí produktu a build SHA vytváří sledovatelnou vazbu mezi dokumentací a artefaktem. Připojení jako release asset (GitHub Release, GitLab artifact) jej udržuje společně s release. Toto je základ auditní stopy po dobu 10 let.",
        "pt": "Etiquetar a SBOM com a versão do produto e o SHA da compilação cria a ligação rastreável entre a documentação e o artefato. Anexá-la como ativo de lançamento (GitHub Release, GitLab artifact) mantém-na co-localizada com o lançamento. Isto é a base do trilho de auditoria de 10 anos.",
        "ro": "Etichetarea SBOM-ului cu versiunea produsului și SHA-ul build-ului creează legătura trasabilă între documentație și artefact. Atașarea lui ca asset de lansare (GitHub Release, GitLab artifact) îl menține co-localizat cu lansarea. Aceasta este fundația pistei de audit de 10 ani."
      }
    },
    {
      "id": "3.1.4",
      "question": {
        "en": "What does SBOM schema validation catch before the SBOM is stored?",
        "de": "Was erkennt die SBOM-Schemavalidierung, bevor die SBOM gespeichert wird?",
        "nl": "Wat vangt SBOM schema validatie op voordat de SBOM wordt opgeslagen?",
        "fr": "Que détecte la validation du schéma du SBOM avant son stockage ?",
        "it": "Cosa rileva la convalida dello schema dell'SBOM prima che l'SBOM venga memorizzato?",
        "es": "¿Qué detecta la validación del esquema del SBOM antes de almacenarlo?",
        "pl": "Co wykrywa walidacja schematu SBOM przed zapisaniem dokumentu?",
        "cs": "Co zachytí validace schématu SBOM před uložením SBOM?",
        "pt": "O que é que a validação de esquema da SBOM apanha antes de a SBOM ser armazenada?",
        "ro": "Ce detectează validarea schemei SBOM înainte ca SBOM-ul să fie stocat?"
      },
      "options": [
        {
          "en": "Vulnerabilities in the listed components",
          "de": "Schwachstellen in den aufgeführten Komponenten",
          "nl": "Kwetsbaarheden in de vermelde componenten",
          "fr": "Les vulnérabilités des composants listés",
          "it": "Vulnerabilità nei componenti elencati",
          "es": "Vulnerabilidades en los componentes enumerados",
          "pl": "Podatności w wymienionych komponentach",
          "cs": "Zranitelnosti v uvedených komponentách",
          "pt": "Vulnerabilidades nos componentes listados",
          "ro": "Vulnerabilități în componentele listate"
        },
        {
          "en": "Missing required fields, incorrect data types, and malformed PURLs",
          "de": "Fehlende Pflichtfelder, falsche Datentypen und fehlerhafte PURLs",
          "nl": "Ontbrekende verplichte velden, onjuiste gegevenstypen en onjuist gevormde PURLs",
          "fr": "Les champs obligatoires manquants, les types de données incorrects et les PURL mal formés",
          "it": "Campi obbligatori mancanti, tipi di dati errati e PURL malformati",
          "es": "Campos obligatorios ausentes, tipos de datos incorrectos y PURL mal formados",
          "pl": "Brak wymaganych pól, nieprawidłowe typy danych oraz niepoprawne PURL",
          "cs": "Chybějící povinná pole, nesprávné datové typy a chybně formátované PURL",
          "pt": "Campos obrigatórios em falta, tipos de dados incorretos e PURLs mal formados",
          "ro": "Câmpuri obligatorii lipsă, tipuri de date incorecte și PURL-uri malformate"
        },
        {
          "en": "Whether the SBOM complies with Annex I, Part II, point (1) CRA",
          "de": "Ob die SBOM Anhang I Teil II Nummer 1 CRA entspricht",
          "nl": "Of de SBOM voldoet aan Bijlage I, Deel II, punt (1) CRA",
          "fr": "Si le SBOM est conforme à l'Annexe I, Partie II, point (1) du CRA",
          "it": "Se l'SBOM è conforme all'Allegato I Parte II punto (1) CRA",
          "es": "Si el SBOM cumple el Anexo I, Parte II, punto (1) de la CRA",
          "pl": "Czy SBOM jest zgodny z załącznikiem I część II punkt (1) CRA",
          "cs": "Zda SBOM splňuje Přílohu I část II bod (1) CRA",
          "pt": "Se a SBOM cumpre o Anexo I, Parte II, ponto (1) do CRA",
          "ro": "Dacă SBOM-ul respectă Anexa I, Partea II, punctul (1) CRA"
        },
        {
          "en": "Whether all components have valid open-source licenses",
          "de": "Ob alle Komponenten gültige Open-Source-Lizenzen besitzen",
          "nl": "Of alle componenten geldige open-source licenties hebben",
          "fr": "Si tous les composants disposent de licences open source valides",
          "it": "Se tutti i componenti hanno licenze open source valide",
          "es": "Si todos los componentes tienen licencias de código abierto válidas",
          "pl": "Czy wszystkie komponenty posiadają ważne licencje open source",
          "cs": "Zda všechny komponenty mají platné licence open-source",
          "pt": "Se todos os componentes têm licenças de código aberto válidas",
          "ro": "Dacă toate componentele au licențe open-source valide"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "Schema validation using the CycloneDX CLI (or equivalent SPDX validator) checks that the SBOM document conforms to the format specification: required fields are present, data types are correct, PURLs are well-formed. It does not check vulnerability status or legal compliance.",
        "de": "Die Schemavalidierung mit dem CycloneDX-CLI (oder einem gleichwertigen SPDX-Validator) prüft, ob das SBOM-Dokument der Formatspezifikation entspricht: Pflichtfelder sind vorhanden, Datentypen sind korrekt, PURLs sind wohlgeformt. Sie prüft weder den Schwachstellenstatus noch die rechtliche Konformität.",
        "nl": "Schema validatie met de CycloneDX CLI (of een equivalente SPDX-validator) controleert dat het SBOM-document voldoet aan de formatspecificatie: verplichte velden zijn aanwezig, gegevenstypen zijn correct en PURLs zijn goed gevormd. Het controleert geen kwetsbaarheden of juridische naleving.",
        "fr": "La validation du schéma à l'aide de la CLI CycloneDX (ou d'un validateur SPDX équivalent) vérifie que le document SBOM respecte la spécification de format : les champs obligatoires sont présents, les types de données sont corrects, les PURL sont bien formés. Elle ne vérifie pas l'état des vulnérabilités ni la conformité légale.",
        "it": "La convalida dello schema tramite CycloneDX CLI (o validatore SPDX equivalente) verifica che il documento SBOM sia conforme alla specifica del formato: i campi obbligatori sono presenti, i tipi di dati sono corretti, i PURL sono ben formati. Non controlla lo stato delle vulnerabilità né la conformità legale.",
        "es": "La validación del esquema mediante la CLI de CycloneDX (o el validador SPDX equivalente) comprueba que el documento SBOM se ajusta a la especificación de formato: los campos obligatorios están presentes, los tipos de datos son correctos y los PURL están bien formados. No comprueba el estado de vulnerabilidades ni el cumplimiento legal.",
        "pl": "Walidacja schematu za pomocą CycloneDX CLI (lub równoważnego walidatora SPDX) sprawdza, czy dokument SBOM jest zgodny ze specyfikacją formatu: wymagane pola są obecne, typy danych są poprawne, a PURL są poprawnie sformułowane. Nie sprawdza statusu podatności ani zgodności prawnej.",
        "cs": "Validace schématu pomocí CycloneDX CLI (nebo ekvivalentního validátoru SPDX) kontroluje, zda dokument SBOM odpovídá specifikaci formátu: povinná pole jsou přítomna, datové typy jsou správné, PURL jsou správně formátovány. Nekontroluje stav zranitelností ani právní soulad.",
        "pt": "A validação de esquema usando o CycloneDX CLI (ou validador SPDX equivalente) verifica se o documento SBOM está em conformidade com a especificação de formato: os campos obrigatórios estão presentes, os tipos de dados estão corretos, os PURLs estão bem formados. Não verifica o estado de vulnerabilidade nem a conformidade legal.",
        "ro": "Validarea schemei folosind CycloneDX CLI (sau validatorul SPDX echivalent) verifică că documentul SBOM respectă specificația formatului: câmpurile obligatorii sunt prezente, tipurile de date sunt corecte, PURL-urile sunt bine formate. Nu verifică statusul de vulnerabilitate sau conformitatea legală."
      }
    },
    {
      "id": "3.1.5",
      "question": {
        "en": "What is the benefit of signing an SBOM with a tool like Cosign?",
        "de": "Welchen Nutzen hat die Signierung einer SBOM mit einem Tool wie Cosign?",
        "nl": "Wat is het voordeel van het ondertekenen van een SBOM met een tool zoals Cosign?",
        "fr": "Quel est l'avantage de signer un SBOM avec un outil comme Cosign ?",
        "it": "Qual è il vantaggio di firmare un SBOM con uno strumento come Cosign?",
        "es": "¿Cuál es la ventaja de firmar un SBOM con una herramienta como Cosign?",
        "pl": "Jakie korzyści daje podpisanie SBOM narzędziem takim jak Cosign?",
        "cs": "Jaká je výhoda podepsání SBOM nástrojem jako Cosign?",
        "pt": "Qual é o benefício de assinar uma SBOM com uma ferramenta como o Cosign?",
        "ro": "Care este beneficiul semnării unui SBOM cu un instrument precum Cosign?"
      },
      "options": [
        {
          "en": "It encrypts the SBOM so only the market surveillance authority can read it",
          "de": "Sie verschlüsselt die SBOM, sodass nur die Marktüberwachungsbehörde sie lesen kann",
          "nl": "Het versleutelt de SBOM zodat alleen de markttoezichtautoriteit deze kan lezen",
          "fr": "Cela chiffre le SBOM afin que seule l'autorité de surveillance du marché puisse le lire",
          "it": "Crittografa l'SBOM in modo che solo l'autorità di vigilanza del mercato possa leggerlo",
          "es": "Cifra el SBOM para que solo la autoridad de vigilancia del mercado pueda leerlo",
          "pl": "Szyfruje SBOM, dzięki czemu tylko organ nadzoru rynku może go odczytać",
          "cs": "Zašifruje SBOM, takže jej může číst pouze orgán dohledu nad trhem",
          "pt": "Encripta a SBOM para que apenas a autoridade de vigilância do mercado possa lê-la",
          "ro": "Criptează SBOM-ul astfel încât doar autoritatea de supraveghere a pieței să îl poată citi"
        },
        {
          "en": "It creates a chain of custody: cryptographic proof that the SBOM was produced at a specific point in time by your build system and has not been altered since",
          "de": "Sie erzeugt eine Nachweiskette: einen kryptografischen Beleg, dass die SBOM zu einem bestimmten Zeitpunkt durch Ihr Build-System erzeugt wurde und seither nicht verändert wurde",
          "nl": "Het creëert een keten van bewijs: cryptografisch bewijs dat de SBOM op een specifiek tijdstip door uw build systeem is geproduceerd en sindsdien niet is gewijzigd",
          "fr": "Cela crée une chaîne de traçabilité : une preuve cryptographique que le SBOM a été produit à un moment précis par votre système de build et n'a pas été modifié depuis",
          "it": "Crea una catena di custodia: prova crittografica che l'SBOM è stato prodotto in un momento specifico dal sistema di build e non è stato alterato da allora",
          "es": "Crea una cadena de custodia: prueba criptográfica de que el SBOM fue producido en un momento específico por su sistema de compilación y no ha sido alterado desde entonces",
          "pl": "Tworzy łańcuch nadzoru: dowód kryptograficzny, że SBOM został wygenerowany w określonym momencie przez system budowy i nie został od tego czasu zmieniony",
          "cs": "Vytváří řetězec péče: kryptografický důkaz, že SBOM byl vytvořen v konkrétním okamžiku vaším buildovacím systémem a od té doby nebyl změněn",
          "pt": "Cria uma cadeia de custódia: prova criptográfica de que a SBOM foi produzida num ponto específico no tempo pelo seu sistema de compilação e não foi alterada desde então",
          "ro": "Creează un lanț de custodie: dovada criptografică că SBOM-ul a fost produs la un moment specific în timp de sistemul tău de build și nu a fost alterat de atunci"
        },
        {
          "en": "It automatically submits the SBOM to ENISA for compliance registration",
          "de": "Sie übermittelt die SBOM automatisch an ENISA zur Compliance-Registrierung",
          "nl": "Het dient de SBOM automatisch in bij ENISA voor compliance registratie",
          "fr": "Cela soumet automatiquement le SBOM à ENISA pour l'enregistrement de conformité",
          "it": "Invia automaticamente l'SBOM a ENISA per la registrazione di conformità",
          "es": "Envía automáticamente el SBOM a ENISA para el registro de cumplimiento",
          "pl": "Automatycznie przesyła SBOM do ENISA w celu rejestracji zgodności",
          "cs": "Automaticky předkládá SBOM ENISA pro registraci souladu",
          "pt": "Submete automaticamente a SBOM à ENISA para registo de conformidade",
          "ro": "Trimite automat SBOM-ul către ENISA pentru înregistrarea conformității"
        },
        {
          "en": "It validates the SBOM against the CycloneDX schema",
          "de": "Sie validiert die SBOM gegen das CycloneDX-Schema",
          "nl": "Het valideert de SBOM tegen het CycloneDX-schema",
          "fr": "Cela valide le SBOM par rapport au schéma CycloneDX",
          "it": "Convalida l'SBOM rispetto allo schema CycloneDX",
          "es": "Valida el SBOM frente al esquema de CycloneDX",
          "pl": "Waliduje SBOM względem schematu CycloneDX",
          "cs": "Validuje SBOM proti schématu CycloneDX",
          "pt": "Valida a SBOM em relação ao esquema do CycloneDX",
          "ro": "Validează SBOM-ul conform schemei CycloneDX"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "A Cosign signature proves that the SBOM was generated by your build system (not modified after the fact) at a specific time. This chain of custody strengthens the evidentiary value of the SBOM in an Article 14 audit or a market surveillance authority review.",
        "de": "Eine Cosign-Signatur beweist, dass die SBOM von Ihrem Build-System erzeugt wurde (und nicht nachträglich verändert wurde) und zwar zu einem bestimmten Zeitpunkt. Diese Nachweiskette erhöht den Beweiswert der SBOM bei einem Artikel-14-Audit oder einer Prüfung durch die Marktüberwachungsbehörde.",
        "nl": "Een Cosign-handtekening bewijst dat de SBOM door uw build systeem is gegenereerd (niet achteraf gewijzigd) op een specifiek tijdstip. Deze keten van bewijs versterkt de bewijswaarde van de SBOM bij een Artikel 14-audit of een beoordeling door de markttoezichtautoriteit.",
        "fr": "Une signature Cosign prouve que le SBOM a été généré par votre système de build (et non modifié après coup) à un moment précis. Cette chaîne de traçabilité renforce la valeur probante du SBOM lors d'un audit au titre de l'Article 14 ou d'un examen par une autorité de surveillance du marché.",
        "it": "Una firma Cosign prova che l'SBOM è stato generato dal sistema di build (non modificato in seguito) in un momento specifico. Questa catena di custodia rafforza il valore probatorio dell'SBOM in un audit ai sensi dell'Articolo 14 o in una revisione da parte dell'autorità di vigilanza del mercato.",
        "es": "Una firma de Cosign demuestra que el SBOM fue generado por su sistema de compilación (y no modificado después) en un momento específico. Esta cadena de custodia refuerza el valor probatorio del SBOM en una auditoría del Artículo 14 o en una revisión de la autoridad de vigilancia del mercado.",
        "pl": "Podpis Cosign potwierdza, że SBOM został wygenerowany przez system budowy (a nie zmodyfikowany później) w określonym czasie. Taki łańcuch nadzoru wzmacnia wartość dowodową SBOM podczas audytu na podstawie Artykuł 14 lub przeglądu przez organ nadzoru rynku.",
        "cs": "Podpis Cosign dokazuje, že SBOM byl vygenerován vaším buildovacím systémem (ne upraven po faktu) v konkrétním čase. Tento řetězec péče posiluje důkazní hodnotu SBOM při auditu podle Článku 14 nebo přezkumu orgánem dohledu nad trhem.",
        "pt": "Uma assinatura Cosign prova que a SBOM foi gerada pelo seu sistema de compilação (não modificada posteriormente) num momento específico. Esta cadeia de custódia reforça o valor probatório da SBOM numa auditoria do Artigo 14 ou numa revisão pela autoridade de vigilância do mercado.",
        "ro": "O semnătură Cosign dovedește că SBOM-ul a fost generat de sistemul tău de build (nu modificat ulterior) la un moment specific. Acest lanț de custodie întărește valoarea probatorie a SBOM-ului într-un audit conform Articolului 14 sau o revizuire de către autoritatea de supraveghere a pieței."
      }
    }
  ]
});

export default quiz;
