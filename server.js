const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || '2125673859mdkfyabdirmag38t0wgscxvb4e2';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DEBUG: Laat zien waar we zijn
console.log('=== DEBUG INFO ===');
console.log('__dirname:', __dirname);
console.log('Current working directory:', process.cwd());

// Check of views folder bestaat op verschillende plekken
const possibleViewPaths = [
  path.join(__dirname, 'views'),
  path.join('/opt/render/project/src/views'),
  path.join('/opt/render/project/views'),
  path.join(process.cwd(), 'views'),
  './views'
];

console.log('\n=== Checking views folders ===');
possibleViewPaths.forEach(p => {
  console.log(`${p} - Exists: ${fs.existsSync(p)}`);
  if (fs.existsSync(p)) {
    const files = fs.readdirSync(p);
    console.log(`  Files: ${files.join(', ')}`);
  }
});

// Helper functie om views te vinden
function getViewPath(viewName) {
  const possiblePaths = [
    path.join(__dirname, 'views', viewName),
    path.join('/opt/render/project/src/views', viewName),
    path.join('/opt/render/project/views', viewName),
    path.join(process.cwd(), 'views', viewName),
    path.join('./views', viewName)
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Found ${viewName} at: ${p}`);
      return p;
    }
  }
  console.log(`WARNING: ${viewName} not found, using fallback`);
  return possiblePaths[0];
}

// Static files - probeer verschillende plekken
const possiblePublicPaths = [
  path.join(__dirname, 'public'),
  path.join('/opt/render/project/src/public'),
  path.join('/opt/render/project/public'),
  path.join(process.cwd(), 'public'),
  './public'
];

let publicPath = null;
for (const p of possiblePublicPaths) {
  if (fs.existsSync(p)) {
    console.log(`Using public folder: ${p}`);
    publicPath = p;
    break;
  }
}

if (publicPath) {
  app.use(express.static(publicPath));
}

// Database (JSON file)
const possibleDBPaths = [
  path.join(__dirname, 'database.json'),
  path.join('/opt/render/project/src/database.json'),
  path.join('/opt/render/project/database.json'),
  path.join(process.cwd(), 'database.json'),
  './database.json'
];

let DB_FILE = possibleDBPaths[0];
for (const p of possibleDBPaths) {
  const dir = path.dirname(p);
  if (fs.existsSync(dir) || dir === '.') {
    DB_FILE = p;
    break;
  }
}
console.log(`Using database: ${DB_FILE}`);

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], chatbots: [] }));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Database error:', err);
    return { users: [], chatbots: [] };
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Save error:', err);
  }
}

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.redirect('/login');
  }
}

// ========== ROUTES ==========

// Home
app.get('/', (req, res) => {
  res.sendFile(getViewPath('index.html'));
});

// Auth pages
app.get('/login', (req, res) => {
  res.sendFile(getViewPath('login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(getViewPath('register.html'));
});

// Dashboard
app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile(getViewPath('dashboard.html'));
});

app.get('/dashboard/chatbots', authMiddleware, (req, res) => {
  res.sendFile(getViewPath('dashboard.html'));
});

app.get('/dashboard/chatbots/new', authMiddleware, (req, res) => {
  res.sendFile(getViewPath('new-chatbot.html'));
});

app.get('/dashboard/billing', authMiddleware, (req, res) => {
  res.sendFile(getViewPath('billing.html'));
});

// ========== API ==========

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const db = loadDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email bestaat al' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { 
      id: uuidv4(), 
      name, 
      email, 
      password: hashedPassword, 
      plan: 'free',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(user);
    saveDB(db);
    
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Er is iets misgegaan' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = loadDB();
    const user = db.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }
    
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Er is iets misgegaan' });
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Get user
app.get('/api/user', authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User niet gevonden' });
  res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan });
});

// Create chatbot
app.post('/api/chatbots', authMiddleware, (req, res) => {
  try {
    const { name, websiteUrl } = req.body;
    const db = loadDB();
    
    const userChatbots = db.chatbots.filter(c => c.userId === req.user.userId);
    if (userChatbots.length >= 1) {
      return res.status(403).json({ error: 'Gratis limiet bereikt (max 1 chatbot)' });
    }
    
    const chatbot = {
      id: uuidv4(),
      userId: req.user.userId,
      name,
      websiteUrl,
      apiKey: 'ak_' + Math.random().toString(36).substring(2, 15),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    db.chatbots.push(chatbot);
    saveDB(db);
    res.json(chatbot);
  } catch (err) {
    console.error('Create chatbot error:', err);
    res.status(500).json({ error: 'Er is iets misgegaan' });
  }
});

// Get chatbots
app.get('/api/chatbots', authMiddleware, (req, res) => {
  const db = loadDB();
  const chatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  res.json(chatbots);
});

// Chat API (voor widget)
app.post('/api/chat', (req, res) => {
  try {
    const { message, apiKey } = req.body;
    const db = loadDB();
    const chatbot = db.chatbots.find(c => c.apiKey === apiKey && c.isActive);
    
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot niet gevonden' });
    }
    
    res.json({ 
      response: `Bedankt voor je bericht: "${message}". Dit is een demo response van ${chatbot.name}.` 
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Er is iets misgegaan' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=== Server draait op port ${PORT} ===\n`);
});
