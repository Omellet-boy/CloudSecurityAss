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

// MS SQL Server Configuration (Your Hardcoded Values)
const sqlConfig: sql.config = {
  user: 'Alumni sa', 
  password: 'AlumniDbAdmin123!', 
  database: 'AlumniDB',
  server: '192.168.100.38', 
  port: 1433,
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
  .catch(err => {
    console.error('❌ Database Connection Failed: ', err);
    return null;
  });

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- Middleware: Auth Token & RLS Sync ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, async (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;

      // 🔥 FIRE THE RLS CONTEXT TO SQL SERVER
      try {
        const pool = await poolPromise;
        if (pool) {
          const request = pool.request();
          // We set session context so RLS predicates on SQL Server can see the IDs
          await request.query(`
            EXEC sp_set_session_context 'user_id', ${user.user_id}, @read_only = 0;
            EXEC sp_set_session_context 'user_role', '${user.role}', @read_only = 0;
            EXEC sp_set_session_context 'alumni_id', ${user.alumni_id || 'NULL'}, @read_only = 0;
          `);
        }
      } catch (sqlErr) {
        console.error("❌ Failed to set RLS context:", sqlErr);
      }
      next();
    });
  };

  // --- API Routes ---

  // Auth: Register
  app.post("/api/auth/register", 
    [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 }),
      body('full_name').notEmpty()
    ], 
    async (req: any, res: any) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { full_name, email, password, batch_year, programme, phone } = req.body;
        const pool = await poolPromise;
        if (!pool) throw new Error("Database not connected");

        const checkUser = await pool.request()
          .input('email', sql.VarChar, email)
          .query('SELECT 1 FROM Users WHERE email = @email');

        if (checkUser.recordset.length > 0) {
          return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user_id = Date.now();
        const alumni_id = user_id + 1;
        const now = new Date();

        await pool.request()
          .input('user_id', sql.BigInt, user_id)
          .input('email', sql.VarChar, email)
          .input('password_hash', sql.VarChar, password_hash)
          .input('role', sql.VarChar, 'alumni')
          .input('is_active', sql.Int, 1)
          .input('created_at', sql.DateTime, now)
          .query('INSERT INTO Users (user_id, email, password_hash, role, is_active, created_at) VALUES (@user_id, @email, @password_hash, @role, @is_active, @created_at)');

        await pool.request()
          .input('alumni_id', sql.BigInt, alumni_id)
          .input('user_id', sql.BigInt, user_id)
          .input('full_name', sql.VarChar, full_name)
          .input('batch_year', sql.Int, batch_year)
          .input('programme', sql.VarChar, programme || '')
          .input('phone', sql.VarChar, phone || '')
          .input('updated_at', sql.DateTime, now)
          .query('INSERT INTO Alumni (alumni_id, user_id, full_name, batch_year, programme, phone, updated_at) VALUES (@alumni_id, @user_id, @full_name, @batch_year, @programme, @phone, @updated_at)');

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

  // Directory: Masqueraded/Protected fetch
  app.get("/api/directory", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");
      const result = await pool.request().query('SELECT alumni_id, full_name, batch_year, programme FROM Alumni');
      res.json({ success: true, data: result.recordset });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Profile: Detailed Profile (RLS will filter the query on the DB side!)
  app.get("/api/alumni/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");

      const result = await pool.request()
        .input('alumni_id', sql.BigInt, parseInt(req.params.id))
        .query('SELECT a.*, u.email, u.role FROM Alumni a JOIN Users u ON a.user_id = u.user_id WHERE a.alumni_id = @alumni_id');

      const profile = result.recordset[0];
      if (!profile) return res.status(404).json({ success: false, message: "Not found or restricted" });

      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Donations: Get History (Only yours will show due to RLS!)
  app.get("/api/donations", authenticateToken, async (req: any, res: any) => {
    try {
      const pool = await poolPromise;
      if (!pool) throw new Error("Database not connected");
      const result = await pool.request().query('SELECT * FROM Donations');
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
      const receipt_ref = "MMU-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      await pool.request()
        .input('donation_id', sql.BigInt, Date.now())
        .input('alumni_id', sql.BigInt, req.user.alumni_id)
        .input('amount', sql.Decimal(10, 2), amount)
        .input('message', sql.VarChar, message || '')
        .input('receipt_ref', sql.VarChar, receipt_ref)
        .query('INSERT INTO Donations (donation_id, alumni_id, amount, message, receipt_ref) VALUES (@donation_id, @alumni_id, @amount, @message, @receipt_ref)');

      res.json({ success: true, receipt_ref });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // --- Vite Logic ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) { next(e); }
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
