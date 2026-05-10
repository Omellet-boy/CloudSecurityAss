// Version2/server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import fs from "fs";
import { body, validationResult } from "express-validator";
import sql from "mssql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "mmu-alumni-portal-secret-key-2025";

// MS SQL Server Configuration (VirtualBox VM)
const sqlConfig = {
  user: 'Alumni sa', 
  password: 'AlumniDbAdmin123!',
  database: 'AlumniDB',
  server: '192.168.0.141',
  options: {
    encrypt: true, 
    trustServerCertificate: true 
  }
};

// Global Database Connection Pool
const poolPromise = sql.connect(sqlConfig)
  .then(pool => {
    console.log('✅ Connected to MS SQL Server in VirtualBox');
    return pool;
  })
  .catch(err => console.error('❌ Database Connection Failed: ', err));

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- API Routes ---

  // Auth: Register (Secured with Validation & SQL Injection Protection)
  app.post("/api/auth/register", 
    [
      body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').trim().escape(),
      body('full_name').notEmpty().withMessage('Name is required').trim().escape(),
      body('batch_year').isInt({ min: 1990, max: 2030 }).withMessage('Invalid batch year').toInt(),
      body('programme').optional().trim().escape(),
      body('phone').optional().trim().escape()
    ], 
    async (req: any, res: any) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { full_name, email, password, batch_year, programme, phone } = req.body;
        const pool = await poolPromise;
        if (!pool) throw new Error("Database not connected");

        // Check if user exists
        const checkUser = await pool.request()
          .input('email', sql.VarChar, email)
          .query('SELECT 1 FROM Users WHERE email = @email');

        if (checkUser.recordset.length > 0) {
          return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user_id = Date.now(); // Using timestamp as BIGINT for simplicity
        const alumni_id = user_id + 1;
        const now = new Date();

        // Insert User
        await pool.request()
          .input('user_id', sql.BigInt, user_id)
          .input('email', sql.VarChar, email)
          .input('password_hash', sql.VarChar, password_hash)
          .input('role', sql.VarChar, 'alumni')
          .input('is_active', sql.Int, 1)
          .input('created_at', sql.DateTime, now)
          .query('INSERT INTO Users (user_id, email, password_hash, role, is_active, created_at) VALUES (@user_id, @email, @password_hash, @role, @is_active, @created_at)');

        // Insert Alumni Data
        await pool.request()
          .input('alumni_id', sql.BigInt, alumni_id)
          .input('user_id', sql.BigInt, user_id)
          .input('full_name', sql.VarChar, full_name)
          .input('batch_year', sql.Int, batch_year)
          .input('programme', sql.VarChar, programme || '')
          .input('phone', sql.VarChar, phone || '')
          .input('nric_encrypted', sql.VarChar, 'encrypted_data_placeholder')
          .input('address_encrypted', sql.VarChar, 'encrypted_data_placeholder')
          .input('updated_at', sql.DateTime, now)
          .query('INSERT INTO Alumni (alumni_id, user_id, full_name, batch_year, programme, phone, nric_encrypted, address_encrypted, updated_at) VALUES (@alumni_id, @user_id, @full_name, @batch_year, @programme, @phone, @nric_encrypted, @address_encrypted, @updated_at)');

        res.json({ success: true, message: "Registration successful" });
      } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  );

  // Auth: Login
  app.post("/api/auth/login", 
    [
      body('email').isEmail().normalizeEmail(),
      body('password').notEmpty().trim()
    ],
    async (req: any, res: any) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email, password } = req.body;
        const pool = await poolPromise;
        if (!pool) throw new Error("Database not connected");

        const result = await pool.request()
          .input('email', sql.VarChar, email)
          .query(`
            SELECT u.user_id, u.email, u.password_hash, u.role, a.alumni_id, a.full_name 
            FROM Users u
            LEFT JOIN Alumni a ON u.user_id = a.user_id
            WHERE u.email = @email
          `);

        const user = result.recordset[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
          return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ 
          user_id: user.user_id, 
          role: user.role, 
          alumni_id: user.alumni_id 
        }, SECRET_KEY, { expiresIn: "1h" });

        res.json({
          success: true, token,
          user: {
            user_id: user.user_id,
            alumni_id: user.alumni_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
  });

  // Middleware: Auth Token Verification
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

  // Directory: Get public/masked alumni list
  app.get("/api/directory", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");

      const result = await pool.request().query('SELECT alumni_id, full_name, batch_year, programme, phone FROM Alumni');
      
      const publicAlumni = result.recordset.map((a: any) => {
        let maskedPhone = "N/A";
        if (a.phone) {
          const phoneStr = String(a.phone);
          maskedPhone = phoneStr.length >= 4 ? "XXX-XXX-" + phoneStr.slice(-4) : "XXX-XXX-XXXX";
        }
        return {
          alumni_id: a.alumni_id,
          full_name: a.full_name,
          batch_year: a.batch_year,
          programme: a.programme,
          phone: maskedPhone
        };
      });

      res.json({ success: true, data: publicAlumni });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Profile: Get Own Profile (RLS Simulation)
  app.get("/api/alumni/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");

      const result = await pool.request()
        .input('alumni_id', sql.BigInt, parseInt(req.params.id))
        .query(`
          SELECT a.*, u.email, u.role
          FROM Alumni a
          JOIN Users u ON a.user_id = u.user_id
          WHERE a.alumni_id = @alumni_id
        `);

      const profile = result.recordset[0];
      if (!profile) return res.status(404).json({ success: false, message: "Alumni not found" });

      if (req.user.role !== 'admin' && req.user.alumni_id !== profile.alumni_id) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }

      // Dynamic Data Masking
      const profileData = {
        ...profile,
        phone: req.user.role === 'admin' ? profile.phone : profile.phone?.replace(/(\d{3})-\d{3}-(\d{4})/, "$1-XXX-$2")
      };

      res.json({ success: true, data: profileData });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Donations: Get History
  app.get("/api/donations", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");

      let query = 'SELECT * FROM Donations';
      const request = pool.request();

      // RLS: Alumni only see their own donations
      if (req.user.role !== 'admin') {
        query += ' WHERE alumni_id = @alumni_id';
        request.input('alumni_id', sql.BigInt, req.user.alumni_id);
      }

      const result = await request.query(query);
      res.json({ success: true, data: result.recordset });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Donations: Make Donation
  app.post("/api/donations", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");

      const { amount, message } = req.body;
      const donation_id = Date.now();
      const receipt_ref = "MMU-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const now = new Date();

      await pool.request()
        .input('donation_id', sql.BigInt, donation_id)
        .input('alumni_id', sql.BigInt, req.user.alumni_id)
        .input('amount', sql.Decimal(10, 2), amount)
        .input('message', sql.VarChar, message || '')
        .input('donated_at', sql.DateTime, now)
        .input('receipt_ref', sql.VarChar, receipt_ref)
        .query('INSERT INTO Donations (donation_id, alumni_id, amount, message, donated_at, receipt_ref) VALUES (@donation_id, @alumni_id, @amount, @message, @donated_at, @receipt_ref)');

      // Audit Log
      const audit_log_id = Date.now() + 1;
      const logValue = JSON.stringify({ donation_id, amount, receipt_ref });

      await pool.request()
        .input('log_id', sql.BigInt, audit_log_id)
        .input('table_name', sql.VarChar, 'DONATIONS')
        .input('action_type', sql.VarChar, 'INSERT')
        .input('record_id', sql.BigInt, donation_id)
        .input('changed_by', sql.BigInt, req.user.user_id)
        .input('new_value', sql.VarChar, logValue)
        .input('changed_at', sql.DateTime, now)
        .input('ip_address', sql.VarChar, req.ip || 'unknown')
        .query('INSERT INTO AuditLogs (log_id, table_name, action_type, record_id, changed_by, new_value, changed_at, ip_address) VALUES (@log_id, @table_name, @action_type, @record_id, @changed_by, @new_value, @changed_at, @ip_address)');

      res.json({ success: true, receipt_ref });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // --- Vite / Frontend Logic ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get('*', async (req: any, res: any, next: any) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();