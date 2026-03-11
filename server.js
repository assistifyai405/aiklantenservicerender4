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
app.use(express.static('/opt/render/project/src/public'));

// Database
const DB_FILE = '/opt/render/project/src/database.json';

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], chatbots: [] }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
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

// Routes - BELANGRIJK: gebruik volledige paden voor Render!
app.get('/', (req, res) => {
  res.sendFile('/opt/render/project/src/views/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile('/opt/render/project/src/views/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile('/opt/render/project/src/views/register.html');
});

app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile('/opt/render/project/src/views/dashboard.html');
});

app.get('/dashboard/chatbots', authMiddleware, (req, res) => {
  res.sendFile('/opt/render/project/src/views/dashboard.html');
});

app.get('/dashboard/chatbots/new', authMiddleware, (req, res) => {
  res.sendFile('/opt/render/project/src/views/new-chatbot.html');
});

app.get('/dashboard/billing', authMiddleware, (req, res) => {
  res.sendFile('/opt/render/project/src/views/billing.html');
});

// API routes (blijven hetzelfde)
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  const db = loadDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email bestaat al' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, password: hashedPassword, plan: 'free' };
  db.users.push(user);
  saveDB(db);
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Ongeldige inloggegevens' });
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Ongeldige inloggegevens' });
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

app.get('/api/user', authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.userId);
  res.json({ id: user.id, name: user.name, email: user.email, plan: user.plan });
});

app.post('/api/chatbots', authMiddleware, (req, res) => {
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
});

app.get('/api/chatbots', authMiddleware, (req, res) => {
  const db = loadDB();
  const chatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  res.json(chatbots);
});

app.post('/api/chat', (req, res) => {
  const { message, apiKey } = req.body;
  const db = loadDB();
  const chatbot = db.chatbots.find(c => c.apiKey === apiKey && c.isActive);
  if (!chatbot) return res.status(404).json({ error: 'Chatbot niet gevonden' });
  res.json({ response: `Bedankt voor je bericht: "${message}". Dit is een demo response van ${chatbot.name}.` });
});

app.listen(PORT, () => {
  console.log(`Server draait op port ${PORT}`);
});
