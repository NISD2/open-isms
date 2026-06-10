#!/usr/bin/env bun
/**
 * Generates the German LaTeX PDF for the NIS2 CEO course.
 *
 * Reads German .de.md content files and quiz .ts files,
 * converts them to LaTeX, and writes the .tex file.
 *
 * Run: bun run scripts/generate-german-pdf.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "courses/nis2-ceo/content");
const QUIZ_DIR = join(ROOT, "courses/nis2-ceo/quizzes");
const OUT_TEX = join(ROOT, "courses/nis2-ceo/pdf-book/nis2-management-training-de.tex");

// ---------------------------------------------------------------------------
// Module structure (mirrors courses/nis2-ceo/index.ts)
// ---------------------------------------------------------------------------

const MODULES = [
  {
    id: "foundation",
    title: null, // no chapter heading for foundation
    chapterIntro: null,
    lessons: ["0-1"],
  },
  {
    id: "module-1",
    title: "Das Gesetz",
    chapterIntro:
      "Dieses Modul legt das rechtliche Fundament von NIS2 dar: was das Gesetz ist, für wen es gilt, was es von Ihnen persönlich verlangt und was passiert, wenn Sie es nicht einhalten. Am Ende können Sie die fünf Grundlagenfragen beantworten, die das BSI von jedem betroffenen Geschäftsführer erwartet.",
    lessons: ["1-1","1-2","1-3","1-4","1-5","1-6","1-7","1-8","1-9","1-10","1-11","1-12"],
  },
  {
    id: "module-2",
    title: "Risiko und die 10 Maßnahmen",
    chapterIntro:
      "Artikel 21 der NIS2-Richtlinie verlangt zehn konkrete Maßnahmen zum Cybersicherheitsrisikomanagement. Dieses Modul behandelt, was jede Maßnahme von Ihnen als Mitglied des Leitungsorgans verlangt – nicht als technischer Experte, sondern als informierter Entscheidungsträger.",
    lessons: ["2-1","2-2","2-3","2-4","2-5","2-6","2-7","2-8","2-9","2-10","2-11","2-12","2-13","2-14","2-15"],
  },
  {
    id: "module-3",
    title: "Entscheidungshilfe",
    chapterIntro:
      "Dieses Modul gibt Ihnen die Fragen, die Sie stellen müssen, die Protokolle, die Sie unterzeichnen müssen, und die Prüfpunkte, die Sie persönlich verstehen müssen – damit Ihre Aufgabe als Mitglied des Leitungsorgans verteidigbar ist.",
    lessons: ["3-1","3-2","3-3","3-4","3-5","3-6","3-7","3-8","3-9","3-10","3-11"],
  },
  {
    id: "module-4",
    title: "Schutz",
    chapterIntro:
      "Dieses Modul behandelt die konkreten Schutzmaßnahmen und Dokumentationsanforderungen, die das NIS2-Regime von betroffenen Einrichtungen verlangt – mit Fokus auf das, was das Leitungsorgan genehmigen, unterzeichnen und überwachen muss.",
    lessons: ["4-1","4-2","4-3","4-4","4-5","4-6"],
  },
  {
    id: "final",
    title: "Abschluss",
    chapterIntro: null,
    lessons: ["5-1","5-2"],
  },
];

// ---------------------------------------------------------------------------
// Helpers: LaTeX escaping and markdown → LaTeX conversion
// ---------------------------------------------------------------------------

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/€/g, "\\euro{}")
    .replace(/„/g, "\\glqq{}")
    .replace(/"/g, "\\grqq{}")
    .replace(/«/g, "\\flqq{}")
    .replace(/»/g, "\\frqq{}")
    .replace(/–/g, "--")
    .replace(/—/g, "---")
    .replace(/…/g, "\\ldots{}");
}

/** Resolve [[term|translation]] and [[term]] markup */
function resolveMarkup(text: string): string {
  // [[term|translation]] → use translation
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_m, _term, translation) => translation);
  // [[term]] → use term
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_m, term) => term);
  return text;
}

/** Convert inline markdown (bold, italic) to LaTeX */
function inlineMarkdown(text: string): string {
  text = resolveMarkup(text);
  text = escapeLatex(text);
  // **bold** → \textbf{bold}
  text = text.replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}");
  // *italic* → \textit{italic}
  text = text.replace(/\*([^*]+)\*/g, "\\textit{$1}");
  return text;
}

// ---------------------------------------------------------------------------
// Parse German markdown content file → LaTeX
// ---------------------------------------------------------------------------

interface ParsedSection {
  type: "heading1" | "heading2" | "paragraph" | "list_bullet" | "list_numbered" | "blank";
  level?: number;
  text?: string;
  items?: string[];
}

function parseMd(content: string): ParsedSection[] {
  const lines = content.split("\n");
  const sections: ParsedSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Blank line
    if (line.trim() === "") {
      sections.push({ type: "blank" });
      i++;
      continue;
    }

    // Heading 1: # ...
    if (line.startsWith("# ")) {
      sections.push({ type: "heading1", text: line.slice(2).trim() });
      i++;
      continue;
    }

    // Heading 2: ## ...
    if (line.startsWith("## ")) {
      sections.push({ type: "heading2", text: line.slice(3).trim() });
      i++;
      continue;
    }

    // Heading 3: ### ... (treat as heading2)
    if (line.startsWith("### ")) {
      sections.push({ type: "heading2", text: line.slice(4).trim() });
      i++;
      continue;
    }

    // Bullet list: - item or * item
    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.match(/^[-*] /)) {
        items.push(lines[i]!.replace(/^[-*] /, "").trim());
        i++;
      }
      sections.push({ type: "list_bullet", items });
      continue;
    }

    // Numbered list: 1. item
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.match(/^\d+\. /)) {
        items.push(lines[i]!.replace(/^\d+\. /, "").trim());
        i++;
      }
      sections.push({ type: "list_numbered", items });
      continue;
    }

    // Multi-line paragraph: collect until blank or heading
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== "" &&
      !lines[i]!.startsWith("#") &&
      !lines[i]!.match(/^[-*] /) &&
      !lines[i]!.match(/^\d+\. /)
    ) {
      paraLines.push(lines[i]!.trim());
      i++;
    }
    if (paraLines.length > 0) {
      sections.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return sections;
}

/** Check if a heading is the "Wichtige Erkenntnisse" section */
function isKeyTakeaways(heading: string): boolean {
  return /wichtige erkenntnisse/i.test(heading);
}

/** Check if a heading is an "actionbox" (Was Sie ... fragen/tun/machen) */
function isActionBox(heading: string): boolean {
  return /^(was sie|fragen an|fragen sie|ihre frage|eine frage)/i.test(heading);
}

/** Check if a heading is a "warningbox" */
function isWarningBox(heading: string): boolean {
  return /^(wichtig|achtung|warnung|persönliche haftung)/i.test(heading);
}

function sectionsToLatex(sections: ParsedSection[]): string {
  const out: string[] = [];
  let i = 0;

  while (i < sections.length) {
    const s = sections[i]!;

    if (s.type === "blank") {
      i++;
      continue;
    }

    if (s.type === "heading1") {
      // Skip — handled by caller
      i++;
      continue;
    }

    if (s.type === "heading2") {
      const heading = s.text!;

      if (isKeyTakeaways(heading)) {
        // Collect the numbered list that follows
        i++;
        // Skip blanks
        while (i < sections.length && sections[i]!.type === "blank") i++;
        if (i < sections.length && sections[i]!.type === "list_numbered") {
          const items = sections[i]!.items!;
          out.push("\\begin{keytakeaways}");
          out.push("\\begin{enumerate}");
          for (const item of items) {
            out.push(`  \\item ${inlineMarkdown(item)}`);
          }
          out.push("\\end{enumerate}");
          out.push("\\end{keytakeaways}");
          out.push("");
          i++;
        }
        continue;
      }

      if (isActionBox(heading)) {
        out.push(`\\begin{actionboxde}{${inlineMarkdown(heading)}}`);
        i++;
        // Collect content until next heading or end
        while (i < sections.length && sections[i]!.type !== "heading2" && sections[i]!.type !== "heading1") {
          const cs = sections[i]!;
          if (cs.type === "paragraph") {
            out.push(inlineMarkdown(cs.text!));
            out.push("");
          } else if (cs.type === "list_bullet") {
            out.push("\\begin{itemize}");
            for (const item of cs.items!) {
              out.push(`  \\item ${inlineMarkdown(item)}`);
            }
            out.push("\\end{itemize}");
            out.push("");
          } else if (cs.type === "list_numbered") {
            out.push("\\begin{enumerate}");
            for (const item of cs.items!) {
              out.push(`  \\item ${inlineMarkdown(item)}`);
            }
            out.push("\\end{enumerate}");
            out.push("");
          }
          i++;
        }
        out.push("\\end{actionboxde}");
        out.push("");
        continue;
      }

      if (isWarningBox(heading)) {
        out.push(`\\begin{warningboxde}{${inlineMarkdown(heading)}}`);
        i++;
        while (i < sections.length && sections[i]!.type !== "heading2" && sections[i]!.type !== "heading1") {
          const cs = sections[i]!;
          if (cs.type === "paragraph") {
            out.push(inlineMarkdown(cs.text!));
            out.push("");
          }
          i++;
        }
        out.push("\\end{warningboxde}");
        out.push("");
        continue;
      }

      // Regular subsection
      out.push(`\\subsection*{${inlineMarkdown(heading)}}`);
      out.push("");
      i++;
      continue;
    }

    if (s.type === "paragraph") {
      out.push(inlineMarkdown(s.text!));
      out.push("");
      i++;
      continue;
    }

    if (s.type === "list_bullet") {
      out.push("\\begin{itemize}");
      for (const item of s.items!) {
        out.push(`  \\item ${inlineMarkdown(item)}`);
      }
      out.push("\\end{itemize}");
      out.push("");
      i++;
      continue;
    }

    if (s.type === "list_numbered") {
      out.push("\\begin{enumerate}");
      for (const item of s.items!) {
        out.push(`  \\item ${inlineMarkdown(item)}`);
      }
      out.push("\\end{enumerate}");
      out.push("");
      i++;
      continue;
    }

    i++;
  }

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Parse quiz .ts file → questions list
// ---------------------------------------------------------------------------

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function parseQuizFile(lessonSlug: string): QuizQuestion[] {
  const filePath = join(QUIZ_DIR, `${lessonSlug}.ts`);
  if (!existsSync(filePath)) return [];

  const src = readFileSync(filePath, "utf-8");
  const questions: QuizQuestion[] = [];

  // Extract question blocks
  // Pattern: { id: "...", question: { en: "..." }, options: [...], correctIndex: N, explanation: { en: "..." } }
  const qRegex = /\{\s*id:\s*"[^"]+",\s*question:\s*\{[^}]+en:\s*"((?:[^"\\]|\\.)*)"\s*[^}]*\},\s*options:\s*\[([\s\S]*?)\],\s*correctIndex:\s*(\d+),\s*explanation:\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)"[^}]*\}/g;

  let match: RegExpExecArray | null;
  while ((match = qRegex.exec(src)) !== null) {
    const questionText = match[1]!.replace(/\\"/g, '"').replace(/\\n/g, " ");
    const optionsBlock = match[2]!;
    const correctIndex = parseInt(match[3]!, 10);
    const explanation = match[4]!.replace(/\\"/g, '"').replace(/\\n/g, " ");

    // Parse options - extract en: "..." from each option object
    const options: string[] = [];
    const optRegex = /en:\s*"((?:[^"\\]|\\.)*)"/g;
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optRegex.exec(optionsBlock)) !== null) {
      options.push(optMatch[1]!.replace(/\\"/g, '"').replace(/\\n/g, " "));
    }

    if (options.length > 0) {
      questions.push({ question: questionText, options, correctIndex, explanation });
    }
  }

  return questions;
}

function quizToLatex(questions: QuizQuestion[]): string {
  if (questions.length === 0) return "";

  const out: string[] = [];
  out.push("\\begin{quizbox}");
  out.push("\\setcounter{quizq}{0}");
  out.push("");

  for (const q of questions) {
    out.push(`\\quizquestion{${escapeLatex(q.question)}}{`);
    for (let j = 0; j < q.options.length; j++) {
      const escaped = escapeLatex(q.options[j]!);
      if (j === q.correctIndex) {
        out.push(`  \\item \\correct{${escaped}}`);
      } else {
        out.push(`  \\item ${escaped}`);
      }
    }
    out.push("}");
    if (q.explanation) {
      out.push(`\\quizexplain{${escapeLatex(q.explanation)}}`);
    }
    out.push("");
  }

  out.push("\\end{quizbox}");
  out.push("");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Build lesson LaTeX from .de.md content + quiz
// ---------------------------------------------------------------------------

function buildLesson(lessonSlug: string): string {
  const filePath = join(CONTENT_DIR, `${lessonSlug}.de.md`);
  if (!existsSync(filePath)) {
    console.warn(`  Missing: ${filePath}`);
    return "";
  }

  const content = readFileSync(filePath, "utf-8");
  const sections = parseMd(content);

  // Extract title from first heading
  const titleSection = sections.find((s) => s.type === "heading1");
  const rawTitle = titleSection?.text ?? lessonSlug;

  // Parse lesson number from title "Lektion X.X: Title" or use slug
  const titleMatch = rawTitle.match(/^Lektion\s+([\d.]+):\s*(.+)$/);
  const lessonNum = titleMatch ? titleMatch[1]! : lessonSlug.replace("-", ".");
  const lessonTitle = titleMatch ? titleMatch[2]! : rawTitle;

  const out: string[] = [];

  // Section heading
  out.push(`%  LESSON ${lessonNum} `);
  out.push(`\\section{\\lessontag{${lessonNum}}${inlineMarkdown(lessonTitle)}}`);
  out.push("");

  // Body (skip heading1 since we already used it)
  const bodyContent = sectionsToLatex(sections);
  out.push(bodyContent);

  // Quiz
  const quizQuestions = parseQuizFile(lessonSlug);
  if (quizQuestions.length > 0) {
    out.push(quizToLatex(quizQuestions));
  }

  out.push("");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// LaTeX preamble
// ---------------------------------------------------------------------------

function buildPreamble(): string {
  return `% ============================================================
%  NIS2 Geschäftsführer-Schulung — PDF-Buch (Deutsch)
%  Compile with: pdflatex nis2-management-training-de.tex
%  Run twice for correct TOC/cross-references
% ============================================================

\\documentclass[11pt,a4paper,twoside]{book}

%  Encoding & Fonts
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage{microtype}

%  German language support
\\usepackage[ngerman]{babel}

%  Math symbols
\\usepackage{amssymb}
\\usepackage{amsmath}

%  Euro symbol
\\usepackage{eurosym}

%  Layout
\\usepackage[
  top=25mm, bottom=25mm,
  inner=28mm, outer=20mm,
  headheight=14pt
]{geometry}
\\usepackage{fancyhdr}
\\usepackage{emptypage}

%  Colors
\\usepackage{xcolor}
\\definecolor{nisd2blue}{HTML}{284b63}
\\definecolor{nisd2mid}{HTML}{3a6b8a}
\\definecolor{nisd2light}{HTML}{d0e4f0}
\\definecolor{nisd2accent}{HTML}{e8824a}
\\definecolor{warningred}{HTML}{c0392b}
\\definecolor{successgreen}{HTML}{27ae60}
\\definecolor{quizgray}{HTML}{f4f6f8}
\\definecolor{correctgreen}{HTML}{d5f0dc}
\\definecolor{keybox}{HTML}{fef9ec}
\\definecolor{keyboxborder}{HTML}{f0c040}
\\definecolor{actionbox}{HTML}{eaf4fb}
\\definecolor{actionborder}{HTML}{3a6b8a}

%  Graphics
\\usepackage{tikz}
\\usetikzlibrary{shapes.geometric, arrows.meta, positioning, fit, backgrounds, calc}
\\usepackage{graphicx}

%  Boxes
\\usepackage[most]{tcolorbox}
\\tcbuselibrary{skins, breakable}

%  Lists
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=*, noitemsep, topsep=2pt}
\\setlist[enumerate]{leftmargin=*, noitemsep, topsep=2pt}

%  Tables
\\usepackage{booktabs}
\\usepackage{tabularx}
\\usepackage{array}
\\usepackage{multirow}

%  Multi-column
\\usepackage{multicol}

%  Chapter/Section Styling
\\usepackage{titlesec}

\\titleformat{\\chapter}[display]
  {\\normalfont\\huge\\bfseries\\color{nisd2blue}}
  {\\chaptertitlename\\ \\thechapter}{12pt}{\\Huge}
\\titleformat{\\section}
  {\\normalfont\\Large\\bfseries\\color{nisd2blue}}
  {\\thesection}{1em}{}
\\titleformat{\\subsection}
  {\\normalfont\\large\\bfseries\\color{nisd2mid}}
  {\\thesubsection}{1em}{}

%  Headers & Footers
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[LE]{\\small\\nouppercase{\\textcolor{nisd2blue}{\\leftmark}}}
\\fancyhead[RO]{\\small\\nouppercase{\\textcolor{nisd2blue}{\\rightmark}}}
\\fancyfoot[LE,RO]{\\small\\thepage}
\\fancyfoot[CE,CO]{\\small\\textcolor{nisd2mid}{NIS2 Gesch\\"{a}ftsf\\"{u}hrer-Schulung}}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{nisd2light}\\leaders\\hrule height \\headrulewidth\\hfill}}

%  Hyperlinks
\\usepackage{hyperref}
\\hypersetup{
  colorlinks=true,
  linkcolor=nisd2blue,
  urlcolor=nisd2mid,
  citecolor=nisd2mid,
  pdftitle={NIS2 Gesch\\"{a}ftsf\\"{u}hrer-Schulung},
  pdfauthor={NISD2},
  pdfsubject={NIS2-Richtlinie -- Schulung f\\"{u}r Leitungsorgane},
  bookmarksnumbered=true
}

% ============================================================
%  Custom Environments (German)
% ============================================================

% Key Takeaways box (Wichtige Erkenntnisse)
\\newtcolorbox{keytakeaways}{
  enhanced, breakable,
  colback=keybox,
  colframe=keyboxborder,
  fonttitle=\\bfseries\\color{nisd2blue},
  title={Wichtige Erkenntnisse},
  left=6pt, right=6pt, top=4pt, bottom=4pt,
  arc=3pt
}

% Action Item box (with custom title)
\\newtcolorbox{actionboxde}[1]{
  enhanced, breakable,
  colback=actionbox,
  colframe=actionborder,
  fonttitle=\\bfseries\\color{nisd2blue},
  title={#1},
  left=6pt, right=6pt, top=4pt, bottom=4pt,
  arc=3pt
}

% Warning box (with custom title)
\\newtcolorbox{warningboxde}[1]{
  enhanced, breakable,
  colback=white,
  colframe=warningred,
  fonttitle=\\bfseries\\color{warningred},
  title={#1},
  left=6pt, right=6pt, top=4pt, bottom=4pt,
  arc=3pt
}

% Quiz container
\\newtcolorbox{quizbox}{
  enhanced, breakable,
  colback=quizgray,
  colframe=nisd2mid,
  fonttitle=\\bfseries\\color{white},
  coltitle=white,
  attach boxed title to top left={yshift=-2mm, xshift=4mm},
  boxed title style={colback=nisd2mid, arc=2pt},
  title={Quiz},
  left=6pt, right=6pt, top=8pt, bottom=4pt,
  arc=3pt
}

% Correct answer highlight
\\newtcolorbox{correctanswer}{
  enhanced,
  colback=correctgreen,
  colframe=successgreen,
  left=4pt, right=4pt, top=2pt, bottom=2pt,
  arc=2pt, boxrule=0.5pt
}

% Definition box
\\newtcolorbox{definitionbox}[1]{
  enhanced,
  colback=nisd2light!40,
  colframe=nisd2mid,
  fonttitle=\\bfseries\\small\\color{nisd2blue},
  title={#1},
  left=5pt, right=5pt, top=3pt, bottom=3pt,
  arc=2pt
}

% Module intro box
\\newtcolorbox{moduleintro}{
  enhanced,
  colback=nisd2blue,
  colframe=nisd2blue,
  coltext=white,
  left=10pt, right=10pt, top=8pt, bottom=8pt,
  arc=4pt
}

% Lesson number command
\\newcommand{\\lessontag}[1]{%
  \\texorpdfstring{%
    \\setlength{\\fboxsep}{3pt}\\colorbox{nisd2blue}{\\textcolor{white}{\\footnotesize\\bfseries #1}}\\quad%
  }{Lektion #1\\ }%
}

% Quiz question environment
\\newcounter{quizq}
\\newcommand{\\quizquestion}[2]{%
  \\stepcounter{quizq}
  \\vspace{4pt}
  \\noindent\\textbf{F\\thequizq.} #1
  \\vspace{2pt}
  \\begin{enumerate}[label=\\Alph*., leftmargin=16pt, noitemsep]
    #2
  \\end{enumerate}
}

%  Answer key tracking
\\newwrite\\answerfile
\\immediate\\openout\\answerfile=\\jobname.ans

\\newcommand{\\correct}[1]{%
  #1%
  \\immediate\\write\\answerfile{\\string\\ansentry{\\thesection}{\\thequizq}{\\Alph{enumi}}}%
}

\\newcommand{\\currentanslesson}{}
\\newcommand{\\ansentry}[3]{%
  \\def\\thislesson{#1}%
  \\ifx\\thislesson\\currentanslesson\\else%
    \\medskip\\noindent\\textbf{\\small Lektion #1}\\nopagebreak\\par%
    \\global\\def\\currentanslesson{#1}%
  \\fi%
  \\noindent\\hspace{1.5em}{\\small F#2:~\\textbf{#3}}\\par%
}

\\newcommand{\\quizexplain}[1]{%
  \\vspace{2pt}
  \\noindent\\small\\textit{\\textcolor{nisd2mid}{#1}}
  \\vspace{6pt}
}

\\newcommand{\\courseversion}{v1.0.0}
`;
}

// ---------------------------------------------------------------------------
// Title page (German)
// ---------------------------------------------------------------------------

function buildTitlePage(): string {
  return `\\begin{titlepage}
  \\pagecolor{nisd2blue}
  \\color{white}
  \\vspace*{2cm}
  \\begin{center}
    \\begin{tikzpicture}
      \\node[circle, fill=white, minimum size=2.8cm] (logo) at (0,0) {
        \\textcolor{nisd2blue}{\\Large\\bfseries NIS2}
      };
    \\end{tikzpicture}

    \\vspace{1.2cm}
    {\\fontsize{34}{40}\\selectfont\\bfseries NIS2 Gesch\\"{a}ftsf\\"{u}hrer-Schulung}

    \\vspace{0.6cm}
    {\\Large\\bfseries Alles, was die Richtlinie von einem Mitglied\\\\[4pt]
    des Leitungsorgans verlangt}

    \\vspace{1.2cm}
    \\begin{tikzpicture}
      \\draw[white, line width=0.5pt] (0,0) -- (10,0);
    \\end{tikzpicture}

    \\vspace{0.8cm}
    {\\large Strukturiert nach den drei Kompetenzfeldern des BSI\\\\
    und den zehn Ma\\ss{}nahmen aus Artikel~21}

    \\vspace{1.6cm}
    \\begin{tikzpicture}
      \\foreach \\i/\\label in {
        0/Das Gesetz,
        72/Risiko \\&\\\\die 10 Ma\\ss{}n.,
        144/Entschei-\\\\dungshilfe,
        216/Schutz,
        288/Abschluss}{
        \\node[circle, fill=white!20, text=white, minimum size=1.8cm,
              font=\\small\\bfseries, align=center] at (\\i:3.2cm) {\\label};
      }
      \\node[circle, fill=white, text=nisd2blue, minimum size=1.6cm,
            font=\\bfseries, align=center] at (0,0) {5\\\\Module};
    \\end{tikzpicture}

    \\vspace{1.6cm}
    {\\small\\bfseries 47 Lektionen\\ \\ $\\bullet$\\ \\ 4 Stunden Inhalt\\ \\
    $\\bullet$\\ \\ Quiz nach jeder Lektion}

    \\vspace{0.6cm}
    {\\small \\courseversion \\quad NISD2 --- \\texttt{www.nisd2.eu}}
  \\end{center}
  \\pagecolor{white}
  \\color{black}
\\end{titlepage}
`;
}

// ---------------------------------------------------------------------------
// Copyright page (German)
// ---------------------------------------------------------------------------

function buildCopyrightPage(): string {
  return `\\thispagestyle{empty}
\\vspace*{\\fill}
\\begin{small}
\\noindent\\textbf{Über dieses Buch}

Dieses Buch ist eine druckfertige Version des NIS2-Schulungskurses f\\"{u}r Gesch\\"{a}ftsf\\"{u}hrer, der unter \\texttt{www.nisd2.eu} verf\\"{u}gbar ist. Es folgt den drei Kompetenzfeldern, die Artikel~20(2) der NIS2-Richtlinie vorschreibt: Risiken erkennen, die zu ihrer Bew\\"{a}ltigung eingesetzten Ma\\ss{}nahmen bewerten und verstehen, wie sich diese Risiken auf die vom Unternehmen erbrachten Dienste auswirken.

\\vspace{6pt}
\\noindent\\textbf{Keine Rechtsberatung.} Dieser Kurs vermittelt die EU-Richtlinie und die dahinterstehenden Konzepte. Er ist keine Rechtsberatung, und keine Stelle in der Europ\\"{a}ischen Union zertifiziert derzeit NIS2-Trainer oder Schulungsprogramme. Dieses Dokument ist Schulungsmaterial, keine rechtliche Zertifizierung.

\\vspace{6pt}
\\noindent\\textbf{Deutscher Standard.} Dieser Kurs bezieht sich auf die deutsche Umsetzung -- das BSIG und das BSI --, weil Deutschlands Transposition die strengste in der EU ist. Wenn Sie Ihre Compliance nach deutschem Standard aufbauen, erf\\"{u}llen oder \\"{u}bertreffen Sie die Anforderungen in jedem anderen Mitgliedstaat.

\\vspace{6pt}
\\noindent\\textbf{Bestehensschwelle.} Jedes Lektion-Quiz erfordert 75\\,\\% zum Bestehen.

\\vspace{6pt}
\\noindent $\\copyright$ NISD2. Alle Rechte vorbehalten.
\\end{small}
\\vspace*{\\fill}
\\newpage
`;
}

// ---------------------------------------------------------------------------
// Chapter intro (module-level)
// ---------------------------------------------------------------------------

function buildChapterIntro(module: typeof MODULES[number]): string {
  if (!module.title) return "";
  const out: string[] = [];
  out.push(`\\chapter{${module.title}}`);
  out.push("");
  if (module.chapterIntro) {
    out.push("\\begin{moduleintro}");
    out.push(`\\textbf{Modul ${MODULES.indexOf(module)} -- ${module.lessons.length} Lektionen}`);
    out.push("");
    out.push(inlineMarkdown(module.chapterIntro));
    out.push("\\end{moduleintro}");
    out.push("");
    out.push("\\bigskip");
    out.push("");
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generate(): string {
  console.log("Generating German LaTeX PDF...");

  const parts: string[] = [];

  // Preamble
  parts.push(buildPreamble());
  parts.push("");
  parts.push("% ============================================================");
  parts.push("%  Document");
  parts.push("% ============================================================");
  parts.push("");
  parts.push("\\begin{document}");
  parts.push("");

  // Title page
  parts.push(buildTitlePage());
  parts.push("");

  // Copyright page
  parts.push(buildCopyrightPage());
  parts.push("");

  // Table of contents
  parts.push("\\tableofcontents");
  parts.push("\\newpage");
  parts.push("");

  // Foundation module (no chapter heading)
  const foundationModule = MODULES[0]!;
  parts.push("% ============================================================");
  parts.push("%  GRUNDLAGEN");
  parts.push("% ============================================================");
  parts.push("");
  parts.push(`\\chapter*{Über diesen Kurs}`);
  parts.push(`\\addcontentsline{toc}{chapter}{Über diesen Kurs}`);
  parts.push(`\\markboth{Über diesen Kurs}{Über diesen Kurs}`);
  parts.push("");

  for (const slug of foundationModule.lessons) {
    const filePath = join(CONTENT_DIR, `${slug}.de.md`);
    if (!existsSync(filePath)) {
      console.warn(`  Skipping missing: ${slug}.de.md`);
      continue;
    }
    const content = readFileSync(filePath, "utf-8");
    const sections = parseMd(content);
    // Skip the H1 heading — already handled by chapter
    const bodyContent = sectionsToLatex(sections);
    parts.push(bodyContent);
  }

  parts.push("\\newpage");
  parts.push("");

  // Main modules (1-5)
  for (let mi = 1; mi < MODULES.length; mi++) {
    const mod = MODULES[mi]!;
    parts.push(`% ============================================================`);
    parts.push(`%  KAPITEL ${mi}: ${(mod.title ?? "").toUpperCase()}`);
    parts.push(`% ============================================================`);
    parts.push("");
    parts.push(buildChapterIntro(mod));

    for (const slug of mod.lessons) {
      console.log(`  Processing lesson: ${slug}`);
      parts.push(buildLesson(slug));
    }
  }

  // Answer key appendix
  parts.push("% ============================================================");
  parts.push("%  ANHANG: ANTWORTSCHLÜSSEL");
  parts.push("% ============================================================");
  parts.push("");
  parts.push("\\appendix");
  parts.push(`\\chapter{Antwortschl\\"{u}ssel}`);
  parts.push(`\\markboth{Antwortschl\\"{u}ssel}{Antwortschl\\"{u}ssel}`);
  parts.push("");
  parts.push(`\\noindent Die korrekten Antworten f\\"{u}r alle Quiz-Fragen:`);
  parts.push("\\medskip");
  parts.push("");
  parts.push(`\\IfFileExists{\\jobname.ans}{\\input{\\jobname.ans}}{\\textit{(Antwortdatei noch nicht verf\\"{u}gbar -- bitte zweimal kompilieren)}}`);
  parts.push("");
  parts.push("\\end{document}");

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const latex = generate();
writeFileSync(OUT_TEX, latex, "utf-8");
console.log(`\nWritten to: ${OUT_TEX}`);
console.log("To compile: cd courses/nis2-ceo/pdf-book && pdflatex nis2-management-training-de.tex && pdflatex nis2-management-training-de.tex");
