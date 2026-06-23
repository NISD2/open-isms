import { quizSchema } from "@/lib/training/schemas";

// AUTHORING RULE: every question must be answerable from its lesson text alone.
// Locale values are filled from the `en` source by scripts/i18n/translate-course.ts.
const quiz = quizSchema.parse({
  "lessonId": "1.3",
  "passingScore": 75,
  "questions": [
    {
      "id": "1.3.1",
      "question": {
        "en": "What is the minimum retention period for the SBOM under CRA Article 13(13)?",
        "de": "Wie lang ist die Mindestaufbewahrungsfrist für die SBOM gemäß CRA Artikel 13(13)?",
        "nl": "Wat is de minimale bewaartermijn voor de SBOM onder CRA Artikel 13(13)?",
        "fr": "Quelle est la période de conservation minimale pour le SBOM en vertu de l'article 13(13) du CRA ?",
        "it": "Qual è il periodo minimo di conservazione dell'SBOM ai sensi del CRA Articolo 13(13)?",
        "es": "¿Cuál es el período mínimo de retención del SBOM según el CRA Artículo 13(13)?",
        "pl": "Jaki jest minimalny okres przechowywania SBOM zgodnie z CRA Artykuł 13(13)?",
        "cs": "Jaké je minimální období uchovávání SBOM podle CRA článek 13(13)?",
        "pt": "Qual é o período mínimo de conservação do SBOM ao abrigo do CRA Artigo 13(13)?",
        "ro": "Care este perioada minimă de păstrare pentru SBOM conform CRA Articolul 13(13)?"
      },
      "options": [
        {
          "en": "5 years after first placement on the market",
          "de": "5 Jahre nach erstmaliger Bereitstellung auf dem Markt",
          "nl": "5 jaar na eerste plaatsing op de markt",
          "fr": "5 ans après la première mise sur le marché",
          "it": "5 anni dopo la prima immissione sul mercato",
          "es": "5 años después de la primera comercialización",
          "pl": "5 lat po pierwszym wprowadzeniu do obrotu",
          "cs": "5 let po prvním uvedení na trh",
          "pt": "5 anos após a primeira colocação no mercado",
          "ro": "5 ani după prima introducere pe piață"
        },
        {
          "en": "10 years after first placement on the market, or for the support period, whichever is longer",
          "de": "10 Jahre nach erstmaliger Bereitstellung auf dem Markt oder für den Unterstützungszeitraum, je nachdem, welcher länger ist",
          "nl": "10 jaar na eerste plaatsing op de markt, of gedurende de ondersteuningsperiode, afhankelijk van welke langer is",
          "fr": "10 ans après la première mise sur le marché, ou pour la période de support, selon la durée la plus longue",
          "it": "10 anni dopo la prima immissione sul mercato, o per il periodo di supporto, a seconda di quale sia più lungo",
          "es": "10 años después de la primera comercialización, o durante el período de soporte, el que sea más largo",
          "pl": "10 lat po pierwszym wprowadzeniu do obrotu lub przez okres wsparcia, w zależności od tego, który jest dłuższy",
          "cs": "10 let po prvním uvedení na trh nebo po dobu podpory, podle toho, co je delší",
          "pt": "10 anos após a primeira colocação no mercado, ou durante o período de suporte, consoante o que for mais longo",
          "ro": "10 ani după prima introducere pe piață sau pe durata perioadei de suport, oricare este mai lungă"
        },
        {
          "en": "3 years, or until a new product version is released",
          "de": "3 Jahre oder bis eine neue Produktversion veröffentlicht wird",
          "nl": "3 jaar, of tot een nieuwe productversie is uitgebracht",
          "fr": "3 ans, ou jusqu'à la sortie d'une nouvelle version du produit",
          "it": "3 anni, o fino al rilascio di una nuova versione del prodotto",
          "es": "3 años, o hasta que se publique una nueva versión del producto",
          "pl": "3 lata lub do czasu wydania nowej wersji produktu",
          "cs": "3 roky nebo do vydání nové verze produktu",
          "pt": "3 anos, ou até ao lançamento de uma nova versão do produto",
          "ro": "3 ani sau până la lansarea unei noi versiuni a produsului"
        },
        {
          "en": "7 years after the product is withdrawn from the market",
          "de": "7 Jahre nachdem das Produkt vom Markt genommen wurde",
          "nl": "7 jaar nadat het product van de markt is gehaald",
          "fr": "7 ans après le retrait du produit du marché",
          "it": "7 anni dopo il ritiro del prodotto dal mercato",
          "es": "7 años después de que el producto se retire del mercado",
          "pl": "7 lat po wycofaniu produktu z rynku",
          "cs": "7 let po stažení produktu z trhu",
          "pt": "7 anos após a retirada do produto do mercado",
          "ro": "7 ani după retragerea produsului de pe piață"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "CRA Article 13(13) requires technical documentation to be kept for 10 years after the product is placed on the market, or for the support period, whichever is longer. For long-lived industrial products, the support period may exceed 10 years.",
        "de": "CRA Artikel 13(13) schreibt vor, die technische Dokumentation 10 Jahre nach Bereitstellung des Produkts auf dem Markt oder für den Unterstützungszeitraum aufzubewahren, je nachdem, welcher länger ist. Bei langlebigen Industrieprodukten kann der Unterstützungszeitraum 10 Jahre überschreiten.",
        "nl": "CRA Artikel 13(13) vereist dat de technische documentatie 10 jaar na het op de markt brengen van het product wordt bewaard, of gedurende de ondersteuningsperiode, afhankelijk van welke langer is. Voor langlevende industriële producten kan de ondersteuningsperiode langer dan 10 jaar bedragen.",
        "fr": "L'article 13(13) du CRA exige que la documentation technique soit conservée pendant 10 ans après la mise sur le marché du produit, ou pour la période de support, selon la durée la plus longue. Pour les produits industriels à longue durée de vie, la période de support peut dépasser 10 ans.",
        "it": "Il CRA Articolo 13(13) richiede che la documentazione tecnica sia conservata per 10 anni dopo l'immissione del prodotto sul mercato, o per il periodo di supporto, a seconda di quale sia più lungo. Per i prodotti industriali a lunga durata, il periodo di supporto può superare i 10 anni.",
        "es": "El CRA Artículo 13(13) exige que la documentación técnica se conserve durante 10 años después de que el producto se comercialice, o durante el período de soporte, el que sea más largo. Para productos industriales de larga duración, el período de soporte puede superar los 10 años.",
        "pl": "CRA Artykuł 13(13) wymaga przechowywania dokumentacji technicznej przez 10 lat po wprowadzeniu produktu do obrotu lub przez okres wsparcia, w zależności od tego, który jest dłuższy. W przypadku długowiecznych produktów przemysłowych okres wsparcia może przekraczać 10 lat.",
        "cs": "CRA článek 13(13) vyžaduje, aby technická dokumentace byla uchovávána 10 let po uvedení produktu na trh nebo po dobu podpory, podle toho, co je delší. U průmyslových produktů s dlouhou životností může doba podpory přesáhnout 10 let.",
        "pt": "O CRA Artigo 13(13) exige que a documentação técnica seja conservada durante 10 anos após a colocação do produto no mercado, ou durante o período de suporte, consoante o que for mais longo. Para produtos industriais de longa duração, o período de suporte pode exceder 10 anos.",
        "ro": "CRA Articolul 13(13) impune păstrarea documentației tehnice timp de 10 ani după introducerea produsului pe piață sau pe durata perioadei de suport, oricare este mai lungă. Pentru produsele industriale cu durată lungă de viață, perioada de suport poate depăși 10 ani."
      }
    },
    {
      "id": "1.3.2",
      "question": {
        "en": "Who can request the technical documentation, including the SBOM, under the CRA?",
        "de": "Wer kann die technische Dokumentation einschließlich der SBOM nach dem CRA anfordern?",
        "nl": "Wie kan de technische documentatie, inclusief de SBOM, opvragen op grond van de CRA?",
        "fr": "Qui peut demander la documentation technique, y compris le SBOM, en vertu du CRA ?",
        "it": "Chi può richiedere la documentazione tecnica, inclusa l'SBOM, ai sensi del CRA?",
        "es": "¿Quién puede solicitar la documentación técnica, incluido el SBOM, según el CRA?",
        "pl": "Kto może żądać dokumentacji technicznej, w tym SBOM, na podstawie CRA?",
        "cs": "Kdo může podle CRA požadovat technickou dokumentaci včetně SBOM?",
        "pt": "Quem pode solicitar a documentação técnica, incluindo o SBOM, ao abrigo do CRA?",
        "ro": "Cine poate solicita documentația tehnică, inclusiv SBOM, conform CRA?"
      },
      "options": [
        {
          "en": "Any member of the public who can demonstrate a security interest",
          "de": "Jede Person, die ein Sicherheitsinteresse nachweisen kann",
          "nl": "Ieder lid van het publiek dat een veiligheidsbelang kan aantonen",
          "fr": "Tout membre du public pouvant démontrer un intérêt en matière de sécurité",
          "it": "Qualsiasi membro del pubblico che possa dimostrare un interesse in materia di sicurezza",
          "es": "Cualquier miembro del público que pueda demostrar un interés de seguridad",
          "pl": "Każdy członek społeczeństwa, który może wykazać interes bezpieczeństwa",
          "cs": "Každý člen veřejnosti, který může prokázat bezpečnostní zájem",
          "pt": "Qualquer membro do público que consiga demonstrar um interesse de segurança",
          "ro": "Orice membru al publicului care poate demonstra un interes de securitate"
        },
        {
          "en": "Only the manufacturer's customers under GDPR data access rights",
          "de": "Nur die Kunden des Herstellers aufgrund von GDPR Datenzugriffsrechten",
          "nl": "Alleen de klanten van de fabrikant op grond van GDPR-gegevensrechten",
          "fr": "Uniquement les clients du fabricant au titre des droits d'accès aux données du GDPR",
          "it": "Solo i clienti del produttore ai sensi dei diritti di accesso ai dati del GDPR",
          "es": "Solo los clientes del fabricante según los derechos de acceso a datos del GDPR",
          "pl": "Tylko klienci producenta na podstawie praw dostępu do danych wynikających z GDPR",
          "cs": "Pouze zákazníci výrobce podle práv na přístup k údajům podle GDPR",
          "pt": "Apenas os clientes do fabricante ao abrigo dos direitos de acesso a dados do GDPR",
          "ro": "Doar clienții producătorului conform drepturilor de acces la date din GDPR"
        },
        {
          "en": "National market surveillance authorities",
          "de": "Nationale Marktüberwachungsbehörden",
          "nl": "Nationale markttoezichtautoriteiten",
          "fr": "Les autorités nationales de surveillance du marché",
          "it": "Le autorità nazionali di vigilanza del mercato",
          "es": "Autoridades nacionales de vigilancia del mercado",
          "pl": "Krajowe organy nadzoru rynku",
          "cs": "Vnitrostátní orgány dohledu nad trhem",
          "pt": "Autoridades nacionais de fiscalização do mercado",
          "ro": "Autoritățile naționale de supraveghere a pieței"
        },
        {
          "en": "ENISA and the European Commission only",
          "de": "Nur ENISA und die Europäische Kommission",
          "nl": "Alleen ENISA en de Europese Commissie",
          "fr": "Uniquement ENISA et la Commission européenne",
          "it": "Solo ENISA e la Commissione europea",
          "es": "Solo ENISA y la Comisión Europea",
          "pl": "Tylko ENISA i Komisja Europejska",
          "cs": "Pouze ENISA a Evropská komise",
          "pt": "Apenas a ENISA e a Comissão Europeia",
          "ro": "Doar ENISA și Comisia Europeană"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "Market surveillance authorities (national bodies such as the BSI in Germany) can request technical documentation at any time. The SBOM is not a public document and does not have to be made available to customers or the general public.",
        "de": "Marktüberwachungsbehörden (nationale Stellen wie die BSI in Deutschland) können die technische Dokumentation jederzeit anfordern. Die SBOM ist kein öffentliches Dokument und muss Kunden oder der Allgemeinheit nicht zur Verfügung gestellt werden.",
        "nl": "Markttoezichtautoriteiten (nationale instanties zoals de BSI in Duitsland) kunnen te allen tijde technische documentatie opvragen. De SBOM is geen openbaar document en hoeft niet beschikbaar te worden gesteld aan klanten of het algemene publiek.",
        "fr": "Les autorités de surveillance du marché (organismes nationaux tels que le BSI en Allemagne) peuvent demander la documentation technique à tout moment. Le SBOM n'est pas un document public et n'a pas à être mis à disposition des clients ou du grand public.",
        "it": "Le autorità di vigilanza del mercato (organismi nazionali come il BSI in Germania) possono richiedere la documentazione tecnica in qualsiasi momento. L'SBOM non è un documento pubblico e non deve essere reso disponibile ai clienti o al pubblico in generale.",
        "es": "Las autoridades de vigilancia del mercado (organismos nacionales como el BSI en Alemania) pueden solicitar la documentación técnica en cualquier momento. El SBOM no es un documento público y no tiene que ponerse a disposición de los clientes o del público en general.",
        "pl": "Organy nadzoru rynku (krajowe podmioty takie jak BSI w Niemczech) mogą żądać dokumentacji technicznej w dowolnym momencie. SBOM nie jest dokumentem publicznym i nie musi być udostępniany klientom ani ogółowi społeczeństwa.",
        "cs": "Orgány dohledu nad trhem (vnitrostátní orgány jako BSI v Německu) mohou kdykoli požadovat technickou dokumentaci. SBOM není veřejný dokument a nemusí být zpřístupněn zákazníkům ani široké veřejnosti.",
        "pt": "As autoridades de fiscalização do mercado (organismos nacionais como o BSI na Alemanha) podem solicitar documentação técnica em qualquer momento. O SBOM não é um documento público e não tem de ser disponibilizado aos clientes ou ao público em geral.",
        "ro": "Autoritățile de supraveghere a pieței (autorități naționale precum BSI în Germania) pot solicita documentația tehnică în orice moment. SBOM nu este un document public și nu trebuie pus la dispoziția clienților sau a publicului larg."
      }
    },
    {
      "id": "1.3.3",
      "question": {
        "en": "A manufacturer releases 20 security patches for a product over three years. How many SBOMs must be retained?",
        "de": "Ein Hersteller veröffentlicht über drei Jahre 20 Sicherheitspatches für ein Produkt. Wie viele SBOMs müssen aufbewahrt werden?",
        "nl": "Een fabrikant brengt 20 beveiligingspatches uit voor een product over drie jaar. Hoeveel SBOMs moeten worden bewaard?",
        "fr": "Un fabricant publie 20 correctifs de sécurité pour un produit sur trois ans. Combien de SBOMs doivent être conservés ?",
        "it": "Un produttore rilascia 20 patch di sicurezza per un prodotto in tre anni. Quanti SBOM devono essere conservati?",
        "es": "Un fabricante publica 20 parches de seguridad para un producto durante tres años. ¿Cuántos SBOM deben conservarse?",
        "pl": "Producent wydaje 20 poprawek bezpieczeństwa dla produktu w ciągu trzech lat. Ile SBOM należy przechowywać?",
        "cs": "Výrobce vydá 20 bezpečnostních záplat pro produkt během tří let. Kolik SBOM musí být uchováno?",
        "pt": "Um fabricante lança 20 correções de segurança para um produto ao longo de três anos. Quantos SBOMs devem ser conservados?",
        "ro": "Un producător lansează 20 de patch-uri de securitate pentru un produs pe o perioadă de trei ani. Câte SBOM-uri trebuie păstrate?"
      },
      "options": [
        {
          "en": "Only the latest SBOM needs to be retained",
          "de": "Nur die neueste SBOM muss aufbewahrt werden",
          "nl": "Alleen de meest recente SBOM hoeft te worden bewaard",
          "fr": "Seul le dernier SBOM doit être conservé",
          "it": "Deve essere conservato solo l'SBOM più recente",
          "es": "Solo es necesario conservar el SBOM más reciente",
          "pl": "Należy przechowywać tylko najnowszy SBOM",
          "cs": "Je třeba uchovávat pouze nejnovější SBOM",
          "pt": "Apenas o SBOM mais recente precisa de ser conservado",
          "ro": "Doar cel mai recent SBOM trebuie păstrat"
        },
        {
          "en": "One SBOM per year is sufficient",
          "de": "Eine SBOM pro Jahr genügt",
          "nl": "Eén SBOM per jaar is voldoende",
          "fr": "Un SBOM par an suffit",
          "it": "Un SBOM all'anno è sufficiente",
          "es": "Un SBOM por año es suficiente",
          "pl": "Wystarczy jeden SBOM rocznie",
          "cs": "Jeden SBOM za rok stačí",
          "pt": "Um SBOM por ano é suficiente",
          "ro": "Un SBOM pe an este suficient"
        },
        {
          "en": "An SBOM for each release version, 20 SBOMs in this case",
          "de": "Eine SBOM für jede Releaseversion, in diesem Fall 20 SBOMs",
          "nl": "Een SBOM voor elke releaseversie, in dit geval 20 SBOMs",
          "fr": "Un SBOM par version publiée, soit 20 SBOMs dans ce cas",
          "it": "Un SBOM per ciascuna versione rilasciata, 20 SBOM in questo caso",
          "es": "Un SBOM para cada versión de lanzamiento, 20 SBOM en este caso",
          "pl": "SBOM dla każdej wersji wydania, w tym przypadku 20 SBOM",
          "cs": "SBOM pro každou vydanou verzi, v tomto případě 20 SBOM",
          "pt": "Um SBOM para cada versão lançada, 20 SBOMs neste caso",
          "ro": "Un SBOM pentru fiecare versiune lansată, 20 de SBOM-uri în acest caz"
        },
        {
          "en": "SBOMs only need to be retained for the final version of the product",
          "de": "SBOMs müssen nur für die endgültige Version des Produkts aufbewahrt werden",
          "nl": "SBOMs hoeven alleen voor de definitieve versie van het product te worden bewaard",
          "fr": "Les SBOMs ne doivent être conservés que pour la version finale du produit",
          "it": "Gli SBOM devono essere conservati solo per la versione finale del prodotto",
          "es": "Los SBOM solo deben conservarse para la versión final del producto",
          "pl": "SBOM należy przechowywać tylko dla ostatecznej wersji produktu",
          "cs": "SBOM je třeba uchovávat pouze pro finální verzi produktu",
          "pt": "Os SBOMs só precisam de ser conservados para a versão final do produto",
          "ro": "SBOM-urile trebuie păstrate doar pentru versiunea finală a produsului"
        }
      ],
      "correctIndex": 2,
      "explanation": {
        "en": "Each released version has its own component inventory. A market surveillance authority investigating a vulnerability from three years ago wants the SBOM from the version that was in the market at that time. Retain one SBOM per release, linked to that release's version and build.",
        "de": "Jede veröffentlichte Version besitzt ein eigenes Komponenteninventar. Eine Marktüberwachungsbehörde, die eine Schwachstelle aus der Zeit vor drei Jahren untersucht, benötigt die SBOM der Version, die damals auf dem Markt war. Bewahren Sie eine SBOM pro Release auf, verknüpft mit der Version und dem Build dieser Freigabe.",
        "nl": "Elke uitgebrachte versie heeft zijn eigen componenteninventaris. Een markttoezichtautoriteit die een kwetsbaarheid van drie jaar geleden onderzoekt, wil de SBOM van de versie die destijds op de markt was. Bewaar één SBOM per release, gekoppeld aan de versie en build van die release.",
        "fr": "Chaque version publiée possède son propre inventaire de composants. Une autorité de surveillance du marché qui enquête sur une vulnérabilité datant de trois ans souhaite le SBOM de la version qui était sur le marché à ce moment-là. Conservez un SBOM par publication, lié à la version et à la compilation correspondantes.",
        "it": "Ogni versione rilasciata ha il proprio inventario dei componenti. Un'autorità di vigilanza del mercato che indaga su una vulnerabilità di tre anni fa vuole l'SBOM della versione che era sul mercato in quel momento. Conservare un SBOM per ciascun rilascio, collegato alla versione e alla build di quel rilascio.",
        "es": "Cada versión publicada tiene su propio inventario de componentes. Una autoridad de vigilancia del mercado que investiga una vulnerabilidad de hace tres años quiere el SBOM de la versión que estaba en el mercado en ese momento. Conserve un SBOM por versión, vinculado a la versión y compilación de esa versión.",
        "pl": "Każda wydana wersja ma własny inwentarz komponentów. Organ nadzoru rynku badający lukę sprzed trzech lat chce uzyskać SBOM z wersji, która znajdowała się na rynku w tamtym czasie. Przechowuj jeden SBOM na wydanie, powiązany z wersją i kompilacją tego wydania.",
        "cs": "Každá vydaná verze má svůj vlastní soupis komponent. Orgán dohledu nad trhem, který vyšetřuje zranitelnost z doby před třemi lety, chce SBOM z verze, která byla v té době na trhu. Uchovávejte jeden SBOM na vydání, propojený s verzí a buildem daného vydání.",
        "pt": "Cada versão lançada tem o seu próprio inventário de componentes. Uma autoridade de fiscalização do mercado que investiga uma vulnerabilidade de há três anos quer o SBOM da versão que estava no mercado nessa altura. Conserve um SBOM por lançamento, associado à versão e compilação desse lançamento.",
        "ro": "Fiecare versiune lansată are propriul inventar de componente. O autoritate de supraveghere a pieței care investighează o vulnerabilitate din urmă cu trei ani dorește SBOM-ul de la versiunea care era pe piață la acel moment. Păstrați un SBOM per lansare, legat de versiunea și build-ul respectivei lansări."
      }
    },
    {
      "id": "1.3.4",
      "question": {
        "en": "The SBOM is part of which CRA document set?",
        "de": "Zu welchem CRA-Dokumentsatz gehört die SBOM?",
        "nl": "Tot welke CRA-documentset behoort de SBOM?",
        "fr": "Le SBOM fait partie de quel ensemble de documents du CRA ?",
        "it": "L'SBOM fa parte di quale insieme di documenti CRA?",
        "es": "¿El SBOM forma parte de qué conjunto de documentos del CRA?",
        "pl": "SBOM wchodzi w skład którego zbioru dokumentów CRA?",
        "cs": "SBOM je součástí které sady dokumentů CRA?",
        "pt": "O SBOM faz parte de que conjunto de documentos do CRA?",
        "ro": "SBOM face parte din care set de documente CRA?"
      },
      "options": [
        {
          "en": "The EU declaration of conformity",
          "de": "Die EU-Konformitätserklärung",
          "nl": "De EU-conformiteitsverklaring",
          "fr": "La déclaration UE de conformité",
          "it": "La dichiarazione UE di conformità",
          "es": "La declaración UE de conformidad",
          "pl": "Deklaracja zgodności UE",
          "cs": "Prohlášení o shodě EU",
          "pt": "A declaração de conformidade da UE",
          "ro": "Declarația de conformitate UE"
        },
        {
          "en": "The technical documentation under Article 31 and Annex VII",
          "de": "Die technische Dokumentation gemäß Artikel 31 und Anhang VII",
          "nl": "De technische documentatie onder Artikel 31 en Bijlage VII",
          "fr": "La documentation technique au titre de l'article 31 et de l'annexe VII",
          "it": "La documentazione tecnica ai sensi dell'articolo 31 e dell'allegato VII",
          "es": "La documentación técnica según el Artículo 31 y el Anexo VII",
          "pl": "Dokumentacja techniczna na podstawie Artykuł 31 i Załącznik VII",
          "cs": "Technická dokumentace podle článku 31 a přílohy VII",
          "pt": "A documentação técnica ao abrigo do Artigo 31 e do Anexo VII",
          "ro": "Documentația tehnică conform articolului 31 și anexei VII"
        },
        {
          "en": "The vulnerability disclosure policy under Article 13(6)",
          "de": "Die Richtlinie zur Offenlegung von Schwachstellen gemäß Artikel 13(6)",
          "nl": "Het kwetsbaarheidsbekendmakingsbeleid onder Artikel 13(6)",
          "fr": "La politique de divulgation des vulnérabilités au titre de l'article 13(6)",
          "it": "La politica di divulgazione delle vulnerabilità ai sensi dell'articolo 13(6)",
          "es": "La política de divulgación de vulnerabilidades según el Artículo 13(6)",
          "pl": "Polityka ujawniania luk na podstawie Artykuł 13(6)",
          "cs": "Zásady zveřejňování zranitelností podle článku 13(6)",
          "pt": "A política de divulgação de vulnerabilidades ao abrigo do Artigo 13(6)",
          "ro": "Politica de divulgare a vulnerabilităților conform articolului 13(6)"
        },
        {
          "en": "The product safety data sheet",
          "de": "Das Produktsicherheitsdatenblatt",
          "nl": "Het productveiligheidsinformatieblad",
          "fr": "La fiche de données de sécurité du produit",
          "it": "La scheda dati di sicurezza del prodotto",
          "es": "La ficha de datos de seguridad del producto",
          "pl": "Karta charakterystyki produktu",
          "cs": "Bezpečnostní list produktu",
          "pt": "A ficha de dados de segurança do produto",
          "ro": "Fișa cu date de securitate a produsului"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "The SBOM is one item in the technical documentation package required by Article 31 and detailed in Annex VII. The full package also includes the risk assessment, secure design documentation, test results, and the EU declaration of conformity.",
        "de": "Die SBOM ist ein Bestandteil des technischen Dokumentationspakets, das Artikel 31 vorschreibt und in Anhang VII näher beschreibt. Das vollständige Paket umfasst außerdem die Risikobewertung, die sichere Design-Dokumentation, die Testergebnisse und die EU-Konformitätserklärung.",
        "nl": "De SBOM is een onderdeel van het technische documentatiepakket dat vereist is door Artikel 31 en gedetailleerd in Bijlage VII. Het volledige pakket omvat ook de risicobeoordeling, de documentatie over het veilige ontwerp, testresultaten en de EU-conformiteitsverklaring.",
        "fr": "Le SBOM est un élément du dossier de documentation technique exigé par l'article 31 et détaillé à l'annexe VII. Le dossier complet comprend également l'évaluation des risques, la documentation de conception sécurisée, les résultats des tests et la déclaration UE de conformité.",
        "it": "L'SBOM è un elemento del pacchetto di documentazione tecnica richiesto dall'articolo 31 e dettagliato nell'allegato VII. Il pacchetto completo include anche la valutazione dei rischi, la documentazione di progettazione sicura, i risultati dei test e la dichiarazione UE di conformità.",
        "es": "El SBOM es un elemento del paquete de documentación técnica requerido por el Artículo 31 y detallado en el Anexo VII. El paquete completo también incluye la evaluación de riesgos, la documentación de diseño seguro, los resultados de pruebas y la declaración UE de conformidad.",
        "pl": "SBOM jest jedną z pozycji w pakiecie dokumentacji technicznej wymaganym przez Artykuł 31 i szczegółowo opisanym w Załącznik VII. Pełny pakiet obejmuje również ocenę ryzyka, dokumentację bezpiecznego projektowania, wyniki testów oraz deklarację zgodności UE.",
        "cs": "SBOM je jednou položkou v balíku technické dokumentace vyžadovaném článkem 31 a podrobně popsaném v příloze VII. Celý balík dále obsahuje posouzení rizik, dokumentaci zabezpečeného návrhu, výsledky testů a prohlášení o shodě EU.",
        "pt": "O SBOM é um item no pacote de documentação técnica exigido pelo Artigo 31 e detalhado no Anexo VII. O pacote completo inclui também a avaliação de riscos, a documentação de conceção segura, os resultados de testes e a declaração de conformidade da UE.",
        "ro": "SBOM este un element din pachetul de documentație tehnică necesar conform articolului 31 și detaliat în anexa VII. Pachetul complet include de asemenea evaluarea riscurilor, documentația de proiectare securizată, rezultatele testelor și declarația de conformitate UE."
      }
    },
    {
      "id": "1.3.5",
      "question": {
        "en": "Which storage approach best supports the 10-year retention requirement?",
        "de": "Welcher Speicheransatz unterstützt die 10-jährige Aufbewahrungspflicht am besten?",
        "nl": "Welke opslagaanpak ondersteunt het best de bewaartermijn van 10 jaar?",
        "fr": "Quelle approche de stockage répond le mieux à l'exigence de conservation de 10 ans ?",
        "it": "Quale approccio di archiviazione supporta al meglio il requisito di conservazione di 10 anni?",
        "es": "¿Qué enfoque de almacenamiento respalda mejor el requisito de retención de 10 años?",
        "pl": "Które podejście do przechowywania najlepiej wspiera wymóg 10-letniego okresu przechowywania?",
        "cs": "Který přístup k úložišti nejlépe podporuje požadavek na uchovávání po dobu 10 let?",
        "pt": "Que abordagem de armazenamento melhor suporta o requisito de conservação de 10 anos?",
        "ro": "Care abordare de stocare susține cel mai bine cerința de păstrare pe 10 ani?"
      },
      "options": [
        {
          "en": "Store only the current SBOM in your CI/CD system's artifact cache",
          "de": "Speichern Sie nur die aktuelle SBOM im Artefakt-Cache Ihres CI/CD-Systems",
          "nl": "Bewaar alleen de huidige SBOM in de artifact-cache van uw CI/CD-systeem",
          "fr": "Stocker uniquement le SBOM actuel dans le cache d'artefacts du système CI/CD",
          "it": "Archiviare solo l'SBOM corrente nella cache degli artefatti del sistema CI/CD",
          "es": "Almacene solo el SBOM actual en la caché de artefactos de su sistema CI/CD",
          "pl": "Przechowuj tylko bieżący SBOM w pamięci podręcznej artefaktów systemu CI/CD",
          "cs": "Ukládejte pouze aktuální SBOM do mezipaměti artefaktů vašeho systému CI/CD",
          "pt": "Armazene apenas o SBOM atual na cache de artefactos do seu sistema CI/CD",
          "ro": "Stocați doar SBOM-ul curent în cache-ul de artefacte al sistemului CI/CD"
        },
        {
          "en": "Store SBOMs in version control tagged with product version and build timestamp, using a format (JSON) that will remain readable",
          "de": "Speichern Sie SBOMs in der Versionsverwaltung mit Kennzeichnung durch Produktversion und Build-Zeitstempel und nutzen Sie ein Format (JSON), das auch später noch lesbar bleibt",
          "nl": "Bewaar SBOMs in versiebeheer, getagd met productversie en build-timestamp, met gebruik van een formaat (JSON) dat leesbaar blijft",
          "fr": "Stocker les SBOMs dans un système de contrôle de versions, étiquetés avec la version du produit et l'horodatage de la compilation, en utilisant un format (JSON) qui restera lisible",
          "it": "Archiviare gli SBOM nel controllo delle versioni etichettati con la versione del prodotto e il timestamp della build, utilizzando un formato (JSON) che rimarrà leggibile",
          "es": "Almacene los SBOM en el control de versiones etiquetados con la versión del producto y la marca de tiempo de compilación, utilizando un formato (JSON) que siga siendo legible",
          "pl": "Przechowuj SBOM w kontroli wersji oznaczone wersją produktu i znacznikiem czasu kompilacji, używając formatu (JSON), który pozostanie czytelny",
          "cs": "Ukládejte SBOM do správy verzí označené verzí produktu a časovým razítkem buildu, přičemž použijte formát (JSON), který zůstane čitelný",
          "pt": "Armazene os SBOMs no controlo de versões etiquetados com a versão do produto e o timestamp da compilação, usando um formato (JSON) que permanecerá legível",
          "ro": "Stocați SBOM-urile în controlul versiunilor etichetate cu versiunea produsului și timestamp-ul build-ului, utilizând un format (JSON) care va rămâne lizibil"
        },
        {
          "en": "Store SBOMs as PDFs attached to the product user manual",
          "de": "Speichern Sie SBOMs als PDF-Anhänge zum Produktbenutzerhandbuch",
          "nl": "Bewaar SBOMs als PDF's bijgevoegd bij de productgebruikershandleiding",
          "fr": "Stocker les SBOMs au format PDF joints au manuel utilisateur du produit",
          "it": "Archiviare gli SBOM come PDF allegati al manuale utente del prodotto",
          "es": "Almacene los SBOM como PDF adjuntos al manual de usuario del producto",
          "pl": "Przechowuj SBOM jako pliki PDF dołączone do instrukcji użytkownika produktu",
          "cs": "Ukládejte SBOM jako soubory PDF připojené k uživatelské příručce produktu",
          "pt": "Armazene os SBOMs como PDFs anexos ao manual do utilizador do produto",
          "ro": "Stocați SBOM-urile ca PDF-uri atașate manualului de utilizare al produsului"
        },
        {
          "en": "Regenerate SBOMs on demand using the current codebase whenever an authority requests one",
          "de": "Erzeugen Sie SBOMs bei Bedarf aus dem aktuellen Codebase neu, wenn eine Behörde eine anfordert",
          "nl": "Regenereer SBOMs op verzoek met behulp van de huidige codebase wanneer een autoriteit er een opvraagt",
          "fr": "Régénérer les SBOMs à la demande à partir du code source actuel chaque fois qu'une autorité en fait la demande",
          "it": "Rigenerare gli SBOM su richiesta utilizzando la codebase corrente ogni volta che un'autorità ne richiede uno",
          "es": "Regenerar los SBOM bajo demanda utilizando la base de código actual cada vez que una autoridad solicite uno",
          "pl": "Generuj SBOM na żądanie na podstawie bieżącej bazy kodu za każdym razem, gdy organ zgłasza takie żądanie",
          "cs": "Na vyžádání orgánu generujte SBOM znovu z aktuální kódové základny",
          "pt": "Regenere os SBOMs a pedido usando a base de código atual sempre que uma autoridade solicite um",
          "ro": "Regenerați SBOM-urile la cerere utilizând codebase-ul curent ori de câte ori o autoritate solicită unul"
        }
      ],
      "correctIndex": 1,
      "explanation": {
        "en": "SBOMs must be retained for each specific release version. Storing them in version control with version and timestamp tags creates the audit trail. Using standard JSON formats (CycloneDX, SPDX) ensures readability in 10 years. Regenerating from current code does not reproduce the state at release time.",
        "de": "SBOMs müssen für jede konkrete Releaseversion aufbewahrt werden. Die Speicherung in der Versionsverwaltung mit Versions- und Zeitstempelkennzeichen erzeugt die erforderliche Prüfspur. Die Verwendung standardisierter JSON-Formate (CycloneDX, SPDX) gewährleistet die Lesbarkeit nach 10 Jahren. Die Neuerzeugung aus dem aktuellen Code reproduziert nicht den Stand zum Zeitpunkt der Freigabe.",
        "nl": "SBOMs moeten voor elke specifieke releaseversie worden bewaard. Deze in versiebeheer opslaan met versietags en timestamp-tags creëert het audittrail. Het gebruik van standaard JSON-formaten (CycloneDX, SPDX) zorgt voor leesbaarheid over 10 jaar. Regenereren vanuit de huidige code reproduceert de staat op het moment van release niet.",
        "fr": "Les SBOMs doivent être conservés pour chaque version spécifique publiée. Les stocker dans un système de contrôle de versions avec des étiquettes de version et d'horodatage crée la piste d'audit. L'utilisation de formats JSON standard (CycloneDX, SPDX) garantit la lisibilité dans 10 ans. La régénération à partir du code actuel ne reproduit pas l'état au moment de la publication.",
        "it": "Gli SBOM devono essere conservati per ciascuna specifica versione rilasciata. Archiviarli nel controllo delle versioni con etichette di versione e timestamp crea la traccia di audit. L'uso di formati JSON standard (CycloneDX, SPDX) garantisce la leggibilità tra 10 anni. La rigenerazione dal codice corrente non riproduce lo stato al momento del rilascio.",
        "es": "Los SBOM deben conservarse para cada versión de lanzamiento específica. Almacenarlos en el control de versiones con etiquetas de versión y marca de tiempo crea la pista de auditoría. El uso de formatos JSON estándar (CycloneDX, SPDX) garantiza la legibilidad en 10 años. La regeneración a partir del código actual no reproduce el estado en el momento del lanzamiento.",
        "pl": "SBOM należy przechowywać dla każdej konkretnej wersji wydania. Przechowywanie ich w kontroli wersji z oznaczeniami wersji i znacznikami czasu tworzy ścieżkę audytu. Korzystanie ze standardowych formatów JSON (CycloneDX, SPDX) zapewnia czytelność za 10 lat. Generowanie na podstawie bieżącego kodu nie odtwarza stanu z momentu wydania.",
        "cs": "SBOM je třeba uchovávat pro každou konkrétní vydanou verzi. Jejich uložení ve správě verzí s označením verze a časového razítka vytváří auditní stopu. Použití standardních formátů JSON (CycloneDX, SPDX) zajišťuje čitelnost za 10 let. Generování z aktuálního kódu nereprodukuje stav v okamžiku vydání.",
        "pt": "Os SBOMs devem ser conservados para cada versão específica lançada. Armazená-los no controlo de versões com etiquetas de versão e timestamp cria o trilho de auditoria. Usar formatos JSON padrão (CycloneDX, SPDX) garante a legibilidade dentro de 10 anos. Regenerar a partir do código atual não reproduz o estado no momento do lançamento.",
        "ro": "SBOM-urile trebuie păstrate pentru fiecare versiune specifică de lansare. Stocarea lor în controlul versiunilor cu etichete de versiune și timestamp creează pista de audit. Utilizarea formatelor standard JSON (CycloneDX, SPDX) asigură lizibilitatea peste 10 ani. Regenerarea din codul curent nu reproduce starea de la momentul lansării."
      }
    }
  ]
});

export default quiz;
