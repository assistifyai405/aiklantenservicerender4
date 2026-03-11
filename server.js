const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mijn-super-geheime-sleutel';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database
const DB_FILE = './database.json';
function loadDB() {
  if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return { users: [], chatbots: [] };
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.redirect('/login'); }
}

// Plan limits
const PLAN_LIMITS = { free: 1, starter: 3, pro: 10 };

// ============ PAGES ============

const indexPage = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Klantenservice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(to bottom, #eff6ff, #fff); min-height: 100vh; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; max-width: 1200px; margin: 0 auto; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
    .nav-links a { margin-left: 1.5rem; text-decoration: none; color: #4b5563; }
    .btn { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; }
    .hero { text-align: center; padding: 5rem 2rem; max-width: 800px; margin: 0 auto; }
    .hero h1 { font-size: 3.5rem; font-weight: bold; margin-bottom: 1.5rem; }
    .hero h1 span { color: #2563eb; }
    .hero p { font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; }
    .pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 1000px; margin: 4rem auto; padding: 0 2rem; }
    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .card .price { font-size: 2.5rem; font-weight: bold; color: #2563eb; margin-bottom: 1rem; }
    .card ul { list-style: none; color: #6b7280; }
    .card ul li { margin-bottom: 0.5rem; }
    .featured { border: 2px solid #2563eb; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">AI Klantenservice</div>
    <div class="nav-links">
      <a href="/login">Inloggen</a>
      <a href="/register" class="btn">Gratis starten</a>
    </div>
  </nav>
  <div class="hero">
    <h1>Automatiseer je klantenservice met <span>AI</span></h1>
    <p>24/7 je klanten helpen met intelligente chatbots</p>
    <a href="/register" class="btn" style="font-size: 1.125rem; padding: 0.75rem 2rem;">Gratis starten</a>
  </div>
  <div class="pricing">
    <div class="card">
      <h3>Gratis</h3>
      <div class="price">€0</div>
      <ul><li>• 1 chatbot</li><li>• 100 berichten/maand</li></ul>
    </div>
    <div class="card featured">
      <h3>Starter</h3>
      <div class="price">€29</div>
      <ul><li>• 3 chatbots</li><li>• 1.000 berichten/maand</li></ul>
    </div>
    <div class="card">
      <h3>Pro</h3>
      <div class="price">€79</div>
      <ul><li>• 10 chatbots</li><li>• 10.000 berichten/maand</li></ul>
    </div>
  </div>
</body>
</html>`;

const loginPage = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen - AI Klantenservice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
    h1 { text-align: center; color: #1f2937; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; color: #4b5563; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
    button:hover { background: #1d4ed8; }
    .link { text-align: center; margin-top: 1rem; }
    .link a { color: #2563eb; text-decoration: none; }
    .error { color: #dc2626; text-align: center; margin-bottom: 1rem; }
    .success { color: #16a34a; text-align: center; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Inloggen</h1>
    <div id="message"></div>
    <form id="loginForm">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-group">
        <label>Wachtwoord</label>
        <input type="password" name="password" required>
      </div>
      <button type="submit">Inloggen</button>
    </form>
    <div class="link">
      <p>Nog geen account? <a href="/register">Registreren</a></p>
    </div>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') })
      });
      const data = await res.json();
      const msg = document.getElementById('message');
      if (data.success) {
        msg.className = 'success';
        msg.textContent = 'Ingelogd! Doorsturen...';
        window.location.href = '/dashboard';
      } else {
        msg.className = 'error';
        msg.textContent = data.error || 'Inloggen mislukt';
      }
    });
  </script>
</body>
</html>`;

const registerPage = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registreren - AI Klantenservice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
    h1 { text-align: center; color: #1f2937; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; color: #4b5563; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; margin-top: 1rem; }
    button:hover { background: #1d4ed8; }
    .link { text-align: center; margin-top: 1rem; }
    .link a { color: #2563eb; text-decoration: none; }
    .error { color: #dc2626; text-align: center; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Registreren</h1>
    <div id="error" class="error"></div>
    <form id="registerForm">
      <div class="form-group">
        <label>Bedrijfsnaam</label>
        <input type="text" name="company" required>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-group">
        <label>Wachtwoord</label>
        <input type="password" name="password" required minlength="6">
      </div>
      <button type="submit">Account aanmaken</button>
    </form>
    <div class="link">
      <p>Al een account? <a href="/login">Inloggen</a></p>
    </div>
  </div>
  <script>
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.get('company'),
          email: formData.get('email'),
          password: formData.get('password')
        })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        document.getElementById('error').textContent = data.error || 'Registratie mislukt';
      }
    });
  </script>
</body>
</html>`;

const dashboardPage = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - AI Klantenservice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
    nav { background: white; padding: 1rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
    .nav-links a { margin-left: 1.5rem; text-decoration: none; color: #4b5563; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; border: none; cursor: pointer; font-size: 1rem; }
    .btn:hover { background: #1d4ed8; }
    .btn-danger { background: #dc2626; }
    .btn-danger:hover { background: #b91c1c; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .card { background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { margin-bottom: 0.5rem; color: #1f2937; }
    .card p { color: #6b7280; margin-bottom: 1rem; font-size: 0.875rem; }
    .card .code-box { background: #f3f4f6; padding: 0.75rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; margin-bottom: 1rem; border: 1px solid #e5e7eb; }
    .card .actions { display: flex; gap: 0.5rem; }
    .card .actions button { flex: 1; padding: 0.5rem; border-radius: 0.25rem; border: none; cursor: pointer; font-size: 0.875rem; }
    .empty { text-align: center; padding: 4rem; color: #6b7280; background: white; border-radius: 0.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-card .number { font-size: 2rem; font-weight: bold; color: #2563eb; }
    .stat-card .label { color: #6b7280; font-size: 0.875rem; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; display: none; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">AI Klantenservice</div>
    <div class="nav-links">
      <a href="/dashboard">Dashboard</a>
      <a href="/api/logout">Uitloggen</a>
    </div>
  </nav>
  <div class="container">
    <div class="header">
      <h1>Jouw Chatbots</h1>
      <a href="/new-chatbot" class="btn">+ Nieuwe Chatbot</a>
    </div>
    <div class="stats">
      <div class="stat-card">
        <div class="number" id="stat-count">0</div>
        <div class="label">Chatbots</div>
      </div>
      <div class="stat-card">
        <div class="number" id="stat-limit">1</div>
        <div class="label">Limiet</div>
      </div>
      <div class="stat-card">
        <div class="number" id="stat-plan">Free</div>
        <div class="label">Pakket</div>
      </div>
    </div>
    <div id="chatbots" class="grid"></div>
  </div>
  <div id="toast" class="toast">Gekopieerd!</div>
  <script>
    async function loadDashboard() {
      const [chatbotsRes, userRes] = await Promise.all([
        fetch('/api/chatbots'),
        fetch('/api/user')
      ]);
      const chatbots = await chatbotsRes.json();
      const user = await userRes.json();
      
      document.getElementById('stat-count').textContent = chatbots.length;
      document.getElementById('stat-limit').textContent = user.limit;
      document.getElementById('stat-plan').textContent = user.plan;
      
      const container = document.getElementById('chatbots');
      if (chatbots.length === 0) {
        container.innerHTML = '<div class="empty"><h2>Geen chatbots yet</h2><p>Maak je eerste chatbot aan!</p></div>';
        return;
      }
      
      container.innerHTML = chatbots.map(c => {
        const embedCode = '<script src="' + window.location.origin + '/widget.js?id=' + c.id + '"><\\/script>';
        return '<div class="card"><h3>' + c.name + '</h3><p>' + (c.description || 'Geen beschrijving') + '</p><div class="code-box">' + embedCode + '</div><div class="actions"><button class="btn" onclick="copyCode(this, \'' + embedCode + '\')">Kopieer code</button><button class="btn btn-danger" onclick="deleteChatbot(\'' + c.id + '\')">Verwijder</button></div></div>';
      }).join('');
    }
    
    function copyCode(btn, code) {
      navigator.clipboard.writeText(code.replace(/<\\/script>/g, '</script>'));
      const toast = document.getElementById('toast');
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 2000);
    }
    
    async function deleteChatbot(id) {
      if (!confirm('Weet je zeker dat je deze chatbot wilt verwijderen?')) return;
      await fetch('/api/chatbots/' + id, { method: 'DELETE' });
      loadDashboard();
    }
    
    loadDashboard();
  </script>
</body>
</html>`;

const newChatbotPage = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Chatbot - AI Klantenservice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; }
    nav { background: white; padding: 1rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
    .nav-links a { margin-left: 1.5rem; text-decoration: none; color: #4b5563; }
    .container { max-width: 600px; margin: 2rem auto; padding: 0 2rem; }
    .card { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { margin-bottom: 1.5rem; color: #1f2937; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; color: #4b5563; font-weight: 500; }
    input, textarea { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; font-family: inherit; }
    textarea { min-height: 120px; resize: vertical; }
    button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    .back { display: inline-block; margin-bottom: 1rem; color: #2563eb; text-decoration: none; }
    .error { color: #dc2626; margin-bottom: 1rem; }
    .hint { color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">AI Klantenservice</div>
    <div class="nav-links">
      <a href="/dashboard">Dashboard</a>
      <a href="/api/logout">Uitloggen</a>
    </div>
  </nav>
  <div class="container">
    <a href="/dashboard" class="back">← Terug naar dashboard</a>
    <div class="card">
      <h1>Nieuwe Chatbot</h1>
      <div id="error" class="error"></div>
      <form id="chatbotForm">
        <div class="form-group">
          <label>Naam *</label>
          <input type="text" name="name" placeholder="Bijv: Klantenservice Bot" required>
        </div>
        <div class="form-group">
          <label>Beschrijving</label>
          <input type="text" name="description" placeholder="Waar is deze chatbot voor?">
        </div>
        <div class="form-group">
          <label>Kennisbank / Instructies</label>
          <textarea name="knowledge" placeholder="Beschrijf hier wat de AI moet weten over je bedrijf...&#10;&#10;Bijvoorbeeld:&#10;- Wij zijn een webshop die schoenen verkoopt&#10;- Openingstijden: ma-vr 9:00-17:00&#10;- Telefoon: 020-1234567&#10;- Retourneren kan binnen 14 dagen"></textarea>
          <p class="hint">De AI gebruikt deze informatie om klanten te helpen</p>
        </div>
        <button type="submit">Chatbot aanmaken</button>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('chatbotForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          knowledge: formData.get('knowledge')
        })
      });
      const data = await res.json();
      if (data.id) {
        window.location.href = '/dashboard';
      } else {
        document.getElementById('error').textContent = data.error || 'Er is iets misgegaan';
      }
    });
  </script>
</body>
</html>`;

// ============ ROUTES ============

app.get('/', (req, res) => res.send(indexPage));
app.get('/login', (req, res) => res.send(loginPage));
app.get('/register', (req, res) => res.send(registerPage));
app.get('/dashboard', authMiddleware, (req, res) => res.send(dashboardPage));
app.get('/new-chatbot', authMiddleware, (req, res) => res.send(newChatbotPage));

// API - User info
app.get('/api/user', authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.userId);
  const chatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  res.json({ 
    plan: user?.plan || 'free',
    limit: PLAN_LIMITS[user?.plan || 'free'],
    chatbotCount: chatbots.length
  });
});

// API - Register
app.post('/api/register', async (req, res) => {
  const { company, email, password } = req.body;
  const db = loadDB();
  
  if (db.users.find(u => u.email === email)) {
    return res.json({ error: 'Dit email adres is al geregistreerd' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    company,
    email,
    password: hashedPassword,
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(user);
  saveDB(db);
  
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

// API - Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email === email);
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.json({ error: 'Ongeldige email of wachtwoord' });
  }
  
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

// API - Logout
app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// API - Get chatbots
app.get('/api/chatbots', authMiddleware, (req, res) => {
  const db = loadDB();
  const chatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  res.json(chatbots);
});

// API - Create chatbot
app.post('/api/chatbots', authMiddleware, (req, res) => {
  const { name, description, knowledge } = req.body;
  const db = loadDB();
  
  const user = db.users.find(u => u.id === req.user.userId);
  const userChatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  const limit = PLAN_LIMITS[user?.plan || 'free'];
  
  if (userChatbots.length >= limit) {
    return res.json({ error: 'Je hebt het maximum aantal chatbots bereikt voor je pakket. Upgrade om meer toe te voegen.' });
  }
  
  const chatbot = {
    id: Date.now().toString(),
    userId: req.user.userId,
    name,
    description: description || '',
    knowledge: knowledge || '',
    createdAt: new Date().toISOString()
  };
  
  db.chatbots.push(chatbot);
  saveDB(db);
  res.json(chatbot);
});

// API - Delete chatbot
app.delete('/api/chatbots/:id', authMiddleware, (req, res) => {
  const db = loadDB();
  db.chatbots = db.chatbots.filter(c => !(c.id === req.params.id && c.userId === req.user.userId));
  saveDB(db);
  res.json({ success: true });
});

// Widget.js (placeholder)
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`console.log('Chatbot widget loaded for ID: ${req.query.id}');`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log('🚀 Server draait op poort ' + PORT);
});
