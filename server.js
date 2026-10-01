const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ADMIN_EMAIL = "devanshpandeyofficial6@gmail.com";
const ADMIN_PASS = "iamdumb@123";

// Initial seed data if database is fresh
function getInitialData() {
  return {
    users: [
      {
        id: "admin-master",
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
        name: "Devansh Pandey",
        role: "admin",
        canEdit: true,
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        device: "Server Master"
      }
    ],
    itinerary: null,
    members: null,
    lastUpdated: new Date().toISOString()
  };
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      // Ensure admin exists
      if (!data.users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        data.users.unshift({
          id: "admin-master",
          email: ADMIN_EMAIL,
          password: ADMIN_PASS,
          name: "Devansh Pandey",
          role: "admin",
          canEdit: true,
          registeredAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          device: "Server Master"
        });
        saveDB(data);
      }
      return data;
    }
  } catch (err) {
    console.error("Error reading database file, resetting:", err);
  }
  const init = getInitialData();
  saveDB(init);
  return init;
}

function saveDB(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Check if express is available
let app;
try {
  const express = require('express');
  const cors = require('cors');
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(__dirname));

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Full sync endpoint
  app.get('/api/sync', (req, res) => {
    const db = loadDB();
    res.json({
      users: db.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        canEdit: u.canEdit,
        registeredAt: u.registeredAt,
        lastLoginAt: u.lastLoginAt,
        device: u.device
      })),
      itinerary: db.itinerary,
      members: db.members,
      lastUpdated: db.lastUpdated
    });
  });

  // User Signup
  app.post('/api/auth/signup', (req, res) => {
    const { email, password, name, device } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = loadDB();

    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const isMaster = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const newUser = {
      id: "user-" + Date.now(),
      email: cleanEmail,
      password: password,
      name: (name && name.trim()) || cleanEmail.split('@')[0],
      role: isMaster ? "admin" : "viewer",
      canEdit: isMaster,
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      device: device || "Web Browser"
    };

    db.users.push(newUser);
    saveDB(db);

    console.log(`[SIGNUP] New user registered: ${cleanEmail} (${newUser.name}) from ${newUser.device}`);

    const safeUser = { ...newUser };
    delete safeUser.password;
    res.json({ success: true, user: safeUser, allUsers: db.users.map(u => ({ ...u, password: undefined })) });
  });

  // User Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password, device } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = loadDB();

    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLoginAt = new Date().toISOString();
    if (device) user.device = device;
    saveDB(db);

    console.log(`[LOGIN] User logged in: ${cleanEmail} from ${user.device}`);

    const safeUser = { ...user };
    delete safeUser.password;
    res.json({ success: true, user: safeUser, allUsers: db.users.map(u => ({ ...u, password: undefined })) });
  });

  // Get all users (for Admin Dashboard)
  app.get('/api/users', (req, res) => {
    const db = loadDB();
    res.json({ users: db.users.map(u => ({ ...u, password: undefined })) });
  });

  // Update user permissions (Admin toggle)
  app.put('/api/users/:email/rights', (req, res) => {
    const targetEmail = req.params.email.toLowerCase();
    const { canEdit } = req.body;
    const db = loadDB();

    const user = db.users.find(u => u.email.toLowerCase() === targetEmail);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (targetEmail === ADMIN_EMAIL.toLowerCase()) {
      user.canEdit = true;
      user.role = "admin";
    } else {
      user.canEdit = !!canEdit;
      user.role = canEdit ? "editor" : "viewer";
    }

    saveDB(db);
    console.log(`[PERMISSION] User ${targetEmail} edit rights: ${user.canEdit}`);
    res.json({ success: true, user: { ...user, password: undefined } });
  });

  // Delete user
  app.delete('/api/users/:email', (req, res) => {
    const targetEmail = req.params.email.toLowerCase();
    if (targetEmail === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: "Cannot delete master admin account." });
    }

    const db = loadDB();
    db.users = db.users.filter(u => u.email.toLowerCase() !== targetEmail);
    saveDB(db);
    console.log(`[DELETE] User removed: ${targetEmail}`);
    res.json({ success: true, message: `User ${targetEmail} removed.` });
  });

  // Update Itinerary
  app.post('/api/itinerary', (req, res) => {
    const { itinerary } = req.body;
    if (!itinerary) return res.status(400).json({ error: "Missing itinerary data" });
    const db = loadDB();
    db.itinerary = itinerary;
    saveDB(db);
    res.json({ success: true });
  });

  // Update Committee Members
  app.post('/api/members', (req, res) => {
    const { members } = req.body;
    if (!members) return res.status(400).json({ error: "Missing members data" });
    const db = loadDB();
    db.members = members;
    saveDB(db);
    res.json({ success: true });
  });

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎉 FRESHERS 2026 SERVER ACTIVE & READY`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`👑 Super Admin Email: ${ADMIN_EMAIL}`);
    console.log(`💾 Persistent DB: ${DB_FILE}`);
    console.log(`======================================================\n`);
  });

} catch (e) {
  // Fallback native HTTP server if express is not yet installed
  console.log("Express not yet installed. Running lightweight native HTTP server...");
  const server = http.createServer((req, res) => {
    // Basic static server
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

    if (parsedUrl.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ status: "ok" }));
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg'
      };
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
    }
  });

  server.listen(PORT, () => {
    console.log(`Native HTTP server running on http://localhost:${PORT}`);
  });
}
