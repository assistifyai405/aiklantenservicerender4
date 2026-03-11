const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
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
      <ul>
        <li>• 1 chatbot</li>
        <li>• 100 berichten/maand</li>
      </ul>
    </div>
    <div class="card featured">
      <h3>Starter</h3>
      <div class="price">€29</div>
      <ul>
        <li>• 3 chatbots</li>
        <li>• 1.000 berichten/maand</li>
      </ul>
    </div>
    <div class="card">
      <h3>Pro</h3>
      <div class="price">€79</div>
      <ul>
        <li>• 10 chatbots</li>
        <li>• 10.000 berichten/maand</li>
      </ul>
    </div>
  </div>
</body>
</html>`);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log('Server draait op poort ' + PORT);
});
