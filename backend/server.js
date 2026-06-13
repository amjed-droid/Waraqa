import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { compileLatex } from './compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'database.json');
const app = express();
app.use(cors());
app.use(express.json());

// Initialize database file if it doesn't exist
const initialProjects = [
  {
    id: 'demo-project-id',
    name: 'مشروع تخرج - ورقة بحثية',
    createdAt: new Date().toISOString(),
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{Waraqa: A Collaborative LaTeX Editor}
\\author{Ahmed Sattar, Ali Mansour}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
هذا المشروع عبارة عن محرر LaTeX تعاوني متكامل يعمل عبر الإنترنت ويحمل اسم "ورقة" (Waraqa). يتيح هذا المحرر للمستخدمين كتابة المستندات العلمية وتنسيقها بشكل فوري ومباشر دون عناء تنصيب حزم LaTeX الكبيرة على أجهزتهم المحلية.
\\end{abstract}

\\section{المقدمة (Introduction)}
المستندات العلمية والرياضية تتطلب دقة متناهية في التنسيق. نظام \\textbf{LaTeX} هو المعيار الصناعي لكتابة الأوراق البحثية، رسائل الماجستير والدكتوراه، والكتب العلمية.

يوفر نظام \\textit{Waraqa} المزايا التالية:
\\begin{itemize}
    \\item محرر ذكي مع تلوين الصيغ وإكمال تلقائي للأوامر.
    \\item مزامنة وتحرير مشترك في الوقت الفعلي بين عدة مستخدمين.
    \\item عارض مدمج ومباشر للمخرجات (PDF/HTML Preview).
    \\item إدارة سهلة للملفات والمجلدات الخاصة بالمشروع.
\\end{itemize}

\\section{المعادلات الرياضية (Mathematical Equations)}
أحد أقوى جوانب نظام LaTeX هو كتابة الصيغ الرياضية المعقدة بسهولة. على سبيل المثال، معادلة أينشتاين الشهيرة للمادة والطاقة:
$E = mc^2$

ويمكن كتابة معادلات أكثر تعقيداً في كتل منفصلة:
\\begin{equation}
f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi
\\end{equation}

ويمكننا أيضاً استخدام المصفوفات مثل:
$$
A = \\begin{pmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
7 & 8 & 9
\\end{pmatrix}
$$

\\section{الخاتمة (Conclusion)}
نأمل أن يكون نظام "ورقة" عوناً للباحثين والمطورين والطلاب العرب في كتابة بحوثهم وتنسيقها بأعلى معايير الجودة العلمية.

\\end{document}`
      },
      {
        path: 'references.bib',
        content: `@article{waraqa2026,
  author = {Sattar, Ahmed and Mansour, Ali},
  title = {Waraqa: Next Generation Collaborative LaTeX Editor},
  journal = {Journal of Arab Computing},
  year = {2026},
  volume = {10},
  number = {2},
  pages = {120--135}
}`
      }
    ]
  }
];

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialProjects, null, 2), 'utf8');
}

let dbInMemory = null;
let writeTimeout = null;
let isWriting = false;
let pendingWrite = false;

function saveDbToDisk() {
  if (isWriting) {
    pendingWrite = true;
    return;
  }
  isWriting = true;
  fs.writeFile(DB_FILE, JSON.stringify(dbInMemory, null, 2), 'utf8', (err) => {
    isWriting = false;
    if (err) {
      console.error('Error writing DB:', err);
    }
    if (pendingWrite) {
      pendingWrite = false;
      saveDbToDisk();
    }
  });
}

// Helper to read/write DB
function readDb() {
  if (dbInMemory) return dbInMemory;
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialProjects, null, 2), 'utf8');
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    dbInMemory = JSON.parse(data);
    return dbInMemory;
  } catch (err) {
    console.error('Error reading DB:', err);
    return initialProjects;
  }
}

function writeDb(data) {
  dbInMemory = data;
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }
  writeTimeout = setTimeout(() => {
    writeTimeout = null;
    saveDbToDisk();
  }, 1000);
}

// --- REST API Routes ---

// Get all projects
app.get('/api/projects', (req, res) => {
  const db = readDb();
  const projectList = db.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    fileCount: p.files.length
  }));
  res.json(projectList);
});

// Create a new project
app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const db = readDb();
  const newProject = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    files: [
      {
        path: 'main.tex',
        content: `\\documentclass{article}
\\title{${name}}
\\author{Author Name}
\\date{\\today}
\\begin{document}
\\maketitle
\\section{Introduction}
Start writing your LaTeX document here.
\\end{document}`
      }
    ]
  };

  db.push(newProject);
  writeDb(db);
  res.status(201).json(newProject);
});

// Get a single project
app.get('/api/projects/:id', (req, res) => {
  const db = readDb();
  const project = db.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Create/Update a file in a project
app.post('/api/projects/:id/files', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const db = readDb();
  const projectIndex = db.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = db[projectIndex];
  const fileIndex = project.files.findIndex(f => f.path === filePath);

  if (fileIndex > -1) {
    project.files[fileIndex].content = content ?? '';
  } else {
    project.files.push({ path: filePath, content: content ?? '' });
  }

  writeDb(db);
  res.json({ success: true, project });
});

// Delete a file in a project
app.delete('/api/projects/:id/files', (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const db = readDb();
  const projectIndex = db.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = db[projectIndex];
  project.files = project.files.filter(f => f.path !== filePath);

  writeDb(db);
  res.json({ success: true, project });
});

// Rename a file in a project
app.post('/api/projects/:id/files/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'oldPath and newPath are required' });
  }

  const db = readDb();
  const projectIndex = db.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = db[projectIndex];
  const file = project.files.find(f => f.path === oldPath);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  file.path = newPath;
  writeDb(db);
  res.json({ success: true, project });
});

// Compile LaTeX document endpoint
app.post('/api/projects/:id/compile', async (req, res) => {
  const { id } = req.params;
  const { path: filePath, content, options } = req.body;
  const db = readDb();
  const project = db.find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Update file if passed in body
  if (filePath && content !== undefined) {
    const fileIndex = project.files.findIndex(f => f.path === filePath);
    if (fileIndex > -1) {
      project.files[fileIndex].content = content;
    } else {
      project.files.push({ path: filePath, content });
    }
    writeDb(db);
  }

  // Find the main file
  const mainFile = project.files.find(f => f.path === 'main.tex') || project.files[0];
  if (!mainFile) {
    return res.status(400).json({ error: 'No LaTeX files found to compile' });
  }

  try {
    const result = await compileLatex(mainFile.content, id, project.files, options || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Compilation server error', details: error.message });
  }
});

// Stateless Compile LaTeX document endpoint (used by remote compilation / Azure)
app.post('/api/compile', async (req, res) => {
  const { source, files } = req.body;
  if (!source) {
    return res.status(400).json({ error: 'Source code is required' });
  }

  try {
    const result = await compileLatex(source, 'stateless-compile', files || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Compilation server error', details: error.message });
  }
});

// --- HTTP and Socket.IO Server ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all client connections
    methods: ['GET', 'POST']
  }
});

// In-memory state tracking active users and cursors in project rooms
const activeSessions = {}; // { [projectId]: { [socketId]: { userName, cursor, activeFile } } }

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle joining a project room
  socket.on('join-project', ({ projectId, userName }) => {
    socket.join(projectId);
    
    if (!activeSessions[projectId]) {
      activeSessions[projectId] = {};
    }
    
    activeSessions[projectId][socket.id] = {
      userName: userName || `مستخدم ${socket.id.substring(0, 4)}`,
      cursor: { lineNumber: 1, column: 1 },
      activeFile: 'main.tex'
    };

    console.log(`User ${userName} joined project ${projectId}`);

    // Notify others and send current users list to the joining user
    io.to(projectId).emit('project-users', Object.entries(activeSessions[projectId]).map(([id, data]) => ({
      socketId: id,
      ...data
    })));
  });

  // Handle file editing broadcasts
  socket.on('edit-file', ({ projectId, filePath, content, selection }) => {
    // Broadcast file edit to other sockets in the project (excluding sender)
    socket.to(projectId).emit('file-updated', {
      filePath,
      content,
      updatedBy: socket.id
    });

    // Proactively save to DB
    const db = readDb();
    const projectIndex = db.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
      const fileIndex = db[projectIndex].files.findIndex(f => f.path === filePath);
      if (fileIndex > -1) {
        db[projectIndex].files[fileIndex].content = content;
        writeDb(db);
      }
    }
  });

  // Handle cursor movements
  socket.on('cursor-move', ({ projectId, filePath, cursor }) => {
    if (activeSessions[projectId] && activeSessions[projectId][socket.id]) {
      activeSessions[projectId][socket.id].cursor = cursor;
      activeSessions[projectId][socket.id].activeFile = filePath;

      socket.to(projectId).emit('cursor-moved', {
        socketId: socket.id,
        userName: activeSessions[projectId][socket.id].userName,
        filePath,
        cursor
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Search which projects this socket belonged to and remove them
    for (const projectId in activeSessions) {
      if (activeSessions[projectId][socket.id]) {
        const userName = activeSessions[projectId][socket.id].userName;
        delete activeSessions[projectId][socket.id];
        
        // Notify others in room
        io.to(projectId).emit('project-users', Object.entries(activeSessions[projectId]).map(([id, data]) => ({
          socketId: id,
          ...data
        })));
        io.to(projectId).emit('user-left', { socketId: socket.id, userName });

        if (Object.keys(activeSessions[projectId]).length === 0) {
          delete activeSessions[projectId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Waraqa Server is running on port ${PORT}`);
});
