import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { io } from 'socket.io-client';
import katex from 'katex';
import 'katex/dist/katex.min.css';


loader.config({ monaco });

// Register LaTeX syntax highlighting for Monaco Editor
monaco.languages.register({ id: 'latex' });
monaco.languages.setMonarchTokensProvider('latex', {
  tokenizer: {
    root: [
      [/%.*$/, 'comment'],
      [/\\(begin|end)(?=\{)/, 'keyword.control'],
      [/\\[a-zA-Z]+\*?/, 'keyword'],
      [/\$\$/, { token: 'string', next: '@mathblock' }],
      [/\$/, { token: 'string', next: '@mathinline' }],
      [/&/, 'operator'],
      [/\\\\/, 'operator'],
    ],
    mathblock: [
      [/\$\$/, { token: 'string', next: '@pop' }],
      [/[^$]+/, 'string'],
    ],
    mathinline: [
      [/\$/, { token: 'string', next: '@pop' }],
      [/[^$]+/, 'string'],
    ],
  }
});

// Custom LaTeX color theme (clean and professional)
monaco.editor.defineTheme('latex-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'keyword.control', foreground: '8B2FC9', fontStyle: 'bold' },
    { token: 'keyword', foreground: '2E86C1' },
    { token: 'string', foreground: 'C0392B' },
    { token: 'operator', foreground: 'E67E22', fontStyle: 'bold' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#1a1a2e',
    'editorLineNumber.foreground': '#9ca3af',
    'editorCursor.foreground': '#2E86C1',
    'editor.lineHighlightBackground': '#f0f9ff',
    'editor.selectionBackground': '#bfdbfe',
  }
});

monaco.languages.setLanguageConfiguration('latex', {
  brackets: [['{', '}'], ['[', ']']],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '$', close: '$' },
  ],
});


import {
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Play,
  RotateCw,
  LogOut,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  Terminal,
  Settings,
  FolderPlus,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
  List,
  Bold,
  Italic,
  Underline,
  Undo2,
  Redo2,
  PlusSquare,
  Share2,
  HelpCircle,
  Hash,
  ZoomIn,
  ZoomOut,
  Layout,
  FileCode,
  Folder,
  Upload,
  Copy,
  History,
  Info,
  Send,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  Link,
  Image,
  Table,
  Quote,
  Bookmark,
  Heading,
  Sparkles,
  Eye,
  MoreHorizontal,
  Search,
  Ban,
  Check,
  Bot,
  Wand2,
  Languages,
  RefreshCw
} from 'lucide-react';

const LATEX_SYMBOLS = {
  Greek: [
    { char: 'α', cmd: '\\alpha' },
    { char: 'β', cmd: '\\beta' },
    { char: 'γ', cmd: '\\gamma' },
    { char: 'δ', cmd: '\\delta' },
    { char: 'ε', cmd: '\\epsilon' },
    { char: 'ζ', cmd: '\\zeta' },
    { char: 'η', cmd: '\\eta' },
    { char: 'θ', cmd: '\\theta' },
    { char: 'ι', cmd: '\\iota' },
    { char: 'κ', cmd: '\\kappa' },
    { char: 'λ', cmd: '\\lambda' },
    { char: 'μ', cmd: '\\mu' },
    { char: 'ν', cmd: '\\nu' },
    { char: 'ξ', cmd: '\\xi' },
    { char: 'π', cmd: '\\pi' },
    { char: 'ρ', cmd: '\\rho' },
    { char: 'σ', cmd: '\\sigma' },
    { char: 'τ', cmd: '\\tau' },
    { char: 'υ', cmd: '\\upsilon' },
    { char: 'φ', cmd: '\\phi' },
    { char: 'χ', cmd: '\\chi' },
    { char: 'ψ', cmd: '\\psi' },
    { char: 'ω', cmd: '\\omega' },
    { char: 'Γ', cmd: '\\Gamma' },
    { char: 'Δ', cmd: '\\Delta' },
    { char: 'Θ', cmd: '\\Theta' },
    { char: 'Λ', cmd: '\\Lambda' },
    { char: 'Ξ', cmd: '\\Xi' },
    { char: 'Π', cmd: '\\Pi' },
    { char: 'Σ', cmd: '\\Sigma' },
    { char: 'Φ', cmd: '\\Phi' },
    { char: 'Ψ', cmd: '\\Psi' },
    { char: 'Ω', cmd: '\\Omega' },
  ],
  Arrows: [
    { char: '←', cmd: '\\leftarrow' },
    { char: '→', cmd: '\\rightarrow' },
    { char: '↑', cmd: '\\uparrow' },
    { char: '↓', cmd: '\\downarrow' },
    { char: '↔', cmd: '\\leftrightarrow' },
    { char: '⇐', cmd: '\\Leftarrow' },
    { char: '⇒', cmd: '\\Rightarrow' },
    { char: '⇔', cmd: '\\Leftrightarrow' },
    { char: '↦', cmd: '\\mapsto' },
    { char: '↔', cmd: '\\longleftrightarrow' },
  ],
  Operators: [
    { char: '±', cmd: '\\pm' },
    { char: '×', cmd: '\\times' },
    { char: '÷', cmd: '\\div' },
    { char: '∗', cmd: '\\ast' },
    { char: '·', cmd: '\\cdot' },
    { char: '∩', cmd: '\\cap' },
    { char: '∪', cmd: '\\cup' },
    { char: '⊂', cmd: '\\subset' },
    { char: '⊃', cmd: '\\supset' },
    { char: '⊆', cmd: '\\subseteq' },
    { char: '⊇', cmd: '\\supseteq' },
    { char: '∈', cmd: '\\in' },
    { char: '∉', cmd: '\\notin' },
    { char: '∑', cmd: '\\sum' },
    { char: '∫', cmd: '\\int' },
    { char: '∏', cmd: '\\prod' },
  ],
  Relations: [
    { char: '≤', cmd: '\\le' },
    { char: '≥', cmd: '\\ge' },
    { char: '≠', cmd: '\\neq' },
    { char: '≈', cmd: '\\approx' },
    { char: '≡', cmd: '\\equiv' },
    { char: '∝', cmd: '\\propto' },
    { char: '∼', cmd: '\\sim' },
    { char: '≅', cmd: '\\cong' },
  ],
  Misc: [
    { char: '∞', cmd: '\\infty' },
    { char: '∂', cmd: '\\partial' },
    { char: '∇', cmd: '\\nabla' },
    { char: '∀', cmd: '\\forall' },
    { char: '∃', cmd: '\\exists' },
    { char: '∅', cmd: '\\emptyset' },
    { char: 'ℵ', cmd: '\\aleph' },
    { char: 'ℏ', cmd: '\\hbar' },
    { char: '♣', cmd: '\\clubsuit' },
    { char: '♦', cmd: '\\diamondsuit' },
    { char: '♥', cmd: '\\heartsuit' },
    { char: '♠', cmd: '\\spadesuit' },
  ]
};

const BACKEND_URL = 'http://localhost:5000';


// 1. Lexer (Tokenization)
function tokenizeLatex(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    // DISPLAY MATH $$...$$
    if (input[i] === '$' && input[i + 1] === '$') {
      let j = i + 2;
      while (j < input.length && !(input[j] === '$' && input[j + 1] === '$')) j++;
      tokens.push({
        type: 'math_block',
        value: input.slice(i + 2, j)
      });
      i = j + 2;
      continue;
    }

    // INLINE MATH $...$
    if (input[i] === '$') {
      let j = i + 1;
      while (j < input.length && input[j] !== '$') j++;
      tokens.push({
        type: 'math_inline',
        value: input.slice(i + 1, j)
      });
      i = j + 1;
      continue;
    }

    // COMMAND \name{arg1}{arg2}... or \name[opt]{arg} or \name
    if (input[i] === '\\') {
      let j = i + 1;
      while (j < input.length && /[a-zA-Z*]/.test(input[j])) j++;

      const name = input.slice(i + 1, j);

      if (j === i + 1) {
        // Double backslash (newline)
        if (input[j] === '\\') {
          tokens.push({ type: 'command', name: '\\', args: [] });
          i = j + 1;
        } else {
          tokens.push({ type: 'text', value: '\\' });
          i = j;
        }
        continue;
      }

      // Optional argument [opt]
      let optArg = null;
      if (input[j] === '[') {
        let optStart = j + 1;
        while (j < input.length && input[j] !== ']') j++;
        if (input[j] === ']') {
          optArg = input.slice(optStart, j);
          j++;
        }
      }

      // Curly brace arguments {arg1}{arg2}...
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

      if (args.length > 0) {
        tokens.push({
          type: 'command',
          name,
          args,
          arg: args[0], // for single-arg compatibility
          optArg
        });
        i = j;
        continue;
      } else {
        // No curly brace argument
        tokens.push({
          type: 'command',
          name,
          args: [],
          arg: null,
          optArg
        });
        i = j;
        continue;
      }
    }

    // TEXT
    let start = i;
    while (i < input.length && input[i] !== '$' && input[i] !== '\\') i++;
    tokens.push({
      type: 'text',
      value: input.slice(start, i)
    });
  }

  return tokens;
}

// 2. AST Builder (Transforms tokens into a hierarchical tree)
function buildAST(tokens) {
  const root = {
    type: 'document',
    children: []
  };

  const stack = [root];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const current = stack[stack.length - 1];

    if (t.type === 'command' && t.name === 'begin') {
      const envNode = {
        type: 'environment',
        name: t.arg || '',
        optArg: t.optArg,
        children: []
      };
      current.children.push(envNode);
      stack.push(envNode);
    } else if (t.type === 'command' && t.name === 'end') {
      if (stack.length > 1 && stack[stack.length - 1].name === t.arg) {
        stack.pop();
      }
    } else {
      current.children.push(t);
    }
  }

  return root;
}

// Helper to clean math blocks of internal labels/refs to prevent KaTeX from crashing
function cleanMath(tex) {
  return tex
    .replace(/\\label\{[^}]*\}/g, '')
    .replace(/\\ref\{[^}]*\}/g, '')
    .replace(/\\cite\{[^}]*\}/g, '');
}

// 3. Resolver (Handles equation, figure, and table numbering and cross-references)
function resolveAST(root) {
  const labels = new Map();
  let equationCount = 0;
  let figureCount = 0;
  let tableCount = 0;

  // PASS 1: collect labels and map to target counters
  function collectLabels(node) {
    if (node.type === 'environment') {
      if (node.name === 'equation') {
        equationCount++;
        const labelNode = node.children.find(child => child.type === 'command' && child.name === 'label');
        if (labelNode) {
          labels.set(labelNode.arg, `(${equationCount})`);
        }
      } else if (node.name === 'figure') {
        figureCount++;
        const labelNode = node.children.find(child => child.type === 'command' && child.name === 'label');
        if (labelNode) {
          labels.set(labelNode.arg, `${figureCount}`);
        }
      } else if (node.name === 'table') {
        tableCount++;
        const labelNode = node.children.find(child => child.type === 'command' && child.name === 'label');
        if (labelNode) {
          labels.set(labelNode.arg, `${tableCount}`);
        }
      }
    }

    if (node.type === 'command' && node.name === 'label') {
      if (!labels.has(node.arg)) {
        labels.set(node.arg, node.arg);
      }
      node._remove = true;
    }

    if (node.children) {
      node.children.forEach(collectLabels);
    }
  }

  collectLabels(root);

  // PASS 2: resolve ref nodes and filter out label command nodes
  function resolveRefsAndFilter(node) {
    if (node.type === 'command' && node.name === 'ref') {
      node.resolved = labels.has(node.arg) ? labels.get(node.arg) : '??';
    }

    if (node.children) {
      node.children = node.children.filter(child => !child._remove);
      node.children.forEach(resolveRefsAndFilter);
    }
  }

  resolveRefsAndFilter(root);
  return { root, labels };
}

// Helper to find a command node recursively in the AST
function findCommandNode(node, name) {
  if (node.type === 'command' && node.name === name) {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findCommandNode(child, name);
      if (found) return found;
    }
  }
  return null;
}

// 4. Renderer (Generates premium styled HTML + KaTeX)
function renderMath(tex, display, katexLib) {
  try {
    const cleaned = cleanMath(tex);
    if (cleaned.length > 5000) return '<code>Math too large</code>';
    return katexLib.renderToString(cleaned.trim(), {
      displayMode: display,
      throwOnError: false
    });
  } catch {
    return `<code>${tex}</code>`;
  }
}

function renderNode(n, context) {
  if (n.type === 'document') {
    return n.children.map(child => renderNode(child, context)).join('');
  }

  const metadataCommands = ['title', 'author', 'date', 'journal', 'address', 'ead', 'cortext', 'corref', 'fnref', 'inst', 'bibliographystyle', 'bibliography', 'documentclass', 'usepackage'];
  if (n.type === 'command' && metadataCommands.includes(n.name)) {
    return '';
  }

  if (n.type === 'text') {
    let text = n.value;
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return text.replace(/\n\s*\n/g, '<br/><br/>');
  }

  if (n.type === 'math_inline') {
    return renderMath(n.value, false, context.katex);
  }

  if (n.type === 'math_block') {
    return `<div class="latex-math-block" style="margin: 15px 0; text-align: center;">${renderMath(n.value, true, context.katex)}</div>`;
  }

  if (n.type === 'command') {
    if (n.name === 'textbf') {
      return `<strong>${n.arg || ''}</strong>`;
    }
    if (n.name === 'textit') {
      return `<em>${n.arg || ''}</em>`;
    }
    if (n.name === 'underline') {
      return `<u>${n.arg || ''}</u>`;
    }
    if (n.name === 'texttt') {
      return `<code>${n.arg || ''}</code>`;
    }
    if (n.name === 'textcolor') {
      const color = n.args[0] || 'red';
      const text = n.args[1] || '';
      return `<span style="color: ${color}">${text}</span>`;
    }
    if (n.name === 'section') {
      context.sec++;
      context.sub = 0;
      context.subsub = 0;
      return `<h2 class="latex-section" style="font-size: 1.4em; font-weight: bold; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${context.sec}. ${n.arg || ''}</h2>`;
    }
    if (n.name === 'subsection') {
      context.sub++;
      context.subsub = 0;
      return `<h3 class="latex-subsection" style="font-size: 1.2em; font-weight: bold; margin-top: 15px;">${context.sec}.${context.sub} ${n.arg || ''}</h3>`;
    }
    if (n.name === 'subsubsection') {
      context.subsub++;
      return `<h4 class="latex-subsubsection" style="font-size: 1.1em; font-weight: bold; margin-top: 10px; font-style: italic;">${context.sec}.${context.sub}.${context.subsub} ${n.arg || ''}</h4>`;
    }
    if (n.name === 'ref') {
      return `<span style="color: #006699; font-weight: bold; cursor: pointer;">${n.resolved || '??'}</span>`;
    }
    if (n.name === 'cite') {
      return `<span style="color: #006699; cursor: pointer;">[${n.arg || ''}]</span>`;
    }
    if (n.name === 'includegraphics') {
      return `<div style="padding: 20px; border: 1px dashed #aaa; background: #f9f9f9; color: #666; margin: 10px 0; text-align: center;">[صورة: ${n.arg || ''}]</div>`;
    }
    if (n.name === 'caption') {
      return `<div style="font-style: italic; margin-top: 5px; color: #555; text-align: center;">شكل: ${n.arg || ''}</div>`;
    }
    if (n.name === 'item') {
      return `<li class="latex-item" style="margin-bottom: 6px;">`;
    }
    if (n.name === '\\') {
      return `<br/>`;
    }
    if (n.name === 'appendix') {
      return `<h2 class="latex-section" style="font-size: 1.4em; font-weight: bold; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Appendix (الملحق)</h2>`;
    }
    if (n.name === 'medskip' || n.name === 'bigskip' || n.name === 'smallskip') {
      return `<br/>`;
    }
    if (n.name === 'bibitem') {
      const label = n.optArg || '';
      return `<li class="latex-bib-item" id="bib-${n.arg || ''}" style="margin-bottom: 12px; line-height: 1.5; list-style-type: none;"><strong style="color: #006699;">[${label}]</strong> `;
    }
    return '';
  }

  if (n.type === 'environment') {
    if (n.name === 'abstract') {
      return `
        <div class="latex-abstract" style="margin: 20px 0; padding: 15px; background: #fdfdfd; border: 1px solid #e2e2e2; border-radius: 4px;">
          <div class="latex-abstract-title" style="font-weight: bold; text-align: center; margin-bottom: 10px; font-size: 1.1em; letter-spacing: 1px;">ABSTRACT</div>
          <p class="latex-abstract-content" style="line-height: 1.6; text-align: justify; font-size: 0.95em; color: #333; margin: 0;">
            ${n.children.map(child => renderNode(child, context)).join('')}
          </p>
        </div>
      `;
    }

    if (n.name === 'highlights') {
      return `
        <div class="latex-highlights" style="margin: 15px 0; padding: 10px 15px; background: #eef9ff; border-left: 4px solid #0088cc;">
          <div class="latex-highlights-title" style="font-weight: bold; margin-bottom: 8px; color: #006699;">Highlights (أبرز النقاط):</div>
          <ul class="latex-list latex-itemize" style="padding-left: 20px; margin: 0;">
            ${n.children.map(child => renderNode(child, context)).join('')}
          </ul>
        </div>
      `;
    }

    if (n.name === 'itemize') {
      return `<ul class="latex-list latex-itemize" style="padding-left: 20px; margin-bottom: 15px;">${n.children.map(child => renderNode(child, context)).join('')}</ul>`;
    }

    if (n.name === 'enumerate') {
      return `<ol class="latex-list latex-enumerate" style="padding-left: 20px; margin-bottom: 15px;">${n.children.map(child => renderNode(child, context)).join('')}</ol>`;
    }

    if (n.name === 'figure' || n.name === 'table') {
      return `<div class="latex-${n.name}" style="text-align: center; margin: 20px 0; padding: 10px; border: 1px dashed #ccc; background: #fafafa;">${n.children.map(child => renderNode(child, context)).join('')}</div>`;
    }

    if (n.name === 'equation' || n.name === 'align' || n.name === 'align*') {
      const mathContent = n.children.map(child => {
        if (child.type === 'text') return child.value;
        return '';
      }).join('');
      
      const labelChild = n.children.find(child => child.type === 'command' && child.name === 'label');
      let eqNumHtml = '';
      if (labelChild && context.labels.has(labelChild.arg)) {
        eqNumHtml = `<span style="float: right; margin-top: 5px; color: #555;">${context.labels.get(labelChild.arg)}</span>`;
      }
      
      return `
        <div class="latex-math-block" style="margin: 15px 0; display: flex; justify-content: center; align-items: center; position: relative; width: 100%;">
          <div style="flex-grow: 1; text-align: center;">
            ${renderMath(mathContent, true, context.katex)}
          </div>
          ${eqNumHtml}
        </div>
      `;
    }

    if (n.name === 'tabular') {
      const rawContent = n.children.map(child => renderNode(child, context)).join('');
      const rows = rawContent.trim().split(/\\\\/).map(row => row.trim()).filter(Boolean);
      const tableRows = rows.map(row => {
        if (row === '\\hline' || row === '\\hline\\hline') return '';
        const cells = row.split('&').map(cell => {
          let content = cell.replace(/\\hline/g, '').trim();
          return `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${content}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('\n');
      return `<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ddd;">${tableRows}</table>`;
    }

    if (n.name === 'thebibliography') {
      return `
        <div class="latex-bibliography" style="margin-top: 30px;">
          <h2 class="latex-section" style="font-size: 1.4em; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px;">References (المراجع)</h2>
          <ul class="latex-bib-list" style="padding-left: 20px; margin-top: 15px;">
            ${n.children.map(child => renderNode(child, context)).join('')}
          </ul>
        </div>
      `;
    }

    return `<div>${n.children.map(child => renderNode(child, context)).join('')}</div>`;
  }

  return '';
}

function App() {
  // Authentication & Username State
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('waraqa_username') || '';
  });
  const [userNameInput, setUserNameInput] = useState('');

  // Project Lists
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  
  // File System & Sidebar Tabs State
  const [activeFilePath, setActiveFilePath] = useState('main.tex');
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('files'); // 'files' | 'outline' | 'users' | 'settings'
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dynamic LaTeX Outline (Table of Contents)
  const [documentOutline, setDocumentOutline] = useState([]);

  // Compiler state
  const [compiledHtml, setCompiledHtml] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState('idle'); // 'idle' | 'success' | 'warning' | 'error'

  // PDF Preview Zoom Scale
  const [zoomScale, setZoomScale] = useState(100);

  // Editor ref & Settings
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [collaborators, setCollaborators] = useState([]);

  // Split Panel Resize State
  const [editorWidthPercent, setEditorWidthPercent] = useState(50);
  const isResizingRef = useRef(false);
  const containerRef = useRef(null);
  const monacoContainerRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState(500);

  // File menu dropdown toggle
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);

  // Word Count modal state
  const [showWordCountModal, setShowWordCountModal] = useState(false);
  const [wordCountInfo, setWordCountInfo] = useState({ words: 0, chars: 0, charsNoSpaces: 0, commands: 0 });

  // Symbol Palette drawer state
  const [showSymbolPalette, setShowSymbolPalette] = useState(false);
  const [activeSymbolTab, setActiveSymbolTab] = useState('Greek');
  const [symbolSearchQuery, setSymbolSearchQuery] = useState('');

  // View settings state
  const [editorTheme, setEditorTheme] = useState('vs');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorWordWrap, setEditorWordWrap] = useState('on');
  const [autoCompile, setAutoCompile] = useState(true);
  const [compileMode, setCompileMode] = useState('normal'); // 'normal' | 'fast'
  const [syntaxChecks, setSyntaxChecks] = useState(true); // true | false
  const [errorHandling, setErrorHandling] = useState('ignore'); // 'stop' | 'ignore'
  const [showCompileSettings, setShowCompileSettings] = useState(false);
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'error' | 'warning' | 'info'
  const [expandedLogs, setExpandedLogs] = useState({});
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showEquationPreview, setShowEquationPreview] = useState(true);
  const [activeMathText, setActiveMathText] = useState('');
  const [presentationMode, setPresentationMode] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('code');
  const [ttDropdownOpen, setTtDropdownOpen] = useState(false);

  // Version History state
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [projectSnapshots, setProjectSnapshots] = useState(() => {
    const saved = localStorage.getItem('waraqa_project_snapshots');
    if (saved) return JSON.parse(saved);
    return {
      'offline-demo': [
        {
          id: 'v1',
          name: 'المسودة الأولى (النسخة المبدئية)',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          files: [
            {
              path: 'main.tex',
              content: `\\documentclass{article}\n\\title{المقرر الأكاديمي لبرنامج ورقة}\n\\author{أحمد}\n\\begin{document}\n\\maketitle\n\\section{المقدمة}\nهذه مسودة أولى للبحث.\n\\end{document}`
            }
          ]
        },
        {
          id: 'v2',
          name: 'إضافة الأقسام العلمية والمعادلات',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          files: [
            {
              path: 'main.tex',
              content: `\\documentclass{article}\n\\title{المقرر الأكاديمي لبرنامج ورقة (Waraqa)}\n\\author{أحمد ستار، علي منصور}\n\\begin{document}\n\\maketitle\n\\section{المقدمة العامة}\nهذا هو النص المطور.\n\\section{المعادلات الرياضية}\n$f(x) = x^2$\n\\end{document}`
            }
          ]
        }
      ]
    };
  });

  // Submission Wizard state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitStep, setSubmitStep] = useState(1); // 1: Form, 2: Progress, 3: Success
  const [submitJournal, setSubmitJournal] = useState('IEEE Access');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submissionId, setSubmissionId] = useState('');
  const [submitProgressMessage, setSubmitProgressMessage] = useState('');

  // Standalone offline data mock database
  const [offlineProjects, setOfflineProjects] = useState(() => {
    const saved = localStorage.getItem('waraqa_offline_projects');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'offline-demo',
        name: 'مشروع محلي - ورقة بحثية (Offline)',
        createdAt: new Date().toISOString(),
        files: [
          {
            path: 'main.tex',
            content: `\\documentclass{article}
\\title{المقرر الأكاديمي لبرنامج ورقة (Waraqa)}
\\author{أحمد ستار، علي منصور}
\\date{\\today}
\\begin{document}
\\maketitle

\\begin{abstract}
هذا المستند يمثل نموذج تصميم أكاديمي متكامل للورقة البحثية التي يتم تجميعها فودياً عبر محرر ورقة. يهدف هذا النموذج إلى بيان التناسق والترتيب في كتابة التقارير والمستندات العلمية والرياضية.
\\end{abstract}

\\section{المقدمة العامة}
يمثل نظام LaTeX المعيار الأساسي للنشر العلمي في المجلات المحكمة والمؤتمرات العالمية.
بفضل ميزات التحرير المشترك في \\textbf{ورقة}، يمكن للباحثين صياغة الأوراق معاً في نفس الوقت.

\\subsection{أهمية الكتابة الرياضية}
تسهل الحزم الرياضية المدمجة صياغة الرموز والمعادلات بسلاسة فائقة، مع الحفاظ على مقاييس الهوامش القياسية وحجم الخط.

\\section{النتائج والنماذج الرياضية}
يمكن تمثيل القوانين العلمية كمعادلات مرقمة أو معادلات سطرية مثل $f(x) = x^2 + 2x$، أو معادلات منفصلة كما يلي:

\\begin{equation}
\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e
\\end{equation}

ويمكن أيضاً كتابة القوائم النقطية لتسجيل النقاط:
\\begin{itemize}
    \\item النقطة الأولى: مراجعة المراجع والدراسات السابقة.
    \\item النقطة الثانية: صياغة الفرضية الرياضية للمشروع.
    \\item النقطة الثالثة: محاكاة التجميع وتصميم النتائج.
\\end{itemize}

\\section{الخاتمة والتوصيات}
يظهر محرر ورقة كفاءة عالية في تجميع المستندات الرياضية وتصييرها الفوري على المتصفح بشكل أكاديمي محترم ومريح للعين.

\\end{document}`
          }
        ]
      }
    ];
  });

  // Save offline projects to storage
  useEffect(() => {
    localStorage.setItem('waraqa_offline_projects', JSON.stringify(offlineProjects));
  }, [offlineProjects]);

  // Save snapshots to storage
  useEffect(() => {
    localStorage.setItem('waraqa_project_snapshots', JSON.stringify(projectSnapshots));
  }, [projectSnapshots]);

  // Set direction on mount
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setFileMenuOpen(false);
      setEditMenuOpen(false);
      setInsertMenuOpen(false);
      setShowCompileSettings(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, [isOffline]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setProjects(data);
      setIsOffline(false);
    } catch (err) {
      console.warn('Backend server offline. Running in secure client-side simulator mode.');
      setIsOffline(true);
      setProjects(offlineProjects.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        fileCount: p.files.length
      })));
    }
  };

  // Socket.IO Setup when a project is selected
  useEffect(() => {
    if (!activeProjectId || isOffline) return;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.emit('join-project', {
      projectId: activeProjectId,
      userName: userName || 'مستخدم مجهول'
    });

    socket.on('project-users', (users) => {
      setCollaborators(users.filter(u => u.socketId !== socket.id));
    });

    socket.on('user-left', ({ userName }) => {
      addLog({ type: 'info', message: `غادر المستخدم ${userName} الجلسة.` });
    });

    socket.on('file-updated', ({ filePath, content }) => {
      setActiveProject(prev => {
        if (!prev) return null;
        const updatedFiles = prev.files.map(f => {
          if (f.path === filePath) {
            if (filePath === activeFilePath && editorRef.current) {
              const currentVal = editorRef.current.getValue();
              if (currentVal !== content) {
                editorRef.current.setValue(content);
              }
            }
            return { ...f, content };
          }
          return f;
        });
        return { ...prev, files: updatedFiles };
      });

      if (filePath === activeFilePath) {
        parseDocumentOutline(content);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [activeProjectId, isOffline]);

  // Load selected project content
  useEffect(() => {
    if (!activeProjectId) return;
    loadProjectContent(activeProjectId);
  }, [activeProjectId]);

  // (height is now computed via CSS calc — no JS measurement needed)




  const loadProjectContent = async (projectId) => {
    if (isOffline) {
      const proj = offlineProjects.find(p => p.id === projectId);
      if (proj) {
        setActiveProject(JSON.parse(JSON.stringify(proj)));
        const hasMain = proj.files.find(f => f.path === 'main.tex');
        const selectedFile = hasMain ? 'main.tex' : proj.files[0]?.path || '';
        setActiveFilePath(selectedFile);
        const activeFileObj = proj.files.find(f => f.path === selectedFile);
        if (activeFileObj) parseDocumentOutline(activeFileObj.content);
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to load project details');
      const data = await res.json();
      setActiveProject(data);
      const hasMain = data.files.find(f => f.path === 'main.tex');
      const selectedFile = hasMain ? 'main.tex' : data.files[0]?.path || '';
      setActiveFilePath(selectedFile);
      const activeFileObj = data.files.find(f => f.path === selectedFile);
      if (activeFileObj) parseDocumentOutline(activeFileObj.content);
    } catch (err) {
      addLog({ type: 'error', message: 'خطأ في جلب تفاصيل المشروع من الخادم.' });
    }
  };

  // Dynamic Outline Parser
  const parseDocumentOutline = (source) => {
    if (!source) return;
    const lines = source.split('\n');
    const outline = [];

    lines.forEach((line, index) => {
      const sectionMatch = line.match(/\\section\*?\{((?:[^{}]+|\{[^{}]*\})*)\}/);
      if (sectionMatch) {
        outline.push({
          type: 'section',
          title: sectionMatch[1],
          line: index + 1
        });
      }

      const subSectionMatch = line.match(/\\subsection\*?\{((?:[^{}]+|\{[^{}]*\})*)\}/);
      if (subSectionMatch) {
        outline.push({
          type: 'subsection',
          title: subSectionMatch[1],
          line: index + 1
        });
      }
    });

    setDocumentOutline(outline);
  };

  const jumpToLine = (lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLine(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const getAiSuggestion = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('token not allowed in a pdf string')) {
      return "استخدم الأمر \\texorpdfstring{الكود البرمجي}{النص العادي} للمصطلحات الرياضية أو الأوامر داخل عناوين الأقسام لتفادي هذا التحذير في فهرس PDF.";
    }
    if (msg.includes('float specifier changed to')) {
      return "قم بتغيير محدد موضع العناصر العائمة (مثل الجداول أو الصور) من [h] إلى [!ht] أو [H] لضمان توزيعها وموضعها بشكل مناسب.";
    }
    if (msg.includes('underfull \\hbox')) {
      return "هذا يعني أن السطر يحتوي على كلمات متباعدة جداً. يمكنك حل هذا باستخدام \\sloppy أو إعادة كتابة الجملة لتوزيع الكلمات بشكل أفضل.";
    }
    if (msg.includes('underfull \\vbox')) {
      return "هناك فراغ عمودي كبير في الصفحة. يمكن معالجته عبر إزالة الأسطر الفارغة الزائدة أو استخدام \\raggedbottom لمنع تمدد الصفحات عمودياً.";
    }
    if (msg.includes('unicode character')) {
      return "تأكد من اختيار خط يدعم اللغة العربية وتفعيل خيار التجميع XeLaTeX من إعدادات التجميع لتصيير الحروف العربية بنجاح.";
    }
    if (msg.includes('not found') || msg.includes('undefined control sequence')) {
      return "تأكد من كتابة اسم الأمر بشكل صحيح أو إضافة حزمة التنسيق المفقودة (\\usepackage{...}) في ديباجة المستند.";
    }
    return "تحقق من الصياغة النحوية لـ LaTeX وتأكد من إغلاق كافة الأقواس والمجموعات بشكل صحيح.";
  };

  // Compile LaTeX Document
  const handleCompile = async (optionsOverride = {}) => {
    if (!activeProject) return;
    setIsCompiling(true);
    setCompileProgress(0);
    setCompilationStatus('idle');
    addLog({ type: 'info', message: 'بدء تجميع المستند...' });

    // Start progress emulation interval
    const progressInterval = setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 92) {
          return 92;
        }
        // Random incremental steps to feel natural
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(92, prev + step);
      });
    }, 70);

    let latestContent = '';
    if (editorRef.current) {
      latestContent = editorRef.current.getValue();
    }

    if (isOffline) {
      setTimeout(() => {
        const mainFile = activeProject.files.find(f => f.path === 'main.tex') || activeProject.files[0];
        const contentToCompile = activeFilePath === mainFile.path && latestContent ? latestContent : mainFile.content;
        
        const simulated = simulateCompilation(contentToCompile);
        setCompiledHtml(simulated.html);
        setConsoleLogs(simulated.logs);
        
        const hasError = simulated.logs.some(l => l.type === 'error');
        const hasWarning = simulated.logs.some(l => l.type === 'warning');
        if (hasError) setCompilationStatus('error');
        else if (hasWarning) setCompilationStatus('warning');
        else setCompilationStatus('success');

        clearInterval(progressInterval);
        setCompileProgress(100);
        setTimeout(() => {
          setIsCompiling(false);
        }, 150);
      }, 600);
      return;
    }

    try {
      const mainFile = activeProject.files.find(f => f.path === activeFilePath);
      const compileBody = {
        options: {
          compileMode,
          syntaxChecks,
          errorHandling,
          ...optionsOverride
        }
      };
      if (mainFile && latestContent) {
        compileBody.path = activeFilePath;
        compileBody.content = latestContent;
      }

      const compileRes = await fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compileBody)
      });
      const result = await compileRes.json();

      setConsoleLogs(result.logs || []);
      
      const hasError = (result.logs || []).some(l => l.type === 'error');
      const hasWarning = (result.logs || []).some(l => l.type === 'warning');
      if (hasError) setCompilationStatus('error');
      else if (hasWarning) setCompilationStatus('warning');
      else setCompilationStatus('success');

      if (result.success) {
        if (result.pdf) {
          setCompiledHtml(`<iframe src="${result.pdf}" width="100%" height="100%" style="border:none;"></iframe>`);
        } else if (result.html) {
          setCompiledHtml(result.html);
          setTimeout(() => {
            triggerKaTeXRendering();
          }, 100);
        }
      } else {
        addLog({ type: 'error', message: 'فشل التجميع. تحقق من قائمة الأخطاء.' });
      }
    } catch (err) {
      setCompilationStatus('error');
      addLog({ type: 'error', message: 'حدث خطأ أثناء الاتصال بخادم التجميع.' });
    } finally {
      clearInterval(progressInterval);
      setCompileProgress(100);
      setTimeout(() => {
        setIsCompiling(false);
      }, 150);
    }
  };

  useEffect(() => {
    if (activeProject) {
      handleCompile();
    }
  }, [activeProjectId]);

  const simulateCompilation  = (source) => {
    const logs = [];
    let success = true;

    logs.push({ type: 'info', message: 'تشغيل محاكي التجميع المحلي الأكاديمي المطور (Waraqa AST Engine v2)...' });

    // Strip comments
    const cleanSource = source
      .split('\n')
      .map(line => {
        let commentIdx = -1;
        for (let idx = 0; idx < line.length; idx++) {
          if (line[idx] === '%' && (idx === 0 || line[idx - 1] !== '\\')) {
            commentIdx = idx;
            break;
          }
        }
        if (commentIdx !== -1) {
          return line.substring(0, commentIdx);
        }
        return line;
      })
      .join('\n');

    // 1. Lexer
    const tokens = tokenizeLatex(cleanSource);

    // Simple syntax checking
    const openBraces = (cleanSource.match(/\{/g) || []).length;
    const closeBraces = (cleanSource.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      logs.push({
        type: 'warning',
        message: `تحذير: أقواس مجعدة غير متطابقة. تم العثور على { ${openBraces} ومغلق ${closeBraces}.`
      });
    }

    // 2. Build AST
    const ast = buildAST(tokens);

    // Check for \begin{document}
    const hasDocument = tokens.some(t => t.type === 'command' && t.name === 'begin' && t.arg === 'document');
    if (!hasDocument) {
      logs.push({ type: 'error', message: 'خطأ فادح: المستند يفتقد إلى وسم البداية \\begin{document}' });
      success = false;
    }

    // 3. Resolve AST
    const { root, labels } = resolveAST(ast);

    // 4. Extract metadata
    const metadataCommands = ['title', 'author', 'date', 'journal', 'address', 'ead', 'cortext', 'corref', 'fnref', 'inst', 'bibliographystyle', 'bibliography', 'documentclass', 'usepackage'];

    const titleNode = findCommandNode(root, 'title');
    const authorNode = findCommandNode(root, 'author');
    const dateNode = findCommandNode(root, 'date');
    const journalNode = findCommandNode(root, 'journal');
    const addressNode = findCommandNode(root, 'address');
    const emailNode = findCommandNode(root, 'ead');

    let title = titleNode ? titleNode.arg : 'مستند LaTeX غير معنون';
    let author = authorNode ? authorNode.arg : '';
    let date = dateNode ? dateNode.arg : new Date().toLocaleDateString('ar-EG');
    let journal = journalNode ? journalNode.arg : '';
    let address = addressNode ? addressNode.arg : '';
    let email = emailNode ? emailNode.arg : '';

    const cleanMetaText = (txt) => {
      if (!txt) return '';
      return txt.replace(/\\and/g, ' & ').replace(/\\textbf\{([^}]*)\}/g, '$1').replace(/\\textit\{([^}]*)\}/g, '$1');
    };

    title = cleanMetaText(title);
    author = cleanMetaText(author);
    date = cleanMetaText(date);
    journal = cleanMetaText(journal);
    address = cleanMetaText(address);
    email = cleanMetaText(email);

    // 5. Render AST body (filtering out metadata nodes)
    const docEnv = root.children.find(n => n.type === 'environment' && n.name === 'document');
    let bodyNodes = docEnv ? docEnv.children : root.children;

    bodyNodes = bodyNodes.filter(n => !(n.type === 'command' && metadataCommands.includes(n.name)));

    const context = {
      sec: 0,
      sub: 0,
      subsub: 0,
      labels: labels,
      katex: katex
    };

    const bodyHtml = bodyNodes.map(n => renderNode(n, context)).join('');

    const assembledHtml = `
      <div class="latex-document-container" style="direction: ltr; font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div class="latex-page animate-fade-in" style="position: relative; padding: 40px;">
          <h1 class="latex-title" style="font-size: 1.8em; font-weight: bold; text-align: center; margin-bottom: 15px; color: #111;">${title}</h1>
          ${author ? `<div class="latex-author" style="font-size: 1.1em; text-align: center; margin-bottom: 5px; font-weight: 600;">${author}</div>` : ''}
          ${address ? `<div class="latex-address" style="font-size: 0.9em; color: #555; text-align: center; margin-bottom: 5px; font-style: italic;">${address}</div>` : ''}
          ${email ? `<div class="latex-email" style="font-size: 0.85em; color: #666; text-align: center; font-family: monospace; margin-bottom: 10px;">${email}</div>` : ''}
          ${journal ? `<div class="latex-journal" style="font-size: 0.9em; font-style: italic; color: #444; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">Journal: ${journal}</div>` : ''}
          ${(!journal && date) ? `<div class="latex-date" style="font-size: 1em; text-align: center; margin-bottom: 20px; color: #444;">${date}</div>` : ''}
          
          <div class="latex-body">
            ${bodyHtml}
          </div>
          
          <div class="latex-footer-space" style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; font-size: 0.85em; color: #777;">
            <div>Waraqa Editor</div>
            <div class="latex-page-number">1</div>
          </div>
        </div>
      </div>
    `;

    logs.push({ type: 'success', message: 'اكتمل التجميع الأكاديمي. تم تصيير المعاينة.' });

    return { html: assembledHtml, logs };
  };

  // Debounce ref for auto-compilation
  const compileTimeoutRef = useRef(null);

  const handleOpenPdfSeparateTab = () => {
    const previewBox = document.getElementById('preview-box');
    if (!previewBox) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>${activeProject?.name || 'معاينة ورقة'}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Cairo&family=Amiri&display=swap" rel="stylesheet">
          <style>
            body { background: #f1f5f9; padding: 2rem; display: flex; justify-content: center; font-family: 'Amiri', serif; direction: rtl; }
            .latex-document-container { width: 100%; max-width: 800px; }
            .latex-page { background: white; padding: 1.5in 1in 1in 1in; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
            .latex-title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .latex-author { text-align: center; font-size: 14px; margin-bottom: 5px; }
            .latex-date { text-align: center; font-size: 12px; margin-bottom: 30px; }
            .latex-abstract { margin: 20px auto; border-top: 1px solid black; border-bottom: 1px solid black; padding: 10px 0; font-size: 12px; }
            .latex-section { font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
            .latex-subsection { font-size: 15px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            .latex-paragraph { text-indent: 20px; margin-bottom: 10px; text-align: justify; }
            .latex-math-block { text-align: center; margin: 15px 0; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
        </head>
        <body>
          <div style="width: 100%; max-width: 800px; margin: 0 auto;">
            ${previewBox.innerHTML}
          </div>
          <script>
            renderMathInElement(document.body, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
              ],
              throwOnError: false
            });
          </script>
        </body>
        </html>
      `);
      win.document.close();
    }
  };

  const updateActiveMathBlock = (editor) => {
    if (!showEquationPreview) return;
    const model = editor.getModel();
    const position = editor.getPosition();
    if (!model || !position) return;

    const lineContent = model.getLineContent(position.lineNumber);
    const fullText = model.getValue();
    const lines = fullText.split('\n');
    
    let startLine = -1;
    let endLine = -1;

    for (let i = position.lineNumber - 1; i >= 0; i--) {
      if (lines[i].includes('\\begin{equation}') || lines[i].includes('$$')) {
        startLine = i;
        break;
      }
      if (lines[i].includes('\\end{equation}') || (i !== position.lineNumber - 1 && lines[i].includes('$$'))) {
        break;
      }
    }

    if (startLine !== -1) {
      const mathLines = [];
      for (let i = startLine; i < lines.length; i++) {
        mathLines.push(lines[i]);
        if (lines[i].includes('\\end{equation}') || (i !== startLine && lines[i].includes('$$'))) {
          endLine = i;
          break;
        }
      }
      if (endLine !== -1 && position.lineNumber - 1 >= startLine && position.lineNumber - 1 <= endLine) {
        const mathBlock = mathLines.join('\n');
        setActiveMathText(mathBlock);
        return;
      }
    }

    const matchInline = lineContent.match(/\$([^\$]+)\$/g);
    if (matchInline) {
      setActiveMathText(matchInline[0]);
    } else {
      setActiveMathText('');
    }
  };

  const renderMathPreview = (rawMath) => {
    if (!rawMath) return null;
    try {
      let cleanMath = rawMath
        .replace(/\\begin\{equation\}/g, '')
        .replace(/\\end\{equation\}/g, '')
        .replace(/\$\$/g, '')
        .replace(/\$/g, '');
      
      const html = window.katex.renderToString(cleanMath, {
        displayMode: rawMath.includes('$$') || rawMath.includes('equation'),
        throwOnError: false
      });
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>خطأ في صياغة المعادلة...</span>;
    }
  };

  const addLog = (log) => {
    setConsoleLogs(prev => [...prev, { ...log, time: new Date().toLocaleTimeString() }]);
  };

  // Editor Actions & Sync
  const handleEditorChange = (value) => {
    if (!activeProject) return;

    setActiveProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        files: prev.files.map(f => f.path === activeFilePath ? { ...f, content: value } : f)
      };
    });

    parseDocumentOutline(value);

    if (editorRef.current) {
      updateActiveMathBlock(editorRef.current);
    }

    if (autoCompile) {
      if (compileTimeoutRef.current) clearTimeout(compileTimeoutRef.current);
      compileTimeoutRef.current = setTimeout(() => {
        handleCompile();
      }, 1000);
    }

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            files: p.files.map(f => f.path === activeFilePath ? { ...f, content: value } : f)
          };
        }
        return p;
      }));
    } else if (socketRef.current) {
      socketRef.current.emit('edit-file', {
        projectId: activeProjectId,
        filePath: activeFilePath,
        content: value
      });
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      updateActiveMathBlock(editor);
      if (!isOffline && socketRef.current) {
        socketRef.current.emit('cursor-move', {
          projectId: activeProjectId,
          filePath: activeFilePath,
          cursor: { lineNumber: e.position.lineNumber, column: e.position.column }
        });
      }
    });
  };

  const handleToggleComment = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.commentLine');
    }
  };

  const handleIndent = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.indentLines');
    }
  };

  const handleOutdent = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.outdentLines');
    }
  };

  const handleTriggerSearch = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'actions.find');
    }
  };

  const insertLatexCommand = (before, after = '') => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const range = new selection.constructor(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn
    );
    const selectedText = editor.getModel().getValueInRange(range);
    const newText = before + selectedText + after;
    
    editor.executeEdits("toolbar-insert", [{
      range: range,
      text: newText,
      forceMoveMarkers: true
    }]);
    
    editor.focus();
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  const handleCut = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        document.execCommand('cut');
      } catch (e) {
        addLog({ type: 'warning', message: 'يرجى استخدام Ctrl+X لقص النص.' });
      }
    }
  };

  const handleCopy = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      try {
        document.execCommand('copy');
      } catch (e) {
        addLog({ type: 'warning', message: 'يرجى استخدام Ctrl+C لنسخ النص.' });
      }
    }
  };

  const handlePaste = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      navigator.clipboard.readText().then(text => {
        if (text) {
          const selection = editorRef.current.getSelection();
          editorRef.current.executeEdits("paste-action", [{
            range: selection,
            text: text,
            forceMoveMarkers: true
          }]);
        }
      }).catch(() => {
        addLog({ type: 'warning', message: 'بسبب قيود أمان المتصفح، يرجى استخدام الاختصار Ctrl+V للصق.' });
      });
    }
  };

  const handleSelectAll = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      editorRef.current.setSelection(model.getFullModelRange());
      editorRef.current.focus();
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'actions.find', null);
    }
  };

  const handleCommentLine = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.commentLine', null);
    }
  };

  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'editor.action.formatDocument', null);
    }
  };

  const handleClearAll = () => {
    if (!editorRef.current) return;
    if (window.confirm('هل أنت متأكد من مسح كافة محتويات المحرر بالكامل؟ لا يمكن التراجع عن هذا الإجراء إلا بـ Ctrl+Z.')) {
      editorRef.current.setValue('');
      addLog({ type: 'info', message: 'تم إفراغ ساحة المحرر بالكامل.' });
    }
  };

  const handleInsertTemplate = (type) => {
    if (!editorRef.current) return;
    let template = '';
    if (type === 'article') {
      template = `\\documentclass{article}
\\title{عنوان الورقة البحثية}
\\author{اسم الباحث الأول، اسم الباحث الثاني}
\\date{\\today}
\\begin{document}
\\maketitle

\\begin{abstract}
اكتب ملخص البحث هنا باللغتين العربية والانجليزية...
\\end{abstract}

\\section{المقدمة}
محتوى القسم الأول والمقدمة العلمية للبحث...

\\section{المنهجية العلمية}
تفاصيل الدراسة والمعادلات الرياضية:
$e = mc^2$

\\end{document}`;
    } else if (type === 'report') {
      template = `\\documentclass{report}
\\title{تقرير أكاديمي متكامل}
\\author{المعهد العلمي / القسم الأكاديمي}
\\date{\\today}
\\begin{document}
\\maketitle

\\chapter{المقدمة العامة}
\\section{خلفية التقرير}
محتوى التقرير والبيانات التقنية...

\\chapter{النتائج والملاحظات}
\\section{التوصيات النهائية}
توصيات اللجنة...

\\end{document}`;
    } else if (type === 'slides') {
      template = `\\documentclass{beamer}
\\usetheme{Madrid}
\\title{عنوان العرض التقديمي (Slides)}
\\author{اسم المحاضر}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{مقدمة العرض}
  \\begin{itemize}
    \\item النقطة الأولى في المحاضرة
    \\item النقطة الثانية والتطبيقات الرياضية
  \\end{itemize}
\\end{frame}

\\end{document}`;
    }

    if (window.confirm('هل تريد استبدال محتوى الملف الحالي بالكامل بهذا القالب الأكاديمي المختار؟')) {
      editorRef.current.setValue(template);
      handleEditorChange(template);
      addLog({ type: 'success', message: 'تم إدراج القالب الجديد بنجاح.' });
    }
  };

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const nameInput = e.target.projectName.value.trim();
    if (!nameInput) return;

    if (isOffline) {
      const newProj = {
        id: `offline-${Date.now()}`,
        name: nameInput,
        createdAt: new Date().toISOString(),
        files: [
          {
            path: 'main.tex',
            content: `\\documentclass{article}
\\title{${nameInput}}
\\author{${userName || 'مؤلف'}}
\\date{\\today}
\\begin{document}
\\maketitle
\\section{المقدمة}
اكتب مستند LaTeX هنا...
\\end{document}`
          }
        ]
      };
      setOfflineProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      e.target.reset();
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput })
      });
      const data = await res.json();
      setProjects(prev => [data, ...prev]);
      setActiveProjectId(data.id);
      e.target.reset();
    } catch (err) {
      addLog({ type: 'error', message: 'خطأ في إنشاء المشروع على الخادم.' });
    }
  };

  // File system management
  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim().endsWith('.tex') ? newFileName.trim() : `${newFileName.trim()}.tex`;

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const files = [...p.files];
          if (!files.find(f => f.path === name)) {
            files.push({ path: name, content: `% ملف جديد: ${name}` });
          }
          return { ...p, files };
        }
        return p;
      }));
      setActiveProject(prev => {
        const files = [...prev.files];
        if (!files.find(f => f.path === name)) {
          files.push({ path: name, content: `% ملف جديد: ${name}` });
        }
        return { ...prev, files };
      });
      setActiveFilePath(name);
      setNewFileName('');
      setIsCreatingFile(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: name, content: `% ملف جديد: ${name}` })
      });
      const data = await res.json();
      setActiveProject(data.project);
      setActiveFilePath(name);
      setNewFileName('');
      setIsCreatingFile(false);
    } catch (err) {
      addLog({ type: 'error', message: 'فشل في إنشاء ملف جديد.' });
    }
  };

  const handleDeleteFile = async (filePath) => {
    if (filePath === 'main.tex') {
      alert('لا يمكن حذف الملف الرئيسي main.tex');
      return;
    }

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, files: p.files.filter(f => f.path !== filePath) };
        }
        return p;
      }));
      setActiveProject(prev => ({
        ...prev,
        files: prev.files.filter(f => f.path !== filePath)
      }));
      if (activeFilePath === filePath) {
        setActiveFilePath('main.tex');
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      setActiveProject(data.project);
      if (activeFilePath === filePath) {
        setActiveFilePath('main.tex');
      }
    } catch (err) {
      addLog({ type: 'error', message: 'فشل في حذف الملف.' });
    }
  };

  // File Dropdown Actions
  const handleNewFileMenu = () => {
    const fileName = prompt('أدخل اسم الملف الجديد (مثال: intro.tex):');
    if (!fileName || !fileName.trim()) return;
    const name = fileName.trim().endsWith('.tex') || fileName.trim().endsWith('.bib') ? fileName.trim() : `${fileName.trim()}.tex`;

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const files = [...p.files];
          if (!files.find(f => f.path === name)) {
            files.push({ path: name, content: `% ملف جديد: ${name}` });
          }
          return { ...p, files };
        }
        return p;
      }));
      setActiveProject(prev => {
        const files = [...prev.files];
        if (!files.find(f => f.path === name)) {
          files.push({ path: name, content: `% ملف جديد: ${name}` });
        }
        return { ...prev, files };
      });
      setActiveFilePath(name);
      addLog({ type: 'success', message: `تم إنشاء ملف جديد: ${name}` });
      return;
    }

    fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name, content: `% ملف جديد: ${name}` })
    })
      .then(res => res.json())
      .then(data => {
        setActiveProject(data.project);
        setActiveFilePath(name);
        addLog({ type: 'success', message: `تم إنشاء ملف جديد: ${name}` });
      })
      .catch(() => addLog({ type: 'error', message: 'فشل في إنشاء الملف.' }));
  };

  const handleNewFolderMenu = () => {
    const folderName = prompt('أدخل اسم المجلد الجديد:');
    if (!folderName || !folderName.trim()) return;
    const cleanFolder = folderName.trim().replace(/\/$/, '');
    const path = `${cleanFolder}/main.tex`;
    const content = `% ملف البداية لمجلد ${cleanFolder}\n\\section{مقدمة القسم}`;

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const files = [...p.files];
          if (!files.find(f => f.path === path)) {
            files.push({ path, content });
          }
          return { ...p, files };
        }
        return p;
      }));
      setActiveProject(prev => {
        const files = [...prev.files];
        if (!files.find(f => f.path === path)) {
          files.push({ path, content });
        }
        return { ...prev, files };
      });
      setActiveFilePath(path);
      addLog({ type: 'success', message: `تم إنشاء المجلد ${cleanFolder} مع ملف main.tex` });
      return;
    }

    fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    })
      .then(res => res.json())
      .then(data => {
        setActiveProject(data.project);
        setActiveFilePath(path);
        addLog({ type: 'success', message: `تم إنشاء المجلد ${cleanFolder} مع ملف main.tex` });
      })
      .catch(() => addLog({ type: 'error', message: 'فشل في إنشاء المجلد.' }));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const path = file.name;

      if (isOffline) {
        setOfflineProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            const files = [...p.files];
            const exist = files.find(f => f.path === path);
            if (!exist) files.push({ path, content });
            else files.forEach(f => { if (f.path === path) f.content = content; });
            return { ...p, files };
          }
          return p;
        }));
        setActiveProject(prev => {
          const files = [...prev.files];
          const exist = files.find(f => f.path === path);
          if (!exist) files.push({ path, content });
          else files.forEach(f => { if (f.path === path) f.content = content; });
          return { ...prev, files };
        });
        setActiveFilePath(path);
        addLog({ type: 'success', message: `تم رفع واستبدال الملف: ${path}` });
        return;
      }

      fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      })
        .then(res => res.json())
        .then(data => {
          setActiveProject(data.project);
          setActiveFilePath(path);
          addLog({ type: 'success', message: `تم رفع واستبدال الملف: ${path}` });
        })
        .catch(() => addLog({ type: 'error', message: 'فشل في رفع الملف.' }));
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const handleImageUploadClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const path = file.name;

      if (isOffline) {
        setOfflineProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            const files = [...p.files];
            const exist = files.find(f => f.path === path);
            if (!exist) files.push({ path, content: base64Data, isImage: true });
            return { ...p, files };
          }
          return p;
        }));
        setActiveProject(prev => {
          const files = [...prev.files];
          const exist = files.find(f => f.path === path);
          if (!exist) files.push({ path, content: base64Data, isImage: true });
          return { ...prev, files };
        });
      } else {
        fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, content: base64Data, isImage: true })
        })
          .then(res => res.json())
          .then(data => {
            setActiveProject(data.project);
          })
          .catch(() => {});
      }

      insertLatexCommand(`\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.7\\linewidth]{${path}}
  \\caption{العنوان التوضيحي للصورة}
  \\label{fig:${path.split('.')[0]}}
\\end{figure}`);
      addLog({ type: 'success', message: `تم رفع الصورة "${path}" وإدراجها بنجاح.` });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const handleInsertFromProjectFiles = () => {
    const imageFiles = activeProject?.files.filter(f => f.isImage || /\.(png|jpe?g|gif|svg)$/i.test(f.path)) || [];
    if (imageFiles.length === 0) {
      alert('لا توجد صور مرفوعة في هذا المشروع حالياً. يمكنك استخدام خيار "رفع من الكمبيوتر" لإضافة صور.');
      return;
    }
    
    const optionsText = imageFiles.map((f, idx) => `${idx + 1}. ${f.path}`).join('\n');
    const choice = prompt(`اختر رقم الصورة لإدراجها في المستند:\n\n${optionsText}`);
    if (!choice) return;
    const selectedIdx = parseInt(choice.trim(), 10) - 1;
    if (selectedIdx >= 0 && selectedIdx < imageFiles.length) {
      const selectedFile = imageFiles[selectedIdx];
      insertLatexCommand(`\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.7\\linewidth]{${selectedFile.path}}
  \\caption{العنوان التوضيحي للصورة}
  \\label{fig:${selectedFile.path.split('.')[0]}}
\\end{figure}`);
      addLog({ type: 'success', message: `تم إدراج الصورة "${selectedFile.path}".` });
    } else {
      alert('اختيار غير صحيح.');
    }
  };

  const handleInsertFromAnotherProject = () => {
    const allProjs = isOffline ? offlineProjects : projects;
    const otherProjs = allProjs.filter(p => p.id !== activeProjectId);
    if (otherProjs.length === 0) {
      alert('لا توجد مشاريع أخرى حالياً لاستيراد الصور منها.');
      return;
    }

    const projsText = otherProjs.map((p, idx) => `${idx + 1}. ${p.name}`).join('\n');
    const projChoice = prompt(`اختر رقم المشروع لاستيراد الصورة منه:\n\n${projsText}`);
    if (!projChoice) return;
    
    const projIdx = parseInt(projChoice.trim(), 10) - 1;
    if (projIdx >= 0 && projIdx < otherProjs.length) {
      const sourceProj = otherProjs[projIdx];
      const imageFiles = sourceProj.files.filter(f => f.isImage || /\.(png|jpe?g|gif|svg)$/i.test(f.path)) || [];
      if (imageFiles.length === 0) {
        alert(`المشروع "${sourceProj.name}" لا يحتوي على صور.`);
        return;
      }

      const imgsText = imageFiles.map((f, idx) => `${idx + 1}. ${f.path}`).join('\n');
      const imgChoice = prompt(`اختر رقم الصورة لاستيرادها وإدراجها:\n\n${imgsText}`);
      if (!imgChoice) return;

      const imgIdx = parseInt(imgChoice.trim(), 10) - 1;
      if (imgIdx >= 0 && imgIdx < imageFiles.length) {
        const selectedFile = imageFiles[imgIdx];

        if (isOffline) {
          setOfflineProjects(prev => prev.map(p => {
            if (p.id === activeProjectId) {
              const files = [...p.files];
              if (!files.find(f => f.path === selectedFile.path)) {
                files.push({ ...selectedFile });
              }
              return { ...p, files };
            }
            return p;
          }));
          setActiveProject(prev => {
            const files = [...prev.files];
            if (!files.find(f => f.path === selectedFile.path)) {
              files.push({ ...selectedFile });
            }
            return { ...prev, files };
          });
        } else {
          fetch(`${BACKEND_URL}/api/projects/${activeProjectId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: selectedFile.path, content: selectedFile.content, isImage: true })
          })
            .then(res => res.json())
            .then(data => {
              setActiveProject(data.project);
            })
            .catch(() => {});
        }

        insertLatexCommand(`\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.7\\linewidth]{${selectedFile.path}}
  \\caption{العنوان التوضيحي للصورة}
  \\label{fig:${selectedFile.path.split('.')[0]}}
\\end{figure}`);
        addLog({ type: 'success', message: `تم استيراد وإدراج الصورة "${selectedFile.path}" من مشروع "${sourceProj.name}".` });
      } else {
        alert('اختيار غير صحيح.');
      }
    } else {
      alert('اختيار غير صحيح.');
    }
  };

  const handleInsertFromUrl = () => {
    const url = prompt('أدخل رابط الصورة المباشر (URL):', 'https://');
    if (!url || !url.trim() || url === 'https://') return;
    
    insertLatexCommand(`\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=0.7\\linewidth]{${url}}
  \\caption{شرح الصورة من الرابط}
  \\label{fig:url_image}
\\end{figure}`);
    addLog({ type: 'success', message: 'تم إدراج رابط الصورة بنجاح.' });
  };

  const handleMakeCopy = () => {
    if (!activeProject) return;
    const newName = `${activeProject.name} - نسخة`;

    if (isOffline) {
      const newProj = {
        id: `offline-${Date.now()}`,
        name: newName,
        createdAt: new Date().toISOString(),
        files: JSON.parse(JSON.stringify(activeProject.files))
      };
      setOfflineProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      addLog({ type: 'success', message: `تم نسخ المشروع كـ "${newName}"` });
      return;
    }

    fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })
      .then(res => res.json())
      .then(data => {
        const savePromises = activeProject.files.map(f => {
          return fetch(`${BACKEND_URL}/api/projects/${data.id}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: f.path, content: f.content })
          });
        });

        Promise.all(savePromises).then(() => {
          setProjects(prev => [data, ...prev]);
          setActiveProjectId(data.id);
          addLog({ type: 'success', message: `تم نسخ المشروع كـ "${newName}"` });
        });
      })
      .catch(() => addLog({ type: 'error', message: 'فشل في نسخ المشروع.' }));
  };

  // Word Count modal trigger
  const handleWordCountTrigger = () => {
    if (!activeFile) return;
    const text = activeFile.content;

    const noComments = text.replace(/%.*$/gm, '');
    const commands = (noComments.match(/\\[a-zA-Z]+/g) || []).length;
    let cleanText = noComments.replace(/\\[a-zA-Z]+\*?(\{.*?\})?/g, ' ');
    cleanText = cleanText.replace(/[\{\}]/g, ' ');
    
    const wordsArray = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
    const words = wordsArray.length;
    const chars = cleanText.length;
    const charsNoSpaces = cleanText.replace(/\s/g, '').length;

    setWordCountInfo({ words, chars, charsNoSpaces, commands });
    setShowWordCountModal(true);
  };

  // Snapshot Management (Version History)
  const handleSaveSnapshot = () => {
    if (!activeProject || !newSnapshotName.trim()) return;
    const name = newSnapshotName.trim();
    const newSnapshot = {
      id: `snap-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      files: JSON.parse(JSON.stringify(activeProject.files))
    };

    setProjectSnapshots(prev => {
      const currentSnaps = prev[activeProjectId] || [];
      return {
        ...prev,
        [activeProjectId]: [newSnapshot, ...currentSnaps]
      };
    });
    setNewSnapshotName('');
    addLog({ type: 'success', message: `تم حفظ نسخة تاريخية جديدة: ${name}` });
  };

  const handleRestoreSnapshot = (snapshot) => {
    if (!window.confirm(`هل أنت متأكد من استعادة النسخة "${snapshot.name}"؟ سيتم استبدال كل الملفات الحالية.`)) return;

    setActiveProject(prev => {
      if (!prev) return null;
      return { ...prev, files: JSON.parse(JSON.stringify(snapshot.files)) };
    });

    if (isOffline) {
      setOfflineProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, files: JSON.parse(JSON.stringify(snapshot.files)) };
        }
        return p;
      }));
    }

    const hasMain = snapshot.files.find(f => f.path === 'main.tex');
    const selectedFile = hasMain ? 'main.tex' : snapshot.files[0]?.path || '';
    setActiveFilePath(selectedFile);

    const activeFileObj = snapshot.files.find(f => f.path === selectedFile);
    if (editorRef.current && activeFileObj) {
      editorRef.current.setValue(activeFileObj.content);
    }

    setShowVersionHistoryModal(false);
    addLog({ type: 'success', message: `تم استعادة المشروع إلى نسخة: ${snapshot.name}` });
  };

  // Submit Submission Wizard
  const handleOpenSubmit = () => {
    setSubmitStep(1);
    setSubmitProgress(0);
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    setSubmitStep(2);
    setSubmitProgress(0);
    setSubmitProgressMessage('تحضير وتنسيق الملفات المصدرية...');

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      setSubmitProgress(currentProgress);
      
      if (currentProgress === 25) {
        setSubmitProgressMessage('التحقق من التناسق الرياضي والرموز...');
      } else if (currentProgress === 50) {
        setSubmitProgressMessage('الرفع الآمن إلى خوادم المجلة العلمية...');
      } else if (currentProgress === 75) {
        setSubmitProgressMessage('إنشاء بطاقة التقديم وتحديد المراجعين...');
      } else if (currentProgress >= 100) {
        clearInterval(interval);
        setSubmissionId(`WARAQA-${Math.floor(100000 + Math.random() * 900000)}`);
        setSubmitStep(3);
        addLog({ type: 'success', message: 'تم تقديم المستند بنجاح للمجلة الأكاديمية.' });
      }
    }, 600);
  };

  // Export / Downloads functions
  const handleDownloadZip = () => {
    if (!activeProject) return;
    if (typeof window.JSZip === 'undefined') {
      alert('مكتبة JSZip لم تكتمل في التحميل بعد. يرجى الانتظار ثوانٍ.');
      return;
    }

    const zip = new window.JSZip();
    activeProject.files.forEach(f => {
      zip.file(f.path, f.content);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      window.saveAs(content, `${activeProject.name}.zip`);
      addLog({ type: 'success', message: 'تم تنزيل المشروع كملف مضغوط (.zip) بنجاح.' });
    });
  };

  const handleDownloadPDF = () => {
    if (isOffline) {
      const printWindow = window.open('', '_blank');
      const docHtml = document.getElementById('preview-box').innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <title>${activeProject.name}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <style>
            body { background-color: white; padding: 0; margin: 0; display: flex; justify-content: center; font-family: 'Times New Roman', serif; }
            .latex-document-container { width: 100%; max-width: 800px; }
            .latex-page { background: white; color: black; padding: 1in; box-shadow: none; min-height: auto; }
            .latex-title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .latex-author { text-align: center; font-size: 14px; margin-bottom: 5px; }
            .latex-date { text-align: center; font-size: 12px; margin-bottom: 30px; }
            .latex-abstract { margin: 20px auto; border-top: 1px solid black; border-bottom: 1px solid black; padding: 10px 0; font-size: 12px; }
            .latex-abstract-title { font-weight: bold; text-align: center; margin-bottom: 5px; }
            .latex-section { font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
            .latex-subsection { font-size: 15px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
            .latex-paragraph { text-indent: 20px; margin-bottom: 10px; }
            .latex-math-block { text-align: center; margin: 15px 0; }
            .latex-item { margin-bottom: 5px; }
            .latex-footer-space { display: none; }
            @media print {
              body { padding: 0; margin: 0; }
              .latex-page { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${docHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      handleCompile().then(() => {
        const iframe = document.querySelector('#preview-box iframe');
        if (iframe && iframe.src) {
          const link = document.createElement('a');
          link.href = iframe.src;
          link.download = `${activeProject.name}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.print();
        }
      });
    }
  };

  const handleExportWord = () => {
    const docHtml = document.getElementById('preview-box').innerHTML;
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${activeProject.name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; direction: rtl; }
          .latex-title { text-align: center; font-size: 24px; font-weight: bold; }
          .latex-author { text-align: center; font-size: 14px; }
          .latex-date { text-align: center; font-size: 12px; }
          .latex-abstract { margin: 20px 0; border-top: 1px solid black; border-bottom: 1px solid black; padding: 10px 0; }
          .latex-section { font-size: 18px; font-weight: bold; margin-top: 20px; }
          .latex-subsection { font-size: 15px; font-weight: bold; margin-top: 15px; }
          .latex-paragraph { text-indent: 20px; }
        </style>
      </head>
      <body>
        ${docHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword;charset=utf-8' });
    window.saveAs(blob, `${activeProject.name}.doc`);
    addLog({ type: 'success', message: 'تم تصدير المستند بنجاح كمستند Word (.doc)' });
  };

  const handleExportMarkdown = () => {
    if (!activeFile) return;
    let text = activeFile.content;

    text = text.replace(/\\title\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '# $1\n');
    text = text.replace(/\\author\{((?:[^{}]+|\{[^{}]*\})*)\}/g, 'المؤلفون: $1\n');
    text = text.replace(/\\date\{((?:[^{}]+|\{[^{}]*\})*)\}/g, 'التاريخ: $1\n\n');
    text = text.replace(/\\section\*?\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '\n## $1\n');
    text = text.replace(/\\subsection\*?\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '\n### $1\n');
    text = text.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, '> **الملخص:**\n> $1\n\n');
    text = text.replace(/\\textbf\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '**$1**');
    text = text.replace(/\\textit\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '*$1*');
    text = text.replace(/\\underline\{((?:[^{}]+|\{[^{}]*\})*)\}/g, '_$1_');
    text = text.replace(/\\item/g, '-');
    text = text.replace(/\\begin\{itemize\}/g, '');
    text = text.replace(/\\end\{itemize\}/g, '');
    text = text.replace(/\\begin\{enumerate\}/g, '');
    text = text.replace(/\\end\{enumerate\}/g, '');

    text = text.replace(/\\documentclass.*?\n/g, '');
    text = text.replace(/\\usepackage.*?\n/g, '');
    text = text.replace(/\\begin\{document\}/g, '');
    text = text.replace(/\\end\{document\}/g, '');
    text = text.replace(/\\maketitle/g, '');
    text = text.replace(/%.*?\n/g, '\n');

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    window.saveAs(blob, `${activeFilePath.replace('.tex', '')}.md`);
    addLog({ type: 'success', message: 'تم تصدير الملف كـ Markdown' });
  };

  const handleExportHTML = () => {
    const docHtml = document.getElementById('preview-box').innerHTML;
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${activeProject.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
        <style>
          body { background-color: #f1f5f9; padding: 2rem; display: flex; justify-content: center; font-family: 'Amiri', serif; }
          .latex-document-container { width: 100%; max-width: 800px; }
          .latex-page { background: white; color: black; padding: 1.5in 1in 1in 1in; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
          .latex-title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 15px; }
          .latex-author { text-align: center; font-size: 14px; margin-bottom: 5px; }
          .latex-date { text-align: center; font-size: 12px; margin-bottom: 30px; }
          .latex-abstract { margin: 20px auto; border-top: 1px solid black; border-bottom: 1px solid black; padding: 10px 0; font-size: 12px; }
          .latex-section { font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
          .latex-subsection { font-size: 15px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
          .latex-paragraph { text-indent: 20px; margin-bottom: 10px; text-align: justify; }
          .latex-math-block { text-align: center; margin: 15px 0; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
      </head>
      <body>
        ${docHtml}
        <script>
          window.onload = function() {
            renderMathInElement(document.body, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
              ]
            });
          };
        </script>
      </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    window.saveAs(blob, `${activeProject.name}.html`);
    addLog({ type: 'success', message: 'تم تصدير المستند كصفحة ويب HTML بنجاح.' });
  };

  // Additional Option: Export as LaTeX Beamer Presentation (.tex)
  const handleExportBeamerPresentation = () => {
    if (!activeFile) return;
    const text = activeFile.content;
    const sections = [];
    const lines = text.split('\n');
    
    lines.forEach((line) => {
      const match = line.match(/\\section\*?\{((?:[^{}]+|\{[^{}]*\})*)\}/);
      if (match) {
        sections.push(match[1]);
      }
    });
    
    let beamerCode = `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{default}

\\title{${activeProject.name}}
\\author{${userName || 'الباحث'}}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{مخطط العرض}
  \\tableofcontents
\\end{frame}
`;

    sections.forEach((sec) => {
      beamerCode += `
\\section{${sec}}
\\begin{frame}{${sec}}
  \\begin{itemize}
    \\item اكتب المحتوى هنا الخاص بقسم ${sec}...
    \\item النقطة الثانية...
  \\end{itemize}
\\end{frame}
`;
    });

    beamerCode += `\n\\end{document}`;
    
    const blob = new Blob([beamerCode], { type: 'text/plain;charset=utf-8' });
    window.saveAs(blob, `${activeProject.name}_presentation.tex`);
    addLog({ type: 'success', message: 'تم تصدير العرض التقديمي Beamer بنجاح كملف كود LaTeX (.tex)' });
  };

  // Resize Split screen handlers
  const handleMouseDown = (e) => {
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e) => {
    if (!isResizingRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const clientX = e.clientX;
    const offsetLeft = containerRef.current.getBoundingClientRect().left;
    
    const mousePosInContainer = clientX - offsetLeft;
    let newPercent = (mousePosInContainer / containerWidth) * 100;
    newPercent = 100 - newPercent;

    if (newPercent > 10 && newPercent < 90) {
      setEditorWidthPercent(newPercent);
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  const handleSaveUsername = (e) => {
    e.preventDefault();
    if (userNameInput.trim()) {
      localStorage.setItem('waraqa_username', userNameInput.trim());
      setUserName(userNameInput.trim());
    }
  };

  const handleSidebarTabClick = (tab) => {
    if (activeSidebarTab === tab) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setActiveSidebarTab(tab);
      setSidebarOpen(true);
    }
  };

  const activeFile = activeProject?.files.find(f => f.path === activeFilePath);
  const activeSnapshots = projectSnapshots[activeProjectId] || [];

  return (
    <div className="workspace-container" style={{ direction: 'rtl' }}>
      
      {/* Hidden file input for Upload File */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".tex,.bib,.txt,.md"
      />

      {/* Hidden file input for Upload Image */}
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload}
        accept="image/*"
      />

      {/* 1. Modal: Username setup */}
      {!userName && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveUsername} className="modal-content animate-fade-in">
            <h3 className="modal-title">مرحباً بك في ورقة (Waraqa)</h3>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                الرجاء إدخال اسمك للبدء في كتابة وتعديل مستندات الـ LaTeX بشكل تعاوني.
              </p>
              <input
                type="text"
                className="input-text"
                placeholder="اسم المستخدم (مثال: أحمد)..."
                value={userNameInput}
                onChange={e => setUserNameInput(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-primary">حفظ ودخول</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal: Word Count */}
      {showWordCountModal && (
        <div className="modal-overlay" onClick={() => setShowWordCountModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} style={{ color: 'var(--accent-color)' }} /> عدد الكلمات في الملف النشط
            </h3>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الكلمات (بدءاً من النص النظيف)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{wordCountInfo.words}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>أوامر LaTeX المستخدمة</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{wordCountInfo.commands}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الحروف (مع الفراغات)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{wordCountInfo.chars}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الحروف (بدون فراغات)</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{wordCountInfo.charsNoSpaces}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              * يتم استبعاد تعليقات الـ LaTeX والرموز الرياضية والأوامر التقنية تلقائياً لتقديم إحصاء دقيق.
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowWordCountModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Version History */}
      {showVersionHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowVersionHistoryModal(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--accent-color)' }} /> سجل تاريخ الإصدارات والنسخ
            </h3>
            <div className="modal-body">
              {/* Snapshot Creator */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="اسم النسخة الحالية (مثال: قبل تعديل الخلاصة)..."
                  value={newSnapshotName}
                  onChange={e => setNewSnapshotName(e.target.value)}
                />
                <button className="btn-primary" onClick={handleSaveSnapshot} disabled={!newSnapshotName.trim()}>
                  حفظ نسخة
                </button>
              </div>

              {/* Snapshots Table */}
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>اسم النسخة</th>
                      <th>تاريخ وتوقيت الحفظ</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSnapshots.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textCenter: 'center', color: 'var(--text-muted)', padding: '15px' }}>
                          لا توجد أي نسخ محفوظة بعد لهذا المشروع.
                        </td>
                      </tr>
                    ) : (
                      activeSnapshots.map((snap) => (
                        <tr key={snap.id}>
                          <td style={{ fontWeight: '600' }}>{snap.name}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(snap.timestamp).toLocaleString('ar-EG')}
                          </td>
                          <td>
                            <button className="history-restore-btn" onClick={() => handleRestoreSnapshot(snap)}>
                              استعادة
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowVersionHistoryModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Submit Wizard */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} style={{ color: 'var(--success)' }} /> تقديم الورقة البحثية للمجلة العلمية
            </h3>
            
            {submitStep === 1 && (
              <form onSubmit={handleConfirmSubmit} className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  تأكد من مراجعة مستندك الرياضي والتدقيق اللغوي قبل التقديم النهائي.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>اختر المجلة المستهدفة</label>
                  <select 
                    className="input-text" 
                    value={submitJournal} 
                    onChange={e => setSubmitJournal(e.target.value)}
                    style={{ background: 'white' }}
                  >
                    <option value="IEEE Access">IEEE Access Journal</option>
                    <option value="Elsevier Astronomy">Elsevier Astronomy & Computing</option>
                    <option value="Springer LNCS">Springer Lecture Notes in Computer Science</option>
                    <option value="Waraqa Journal">Waraqa Open Journal of Mathematics</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', alignItems: 'center' }}>
                  <Info size={12} /> سيقوم النظام بتجميع المستند واختباره وتصدير النسخة المصدرية فورياً للمجلة.
                </div>
                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSubmitModal(false)}>إلغاء</button>
                  <button type="submit" className="btn-primary">بدء التقديم الرسمي</button>
                </div>
              </form>
            )}

            {submitStep === 2 && (
              <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <RotateCw className="compiler-spinner" size={36} style={{ color: 'var(--accent-color)', marginBottom: '12px' }} />
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>جاري معالجة طلب التقديم... {submitProgress}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{submitProgressMessage}</div>
                
                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${submitProgress}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s ease-out' }}></div>
                </div>
              </div>
            )}

            {submitStep === 3 && (
              <div className="modal-body" style={{ textAlign: 'center', gap: '10px' }}>
                <div style={{ display: 'inline-flex', alignSelf: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)', alignItems: 'center', justify: 'center', fontSize: '24px', fontWeight: 'bold' }}>✓</div>
                <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>تم تقديم الورقة البحثية بنجاح!</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  تم إرسال مستندات LaTeX والمراجع والصور بنجاح إلى هيئة تحرير مجلة <strong>{submitJournal}</strong>.
                </p>
                <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  رقم طلب التتبع: {submissionId}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  تم حفظ إيصال تقديم في سجل التطبيق. ستصلك تحديثات المراجعة عبر نظام الإشعارات.
                </p>
                <div className="modal-actions" style={{ marginTop: '6px' }}>
                  <button className="btn-primary" onClick={() => setShowSubmitModal(false)}>موافق</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Landing Page State */}
      {!activeProjectId ? (
        <div className="landing-container">
          <div className="landing-card animate-fade-in">
            <div className="logo-container">
              <div className="logo-icon">📝</div>
              <div className="logo-text">ورقة</div>
            </div>
            <p className="landing-subtitle">محرر LaTeX التعاوني الأكاديمي المتكامل</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {isOffline ? (
                <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> وضع العمل المحلي (Server Offline)
                </span>
              ) : (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> متصل بالخادم الرئيسي
                </span>
              )}
            </div>

            {/* New Project form */}
            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-group">
                <input
                  type="text"
                  name="projectName"
                  className="input-text"
                  placeholder="اسم المشروع الأكاديمي الجديد..."
                  required
                />
                <button type="submit" className="btn-primary">
                  <Plus size={18} /> إنشاء مشروع
                </button>
              </div>
            </form>

            {/* Projects list */}
            <div className="project-list-section">
              <h4 className="section-title">المشاريع المتاحة ({projects.length})</h4>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  لا يوجد مشاريع بعد. اكتب اسماً أعلاه لإنشاء أول مشروع لك!
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="project-card"
                      onClick={() => setActiveProjectId(proj.id)}
                    >
                      <div className="project-info">
                        <span className="project-name">{proj.name}</span>
                        <span className="project-meta">
                          {new Date(proj.createdAt).toLocaleDateString('ar-EG')} • {proj.fileCount || 1} ملفات
                        </span>
                      </div>
                      <ChevronLeft className="project-action-icon" size={18} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>مرحباً، {userName}</span>
              <button 
                onClick={() => { localStorage.removeItem('waraqa_username'); setUserName(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <LogOut size={12} /> تغيير الاسم
              </button>
            </div>
          </div>
        </div>
      ) : (
        
        // 6. Workspace layout
        <div className="workspace-container animate-fade-in">
          
          {/* Topbar Header */}
          <header className="app-header">
            <div className="header-left">
              <div className="header-logo-group">
                <div className="header-logo-icon">📝</div>
                <div className="header-logo-text">ورقة</div>
              </div>
              <div className="header-divider"></div>
              
              {/* Top menus with File drop-down menu */}
              <nav className="header-menus">
                
                {/* File tab container */}
                <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                  <button 
                    className="header-menu-btn" 
                    onClick={() => setFileMenuOpen(!fileMenuOpen)}
                    style={{ fontWeight: fileMenuOpen ? '700' : 'normal', background: fileMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
                  >
                    الملف
                  </button>
                  
                  {fileMenuOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleNewFileMenu(); }}>
                        <div className="dropdown-item-content">
                          <FileCode size={14} /> <span>ملف جديد (New file)</span>
                        </div>
                      </div>
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleNewFolderMenu(); }}>
                        <div className="dropdown-item-content">
                          <Folder size={14} /> <span>مجلد جديد (New folder)</span>
                        </div>
                      </div>
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleUploadClick(); }}>
                        <div className="dropdown-item-content">
                          <Upload size={14} /> <span>رفع ملف (Upload file)</span>
                        </div>
                      </div>
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleMakeCopy(); }}>
                        <div className="dropdown-item-content">
                          <Copy size={14} /> <span>إنشاء نسخة (Make a copy)</span>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); setShowVersionHistoryModal(true); }}>
                        <div className="dropdown-item-content">
                          <History size={14} /> <span>تاريخ الإصدارات (Version history)</span>
                        </div>
                      </div>
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleWordCountTrigger(); }}>
                        <div className="dropdown-item-content">
                          <Info size={14} /> <span>عدد الكلمات (Word count)</span>
                        </div>
                      </div>
                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleOpenSubmit(); }}>
                        <div className="dropdown-item-content">
                          <Send size={14} style={{ color: 'var(--success)' }} /> <span style={{ fontWeight: 'bold' }}>تقديم الورقة (Submit)</span>
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      {/* Download submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <Download size={14} /> <span>تنزيل وتصدير (Download)</span>
                        </div>
                        <ChevronLeft size={12} />
                        
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleDownloadZip(); }}>
                            <span>ملف مصدري مضغوط (.zip)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleDownloadPDF(); }}>
                            <span>مستند PDF جاهز للطبع (.pdf)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleExportWord(); }}>
                            <span>مستند وورد Word (.docx)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleExportMarkdown(); }}>
                            <span>ملف ماركداون (.md)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleExportHTML(); }}>
                            <span>صفحة ويب كاملة (.html)</span>
                          </div>
                          <div className="dropdown-divider"></div>
                          {/* Additional option */}
                          <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleExportBeamerPresentation(); }} style={{ fontWeight: '600', color: 'var(--accent-color)' }}>
                            <span>شرائح عرض Beamer (.tex)</span>
                          </div>
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={() => { setFileMenuOpen(false); handleSidebarTabClick('settings'); }}>
                        <div className="dropdown-item-content">
                          <Settings size={14} /> <span>إعدادات المشروع (Settings)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                  <button 
                    className="header-menu-btn" 
                    onClick={() => setEditMenuOpen(!editMenuOpen)}
                    style={{ fontWeight: editMenuOpen ? '700' : 'normal', background: editMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
                  >
                    تحرير
                  </button>
                  {editMenuOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleUndo(); }}>
                        <div className="dropdown-item-content">
                          <Undo2 size={14} /> <span>تراجع (Undo)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+Z</span>
                      </div>
                      
                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleRedo(); }}>
                        <div className="dropdown-item-content">
                          <Redo2 size={14} /> <span>إعادة (Redo)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+Y</span>
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleCut(); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>✂️</span> <span>قص (Cut)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+X</span>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleCopy(); }}>
                        <div className="dropdown-item-content">
                          <Copy size={14} /> <span>نسخ (Copy)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+C</span>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handlePaste(); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>📋</span> <span>لصق (Paste)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+V</span>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleSelectAll(); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>📑</span> <span>تحديد الكل (Select all)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+A</span>
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleFind(); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>🔍</span> <span>بحث واستبدال (Find)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+F</span>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleCommentLine(); }}>
                        <div className="dropdown-item-content">
                          <Hash size={14} /> <span>تعليق السطر (Toggle Comment)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Ctrl+/</span>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleFormatDocument(); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>✨</span> <span>تنسيق الكود (Format Code)</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>Shift+Alt+F</span>
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <PlusSquare size={14} /> <span>إدراج قالب LaTeX جاهز</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleInsertTemplate('article'); }}>
                            <span>ورقة بحثية قياسية (Article)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleInsertTemplate('report'); }}>
                            <span>تقرير تقني (Report)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleInsertTemplate('slides'); }}>
                            <span>عرض تقديم أكاديمي (Beamer)</span>
                          </div>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setEditMenuOpen(false); handleClearAll(); }} style={{ color: 'var(--error)' }}>
                        <div className="dropdown-item-content">
                          <Trash2 size={14} /> <span>مسح كامل النص (Clear Editor)</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
                <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                  <button 
                    className="header-menu-btn" 
                    onClick={() => setInsertMenuOpen(!insertMenuOpen)}
                    style={{ fontWeight: insertMenuOpen ? '700' : 'normal', background: insertMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
                  >
                    إدراج
                  </button>
                  {insertMenuOpen && (
                    <div className="dropdown-menu">
                      {/* Math Submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>∑</span> <span>معادلة رياضية (Math)</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('$', '$'); }}>
                            <span>معادلة سطرية (Inline math)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('$$', '$$'); }}>
                            <span>معادلة منفصلة (Display math)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\begin{equation}\n  ', '\n\\end{equation}'); }}>
                            <span>معادلة مرقمة (Numbered Equation)</span>
                          </div>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); setShowSymbolPalette(true); }}>
                        <div className="dropdown-item-content">
                          <span style={{ fontSize: '14px', marginRight: '2px' }}>Ω</span> <span>رمز خاص (Symbol)</span>
                        </div>
                      </div>

                      {/* Figure Submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <Image size={14} /> <span>شكل توضيحي (Figure)</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); handleImageUploadClick(); }}>
                            <span>رفع من الكمبيوتر (Upload from computer)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); handleInsertFromProjectFiles(); }}>
                            <span>من ملفات المشروع (From project files)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); handleInsertFromAnotherProject(); }}>
                            <span>من مشروع آخر (From another project)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); handleInsertFromUrl(); }}>
                            <span>من رابط خارجي (From URL)</span>
                          </div>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\begin{table}[htbp]\n  \\centering\n  \\begin{tabular}{ccc}\n    \\hline\n    العمود 1 & العمود 2 & العمود 3 \\\\\n    \\hline\n    بيان 1 & بيان 2 & بيان 3 \\\\\n    بيان 4 & بيان 5 & بيان 6 \\\\\n    \\hline\n  \\end{tabular}\n  \\caption{العنوان التوضيحي للجدول}\n  \\label{tab:my_table}\n\\end{table}'); }}>
                        <div className="dropdown-item-content">
                          <Table size={14} /> <span>جدول (Table)</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\cite{', '}'); }}>
                        <div className="dropdown-item-content">
                          <Quote size={14} /> <span>اقتباس مرجعي (Citation)</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\href{URL}{', '}'); }}>
                        <div className="dropdown-item-content">
                          <Link size={14} /> <span>رابط تشعبي (Link)</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\ref{', '}'); }}>
                        <div className="dropdown-item-content">
                          <Bookmark size={14} /> <span>إشارة مرجعية (Cross reference)</span>
                        </div>
                      </div>

                      <div className="dropdown-item" onClick={() => { setInsertMenuOpen(false); insertLatexCommand('\\title{', '}'); }}>
                        <div className="dropdown-item-content">
                          <Heading size={14} /> <span>عنوان مستند (Title)</span>
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      {/* AI Options Section - Marked with badge or styled as " قريباً " */}
                      <div style={{ padding: '6px 14px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        ميزات الذكاء الاصطناعي
                      </div>

                      <div className="dropdown-item" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="ميزة الذكاء الاصطناعي - قريباً">
                        <div className="dropdown-item-content">
                          <Sparkles size={14} style={{ color: 'var(--accent-color)' }} /> <span style={{ color: 'var(--text-muted)' }}>تعليق ذكي (Comment)</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>قريباً</span>
                      </div>

                      <div className="dropdown-item" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="ميزة الذكاء الاصطناعي - قريباً">
                        <div className="dropdown-item-content">
                          <Sparkles size={14} style={{ color: 'var(--accent-color)' }} /> <span style={{ color: 'var(--text-muted)' }}>ملخص ذكي (Abstract)</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>قريباً</span>
                      </div>

                      <div className="dropdown-item" style={{ opacity: 0.6, cursor: 'not-allowed' }} title="ميزة الذكاء الاصطناعي - قريباً">
                        <div className="dropdown-item-content">
                          <Sparkles size={14} style={{ color: 'var(--accent-color)' }} /> <span style={{ color: 'var(--text-muted)' }}>كلمات مفتاحية (Keywords)</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>قريباً</span>
                      </div>

                    </div>
                  )}
                </div>
                <div className="dropdown-container" onClick={e => e.stopPropagation()}>
                  <button 
                    className="header-menu-btn" 
                    onClick={() => setViewMenuOpen(!viewMenuOpen)}
                    style={{ fontWeight: viewMenuOpen ? '700' : 'normal', background: viewMenuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
                  >
                    عرض
                  </button>
                  {viewMenuOpen && (
                    <div className="dropdown-menu">
                      
                      {/* Layout Options Submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <Layout size={14} /> <span>خيارات التخطيط (Layout options)</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setViewMenuOpen(false); setEditorWidthPercent(50); }}>
                            <span style={{ fontWeight: editorWidthPercent === 50 ? 'bold' : 'normal' }}>✓ عرض منقسم (Split view)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setViewMenuOpen(false); setEditorWidthPercent(100); }}>
                            <span style={{ fontWeight: editorWidthPercent === 100 ? 'bold' : 'normal' }}>✓ المحرر فقط (Editor only)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setViewMenuOpen(false); setEditorWidthPercent(0); }}>
                            <span style={{ fontWeight: editorWidthPercent === 0 ? 'bold' : 'normal' }}>✓ الـ PDF فقط (PDF only)</span>
                          </div>
                          <div className="dropdown-divider"></div>
                          <div className="dropdown-item" onClick={() => { setViewMenuOpen(false); handleOpenPdfSeparateTab(); }}>
                            <span>فتح الـ PDF في تبويب منفصل</span>
                          </div>
                        </div>
                      </div>

                      {/* Editor Settings Submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <Settings size={14} /> <span>إعدادات المحرر (Editor settings)</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setShowBreadcrumbs(!showBreadcrumbs); }}>
                            <span>{showBreadcrumbs ? '✓' : '☐'} إظهار شريط التنقل (Show breadcrumbs)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setShowEquationPreview(!showEquationPreview); }}>
                            <span>{showEquationPreview ? '✓' : '☐'} معاينة المعادلات (Show equation preview)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setEditorWordWrap(editorWordWrap === 'on' ? 'off' : 'on'); }}>
                            <span>{editorWordWrap === 'on' ? '✓' : '☐'} التفاف الأسطر (Word Wrap)</span>
                          </div>
                          <div className="dropdown-divider"></div>
                          {/* Font Size Submenu */}
                          <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                            <span>حجم الخط ({editorFontSize}px)</span>
                            <ChevronLeft size={10} />
                            <div className="dropdown-submenu">
                              {[12, 14, 16, 18].map(size => (
                                <div key={size} className="dropdown-item" onClick={() => { setEditorFontSize(size); setViewMenuOpen(false); }}>
                                  <span style={{ fontWeight: editorFontSize === size ? 'bold' : 'normal' }}>{size}px {editorFontSize === size ? '✓' : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Editor Theme Submenu */}
                          <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                            <span>مظهر المحرر</span>
                            <ChevronLeft size={10} />
                            <div className="dropdown-submenu">
                              <div className="dropdown-item" onClick={() => { setEditorTheme('vs'); setViewMenuOpen(false); }}>
                                <span style={{ fontWeight: editorTheme === 'vs' ? 'bold' : 'normal' }}>مظهر فاتح (Light) {editorTheme === 'vs' ? '✓' : ''}</span>
                              </div>
                              <div className="dropdown-item" onClick={() => { setEditorTheme('vs-dark'); setViewMenuOpen(false); }}>
                                <span style={{ fontWeight: editorTheme === 'vs-dark' ? 'bold' : 'normal' }}>مظهر داكن (Dark) {editorTheme === 'vs-dark' ? '✓' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PDF Preview Submenu */}
                      <div className="dropdown-item has-submenu" onClick={e => e.stopPropagation()}>
                        <div className="dropdown-item-content">
                          <Eye size={14} /> <span>معاينة الـ PDF (PDF preview)</span>
                        </div>
                        <ChevronLeft size={12} />
                        <div className="dropdown-submenu">
                          <div className="dropdown-item" onClick={() => { setPresentationMode(true); setViewMenuOpen(false); }}>
                            <span>وضع العرض التقديمي (Presentation mode)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setZoomScale(Math.min(200, zoomScale + 10)); }}>
                            <span>تكبير (Zoom in)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setZoomScale(Math.max(50, zoomScale - 10)); }}>
                            <span>تصغير (Zoom out)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setZoomScale(100); setViewMenuOpen(false); }}>
                            <span>ملاءمة العرض (Fit to width)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setZoomScale(75); setViewMenuOpen(false); }}>
                            <span>ملاءمة الارتفاع (Fit to height)</span>
                          </div>
                          <div className="dropdown-divider"></div>
                          <div className="dropdown-item" onClick={() => { setAutoCompile(!autoCompile); }}>
                            <span>{autoCompile ? '✓' : '☐'} تحديث تلقائي للمعاينة (Auto-compile)</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
                <button className="header-menu-btn">أدوات</button>
                <button className="header-menu-btn">مساعدة</button>
              </nav>
            </div>

            <div className="header-center">
              <div className="project-name-badge">
                <BookOpen size={14} style={{ color: 'var(--accent-color)' }} />
                <span>{activeProject?.name || 'تحميل...'}</span>
                {isOffline && <span style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>(محلي)</span>}
              </div>
            </div>

            <div className="header-right">
              {/* Active Collaborators */}
              {!isOffline && collaborators.length > 0 && (
                <div className="active-users-badge">
                  {collaborators.map((user, idx) => (
                    <div
                      key={user.socketId}
                      className="user-avatar-circle"
                      style={{
                        backgroundColor: `hsl(${(idx * 137) % 360}, 65%, 45%)`,
                        zIndex: 10 - idx
                      }}
                      title={`${user.userName} (تعديل: ${user.activeFile})`}
                    >
                      {user.userName.substring(0, 2)}
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-share">
                <Share2 size={14} /> مشاركة
              </button>

              <button className="back-btn" onClick={() => { setActiveProjectId(null); setActiveProject(null); fetchProjects(); }}>
                <ChevronRight size={14} /> المشاريع
              </button>
            </div>
          </header>

          {/* Main Layout Area */}
          <div className="main-layout" ref={containerRef}>
            
            {/* Far-Right Navigation Strip */}
            <div className="nav-strip">
              <div 
                className={`nav-strip-item ${sidebarOpen && activeSidebarTab === 'files' ? 'active' : ''}`}
                onClick={() => handleSidebarTabClick('files')}
                title="الملفات ومجلدات المشروع"
              >
                <FolderOpen size={20} />
              </div>
              
              <div 
                className={`nav-strip-item ${sidebarOpen && activeSidebarTab === 'outline' ? 'active' : ''}`}
                onClick={() => handleSidebarTabClick('outline')}
                title="مخطط مستند LaTeX"
              >
                <List size={20} />
              </div>
              
              <div 
                className={`nav-strip-item ${sidebarOpen && activeSidebarTab === 'users' ? 'active' : ''}`}
                onClick={() => handleSidebarTabClick('users')}
                title="المستخدمين النشطين"
              >
                <Users size={20} />
              </div>

              <div 
                className={`nav-strip-item ${sidebarOpen && activeSidebarTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleSidebarTabClick('settings')}
                title="إعدادات المشروع"
              >
                <Settings size={20} />
              </div>
            </div>

            {/* Sidebar Folder Explorer (Collapsible) */}
            <aside 
              className="sidebar"
              style={{ 
                width: sidebarOpen ? '240px' : '0px',
                minWidth: sidebarOpen ? '180px' : '0px'
              }}
            >
              {sidebarOpen && (
                <>
                  {/* Tab Content 1: File Manager */}
                  {activeSidebarTab === 'files' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="sidebar-header">
                        <span className="sidebar-title">ملفات المشروع</span>
                        <div className="sidebar-actions">
                          <button className="icon-btn" onClick={() => setIsCreatingFile(!isCreatingFile)} title="ملف جديد">
                            <FolderPlus size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="sidebar-content">
                        {isCreatingFile && (
                          <form onSubmit={handleCreateFile} style={{ padding: '4px 8px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="input-text"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              placeholder="اسم الملف (مثال: bib.bib)..."
                              value={newFileName}
                              onChange={e => setNewFileName(e.target.value)}
                              required
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
                              <button type="submit" className="btn-primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>إضافة</button>
                              <button type="button" className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setIsCreatingFile(false)}>إلغاء</button>
                            </div>
                          </form>
                        )}

                        {activeProject?.files.map((file) => (
                          <div
                            key={file.path}
                            className={`file-tree-node ${activeFilePath === file.path ? 'active' : ''}`}
                            onClick={() => setActiveFilePath(file.path)}
                          >
                            <div className="file-node-left">
                              <FileText size={15} style={{ color: activeFilePath === file.path ? 'white' : '#94a3b8' }} />
                              <span>{file.path}</span>
                            </div>
                            {file.path !== 'main.tex' && (
                              <div className="file-node-actions" onClick={e => e.stopPropagation()}>
                                <button className="icon-btn" onClick={() => handleDeleteFile(file.path)} title="حذف" style={{ color: 'var(--error)' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Content 2: Outline */}
                  {activeSidebarTab === 'outline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="sidebar-header">
                        <span className="sidebar-title">مخطط المستند (TOC)</span>
                      </div>
                      <div className="sidebar-content" style={{ padding: '6px' }}>
                        {documentOutline.length === 0 ? (
                          <div style={{ color: '#64748b', fontSize: '0.8rem', padding: '10px', textAlign: 'center' }}>
                            لا توجد أقسام \\section حالية في هذا المستند.
                          </div>
                        ) : (
                          documentOutline.map((item, index) => (
                            <div
                              key={index}
                              className={`outline-node ${item.type}`}
                              onClick={() => jumpToLine(item.line)}
                            >
                              {item.title}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Content 3: Active users list */}
                  {activeSidebarTab === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="sidebar-header">
                        <span className="sidebar-title">حالة الاتصال</span>
                      </div>
                      <div className="sidebar-content" style={{ padding: '10px' }}>
                        <div className="user-item-row">
                          <span className="user-dot" style={{ backgroundColor: 'var(--success)' }}></span>
                          <span style={{ color: 'white', fontSize: '0.85rem' }}>{userName} (أنت)</span>
                        </div>
                        {!isOffline && collaborators.map((c) => (
                          <div className="user-item-row" key={c.socketId} style={{ marginTop: '8px' }}>
                            <span className="user-dot" style={{ backgroundColor: '#a855f7' }}></span>
                            <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                              {c.userName}
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                يتصفح: {c.activeFile}
                              </div>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Content 4: Settings */}
                  {activeSidebarTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="sidebar-header">
                        <span className="sidebar-title">إعدادات المشروع</span>
                      </div>
                      <div className="sidebar-content" style={{ padding: '14px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', color: '#94a3b8' }}>اسم المستخدم</label>
                          <input 
                            type="text" 
                            className="input-text" 
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '100%', fontSize: '0.8rem' }}
                            value={userName} 
                            onChange={(e) => {
                              setUserName(e.target.value);
                              localStorage.setItem('waraqa_username', e.target.value);
                            }}
                          />
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>إصدار المحرك: Simulator v1.0</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </aside>
 
            {/* Symbol Palette Panel (Collapsible Drawer) */}
            <aside 
              className="symbol-palette-sidebar"
              style={{ 
                width: showSymbolPalette ? '280px' : '0px',
                minWidth: showSymbolPalette ? '240px' : '0px',
                borderLeft: showSymbolPalette ? '1px solid var(--border-color)' : 'none',
                display: showSymbolPalette ? 'flex' : 'none',
                flexDirection: 'column',
                background: 'var(--bg-secondary)',
                zIndex: 6
              }}
            >
              <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="sidebar-title" style={{ fontWeight: '700', fontSize: '0.85rem' }}>إدراج الرموز الرياضية</span>
                <button 
                  onClick={() => setShowSymbolPalette(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  title="إغلاق"
                >
                  <XCircle size={16} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="symbol-tabs" style={{ display: 'flex', gap: '2px', padding: '6px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', background: 'var(--bg-tertiary)', direction: 'rtl' }}>
                {Object.keys(LATEX_SYMBOLS).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSymbolTab(tab)}
                    style={{
                      background: activeSymbolTab === tab ? 'var(--bg-secondary)' : 'transparent',
                      border: 'none',
                      color: activeSymbolTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: activeSymbolTab === tab ? 'bold' : 'normal',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab === 'Greek' ? 'اليونانية' :
                     tab === 'Arrows' ? 'الأسهم' :
                     tab === 'Operators' ? 'العوامل' :
                     tab === 'Relations' ? 'العلاقات' : 'متفرقات'}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ padding: '8px' }}>
                <input
                  type="text"
                  placeholder="ابحث عن رمز (مثال: alpha)..."
                  className="input-text"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                  value={symbolSearchQuery}
                  onChange={e => setSymbolSearchQuery(e.target.value)}
                />
              </div>

              {/* Grid Content */}
              <div className="symbol-grid-container" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(() => {
                    const symbols = LATEX_SYMBOLS[activeSymbolTab] || [];
                    const filtered = symbols.filter(s => 
                      s.cmd.toLowerCase().includes(symbolSearchQuery.toLowerCase()) ||
                      s.char.includes(symbolSearchQuery)
                    );
                    
                    if (filtered.length === 0) {
                      return (
                        <div style={{ gridColumn: 'span 4', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '20px 0' }}>
                          لم يتم العثور على رموز
                        </div>
                      );
                    }

                    return filtered.map((sym, idx) => (
                      <button
                        key={idx}
                        className="symbol-grid-btn"
                        onClick={() => insertLatexCommand(sym.cmd)}
                        title={sym.cmd}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 4px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '1.25rem', marginBottom: '4px', fontFamily: '"Times New Roman", Cambria, serif' }}>{sym.char}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', whiteSpace: 'nowrap', direction: 'ltr' }}>{sym.cmd}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </aside>

            {/* Split Panel - Editor */}
            <div className="editor-panel" style={{ width: `${editorWidthPercent}%` }}>
              
              <div className="editor-header-tabs">
                <div className="editor-tab active">
                  <FileText size={13} />
                  <span>{activeFilePath}</span>
                </div>
              </div>

              {showBreadcrumbs && (
                <div className="editor-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>المشروع</span>
                  <span>/</span>
                  <span>{activeProject?.name}</span>
                  <span>/</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{activeFilePath}</span>
                </div>
              )}

              {/* Overleaf-Style Academic Multi-level Toolbar */}
              <div className="editor-toolbars-container" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                
                {/* FIRST ROW */}
                <div className="editor-toolbar-row" style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', borderBottom: '1px solid var(--border-color)', gap: '8px' }}>
                  
                  {/* Left Side: Basic Editor Operations */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button className="toolbar-btn" onClick={handleUndo} title="تراجع (Ctrl+Z)">
                      <Undo2 size={14} />
                    </button>
                    <button className="toolbar-btn" onClick={handleRedo} title="إعادة (Ctrl+Y)">
                      <Redo2 size={14} />
                    </button>
                    
                    <div className="toolbar-divider"></div>

                    {/* TT Dropdown */}
                    <div className="dropdown-container" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button className="toolbar-btn" onClick={() => setTtDropdownOpen(!ttDropdownOpen)} title="إدراج عناوين وهيكل مستند (Headers)">
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>TT ▾</span>
                      </button>
                      {ttDropdownOpen && (
                        <div className="dropdown-menu" style={{ width: '180px', position: 'absolute', top: '100%', right: 0, zIndex: 110 }}>
                          <div className="dropdown-item" onClick={() => { setTtDropdownOpen(false); insertLatexCommand('\\section{', '}'); }}>
                            <span>قسم رئيسي (\section)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setTtDropdownOpen(false); insertLatexCommand('\\subsection{', '}'); }}>
                            <span>قسم فرعي (\subsection)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setTtDropdownOpen(false); insertLatexCommand('\\subsubsection{', '}'); }}>
                            <span>قسم فرعي (\subsubsection)</span>
                          </div>
                          <div className="dropdown-item" onClick={() => { setTtDropdownOpen(false); insertLatexCommand('\\paragraph{', '}'); }}>
                            <span>فقرة (\paragraph)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="toolbar-btn toolbar-btn-bold" onClick={() => insertLatexCommand('\\textbf{', '}')} title="خط عريض (Ctrl+B)">
                      <Bold size={14} />
                    </button>
                    <button className="toolbar-btn toolbar-btn-italic" onClick={() => insertLatexCommand('\\textit{', '}')} title="خط مائل (Ctrl+I)">
                      <Italic size={14} />
                    </button>
                    <button className="toolbar-btn" onClick={() => insertLatexCommand('\\texttt{', '}')} title="شفرة برمجية / خط ثابت (\texttt)">
                      <FileCode size={14} />
                    </button>

                    <button className="toolbar-btn" onClick={() => setShowSymbolPalette(!showSymbolPalette)} title="لوحة الرموز الرياضية الكاملة (Ω)">
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>Ω</span>
                    </button>

                    <button className="toolbar-btn" onClick={() => {}} title="خيارات إضافية">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Right Side: Code / Visual Switch & Search */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Switch: Code / Visual */}
                    <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                      <button 
                        onClick={() => setEditorMode('code')}
                        style={{ 
                          border: 'none', 
                          background: editorMode === 'code' ? '#16a34a' : 'transparent', 
                          color: editorMode === 'code' ? 'white' : 'var(--text-secondary)',
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          padding: '3px 10px', 
                          borderRadius: '16px', 
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        Code
                      </button>
                      <button 
                        onClick={() => {
                          setEditorMode('code'); // keep in code but log
                          addLog({ type: 'info', message: 'المحرر المرئي (Visual Editor) متوفر في خطة التطوير القادمة.' });
                        }}
                        style={{ 
                          border: 'none', 
                          background: editorMode === 'visual' ? '#16a34a' : 'transparent', 
                          color: editorMode === 'visual' ? 'white' : 'var(--text-secondary)',
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          padding: '3px 10px', 
                          borderRadius: '16px', 
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        Visual
                      </button>
                    </div>

                    <button className="toolbar-btn" onClick={handleTriggerSearch} title="البحث والاستبدال (Ctrl+F)">
                      <Search size={14} />
                    </button>
                  </div>

                </div>

                {/* SECOND ROW */}
                <div className="editor-toolbar-row" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', background: 'var(--bg-secondary)', gap: '8px' }}>
                  
                  {/* Left Side: Control Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button className="toolbar-btn" onClick={handleClearAll} style={{ color: 'var(--error)' }} title="مسح محتويات المحرر بالكامل">
                      <Ban size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={handleToggleComment} title="تعليق السطر المحدد (Ctrl+/)">
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>%</span>
                    </button>
                    <button className="toolbar-btn" onClick={handleCompile} style={{ color: 'var(--success)' }} title="تحديث التجميع الفوري">
                      <Check size={13} />
                    </button>
                    
                    <div className="toolbar-divider"></div>

                    <button className="toolbar-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "إغلاق لوحة الملفات" : "فتح لوحة الملفات"}>
                      <ChevronLeft size={14} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)' }} />
                    </button>

                    <div className="toolbar-divider"></div>

                    {/* AI & Features Icons */}
                    <button className="toolbar-btn" style={{ opacity: 0.6 }} title="الذكاء الاصطناعي - تعليق ذكي (قريباً)">
                      <Bot size={13} style={{ color: 'var(--accent-color)' }} />
                    </button>
                    <button className="toolbar-btn" style={{ opacity: 0.6 }} title="الذكاء الاصطناعي - كتابة وتكملة (قريباً)">
                      <Wand2 size={13} style={{ color: 'var(--accent-color)' }} />
                    </button>
                    <button className="toolbar-btn" style={{ opacity: 0.6 }} title="الذكاء الاصطناعي - تلخيص البحث (قريباً)">
                      <FileText size={13} style={{ color: 'var(--accent-color)' }} />
                    </button>

                    <div className="toolbar-divider"></div>

                    <button className="toolbar-btn" onClick={() => setShowVersionHistoryModal(true)} title="تاريخ النسخ والمستند">
                      <History size={13} />
                    </button>

                    <button className="toolbar-btn" onClick={handleOutdent} title="تقليل الهامش (Outdent)">
                      <ChevronRight size={14} />
                    </button>
                    <button className="toolbar-btn" onClick={handleIndent} title="زيادة الهامش (Indent)">
                      <ChevronLeft size={14} />
                    </button>

                    <button className="toolbar-btn" style={{ opacity: 0.6 }} title="الذكاء الاصطناعي - إعادة صياغة وترجمة (قريباً)">
                      <Languages size={13} style={{ color: 'var(--accent-color)' }} />
                    </button>

                    <div className="toolbar-divider"></div>

                    <button className="toolbar-btn" onClick={() => setZoomScale(Math.max(50, zoomScale - 10))} title="تصغير المعاينة">
                      <ZoomOut size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => setZoomScale(Math.min(200, zoomScale + 10))} title="تكبير المعاينة">
                      <ZoomIn size={13} />
                    </button>
                  </div>

                  {/* Right Side: Additional options */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button className="toolbar-btn" onClick={handleMakeCopy} title="عمل نسخة من المشروع">
                      <Copy size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => handleDownloadOption('source')} title="تحميل كأرشيف ZIP">
                      <Download size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={handleCompile} title="مزامنة التجميع">
                      <RefreshCw size={13} />
                    </button>
                    <button className="toolbar-btn" onClick={() => setViewMenuOpen(true)} title="إعدادات المحرر السريعة">
                      <Settings size={13} />
                    </button>
                  </div>

                </div>

              </div>
              
              <div
                className="monaco-container"
                ref={monacoContainerRef}
                style={{
                  height: showBreadcrumbs
                    ? 'calc(100vh - 369px)'
                    : 'calc(100vh - 336px)',
                  overflow: 'hidden',
                  direction: 'ltr',
                  flexShrink: 0
                }}
              >
                {activeFile && (
                  <Editor
                    height="100%"
                    language={activeFilePath.endsWith('.bib') ? 'plaintext' : 'latex'}
                    theme="latex-light"
                    value={activeFile.content}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: editorFontSize,
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      tabSize: 4,
                      cursorBlinking: 'smooth',
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      rtlLayout: false,
                      wordWrap: editorWordWrap,
                      renderControlCharacters: false,
                      unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
                      scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8
                      }
                    }}
                  />
                )}
              </div>

              {showEquationPreview && activeMathText && (
                <div className="equation-preview-panel" style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', direction: 'ltr' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold', direction: 'rtl' }}>معاينة المعادلة الفورية (Real-time Math Preview):</div>
                  <div style={{ padding: '8px', background: 'white', borderRadius: '4px', overflowX: 'auto', display: 'flex', justifyContent: 'center', minHeight: '30px', color: 'black', direction: 'ltr' }}>
                    {renderMathPreview(activeMathText)}
                  </div>
                </div>
              )}
            </div>

            {/* Split Resizer */}
            <div
              className="resizer-bar"
              onMouseDown={handleMouseDown}
              title="اسحب لتغيير الحجم"
            />

            {/* Preview Panel */}
            <div className="preview-panel" style={{ width: `${100 - editorWidthPercent}%` }}>
              {isCompiling && (
                <div className="compile-progress-overlay">
                  <div className="compile-progress-card">
                    <RotateCw className="compiler-spinner" size={24} style={{ color: 'var(--accent-color)' }} />
                    <div className="compile-progress-text">جاري تجميع المستند... {compileProgress}%</div>
                    <div className="compile-progress-bar-container">
                      <div className="compile-progress-bar-fill" style={{ width: `${compileProgress}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="preview-header">
                <span className="preview-title">
                  <Layout size={14} />
                  <span>معاينة PDF الفورية</span>
                </span>

                <div className="preview-actions">
                  {/* Compilation Status badge */}
                  {compilationStatus !== 'idle' && (
                    <div className={`compile-badge-status ${compilationStatus}`}>
                      {compilationStatus === 'success' && (
                        <><CheckCircle size={14} /> <span>ناجح</span></>
                      )}
                      {compilationStatus === 'warning' && (
                        <><AlertTriangle size={14} /> <span>تحذير</span></>
                      )}
                      {compilationStatus === 'error' && (
                        <><XCircle size={14} /> <span>فشل</span></>
                      )}
                    </div>
                  )}

                  {/* Zoom Controls */}
                  <div className="zoom-group">
                    <button className="zoom-btn" onClick={() => setZoomScale(Math.max(50, zoomScale - 10))} title="تصغير">
                      <ZoomOut size={13} />
                    </button>
                    <span className="zoom-text">{zoomScale}%</span>
                    <button className="zoom-btn" onClick={() => setZoomScale(Math.min(150, zoomScale + 10))} title="تكبير">
                      <ZoomIn size={13} />
                    </button>
                  </div>

                  {/* Compile Button with Dropdown Settings */}
                  <div className="dropdown-container" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '1px', alignItems: 'center', position: 'relative' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '3px 10px', fontSize: '0.8rem', minHeight: '26px', borderTopLeftRadius: '0', borderBottomLeftRadius: '0', borderTopRightRadius: 'var(--radius-sm)', borderBottomRightRadius: 'var(--radius-sm)' }}
                      onClick={() => handleCompile()}
                      disabled={isCompiling}
                    >
                      {isCompiling ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RotateCw size={12} className="compiler-spinner" />
                          <span>{compileProgress}%</span>
                        </span>
                      ) : (
                        <span>تحديث التجميع</span>
                      )}
                    </button>
                    <button
                      className="btn-primary"
                      style={{ padding: '3px 6px', fontSize: '0.8rem', minHeight: '26px', borderTopRightRadius: '0', borderBottomRightRadius: '0', borderTopLeftRadius: 'var(--radius-sm)', borderBottomLeftRadius: 'var(--radius-sm)', borderRight: '1px solid rgba(255,255,255,0.2)' }}
                      onClick={() => setShowCompileSettings(!showCompileSettings)}
                      title="خيارات التجميع"
                    >
                      <Settings size={12} />
                    </button>

                    {showCompileSettings && (
                      <div className="dropdown-menu animate-fade-in" style={{ display: 'flex', position: 'absolute', top: 'calc(100% + 5px)', left: '0', right: 'auto', width: '280px', padding: '12px', flexDirection: 'column', gap: '8px', zIndex: 1000, boxShadow: 'var(--shadow-lg)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        {/* Auto compile option */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>تحديث تلقائي للمعاينة (Auto compile)</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: autoCompile ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: autoCompile ? 'var(--accent-glow)' : 'transparent', color: autoCompile ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: autoCompile ? '600' : 'normal' }}
                              onClick={() => setAutoCompile(true)}
                            >
                              تشغيل (On)
                            </button>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: !autoCompile ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: !autoCompile ? 'var(--accent-glow)' : 'transparent', color: !autoCompile ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: !autoCompile ? '600' : 'normal' }}
                              onClick={() => setAutoCompile(false)}
                            >
                              إيقاف (Off)
                            </button>
                          </div>
                        </div>

                        <div className="dropdown-divider" style={{ margin: '4px 0' }}></div>

                        {/* Compile mode option */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>وضع التجميع (Compile mode)</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: compileMode === 'normal' ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: compileMode === 'normal' ? 'var(--accent-glow)' : 'transparent', color: compileMode === 'normal' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: compileMode === 'normal' ? '600' : 'normal' }}
                              onClick={() => setCompileMode('normal')}
                            >
                              عادي (Normal)
                            </button>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: compileMode === 'fast' ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: compileMode === 'fast' ? 'var(--accent-glow)' : 'transparent', color: compileMode === 'fast' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: compileMode === 'fast' ? '600' : 'normal' }}
                              onClick={() => setCompileMode('fast')}
                            >
                              سريع [مسودة] (Fast)
                            </button>
                          </div>
                        </div>

                        <div className="dropdown-divider" style={{ margin: '4px 0' }}></div>

                        {/* Syntax checks option */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>فحص الصيغة النحوية (Syntax checks)</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: syntaxChecks ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: syntaxChecks ? 'var(--accent-glow)' : 'transparent', color: syntaxChecks ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: syntaxChecks ? '600' : 'normal' }}
                              onClick={() => setSyntaxChecks(true)}
                            >
                              فحص قبل التجميع
                            </button>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: !syntaxChecks ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: !syntaxChecks ? 'var(--accent-glow)' : 'transparent', color: !syntaxChecks ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: !syntaxChecks ? '600' : 'normal' }}
                              onClick={() => setSyntaxChecks(false)}
                            >
                              بدون فحص
                            </button>
                          </div>
                        </div>

                        <div className="dropdown-divider" style={{ margin: '4px 0' }}></div>

                        {/* Compile error handling option */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>معالجة أخطاء التجميع (Error handling)</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: errorHandling === 'stop' ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: errorHandling === 'stop' ? 'var(--accent-glow)' : 'transparent', color: errorHandling === 'stop' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: errorHandling === 'stop' ? '600' : 'normal' }}
                              onClick={() => setErrorHandling('stop')}
                            >
                              إيقاف عند أول خطأ
                            </button>
                            <button 
                              className="back-btn"
                              style={{ flex: 1, padding: '4px', fontSize: '0.75rem', justifyContent: 'center', border: errorHandling === 'ignore' ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: errorHandling === 'ignore' ? 'var(--accent-glow)' : 'transparent', color: errorHandling === 'ignore' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: errorHandling === 'ignore' ? '600' : 'normal' }}
                              onClick={() => setErrorHandling('ignore')}
                            >
                              تجميع رغم الأخطاء
                            </button>
                          </div>
                        </div>

                        <div className="dropdown-divider" style={{ margin: '4px 0' }}></div>

                        {/* Recompile Button */}
                        <button
                          className="back-btn"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: 'var(--radius-sm)', borderColor: 'var(--error)', color: 'var(--error)', backgroundColor: 'rgba(220, 38, 38, 0.05)' }}
                          onClick={() => {
                            setShowCompileSettings(false);
                            handleCompile({ recompile: true });
                          }}
                          disabled={isCompiling}
                        >
                          <RotateCw size={12} />
                          <span>إعادة التجميع من الصفر (Recompile)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Preview Box */}
              <div className="preview-content-area" id="preview-box" style={{ direction: 'ltr' }}>
                {compiledHtml ? (
                  <div 
                    style={{ 
                      transform: `scale(${zoomScale / 100})`, 
                      transformOrigin: 'top center',
                      width: '100%',
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    {compiledHtml.startsWith('<iframe') ? (
                      <div style={{ width: '100%', height: '800px' }} dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                    ) : (
                      <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: compiledHtml }} />
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '10px' }}>
                    <BookOpen size={40} style={{ strokeWidth: 1.5 }} />
                    <span style={{ fontSize: '0.85rem' }}>جاري تجميع الورقة العلمية وتصيير المعاينة...</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Console / Terminal logs */}
          <div className="console-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Unified Console Header with Tabs */}
            <div className="console-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', height: '36px', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)', direction: 'rtl', flexShrink: 0 }}>
              {/* Right side: Tabs */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
                <button 
                  onClick={() => setLogFilter('all')}
                  style={{ 
                    background: 'none', border: 'none', color: logFilter === 'all' ? 'var(--accent-color)' : 'var(--text-secondary)', 
                    fontWeight: logFilter === 'all' ? 'bold' : 'normal', borderBottom: logFilter === 'all' ? '2px solid var(--accent-color)' : '2px solid transparent', 
                    height: '100%', padding: '0 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, transition: 'all 0.15s'
                  }}
                >
                  <span style={{ direction: 'ltr' }}>All logs</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{consoleLogs.length}</span>
                </button>
                <button 
                  onClick={() => setLogFilter('error')}
                  style={{ 
                    background: 'none', border: 'none', color: logFilter === 'error' ? 'var(--error)' : 'var(--text-secondary)', 
                    fontWeight: logFilter === 'error' ? 'bold' : 'normal', borderBottom: logFilter === 'error' ? '2px solid var(--error)' : '2px solid transparent', 
                    height: '100%', padding: '0 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, transition: 'all 0.15s'
                  }}
                >
                  <span style={{ direction: 'ltr' }}>Errors</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: logFilter === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 0, 0, 0.06)', color: logFilter === 'error' ? 'var(--error)' : 'var(--text-secondary)', fontWeight: 'bold' }}>{consoleLogs.filter(l => l.type === 'error').length}</span>
                </button>
                <button 
                  onClick={() => setLogFilter('warning')}
                  style={{ 
                    background: 'none', border: 'none', color: logFilter === 'warning' ? 'var(--warning)' : 'var(--text-secondary)', 
                    fontWeight: logFilter === 'warning' ? 'bold' : 'normal', borderBottom: logFilter === 'warning' ? '2px solid var(--warning)' : '2px solid transparent', 
                    height: '100%', padding: '0 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, transition: 'all 0.15s'
                  }}
                >
                  <span style={{ direction: 'ltr' }}>Warnings</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: logFilter === 'warning' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(0, 0, 0, 0.06)', color: logFilter === 'warning' ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 'bold' }}>{consoleLogs.filter(l => l.type === 'warning').length}</span>
                </button>
                <button 
                  onClick={() => setLogFilter('info')}
                  style={{ 
                    background: 'none', border: 'none', color: logFilter === 'info' ? 'var(--info)' : 'var(--text-secondary)', 
                    fontWeight: logFilter === 'info' ? 'bold' : 'normal', borderBottom: logFilter === 'info' ? '2px solid var(--info)' : '2px solid transparent', 
                    height: '100%', padding: '0 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, transition: 'all 0.15s'
                  }}
                >
                  <span style={{ direction: 'ltr' }}>Info</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{consoleLogs.filter(l => l.type === 'info' || l.type === 'success' || !l.type).length}</span>
                </button>
              </div>

              {/* Left side: Clear Button */}
              <button 
                onClick={() => {
                  setConsoleLogs([]);
                  setExpandedLogs({});
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
              >
                مسح السجلات
              </button>
            </div>
            
            <div className="console-logs-content" style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
              {consoleLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                  لا توجد سجلات تجميع. قم بتحديث التجميع لعرض التقارير.
                </div>
              ) : (
                (() => {
                  const filtered = consoleLogs.filter(log => {
                    if (logFilter === 'error') return log.type === 'error';
                    if (logFilter === 'warning') return log.type === 'warning';
                    if (logFilter === 'info') return log.type === 'info' || log.type === 'success' || !log.type;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                        لا توجد سجلات تطابق الفلتر المختار.
                      </div>
                    );
                  }

                  return filtered.map((log, index) => {
                    const isExpanded = !!expandedLogs[index];
                    const isAiExpanded = !!expandedLogs[`ai_${index}`];
                    let borderLeftColor = 'var(--info)';
                    let textColor = 'var(--text-primary)';
                    if (log.type === 'error') {
                      borderLeftColor = 'var(--error)';
                      textColor = 'var(--error)';
                    } else if (log.type === 'warning') {
                      borderLeftColor = 'var(--warning)';
                      textColor = 'var(--warning)';
                    }

                    const displayPath = log.path ? log.path.replace('doc.tex', 'main.tex') : './main.tex';

                    return (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          backgroundColor: 'var(--bg-secondary)', 
                          borderRight: `4px solid ${borderLeftColor}`,
                          borderTop: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        {/* Header Row */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', justifyContent: 'space-between', gap: '8px' }}>
                          <div 
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, cursor: 'pointer', textAlign: 'right' }} 
                            onClick={() => setExpandedLogs(prev => ({ ...prev, [index]: !prev[index] }))}
                          >
                            <span style={{ display: 'inline-flex', marginTop: '3px' }}>
                              {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} /> : <ChevronLeft size={14} style={{ color: 'var(--text-secondary)' }} />}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '500', color: textColor, lineHeight: '1.4' }}>
                                {log.message}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {displayPath}{log.line ? `, السطر ${log.line}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {log.line && (
                              <button 
                                className="toolbar-btn" 
                                style={{ padding: '4px', borderRadius: '4px', background: 'transparent' }} 
                                onClick={() => jumpToLine(log.line)}
                                title="الانتقال إلى السطر في المحرر"
                              >
                                <Target size={14} style={{ color: 'var(--text-secondary)' }} />
                              </button>
                            )}
                            <button 
                              className="toolbar-btn" 
                              style={{ padding: '4px', borderRadius: '4px', background: 'transparent', color: isAiExpanded ? 'var(--success)' : 'var(--text-secondary)' }} 
                              onClick={() => setExpandedLogs(prev => ({ ...prev, [`ai_${index}`]: !prev[`ai_${index}`] }))}
                              title="اقتراح الذكاء الاصطناعي للإصلاح"
                            >
                              <Sparkles size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{ padding: '8px 12px', borderTop: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'left', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {log.fullMessage || log.message}
                            </pre>
                          </div>
                        )}

                        {/* AI Suggestion */}
                        {isAiExpanded && (
                          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(22, 163, 74, 0.2)', backgroundColor: 'rgba(22, 163, 74, 0.04)', fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 'bold' }}>
                              <Sparkles size={12} />
                              <span>مساعد الذكاء الاصطناعي (AI Assistant):</span>
                            </div>
                            <span style={{ lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                              {getAiSuggestion(log.message)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

        </div>
      )}
      {/* 5. Presentation Mode Overlay */}
      {presentationMode && (
        <div className="modal-overlay" style={{ background: '#1e293b', zIndex: 9999, display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>وضع العرض الأكاديمي التقديمي (Presentation Mode)</span>
            <button 
              className="btn-danger" 
              onClick={() => setPresentationMode(false)}
              style={{ background: 'var(--error)', border: 'none', color: 'white', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              إنهاء العرض (Exit)
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px' }}>
            <div 
              style={{ 
                background: 'white', 
                color: 'black', 
                width: '100%', 
                maxWidth: '900px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
                borderRadius: '8px', 
                padding: '2rem',
                minHeight: '80%'
              }}
              dangerouslySetInnerHTML={{ __html: document.getElementById('preview-box')?.innerHTML || '' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
