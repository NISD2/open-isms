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
      },
      options: [
        { en: "Register, report, and train", de: "Registrieren, melden und schulen", nl: "Registreren, rapporteren en trainen" },
        { en: "Approve, oversee, and be liable", de: "Genehmigen, überwachen und haften", nl: "Goedkeuren, toezicht houden en aansprakelijk zijn" },
        { en: "Plan, implement, and audit", de: "Planen, umsetzen und prüfen", nl: "Plannen, implementeren en controleren" },
        { en: "Budget, hire, and delegate", de: "Budgetieren, einstellen und delegieren", nl: "Begroten, aanwerven en delegeren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 20(1) creates three duties: approve the measures, oversee their implementation, and be liable for infringements.",
        de: "Artikel 20 Absatz 1 begründet drei Pflichten: die Maßnahmen genehmigen, ihre Umsetzung überwachen und für Verstöße haften.",
        nl: "Artikel 20(1) schept drie plichten: de maatregelen goedkeuren, toezicht houden op de uitvoering ervan en aansprakelijk zijn voor overtredingen.",
      },
    },
    {
      id: "1.5.2",
      question: {
        en: "Can the CISO approve the cybersecurity measures on behalf of the management body?",
        de: "Kann der CISO die Cybersicherheitsmaßnahmen im Namen der Geschäftsleitung genehmigen?",
        nl: "Kan de CISO de cyberbeveiligingsmaatregelen namens het leidinggevend orgaan goedkeuren?",
      },
      options: [
        { en: "Yes, if the CEO delegates in writing", de: "Ja, wenn der Geschäftsführer schriftlich delegiert", nl: "Ja, als de CEO schriftelijk delegeert" },
        { en: "Yes, the CISO is the natural approver", de: "Ja, der CISO ist der natürliche Genehmiger", nl: "Ja, de CISO is de aangewezen goedkeurder" },
        { en: "No, the CISO can implement but only the management body can approve", de: "Nein, der CISO kann umsetzen, aber nur die Geschäftsleitung kann genehmigen", nl: "Nee, de CISO kan implementeren, maar alleen het leidinggevend orgaan kan goedkeuren" },
        { en: "Only if the supervisory board agrees", de: "Nur wenn der Aufsichtsrat zustimmt", nl: "Alleen als de raad van commissarissen ermee instemt" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The duty cannot be delegated. The CISO can implement the measures. Only the management body can approve them.",
        de: "Die Pflicht ist nicht delegierbar. Der CISO kann die Maßnahmen umsetzen. Nur die Geschäftsleitung kann sie genehmigen.",
        nl: "De plicht kan niet worden gedelegeerd. De CISO kan de maatregelen implementeren. Alleen het leidinggevend orgaan kan ze goedkeuren.",
      },
    },
    {
      id: "1.5.3",
      question: {
        en: "What happens if a CEO exempts themselves from the controls they approved?",
        de: "Was passiert, wenn sich ein Geschäftsführer von den Kontrollen ausnimmt, die er selbst genehmigt hat?",
        nl: "Wat gebeurt er als een CEO zichzelf uitzondert van de controles die hij zelf heeft goedgekeurd?",
      },
      options: [
        { en: "Nothing, as long as the staff follows the controls", de: "Nichts, solange die Mitarbeitenden die Kontrollen einhalten", nl: "Niets, zolang het personeel de controles naleeft" },
        { en: "It is a direct violation of the leading-by-example principle and an auditor can cite it as a finding", de: "Es ist ein direkter Verstoß gegen das Prinzip der Vorbildfunktion und ein Prüfer kann es als Feststellung beanstanden", nl: "Het is een directe schending van het principe van voorbeeldgedrag en een auditor kan dit als bevinding aanmerken" },
        { en: "It is permitted for the CEO but not for other board members", de: "Es ist für den Geschäftsführer erlaubt, aber nicht für andere Vorstandsmitglieder", nl: "Het is toegestaan voor de CEO maar niet voor andere bestuursleden" },
        { en: "The CISO must report it to the regulator", de: "Der CISO muss es der Aufsichtsbehörde melden", nl: "De CISO moet het melden bij de toezichthouder" },
      ],
      correctIndex: 1,
      explanation: {
        en: "You must personally follow the controls you approved. Exempting yourself is a direct violation and can be cited as an audit finding.",
        de: "Sie müssen die von Ihnen genehmigten Kontrollen persönlich einhalten. Sich selbst auszunehmen ist ein direkter Verstoß und kann als Prüfungsfeststellung beanstandet werden.",
        nl: "U moet de controles die u hebt goedgekeurd persoonlijk naleven. Uzelf uitzonderen is een directe schending en kan worden aangemerkt als auditbevinding.",
      },
    },
  ],
});

export default quiz;
