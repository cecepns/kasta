require("dotenv").config();
const express = require("express"), cors = require("cors"), mysql = require("mysql2/promise"), multer = require("multer");
const path = require("path"), fs = require("fs"), jwt = require("jsonwebtoken"), bcrypt = require("bcryptjs");

const { PORT = 5000, JWT_SECRET = "change-me", DB_HOST = "localhost", DB_USER = "root", DB_PASSWORD = "", DB_NAME = "kasta", ADMIN_USER = "admin", ADMIN_PASS = "admin123" } = process.env;
const UPLOAD_DIR = path.join(__dirname, "uploads-kasta");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, connectionLimit: 10 });
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

/* ---------- helpers ---------- */
const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(e.status || 500).json({ success: false, message: e.status ? e.message : "Terjadi kesalahan server" });
});
const ok = (res, data, pagination) => res.json({ success: true, data, ...(pagination && { pagination }) });
const clean = (v) =>
  typeof v === "string" ? v.replace(/<[^>]*>/g, "").trim()
  : Array.isArray(v) ? v.map(clean)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]))
  : v;
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: "Sesi berakhir, silakan masuk lagi" }); }
};
const adminOnly = (req, res, next) =>
  req.user.role === "admin" ? next() : res.status(403).json({ success: false, message: "Hanya admin yang dapat mengubah data" });

async function paged(req, res, { table, search, filters = [], sorts = [], select = "*", json = [] }) {
  const page = Math.max(+req.query.page || 1, 1);
  const limit = [10, 25, 50, 100].includes(+req.query.limit) ? +req.query.limit : 10;
  const where = [], args = [];
  if (req.query.search) {
    where.push("(" + search.map((c) => `CAST(${c} AS CHAR) LIKE ?`).join(" OR ") + ")");
    search.forEach(() => args.push(`%${req.query.search}%`));
  }
  filters.forEach((f) => { if (req.query[f]) { where.push(`${f} = ?`); args.push(req.query[f]); } });
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const sort = sorts.includes(req.query.sort) ? req.query.sort : "id";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM ${table} ${w}`, args);
  const [rows] = await db.query(`SELECT ${select} FROM ${table} ${w} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`, [...args, limit, (page - 1) * limit]);
  const parsedRows = rows.map((r) => {
    const item = { ...r };
    json.forEach((col) => {
      if (typeof item[col] === "string") {
        try { item[col] = JSON.parse(item[col]); } catch { item[col] = []; }
      }
    });
    return item;
  });
  ok(res, parsedRows, { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
}

/* ---------- auth ---------- */
app.post("/api/auth/login", wrap(async (req, res) => {
  const { username, password, role } = req.body;
  const [[u]] = await db.query("SELECT * FROM users WHERE username = ?", [username || ""]);
  if (!u || !(await bcrypt.compare(password || "", u.password))) throw fail(401, "Username atau password salah");
  if (role && u.role !== role) throw fail(403, `Akun ini bukan ${role === "admin" ? "Administrator" : "User"}`);
  const user = { id: u.id, name: u.name, username: u.username, role: u.role };
  ok(res, { token: jwt.sign(user, JWT_SECRET, { expiresIn: "12h" }), user });
}));
app.get("/api/auth/profile", auth, wrap(async (req, res) => ok(res, req.user)));

/* ---------- users (admin) ---------- */
app.get("/api/users", auth, adminOnly, wrap((req, res) =>
  paged(req, res, { table: "users", select: "id,name,username,role,created_at", search: ["name", "username"], filters: ["role"], sorts: ["id", "name", "username", "role"] })));
app.post("/api/users", auth, adminOnly, wrap(async (req, res) => {
  const { name, username, password, role } = clean(req.body);
  if (!name || !username || !password || password.length < 6) throw fail(400, "Nama, username, dan password (min. 6 karakter) wajib diisi");
  const [[dup]] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
  if (dup) throw fail(409, "Username sudah dipakai");
  await db.query("INSERT INTO users (name,username,password,role) VALUES (?,?,?,?)", [name, username, await bcrypt.hash(req.body.password, 10), role === "admin" ? "admin" : "user"]);
  ok(res, true);
}));
app.put("/api/users/:id", auth, adminOnly, wrap(async (req, res) => {
  const { name, username, role } = clean(req.body);
  if (!name || !username) throw fail(400, "Nama dan username wajib diisi");
  const [[dup]] = await db.query("SELECT id FROM users WHERE username = ? AND id <> ?", [username, req.params.id]);
  if (dup) throw fail(409, "Username sudah dipakai");
  await db.query("UPDATE users SET name=?, username=?, role=? WHERE id=?", [name, username, role === "admin" ? "admin" : "user", req.params.id]);
  if (req.body.password) {
    if (req.body.password.length < 6) throw fail(400, "Password minimal 6 karakter");
    await db.query("UPDATE users SET password=? WHERE id=?", [await bcrypt.hash(req.body.password, 10), req.params.id]);
  }
  ok(res, true);
}));
app.delete("/api/users/:id", auth, adminOnly, wrap(async (req, res) => {
  if (+req.params.id === req.user.id) throw fail(400, "Tidak dapat menghapus akun sendiri");
  await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
  ok(res, true);
}));

/* ---------- dashboard & map ---------- */
app.get("/api/dashboard", auth, wrap(async (req, res) => {
  const [s] = await db.query("SELECT tahun, COUNT(*) total FROM sengketa GROUP BY tahun");
  const [p] = await db.query("SELECT tahun, COUNT(*) total FROM perkara GROUP BY tahun");
  const years = [...new Set([...s, ...p].map((r) => r.tahun))].sort((a, b) => b - a);
  ok(res, {
    totals: { sengketa: s.reduce((a, r) => a + r.total, 0), perkara: p.reduce((a, r) => a + r.total, 0) },
    chart: [...years].reverse().map((tahun) => ({ tahun: String(tahun), sengketa: s.find((r) => r.tahun === tahun)?.total || 0, perkara: p.find((r) => r.tahun === tahun)?.total || 0 })),
    years: years.map((tahun) => ({ tahun, sengketa: s.find((r) => r.tahun === tahun)?.total || 0, perkara: p.find((r) => r.tahun === tahun)?.total || 0 })),
  });
}));
app.get("/api/map", auth, wrap(async (req, res) => {
  const [s] = await db.query(
    `SELECT id,'sengketa' AS type,tahun,no_registrasi AS nomor,pengadu,teradu,dusun,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,klasifikasi,tipologi,status FROM sengketa WHERE lat IS NOT NULL`
  );
  const [p] = await db.query(
    `SELECT id,'perkara' AS type,tahun,no_perkara AS nomor,penggugat,tergugat,turut_tergugat,dusun,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,pengadilan,status,pemenang FROM perkara WHERE lat IS NOT NULL`
  );
  const parseRows = (rows, jsonCols) =>
    rows.map((r) => {
      const item = { ...r };
      jsonCols.forEach((col) => {
        if (typeof item[col] === "string") {
          try { item[col] = JSON.parse(item[col]); } catch { item[col] = []; }
        }
      });
      return item;
    });
  ok(res, [...parseRows(s, ["pengadu", "teradu"]), ...parseRows(p, ["penggugat", "tergugat", "turut_tergugat"])]);
}));

/* ---------- sengketa & perkara ---------- */
const LOC = ["dusun", "desa", "kecamatan", "kabupaten", "provinsi", "alamat", "lat", "lng"];
const RESOURCES = {
  sengketa: {
    json: ["pengadu", "teradu", "dokumen"], num: "no_registrasi",
    cols: ["tahun", "no_registrasi", "pengadu", "teradu", ...LOC, "akar_masalah", "pokok_masalah", "tipologi", "klasifikasi", "bentuk_penanganan", "status", "dokumen"],
    search: ["no_registrasi", "pengadu", "teradu", "desa", "kecamatan", "kabupaten"], filters: ["tahun", "klasifikasi", "status", "tipologi"],
  },
  perkara: {
    json: ["penggugat", "tergugat", "turut_tergugat", "dokumen"], num: "no_perkara",
    cols: ["tahun", "no_perkara", "pengadilan", "penggugat", "tergugat", "turut_tergugat", ...LOC, "status", "tingkat_pertama_no", "tingkat_pertama_amar", "banding_no", "banding_amar", "kasasi_no", "kasasi_amar", "pk_no", "pk_amar", "eksekusi_no", "pemenang", "dokumen"],
    search: ["no_perkara", "penggugat", "tergugat", "turut_tergugat", "desa", "kecamatan", "kabupaten"], filters: ["tahun", "status", "pengadilan"],
  },
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, f, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(f.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(/\.(pdf|jpe?g|png|webp)$/i.test(f.originalname) ? null : fail(400, "Hanya PDF atau gambar yang diizinkan"), true),
});

Object.entries(RESOURCES).forEach(([name, cfg]) => {
  const base = `/api/${name}`;
  const values = (body, files) => {
    const data = clean(body);
    let existingDocs = data.dokumen || [];
    if (typeof existingDocs === "string") {
      try { existingDocs = JSON.parse(existingDocs); } catch { existingDocs = []; }
    }
    data.dokumen = [...(Array.isArray(existingDocs) ? existingDocs : []), ...files.map((f) => ({ name: f.originalname, url: `/uploads/${f.filename}` }))];
    if (!data.tahun || !data[cfg.num]) throw fail(400, "Tahun dan nomor wajib diisi");
    return cfg.cols.map((c) => cfg.json.includes(c) ? JSON.stringify(data[c] ?? []) : data[c] === "" || data[c] === undefined ? null : data[c]);
  };
  const parse = (req) => { try { return JSON.parse(req.body.data || "{}"); } catch { throw fail(400, "Data tidak valid"); } };
  const mw = [auth, adminOnly, upload.array("files", 10)];

  app.get(base, auth, wrap((req, res) => paged(req, res, { table: name, search: cfg.search, filters: cfg.filters, sorts: ["id", "tahun", cfg.num, "status", "created_at"], json: cfg.json })));
  app.get(`${base}/years`, auth, wrap(async (req, res) => {
    const [rows] = await db.query(`SELECT tahun, COUNT(*) total FROM ${name} GROUP BY tahun ORDER BY tahun DESC`);
    ok(res, rows);
  }));
  app.get(`${base}/:id`, auth, wrap(async (req, res) => {
    const [[row]] = await db.query(`SELECT * FROM ${name} WHERE id = ?`, [req.params.id]);
    if (!row) throw fail(404, "Data tidak ditemukan");
    const item = { ...row };
    cfg.json.forEach((col) => {
      if (typeof item[col] === "string") {
        try { item[col] = JSON.parse(item[col]); } catch { item[col] = []; }
      }
    });
    ok(res, item);
  }));
  app.post(base, ...mw, wrap(async (req, res) => {
    const v = values(parse(req), req.files || []);
    await db.query(`INSERT INTO ${name} (${cfg.cols.join(",")}) VALUES (${cfg.cols.map(() => "?").join(",")})`, v);
    ok(res, true);
  }));
  app.put(`${base}/:id`, ...mw, wrap(async (req, res) => {
    const v = values(parse(req), req.files || []);
    await db.query(`UPDATE ${name} SET ${cfg.cols.map((c) => `${c}=?`).join(",")} WHERE id=?`, [...v, req.params.id]);
    ok(res, true);
  }));
  app.delete(`${base}/:id`, auth, adminOnly, wrap(async (req, res) => {
    await db.query(`DELETE FROM ${name} WHERE id = ?`, [req.params.id]);
    ok(res, true);
  }));
});

app.use((err, req, res, next) => res.status(err.status || 400).json({ success: false, message: err.message || "Permintaan tidak valid" }));

/* ---------- start ---------- */
(async () => {
  try {
    const setup = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
    await setup.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4;`);
    await setup.end();
  } catch (err) {
    console.warn("DB setup check:", err.message);
  }
  const [[{ n }]] = await db.query("SELECT COUNT(*) n FROM users");
  if (!n) {
    await db.query("INSERT INTO users (name,username,password,role) VALUES (?,?,?,'admin')", ["Administrator", ADMIN_USER, await bcrypt.hash(ADMIN_PASS, 10)]);
    console.log(`Admin dibuat: ${ADMIN_USER}`);
  }
  const [[staff]] = await db.query("SELECT id FROM users WHERE username = 'user'");
  if (!staff) {
    await db.query("INSERT INTO users (name,username,password,role) VALUES (?,?,?,'user')", [
      "Staff Pengguna",
      "user",
      await bcrypt.hash("user123", 10),
    ]);
    console.log("User dibuat: user");
  }
  app.listen(PORT, () => console.log(`KASTA API berjalan di http://localhost:${PORT}`));
})();
