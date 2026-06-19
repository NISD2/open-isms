import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.3",
  passingScore: 75,
  questions: [
    {
      id: "1.3.1",
      question: {
        en: "Which of the following is a facilitator responsibility?",
        de: "Welches ist eine Aufgabe der Moderation?",
        fr: "Laquelle des responsabilités suivantes incombe à l'animateur ?",
        it: "Quale delle seguenti è una responsabilità del facilitatore?",
        es: "¿Cuál de las siguientes es una responsabilidad del facilitador?",
        pl: "Która z poniższych jest obowiązkiem facylitatora?",
      },
      options: [
        { en: "Playing the IT manager role in the scenario", de: "Die Rolle der IT-Verantwortlichen im Szenario spielen", fr: "Jouer le rôle du responsable informatique dans le scénario", it: "Interpretare il ruolo del responsabile IT nello scenario", es: "Interpretar el papel del responsable de TI en el escenario", pl: "Odgrywanie roli menedżera IT w scenariuszu" },
        { en: "Giving participants the right answer when they get stuck", de: "Den Teilnehmenden die richtige Antwort geben, wenn sie nicht weiterkommen", fr: "Donner aux participants la bonne réponse lorsqu'ils sont bloqués", it: "Dare ai partecipanti la risposta corretta quando si bloccano", es: "Dar a los participantes la respuesta correcta cuando se quedan atascados", pl: "Podawanie uczestnikom właściwej odpowiedzi, gdy utkną" },
        { en: "Narrating injects, enforcing decision capture, and keeping time", de: "Ereignisse erzählen, Entscheidungen festhalten und die Zeit behalten", fr: "Narrer les injects, faire consigner les décisions et gérer le temps", it: "Narrare gli inject, far registrare le decisioni e tenere il tempo", es: "Narrar los injects, hacer que se registren las decisiones y controlar el tiempo", pl: "Narracja zdarzeń, egzekwowanie zapisu decyzji i pilnowanie czasu" },
        { en: "Advocating for the most defensible decision at each gate", de: "Bei jeder Entscheidung für die am besten verteidigungsfähige Option werben", fr: "Plaider pour la décision la plus défendable à chaque étape", it: "Sostenere la decisione più difendibile a ogni punto di decisione", es: "Abogar por la decisión más defendible en cada punto de decisión", pl: "Opowiadanie się za najbardziej możliwą do obrony decyzją na każdym etapie" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The facilitator narrates, captures decisions, keeps time, and stays neutral. They do not play roles, do not coach, and do not advocate.",
        de: "Die Moderation erzählt, hält Entscheidungen fest, behält die Zeit und bleibt neutral. Sie spielt keine Rollen, coacht nicht und wirbt nicht für eine Position.",
        fr: "L'animateur narre, consigne les décisions, gère le temps et reste neutre. Il ne joue pas de rôles, ne coache pas et ne plaide pas.",
        it: "Il facilitatore narra, registra le decisioni, tiene il tempo e resta neutrale. Non interpreta ruoli, non fa da coach e non sostiene posizioni.",
        es: "El facilitador narra, registra las decisiones, controla el tiempo y permanece neutral. No interpreta papeles, no entrena ni aboga.",
        pl: "Facylitator prowadzi narrację, zapisuje decyzje, pilnuje czasu i pozostaje neutralny. Nie odgrywa ról, nie coachuje i nie opowiada się po żadnej stronie.",
      },
    },
    {
      id: "1.3.2",
      question: {
        en: "Why does it matter that the facilitator does not play a role in the scenario?",
        de: "Warum ist es wichtig, dass die Moderation keine Rolle im Szenario übernimmt?",
        fr: "Pourquoi est-il important que l'animateur ne joue pas de rôle dans le scénario ?",
        it: "Perché è importante che il facilitatore non interpreti un ruolo nello scenario?",
        es: "¿Por qué es importante que el facilitador no interprete un papel en el escenario?",
        pl: "Dlaczego ważne jest, aby facylitator nie odgrywał roli w scenariuszu?",
      },
      options: [
        { en: "Because the platform refuses to record their decisions", de: "Weil die Plattform deren Entscheidungen nicht aufzeichnet", fr: "Parce que la plateforme refuse d'enregistrer leurs décisions", it: "Perché la piattaforma rifiuta di registrare le loro decisioni", es: "Porque la plataforma se niega a registrar sus decisiones", pl: "Ponieważ platforma odmawia rejestrowania ich decyzji" },
        { en: "Because the exercise loses its independent observer and the protocol becomes less defensible", de: "Weil die Übung sonst ihre unabhängige Beobachtung verliert und das Protokoll schwächer wird", fr: "Parce que l'exercice perd son observateur indépendant et que le protocole devient moins défendable", it: "Perché l'esercitazione perde il suo osservatore indipendente e il protocollo diventa meno difendibile", es: "Porque el ejercicio pierde su observador independiente y el protocolo se vuelve menos defendible", pl: "Ponieważ ćwiczenie traci niezależnego obserwatora, a protokół staje się mniej możliwy do obrony" },
        { en: "Because the BSI revokes recognition of the exercise", de: "Weil das BSI sonst die Anerkennung der Übung entzieht", fr: "Parce que le BSI retire la reconnaissance de l'exercice", it: "Perché il BSI revoca il riconoscimento dell'esercitazione", es: "Porque el BSI revoca el reconocimiento del ejercicio", pl: "Ponieważ BSI cofa uznanie ćwiczenia" },
        { en: "Because cyber insurance will deny the claim", de: "Weil die Cyber-Versicherung sonst den Schaden ablehnt", fr: "Parce que l'assurance cyber refusera la demande d'indemnisation", it: "Perché l'assicurazione cyber respingerà il sinistro", es: "Porque el ciberseguro denegará la reclamación", pl: "Ponieważ ubezpieczenie cybernetyczne odrzuci roszczenie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The protocol's credibility depends on having an independent observer. A facilitator who also plays in the scenario removes that independence.",
        de: "Die Glaubwürdigkeit des Protokolls hängt von einer unabhängigen Beobachtung ab. Wer moderiert und gleichzeitig im Szenario mitspielt, hebt diese Unabhängigkeit auf.",
        fr: "La crédibilité du protocole dépend de la présence d'un observateur indépendant. Un animateur qui joue aussi dans le scénario supprime cette indépendance.",
        it: "La credibilità del protocollo dipende dalla presenza di un osservatore indipendente. Un facilitatore che recita anche nello scenario elimina tale indipendenza.",
        es: "La credibilidad del protocolo depende de contar con un observador independiente. Un facilitador que además participa en el escenario elimina esa independencia.",
        pl: "Wiarygodność protokołu zależy od obecności niezależnego obserwatora. Facylitator, który jednocześnie gra w scenariuszu, znosi tę niezależność.",
      },
    },
    {
      id: "1.3.3",
      question: {
        en: "Which option is NOT a valid way for a small team to handle facilitator separation?",
        de: "Welche Option ist KEIN gültiger Weg für ein kleines Team, die Trennung der Moderation zu erreichen?",
        fr: "Quelle option n'est PAS une manière valable pour une petite équipe d'assurer la séparation de l'animateur ?",
        it: "Quale opzione NON è un modo valido per un piccolo team di garantire la separazione del facilitatore?",
        es: "¿Qué opción NO es una manera válida para que un equipo pequeño logre la separación del facilitador?",
        pl: "Która opcja NIE jest właściwym sposobem zapewnienia rozdziału funkcji facylitatora w małym zespole?",
      },
      options: [
        { en: "Rotating facilitation across years", de: "Die Moderation jahresweise rotieren", fr: "Faire tourner l'animation d'une année à l'autre", it: "Ruotare la facilitazione di anno in anno", es: "Rotar la facilitación de un año a otro", pl: "Rotacja facylitacji w kolejnych latach" },
        { en: "Swapping facilitators with a peer organisation", de: "Die Moderation mit einem Partnerunternehmen tauschen", fr: "Échanger les animateurs avec une organisation homologue", it: "Scambiare i facilitatori con un'organizzazione omologa", es: "Intercambiar facilitadores con una organización homóloga", pl: "Wymiana facylitatorów z organizacją partnerską" },
        { en: "Engaging an external observer", de: "Eine externe Beobachtung beauftragen", fr: "Faire appel à un observateur externe", it: "Coinvolgere un osservatore esterno", es: "Contratar a un observador externo", pl: "Zaangażowanie zewnętrznego obserwatora" },
        { en: "Having the facilitator also act as the IT manager but writing it down", de: "Die Moderation übernimmt zusätzlich die IT-Rolle und schreibt das auf", fr: "Faire jouer à l'animateur aussi le rôle du responsable informatique mais le consigner par écrit", it: "Far svolgere al facilitatore anche il ruolo di responsabile IT ma metterlo per iscritto", es: "Hacer que el facilitador también actúe como responsable de TI pero dejándolo por escrito", pl: "Dopuszczenie, by facylitator pełnił także rolę menedżera IT, ale odnotowanie tego na piśmie" },
      ],
      correctIndex: 3,
      explanation: {
        en: "Writing it down does not solve the independence problem. Rotation, peer swap, or external observer are the three valid approaches.",
        de: "Aufschreiben löst das Problem der Unabhängigkeit nicht. Rotation, Partnertausch oder externe Beobachtung sind die drei gültigen Lösungen.",
        fr: "Le consigner par écrit ne résout pas le problème d'indépendance. La rotation, l'échange avec un pair ou l'observateur externe sont les trois approches valables.",
        it: "Metterlo per iscritto non risolve il problema dell'indipendenza. Rotazione, scambio con un pari o osservatore esterno sono i tre approcci validi.",
        es: "Dejarlo por escrito no resuelve el problema de la independencia. La rotación, el intercambio con un par o el observador externo son los tres enfoques válidos.",
        pl: "Odnotowanie tego na piśmie nie rozwiązuje problemu niezależności. Rotacja, wymiana z partnerem lub zewnętrzny obserwator to trzy właściwe podejścia.",
      },
    },
  ],
});

export default quiz;
