import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.7",
  passingScore: 75,
  questions: [
    {
      id: "1.7.1",
      question: {
        en: "Who brings the personal civil liability claim against a director under national corporate law?",
        de: "Wer erhebt die persönliche zivilrechtliche Haftungsklage gegen einen Geschäftsleiter nach nationalem Gesellschaftsrecht?",
        nl: "Wie dient de persoonlijke civielrechtelijke aansprakelijkheidsvordering in tegen een bestuurder op grond van nationaal vennootschapsrecht?",
        fr: "Qui intente l'action en responsabilité civile personnelle contre un dirigeant au titre du droit national des sociétés ?",
        it: "Chi promuove l'azione di responsabilità civile personale contro un amministratore ai sensi del diritto societario nazionale?",
        es: "¿Quién interpone la demanda de responsabilidad civil personal contra un administrador en virtud del derecho de sociedades nacional?",
        pl: "Kto wytacza powództwo o osobistą odpowiedzialność cywilną przeciwko członkowi zarządu na podstawie krajowego prawa spółek?",
      },
      options: [
        { en: "The national regulator (BSI in Germany)", de: "Die nationale Aufsichtsbehörde (BSI in Deutschland)", nl: "De nationale toezichthouder (BSI in Duitsland)", fr: "L'autorité de contrôle nationale (BSI en Allemagne)", it: "L'autorità di vigilanza nazionale (BSI in Germania)", es: "La autoridad reguladora nacional (BSI en Alemania)", pl: "Krajowy organ nadzoru (BSI w Niemczech)" },
        { en: "The European Commission", de: "Die Europäische Kommission", nl: "De Europese Commissie", fr: "La Commission européenne", it: "La Commissione europea", es: "La Comisión Europea", pl: "Komisja Europejska" },
        { en: "The company itself, through its shareholders or supervisory board", de: "Das Unternehmen selbst, vertreten durch seine Gesellschafter oder den Aufsichtsrat", nl: "De vennootschap zelf, via haar aandeelhouders of de raad van commissarissen", fr: "L'entreprise elle-même, par l'intermédiaire de ses actionnaires ou de son conseil de surveillance", it: "L'impresa stessa, tramite i suoi azionisti o il consiglio di sorveglianza", es: "La propia empresa, a través de sus accionistas o de su consejo de supervisión", pl: "Sama spółka, za pośrednictwem swoich wspólników lub rady nadzorczej" },
        { en: "The employees affected by the incident", de: "Die vom Vorfall betroffenen Mitarbeitenden", nl: "De medewerkers die door het incident zijn getroffen", fr: "Les employés touchés par l'incident", it: "I dipendenti colpiti dall'incidente", es: "Los empleados afectados por el incidente", pl: "Pracownicy dotknięci incydentem" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The claim comes from your own organisation - through the shareholders or the supervisory board - not from the regulator.",
        de: "Die Klage kommt aus Ihrer eigenen Organisation -- von den Gesellschaftern oder dem Aufsichtsrat -- nicht von der Aufsichtsbehörde.",
        nl: "De vordering komt vanuit uw eigen organisatie — via de aandeelhouders of de raad van commissarissen — niet van de toezichthouder.",
        fr: "L'action émane de votre propre organisation, par l'intermédiaire des actionnaires ou du conseil de surveillance, et non de l'autorité de contrôle.",
        it: "L'azione proviene dalla vostra stessa organizzazione, tramite gli azionisti o il consiglio di sorveglianza, e non dall'autorità di vigilanza.",
        es: "La demanda procede de su propia organización, a través de los accionistas o del consejo de supervisión, no de la autoridad reguladora.",
        pl: "Powództwo pochodzi od Państwa własnej organizacji, za pośrednictwem wspólników lub rady nadzorczej, a nie od organu nadzoru.",
      },
    },
    {
      id: "1.7.2",
      question: {
        en: "What does the reverse burden of proof mean for directors in Germany?",
        de: "Was bedeutet die Beweislastumkehr für Geschäftsleiter in Deutschland?",
        nl: "Wat betekent de omgekeerde bewijslast voor bestuurders in Duitsland?",
        fr: "Que signifie le renversement de la charge de la preuve pour les dirigeants en Allemagne ?",
        it: "Cosa significa l'inversione dell'onere della prova per gli amministratori in Germania?",
        es: "¿Qué significa la inversión de la carga de la prueba para los administradores en Alemania?",
        pl: "Co oznacza odwrócenie ciężaru dowodu dla członków zarządu w Niemczech?",
      },
      options: [
        { en: "The regulator must prove the director was negligent", de: "Die Aufsichtsbehörde muss nachweisen, dass der Geschäftsleiter fahrlässig gehandelt hat", nl: "De toezichthouder moet aantonen dat de bestuurder nalatig heeft gehandeld", fr: "L'autorité de contrôle doit prouver que le dirigeant a été négligent", it: "L'autorità di vigilanza deve dimostrare che l'amministratore è stato negligente", es: "La autoridad reguladora debe probar que el administrador fue negligente", pl: "Organ nadzoru musi udowodnić, że członek zarządu działał niedbale" },
        { en: "The director must prove they acted carefully, rather than the company proving negligence", de: "Der Geschäftsleiter muss beweisen, dass er sorgfältig gehandelt hat, anstatt dass das Unternehmen Fahrlässigkeit nachweisen muss", nl: "De bestuurder moet bewijzen dat hij zorgvuldig heeft gehandeld, in plaats van dat de vennootschap nalatigheid moet aantonen", fr: "Le dirigeant doit prouver qu'il a agi avec diligence, plutôt que l'entreprise ne doive prouver la négligence", it: "L'amministratore deve dimostrare di aver agito con diligenza, anziché essere l'impresa a dover provare la negligenza", es: "El administrador debe probar que actuó con diligencia, en lugar de que la empresa pruebe la negligencia", pl: "To członek zarządu musi udowodnić, że działał starannie, zamiast aby spółka udowadniała niedbalstwo" },
        { en: "The burden of proof does not apply to NIS2 cases", de: "Die Beweislast gilt nicht für NIS2-Fälle", nl: "De bewijslast geldt niet voor NIS2-zaken", fr: "La charge de la preuve ne s'applique pas aux affaires NIS2", it: "L'onere della prova non si applica ai casi NIS2", es: "La carga de la prueba no se aplica a los casos de NIS2", pl: "Ciężar dowodu nie ma zastosowania do spraw NIS2" },
        { en: "The director is automatically cleared if the company has cyber insurance", de: "Der Geschäftsleiter wird automatisch entlastet, wenn das Unternehmen eine Cyberversicherung hat", nl: "De bestuurder is automatisch gevrijwaard als de vennootschap een cyberverzekering heeft", fr: "Le dirigeant est automatiquement disculpé si l'entreprise dispose d'une cyberassurance", it: "L'amministratore è automaticamente discolpato se l'impresa dispone di un'assicurazione cyber", es: "El administrador queda automáticamente exonerado si la empresa tiene un ciberseguro", pl: "Członek zarządu jest automatycznie zwolniony z odpowiedzialności, jeśli firma posiada ubezpieczenie cybernetyczne" },
      ],
      correctIndex: 1,
      explanation: {
        en: "In Germany, the reverse burden of proof means the company does not have to prove you were careless - you have to prove you were careful.",
        de: "In Deutschland bedeutet die Beweislastumkehr, dass das Unternehmen nicht beweisen muss, dass Sie nachlässig waren -- Sie müssen beweisen, dass Sie sorgfältig gehandelt haben.",
        nl: "In Duitsland betekent de omgekeerde bewijslast dat de vennootschap niet hoeft aan te tonen dat u onzorgvuldig was — u moet bewijzen dat u zorgvuldig heeft gehandeld.",
        fr: "En Allemagne, le renversement de la charge de la preuve signifie que l'entreprise n'a pas à prouver que vous avez été négligent : c'est à vous de prouver que vous avez agi avec diligence.",
        it: "In Germania, l'inversione dell'onere della prova significa che l'impresa non deve dimostrare che siete stati negligenti: siete voi a dover dimostrare di aver agito con diligenza.",
        es: "En Alemania, la inversión de la carga de la prueba significa que la empresa no tiene que probar que usted fue negligente: es usted quien debe probar que actuó con diligencia.",
        pl: "W Niemczech odwrócenie ciężaru dowodu oznacza, że spółka nie musi udowadniać, że byli Państwo niedbali: to Państwo muszą udowodnić, że działali starannie.",
      },
    },
    {
      id: "1.7.3",
      question: {
        en: "What documentation does the lesson describe as evidence of due care?",
        de: "Welche Dokumentation beschreibt die Lektion als Nachweis der Sorgfaltspflicht?",
        nl: "Welke documentatie beschrijft de les als bewijs van zorgvuldige naleving?",
        fr: "Quelle documentation la leçon décrit-elle comme preuve de diligence ?",
        it: "Quale documentazione descrive la lezione come prova della dovuta diligenza?",
        es: "¿Qué documentación describe la lección como prueba de la diligencia debida?",
        pl: "Jaką dokumentację lekcja opisuje jako dowód należytej staranności?",
      },
      options: [
        { en: "Vendor invoices and IT budget reports", de: "Lieferantenrechnungen und IT-Budgetberichte", nl: "Leveranciersfacturen en IT-budgetrapporten", fr: "Les factures des fournisseurs et les rapports de budget informatique", it: "Le fatture dei fornitori e i rapporti sul budget IT", es: "Las facturas de proveedores y los informes de presupuesto de TI", pl: "Faktury dostawców i raporty budżetu IT" },
        { en: "The dated sign-off, training record, meeting minutes, and risk register with your signature", de: "Die datierte Freigabe, der Schulungsnachweis, die Sitzungsprotokolle und das Risikoregister mit Ihrer Unterschrift", nl: "De gedateerde goedkeuring, het opleidingsregistratie, de notulen en het risicoregister met uw handtekening", fr: "L'approbation datée, le justificatif de formation, le procès-verbal de réunion et le registre des risques portant votre signature", it: "L'approvazione datata, l'attestato di formazione, il verbale della riunione e il registro dei rischi con la vostra firma", es: "La aprobación fechada, el registro de formación, el acta de la reunión y el registro de riesgos con su firma", pl: "Datowana akceptacja, zaświadczenie o szkoleniu, protokół ze spotkania oraz rejestr ryzyka z Państwa podpisem" },
        { en: "Annual financial statements and tax filings", de: "Jahresabschlüsse und Steuererklärungen", nl: "Jaarrekeningen en belastingaangiften", fr: "Les états financiers annuels et les déclarations fiscales", it: "I bilanci annuali e le dichiarazioni fiscali", es: "Las cuentas anuales y las declaraciones fiscales", pl: "Roczne sprawozdania finansowe i deklaracje podatkowe" },
        { en: "Insurance policy documents and broker correspondence", de: "Versicherungspolicen und Maklerkorrespondenz", nl: "Verzekeringspolissen en makelaarskorrespondentie", fr: "Les documents de police d'assurance et la correspondance avec le courtier", it: "I documenti della polizza assicurativa e la corrispondenza con il broker", es: "Los documentos de la póliza de seguro y la correspondencia con el corredor", pl: "Dokumenty polisy ubezpieczeniowej i korespondencja z brokerem" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The dated sign-off, the training record, the meeting minutes, the risk register with your signature - those are the evidence you use to prove due care.",
        de: "Die datierte Freigabe, der Schulungsnachweis, die Sitzungsprotokolle, das Risikoregister mit Ihrer Unterschrift -- das sind die Nachweise, mit denen Sie die Einhaltung Ihrer Sorgfaltspflicht belegen.",
        nl: "De gedateerde goedkeuring, het opleidingsregistratie, de notulen, het risicoregister met uw handtekening — dat is het bewijs waarmee u aantoont dat u zorgvuldig heeft gehandeld.",
        fr: "L'approbation datée, le justificatif de formation, le procès-verbal de réunion, le registre des risques portant votre signature : ce sont les preuves que vous utilisez pour démontrer votre diligence.",
        it: "L'approvazione datata, l'attestato di formazione, il verbale della riunione, il registro dei rischi con la vostra firma: queste sono le prove che utilizzate per dimostrare la dovuta diligenza.",
        es: "La aprobación fechada, el registro de formación, el acta de la reunión, el registro de riesgos con su firma: esas son las pruebas que utiliza para demostrar la diligencia debida.",
        pl: "Datowana akceptacja, zaświadczenie o szkoleniu, protokół ze spotkania, rejestr ryzyka z Państwa podpisem: to są dowody, którymi wykazują Państwo należytą staranność.",
      },
    },
  ],
});

export default quiz;
