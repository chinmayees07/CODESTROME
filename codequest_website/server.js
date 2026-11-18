const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });
const registrationsFile = path.join(DATA, 'registrations.json');
const rsvpsFile = path.join(DATA, 'rsvps.json');
const contactsFile = path.join(DATA, 'contacts.json');

function read(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function save(file, items) { fs.writeFileSync(file, JSON.stringify(items, null, 2)); }
function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100000) { reject(new Error('Request is too large.')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('Invalid request data. Please try again.')); }
    });
    req.on('error', reject);
  });
}
function clean(value, max = 180) { return String(value || '').trim().slice(0, max); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
const events = {
  'codestorm-2026': 'CODESTORM 2026',
  'first-website': 'Build Your First Website'
};


const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  try {
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, service: 'Codestrome backend' });
    if (req.method === 'GET' && req.url === '/api/events') {
      const list = read(rsvpsFile);
      return send(res, 200, Object.entries(events).map(([id, title]) => ({ id, title, rsvpCount: list.filter(item => item.eventId === id).length })));
    }
    if (req.method === 'POST' && req.url === '/api/register') {
      const data = await body(req);
      const name = clean(data.name, 100), email = clean(data.email, 160).toLowerCase();
      const year = clean(data.year, 30), department = clean(data.department, 100), interest = clean(data.interest, 100), idea = clean(data.idea, 500);
      if (name.length < 2 || !validEmail(email) || !year || !department || !interest) return send(res, 400, { error: 'Please complete all required fields with a valid email.' });
      const list = read(registrationsFile);
      const existing = list.find(item => item.email === email);
      if (existing) return send(res, 200, { ok: true, alreadyRegistered: true, registration: { id: existing.id, name: existing.name } });
      const registration = { id: 'CS-' + Date.now().toString(36).toUpperCase(), name, email, year, department, interest, idea, createdAt: new Date().toISOString() };
      list.push(registration); save(registrationsFile, list);
      return send(res, 201, { ok: true, registration: { id: registration.id, name: registration.name } });
    }
    if (req.method === 'POST' && req.url === '/api/rsvp') {
      const data = await body(req);
      const name = clean(data.name, 100), email = clean(data.email, 160).toLowerCase(), eventId = clean(data.eventId, 80);
      if (name.length < 2 || !validEmail(email) || !events[eventId]) return send(res, 400, { error: 'Please enter a valid name, email and select an event.' });
      const list = read(rsvpsFile);
      const existing = list.find(item => item.email === email && item.eventId === eventId);
      if (existing) return send(res, 200, { ok: true, alreadyRegistered: true, rsvp: { id: existing.id, name: existing.name, eventName: existing.eventName } });
      const rsvp = { id: 'RS-' + Date.now().toString(36).toUpperCase(), name, email, eventId, eventName: events[eventId], createdAt: new Date().toISOString() };
      list.push(rsvp); save(rsvpsFile, list);
      return send(res, 201, { ok: true, rsvp: { id: rsvp.id, name: rsvp.name, eventName: rsvp.eventName } });
    }
    if (req.method === 'POST' && req.url === '/api/contact') {
      const data = await body(req);
      const name = clean(data.name, 100), email = clean(data.email, 160).toLowerCase(), message = clean(data.message, 1500);
      if (name.length < 2 || !validEmail(email) || message.length < 5) return send(res, 400, { error: 'Please provide a valid name, email and message.' });
      const list = read(contactsFile);
      const contact = { id: 'MSG-' + Date.now().toString(36).toUpperCase(), name, email, message, createdAt: new Date().toISOString() };
      list.push(contact); save(contactsFile, list);
      return send(res, 201, { ok: true, contact: { id: contact.id } });
    }
    if (req.url.startsWith('/api/')) return send(res, 404, { error: 'API endpoint not found.' });
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });

    const pathname = decodeURIComponent(req.url.split('?')[0]);
    const file = pathname === '/' ? path.join(ROOT, 'index.html') : path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(file, (err, content) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
      res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
      res.end(content);
    });
  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) send(res, 500, { error: 'Server error while processing the request. Please try again.' });
    else res.end();
  }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Codestrome running at http://localhost:${PORT}`));
