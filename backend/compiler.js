import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import katex from 'katex';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'temp_builds');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let isPdfLatexAvailable = null;

export function checkPdfLatex() {
  if (isPdfLatexAvailable !== null) {
    return Promise.resolve(isPdfLatexAvailable);
  }

  return new Promise((resolve) => {
    exec('pdflatex --version', (error) => {
      isPdfLatexAvailable = !error;
      resolve(isPdfLatexAvailable);
    });
  });
}
const PACKAGE_REGISTRY = {
  // Math packages
  'amsmath': { features: ['align', 'gather', 'multline', 'split', 'cases', 'bmatrix', 'pmatrix', 'vmatrix', 'Bmatrix', 'smallmatrix', 'subequations', 'tag', 'notag', 'intertext', 'text'] },
  'amssymb': { features: ['mathbb', 'mathfrak', 'mathcal'] },
  'amsfonts': { features: ['mathbb', 'mathfrak'] },
  'mathtools': { features: ['amsmath', 'dcases', 'rcases'] },
  'bm': { features: ['bm'] },

  // Table packages
  'booktabs': { features: ['toprule', 'midrule', 'bottomrule', 'cmidrule', 'addlinespace'] },
  'multirow': { features: ['multirow'] },
  'array': { features: ['array_column_types'] },
  'longtable': { features: ['longtable'] },
  'tabularx': { features: ['tabularx'] },
  'colortbl': { features: ['cellcolor', 'rowcolor', 'columncolor'] },
  'xcolor': { features: ['color', 'definecolor', 'colorlet'] },
  'color': { features: ['color'] },

  // Layout packages
  'geometry': { features: ['page_geometry'] },
  'multicol': { features: ['multicols'] },
  'fancyhdr': { features: ['pagestyle', 'fancyhf', 'lhead', 'rhead', 'chead', 'lfoot', 'rfoot', 'cfoot'] },
  'setspace': { features: ['setstretch', 'doublespacing', 'onehalfspacing', 'singlespacing'] },
  'parskip': { features: ['parskip'] },
  'enumitem': { features: ['enhanced_lists'] },

  // Graphics
  'graphicx': { features: ['includegraphics', 'rotatebox', 'scalebox', 'resizebox'] },
  'graphics': { features: ['includegraphics'] },
  'tikz': { features: ['tikzpicture'] },
  'pgfplots': { features: ['axis'] },
  'wrapfig': { features: ['wrapfigure'] },
  'subcaption': { features: ['subfigure', 'subtable'] },
  'float': { features: ['float_H'] },

  // Text/Font
  'fontenc': { features: [] },
  'inputenc': { features: [] },
  'babel': { features: ['language'] },
  'polyglossia': { features: ['language'] },
  'microtype': { features: [] },
  'lmodern': { features: [] },
  'times': { features: ['times_font'] },
  'palatino': { features: ['palatino_font'] },
  'helvet': { features: ['helvetica_font'] },
  'courier': { features: ['courier_font'] },
  'fontawesome': { features: ['faicons'] },
  'fontawesome5': { features: ['faicons'] },
  'textcomp': { features: ['textcomp_symbols'] },
  'ulem': { features: ['uline', 'uwave', 'sout', 'xout'] },
  'soul': { features: ['ul', 'st', 'hl'] },

  // References/Bibliography
  'natbib': { features: ['natbib_cite'] },
  'cite': { features: ['cite'] },
  'hyperref': { features: ['href', 'url', 'hypersetup', 'autoref'] },
  'url': { features: ['url'] },
  'doi': { features: ['doi'] },
  'cleveref': { features: ['cref', 'Cref'] },

  // Science/Academic
  'siunitx': { features: ['SI', 'si', 'num', 'ang'] },
  'mhchem': { features: ['ce'] },
  'physics': { features: ['physics_macros'] },
  'algorithm': { features: ['algorithm_env'] },
  'algorithmic': { features: ['algorithmic_env'] },
  'algorithm2e': { features: ['algorithm2e_env'] },
  'listings': { features: ['lstlisting'] },
  'minted': { features: ['minted'] },
  'verbatim': { features: ['verbatim'] },
  'fancyvrb': { features: ['Verbatim'] },

  // Elsevier/Journal specific
  'elsarticle': { features: ['journal_article'] },
  'revtex4-2': { features: ['revtex'] },
  'IEEEtran': { features: ['ieee'] },
  'acmart': { features: ['acm'] },
};

/* =========================
   EXTENDED COMMAND REGISTRY
   Handles hundreds of LaTeX commands
========================= */
const COMMAND_HANDLERS = {
  // ---- TEXT FORMATTING ----
  'textbf': (args) => `<strong>${args[0] || ''}</strong>`,
  'textit': (args) => `<em>${args[0] || ''}</em>`,
  'textsl': (args) => `<span style="font-style:oblique">${args[0] || ''}</span>`,
  'textsc': (args) => `<span style="font-variant:small-caps">${args[0] || ''}</span>`,
  'textrm': (args) => `<span style="font-family:serif">${args[0] || ''}</span>`,
  'textsf': (args) => `<span style="font-family:sans-serif">${args[0] || ''}</span>`,
  'texttt': (args) => `<code>${args[0] || ''}</code>`,
  'textmd': (args) => `<span style="font-weight:normal">${args[0] || ''}</span>`,
  'textnormal': (args) => `<span style="font-style:normal;font-weight:normal">${args[0] || ''}</span>`,
  'emph': (args) => `<em>${args[0] || ''}</em>`,
  'underline': (args) => `<u>${args[0] || ''}</u>`,
  'overline': (args, ctx) => renderMath(`\\overline{${args[0]}}`, false, ctx),
  'sout': (args) => `<s>${args[0] || ''}</s>`,
  'uline': (args) => `<u>${args[0] || ''}</u>`,
  'uwave': (args) => `<span style="text-decoration:underline wavy">${args[0] || ''}</span>`,
  'hl': (args) => `<mark>${args[0] || ''}</mark>`,
  'st': (args) => `<s>${args[0] || ''}</s>`,

  // ---- FONT SIZE ----
  'tiny': () => `<span style="font-size:0.6em">`,
  'scriptsize': () => `<span style="font-size:0.7em">`,
  'footnotesize': () => `<span style="font-size:0.8em">`,
  'small': () => `<span style="font-size:0.9em">`,
  'normalsize': () => `<span style="font-size:1em">`,
  'large': () => `<span style="font-size:1.2em">`,
  'Large': () => `<span style="font-size:1.44em">`,
  'LARGE': () => `<span style="font-size:1.73em">`,
  'huge': () => `<span style="font-size:2.07em">`,
  'Huge': () => `<span style="font-size:2.49em">`,

  // ---- COLOR ----
  'textcolor': (args) => `<span style="color:${cssColor(args[0])}">${args[1] || ''}</span>`,
  'colorbox': (args) => `<span style="background:${cssColor(args[0])};padding:1px 3px">${args[1] || ''}</span>`,
  'fcolorbox': (args) => `<span style="border:1px solid ${cssColor(args[0])};background:${cssColor(args[1])};padding:1px 3px">${args[2] || ''}</span>`,

  // ---- SPACING ----
  'hspace': (args) => `<span style="display:inline-block;width:${texLength(args[0])}"></span>`,
  'hspace*': (args) => `<span style="display:inline-block;width:${texLength(args[0])}"></span>`,
  'vspace': (args) => `<div style="margin-top:${texLength(args[0])}"></div>`,
  'vspace*': (args) => `<div style="margin-top:${texLength(args[0])}"></div>`,
  'quad': () => `<span style="display:inline-block;width:1em"></span>`,
  'qquad': () => `<span style="display:inline-block;width:2em"></span>`,
  'thinspace': () => `<span style="display:inline-block;width:0.167em"></span>`,
  'enspace': () => `<span style="display:inline-block;width:0.5em"></span>`,
  'noindent': () => `<span style="display:block;text-indent:0"></span>`,
  'indent': () => `<span style="display:inline-block;width:1.5em"></span>`,
  'medskip': () => `<div style="margin-top:0.5em"></div>`,
  'bigskip': () => `<div style="margin-top:1em"></div>`,
  'smallskip': () => `<div style="margin-top:0.25em"></div>`,
  'clearpage': () => `<div style="page-break-after:always"></div>`,
  'newpage': () => `<div style="page-break-after:always"></div>`,
  'linebreak': () => `<br/>`,
  'newline': () => `<br/>`,
  '\\': () => `<br/>`,
  '-': () => `&shy;`,
  '/': () => ``,

  // ---- SPECIAL CHARS ----
  'LaTeX': () => `L<sup style="font-size:0.7em;vertical-align:0.4em">A</sup>T<sub style="font-size:0.7em;vertical-align:-0.2em">E</sub>X`,
  'TeX': () => `T<sub style="font-size:0.7em;vertical-align:-0.2em">E</sub>X`,
  'BibTeX': () => `B<span style="font-variant:small-caps">ib</span>T<sub style="font-size:0.7em">E</sub>X`,
  'textregistered': () => `&reg;`,
  'texttrademark': () => `&trade;`,
  'copyright': () => `&copy;`,
  'dag': () => `&dagger;`,
  'ddag': () => `&Dagger;`,
  'S': () => `&sect;`,
  'P': () => `&para;`,
  'textdegree': () => `&deg;`,
  'textperthousand': () => `&permil;`,
  'textemdash': () => `&mdash;`,
  'textendash': () => `&ndash;`,
  'textquoteleft': () => `&lsquo;`,
  'textquoteright': () => `&rsquo;`,
  'textquoteleft': () => `\``,
  'ldots': () => `&hellip;`,
  'dots': () => `&hellip;`,
  'cdots': () => `&ctdot;`,
  'vdots': () => `&vellip;`,

  // ---- LINKS ----
  'href': (args) => `<a href="${args[0]}" target="_blank" style="color:#2563eb">${args[1] || args[0]}</a>`,
  'url': (args) => `<a href="${args[0]}" target="_blank" style="color:#2563eb;font-family:monospace">${args[0]}</a>`,
  'doi': (args) => `<a href="https://doi.org/${args[0]}" target="_blank" style="color:#2563eb">https://doi.org/${args[0]}</a>`,
  'email': (args) => `<a href="mailto:${args[0]}" style="color:#2563eb">${args[0]}</a>`,

  // ---- FOOTNOTES/MARGINAL ----
  'footnote': (args) => `<sup title="${(args[0] || '').replace(/"/g, "'")}" style="cursor:help;color:#2563eb">†</sup>`,
  'footnotemark': () => `<sup style="color:#2563eb">†</sup>`,
  'footnotetext': () => ``,
  'marginpar': () => ``,

  // ---- BOXES ----
  'fbox': (args) => `<span style="border:1px solid currentColor;padding:2px 4px">${args[0] || ''}</span>`,
  'framebox': (args) => `<span style="border:1px solid currentColor;padding:2px 4px">${args[0] || ''}</span>`,
  'mbox': (args) => `<span style="white-space:nowrap">${args[0] || ''}</span>`,
  'makebox': (args, ctx, optArg) => `<span style="display:inline-block;width:${texLength(optArg)}">${args[0] || ''}</span>`,
  'raisebox': (args) => `<span style="vertical-align:${texLength(args[0])}">${args[1] || ''}</span>`,
  'parbox': (args) => `<div style="display:inline-block;width:${texLength(args[0])};vertical-align:top">${args[1] || ''}</div>`,
  'minipage': () => ``,

  // ---- SECTIONING ----
  'part': (args, ctx) => { ctx.part = (ctx.part||0)+1; return `<h1 class="latex-part">Part ${toRoman(ctx.part)}: ${args[0]||''}</h1>`; },
  'chapter': (args, ctx) => { ctx.chapter = (ctx.chapter||0)+1; ctx.sec=0; ctx.sub=0; ctx.subsub=0; return `<h1 class="latex-chapter">${ctx.chapter}. ${args[0]||''}</h1>`; },
  'section': (args, ctx) => { ctx.sec++; ctx.sub=0; ctx.subsub=0; return `<h2 class="latex-section">${ctx.sec}. ${args[0]||''}</h2>`; },
  'section*': (args) => `<h2 class="latex-section">${args[0]||''}</h2>`,
  'subsection': (args, ctx) => { ctx.sub++; ctx.subsub=0; return `<h3 class="latex-subsection">${ctx.sec}.${ctx.sub} ${args[0]||''}</h3>`; },
  'subsection*': (args) => `<h3 class="latex-subsection">${args[0]||''}</h3>`,
  'subsubsection': (args, ctx) => { ctx.subsub++; return `<h4 class="latex-subsubsection">${ctx.sec}.${ctx.sub}.${ctx.subsub} ${args[0]||''}</h4>`; },
  'subsubsection*': (args) => `<h4 class="latex-subsubsection">${args[0]||''}</h4>`,
  'paragraph': (args) => `<p><strong>${args[0]||''}</strong> `,
  'subparagraph': (args) => `<p><em>${args[0]||''}</em> `,
  'appendix': () => `<h2 class="latex-section" style="text-transform:uppercase">Appendix</h2>`,

  // ---- CROSS REFERENCES ----
  'label': () => ``,
  'ref': (args, ctx) => `<span class="latex-ref-link">${ctx.labels?.get(args[0]) || '??'}</span>`,
  'eqref': (args, ctx) => `<span class="latex-ref-link">(${ctx.labels?.get(args[0]) || '??'})</span>`,
  'pageref': (args) => `<span class="latex-ref-link">p.?</span>`,
  'autoref': (args, ctx) => `<span class="latex-ref-link">${ctx.labels?.get(args[0]) || '??'}</span>`,
  'cref': (args, ctx) => `<span class="latex-ref-link">${ctx.labels?.get(args[0]) || '??'}</span>`,
  'Cref': (args, ctx) => `<span class="latex-ref-link">${ctx.labels?.get(args[0]) || '??'}</span>`,
  'nameref': (args, ctx) => `<span class="latex-ref-link">${ctx.sectionNames?.get(args[0]) || '??'}</span>`,

  // ---- CITATIONS ----
  'cite': (args, ctx, optArg) => formatCite(args[0], optArg, ctx),
  'citep': (args, ctx, optArg) => formatCite(args[0], optArg, ctx),
  'citet': (args, ctx, optArg) => formatCiteT(args[0], optArg, ctx),
  'citealp': (args, ctx, optArg) => formatCite(args[0], optArg, ctx, true),
  'citealt': (args, ctx, optArg) => formatCiteT(args[0], optArg, ctx, true),
  'citeauthor': (args) => `<span class="latex-cite-link" title="${args[0]}">${args[0]}</span>`,
  'citeyear': (args) => `<span class="latex-cite-link" title="${args[0]}">${args[0]}</span>`,
  'citeyearpar': (args) => `<span class="latex-cite-link" title="${args[0]}">(${args[0]})</span>`,
  'nocite': () => ``,

  // ---- FIGURES/TABLES ----
  'includegraphics': (args, ctx, optArg) => {
    const opts = parseKeyVal(optArg || '');
    const w = opts.width ? `width:${texLength(opts.width)}` : 'max-width:100%';
    const h = opts.height ? `;height:${texLength(opts.height)}` : '';
    return `<div class="latex-image-placeholder" style="${w}${h}"><svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:200px"><rect width="200" height="120" fill="#f0f4f8" stroke="#94a3b8" stroke-width="2" rx="4"/><line x1="0" y1="0" x2="200" y2="120" stroke="#94a3b8" stroke-width="1"/><line x1="200" y1="0" x2="0" y2="120" stroke="#94a3b8" stroke-width="1"/><text x="100" y="65" text-anchor="middle" font-size="11" fill="#64748b">${args[0]||'image'}</text></svg></div>`;
  },
  'caption': (args, ctx) => {
    const type = ctx._inTable ? 'Table' : 'Figure';
    const num = ctx._inTable ? ctx.tableCount : ctx.figureCount;
    return `<div class="latex-caption"><strong>${type} ${num||''}:</strong> ${args[0]||''}</div>`;
  },
  'subcaption': (args) => `<div class="latex-caption" style="font-size:0.85em">${args[0]||''}</div>`,

  // ---- LISTS ----
  'item': (args, ctx, optArg) => {
    const label = optArg ? `<span style="font-weight:bold">${optArg}</span> ` : '';
    return `</li><li class="latex-item">${label}`;
  },

  // ---- MISC META ----
  'maketitle': (ctx) => ``,
  'tableofcontents': () => `<div class="latex-toc-placeholder" style="border:1px dashed #94a3b8;padding:15px;margin:15px 0;color:#64748b;text-align:center;font-style:italic">Table of Contents</div>`,
  'listoffigures': () => `<div class="latex-toc-placeholder" style="border:1px dashed #94a3b8;padding:15px;margin:15px 0;color:#64748b;text-align:center;font-style:italic">List of Figures</div>`,
  'listoftables': () => `<div class="latex-toc-placeholder" style="border:1px dashed #94a3b8;padding:15px;margin:15px 0;color:#64748b;text-align:center;font-style:italic">List of Tables</div>`,
  'index': () => ``,
  'glossary': () => ``,
  'printindex': () => ``,
  'bibliography': () => ``,
  'bibliographystyle': () => ``,
  'documentclass': () => ``,
  'usepackage': () => ``,
  'RequirePackage': () => ``,
  'PassOptionsToPackage': () => ``,
  'AtBeginDocument': () => ``,
  'AtEndDocument': () => ``,
  'newcommand': () => ``,
  'renewcommand': () => ``,
  'providecommand': () => ``,
  'newenvironment': () => ``,
  'renewenvironment': () => ``,
  'def': () => ``,
  'let': () => ``,
  'setlength': () => ``,
  'addtolength': () => ``,
  'setcounter': () => ``,
  'addtocounter': () => ``,
  'stepcounter': () => ``,
  'refstepcounter': () => ``,
  'settowidth': () => ``,
  'settodepth': () => ``,
  'settoheight': () => ``,
  'hyphenation': () => ``,
  'pagenumbering': () => ``,
  'pagestyle': () => ``,
  'thispagestyle': () => ``,
  'title': () => ``,
  'author': () => ``,
  'date': () => ``,
  'thanks': (args) => `<sup style="color:#2563eb" title="${args[0]||''}">*</sup>`,
  'and': () => ` and `,
  'sep': () => `; `,
  'corref': () => ``,
  'cortext': () => ``,
  'fnref': () => ``,
  'inst': () => ``,
  'ead': () => ``,
  'address': () => ``,
  'journal': () => ``,
  
  // ---- SIUNITX ----
  'SI': (args) => `${args[0]}&nbsp;<span style="font-style:normal">${siUnit(args[1])}</span>`,
  'si': (args) => `<span style="font-style:normal">${siUnit(args[0])}</span>`,
  'num': (args) => `${args[0]}`,
  'ang': (args) => `${args[0]}&deg;`,

  // ---- THEOREM-LIKE ----
  'qed': () => `<span style="float:right">&#9744;</span>`,
  'qedsymbol': () => `&#9744;`,

  // ---- LINE/PAGE BREAKS ----
  'break': () => ``,
  'nobreak': () => ``,
  'allowbreak': () => ``,
  'penalty': () => ``,
  'discretionary': () => ``,
};

/* =========================
   ENVIRONMENT HANDLERS
========================= */
const ENVIRONMENT_HANDLERS = {
  // ---- DOCUMENT STRUCTURE ----
  'document': (node, ctx) => renderChildren(node, ctx),
  'frontmatter': (node, ctx) => renderChildren(node, ctx),
  'mainmatter': (node, ctx) => renderChildren(node, ctx),
  'backmatter': (node, ctx) => renderChildren(node, ctx),

  // ---- ABSTRACT/META ----
  'abstract': (node, ctx) => `
    <div class="latex-abstract-section">
      <div class="latex-abstract-title">Abstract</div>
      <p class="latex-abstract-content">${renderChildren(node, ctx)}</p>
    </div>`,

  'keyword': (node, ctx) => `
    <div class="latex-keywords">
      <span class="latex-keywords-title">Keywords:</span>
      ${renderChildren(node, ctx)}
    </div>`,

  'keywords': (node, ctx) => `
    <div class="latex-keywords">
      <span class="latex-keywords-title">Keywords:</span>
      ${renderChildren(node, ctx)}
    </div>`,

  'highlights': (node, ctx) => `
    <div class="latex-highlights-box">
      <div class="latex-highlights-title">Highlights</div>
      <ul class="latex-highlights-list">${renderChildren(node, ctx)}</ul>
    </div>`,

  // ---- LISTS ----
  'itemize': (node, ctx) => {
    const inner = renderChildren(node, ctx).replace(/^<\/li>/, '');
    return `<ul class="latex-list latex-itemize">${inner}</li></ul>`;
  },
  'enumerate': (node, ctx) => {
    const inner = renderChildren(node, ctx).replace(/^<\/li>/, '');
    return `<ol class="latex-list latex-enumerate">${inner}</li></ol>`;
  },
  'description': (node, ctx) => {
    const inner = renderChildren(node, ctx).replace(/^<\/li>/, '');
    return `<dl class="latex-list latex-description">${inner}</dl>`;
  },
  'trivlist': (node, ctx) => renderChildren(node, ctx),

  // ---- MATH ENVIRONMENTS ----
  'equation': (node, ctx) => renderEquationEnv(node, ctx, false),
  'equation*': (node, ctx) => renderEquationEnv(node, ctx, true),
  'align': (node, ctx) => renderAlignEnv(node, ctx, false),
  'align*': (node, ctx) => renderAlignEnv(node, ctx, true),
  'gather': (node, ctx) => renderGatherEnv(node, ctx, false),
  'gather*': (node, ctx) => renderGatherEnv(node, ctx, true),
  'multline': (node, ctx) => renderEquationEnv(node, ctx, false),
  'multline*': (node, ctx) => renderEquationEnv(node, ctx, true),
  'flalign': (node, ctx) => renderAlignEnv(node, ctx, false),
  'flalign*': (node, ctx) => renderAlignEnv(node, ctx, true),
  'alignat': (node, ctx) => renderAlignEnv(node, ctx, false),
  'alignat*': (node, ctx) => renderAlignEnv(node, ctx, true),
  'subequations': (node, ctx) => renderChildren(node, ctx),
  'split': (node, ctx) => renderEquationEnv(node, ctx, true),
  'cases': (node, ctx) => renderEquationEnv(node, ctx, true),
  'dcases': (node, ctx) => renderEquationEnv(node, ctx, true),
  'math': (node, ctx) => renderMath(getTextContent(node), false, ctx),
  'displaymath': (node, ctx) => `<div class="latex-math-block">${renderMath(getTextContent(node), true, ctx)}</div>`,

  // ---- FIGURES/TABLES ----
  'figure': (node, ctx) => {
    ctx.figureCount = (ctx.figureCount || 0) + 1;
    ctx._inFigure = true;
    const inner = renderChildren(node, ctx);
    ctx._inFigure = false;
    return `<div class="latex-figure">${inner}</div>`;
  },
  'figure*': (node, ctx) => {
    ctx.figureCount = (ctx.figureCount || 0) + 1;
    ctx._inFigure = true;
    const inner = renderChildren(node, ctx);
    ctx._inFigure = false;
    return `<div class="latex-figure latex-figure-wide">${inner}</div>`;
  },
  'table': (node, ctx) => {
    ctx.tableCount = (ctx.tableCount || 0) + 1;
    ctx._inTable = true;
    const inner = renderChildren(node, ctx);
    ctx._inTable = false;
    return `<div class="latex-table-container">${inner}</div>`;
  },
  'table*': (node, ctx) => {
    ctx.tableCount = (ctx.tableCount || 0) + 1;
    ctx._inTable = true;
    const inner = renderChildren(node, ctx);
    ctx._inTable = false;
    return `<div class="latex-table-container latex-table-wide">${inner}</div>`;
  },

  // ---- TABULAR (ADVANCED) ----
  'tabular': (node, ctx) => renderTabular(node, ctx),
  'tabular*': (node, ctx) => renderTabular(node, ctx),
  'tabularx': (node, ctx) => renderTabular(node, ctx),
  'longtable': (node, ctx) => renderTabular(node, ctx),
  'array': (node, ctx) => renderTabular(node, ctx),

  // ---- TEXT ENVIRONMENTS ----
  'center': (node, ctx) => `<div style="text-align:center">${renderChildren(node, ctx)}</div>`,
  'flushleft': (node, ctx) => `<div style="text-align:left">${renderChildren(node, ctx)}</div>`,
  'flushright': (node, ctx) => `<div style="text-align:right">${renderChildren(node, ctx)}</div>`,
  'quote': (node, ctx) => `<blockquote class="latex-quote">${renderChildren(node, ctx)}</blockquote>`,
  'quotation': (node, ctx) => `<blockquote class="latex-quotation">${renderChildren(node, ctx)}</blockquote>`,
  'verse': (node, ctx) => `<div class="latex-verse">${renderChildren(node, ctx)}</div>`,
  'minipage': (node, ctx) => `<div style="display:inline-block;vertical-align:top">${renderChildren(node, ctx)}</div>`,

  // ---- VERBATIM ----
  'verbatim': (node) => `<pre class="latex-verbatim"><code>${getTextContent(node)}</code></pre>`,
  'verbatim*': (node) => `<pre class="latex-verbatim"><code>${getTextContent(node)}</code></pre>`,
  'Verbatim': (node) => `<pre class="latex-verbatim"><code>${getTextContent(node)}</code></pre>`,
  'lstlisting': (node) => `<pre class="latex-lstlisting"><code>${getTextContent(node)}</code></pre>`,
  'minted': (node) => `<pre class="latex-lstlisting"><code>${getTextContent(node)}</code></pre>`,
  'alltt': (node, ctx) => `<pre class="latex-alltt">${renderChildren(node, ctx)}</pre>`,

  // ---- THEOREM-LIKE ----
  'theorem': (node, ctx) => renderTheoremLike(node, ctx, 'Theorem'),
  'lemma': (node, ctx) => renderTheoremLike(node, ctx, 'Lemma'),
  'proposition': (node, ctx) => renderTheoremLike(node, ctx, 'Proposition'),
  'corollary': (node, ctx) => renderTheoremLike(node, ctx, 'Corollary'),
  'definition': (node, ctx) => renderTheoremLike(node, ctx, 'Definition'),
  'example': (node, ctx) => renderTheoremLike(node, ctx, 'Example'),
  'remark': (node, ctx) => renderTheoremLike(node, ctx, 'Remark'),
  'proof': (node, ctx) => `<div class="latex-proof"><em>Proof.</em> ${renderChildren(node, ctx)}<span style="float:right">&#9744;</span></div>`,
  'assumption': (node, ctx) => renderTheoremLike(node, ctx, 'Assumption'),
  'conjecture': (node, ctx) => renderTheoremLike(node, ctx, 'Conjecture'),
  'axiom': (node, ctx) => renderTheoremLike(node, ctx, 'Axiom'),
  'notation': (node, ctx) => renderTheoremLike(node, ctx, 'Notation'),
  'observation': (node, ctx) => renderTheoremLike(node, ctx, 'Observation'),
  'claim': (node, ctx) => renderTheoremLike(node, ctx, 'Claim'),

  // ---- SPACING ENVIRONMENTS ----
  'spacing': (node, ctx) => renderChildren(node, ctx),
  'singlespace': (node, ctx) => `<div style="line-height:1.15">${renderChildren(node, ctx)}</div>`,
  'doublespace': (node, ctx) => `<div style="line-height:2">${renderChildren(node, ctx)}</div>`,
  'onehalfspace': (node, ctx) => `<div style="line-height:1.5">${renderChildren(node, ctx)}</div>`,

  // ---- BIBLIOGRAPHY ----
  'thebibliography': (node, ctx) => `
    <div class="latex-bibliography">
      <h2 class="latex-section">References</h2>
      <ol class="latex-bib-list">${renderChildren(node, ctx)}</ol>
    </div>`,

  // ---- ALGORITHM ----
  'algorithm': (node, ctx) => {
    ctx.algoCount = (ctx.algoCount||0)+1;
    return `<div class="latex-algorithm"><div class="latex-algorithm-title">Algorithm ${ctx.algoCount}</div>${renderChildren(node, ctx)}</div>`;
  },
  'algorithmic': (node, ctx) => `<div class="latex-algorithmic">${renderChildren(node, ctx)}</div>`,

  // ---- TIKZ (placeholder) ----
  'tikzpicture': (node) => `<div class="latex-tikz-placeholder" style="border:1px dashed #94a3b8;padding:20px;margin:10px 0;text-align:center;color:#64748b;font-style:italic">[TikZ figure — requires PDF compilation]</div>`,
  'pgfpicture': (node) => `<div class="latex-tikz-placeholder" style="border:1px dashed #94a3b8;padding:20px;margin:10px 0;text-align:center;color:#64748b;font-style:italic">[PGF figure]</div>`,

  // ---- MULTICOL ----
  'multicols': (node, ctx) => {
    const cols = node.optArg || 2;
    return `<div style="column-count:${cols};column-gap:20px">${renderChildren(node, ctx)}</div>`;
  },

  // ---- ELSEVIER-SPECIFIC ----
  'frontmatter': (node, ctx) => renderChildren(node, ctx),
};

/* =========================
   HELPER FUNCTIONS
========================= */

function cssColor(colorSpec) {
  if (!colorSpec) return 'black';
  const namedColors = {
    red:'#dc2626', blue:'#2563eb', green:'#16a34a', yellow:'#ca8a04',
    orange:'#ea580c', purple:'#9333ea', pink:'#db2777', brown:'#92400e',
    gray:'#6b7280', grey:'#6b7280', black:'#000000', white:'#ffffff',
    cyan:'#0891b2', magenta:'#c026d3', darkblue:'#1e3a5f', darkred:'#991b1b',
    darkgreen:'#166534', lightblue:'#bfdbfe', lightgray:'#e5e7eb',
    lightgrey:'#e5e7eb', violet:'#7c3aed', teal:'#0d9488', olive:'#65a30d',
  };
  const c = colorSpec.trim().toLowerCase();
  if (namedColors[c]) return namedColors[c];
  if (c.startsWith('#')) return c;
  // Handle rgb/HTML style
  const rgbMatch = c.match(/^(\d+),\s*(\d+),\s*(\d+)$/);
  if (rgbMatch) return `rgb(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]})`;
  return colorSpec;
}

function texLength(val) {
  if (!val) return '1em';
  val = val.trim();
  const map = {'pt':'px', 'mm':'mm', 'cm':'cm', 'in':'in', 'em':'em', 'ex':'ex', 'pc':'pc'};
  for (const [unit, cssUnit] of Object.entries(map)) {
    const m = val.match(new RegExp(`^([\\d.]+)${unit}$`));
    if (m) {
      if (unit === 'pt') return `${(parseFloat(m[1]) * 1.333).toFixed(1)}px`;
      return `${m[1]}${cssUnit}`;
    }
  }
  if (val.includes('\\textwidth')) return '100%';
  if (val.includes('\\linewidth')) return '100%';
  if (val.includes('\\columnwidth')) return '100%';
  return val;
}

function siUnit(unit) {
  if (!unit) return '';
  return unit
    .replace(/\\meter/g, 'm').replace(/\\kilogram/g, 'kg').replace(/\\second/g, 's')
    .replace(/\\ampere/g, 'A').replace(/\\kelvin/g, 'K').replace(/\\mole/g, 'mol')
    .replace(/\\candela/g, 'cd').replace(/\\gram/g, 'g').replace(/\\litre/g, 'L')
    .replace(/\\liter/g, 'L').replace(/\\hertz/g, 'Hz').replace(/\\newton/g, 'N')
    .replace(/\\pascal/g, 'Pa').replace(/\\joule/g, 'J').replace(/\\watt/g, 'W')
    .replace(/\\volt/g, 'V').replace(/\\ohm/g, 'Ω').replace(/\\degree/g, '°')
    .replace(/\\per/g, '/').replace(/\\squared/g, '²').replace(/\\cubed/g, '³')
    .replace(/\\/g, '');
}

function toRoman(n) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  vals.forEach((v,i) => { while(n >= v) { result += syms[i]; n -= v; } });
  return result;
}

function parseKeyVal(str) {
  if (!str) return {};
  const result = {};
  str.split(',').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) result[k.trim()] = (v || '').trim();
  });
  return result;
}

function formatCite(key, optArg, ctx, noParens) {
  const keys = (key || '').split(',').map(k => k.trim());
  const nums = keys.map(k => ctx.bibNumbers?.get(k) || k);
  const note = optArg ? `, ${optArg}` : '';
  const inner = nums.join(', ') + note;
  return noParens
    ? `<span class="latex-cite-link" title="${keys.join(', ')}">${inner}</span>`
    : `<span class="latex-cite-link" title="${keys.join(', ')}">[${inner}]</span>`;
}

function formatCiteT(key, optArg, ctx, noParens) {
  const keys = (key || '').split(',').map(k => k.trim());
  const nums = keys.map(k => ctx.bibNumbers?.get(k) || k);
  const note = optArg ? `, ${optArg}` : '';
  return `<span class="latex-cite-link" title="${keys.join(', ')}">${keys[0]} (${nums.join(', ')}${note})</span>`;
}

function getTextContent(node) {
  if (!node.children) return '';
  return node.children.map(c => {
    if (c.type === 'text') return c.value;
    if (c.type === 'math_block') return c.value;
    if (c.type === 'math_inline') return c.value;
    if (c.children) return getTextContent(c);
    return '';
  }).join('');
}

function renderChildren(node, ctx) {
  if (!node.children) return '';
  return node.children.map(child => renderNode(child, ctx)).join('');
}

function renderMath(tex, display, ctx) {
  try {
    const cleaned = tex
      .replace(/\\label\{[^}]*\}/g, '')
      .replace(/\\notag/g, '')
      .replace(/\\tag\{[^}]*\}/g, '');
    if (cleaned.trim().length === 0) return '';
    if (cleaned.length > 8000) return `<code>${tex.substring(0, 200)}...</code>`;
    return katex.renderToString(cleaned.trim(), {
      displayMode: display,
      throwOnError: false,
      strict: false,
      trust: true,
      macros: ctx.katexMacros || {}
    });
  } catch (e) {
    return `<code class="latex-math-error">${escapeHtml(tex)}</code>`;
  }
}

function renderTheoremLike(node, ctx, type) {
  ctx.theoremCounts = ctx.theoremCounts || {};
  ctx.theoremCounts[type] = (ctx.theoremCounts[type] || 0) + 1;
  const num = ctx.theoremCounts[type];
  const optLabel = node.optArg ? ` (${node.optArg})` : '';
  return `<div class="latex-theorem">
    <div class="latex-theorem-head"><strong>${type} ${num}${optLabel}.</strong></div>
    <div class="latex-theorem-body">${renderChildren(node, ctx)}</div>
  </div>`;
}

function renderEquationEnv(node, ctx, star) {
  const mathContent = getTextContent(node);
  const labelNode = node.children?.find(c => c.type === 'command' && c.name === 'label');
  if (!star) {
    ctx.equationCount = (ctx.equationCount || 0) + 1;
  }
  const eqNum = (!star && ctx.equationCount) ? `<span class="latex-eq-num">(${ctx.equationCount})</span>` : '';
  return `<div class="latex-math-block latex-equation">
    <div class="latex-math-inner">${renderMath(mathContent, true, ctx)}</div>
    ${eqNum}
  </div>`;
}

function renderAlignEnv(node, ctx, star) {
  const mathContent = getTextContent(node);
  const lines = mathContent.split('\\\\');
  let html = '';
  lines.forEach(line => {
    if (!star && !line.includes('\\notag')) {
      ctx.equationCount = (ctx.equationCount || 0) + 1;
    }
    const eqNum = (!star && !line.includes('\\notag')) ? `<span class="latex-eq-num">(${ctx.equationCount})</span>` : '';
    html += `<div class="latex-math-block latex-align-line">
      <div class="latex-math-inner">${renderMath(line.trim(), true, ctx)}</div>
      ${eqNum}
    </div>`;
  });
  return html;
}

function renderGatherEnv(node, ctx, star) {
  return renderAlignEnv(node, ctx, star);
}

/* =========================
   ADVANCED TABULAR RENDERER
========================= */
function renderTabular(node, ctx) {
  const colSpec = node.optArg || node.colspec || 'l';
  const rawContent = getTextContent(node);
  
  // Parse column spec for alignment
  const colAlignments = parseColSpec(colSpec);
  
  // Split into rows by \\ 
  const rawRows = splitTabularRows(rawContent);
  
  let headerDone = false;
  let hasTopRule = false;
  let tableHtml = '';
  
  // Track booktabs rules
  const rules = { toprule: false, midrule: false, bottomrule: false };
  
  // Process rows
  const processedRows = [];
  let pendingRuleClass = '';
  
  for (const rawRow of rawRows) {
    const trimmed = rawRow.trim();
    
    // Detect booktabs/hline rules
    if (/\\toprule/.test(trimmed)) { pendingRuleClass = 'border-top-thick'; continue; }
    if (/\\midrule/.test(trimmed)) { pendingRuleClass = 'border-mid'; continue; }
    if (/\\bottomrule/.test(trimmed)) { pendingRuleClass = 'border-bottom-thick'; continue; }
    if (/\\hline/.test(trimmed) && trimmed.replace(/\\hline/g, '').trim() === '') {
      pendingRuleClass = 'border-hline';
      continue;
    }
    if (/\\cmidrule/.test(trimmed) && trimmed.replace(/\\cmidrule(\[.*?\])?\{.*?\}/g, '').trim() === '') {
      pendingRuleClass = 'border-cmidrule';
      continue;
    }
    
    // Clean row of inline rules
    let cleanRow = trimmed
      .replace(/\\hline/g, '')
      .replace(/\\toprule/g, '')
      .replace(/\\midrule/g, '')
      .replace(/\\bottomrule/g, '')
      .replace(/\\cmidrule(\[.*?\])?\{.*?\}/g, '')
      .replace(/\\addlinespace/g, '')
      .trim();
    
    if (!cleanRow) continue;
    
    // Split into cells
    const cells = splitTabularCells(cleanRow);
    if (cells.length === 0) continue;
    
    processedRows.push({ cells, ruleClass: pendingRuleClass });
    pendingRuleClass = '';
  }
  
  // Render table
  tableHtml = '<table class="latex-table">';
  
  processedRows.forEach((row, rowIdx) => {
    const isFirst = rowIdx === 0;
    const isLast = rowIdx === processedRows.length - 1;
    
    let trClass = '';
    if (isFirst) trClass = 'latex-table-header';
    if (row.ruleClass) trClass += ` ${row.ruleClass}`;
    
    tableHtml += `<tr class="${trClass}">`;
    
    row.cells.forEach((cell, colIdx) => {
      const align = colAlignments[colIdx] || 'left';
      
      // Handle \multicolumn
      const multicolMatch = cell.match(/\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}/);
      if (multicolMatch) {
        const span = parseInt(multicolMatch[1]);
        const content = multicolMatch[2];
        tableHtml += `<td colspan="${span}" style="text-align:${align}">${renderTabularCell(content, ctx)}</td>`;
        return;
      }
      
      // Handle \multirow
      const multirowMatch = cell.match(/\\multirow\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}/);
      if (multirowMatch) {
        const span = parseInt(multirowMatch[1]);
        const content = multirowMatch[2];
        tableHtml += `<td rowspan="${span}" style="text-align:${align}">${renderTabularCell(content, ctx)}</td>`;
        return;
      }
      
      tableHtml += `<td style="text-align:${align}">${renderTabularCell(cell, ctx)}</td>`;
    });
    
    tableHtml += '</tr>';
  });
  
  tableHtml += '</table>';
  return tableHtml;
}

function parseColSpec(spec) {
  if (!spec) return [];
  const alignments = [];
  for (const ch of spec) {
    if (ch === 'l') alignments.push('left');
    else if (ch === 'c') alignments.push('center');
    else if (ch === 'r') alignments.push('right');
    else if (ch === 'X') alignments.push('left'); // tabularx
    else if (ch === 'p') alignments.push('left'); // paragraph column
    // Skip |, @{}, p{}, etc.
  }
  return alignments;
}

function splitTabularRows(raw) {
  // Split by \\ but not inside math or braces
  const rows = [];
  let current = '';
  let i = 0;
  let braceDepth = 0;
  let mathMode = false;
  
  while (i < raw.length) {
    if (raw[i] === '$') {
      mathMode = !mathMode;
      current += raw[i++];
      continue;
    }
    if (!mathMode) {
      if (raw[i] === '{') { braceDepth++; current += raw[i++]; continue; }
      if (raw[i] === '}') { braceDepth--; current += raw[i++]; continue; }
      if (braceDepth === 0 && raw[i] === '\\' && raw[i+1] === '\\') {
        rows.push(current);
        current = '';
        i += 2;
        // Skip optional [length]
        if (raw[i] === '[') {
          while (i < raw.length && raw[i] !== ']') i++;
          i++;
        }
        continue;
      }
    }
    current += raw[i++];
  }
  if (current.trim()) rows.push(current);
  return rows;
}

function splitTabularCells(row) {
  // Split by & but not inside math or braces
  const cells = [];
  let current = '';
  let i = 0;
  let braceDepth = 0;
  let mathMode = false;
  
  while (i < row.length) {
    if (row[i] === '$') {
      mathMode = !mathMode;
      current += row[i++];
      continue;
    }
    if (!mathMode) {
      if (row[i] === '{') { braceDepth++; current += row[i++]; continue; }
      if (row[i] === '}') { braceDepth--; current += row[i++]; continue; }
      if (braceDepth === 0 && row[i] === '&') {
        cells.push(current.trim());
        current = '';
        i++;
        continue;
      }
    }
    current += row[i++];
  }
  if (current.trim()) cells.push(current.trim());
  return cells;
}

function renderTabularCell(content, ctx) {
  // Parse inline math and basic formatting within a cell
  const tokens = tokenizeLatex(content);
  const ast = buildAST(tokens);
  return renderNode(ast, ctx);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =========================
   LEXER
========================= */
export function tokenizeLatex(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    // DISPLAY MATH \[...\]
    if (input[i] === '\\' && input[i+1] === '[') {
      let j = i + 2;
      while (j < input.length && !(input[j] === '\\' && input[j+1] === ']')) j++;
      tokens.push({ type: 'math_block', value: input.slice(i+2, j) });
      i = j + 2;
      continue;
    }

    // DISPLAY MATH $$...$$
    if (input[i] === '$' && input[i+1] === '$') {
      let j = i + 2;
      while (j < input.length && !(input[j] === '$' && input[j+1] === '$')) j++;
      tokens.push({ type: 'math_block', value: input.slice(i+2, j) });
      i = j + 2;
      continue;
    }

    // INLINE MATH \(...\)
    if (input[i] === '\\' && input[i+1] === '(') {
      let j = i + 2;
      while (j < input.length && !(input[j] === '\\' && input[j+1] === ')')) j++;
      tokens.push({ type: 'math_inline', value: input.slice(i+2, j) });
      i = j + 2;
      continue;
    }

    // INLINE MATH $...$
    if (input[i] === '$') {
      let j = i + 1;
      while (j < input.length && input[j] !== '$') {
        if (input[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'math_inline', value: input.slice(i+1, j) });
      i = j + 1;
      continue;
    }

    // COMMAND
    if (input[i] === '\\') {
      let j = i + 1;
      
      // Special single-char commands
      if (j < input.length && !/[a-zA-Z]/.test(input[j])) {
        const specialChar = input[j];
        if (specialChar === '\\') {
          tokens.push({ type: 'command', name: '\\', args: [], arg: null, optArg: null });
        } else if (specialChar === '{') {
          tokens.push({ type: 'text', value: '{' });
        } else if (specialChar === '}') {
          tokens.push({ type: 'text', value: '}' });
        } else if (specialChar === '$') {
          tokens.push({ type: 'text', value: '$' });
        } else if (specialChar === '%') {
          tokens.push({ type: 'text', value: '%' });
        } else if (specialChar === '&') {
          tokens.push({ type: 'text', value: '&' });
        } else if (specialChar === '#') {
          tokens.push({ type: 'text', value: '#' });
        } else if (specialChar === '_') {
          tokens.push({ type: 'text', value: '_' });
        } else if (specialChar === '^') {
          tokens.push({ type: 'text', value: '^' });
        } else if (specialChar === '~') {
          tokens.push({ type: 'text', value: '~' });
        } else if (specialChar === ',') {
          tokens.push({ type: 'command', name: ',', args: [], arg: null, optArg: null });
        } else if (specialChar === ';') {
          tokens.push({ type: 'command', name: ';', args: [], arg: null, optArg: null });
        } else if (specialChar === '!') {
          tokens.push({ type: 'command', name: '!', args: [], arg: null, optArg: null });
        } else if (specialChar === ' ') {
          tokens.push({ type: 'text', value: ' ' });
        } else if (specialChar === '-') {
          tokens.push({ type: 'command', name: '-', args: [], arg: null, optArg: null });
        } else if (specialChar === '/') {
          tokens.push({ type: 'command', name: '/', args: [], arg: null, optArg: null });
        } else {
          tokens.push({ type: 'text', value: '\\' + specialChar });
        }
        i = j + 1;
        continue;
      }
      
      // Word commands \name
      while (j < input.length && /[a-zA-Z*@]/.test(input[j])) j++;
      const name = input.slice(i+1, j);
      
      // Skip whitespace after command name
      while (j < input.length && input[j] === ' ') j++;
      
      // Optional argument [opt]
      let optArg = null;
      if (input[j] === '[') {
        let optStart = j + 1;
        let bracketDepth = 1;
        j++;
        while (j < input.length && bracketDepth > 0) {
          if (input[j] === '[') bracketDepth++;
          else if (input[j] === ']') bracketDepth--;
          if (bracketDepth > 0) j++;
          else j++;
        }
        optArg = input.slice(optStart, j - 1);
      }

      // Curly brace arguments
      const args = [];
      while (j < input.length && input[j] === '{') {
        let start = j + 1;
        let brace = 1;
        j++;
        while (j < input.length && brace > 0) {
          if (input[j] === '{') brace++;
          else if (input[j] === '}') brace--;
          j++;
        }
        if (brace === 0) {
          args.push(input.slice(start, j - 1));
        }
      }

      tokens.push({ type: 'command', name, args, arg: args[0] || null, optArg });
      i = j;
      continue;
    }

    // TEXT
    let start = i;
    while (i < input.length && input[i] !== '$' && input[i] !== '\\') i++;
    tokens.push({ type: 'text', value: input.slice(start, i) });
  }

  return tokens;
}

/* =========================
   AST BUILDER
========================= */
export function buildAST(tokens) {
  const root = { type: 'document', children: [] };
  const stack = [root];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const current = stack[stack.length - 1];

    if (t.type === 'command' && t.name === 'begin') {
      const envNode = {
        type: 'environment',
        name: t.arg || '',
        optArg: t.optArg,
        colspec: t.args[1] || null, // for tabular: \begin{tabular}{colspec}
        children: []
      };
      current.children.push(envNode);
      stack.push(envNode);
    } else if (t.type === 'command' && t.name === 'end') {
      if (stack.length > 1) {
        // Pop until we find matching environment
        let found = false;
        for (let k = stack.length - 1; k >= 1; k--) {
          if (stack[k].type === 'environment' && stack[k].name === t.arg) {
            stack.splice(k);
            found = true;
            break;
          }
        }
      }
    } else {
      current.children.push(t);
    }
  }

  return root;
}

/* =========================
   MULTI-PASS RESOLVER
========================= */
export function resolveAST(root, passes = 3) {
  const labels = new Map();
  const bibNumbers = new Map();
  const sectionNames = new Map();
  let equationCount = 0;
  let figureCount = 0;
  let tableCount = 0;
  let bibCount = 0;

  // PASS 1: Collect all labels, bib items, section names
  function collectPass(node) {
    if (node.type === 'environment') {
      const name = node.name;
      
      if (['equation', 'align', 'gather', 'multline', 'flalign', 'alignat'].includes(name)) {
        // Count each non-starred line in align
        if (name === 'align' || name === 'gather') {
          const text = getTextContent(node);
          const lines = text.split('\\\\');
          lines.forEach(line => {
            if (!line.includes('\\notag') && !line.includes('\\tag')) {
              equationCount++;
              const lm = line.match(/\\label\{([^}]+)\}/);
              if (lm) labels.set(lm[1], `${equationCount}`);
            }
          });
        } else {
          equationCount++;
          const labelNode = findChild(node, 'command', 'label');
          if (labelNode) labels.set(labelNode.arg, `${equationCount}`);
        }
      }
      
      if (name === 'figure' || name === 'figure*') {
        figureCount++;
        const labelNode = findDeepChild(node, 'command', 'label');
        if (labelNode) labels.set(labelNode.arg, `${figureCount}`);
      }
      
      if (name === 'table' || name === 'table*') {
        tableCount++;
        const labelNode = findDeepChild(node, 'command', 'label');
        if (labelNode) labels.set(labelNode.arg, `${tableCount}`);
      }
    }
    
    if (node.type === 'command') {
      if (node.name === 'bibitem') {
        bibCount++;
        const key = node.arg || node.optArg;
        if (key) bibNumbers.set(key, bibCount);
      }
      if (node.name === 'section' || node.name === 'subsection' || node.name === 'subsubsection') {
        // Store section name for \nameref
      }
    }

    if (node.children) node.children.forEach(collectPass);
  }

  // Run multiple collection passes for forward references
  for (let pass = 0; pass < passes; pass++) {
    equationCount = 0; figureCount = 0; tableCount = 0; bibCount = 0;
    collectPass(root);
  }

  return { root, labels, bibNumbers, sectionNames };
}

function findChild(node, type, name) {
  if (!node.children) return null;
  return node.children.find(c => c.type === type && c.name === name) || null;
}

function findDeepChild(node, type, name) {
  if (!node.children) return null;
  for (const c of node.children) {
    if (c.type === type && c.name === name) return c;
    const found = findDeepChild(c, type, name);
    if (found) return found;
  }
  return null;
}

/* =========================
   MAIN RENDERER
========================= */
export function renderNode(node, ctx) {
  if (!node) return '';

  if (node.type === 'document') {
    return node.children.map(c => renderNode(c, ctx)).join('');
  }

  if (node.type === 'text') {
    let text = node.value || '';
    // Handle TeX ligatures
    text = text
      .replace(/---/g, '&mdash;')
      .replace(/--/g, '&ndash;')
      .replace(/``/g, '&ldquo;')
      .replace(/''/g, '&rdquo;')
      .replace(/`/g, '&lsquo;')
      .replace(/'/g, '&rsquo;')
      .replace(/~/g, '&nbsp;')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return text.replace(/\n{2,}/g, '<br/><br/>').replace(/\n/g, ' ');
  }

  if (node.type === 'math_inline') {
    return renderMath(node.value, false, ctx);
  }

  if (node.type === 'math_block') {
    return `<div class="latex-math-block">${renderMath(node.value, true, ctx)}</div>`;
  }

  if (node.type === 'command') {
    // Check custom user-defined commands first
    if (ctx.userCommands && ctx.userCommands[node.name]) {
      try {
        const def = ctx.userCommands[node.name];
        let expanded = def;
        (node.args || []).forEach((arg, i) => {
          expanded = expanded.replace(new RegExp(`#${i+1}`, 'g'), arg);
        });
        const tokens = tokenizeLatex(expanded);
        const ast = buildAST(tokens);
        return renderNode(ast, ctx);
      } catch {}
    }
    
    const handler = COMMAND_HANDLERS[node.name];
    if (handler) {
      try {
        const result = handler(node.args || [], ctx, node.optArg);
        return result || '';
      } catch (e) {
        return '';
      }
    }
    
    // Unknown command — render arg content if any (graceful degradation)
    if (node.args && node.args.length > 0) {
      // Recurse into arg content
      const tokens = tokenizeLatex(node.args[0]);
      const ast = buildAST(tokens);
      return renderNode(ast, ctx);
    }
    
    return '';
  }

  if (node.type === 'environment') {
    const handler = ENVIRONMENT_HANDLERS[node.name];
    if (handler) {
      try {
        return handler(node, ctx);
      } catch (e) {
        return renderChildren(node, ctx);
      }
    }
    
    // Check if it's a user-defined environment
    if (ctx.userEnvironments && ctx.userEnvironments[node.name]) {
      return renderChildren(node, ctx);
    }
    
    // Graceful: render children anyway
    return renderChildren(node, ctx);
  }

  return '';
}

/* =========================
   PACKAGE LOADER
========================= */
function loadPackages(source, ctx) {
  const usepackageRegex = /\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/g;
  let match;
  ctx.loadedPackages = new Set();
  
  while ((match = usepackageRegex.exec(source)) !== null) {
    const opts = match[1] || '';
    const pkgs = match[2].split(',').map(p => p.trim());
    
    pkgs.forEach(pkg => {
      ctx.loadedPackages.add(pkg);
      const reg = PACKAGE_REGISTRY[pkg];
      if (reg) {
        // Mark features as enabled
        (reg.features || []).forEach(f => {
          ctx.features = ctx.features || new Set();
          ctx.features.add(f);
        });
      }
    });
  }
  
  // Set up KaTeX macros based on loaded packages
  ctx.katexMacros = buildKatexMacros(ctx.loadedPackages);
}

function buildKatexMacros(packages) {
  const macros = {};
  
  if (packages.has('physics')) {
    Object.assign(macros, {
      '\\dd': '\\mathrm{d}',
      '\\dv': '\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}',
      '\\pdv': '\\frac{\\partial #1}{\\partial #2}',
      '\\grad': '\\nabla',
      '\\curl': '\\nabla \\times',
      '\\div': '\\nabla \\cdot',
      '\\laplacian': '\\nabla^2',
      '\\abs': '\\left|#1\\right|',
      '\\norm': '\\left\\|#1\\right\\|',
      '\\eval': '\\left.#1\\right|',
      '\\order': '\\mathcal{O}\\left(#1\\right)',
      '\\comm': '\\left[#1,#2\\right]',
      '\\anticomm': '\\left\\{#1,#2\\right\\}',
      '\\expval': '\\left\\langle #1 \\right\\rangle',
      '\\mel': '\\left\\langle #1 \\middle| #2 \\middle| #3 \\right\\rangle',
      '\\braket': '\\left\\langle #1 \\middle| #2 \\right\\rangle',
      '\\bra': '\\left\\langle #1 \\right|',
      '\\ket': '\\left| #1 \\right\\rangle',
    });
  }
  
  if (packages.has('bm')) {
    macros['\\bm'] = '\\boldsymbol{#1}';
  }
  
  return macros;
}

/* =========================
   USER-DEFINED COMMAND EXTRACTOR
========================= */
function extractUserCommands(source) {
  const commands = {};
  const environments = {};
  
  // \newcommand{\name}[n]{def}
  const newcmdRegex = /\\(?:newcommand|renewcommand|providecommand)\{\\([a-zA-Z]+)\}(?:\[(\d+)\])?\{([\s\S]*?)\}(?=\s*(?:\\|\n|$))/g;
  let m;
  while ((m = newcmdRegex.exec(source)) !== null) {
    commands[m[1]] = m[3];
  }
  
  return { commands, environments };
}

/* =========================
   METADATA EXTRACTOR
========================= */
function extractMetadata(source) {
  const get = (cmd) => {
    const m = source.match(new RegExp(`\\\\${cmd}\\{([\\s\\S]*?)\\}(?=\\s)`));
    return m ? m[1] : null;
  };
  
  const cleanMeta = (s) => {
    if (!s) return '';
    return s
      .replace(/\\and/g, ' · ')
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\\textit\{([^}]*)\}/g, '$1')
      .replace(/\\textrm\{([^}]*)\}/g, '$1')
      .replace(/\\corref\{[^}]*\}/g, '')
      .replace(/\\fnref\{[^}]*\}/g, '')
      .replace(/\\thanks\{[^}]*\}/g, '')
      .replace(/\{|\}/g, '')
      .trim();
  };

  return {
    title: cleanMeta(get('title')) || 'Untitled Document',
    author: cleanMeta(get('author')) || '',
    date: cleanMeta(get('date')) || '',
    journal: cleanMeta(get('journal')) || '',
    address: cleanMeta(get('address')) || '',
    email: cleanMeta(get('ead')) || '',
    documentClass: (source.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]+)\}/) || [])[2] || 'article',
    documentOptions: (source.match(/\\documentclass\[([^\]]*)\]/) || [])[1] || '',
  };
}

/* =========================
   MAIN COMPILATION ENTRY POINT
========================= */
export function simulateCompilation(source) {
  const logs = [];
  let success = true;

  logs.push({ type: 'info', message: 'Waraqa AST Engine v3.0 — Multi-pass compiler started' });

  // Strip comments
  const cleanSource = source.split('\n').map(line => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '%' && (i === 0 || line[i-1] !== '\\')) {
        return line.substring(0, i);
      }
    }
    return line;
  }).join('\n');

  // --- PASS 0: Package loading ---
  const ctx = { sec: 0, sub: 0, subsub: 0, equationCount: 0, figureCount: 0, tableCount: 0 };
  loadPackages(cleanSource, ctx);
  logs.push({ type: 'info', message: `Loaded packages: ${[...ctx.loadedPackages].join(', ') || 'none'}` });

  // --- PASS 0b: Extract user-defined commands ---
  const { commands: userCmds } = extractUserCommands(cleanSource);
  ctx.userCommands = userCmds;
  if (Object.keys(userCmds).length > 0) {
    logs.push({ type: 'info', message: `User commands: \\${Object.keys(userCmds).join(', \\')}` });
  }

  // --- PASS 1: Lexer ---
  const tokens = tokenizeLatex(cleanSource);

  // Syntax check
  const openBraces = (cleanSource.match(/(?<!\\)\{/g) || []).length;
  const closeBraces = (cleanSource.match(/(?<!\\)\}/g) || []).length;
  if (Math.abs(openBraces - closeBraces) > 5) {
    logs.push({ type: 'warning', message: `Brace mismatch: ${openBraces} '{' vs ${closeBraces} '}'` });
  }

  const hasDocument = tokens.some(t => t.type === 'command' && t.name === 'begin' && t.arg === 'document');
  if (!hasDocument) {
    logs.push({ type: 'error', message: 'Missing \\begin{document}' });
    success = false;
  }

  // --- PASS 2: Build AST ---
  const ast = buildAST(tokens);

  // --- PASS 3–5: Multi-pass resolve (3 iterations for forward references) ---
  const { root, labels, bibNumbers, sectionNames } = resolveAST(ast, 3);
  ctx.labels = labels;
  ctx.bibNumbers = bibNumbers;
  ctx.sectionNames = sectionNames;
  logs.push({ type: 'info', message: `Resolved ${labels.size} labels, ${bibNumbers.size} bib entries` });

  // --- Metadata extraction ---
  const meta = extractMetadata(cleanSource);
  const isTwoColumn = meta.documentOptions.includes('twocolumn') || cleanSource.includes('5p,') || cleanSource.includes(',5p');
  const arabicCount = (cleanSource.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (cleanSource.match(/[a-zA-Z]/g) || []).length;
  const hasExplicitRtl = /\\usepackage\[([^\]]*arabic[^\]]*)\]\{babel\}|\\usepackage\{arabtex|\\usepackage\{arabi\}|\\setRTL|\\selectlanguage\{arabic\}/i.test(cleanSource);
  const hasArabic = arabicCount > 0 && (hasExplicitRtl || arabicCount > latinCount * 0.1);
  const dir = hasArabic ? 'rtl' : 'ltr';

  // --- PASS 6: Extract special sections ---
  function findAndRemoveEnv(node, name) {
    if (!node.children) return null;
    const idx = node.children.findIndex(c => c.type === 'environment' && c.name === name);
    if (idx !== -1) {
      const found = node.children.splice(idx, 1)[0];
      return found;
    }
    for (const c of node.children) {
      const found = findAndRemoveEnv(c, name);
      if (found) return found;
    }
    return null;
  }

  const highlightsNode = findAndRemoveEnv(root, 'highlights');
  const abstractNode = findAndRemoveEnv(root, 'abstract');
  const keywordNode = findAndRemoveEnv(root, 'keyword') || findAndRemoveEnv(root, 'keywords');

  // --- PASS 7: Render ---
  ctx.sec = 0; ctx.sub = 0; ctx.subsub = 0;
  ctx.equationCount = 0; ctx.figureCount = 0; ctx.tableCount = 0;

  const docEnv = root.children.find(n => n.type === 'environment' && n.name === 'document');
  let bodyNodes = docEnv ? docEnv.children : root.children;

  const metaCommandNames = new Set(['title','author','date','journal','address','ead','cortext','corref','fnref','inst','bibliographystyle','bibliography','documentclass','usepackage','RequirePackage','PassOptionsToPackage']);
  bodyNodes = bodyNodes.filter(n => !(n.type === 'command' && metaCommandNames.has(n.name)));

  // Handle \frontmatter
  const fmIdx = bodyNodes.findIndex(n => n.type === 'environment' && n.name === 'frontmatter');
  if (fmIdx !== -1) {
    const fm = bodyNodes[fmIdx];
    const fmChildren = fm.children.filter(n => !(n.type === 'command' && metaCommandNames.has(n.name)));
    bodyNodes.splice(fmIdx, 1, ...fmChildren);
  }

  const bodyHtml = bodyNodes.map(n => renderNode(n, ctx)).join('');

  const highlightsHtml = highlightsNode ? renderNode(highlightsNode, ctx) : '';
  const abstractHtml = (abstractNode || keywordNode) ? `
    <div class="latex-abstract-section">
      ${abstractNode ? `<div class="latex-abstract-title">Abstract</div><p class="latex-abstract-content">${renderChildren(abstractNode, ctx)}</p>` : ''}
      ${keywordNode ? `<div class="latex-keywords"><span class="latex-keywords-title">Keywords:</span> ${renderChildren(keywordNode, ctx)}</div>` : ''}
    </div>` : '';

  // --- Build final HTML ---
  const html = buildPageHTML({ meta, highlightsHtml, abstractHtml, bodyHtml, isTwoColumn, dir });

  logs.push({ type: 'success', message: 'Compilation complete — 1 page rendered' });

  return {
    html,
    logs,
    success: success && logs.filter(l => l.type === 'error').length === 0
  };
}

function buildPageHTML({ meta, highlightsHtml, abstractHtml, bodyHtml, isTwoColumn, dir }) {
  const textAlign = dir === 'rtl' ? 'right' : 'left';
  
  return `
<div class="wq-doc" dir="${dir}">
<style>
.wq-doc{font-family:'Georgia','Times New Roman',serif;color:#0d0d0d;background:#f1f5f9;padding:30px 15px;display:flex;justify-content:center;box-sizing:border-box;min-height:100%;width:100%}
.wq-doc .wq-page{position:relative;box-sizing:border-box;width:100%;max-width:210mm;min-height:297mm;padding:25mm 20mm 20mm 20mm;background:#fff;box-shadow:0 4px 25px rgba(0,0,0,.12);border:1px solid #e2e8f0;font-size:10pt;line-height:1.5}
.wq-doc .wq-journal{font-size:.85em;font-style:italic;color:#475569;border-bottom:1.2px solid #000;padding-bottom:8px;margin-bottom:20px;font-family:sans-serif;text-align:${textAlign}}
.wq-doc .wq-front{text-align:center;margin-bottom:25px}
.wq-doc .wq-title{font-size:1.75em;font-weight:bold;line-height:1.25;margin:0 0 15px;color:#111}
.wq-doc .wq-author{font-size:1.1em;margin:0 0 4px;color:#1a1a1a}
.wq-doc .wq-address{font-size:.82em;font-style:italic;margin:0 0 4px;color:#4b5563;line-height:1.4}
.wq-doc .wq-email{font-size:.8em;font-family:monospace;margin:0 0 8px;color:#4b5563}
.wq-doc .wq-date{font-size:1em;text-align:center;margin-bottom:20px;color:#444}
.wq-doc .latex-abstract-section{border-top:1px solid #111;border-bottom:1px solid #111;padding:12px 0;margin:15px 0 20px;font-size:.9em;line-height:1.4}
.wq-doc .latex-abstract-title{font-family:Arial,sans-serif;font-weight:bold;font-size:.95em;letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase}
.wq-doc .latex-abstract-content{text-align:justify;margin:0}
.wq-doc .latex-keywords{margin-top:10px;font-size:.9em;text-align:justify}
.wq-doc .latex-keywords-title{font-weight:bold;font-style:italic}
.wq-doc .latex-highlights-box{margin:15px 0;padding:10px 0;border-bottom:1px dashed #cbd5e1}
.wq-doc .latex-highlights-title{font-weight:bold;font-family:Arial,sans-serif;font-size:.95em;color:#1e293b;margin-bottom:6px;text-align:${textAlign}}
.wq-doc .latex-highlights-list{margin:0;padding-left:20px;list-style:disc}
.wq-doc .latex-highlights-list li{margin-bottom:4px;text-align:justify}
.wq-doc .wq-body{direction:${dir}}
.wq-doc .wq-body.twocol{column-count:2;column-gap:28px}
.wq-doc .latex-part{font-size:1.5em;font-weight:bold;margin:25px 0 10px;text-align:center;text-transform:uppercase}
.wq-doc .latex-chapter{font-size:1.4em;font-weight:bold;margin:20px 0 10px}
.wq-doc .latex-section{font-weight:bold;font-size:1.15em;margin:20px 0 8px;color:#000;break-after:avoid;text-align:${textAlign}}
.wq-doc .latex-subsection{font-weight:bold;font-size:1.05em;margin:14px 0 6px;break-after:avoid;text-align:${textAlign}}
.wq-doc .latex-subsubsection{font-weight:bold;font-style:italic;font-size:1em;margin:10px 0 4px;break-after:avoid;text-align:${textAlign}}
.wq-doc .wq-body p{text-align:justify;text-justify:inter-word;margin:0 0 10px;text-indent:1.5em}
.wq-doc .latex-section+p,.wq-doc .latex-subsection+p,.wq-doc .latex-subsubsection+p{text-indent:0!important}
.wq-doc .latex-list{margin:8px 0 12px;padding-left:20px}
.wq-doc .latex-list li{margin-bottom:4px;text-align:justify}
.wq-doc .latex-item{display:list-item}
.wq-doc .latex-figure,.wq-doc .latex-table-container{text-align:center;margin:15px 0;padding:8px;background:#fdfdfd;border:1px solid #e2e8f0;border-radius:4px;break-inside:avoid}
.wq-doc .latex-figure-wide,.wq-doc .latex-table-wide{column-span:all}
.wq-doc .latex-caption{font-size:.88em;font-style:italic;color:#475569;margin-top:6px;text-align:center;line-height:1.3}
.wq-doc .latex-image-placeholder{display:inline-block;margin:10px auto}
.wq-doc .latex-math-block{margin:12px 0;display:flex;justify-content:center;align-items:center;width:100%;break-inside:avoid}
.wq-doc .latex-math-inner{flex-grow:1;text-align:center}
.wq-doc .latex-equation{display:flex;align-items:center}
.wq-doc .latex-eq-num{color:#555;font-size:.9em;min-width:3em;text-align:right;flex-shrink:0}
.wq-doc .latex-align-line{display:flex;align-items:center;margin:4px 0}
.wq-doc .latex-table{border-collapse:collapse;width:100%;margin:10px 0;font-size:.88em}
.wq-doc .latex-table td{padding:5px 8px;border:none;text-align:left}
.wq-doc .latex-table .latex-table-header td{border-bottom:1px solid #000;font-weight:bold}
.wq-doc .latex-table .border-top-thick td{border-top:1.5px solid #000}
.wq-doc .latex-table .border-bottom-thick td{border-bottom:1.5px solid #000}
.wq-doc .latex-table .border-mid td{border-bottom:.8px solid #000}
.wq-doc .latex-table .border-hline td{border-bottom:.8px solid #888}
.wq-doc .latex-theorem{margin:12px 0;padding:10px 14px;background:#f8fafc;border-left:3px solid #3b82f6;border-radius:2px}
.wq-doc .latex-theorem-head{font-weight:bold;margin-bottom:4px}
.wq-doc .latex-proof{margin:10px 0;padding:8px 14px;font-style:italic}
.wq-doc .latex-cite-link{border:1px solid #22c55e;padding:0 3px;margin:0 1px;border-radius:1px;font-size:.92em;background:rgba(34,197,94,.03);cursor:pointer}
.wq-doc .latex-ref-link{border:1px solid #3b82f6;padding:0 3px;margin:0 1px;border-radius:1px;font-size:.92em;background:rgba(59,130,246,.03);cursor:pointer}
.wq-doc .latex-bibliography{margin-top:25px;break-inside:avoid}
.wq-doc .latex-bibliography h2{border-bottom:1px solid #111;padding-bottom:4px;margin-bottom:10px;text-transform:uppercase;font-size:1.05em;text-align:${textAlign}}
.wq-doc .latex-bib-list{list-style-type:none;padding:0;margin:0}
.wq-doc .latex-bib-item,.wq-doc .latex-bib-list li{font-size:.85em;line-height:1.35;margin-bottom:8px;padding-left:25px;text-indent:-25px;text-align:justify}
.wq-doc .latex-verbatim,.wq-doc .latex-lstlisting{background:#f8f8f8;border:1px solid #e2e8f0;padding:12px;font-family:monospace;font-size:.85em;overflow-x:auto;white-space:pre;margin:10px 0;border-radius:4px}
.wq-doc .latex-quote{margin:12px 20px;font-style:italic;border-left:2px solid #e2e8f0;padding-left:12px;color:#374151}
.wq-doc .latex-algorithm{border:1px solid #e2e8f0;margin:15px 0;padding:12px;background:#fafafa;font-family:monospace;font-size:.9em}
.wq-doc .latex-algorithm-title{font-weight:bold;margin-bottom:8px;font-family:serif}
.wq-doc .latex-toc-placeholder,.wq-doc .latex-tikz-placeholder{border:1px dashed #94a3b8;padding:15px;margin:15px 0;color:#64748b;text-align:center;font-style:italic;border-radius:4px}
.wq-doc .latex-math-error{color:#dc2626;background:#fef2f2;padding:2px 4px;border-radius:2px}
.wq-doc .wq-footer{margin-top:35px;border-top:1px solid #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;font-size:.8em;color:#64748b;font-family:sans-serif}
</style>

<div class="wq-page">
  ${meta.journal ? `<div class="wq-journal">${meta.journal}</div>` : ''}
  
  <div class="wq-front">
    <h1 class="wq-title">${meta.title}</h1>
    ${meta.author ? `<div class="wq-author">${meta.author}</div>` : ''}
    ${meta.address ? `<div class="wq-address">${meta.address}</div>` : ''}
    ${meta.email ? `<div class="wq-email">${meta.email}</div>` : ''}
    ${(!meta.journal && meta.date) ? `<div class="wq-date">${meta.date}</div>` : ''}
  </div>

  ${highlightsHtml}
  ${abstractHtml}
  
  <div class="wq-body ${isTwoColumn ? 'twocol' : ''}">
    ${bodyHtml}
  </div>
  
  <div class="wq-footer">
    <div>Waraqa Engine v3.0</div>
    <div>1</div>
  </div>
</div>
</div>`;
}

const AZURE_LATEX_URL = 'https://waraqa-latex.thankfulsky-d6df5537.uaenorth.azurecontainerapps.io';

function stripLatexComments(line) {
  let cleanLine = '';
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '%') {
      let backslashCount = 0;
      let idx = i - 1;
      while (idx >= 0 && line[idx] === '\\') {
        backslashCount++;
        idx--;
      }
      if (backslashCount % 2 === 0) {
        break; // Unescaped % starts a comment
      }
    }
    cleanLine += char;
  }
  return cleanLine;
}

/* =========================
   SYNTAX CHECKER
========================= */
function checkLatexSyntax(source) {
  const logs = [];
  
  // 1. Check brackets mismatch
  const stack = [];
  const lines = source.split('\n');
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const cleanLine = stripLatexComments(line);
    for (let c = 0; c < cleanLine.length; c++) {
      const char = cleanLine[c];
      
      // Check if bracket is escaped (preceded by odd number of backslashes)
      if (char === '{' || char === '}') {
        let backslashCount = 0;
        let idx = c - 1;
        while (idx >= 0 && cleanLine[idx] === '\\') {
          backslashCount++;
          idx--;
        }
        const isEscaped = backslashCount % 2 === 1;
        if (isEscaped) {
          continue; // Skip escaped curly braces \{ and \}
        }
      }

      if (char === '{') {
        stack.push({ char, line: l + 1, col: c + 1 });
      } else if (char === '}') {
        if (stack.length === 0) {
          logs.push({
            type: 'error',
            message: `Syntax Error: Mismatched closing bracket '}' at line ${l + 1}, column ${c + 1}`,
            line: l + 1,
            path: 'main.tex'
          });
        } else {
          stack.pop();
        }
      }
    }
  }
  
  while (stack.length > 0) {
    const unclosed = stack.pop();
    logs.push({
      type: 'error',
      message: `Syntax Error: Unclosed bracket '{' at line ${unclosed.line}, column ${unclosed.col}`,
      line: unclosed.line,
      path: 'main.tex'
    });
  }

  // 2. Check \begin and \end mismatch
  const envStack = [];
  
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    const cleanLine = stripLatexComments(line);
    
    let match;
    const regex = /\\(begin|end)\{([a-zA-Z*]+)\}/g;
    while ((match = regex.exec(cleanLine)) !== null) {
      const type = match[1];
      const envName = match[2];
      if (type === 'begin') {
        envStack.push({ envName, line: l + 1 });
      } else {
        if (envStack.length === 0) {
          logs.push({
            type: 'error',
            message: `Syntax Error: Mismatched \\end{${envName}} without matching \\begin at line ${l + 1}`,
            line: l + 1,
            path: 'main.tex'
          });
        } else {
          const last = envStack.pop();
          if (last.envName !== envName) {
            logs.push({
              type: 'error',
              message: `Syntax Error: Mismatched environments. Expected \\end{${last.envName}} (started at line ${last.line}) but found \\end{${envName}} at line ${l + 1}`,
              line: l + 1,
              path: 'main.tex'
            });
          }
        }
      }
    }
  }
  
  while (envStack.length > 0) {
    const unclosedEnv = envStack.pop();
    logs.push({
      type: 'error',
      message: `Syntax Error: Unclosed environment \\begin{${unclosedEnv.envName}} at line ${unclosedEnv.line}`,
      line: unclosedEnv.line,
      path: 'main.tex'
    });
  }
  
  return logs;
}

/* =========================
   REAL COMPILATION (FIXED SECURITY)
========================= */
export async function compileLatex(source, projectId = 'default', files = [], options = {}) {
  // Detect missing graphics and inject stubs into files
  const graphicsRegex = /\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g;
  let match;
  const stubPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const stubPdfBase64 = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
    '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n' +
    '3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources <<>> /Contents 4 0 R>> endobj\n' +
    '4 0 obj <</Length 0>> stream\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer <</Size 5 /Root 1 0 R>>\nstartxref\n261\n%%EOF'
  ).toString('base64');

  const mutableFiles = [...(files || [])];
  while ((match = graphicsRegex.exec(source)) !== null) {
    const imgPath = match[1].trim();
    const exists = mutableFiles.some(f => f.path === imgPath);
    if (!exists) {
      if (imgPath.endsWith('.pdf')) {
        mutableFiles.push({
          path: imgPath,
          content: stubPdfBase64,
          encoding: 'base64'
        });
      } else {
        const fullImgPath = imgPath.includes('.') ? imgPath : `${imgPath}.png`;
        const extExists = mutableFiles.some(f => f.path === fullImgPath);
        if (!extExists) {
          mutableFiles.push({
            path: fullImgPath,
            content: stubPngBase64,
            encoding: 'base64'
          });
        }
      }
    }
  }
  files = mutableFiles;

  const ok = await checkPdfLatex();
  
  // Syntax checks if enabled
  if (options.syntaxChecks !== false) {
    const syntaxErrors = checkLatexSyntax(source);
    if (syntaxErrors.length > 0) {
      return {
        pdf: null,
        logs: syntaxErrors,
        success: false
      };
    }
  }

  if (!ok) {
    // استخدم Azure إذا pdflatex غير موجود محلياً
    try {
      console.log(`[Compiler] Local pdflatex not found. Forwarding compilation request to Azure Container App (${AZURE_LATEX_URL})...`);
      const response = await fetch(`${AZURE_LATEX_URL}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, files, options })
      });
      const data = await response.json();
      console.log('[Compiler] Azure compilation completed successfully!');
      return data;
    } catch (err) {
      console.warn('[Compiler] Azure compilation failed. Falling back to local simulation engine. Error:', err.message);
      return simulateCompilation(source);
    }
  }

  const dir = path.join(TEMP_DIR, projectId);
  
  // Recompile from scratch option
  if (options.recompile === true) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });

  // Write all project files to directory
  if (files && files.length > 0) {
    for (const file of files) {
      const filePath = path.join(dir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const fileContent = file.encoding === 'base64' ? Buffer.from(file.content, 'base64') : file.content;
      fs.writeFileSync(filePath, fileContent);
    }
  }

  const tex = path.join(dir, 'doc.tex');
  const pdf = path.join(dir, 'doc.pdf');
  const log = path.join(dir, 'doc.log');

  fs.writeFileSync(tex, source);

  return new Promise((resolve) => {
    const errFlag = options.errorHandling === 'stop' ? '-interaction=nonstopmode -halt-on-error' : '-interaction=nonstopmode';
    
    let cmd;
    if (options.compileMode === 'fast') {
      if (process.platform === 'win32') {
        cmd = `cd /d "${dir}" && xelatex ${errFlag} doc.tex`;
      } else {
        cmd = `cd "${dir}" && xelatex ${errFlag} doc.tex`;
      }
    } else {
      if (process.platform === 'win32') {
        cmd = `cd /d "${dir}" && xelatex ${errFlag} doc.tex & bibtex doc & xelatex ${errFlag} doc.tex & xelatex ${errFlag} doc.tex`;
      } else {
        cmd = `cd "${dir}" && xelatex ${errFlag} doc.tex ; bibtex doc ; xelatex ${errFlag} doc.tex ; xelatex ${errFlag} doc.tex`;
      }
    }

    const runExec = (attempt = 1) => {
      const child = exec(cmd, { timeout: 30000 }, (err) => {
        const logs = [];
        let hasAuxError = false;

        if (fs.existsSync(log)) {
          const content = fs.readFileSync(log, 'utf8');
          hasAuxError = content.includes('File ended while scanning use of \\@newl@bel.');
          logs.push(...parseLatexLogs(content));
        }

        if (hasAuxError && attempt < 2) {
          console.warn('[Compiler] Detected corrupted .aux file. Deleting auxiliary files and retrying...');
          try {
            // Delete all files in the build dir except .tex and uploaded files
            const filesInDir = fs.readdirSync(dir);
            for (const f of filesInDir) {
              if (!f.endsWith('.tex') && f !== 'doc.tex' && (!files || !files.some(pf => pf.path === f))) {
                fs.rmSync(path.join(dir, f), { recursive: true, force: true });
              }
            }
            return resolve(runExec(attempt + 1));
          } catch (retryErr) {
            console.error('[Compiler] Retry cleanup failed:', retryErr.message);
          }
        }

        if (fs.existsSync(pdf)) {
          const base64 = fs.readFileSync(pdf).toString('base64');
          return resolve({
            pdf: `data:application/pdf;base64,${base64}`,
            logs,
            success: true
          });
        }

        resolve({
          pdf: null,
          logs: [...logs, { type: 'error', message: 'No PDF generated' }],
          success: false
        });
      });

      /* 🔥 KILL SAFETY */
      setTimeout(() => child.kill('SIGKILL'), 30000);
    };

    runExec(1);
  });
}

/* =========================
   LOG PARSER (IMPROVED)
========================= */
function parseLatexLogs(text) {
  const logs = [];
  if (!text) return logs;

  const lines = text.split('\n');
  let currentLog = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if it's an error line
    if (line.startsWith('!')) {
      if (currentLog) {
        logs.push(currentLog);
      }
      currentLog = {
        type: 'error',
        message: line.substring(1).trim(),
        fullMessage: line,
        line: null,
        path: 'main.tex'
      };
      
      // Parse subsequent lines for context and line number
      let j = i + 1;
      let contextLines = [];
      while (j < lines.length && !lines[j].trim().startsWith('!')) {
        const nextLine = lines[j];
        const nextLineTrimmed = nextLine.trim();
        
        // Skip some noisy pdflatex console prompt lines
        if (nextLineTrimmed.startsWith('Type  H <return>') || 
            nextLineTrimmed.startsWith('See the LaTeX manual') ||
            nextLineTrimmed.startsWith('Enter file name:')) {
          j++;
          continue;
        }

        // Check for line number (e.g., "l.15 \author" or "on input line 15")
        const lineMatch = nextLineTrimmed.match(/^l\.(\d+)/) || nextLineTrimmed.match(/on input line (\d+)/);
        if (lineMatch) {
          currentLog.line = parseInt(lineMatch[1], 10);
        }
        
        if (nextLineTrimmed) {
          contextLines.push(nextLine);
        }
        j++;
        if (j - i > 12) break; // Limit context search to avoid grabbing too much
      }
      if (contextLines.length > 0) {
        currentLog.fullMessage += '\n' + contextLines.join('\n');
      }
      // Skip processed lines
      i = j - 1;
    } 
    // Check if it's a warning line
    else if (line.includes('Warning:')) {
      if (currentLog) {
        logs.push(currentLog);
        currentLog = null;
      }
      // Extract line number if present in warning line
      const lineMatch = line.match(/on input line (\d+)/) || line.match(/:(\d+):/);
      const warningLog = {
        type: 'warning',
        message: line,
        fullMessage: line,
        line: lineMatch ? parseInt(lineMatch[1], 10) : null,
        path: 'main.tex'
      };
      logs.push(warningLog);
    }
  }
  
  if (currentLog) {
    logs.push(currentLog);
  }

  // Filter out noisy empty or duplicate logs
  return logs.filter(log => log.message && log.message.trim() !== '' && log.message.trim() !== '!');
}