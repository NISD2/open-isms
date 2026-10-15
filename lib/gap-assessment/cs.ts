/**
 * The gap assessment in Czech. The @nisd2/nis2-gap-assessment-schema package holds every domain
 * and question in German and English only, written against the BSIG; this layer holds the Czech
 * text, keyed by the package's ids, until the package carries Czech itself.
 *
 * A Czech reader answers against zákon č. 264/2025 Sb. and its decrees, so where the German rule
 * has a different Czech counterpart the Czech question asks the Czech duty and cites its place:
 * the regime instead of the § 28 BSIG category, management "se prokazatelně seznamuje" instead of
 * approving, no fixed training interval, liability under § 159 občanského zákoníku and §§ 51 až 53
 * zákona o obchodních korporacích, registration as an ohlášení on the Portál NÚKIB followed by the
 * data of § 11, and a NÚKIB inspection under the kontrolní řád instead of a BSI request.
 */

export interface GapDomainText {
  readonly name: string;
  readonly description: string;
}

export interface GapQuestionText {
  readonly text: string;
  readonly plainText: string;
  readonly legalBasis: string;
}

const ACT = "zákona č. 264/2025 Sb.";
const LOWER = "vyhlášky č. 410/2025 Sb.";
const HIGHER = "vyhlášky č. 409/2025 Sb.";
const INSPECTION = "kontrolního řádu (zákon č. 255/2012 Sb.)";

export const GAP_DOMAINS_CS: Readonly<Record<number, GapDomainText>> = {
  0: {
    name: "Působnost a registrace",
    description:
      "Nejdřív to hlavní: vztahuje se na vás zákon a ohlásili jste službu NÚKIB?",
  },
  1: {
    name: "Řízení a odpovědnost vedení",
    description:
      "Vedení odpovídá za péči řádného hospodáře. Tato oblast ověřuje, zda své povinnosti zná, rozumí jim a jedná.",
  },
  2: {
    name: "Řízení rizik",
    description: "Víte, co máte, co se může pokazit a co s tím děláte?",
  },
  3: {
    name: "Řešení incidentů",
    description: "Dokážete incidenty odhalit, reagovat na ně a nahlásit je?",
  },
  4: {
    name: "Kontinuita činností",
    description: "Když systémy vypadnou, udržíte firmu v chodu?",
  },
  5: {
    name: "Bezpečnost dodavatelského řetězce",
    description:
      "Jsou vaši dodavatelé bezpeční a dokážete svou vlastní bezpečnost doložit zákazníkům?",
  },
  6: {
    name: "Bezpečný vývoj a nákup",
    description: "Nakupujete a vyvíjíte systémy bezpečně?",
  },
  7: {
    name: "Hodnocení účinnosti",
    description: "Jak víte, že vaše zabezpečení opravdu funguje?",
  },
  8: {
    name: "Kybernetická hygiena a školení",
    description: "Vědí vaši zaměstnanci, jak se online chovat bezpečně?",
  },
  9: {
    name: "Kryptografie",
    description: "Chráníte data šifrováním?",
  },
  10: {
    name: "Řízení přístupu",
    description: "Kdo má k čemu přístup a je to pod kontrolou?",
  },
  11: {
    name: "Zabezpečená komunikace",
    description: "Dokážete komunikovat bezpečně, zvlášť v krizi?",
  },
  12: {
    name: "Bezpečnost sítě",
    description: "Jsou vaše sítě chráněné?",
  },
  13: {
    name: "Fyzická bezpečnost",
    description: "Jsou vaše prostory zabezpečené?",
  },
  14: {
    name: "Doklady a dokumentace",
    description: "Dokážete to všechno doložit při kontrole?",
  },
};

export const GAP_QUESTIONS_CS: Readonly<Record<string, GapQuestionText>> = {
  "gap-0-01": {
    text: "Zjistili jste, zda poskytujete regulovanou službu podle zákona č. 264/2025 Sb., a v jakém režimu povinností?",
    plainText:
      "Víte, zda se na vaši firmu zákon vztahuje? Režim vyšších povinností znamená přísnější požadavky (vyhláška č. 409/2025 Sb.), režim nižších povinností mírnější (vyhláška č. 410/2025 Sb.). Po registraci najdete svůj režim na Portálu NÚKIB, rozhodnutí o registraci ho neuvádí.",
    legalBasis: `§§ 4 až 8 ${ACT}; vyhláška č. 408/2025 Sb.`,
  },
  "gap-0-02": {
    text: "Posoudili jste, zda vaše služba spadá do některého z odvětví, která zákon reguluje?",
    plainText:
      "Působí vaše firma v některém z 15 odvětví, která zákon vyjmenovává? (Například energetika, doprava, zdravotnictví, vodní a odpadové hospodářství, potravinářský nebo výrobní průmysl, digitální infrastruktura a služby.) Konkrétní služby uvádí vyhláška č. 408/2025 Sb.",
    legalBasis: `§ 4 odst. 1 písm. a) ${ACT}; vyhláška č. 408/2025 Sb.; čl. 2 a přílohy I a II směrnice NIS 2`,
  },
  "gap-0-03": {
    text: "Ověřili jste počet zaměstnanců, roční obrat a bilanční sumu podle prahů pro střední podnik?",
    plainText:
      "Máte 50 a více zaměstnanců, NEBO roční obrat i bilanční sumu nad 10 mil. EUR? Pak do působnosti pravděpodobně spadáte. Ověřit to můžete kalkulačkou na Portálu NÚKIB.",
    legalBasis: `§ 4 odst. 1 písm. b), § 7 ${ACT}; doporučení Komise 2003/361/ES`,
  },
  "gap-0-04": {
    text: "Pokud jste součástí skupiny, započítali jste do prahů zaměstnance a obraty propojených a partnerských podniků?",
    plainText:
      "Má-li vaše firma mateřskou nebo dceřiné společnosti, jejich zaměstnanci a obraty se do prahů zpravidla započítávají. Zákon ale nezapočítává podniky, jejichž technická aktiva jsou zcela oddělena od těch, které používáte při poskytování regulované služby. Ověřili jste to?",
    legalBasis: `§ 7 písm. c) ${ACT}; doporučení Komise 2003/361/ES`,
  },
  "gap-0-05": {
    text: "Pokud působíte ve více státech EU, víte, ve které zemi se máte registrovat?",
    plainText:
      "Máte pobočky nebo provoz v jiných zemích EU? Víte, ve které zemi se registrujete?",
    legalBasis: `§ 1 odst. 2 ${ACT}; čl. 26 směrnice NIS 2`,
  },
  "gap-0-06": {
    text: "Ohlásili jste svou regulovanou službu NÚKIB přes Portál NÚKIB?",
    plainText:
      "Přihlásili jste se na Portál NÚKIB (přes NIA) a podali ohlášení? Lhůta je 60 dnů ode dne, kdy podmínky pro registraci splníte.",
    legalBasis: `§ 6 odst. 1 ${ACT}; vyhláška č. 334/2025 Sb.`,
  },
  "gap-0-07": {
    text: "Nahlásili jste NÚKIB do 30 dnů od doručení rozhodnutí o registraci kontaktní a doplňující údaje?",
    plainText:
      "Po rozhodnutí o registraci následuje druhý krok: kontaktní údaje a doplňující údaje (vlastnická struktura, doménová jména a rozsahy IP adres služby, její geografické rozšíření). Máte to hotové?",
    legalBasis: `§ 11 odst. 1 ${ACT}; § 3 vyhlášky č. 334/2025 Sb.`,
  },
  "gap-0-08": {
    text: "Určili jste osoby, které za firmu jednají s NÚKIB, a nahlásili jejich kontaktní údaje?",
    plainText:
      "Má NÚKIB ve vaší firmě konkrétní osobu, kterou může kontaktovat? Změny těchto údajů hlásíte nejpozději do 14 dnů.",
    legalBasis: `§ 11 odst. 1 písm. a), odst. 2 ${ACT}`,
  },
  "gap-0-09": {
    text: "Sledujete lhůty pro registraci v dalších zemích, pokud působíte i mimo Česko?",
    plainText:
      "Pokud se registrujete nebo máte registrovat i v jiných zemích EU, sledujete jejich lhůty?",
    legalBasis: "čl. 3 odst. 3 a 4 směrnice NIS 2",
  },
  "gap-1-01": {
    text: "Seznámilo se vedení prokazatelně se stavem bezpečnostních opatření?",
    plainText:
      "Prošel jednatel osobně, jaká bezpečnostní opatření firma má a jak jsou zavedená, a je to doloženo? Nestačí to předat IT. V nižším režimu jde o přehled bezpečnostních opatření, ve vyšším mimo jiné o zprávu o hodnocení rizik a plán zvládání rizik.",
    legalBasis: `§ 4 písm. d) ${LOWER}; § 4 odst. 2 ${HIGHER}`,
  },
  "gap-1-02": {
    text: "Je toto seznámení doloženo písemně (například podepsaným záznamem)?",
    plainText:
      "Existuje podepsaný dokument, který dokládá, že se vedení s opatřeními seznámilo?",
    legalBasis: `§ 4 písm. d) ${LOWER}; § 4 odst. 2 ${HIGHER}`,
  },
  "gap-1-03": {
    text: "Dohlíží vedení aktivně na zavádění bezpečnostních opatření?",
    plainText:
      "Ptá se jednatel průběžně, jak zabezpečení postupuje, nebo jednou něco podepíše a zapomene?",
    legalBasis: `§ 4 ${LOWER}; § 4 odst. 1 ${HIGHER}; čl. 20 odst. 1 směrnice NIS 2`,
  },
  "gap-1-04": {
    text: "Je kybernetická bezpečnost pravidelným bodem jednání vedení (alespoň čtvrtletně)?",
    plainText:
      "Probírá vedení bezpečnost alespoň čtyřikrát ročně? Zákon interval nestanoví, čtvrtletí je osvědčená praxe. Ve vyšším režimu se výbor pro řízení kybernetické bezpečnosti schází alespoň jednou ročně.",
    legalBasis: `Osvědčená praxe; § 4 odst. 3 písm. c) ${HIGHER}`,
  },
  "gap-1-05": {
    text: "Uchováváte zápisy z jednání, které dokládají projednání a rozhodnutí o kybernetické bezpečnosti?",
    plainText:
      "Když se kontrola zeptá, zda vedení bezpečnost projednávalo, můžete předložit písemné záznamy?",
    legalBasis: `§ 4 písm. d) ${LOWER}; § 4 odst. 3 písm. d) ${HIGHER}`,
  },
  "gap-1-06": {
    text: "Absolvoval každý člen vrcholného vedení osobně školení v kybernetické bezpečnosti?",
    plainText:
      "Prošel školením jednatel (a každý další jednatel nebo člen představenstva) osobně? Ne jejich IT pracovník, ale oni sami.",
    legalBasis: `§ 4 písm. b), § 5 odst. 2 písm. a) ${LOWER}; § 4 odst. 1 písm. a), § 10 odst. 3 písm. a) ${HIGHER}`,
  },
  "gap-1-07": {
    text: "Je školení vedení doloženo datem, obsahem a délkou?",
    plainText:
      "Dokážete při kontrole ukázat, kdy vedení školení absolvovalo, co obsahovalo a jak dlouho trvalo? Vyhlášky požadují přehled o provedených školeních a seznam školených osob.",
    legalBasis: `§ 5 odst. 3 ${LOWER}; § 10 odst. 5 ${HIGHER}`,
  },
  "gap-1-08": {
    text: "Pokrývá školení vedení jeho povinnosti a bezpečnostní politiku?",
    plainText:
      "Dozvědělo se vedení na školení, jaké má povinnosti a co říká bezpečnostní politika? Ve vyšším režimu také systém řízení bezpečnosti informací, řízení rizik a kontinuitu činností, včetně toho, jak určovat rizika a posoudit jejich dopad na regulovanou službu.",
    legalBasis: `§ 5 odst. 2 písm. a) ${LOWER}; § 10 odst. 3 písm. a) ${HIGHER}; čl. 20 odst. 2 směrnice NIS 2`,
  },
  "gap-1-09": {
    text: "Opakuje vedení školení pravidelně?",
    plainText:
      "Je školení vedení jednorázové, nebo se opakuje? Vyhlášky požadují vstupní a pravidelná školení, interval si stanovíte sami.",
    legalBasis: `§ 5 odst. 2 písm. a) ${LOWER}; § 10 odst. 3 písm. a) ${HIGHER}`,
  },
  "gap-1-10": {
    text: "Ví vedení, že kybernetická bezpečnost patří k péči řádného hospodáře, za kterou odpovídá?",
    plainText:
      "Ví jednatel, že funkci musí vykonávat s potřebnými znalostmi a pečlivostí a že škodu způsobenou porušením této péče může být povinen nahradit? Zákon o kybernetické bezpečnosti zvláštní ustanovení o odpovědnosti vedení nemá. Ve vyšším režimu může NÚKIB navíc dočasně zakázat výkon funkce člena statutárního orgánu.",
    legalBasis: `§ 159 občanského zákoníku; §§ 51 až 53 zákona o obchodních korporacích; § 58 ${ACT}`,
  },
  "gap-1-11": {
    text: "Ví vedení, že ujednání omezující jeho odpovědnost nemají účinek?",
    plainText:
      "Ví jednatel, že ho smlouva o výkonu funkce neochrání? K právním jednáním obchodní korporace omezujícím odpovědnost člena jejího voleného orgánu se nepřihlíží. Vzniklou újmu lze vypořádat jen smlouvou, kterou schválí nejvyšší orgán společnosti alespoň dvoutřetinovou většinou hlasů všech společníků.",
    legalBasis: "§ 53 odst. 2 a 3 zákona o obchodních korporacích",
  },
  "gap-1-12": {
    text: "Ověřilo vedení, zda pojištění odpovědnosti členů orgánů (D&O) kryje nároky spojené s kybernetickou bezpečností?",
    plainText: "Zkontroloval někdo, co pojištění jednatele skutečně kryje?",
    legalBasis: "§ 159 občanského zákoníku; §§ 51 až 53 zákona o obchodních korporacích",
  },
  "gap-1-13": {
    text: "Zajistilo vedení přiměřený rozpočet na kybernetickou bezpečnost a je zdokumentováno, proč je přiměřený?",
    plainText:
      "Existuje písemný rozpočet na bezpečnost a umíte vysvětlit, proč je jeho výše přiměřená rizikům vaší firmy?",
    legalBasis: `§ 4 písm. c) ${LOWER}; § 4 odst. 1 písm. d), n) ${HIGHER}`,
  },
  "gap-1-14": {
    text: "Je určena konkrétní osoba odpovědná za kybernetickou bezpečnost?",
    plainText:
      "Má ve firmě někdo bezpečnost přímo na starosti? V nižším režimu jde o osobu pověřenou kybernetickou bezpečností, ve vyšším o manažera kybernetické bezpečnosti.",
    legalBasis: `§ 4 písm. a) ${LOWER}; § 4 odst. 4 písm. a), § 5 odst. 1 ${HIGHER}`,
  },
  "gap-1-15": {
    text: "Jsou role a odpovědnosti v kybernetické bezpečnosti zdokumentované a známé v celé firmě?",
    plainText: "Ví každý, kdo za co v bezpečnosti odpovídá?",
    legalBasis: `§ 14 odst. 1 písm. a) bod 3 ${ACT}; § 4 písm. a) ${LOWER}; § 4 odst. 4 ${HIGHER}`,
  },
  "gap-1-16": {
    text: "Má osoba odpovědná za kybernetickou bezpečnost přímý přístup k vedení?",
    plainText:
      "Může bezpečnostní pracovník jít s problémem rovnou za jednatelem, bez několika úrovní řízení?",
    legalBasis: `§ 4 písm. a) ${LOWER}; § 5 odst. 1 písm. b) ${HIGHER}`,
  },
  "gap-1-17": {
    text: "Je určení osoby odpovědné za kybernetickou bezpečnost doloženo písemně, včetně rozsahu jejích pravomocí?",
    plainText:
      "Existuje podepsaný dokument, ze kterého je jasné, kdo to je, za co odpovídá a jaké má pravomoci?",
    legalBasis: `§ 4 písm. a) ${LOWER}; § 4 odst. 4 ${HIGHER}`,
  },
  "gap-2-01": {
    text: "Máte zdokumentovanou metodiku hodnocení rizik?",
    plainText:
      "Existuje písemný postup, jak rizika hledáte a hodnotíte? (Stačí i jednoduchý postup v tabulce.) Ve vyšším režimu ji včetně kritérií pro akceptovatelnost rizik požaduje vyhláška č. 409/2025 Sb., pro nižší režim vyhláška metodiku nepředepisuje.",
    legalBasis: `§ 14 odst. 1 písm. a) bod 6, odst. 2 písm. d) ${ACT}; § 8 odst. 1 písm. a) ${HIGHER}`,
  },
  "gap-2-02": {
    text: "Posuzuje metodika pravděpodobnost i dopad?",
    plainText:
      "Posuzujete u každého rizika, jak je pravděpodobné a jak vážné by bylo? Vyhláška pro vyšší režim počítá riziko z hodnoty aktiva, hrozby a zranitelnosti.",
    legalBasis: `§ 8 odst. 1 písm. d) a příloha č. 4 ${HIGHER}`,
  },
  "gap-2-03": {
    text: "Zohledňuje metodika i jiné hrozby než kybernetické útoky?",
    plainText:
      "Počítáte i s výpadkem proudu, povodní, chybou zaměstnance nebo selháním dodavatele, nejen s hackery?",
    legalBasis: `čl. 21 odst. 2 směrnice NIS 2; § 8 odst. 1 písm. b) a příloha č. 3 ${HIGHER}`,
  },
  "gap-2-04": {
    text: "Je metodika přiměřená velikosti a rizikům vaší firmy?",
    plainText:
      "Odpovídá váš postup velikosti firmy? Firma s 50 lidmi nepotřebuje stejný proces jako banka.",
    legalBasis: `§ 13 odst. 2 ${ACT}; § 3 odst. 1 písm. a) ${LOWER}`,
  },
  "gap-2-05": {
    text: "Vedete seznam všech IT systémů, softwaru a zařízení?",
    plainText:
      "Znáte každý server, notebook, aplikaci a síťové zařízení, které firma používá? Je to někde sepsané? Zákon vyžaduje evidenci aktiv, která souvisejí s poskytováním regulované služby.",
    legalBasis: `§ 12 odst. 3 ${ACT}; § 7 ${HIGHER}`,
  },
  "gap-2-06": {
    text: "Jsou aktiva rozdělena podle toho, jak jsou pro firmu kritická?",
    plainText: "Víte, který výpadek by firmu bolel nejvíc?",
    legalBasis: `§ 4 písm. f), § 6 písm. a) ${LOWER}; § 7 písm. b), d) ${HIGHER}`,
  },
  "gap-2-07": {
    text: "Rozlišuje soupis aktiv kancelářskou IT a provozní technologie (OT)?",
    plainText:
      "Máte-li průmyslová zařízení, výrobní linky nebo systémy řízení budov, jsou v soupisu vedeny odděleně od kancelářských počítačů?",
    legalBasis: `§ 12 ${ACT}; § 27 ${HIGHER}`,
  },
  "gap-2-08": {
    text: "Kontrolujete a aktualizujete soupis aktiv alespoň jednou ročně?",
    plainText: "Byl seznam aktualizován během posledního roku?",
    legalBasis: `§ 12 odst. 5 ${ACT}`,
  },
  "gap-2-09": {
    text: "Provedli jste hodnocení rizik kybernetické bezpečnosti v posledních 12 měsících?",
    plainText:
      "Sedli jste si v posledním roce a sepsali, co se může pokazit? Ve vyšším režimu vyhláška požaduje hodnocení rizik alespoň jednou ročně a při významných změnách.",
    legalBasis: `§ 8 odst. 1 písm. c) ${HIGHER}`,
  },
  "gap-2-10": {
    text: "Pokrývá hodnocení rizik všechna aktiva ze soupisu?",
    plainText:
      "Posoudili jste rizika u všeho na seznamu aktiv, nejen u toho nejzřejmějšího?",
    legalBasis: `§ 8 odst. 1 písm. b), c) ${HIGHER}`,
  },
  "gap-2-11": {
    text: "Je u každého zjištěného rizika zapsán vlastník, pravděpodobnost, dopad a plán ošetření?",
    plainText:
      "Je u každého rizika napsáno, kdo za něj odpovídá, jak je pravděpodobné, jak vážné by bylo a co s ním děláte?",
    legalBasis: `§ 8 odst. 1 písm. e), g) ${HIGHER}`,
  },
  "gap-2-12": {
    text: "Seznamuje se vedení prokazatelně s rozhodnutími o přijetí rizik?",
    plainText:
      "Rozhodli jste se nějaké riziko přijmout (nic s ním nedělat)? Ví o tom jednatel prokazatelně, například podpisem? Ve vyšším režimu se vedení prokazatelně seznamuje se zprávou o hodnocení rizik a s plánem zvládání rizik.",
    legalBasis: `§ 4 písm. d) ${LOWER}; § 4 odst. 2 písm. b), c) ${HIGHER}`,
  },
  "gap-2-13": {
    text: "Přehodnocujete rizika po významných změnách nebo po bezpečnostních incidentech?",
    plainText:
      "Když se něco zásadně změní (nový systém, nová kancelář, incident), hodnotíte rizika znovu?",
    legalBasis: `§ 8 odst. 1 písm. c) ${HIGHER}`,
  },
  "gap-2-14": {
    text: "Má firma písemnou bezpečnostní politiku, jejíž stanovení zajistilo vedení?",
    plainText:
      "Existuje písemný dokument, který říká, jak firma bezpečnost zajišťuje, a stojí za ním jednatel?",
    legalBasis: `§ 3 odst. 3 písm. a) ${LOWER}; § 4 odst. 1 písm. b), § 6 odst. 1 ${HIGHER}`,
  },
  "gap-2-15": {
    text: "Pokrývá bezpečnostní politika a dokumentace všechna bezpečnostní opatření, která zákon pro váš režim stanoví?",
    plainText:
      "Řeší vaše dokumentace všechny oblasti bezpečnostních opatření ze seznamu v § 14 zákona? V nižším režimu je jich 13, ve vyšším 25 (například řízení rizik, řešení incidentů, kontinuita činností, řízení přístupu a kryptografie).",
    legalBasis: `§ 14 ${ACT}; § 3 odst. 3 písm. a) ${LOWER}; § 6 odst. 1 ${HIGHER}`,
  },
  "gap-2-16": {
    text: "Přezkoumáváte a aktualizujete politiku alespoň jednou ročně?",
    plainText:
      "Byla politika přezkoumána v posledním roce? Vyhlášky požadují pravidelný přezkum, interval si stanovíte sami.",
    legalBasis: `§ 3 odst. 3 písm. b) ${LOWER}; § 6 odst. 3 ${HIGHER}`,
  },
  "gap-2-17": {
    text: "Znají politiku všichni zaměstnanci?",
    plainText: "Ví každý zaměstnanec, že politika existuje a kde ji najde?",
    legalBasis: `§ 3 odst. 3 písm. c) ${LOWER}; § 4 odst. 1 písm. e), § 6 odst. 5 písm. b) ${HIGHER}`,
  },
  "gap-3-01": {
    text: "Máte zdokumentovaný plán reakce na incidenty?",
    plainText: "Kdyby vás zítra napadli hackeři, existuje písemný plán, co dělat?",
    legalBasis: `§ 10 ${LOWER}; § 14 ${HIGHER}`,
  },
  "gap-3-02": {
    text: "Máte stanoveno, které incidenty musíte hlásit?",
    plainText:
      "Víte, které incidenty musíte hlásit a komu? Ve vyšším režimu hlásíte NÚKIB, v nižším režimu Národnímu CERT, a to jen incidenty s významným dopadem. Ten posuzujete podle únosné míry újmy, kterou si sami stanovíte.",
    legalBasis: `§ 15 ${ACT}; § 10 písm. b), § 14 ${LOWER}`,
  },
  "gap-3-03": {
    text: "Určuje plán role a odpovědnosti při řešení incidentu?",
    plainText:
      "Ví každý, kdo co při incidentu dělá? Kdo incident hlásí, kdo opravuje systémy, kdo mluví se zákazníky?",
    legalBasis: `§ 10 ${LOWER}; § 14 odst. 1 písm. c) ${HIGHER}`,
  },
  "gap-3-04": {
    text: "Otestovali jste plán reakce na incidenty v posledních 12 měsících?",
    plainText: "Cvičili jste? Simulaci u stolu, nácvik, cokoli?",
    legalBasis: `§ 4 odst. 1 písm. i) ${HIGHER}`,
  },
  "gap-3-05": {
    text: "Dokážete podat prvotní hlášení do 24 hodin od zjištění incidentu?",
    plainText:
      "Kdyby se něco stalo v sobotu ve 3 ráno, dokážete incident nahlásit do 24 hodin? Ve vyšším režimu NÚKIB, v nižším Národnímu CERT, v obou případech přes Portál NÚKIB.",
    legalBasis: `§ 15, § 16 odst. 1 ${ACT}`,
  },
  "gap-3-06": {
    text: "Dokážete do 72 hodin podat oznámení s podrobnostmi o incidentu?",
    plainText:
      "Dokážete do 3 dnů popsat, co se stalo, jaký to má dopad a jaké indikátory kompromitace jste našli? Oznámení podáváte u incidentů s významným dopadem; ve vyšším režimu vám NÚKIB do 24 hodin sdělí, zda má incident významný dopad na kybernetický prostor státu.",
    legalBasis: `§ 16 odst. 2 a odst. 3 písm. a) ${ACT}`,
  },
  "gap-3-07": {
    text: "Dokážete předložit závěrečnou zprávu do 30 dnů od podání oznámení?",
    plainText:
      "Dokážete do 30 dnů popsat příčinu incidentu a co jste udělali pro jeho vyřešení?",
    legalBasis: `§ 16 odst. 3 písm. c) ${ACT}`,
  },
  "gap-3-08": {
    text: "Znáte Portál NÚKIB a máte připravený přístup?",
    plainText:
      "Přihlásili jste se už na Portál NÚKIB, nebo byste ho hledali až uprostřed krize?",
    legalBasis: `§ 16 odst. 4 ${ACT}`,
  },
  "gap-3-09": {
    text: "Máte nepřetržitě dostupné kontaktní místo pro odhalení a první posouzení incidentu?",
    plainText: "Kdyby útok přišel mimo pracovní dobu, je někdo připravený ho převzít?",
    legalBasis: `§ 9 odst. 1 písm. d) ${LOWER}; § 23 odst. 1 písm. b) ${HIGHER}`,
  },
  "gap-3-10": {
    text: "Zaznamenáváte události na kritických systémech?",
    plainText: "Vedou vaše důležité systémy záznamy o tom, co se na nich děje?",
    legalBasis: `§ 9 odst. 2 ${LOWER}; § 22 ${HIGHER}`,
  },
  "gap-3-11": {
    text: "Uchováváte záznamy dostatečně dlouho pro vyšetření incidentu?",
    plainText:
      "Kdybyste se o něčem dozvěděli až po 3 měsících, můžete ještě záznamy zkontrolovat? V nižším režimu si dobu uchování stanovíte sami, ve vyšším režimu je to alespoň 18 měsíců.",
    legalBasis: `§ 9 odst. 3 ${LOWER}; § 22 odst. 5 písm. c) ${HIGHER}`,
  },
  "gap-3-12": {
    text: "Máte postup pro kontrolu záznamů a odhalování anomálií?",
    plainText: "Prochází někdo záznamy, nebo se jen hromadí?",
    legalBasis: `§ 10 písm. c), d) ${LOWER}; § 23 ${HIGHER}`,
  },
  "gap-4-01": {
    text: "Máte zdokumentovaný plán kontinuity činností?",
    plainText:
      "Kdyby zítra vypadlo celé IT, existuje písemný plán, jak pokračovat v provozu?",
    legalBasis: `§ 6 ${LOWER}; § 15 ${HIGHER}`,
  },
  "gap-4-02": {
    text: "Určuje plán kritické procesy a jejich závislost na IT?",
    plainText: "Víte, které procesy se nesmí zastavit a na kterých systémech závisí?",
    legalBasis: `§ 4 písm. f), § 6 písm. a) ${LOWER}; § 15 písm. a), b) ${HIGHER}`,
  },
  "gap-4-03": {
    text: "Stanovuje plán, jak rychle musí být systémy obnoveny a jakou ztrátu dat si můžete dovolit?",
    plainText:
      "Rozhodli jste, jak rychle musí systémy znovu běžet a o kolik dat můžete přijít? Ve vyšším režimu vyhláška požaduje stanovit dobu obnovení chodu a bod obnovení dat.",
    legalBasis: `§ 6 písm. a) ${LOWER}; § 15 písm. c) ${HIGHER}`,
  },
  "gap-4-04": {
    text: "Otestovali jste plán kontinuity činností v posledních 12 měsících?",
    plainText: "Nacvičili jste obnovu po havárii?",
    legalBasis: `§ 4 odst. 1 písm. i), § 15 písm. e) ${HIGHER}`,
  },
  "gap-4-05": {
    text: "Zálohujete pravidelně všechny kritické systémy a data?",
    plainText: "Zálohují se vaše důležité soubory a systémy automaticky?",
    legalBasis: `§ 6 písm. c) ${LOWER}; § 26 odst. 2 ${HIGHER}`,
  },
  "gap-4-06": {
    text: "Ukládáte zálohy odděleně od provozních systémů?",
    plainText:
      "Kdyby ransomware zašifroval servery, jsou zálohy v bezpečí? (Jiné místo, offline nebo v cloudu?)",
    legalBasis: `§ 11 písm. a) ${LOWER}; § 26 odst. 5 ${HIGHER}`,
  },
  "gap-4-07": {
    text: "Testujete pravidelně obnovu ze zálohy?",
    plainText:
      "Zkusili jste skutečně obnovit data ze zálohy, abyste věděli, že to funguje?",
    legalBasis: `§ 26 odst. 3 písm. a) ${HIGHER}`,
  },
  "gap-5-01": {
    text: "Vedete seznam kritických dodavatelů a poskytovatelů služeb?",
    plainText:
      "Víte, kdo jsou vaši nejdůležitější IT dodavatelé? (Cloud, e-mail, dodavatelé softwaru, IT podpora?) Ve vyšším režimu evidujete své významné dodavatele.",
    legalBasis: `§ 3 odst. 5 ${LOWER}; § 9 odst. 1 písm. d) ${HIGHER}`,
  },
  "gap-5-02": {
    text: "Posoudili jste, jak kritičtí dodavatelé zajišťují kybernetickou bezpečnost?",
    plainText:
      "Zeptali jste se klíčových dodavatelů na jejich zabezpečení nebo ověřili jejich certifikace?",
    legalBasis: `§ 3 odst. 5 ${LOWER}; § 9 odst. 2 písm. a), c) ${HIGHER}`,
  },
  "gap-5-03": {
    text: "Obsahují smlouvy s dodavateli požadavky na kybernetickou bezpečnost?",
    plainText:
      "Řeší vaše smlouvy s dodavateli bezpečnostní povinnosti, ochranu dat nebo hlášení incidentů? Co mají smlouvy obsahovat, uvádí příloha č. 2 vyhlášky č. 410/2025 Sb. a příloha č. 5 vyhlášky č. 409/2025 Sb.",
    legalBasis: `§ 13 odst. 5 ${ACT}; § 3 odst. 5 ${LOWER}; § 9 odst. 1 písm. f) ${HIGHER}`,
  },
  "gap-5-04": {
    text: "Kontrolujete, zda dodavatelé tyto požadavky plní?",
    plainText:
      "Ověřujete, zda dodavatelé bezpečnostní pravidla ze smlouvy skutečně dodržují?",
    legalBasis: `§ 9 odst. 1 písm. g), odst. 2 písm. c) ${HIGHER}`,
  },
  "gap-5-05": {
    text: "Máte postup pro bezpečnostní incidenty u dodavatelů?",
    plainText: "Kdyby napadli vašeho poskytovatele cloudu, víte, co dělat?",
    legalBasis: `příloha č. 2 písm. k) ${LOWER}; příloha č. 5 písm. i) ${HIGHER}`,
  },
  "gap-5-06": {
    text: "Pokud vaši zákazníci podléhají zákonu o kybernetické bezpečnosti, dokážete vyplnit jejich bezpečnostní dotazníky?",
    plainText:
      "Kdyby vám velký zákazník poslal formulář „doložte své zabezpečení“, dokážete ho vyplnit? Regulovaní zákazníci musí bezpečnostní požadavky promítnout do výběru dodavatelů a do smluv s nimi.",
    legalBasis: `§ 13 odst. 5 ${ACT}`,
  },
  "gap-5-07": {
    text: "Dokážete zákazníkům na vyžádání doložit svá bezpečnostní opatření?",
    plainText:
      "Kdyby se zákazník zeptal „ukažte nám své bezpečnostní politiky“, dokážete předložit dokumenty?",
    legalBasis: `§ 13 odst. 5 ${ACT}`,
  },
  "gap-8-01": {
    text: "Absolvují všichni zaměstnanci alespoň jednou ročně školení bezpečnostního povědomí?",
    plainText:
      "Byl každý zaměstnanec v posledních 12 měsících proškolen o bezpečnostních hrozbách? Vyhlášky požadují pravidelná školení, roční interval je osvědčená praxe.",
    legalBasis: `§ 5 odst. 2 písm. c) ${LOWER}; § 10 odst. 3 písm. b), d) ${HIGHER}`,
  },
  "gap-8-02": {
    text: "Pokrývá školení phishing, sociální inženýrství a práci s hesly?",
    plainText:
      "Poznají zaměstnanci podvodný e-mail nebo podezřelý telefonát a vědí, jak vytvořit dobré heslo?",
    legalBasis: `§ 5 odst. 1 písm. a), b) a příloha č. 3 ${LOWER}; § 10 odst. 2 písm. d), e) a příloha č. 6 ${HIGHER}`,
  },
  "gap-8-03": {
    text: "Absolvují pracovníci IT odborná bezpečnostní školení podle své role?",
    plainText: "Dostávají lidé, kteří spravují vaše systémy, hlubší školení než ostatní?",
    legalBasis: `§ 5 odst. 2 písm. d) ${LOWER}; § 10 odst. 2 písm. c), odst. 3 písm. c) ${HIGHER}`,
  },
  "gap-8-04": {
    text: "Evidujete absolvování školení u každého zaměstnance?",
    plainText: "Dokážete při kontrole ukázat, kdo školení absolvoval a kdy?",
    legalBasis: `§ 5 odst. 3 ${LOWER}; § 10 odst. 5 ${HIGHER}`,
  },
  "gap-8-05": {
    text: "Školíte nové zaměstnance při nástupu?",
    plainText: "Dozví se nový zaměstnanec o bezpečnosti hned v prvním týdnu?",
    legalBasis: `§ 5 odst. 2 písm. b) ${LOWER}; § 10 odst. 3 písm. b) ${HIGHER}`,
  },
  "gap-8-06": {
    text: "Máte pravidlo čistého stolu a zamčené obrazovky?",
    plainText:
      "Musí zaměstnanci zamykat obrazovku a nenechávat citlivé dokumenty volně ležet?",
    legalBasis: `§ 5 odst. 1 písm. a) ${LOWER}`,
  },
  "gap-10-01": {
    text: "Máte zdokumentovanou politiku řízení přístupu?",
    plainText: "Existuje písemné pravidlo, kdo dostane přístup ke kterým systémům?",
    legalBasis: `§ 7 odst. 1 ${LOWER}; § 13 ${HIGHER}`,
  },
  "gap-10-02": {
    text: "Přidělujete přístupy podle principu nejnižších oprávnění?",
    plainText:
      "Má každý přístup jen k systémům, které pro svou práci potřebuje, a nic navíc? Vyhlášky navíc požadují pro každého uživatele a administrátora jedinečný identifikátor a oddělený administrátorský účet.",
    legalBasis: `§ 7 odst. 1 písm. a) ${LOWER}; § 13 odst. 2 písm. b) ${HIGHER}`,
  },
  "gap-10-03": {
    text: "Kontrolujete přístupová práva alespoň jednou ročně?",
    plainText:
      "Ověřuje někdo jednou ročně, zda daný člověk přístup k systému ještě potřebuje?",
    legalBasis: `§ 7 odst. 1 písm. d) ${LOWER}; § 13 odst. 2 písm. h) ${HIGHER}`,
  },
  "gap-10-04": {
    text: "Máte postup pro odebrání přístupů při odchodu nebo změně role zaměstnance?",
    plainText:
      "Když někdo odejde nebo změní oddělení, odeberou se mu přístupy bez odkladu, nejlépe ještě týž den?",
    legalBasis: `§ 7 odst. 1 písm. e), f) ${LOWER}; § 13 odst. 2 písm. i), j) ${HIGHER}`,
  },
  "gap-10-05": {
    text: "Spravujete a sledujete privilegované účty (administrátorská práva) odděleně?",
    plainText: "Mají administrátorské účty zvláštní zabezpečení? Víte, kdo je má?",
    legalBasis: `§ 7 odst. 1 písm. a), § 8 odst. 5 písm. e) ${LOWER}; § 13 odst. 2 písm. b), § 19 odst. 6 ${HIGHER}`,
  },
  "gap-10-06": {
    text: "Máte zapnuté vícefaktorové ověření (MFA) pro veškerý vzdálený přístup?",
    plainText:
      "Potřebují zaměstnanci při práci z domova nebo vzdáleném přihlášení víc než heslo? (Například aplikaci v telefonu nebo kód v SMS.)",
    legalBasis: `§ 8 odst. 2 ${LOWER}; § 19 odst. 2 ${HIGHER}`,
  },
  "gap-10-07": {
    text: "Máte MFA zapnuté pro veškerý přístup ke kritickým systémům a administraci?",
    plainText:
      "Vyžadují vaše nejdůležitější systémy MFA i z kanceláře? Vyhlášky požadují vícefaktorové ověření pro uživatele, administrátory i technická aktiva; do té doby připouštějí klíče nebo certifikáty a teprve potom hesla.",
    legalBasis: `§ 8 odst. 2 až 4 ${LOWER}; § 19 odst. 2 a 4 ${HIGHER}`,
  },
  "gap-10-08": {
    text: "Máte pravidla pro hesla podle současných požadavků?",
    plainText:
      "Pokud zatím nepoužíváte MFA ani klíče či certifikáty: vynucujete hesla alespoň 12 znaků pro uživatele, 17 pro administrátory a 22 pro technická aktiva a bráníte opětovnému použití posledních 12 hesel?",
    legalBasis: `§ 8 odst. 4 ${LOWER}; § 19 odst. 4 ${HIGHER}`,
  },
  "gap-10-09": {
    text: "Obsahují pracovní smlouvy povinnosti v oblasti bezpečnosti?",
    plainText:
      "Je v pracovních smlouvách uvedeno, že zaměstnanci musí dodržovat bezpečnostní pravidla?",
    legalBasis: `§ 14 odst. 1 písm. a) bod 8, odst. 2 písm. e) ${ACT}`,
  },
  "gap-10-10": {
    text: "Zahrnuje postup při odchodu zaměstnance odebrání všech přístupů?",
    plainText:
      "Když někdo odchází, máte kontrolní seznam, podle kterého zrušíte každý účet a vyberete každé zařízení?",
    legalBasis: `§ 7 odst. 1 písm. f) ${LOWER}; § 13 odst. 2 písm. j) ${HIGHER}`,
  },
  "gap-13-01": {
    text: "Je fyzický přístup do serverovny, k síťovým prvkům a kritické IT infrastruktuře omezen?",
    plainText: "Je vaše serverovna zamčená?",
    legalBasis: `§ 7 odst. 2 ${LOWER}; § 17 ${HIGHER}`,
  },
  "gap-13-02": {
    text: "Máte opatření pro fyzický přístup do kanceláří (karty, kniha návštěv)?",
    plainText: "Kontrolujete, kdo vstupuje do budovy? Zapisují se návštěvy?",
    legalBasis: `§ 7 odst. 2 ${LOWER}; § 17 ${HIGHER}`,
  },
  "gap-13-03": {
    text: "Jsou kritické IT systémy chráněny před požárem, vodou a výpadkem proudu?",
    plainText: "Máte v serverovně hašení, záložní zdroj (UPS) a ochranu před zaplavením?",
    legalBasis: `§ 7 odst. 2 ${LOWER}; § 17 ${HIGHER}`,
  },
  "gap-6-01": {
    text: "Máte pravidla pro bezpečný nákup IT systémů a služeb?",
    plainText:
      "Když kupujete nový software nebo hardware, ověřujete jeho bezpečnost? Nebo vybíráte jen nejlevnější?",
    legalBasis: `§ 3 odst. 6 ${LOWER}; § 12 ${HIGHER}`,
  },
  "gap-6-02": {
    text: "Pokud vyvíjíte software, dodržujete zásady bezpečného vývoje?",
    plainText:
      "Pokud vaše firma vyvíjí software (i interní nástroje), je bezpečnost součástí vývoje?",
    legalBasis: `§ 3 odst. 6 ${LOWER}; § 12 ${HIGHER}`,
  },
  "gap-6-03": {
    text: "Máte postup pro řízení zranitelností a instalaci záplat?",
    plainText: "Instalujete bezpečnostní aktualizace, když vyjdou? Máte na to postup?",
    legalBasis: `§ 12 ${LOWER}; § 24 ${HIGHER}`,
  },
  "gap-6-04": {
    text: "Instalujete kritické bezpečnostní záplaty ve stanovené lhůtě?",
    plainText:
      "Instalujete naléhavé bezpečnostní aktualizace do pevně stanovené lhůty? Vyhláška pro nižší režim požaduje jejich bezodkladné aplikování.",
    legalBasis: `§ 12 písm. a) ${LOWER}; § 24 odst. 1 ${HIGHER}`,
  },
  "gap-6-05": {
    text: "Testujete bezpečnost před nasazením nových systémů nebo změn?",
    plainText: "Než nový systém spustíte, ověříte, že je bezpečný?",
    legalBasis: `§ 3 odst. 6 ${LOWER}; § 11 odst. 2 písm. e), § 24 odst. 5 ${HIGHER}`,
  },
  "gap-7-01": {
    text: "Máte způsob, jak měřit, zda bezpečnostní opatření fungují?",
    plainText:
      "Dokážete s důkazy odpovědět na otázku „jsme letos bezpečnější než loni?“ Obě vyhlášky požadují vyhodnocení účinnosti alespoň jednou ročně.",
    legalBasis: `§ 3 odst. 2 písm. b) ${LOWER}; § 3 písm. f) ${HIGHER}`,
  },
  "gap-7-02": {
    text: "Provádíte pravidelné interní kontroly bezpečnostních opatření?",
    plainText:
      "Kontroluje někdo pravidelně, zda se bezpečnostní pravidla skutečně dodržují? Ve vyšším režimu navíc provádíte audit kybernetické bezpečnosti alespoň jednou za 2 roky.",
    legalBasis: `§ 5 odst. 1 písm. c) ${LOWER}; § 10 odst. 4 písm. d), § 16 ${HIGHER}`,
  },
  "gap-7-03": {
    text: "Seznamuje se vedení s výsledky hodnocení účinnosti?",
    plainText: "Vidí jednatel výsledky kontrol bezpečnosti?",
    legalBasis: `§ 4 písm. d) ${LOWER}; § 4 odst. 2 písm. a), e) ${HIGHER}`,
  },
  "gap-7-04": {
    text: "Máte postup pro nápravu zjištěných nedostatků?",
    plainText: "Když najdete bezpečnostní problém, sledujete ho, dokud není vyřešen?",
    legalBasis: `§ 3 odst. 2 písm. a) bod 2 ${LOWER}; § 16 odst. 3 písm. b) ${HIGHER}`,
  },
  "gap-7-05": {
    text: "Zvažovali jste externí penetrační testy nebo skenování zranitelností?",
    plainText:
      "Zkoušel někdo záměrně proniknout do vašich systémů? V nižším režimu vyhláška požaduje pravidelné skenování zranitelností, ve vyšším režimu skenování alespoň jednou ročně a penetrační testy alespoň jednou za 2 roky.",
    legalBasis: `§ 12 písm. c) ${LOWER}; § 24 odst. 4 a 5 ${HIGHER}`,
  },
  "gap-9-01": {
    text: "Máte zdokumentovanou politiku kryptografie?",
    plainText:
      "Existuje písemné pravidlo, jak firma používá šifrování? (Stačí i krátké.) Obě vyhlášky požadují zohlednit doporučení NÚKIB, dnes dokument „Minimální požadavky na kryptografické algoritmy“.",
    legalBasis: `§ 13 odst. 1 ${LOWER}; § 25 odst. 1 ${HIGHER}`,
  },
  "gap-9-02": {
    text: "Šifrujete data při přenosu (HTTPS u webových služeb, TLS u e-mailu)?",
    plainText:
      "Jsou data při přenosu mezi systémy (web, e-mail, přenos souborů) šifrovaná? Zkuste: ukazuje váš web zámek?",
    legalBasis: `§ 11 písm. c), § 13 odst. 1 písm. a) ${LOWER}; § 18 písm. g), § 25 ${HIGHER}`,
  },
  "gap-9-03": {
    text: "Šifrujete uložená data tam, kde je to vhodné (šifrování disků, databází)?",
    plainText:
      "Jsou vaše notebooky šifrované (Windows BitLocker, Mac FileVault)? A co disky serverů?",
    legalBasis: `§ 13 odst. 1 písm. a) ${LOWER}; § 25, § 26 odst. 3 písm. c) ${HIGHER}`,
  },
  "gap-9-04": {
    text: "Máte postup pro správu šifrovacích klíčů?",
    plainText:
      "Pokud šifrujete, je jasné, kdo drží klíče a co se stane, když tento člověk odejde?",
    legalBasis: `§ 13 odst. 1 písm. b) ${LOWER}; § 25 odst. 3 ${HIGHER}`,
  },
  "gap-11-01": {
    text: "Jsou interní komunikační kanály zabezpečené?",
    plainText:
      "Je firemní e-mail šifrovaný? Používáte pro citlivá témata zabezpečené aplikace (Teams, Signal) místo nešifrovaných SMS?",
    legalBasis: `§ 13 odst. 2 písm. a) ${LOWER}; § 25 odst. 2 písm. a) ${HIGHER}`,
  },
  "gap-11-02": {
    text: "Máte určené nouzové komunikační kanály pro krizové situace?",
    plainText:
      "Kdyby při útoku vypadl e-mail, jak spolu tým bude komunikovat? Máte záložní plán (telefonní řetězec, skupina v Signalu, seznam soukromých e-mailů)?",
    legalBasis: `§ 13 odst. 2 písm. b) ${LOWER}; § 25 odst. 2 písm. b) ${HIGHER}`,
  },
  "gap-11-03": {
    text: "Máte pravidla pro bezpečné používání mobilních zařízení?",
    plainText:
      "Vztahují se bezpečnostní pravidla na firemní i soukromé telefony používané k práci? (Zámek obrazovky, šifrování, vzdálené vymazání?)",
    legalBasis: `§ 7 odst. 1 písm. c) ${LOWER}; § 13 odst. 2 písm. e) ${HIGHER}`,
  },
  "gap-12-01": {
    text: "Chrání vaši síť firewall?",
    plainText: "Je mezi firemní sítí a internetem firewall?",
    legalBasis: `§ 9 odst. 1 písm. a), § 11 ${LOWER}; § 18, § 21 odst. 1 ${HIGHER}`,
  },
  "gap-12-02": {
    text: "Je vaše Wi-Fi zabezpečená a oddělená od přístupu pro hosty?",
    plainText:
      "Je firemní Wi-Fi chráněná heslem? Je Wi-Fi pro hosty v jiné síti než vaše firemní systémy?",
    legalBasis: `§ 11 písm. a) ${LOWER}; § 18 písm. a) ${HIGHER}`,
  },
  "gap-12-03": {
    text: "Máte-li provozní technologie (OT) nebo průmyslové systémy, jsou v jiné síti než kancelářská IT?",
    plainText: "Jsou výrobní systémy v jiné síti než kancelářské počítače a e-mail?",
    legalBasis: `§ 11 písm. a) ${LOWER}; § 27 písm. c) ${HIGHER}`,
  },
  "gap-12-04": {
    text: "Máte systém pro detekci nebo prevenci průniků?",
    plainText: "Sleduje něco vaši síť kvůli podezřelé aktivitě?",
    legalBasis: `§ 9 odst. 1 ${LOWER}; § 21 ${HIGHER}`,
  },
  "gap-14-01": {
    text: "Jsou všechny bezpečnostní politiky datované a podepsané?",
    plainText:
      "Máte ke každé bezpečnostní politice podepsaný a datovaný dokument? Podpis vedení vyhlášky nepředepisují, ale doloží, kdo politiku vydal a od kdy platí.",
    legalBasis: `Osvědčená praxe; § 3 odst. 3 ${LOWER}; § 4 odst. 1 písm. b), § 6 ${HIGHER}`,
  },
  "gap-14-02": {
    text: "Vedete záznamy o rozhodnutích a změnách, které se týkají bezpečnosti?",
    plainText:
      "Kdyby se NÚKIB při kontrole zeptal „kdo a kdy rozhodl, že toto riziko přijmete?“, dokážete to ukázat?",
    legalBasis: `§ 3 odst. 2 ${LOWER}; § 3 písm. i), § 11 odst. 2 písm. a) ${HIGHER}`,
  },
  "gap-14-03": {
    text: "Dokážete bezpečnostní opatření na vyžádání doložit?",
    plainText:
      "Kdyby kontrolor řekl „ukažte, že máte zapnuté MFA“, dokážete hned udělat snímek obrazovky?",
    legalBasis: `§ 55 ${ACT}; § 8 písm. c), § 10 odst. 2 ${INSPECTION}`,
  },
  "gap-14-04": {
    text: "Jsou doklady opatřeny datem?",
    plainText: "Mají vaše snímky obrazovky a dokumenty datum?",
    legalBasis: "Osvědčená praxe",
  },
  "gap-14-05": {
    text: "Máte veškerou dokumentaci k souladu na jednom místě?",
    plainText: "Je veškerá bezpečnostní dokumentace na jednom místě?",
    legalBasis: "Osvědčená praxe",
  },
  "gap-14-06": {
    text: "Je dokumentace verzovaná a změny dohledatelné?",
    plainText: "Dokážete ukázat, co se změnilo mezi verzí 1 a verzí 2 politiky?",
    legalBasis: `Osvědčená praxe; § 3 odst. 2 písm. c) ${LOWER}`,
  },
  "gap-14-07": {
    text: "Dokázali byste rychle vyhovět, kdyby NÚKIB při kontrole požadoval podklady?",
    plainText:
      "Kdyby NÚKIB při kontrole chtěl dokumenty, záznamy nebo údaje, dokázali byste je rychle dodat?",
    legalBasis: `§ 55 ${ACT}; § 8 písm. c), § 10 odst. 2 ${INSPECTION}`,
  },
};
