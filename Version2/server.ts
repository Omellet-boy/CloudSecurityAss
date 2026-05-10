import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "mmu-alumni-portal-secret-key-2025";

// Simple JSON Database (Mocking MS SQL Server for this environment)
const DB_PATH = path.join(__dirname, "db.json");

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    users: [],
    alumni: [],
    donations: [],
    auditLogs: [],
  }, null, 2));
}

function getDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveDB(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { full_name, email, password, batch_year, programme, phone } = req.body;
      const db = getDB();

      if (db.users.find((u: any) => u.email === email)) {
        return res.status(400).json({ success: false, message: "Email already registered" });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user_id = Date.now();
      const alumni_id = user_id + 1;

      const newUser = {
        user_id,
        email,
        password_hash,
        role: "alumni",
        is_active: 1,
        created_at: new Date().toISOString()
      };

      const newAlumni = {
        alumni_id,
        user_id,
        full_name,
        batch_year,
        programme,
        phone, // In a real app, this would be masked/encrypted as per proposal
        nric_encrypted: "encrypted_data_placeholder",
        address_encrypted: "encrypted_data_placeholder",
        updated_at: new Date().toISOString()
      };

      db.users.push(newUser);
      db.alumni.push(newAlumni);
      saveDB(db);

      res.json({ success: true, message: "Registration successful" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const db = getDB();
      const user = db.users.find((u: any) => u.email === email);

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const alumni = db.alumni.find((a: any) => a.user_id === user.user_id);
      const token = jwt.sign({ 
        user_id: user.user_id, 
        role: user.role, 
        alumni_id: alumni?.alumni_id 
      }, SECRET_KEY, { expiresIn: "1h" });

      res.json({
        success: true,
        token,
        user: {
          user_id: user.user_id,
          alumni_id: alumni?.alumni_id,
          full_name: alumni?.full_name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Profile: Get Own Profile
  app.get("/api/alumni/:id", authenticateToken, (req: any, res) => {
    const db = getDB();
    const alumni = db.alumni.find((a: any) => a.alumni_id === parseInt(req.params.id));

    if (!alumni) return res.status(404).json({ success: false, message: "Alumni not found" });

    // Security: Check if user is accessing their own profile (RLS simulation)
    if (req.user.role !== 'admin' && req.user.alumni_id !== alumni.alumni_id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const user = db.users.find((u: any) => u.user_id === alumni.user_id);
    
    // Privacy: Mask phone number for non-admins (Dynamic Data Masking simulation)
    const profileData = {
      ...alumni,
      email: user.email,
      last_login: user.last_login,
      phone: req.user.role === 'admin' ? alumni.phone : alumni.phone?.replace(/(\d{3})-\d{3}-(\d{4})/, "$1-XXX-$2")
    };

    res.json({ success: true, data: profileData });
  });

  // Donations: Get History
  app.get("/api/donations", authenticateToken, (req: any, res) => {
    const db = getDB();
    let donations = db.donations;

    // RLS: Alumni only see their own donations
    if (req.user.role !== 'admin') {
      donations = donations.filter((d: any) => d.alumni_id === req.user.alumni_id);
    }

    res.json({ success: true, data: donations });
  });

  // Donations: Make Donation
  app.post("/api/donations", authenticateToken, (req: any, res) => {
    const { amount, message } = req.body;
    const db = getDB();

    const donation = {
      donation_id: Date.now(),
      alumni_id: req.user.alumni_id,
      amount,
      message,
      donated_at: new Date().toISOString(),
      receipt_ref: "MMU-" + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    db.donations.push(donation);

    // Audit Log: Records change
    db.auditLogs.push({
      log_id: Date.now(),
      table_name: "DONATIONS",
      action_type: "INSERT",
      record_id: donation.donation_id,
      changed_by: req.user.user_id,
      new_value: JSON.stringify(donation),
      changed_at: new Date().toISOString(),
      ip_address: req.ip
    });

    saveDB(db);
    res.json({ success: true, receipt_ref: donation.receipt_ref });
  });

  // --- Vite / Frontend Logic ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Explicitly handle all non-API requests by serving index.html
    app.get('*', async (req: any, res: any, next: any) => {
      // If it looks like an API call that wasn't caught, pass it on
      if (req.originalUrl.startsWith('/api')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        // Apply Vite HTML transforms (injects the Vite client)
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
