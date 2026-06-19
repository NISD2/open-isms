import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.5",
  passingScore: 75,
  questions: [
    {
      id: "1.5.1",
      question: {
        en: "What three personal duties does Article 20(1) create for the management body?",
        de: "Welche drei persönlichen Pflichten begründet Artikel 20 Absatz 1 für die Geschäftsleitung?",
        nl: "Welke drie persoonlijke plichten schept Artikel 20(1) voor het leidinggevend orgaan?",
        fr: "Quelles sont les trois obligations personnelles que l'article 20(1) crée pour l'organe de direction ?",
        it: "Quali tre obblighi personali crea l'articolo 20(1) per l'organo di gestione?",
        es: "¿Qué tres deberes personales crea el artículo 20(1) para el órgano de dirección?",
        pl: "Jakie trzy osobiste obowiązki tworzy artykuł 20(1) dla organu zarządzającego?",
      },
      options: [
        { en: "Register, report, and train", de: "Registrieren, melden und schulen", nl: "Registreren, rapporteren en trainen", fr: "Enregistrer, notifier et former", it: "Registrare, notificare e formare", es: "Registrar, notificar y formar", pl: "Rejestrować, zgłaszać i szkolić" },
        { en: "Approve, oversee, and be liable", de: "Genehmigen, überwachen und haften", nl: "Goedkeuren, toezicht houden en aansprakelijk zijn", fr: "Approuver, superviser et être responsable", it: "Approvare, sorvegliare ed essere responsabile", es: "Aprobar, supervisar y ser responsable", pl: "Zatwierdzać, nadzorować i ponosić odpowiedzialność" },
        { en: "Plan, implement, and audit", de: "Planen, umsetzen und prüfen", nl: "Plannen, implementeren en controleren", fr: "Planifier, mettre en œuvre et auditer", it: "Pianificare, attuare e verificare", es: "Planificar, implementar y auditar", pl: "Planować, wdrażać i audytować" },
        { en: "Budget, hire, and delegate", de: "Budgetieren, einstellen und delegieren", nl: "Begroten, aanwerven en delegeren", fr: "Budgétiser, recruter et déléguer", it: "Definire il budget, assumere e delegare", es: "Presupuestar, contratar y delegar", pl: "Budżetować, zatrudniać i delegować" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 20(1) creates three duties: approve the measures, oversee their implementation, and be liable for infringements.",
        de: "Artikel 20 Absatz 1 begründet drei Pflichten: die Maßnahmen genehmigen, ihre Umsetzung überwachen und für Verstöße haften.",
        nl: "Artikel 20(1) schept drie plichten: de maatregelen goedkeuren, toezicht houden op de uitvoering ervan en aansprakelijk zijn voor overtredingen.",
        fr: "L'article 20(1) crée trois obligations : approuver les mesures, superviser leur mise en œuvre et être responsable des infractions.",
        it: "L'articolo 20(1) crea tre obblighi: approvare le misure, sorvegliarne l'attuazione ed essere responsabile delle violazioni.",
        es: "El artículo 20(1) crea tres deberes: aprobar las medidas, supervisar su implementación y ser responsable de las infracciones.",
        pl: "Artykuł 20(1) tworzy trzy obowiązki: zatwierdzać środki, nadzorować ich wdrażanie oraz ponosić odpowiedzialność za naruszenia.",
      },
    },
    {
      id: "1.5.2",
      question: {
        en: "Can the CISO approve the cybersecurity measures on behalf of the management body?",
        de: "Kann der CISO die Cybersicherheitsmaßnahmen im Namen der Geschäftsleitung genehmigen?",
        nl: "Kan de CISO de cyberbeveiligingsmaatregelen namens het leidinggevend orgaan goedkeuren?",
        fr: "Le CISO peut-il approuver les mesures de cybersécurité au nom de l'organe de direction ?",
        it: "Il CISO può approvare le misure di cybersicurezza per conto dell'organo di gestione?",
        es: "¿Puede el CISO aprobar las medidas de ciberseguridad en nombre del órgano de dirección?",
        pl: "Czy CISO może zatwierdzić środki cyberbezpieczeństwa w imieniu organu zarządzającego?",
      },
      options: [
        { en: "Yes, if the CEO delegates in writing", de: "Ja, wenn der Geschäftsführer schriftlich delegiert", nl: "Ja, als de CEO schriftelijk delegeert", fr: "Oui, si le dirigeant délègue par écrit", it: "Sì, se l'amministratore delegato delega per iscritto", es: "Sí, si el director general lo delega por escrito", pl: "Tak, jeśli dyrektor generalny przekaże uprawnienia na piśmie" },
        { en: "Yes, the CISO is the natural approver", de: "Ja, der CISO ist der natürliche Genehmiger", nl: "Ja, de CISO is de aangewezen goedkeurder", fr: "Oui, le CISO est l'approbateur naturel", it: "Sì, il CISO è l'approvatore naturale", es: "Sí, el CISO es el aprobador natural", pl: "Tak, CISO jest naturalną osobą zatwierdzającą" },
        { en: "No, the CISO can implement but only the management body can approve", de: "Nein, der CISO kann umsetzen, aber nur die Geschäftsleitung kann genehmigen", nl: "Nee, de CISO kan implementeren, maar alleen het leidinggevend orgaan kan goedkeuren", fr: "Non, le CISO peut mettre en œuvre, mais seul l'organe de direction peut approuver", it: "No, il CISO può attuare, ma solo l'organo di gestione può approvare", es: "No, el CISO puede implementar, pero solo el órgano de dirección puede aprobar", pl: "Nie, CISO może wdrażać, ale tylko organ zarządzający może zatwierdzać" },
        { en: "Only if the supervisory board agrees", de: "Nur wenn der Aufsichtsrat zustimmt", nl: "Alleen als de raad van commissarissen ermee instemt", fr: "Uniquement si le conseil de surveillance est d'accord", it: "Solo se il consiglio di sorveglianza è d'accordo", es: "Solo si el consejo de supervisión está de acuerdo", pl: "Tylko jeśli rada nadzorcza wyrazi zgodę" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The duty cannot be delegated. The CISO can implement the measures. Only the management body can approve them.",
        de: "Die Pflicht ist nicht delegierbar. Der CISO kann die Maßnahmen umsetzen. Nur die Geschäftsleitung kann sie genehmigen.",
        nl: "De plicht kan niet worden gedelegeerd. De CISO kan de maatregelen implementeren. Alleen het leidinggevend orgaan kan ze goedkeuren.",
        fr: "L'obligation ne peut pas être déléguée. Le CISO peut mettre en œuvre les mesures. Seul l'organe de direction peut les approuver.",
        it: "L'obbligo non può essere delegato. Il CISO può attuare le misure. Solo l'organo di gestione può approvarle.",
        es: "El deber no puede delegarse. El CISO puede implementar las medidas. Solo el órgano de dirección puede aprobarlas.",
        pl: "Obowiązku nie można delegować. CISO może wdrażać środki. Tylko organ zarządzający może je zatwierdzić.",
      },
    },
    {
      id: "1.5.3",
      question: {
        en: "What happens if a CEO exempts themselves from the controls they approved?",
        de: "Was passiert, wenn sich ein Geschäftsführer von den Kontrollen ausnimmt, die er selbst genehmigt hat?",
        nl: "Wat gebeurt er als een CEO zichzelf uitzondert van de controles die hij zelf heeft goedgekeurd?",
        fr: "Que se passe-t-il si un dirigeant s'exempte lui-même des contrôles qu'il a approuvés ?",
        it: "Cosa succede se un amministratore delegato si esenta dai controlli che ha approvato?",
        es: "¿Qué ocurre si un director general se exime a sí mismo de los controles que aprobó?",
        pl: "Co się dzieje, gdy dyrektor generalny zwalnia siebie z kontroli, które sam zatwierdził?",
      },
      options: [
        { en: "Nothing, as long as the staff follows the controls", de: "Nichts, solange die Mitarbeitenden die Kontrollen einhalten", nl: "Niets, zolang het personeel de controles naleeft", fr: "Rien, tant que le personnel respecte les contrôles", it: "Niente, finché il personale rispetta i controlli", es: "Nada, siempre que el personal cumpla los controles", pl: "Nic, dopóki personel przestrzega kontroli" },
        { en: "It is a direct violation of the leading-by-example principle and an auditor can cite it as a finding", de: "Es ist ein direkter Verstoß gegen das Prinzip der Vorbildfunktion und ein Prüfer kann es als Feststellung beanstanden", nl: "Het is een directe schending van het principe van voorbeeldgedrag en een auditor kan dit als bevinding aanmerken", fr: "Il s'agit d'une violation directe du principe d'exemplarité et un auditeur peut la relever comme constatation", it: "Si tratta di una violazione diretta del principio di esemplarità e un revisore può citarla come rilievo", es: "Es una violación directa del principio de liderazgo con el ejemplo y un auditor puede señalarlo como hallazgo", pl: "Jest to bezpośrednie naruszenie zasady dawania przykładu i audytor może uznać to za ustalenie" },
        { en: "It is permitted for the CEO but not for other board members", de: "Es ist für den Geschäftsführer erlaubt, aber nicht für andere Vorstandsmitglieder", nl: "Het is toegestaan voor de CEO maar niet voor andere bestuursleden", fr: "C'est autorisé pour le dirigeant mais pas pour les autres membres du conseil", it: "È consentito all'amministratore delegato ma non agli altri membri del consiglio", es: "Está permitido para el director general pero no para los demás miembros del consejo", pl: "Jest to dozwolone dla dyrektora generalnego, ale nie dla pozostałych członków zarządu" },
        { en: "The CISO must report it to the regulator", de: "Der CISO muss es der Aufsichtsbehörde melden", nl: "De CISO moet het melden bij de toezichthouder", fr: "Le CISO doit le signaler à l'autorité de contrôle", it: "Il CISO deve segnalarlo all'autorità di vigilanza", es: "El CISO debe notificarlo a la autoridad reguladora", pl: "CISO musi zgłosić to organowi nadzoru" },
      ],
      correctIndex: 1,
      explanation: {
        en: "You must personally follow the controls you approved. Exempting yourself is a direct violation and can be cited as an audit finding.",
        de: "Sie müssen die von Ihnen genehmigten Kontrollen persönlich einhalten. Sich selbst auszunehmen ist ein direkter Verstoß und kann als Prüfungsfeststellung beanstandet werden.",
        nl: "U moet de controles die u hebt goedgekeurd persoonlijk naleven. Uzelf uitzonderen is een directe schending en kan worden aangemerkt als auditbevinding.",
        fr: "Vous devez personnellement respecter les contrôles que vous avez approuvés. Vous exempter vous-même constitue une violation directe et peut être relevé comme constatation d'audit.",
        it: "Dovete rispettare personalmente i controlli che avete approvato. Esentarsi è una violazione diretta e può essere citata come rilievo di audit.",
        es: "Debe cumplir personalmente los controles que aprobó. Eximirse a sí mismo es una violación directa y puede señalarse como hallazgo de auditoría.",
        pl: "Muszą Państwo osobiście przestrzegać zatwierdzonych przez siebie kontroli. Zwolnienie siebie jest bezpośrednim naruszeniem i może zostać uznane za ustalenie audytowe.",
      },
    },
  ],
});

export default quiz;
