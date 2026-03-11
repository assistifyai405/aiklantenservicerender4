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
  return { users: [] };
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.redirect('/login'); }
}

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
    .btn { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; }
    .welcome { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
    .welcome h2 { color: #1f2937; margin-bottom: 0.5rem; }
    .welcome p { color: #6b7280; }
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
      <h1>Dashboard</h1>
    </div>
    <div class="welcome">
      <h2>Welkom! 🎉</h2>
      <p>Je bent succesvol ingelogd. Hier komt straks je dashboard met chatbots.</p>
    </div>
  </div>
</body>
</html>`;

// ============ ROUTES ============

app.get('/', (req, res) => res.send(indexPage));
app.get('/login', (req, res) => res.send(loginPage));
app.get('/register', (req, res) => res.send(registerPage));
app.get('/dashboard', authMiddleware, (req, res) => res.send(dashboardPage));

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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log('🚀 Server draait op poort ' + PORT);
});
