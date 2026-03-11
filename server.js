const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 2125673859mdkfyabdirmag38t0wgscxvb4e2;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const DB_FILE = './database.json';
function loadDB() {
  if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return { users: [], chatbots: [], conversations: [] };
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } 
  catch { res.redirect('/login'); }
}

const indexHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(to bottom,#eff6ff,#fff);min-height:100vh}nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;max-width:1200px;margin:0 auto}.logo{font-size:1.5rem;font-weight:bold;color:#2563eb}.nav-links a{margin-left:1.5rem;text-decoration:none;color:#4b5563}.btn{background:#2563eb;color:white;padding:0.5rem 1rem;border-radius:0.5rem;text-decoration:none}.hero{text-align:center;padding:5rem 2rem;max-width:800px;margin:0 auto}.hero h1{font-size:3.5rem;font-weight:bold;margin-bottom:1.5rem}.hero h1 span{color:#2563eb}.hero p{font-size:1.25rem;color:#6b7280;margin-bottom:2rem}.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:2rem;max-width:1000px;margin:4rem auto;padding:0 2rem}.card{background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 6px rgba(0,0,0,0.1)}.card h3{font-size:1.25rem;margin-bottom:0.5rem}.card .price{font-size:2.5rem;font-weight:bold;color:#2563eb;margin-bottom:1rem}.card ul{list-style:none;color:#6b7280}.card ul li{margin-bottom:0.5rem}.featured{border:2px solid #2563eb}</style>
</head><body>
<nav><div class="logo">AI Klantenservice</div><div class="nav-links"><a href="/login">Inloggen</a><a href="/register" class="btn">Gratis starten</a></div></nav>
<div class="hero"><h1>Automatiseer je klantenservice met <span>AI</span></h1><p>24/7 je klanten helpen met intelligente chatbots</p><a href="/register" class="btn" style="font-size:1.125rem;padding:0.75rem 2rem">Gratis starten</a></div>
<div class="pricing"><div class="card"><h3>Gratis</h3><div class="price">€0</div><ul><li>• 1 chatbot</li><li>• 100 berichten/maand</li></ul></div><div class="card featured"><h3>Starter</h3><div class="price">€29</div><ul><li>• 3 chatbots</li><li>• 1.000 berichten/maand</li></ul></div><div class="card"><h3>Pro</h3><div class="price">€79</div><ul><li>• 10 chatbots</li><li>• 10.000 berichten/maand</li></ul></div></div>
</body></html>`;

const loginHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inloggen - AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);width:100%;max-width:400px}h1{text-align:center;color:#1f2937;margin-bottom:1.5rem}.form-group{margin-bottom:1rem}label{display:block;margin-bottom:0.5rem;color:#4b5563}input{width:100%;padding:0.75rem;border:1px solid #d1d5db;border-radius:0.5rem;font-size:1rem}button{width:100%;padding:0.75rem;background:#2563eb;color:white;border:none;border-radius:0.5rem;font-size:1rem;cursor:pointer;margin-top:1rem}.link{text-align:center;margin-top:1rem}.link a{color:#2563eb;text-decoration:none}.error{color:#dc2626;text-align:center;margin-bottom:1rem}</style>
</head><body><div class="container"><h1>Inloggen</h1><div id="error" class="error"></div>
<form id="loginForm"><div class="form-group"><label>Email</label><input type="email" name="email" required></div><div class="form-group"><label>Wachtwoord</label><input type="password" name="password" required></div><button type="submit">Inloggen</button></form>
<div class="link"><p>Nog geen account? <a href="/register">Registreren</a></p></div></div>
<script>document.getElementById('loginForm').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});const d=await r.json();if(d.success)window.location.href='/dashboard';else document.getElementById('error').textContent=d.error||'Inloggen mislukt'})</script>
</body></html>`;

const registerHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registreren - AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);width:100%;max-width:400px}h1{text-align:center;color:#1f2937;margin-bottom:1.5rem}.form-group{margin-bottom:1rem}label{display:block;margin-bottom:0.5rem;color:#4b5563}input{width:100%;padding:0.75rem;border:1px solid #d1d5db;border-radius:0.5rem;font-size:1rem}button{width:100%;padding:0.75rem;background:#2563eb;color:white;border:none;border-radius:0.5rem;font-size:1rem;cursor:pointer;margin-top:1rem}.link{text-align:center;margin-top:1rem}.link a{color:#2563eb;text-decoration:none}.error{color:#dc2626;text-align:center;margin-bottom:1rem}</style>
</head><body><div class="container"><h1>Registreren</h1><div id="error" class="error"></div>
<form id="registerForm"><div class="form-group"><label>Bedrijfsnaam</label><input type="text" name="company" required></div><div class="form-group"><label>Email</label><input type="email" name="email" required></div><div class="form-group"><label>Wachtwoord</label><input type="password" name="password" required></div><button type="submit">Account aanmaken</button></form>
<div class="link"><p>Al een account? <a href="/login">Inloggen</a></p></div></div>
<script>document.getElementById('registerForm').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:f.get('company'),email:f.get('email'),password:f.get('password')})});const d=await r.json();if(d.success)window.location.href='/dashboard';else document.getElementById('error').textContent=d.error||'Registratie mislukt'})</script>
</body></html>`;

const dashboardHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard - AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6}nav{background:white;padding:1rem 2rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;justify-content:space-between;align-items:center}.logo{font-size:1.5rem;font-weight:bold;color:#2563eb}.nav-links a{margin-left:1.5rem;text-decoration:none;color:#4b5563}.container{max-width:1200px;margin:2rem auto;padding:0 2rem}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem}.btn{background:#2563eb;color:white;padding:0.5rem 1rem;border-radius:0.5rem;text-decoration:none}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}.card{background:white;padding:1.5rem;border-radius:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.card h3{margin-bottom:0.5rem;color:#1f2937}.card p{color:#6b7280;margin-bottom:1rem}.card .code{background:#f3f4f6;padding:0.5rem;border-radius:0.25rem;font-family:monospace;font-size:0.875rem;word-break:break-all}.empty{text-align:center;padding:4rem;color:#6b7280}</style>
</head><body>
<nav><div class="logo">AI Klantenservice</div><div class="nav-links"><a href="/dashboard">Dashboard</a><a href="/billing">Facturering</a><a href="/api/logout">Uitloggen</a></div></nav>
<div class="container"><div class="header"><h1>Jouw Chatbots</h1><a href="/new-chatbot" class="btn">+ Nieuwe Chatbot</a></div><div id="chatbots" class="grid"></div></div>
<script>async function loadChatbots(){const r=await fetch('/api/chatbots');const c=await r.json();const d=document.getElementById('chatbots');if(c.length===0){d.innerHTML='<div class="empty"><h2>Geen chatbots yet</h2><p>Maak je eerste chatbot aan!</p></div>';return}d.innerHTML=c.map(x=>'<div class="card"><h3>'+x.name+'</h3><p>'+(x.description||'Geen beschrijving')+'</p><div class="code">&lt;script src="'+window.location.origin+'/widget.js?id='+x.id+'"&gt;&lt;/script&gt;</div></div>').join('')}loadChatbots()</script>
</body></html>`;

const newChatbotHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nieuwe Chatbot - AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6}nav{background:white;padding:1rem 2rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;justify-content:space-between;align-items:center}.logo{font-size:1.5rem;font-weight:bold;color:#2563eb}.nav-links a{margin-left:1.5rem;text-decoration:none;color:#4b5563}.container{max-width:600px;margin:2rem auto;padding:0 2rem}.card{background:white;padding:2rem;border-radius:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}h1{margin-bottom:1.5rem;color:#1f2937}.form-group{margin-bottom:1rem}label{display:block;margin-bottom:0.5rem;color:#4b5563}input,textarea{width:100%;padding:0.75rem;border:1px solid #d1d5db;border-radius:0.5rem;font-size:1rem;font-family:inherit}textarea{min-height:150px;resize:vertical}button{width:100%;padding:0.75rem;background:#2563eb;color:white;border:none;border-radius:0.5rem;font-size:1rem;cursor:pointer}button:hover{background:#1d4ed8}.back{display:inline-block;margin-bottom:1rem;color:#2563eb;text-decoration:none}</style>
</head><body>
<nav><div class="logo">AI Klantenservice</div><div class="nav-links"><a href="/dashboard">Dashboard</a><a href="/billing">Facturering</a><a href="/api/logout">Uitloggen</a></div></nav>
<div class="container"><a href="/dashboard" class="back">← Terug</a><div class="card"><h1>Nieuwe Chatbot</h1>
<form id="chatbotForm"><div class="form-group"><label>Naam</label><input type="text" name="name" required></div><div class="form-group"><label>Beschrijving</label><input type="text" name="description"></div><div class="form-group"><label>Kennisbank</label><textarea name="knowledge" placeholder="Bijv: Wij zijn een webshop die schoenen verkoopt..."></textarea></div><button type="submit">Chatbot aanmaken</button></form>
</div></div>
<script>document.getElementById('chatbotForm').addEventListener('submit',async(e)=>{e.preventDefault();const f=new FormData(e.target);const r=await fetch('/api/chatbots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.get('name'),description:f.get('description'),knowledge:f.get('knowledge')})});const d=await r.json();if(d.id)window.location.href='/dashboard';else alert(d.error||'Er is iets misgegaan')})</script>
</body></html>`;

const billingHTML = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Facturering - AI Klantenservice</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6}nav{background:white;padding:1rem 2rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;justify-content:space-between;align-items:center}.logo{font-size:1.5rem;font-weight:bold;color:#2563eb}.nav-links a{margin-left:1.5rem;text-decoration:none;color:#4b5563}.container{max-width:1000px;margin:2rem auto;padding:0 2rem}h1{margin-bottom:1.5rem;color:#1f2937}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem}.card{background:white;padding:1.5rem;border-radius:0.5rem;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.card h3{margin-bottom:0.5rem}.card .price{font-size:2rem;font-weight:bold;color:#2563eb;margin:1rem 0}.card ul{list-style:none;color:#6b7280;margin-bottom:1rem}.card ul li{margin-bottom:0.5rem}.card button{width:100%;padding:0.75rem;border:none;border-radius:0.5rem;cursor:pointer}.card.current{border:2px solid #2563eb}.btn-primary{background:#2563eb;color:white}.btn-secondary{background:#e5e7eb;color:#374151}</style>
</head><body>
<nav><div class="logo">AI Klantenservice</div><div class="nav-links"><a href="/dashboard">Dashboard</a><a href="/billing">Facturering</a><a href="/api/logout">Uitloggen</a></div></nav>
<div class="container"><h1>Kies je pakket</h1><div class="grid">
<div class="card" id="plan-free"><h3>Gratis</h3><div class="price">€0/maand</div><ul><li>• 1 chatbot</li><li>• 100 berichten/maand</li><li>• Basis AI</li></ul><button class="btn-secondary" onclick="selectPlan('free')">Kies</button></div>
<div class="card" id="plan-starter"><h3>Starter</h3><div class="price">€29/maand</div><ul><li>• 3 chatbots</li><li>• 1.000 berichten/maand</li><li>• Gevorderde AI</li></ul><button class="btn-primary" onclick="selectPlan('starter')">Kies</button></div>
<div class="card" id="plan-pro"><h3>Pro</h3><div class="price">€79/maand</div><ul><li>• 10 chatbots</li><li>• 10.000 berichten/maand</li><li>• Premium AI</li></ul><button class="btn-primary" onclick="selectPlan('pro')">Kies</button></div>
</div></div>
<script>async function loadCurrentPlan(){const r=await fetch('/api/user');const u=await r.json();document.querySelectorAll('.card').forEach(c=>c.classList.remove('current'));const p=document.getElementById('plan-'+(u.plan||'free'));if(p){p.classList.add('current');const b=p.querySelector('button');b.textContent='Huidig';b.disabled=true}}async function selectPlan(p){const r=await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:p})});const d=await r.json();if(d.url)window.location.href=d.url;else{alert('Plan bijgewerkt!');loadCurrentPlan()}}loadCurrentPlan()</script>
</body></html>`;

const widgetJS = `(function(){const i=document.currentScript.getAttribute('data-id');const s=document.createElement('style');s.textContent='#ai-chat-widget{position:fixed;bottom:20px;right:20px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}#ai-chat-button{width:60px;height:60px;border-radius:50%;background:#2563eb;color:white;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-size:24px}#ai-chat-window{position:absolute;bottom:70px;right:0;width:350px;height:500px;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:none;flex-direction:column;overflow:hidden}#ai-chat-header{background:#2563eb;color:white;padding:15px;font-weight:bold}#ai-chat-messages{flex:1;overflow-y:auto;padding:15px}.ai-message{margin-bottom:10px;padding:10px;border-radius:8px;max-width:80%}.ai-message.user{background:#2563eb;color:white;margin-left:auto}.ai-message.bot{background:#f3f4f6;color:#1f2937}#ai-chat-input{display:flex;padding:10px;border-top:1px solid #e5e7eb}#ai-chat-input input{flex:1;padding:10px;border:1px solid #d1d5db;border-radius:6px;margin-right:10px}#ai-chat-input button{padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer}';document.head.appendChild(s);const w=document.createElement('div');w.id='ai-chat-widget';w.innerHTML='<div id="ai-chat-window"><div id="ai-chat-header">AI Assistant</div><div id="ai-chat-messages"></div><div id="ai-chat-input"><input type="text" placeholder="Typ je bericht..."><button>Verstuur</button></div></div><button id="ai-chat-button">💬</button>';document.body.appendChild(w);const b=document.getElementById('ai-chat-button'),n=document.getElementById('ai-chat-window'),m=document.getElementById('ai-chat-messages'),p=n.querySelector('input'),u=n.querySelector('#ai-chat-input button');let o=false;b.addEventListener('click',()=>{o=!o;n.style.display=o?'flex':'none'});function a(t,d){const x=document.createElement('div');x.className='ai-message '+(d?'user':'bot');x.textContent=t;m.appendChild(x);m.scrollTop=m.scrollHeight}async function v(){const t=p.value.trim();if(!t)return;a(t,true);p.value='';try{const r=await fetch(window.location.origin+'/api/chat/'+i,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});const d=await r.json();a(d.reply||'Sorry, ik begrijp dat niet helemaal.',false)}catch(e){a('Sorry, er is een fout opgetreden.',false)}}u.addEventListener('click',v);p.addEventListener('keypress',e=>{if(e.key==='Enter')v()});a('Hallo! Hoe kan ik je helpen?',false)})();`;

// Routes
app.get('/', (req, res) => res.send(indexHTML));
app.get('/login', (req, res) => res.send(loginHTML));
app.get('/register', (req, res) => res.send(registerHTML));
app.get('/dashboard', authMiddleware, (req, res) => res.send(dashboardHTML));
app.get('/new-chatbot', authMiddleware, (req, res) => res.send(newChatbotHTML));
app.get('/billing', authMiddleware, (req, res) => res.send(billingHTML));
app.get('/widget.js', (req, res) => { res.setHeader('Content-Type', 'application/javascript'); res.send(widgetJS); });

// API - Auth
app.post('/api/register', async (req, res) => {
  const { company, email, password } = req.body;
  const db = loadDB();
  if (db.users.find(u => u.email === email)) return res.json({ error: 'Email al in gebruik' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), company, email, password: hashedPassword, plan: 'free', createdAt: new Date().toISOString() };
  db.users.push(user);
  saveDB(db);
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email === email);
  if (!user || !await bcrypt.compare(password, user.password)) return res.json({ error: 'Ongeldige inloggegevens' });
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

app.get('/api/logout', (req, res) => { res.clearCookie('token'); res.redirect('/'); });
app.get('/api/user', authMiddleware, (req, res) => { const db = loadDB(); const user = db.users.find(u => u.id === req.user.userId); res.json({ plan: user?.plan || 'free' }); });

// API - Chatbots
app.get('/api/chatbots', authMiddleware, (req, res) => { const db = loadDB(); res.json(db.chatbots.filter(c => c.userId === req.user.userId)); });
app.post('/api/chatbots', authMiddleware, (req, res) => {
  const { name, description, knowledge } = req.body;
  const db = loadDB();
  const userChatbots = db.chatbots.filter(c => c.userId === req.user.userId);
  const user = db.users.find(u => u.id === req.user.userId);
  const planLimits = { free: 1, starter: 3, pro: 10 };
  if (userChatbots.length >= planLimits[user?.plan || 'free']) return res.json({ error: 'Limiet bereikt voor je pakket' });
  const chatbot = { id: uuidv4(), userId: req.user.userId, name, description, knowledge, createdAt: new Date().toISOString() };
  db.chatbots.push(chatbot);
  saveDB(db);
  res.json(chatbot);
});

// API - Chat
app.post('/api/chat/:chatbotId', async (req, res) => {
  const { message } = req.body;
  const db = loadDB();
  const chatbot = db.chatbots.find(c => c.id === req.params.chatbotId);
  if (!chatbot) return res.json({ reply: 'Chatbot niet gevonden' });
  const replies = ['Bedankt voor je bericht! Ik help je graag.', 'Dat is een goede vraag. Laat me dat voor je uitzoeken.', 'Ik begrijp je vraag. Hier is het antwoord...', 'Kan je dat wat meer uitleggen?', 'Ik zal dit doorsturen naar een medewerker.'];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  db.conversations.push({ id: uuidv4(), chatbotId: req.params.chatbotId, message, reply, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ reply });
});

// API - Billing
app.post('/api/billing', authMiddleware, (req, res) => {
  const { plan } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.userId);
  if (plan === 'free') { user.plan = 'free'; saveDB(db); return res.json({ success: true }); }
  res.json({ url: '#', message: 'Stripe integratie komt binnenkort!' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => { console.log('🚀 Server draait op poort ' + PORT); console.log('📁 Database:', path.resolve(DB_FILE)); });
