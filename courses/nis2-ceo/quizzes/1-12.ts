import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.12",
  passingScore: 75,
  questions: [
    {
      id: "1.12.1",
      question: {
        en: "What is the difference between Article 23(2) and Article 36 customer notification?",
        de: "Was ist der Unterschied zwischen der Kundenbenachrichtigung nach Artikel 23 Absatz 2 und Artikel 36?",
        nl: "Wat is het verschil tussen klantnotificatie op grond van artikel 23(2) en artikel 36?",
        fr: "Quelle est la différence entre la notification aux clients au titre de l'article 23(2) et de l'article 36 ?",
        it: "Qual è la differenza tra la notifica ai clienti ai sensi dell'articolo 23(2) e dell'articolo 36?",
        es: "¿Cuál es la diferencia entre la notificación a los clientes del artículo 23(2) y la del artículo 36?",
        pl: "Jaka jest różnica między powiadomieniem klientów na podstawie artykułu 23(2) a artykułu 36?",
      },
      options: [
        { en: "Article 23(2) is optional; Article 36 is mandatory", de: "Artikel 23 Absatz 2 ist freiwillig; Artikel 36 ist verpflichtend", nl: "Artikel 23(2) is vrijwillig; artikel 36 is verplicht", fr: "L'article 23(2) est facultatif ; l'article 36 est obligatoire", it: "L'articolo 23(2) è facoltativo; l'articolo 36 è obbligatorio", es: "El artículo 23(2) es facultativo; el artículo 36 es obligatorio", pl: "Artykuł 23(2) jest fakultatywny; artykuł 36 jest obowiązkowy" },
        { en: "Article 23(2) is self-executing (triggers automatically when customers face an ongoing threat); Article 36 is regulator-ordered", de: "Artikel 23 Absatz 2 ist selbstwirkend (greift automatisch, wenn Kunden einer andauernden Bedrohung ausgesetzt sind); Artikel 36 wird von der Aufsichtsbehörde angeordnet", nl: "Artikel 23(2) is zelfuitvoerend (treedt automatisch in werking wanneer klanten een voortdurende dreiging ondervinden); artikel 36 wordt opgelegd door de toezichthouder", fr: "L'article 23(2) est d'application automatique (il se déclenche automatiquement lorsque les clients sont confrontés à une menace persistante) ; l'article 36 est ordonné par l'autorité de contrôle", it: "L'articolo 23(2) è ad applicazione automatica (si attiva automaticamente quando i clienti sono esposti a una minaccia in corso); l'articolo 36 è disposto dall'autorità di vigilanza", es: "El artículo 23(2) es de aplicación automática (se activa automáticamente cuando los clientes se enfrentan a una amenaza en curso); el artículo 36 lo ordena la autoridad reguladora", pl: "Artykuł 23(2) działa automatycznie (uruchamia się samoczynnie, gdy klienci są narażeni na trwające zagrożenie); artykuł 36 jest nakazywany przez organ nadzoru" },
        { en: "Article 23(2) applies only to Essential entities; Article 36 applies to all", de: "Artikel 23 Absatz 2 gilt nur für wesentliche Einrichtungen; Artikel 36 gilt für alle", nl: "Artikel 23(2) geldt alleen voor essentiële entiteiten; artikel 36 geldt voor alle entiteiten", fr: "L'article 23(2) ne s'applique qu'aux entités essentielles ; l'article 36 s'applique à toutes", it: "L'articolo 23(2) si applica solo ai soggetti essenziali; l'articolo 36 si applica a tutti", es: "El artículo 23(2) se aplica únicamente a las entidades esenciales; el artículo 36 se aplica a todas", pl: "Artykuł 23(2) dotyczy wyłącznie podmiotów kluczowych; artykuł 36 dotyczy wszystkich" },
        { en: "There is no difference; they are the same duty", de: "Es gibt keinen Unterschied; es handelt sich um dieselbe Pflicht", nl: "Er is geen verschil; het betreft dezelfde verplichting", fr: "Il n'y a aucune différence ; il s'agit de la même obligation", it: "Non c'è alcuna differenza; si tratta dello stesso obbligo", es: "No hay diferencia; se trata del mismo deber", pl: "Nie ma różnicy; jest to ten sam obowiązek" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(2) is self-executing and triggers the moment the entity becomes aware of the ongoing threat. Article 36 is the regulator's power to order customer notification.",
        de: "Artikel 23 Absatz 2 ist selbstwirkend und greift in dem Moment, in dem die Einrichtung von der andauernden Bedrohung Kenntnis erlangt. Artikel 36 ist die Befugnis der Aufsichtsbehörde, eine Kundenbenachrichtigung anzuordnen.",
        nl: "Artikel 23(2) is zelfuitvoerend en treedt in werking op het moment dat de entiteit kennis krijgt van de voortdurende dreiging. Artikel 36 is de bevoegdheid van de toezichthouder om klantnotificatie te bevelen.",
        fr: "L'article 23(2) est d'application automatique et se déclenche au moment où l'entité a connaissance de la menace persistante. L'article 36 est le pouvoir de l'autorité de contrôle d'ordonner la notification aux clients.",
        it: "L'articolo 23(2) è ad applicazione automatica e si attiva nel momento in cui il soggetto viene a conoscenza della minaccia in corso. L'articolo 36 è il potere dell'autorità di vigilanza di disporre la notifica ai clienti.",
        es: "El artículo 23(2) es de aplicación automática y se activa en el momento en que la entidad tiene conocimiento de la amenaza en curso. El artículo 36 es la facultad de la autoridad reguladora de ordenar la notificación a los clientes.",
        pl: "Artykuł 23(2) działa automatycznie i uruchamia się w chwili, gdy podmiot dowiaduje się o trwającym zagrożeniu. Artykuł 36 to uprawnienie organu nadzoru do nakazania powiadomienia klientów.",
      },
    },
    {
      id: "1.12.2",
      question: {
        en: "Under Article 23(2), what must you tell customers beyond the fact that there is a problem?",
        de: "Was müssen Sie Kunden gemäß Artikel 23 Absatz 2 über die Tatsache hinaus mitteilen, dass ein Problem vorliegt?",
        nl: "Wat moet u klanten op grond van artikel 23(2) meedelen naast het feit dat er een probleem is?",
        fr: "Au titre de l'article 23(2), que devez-vous indiquer aux clients au-delà du fait qu'il existe un problème ?",
        it: "Ai sensi dell'articolo 23(2), cosa dovete comunicare ai clienti oltre al fatto che esiste un problema?",
        es: "En virtud del artículo 23(2), ¿qué debe comunicar a los clientes más allá del hecho de que existe un problema?",
        pl: "Na podstawie artykułu 23(2), co muszą Państwo przekazać klientom poza samym faktem, że istnieje problem?",
      },
      options: [
        { en: "Nothing else is required", de: "Es sind keine weiteren Angaben erforderlich", nl: "Er zijn geen verdere mededelingen vereist", fr: "Aucune autre indication n'est requise", it: "Non è richiesta alcuna altra informazione", es: "No se requiere ninguna otra información", pl: "Nie są wymagane żadne dalsze informacje" },
        { en: "The name of the attacker and their methods", de: "Den Namen des Angreifers und seine Methoden", nl: "De naam van de aanvaller en hun methoden", fr: "Le nom de l'attaquant et ses méthodes", it: "Il nome dell'aggressore e i suoi metodi", es: "El nombre del atacante y sus métodos", pl: "Nazwę napastnika i jego metody" },
        { en: "Any measures or remedies the recipients can take in response to the threat", de: "Alle Maßnahmen oder Abhilfemöglichkeiten, die die Empfänger als Reaktion auf die Bedrohung ergreifen können", nl: "Alle maatregelen of herstelacties die de ontvangers kunnen nemen als reactie op de dreiging", fr: "Toutes les mesures ou solutions que les destinataires peuvent prendre en réponse à la menace", it: "Tutte le misure o i rimedi che i destinatari possono adottare in risposta alla minaccia", es: "Cualquier medida o solución que los destinatarios puedan adoptar en respuesta a la amenaza", pl: "Wszelkie środki lub rozwiązania, które odbiorcy mogą podjąć w odpowiedzi na zagrożenie" },
        { en: "The amount of the fine the company expects to receive", de: "Die Höhe des Bußgeldes, das das Unternehmen erwartet", nl: "De hoogte van de boete die de vennootschap verwacht te ontvangen", fr: "Le montant de l'amende que l'entreprise s'attend à recevoir", it: "L'importo della sanzione che l'impresa si aspetta di ricevere", es: "El importe de la multa que la empresa espera recibir", pl: "Wysokość kary, jakiej spodziewa się firma" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 23(2) requires you to disclose any measures or remedies that recipients are able to take in response to the threat.",
        de: "Artikel 23 Absatz 2 verlangt, dass Sie alle Maßnahmen oder Abhilfemöglichkeiten offenlegen, die die Empfänger als Reaktion auf die Bedrohung ergreifen können.",
        nl: "Artikel 23(2) vereist dat u alle maatregelen of herstelacties bekendmaakt die de ontvangers als reactie op de dreiging kunnen nemen.",
        fr: "L'article 23(2) exige que vous communiquiez toutes les mesures ou solutions que les destinataires sont en mesure de prendre en réponse à la menace.",
        it: "L'articolo 23(2) richiede che comunichiate tutte le misure o i rimedi che i destinatari sono in grado di adottare in risposta alla minaccia.",
        es: "El artículo 23(2) exige que comunique cualquier medida o solución que los destinatarios puedan adoptar en respuesta a la amenaza.",
        pl: "Artykuł 23(2) wymaga ujawnienia wszelkich środków lub rozwiązań, które odbiorcy są w stanie podjąć w odpowiedzi na zagrożenie.",
      },
    },
    {
      id: "1.12.3",
      question: {
        en: "What does the lesson recommend having prepared before an incident occurs?",
        de: "Was empfiehlt die Lektion, vor Eintritt eines Vorfalls vorbereitet zu haben?",
        nl: "Wat adviseert de les voorbereid te hebben voordat een incident plaatsvindt?",
        fr: "Que recommande la leçon d'avoir préparé avant qu'un incident ne survienne ?",
        it: "Cosa raccomanda la lezione di avere predisposto prima che si verifichi un incidente?",
        es: "¿Qué recomienda la lección tener preparado antes de que se produzca un incidente?",
        pl: "Co lekcja zaleca przygotować, zanim wystąpi incydent?",
      },
      options: [
        { en: "A press release template and social media strategy", de: "Eine Pressemitteilungsvorlage und Social-Media-Strategie", nl: "Een persbericht-sjabloon en sociale-mediastrategie", fr: "Un modèle de communiqué de presse et une stratégie de médias sociaux", it: "Un modello di comunicato stampa e una strategia per i social media", es: "Una plantilla de comunicado de prensa y una estrategia de redes sociales", pl: "Szablon komunikatu prasowego i strategię mediów społecznościowych" },
        { en: "A pre-drafted customer notification template and a defined approval chain ending with the management body", de: "Eine vorbereitete Kundenbenachrichtigungsvorlage und eine definierte Freigabekette, die bei der Geschäftsleitung endet", nl: "Een vooraf opgesteld klantnotificatiesjabloon en een vastgestelde goedkeuringsketen die eindigt bij het leidinggevend orgaan", fr: "Un modèle de notification aux clients pré-rédigé et une chaîne d'approbation définie se terminant par l'organe de direction", it: "Un modello di notifica ai clienti già predisposto e una catena di approvazione definita che termina con l'organo di gestione", es: "Una plantilla de notificación a los clientes redactada de antemano y una cadena de aprobación definida que termina en el órgano de dirección", pl: "Wcześniej przygotowany szablon powiadomienia klientów oraz zdefiniowaną ścieżkę zatwierdzania kończącą się na organie zarządzającym" },
        { en: "An insurance claim form and legal retainer agreement", de: "Ein Versicherungsschadenformular und eine Mandatsvereinbarung", nl: "Een verzekeringsschadeclaimformulier en een mandaatovereenkomst", fr: "Un formulaire de déclaration de sinistre et un contrat de mandat juridique", it: "Un modulo di richiesta di risarcimento assicurativo e un contratto di mandato legale", es: "Un formulario de reclamación al seguro y un contrato de retención jurídica", pl: "Formularz zgłoszenia szkody ubezpieczeniowej i umowę o stałą obsługę prawną" },
        { en: "A list of customers ranked by revenue for priority notification", de: "Eine nach Umsatz sortierte Kundenliste für priorisierte Benachrichtigung", nl: "Een lijst van klanten gerangschikt op omzet voor prioriteitsnotificatie", fr: "Une liste de clients classés par chiffre d'affaires pour une notification prioritaire", it: "Un elenco di clienti ordinati per fatturato per la notifica prioritaria", es: "Una lista de clientes ordenados por facturación para una notificación prioritaria", pl: "Listę klientów uszeregowaną według przychodów na potrzeby priorytetowego powiadamiania" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Have a pre-drafted customer notification template and a defined approval chain that ends with the management body.",
        de: "Halten Sie eine vorbereitete Kundenbenachrichtigungsvorlage und eine definierte Freigabekette bereit, die bei der Geschäftsleitung endet.",
        nl: "Zorg voor een vooraf opgesteld klantnotificatiesjabloon en een vastgestelde goedkeuringsketen die eindigt bij het leidinggevend orgaan.",
        fr: "Disposez d'un modèle de notification aux clients pré-rédigé et d'une chaîne d'approbation définie qui se termine par l'organe de direction.",
        it: "Disponete di un modello di notifica ai clienti già predisposto e di una catena di approvazione definita che termina con l'organo di gestione.",
        es: "Disponga de una plantilla de notificación a los clientes redactada de antemano y de una cadena de aprobación definida que termine en el órgano de dirección.",
        pl: "Należy mieć wcześniej przygotowany szablon powiadomienia klientów oraz zdefiniowaną ścieżkę zatwierdzania kończącą się na organie zarządzającym.",
      },
    },
  ],
});

export default quiz;
