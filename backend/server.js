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

/* ---------- helpers & permissions ---------- */
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
  try {
    req.user = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Sesi berakhir, silakan masuk lagi" });
  }
};

const isSuperAdmin = (u) => !u ? false : u.role === "superadmin" || (!u.kabupaten && u.role === "admin");
const canManageData = (u) => !u ? false : isSuperAdmin(u) || u.role === "admin";

const canEditOnly = (req, res, next) => {
  if (canManageData(req.user)) return next();
  res.status(403).json({ success: false, message: "Hanya Administrator yang memiliki akses untuk menginput atau mengubah berkas" });
};

const userManagementOnly = (req, res, next) => {
  if (canManageData(req.user)) return next();
  res.status(403).json({ success: false, message: "Anda tidak memiliki hak akses untuk mengelola pengguna" });
};

/* ---------- Wilayah Indonesia API (wilayah.id) & Cache ---------- */
const wilayahCache = new Map();
async function fetchWilayah(endpoint) {
  if (wilayahCache.has(endpoint)) return wilayahCache.get(endpoint);
  const resp = await fetch(`https://wilayah.id/api/${endpoint}`);
  if (!resp.ok) throw fail(resp.status, `Gagal mengambil data wilayah resmi: ${resp.statusText}`);
  const json = await resp.json();
  wilayahCache.set(endpoint, json);
  return json;
}

app.get("/api/wilayah/provinces", wrap(async (req, res) => {
  const data = await fetchWilayah("provinces.json");
  let list = data.data || [];
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.includes(q));
  }
  ok(res, list);
}));

app.get("/api/wilayah/regencies/:provinceCode", wrap(async (req, res) => {
  const data = await fetchWilayah(`regencies/${req.params.provinceCode}.json`);
  let list = data.data || [];
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.code.includes(q));
  }
  ok(res, list);
}));

app.get("/api/wilayah/districts/:regencyCode", wrap(async (req, res) => {
  const data = await fetchWilayah(`districts/${req.params.regencyCode}.json`);
  let list = data.data || [];
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter((d) => d.name.toLowerCase().includes(q) || d.code.includes(q));
  }
  ok(res, list);
}));

app.get("/api/wilayah/villages/:districtCode", wrap(async (req, res) => {
  const data = await fetchWilayah(`villages/${req.params.districtCode}.json`);
  let list = data.data || [];
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter((v) => v.name.toLowerCase().includes(q) || v.code.includes(q));
  }
  ok(res, list);
}));

let allRegenciesCache = null;
app.get("/api/wilayah/all-regencies", wrap(async (req, res) => {
  if (!allRegenciesCache) {
    const provs = await fetchWilayah("provinces.json");
    const all = await Promise.all(
      (provs.data || []).map(async (p) => {
        try {
          const regs = await fetchWilayah(`regencies/${p.code}.json`);
          return (regs.data || []).map((r) => ({
            code: r.code,
            name: r.name,
            provinceCode: p.code,
            provinceName: p.name,
          }));
        } catch {
          return [];
        }
      })
    );
    allRegenciesCache = all.flat();
  }
  let list = allRegenciesCache;
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.provinceName.toLowerCase().includes(q) ||
        r.code.includes(q)
    );
  }
  ok(res, list);
}));

app.get("/api/wilayah/lookup", wrap(async (req, res) => {
  const name = (req.query.regencyName || "").trim().toLowerCase();
  if (!name) return ok(res, null);
  if (!allRegenciesCache) {
    const provs = await fetchWilayah("provinces.json");
    const all = await Promise.all(
      (provs.data || []).map(async (p) => {
        try {
          const regs = await fetchWilayah(`regencies/${p.code}.json`);
          return (regs.data || []).map((r) => ({
            code: r.code,
            name: r.name,
            provinceCode: p.code,
            provinceName: p.name,
          }));
        } catch {
          return [];
        }
      })
    );
    allRegenciesCache = all.flat();
  }
  const found = allRegenciesCache.find(
    (r) => r.name.toLowerCase() === name || r.name.toLowerCase().includes(name) || name.includes(r.name.toLowerCase())
  );
  ok(res, found || null);
}));

/* ---------- paged listing with wilayah scoping ---------- */
async function paged(req, res, { table, search, filters = [], sorts = [], select = "*", json = [] }) {
  const page = Math.max(+req.query.page || 1, 1);
  const limit = [10, 25, 50, 100].includes(+req.query.limit) ? +req.query.limit : 10;
  const where = [], args = [];

  // Wilayah scoping
  if (["sengketa", "perkara", "users"].includes(table)) {
    if (!isSuperAdmin(req.user) && req.user.kabupaten) {
      where.push("kabupaten = ?");
      args.push(req.user.kabupaten);
    } else {
      if (req.query.kabupaten) {
        where.push("kabupaten = ?");
        args.push(req.query.kabupaten);
      }
      if (req.query.provinsi) {
        where.push("provinsi = ?");
        args.push(req.query.provinsi);
      }
    }
  }

  if (req.query.search && search?.length) {
    where.push("(" + search.map((c) => `CAST(${c} AS CHAR) LIKE ?`).join(" OR ") + ")");
    search.forEach(() => args.push(`%${req.query.search}%`));
  }
  filters.forEach((f) => {
    if (req.query[f]) {
      where.push(`${f} = ?`);
      args.push(req.query[f]);
    }
  });

  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const sort = sorts.includes(req.query.sort) ? req.query.sort : "id";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM ${table} ${w}`, args);
  const [rows] = await db.query(
    `SELECT ${select} FROM ${table} ${w} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
    [...args, limit, (page - 1) * limit]
  );
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
  const { username, password } = req.body;
  const [[u]] = await db.query("SELECT * FROM users WHERE username = ?", [username || ""]);
  if (!u || !(await bcrypt.compare(password || "", u.password))) throw fail(401, "Username atau password salah");
  const user = {
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    provinsi: u.provinsi || null,
    kabupaten: u.kabupaten || null,
  };
  ok(res, { token: jwt.sign(user, JWT_SECRET, { expiresIn: "12h" }), user });
}));

app.get("/api/auth/profile", auth, wrap(async (req, res) => {
  const [[u]] = await db.query("SELECT id, name, username, role, provinsi, kabupaten FROM users WHERE id = ?", [req.user.id]);
  if (!u) throw fail(404, "Pengguna tidak ditemukan");
  ok(res, u);
}));

/* ---------- users management ---------- */
app.get("/api/users/check-admin", auth, wrap(async (req, res) => {
  const kabupaten = (req.query.kabupaten || "").trim();
  const excludeId = req.query.excludeId ? +req.query.excludeId : null;
  if (!kabupaten) return ok(res, { exists: false });

  let q = "SELECT id, name, username FROM users WHERE role = 'admin' AND kabupaten = ?";
  const args = [kabupaten];
  if (excludeId) {
    q += " AND id <> ?";
    args.push(excludeId);
  }
  const [[existing]] = await db.query(q, args);
  ok(res, { exists: !!existing, currentAdmin: existing || null });
}));

app.get("/api/users", auth, userManagementOnly, wrap((req, res) =>
  paged(req, res, {
    table: "users",
    select: "id,name,username,role,provinsi,kabupaten,created_at",
    search: ["name", "username", "kabupaten", "provinsi"],
    filters: ["role", "kabupaten", "provinsi"],
    sorts: ["id", "name", "username", "role", "kabupaten"],
  })
));

app.post("/api/users", auth, userManagementOnly, wrap(async (req, res) => {
  const { name, username, password } = clean(req.body);
  let role = req.body.role || "user";
  let provinsi = clean(req.body.provinsi) || null;
  let kabupaten = clean(req.body.kabupaten) || null;

  if (!name || !username || !password || password.length < 6) {
    throw fail(400, "Nama, username, dan password (min. 6 karakter) wajib diisi");
  }

  // Non-superadmin (Admin Wilayah) can only create 'user' for their own kabupaten
  if (!isSuperAdmin(req.user)) {
    role = "user";
    provinsi = req.user.provinsi;
    kabupaten = req.user.kabupaten;
  }

  // Role validation
  if (!["superadmin", "admin", "user"].includes(role)) {
    role = "user";
  }

  // If role is superadmin, clear region
  if (role === "superadmin") {
    provinsi = null;
    kabupaten = null;
  } else {
    if (!kabupaten) throw fail(400, "Kabupaten/Kota wajib dipilih untuk Administrator Wilayah atau Staff Pengguna");
  }

  // Constraint: Maximum 1 Administrator per Kabupaten!
  if (role === "admin" && kabupaten) {
    const [[existingAdmin]] = await db.query(
      "SELECT id, name, username FROM users WHERE role = 'admin' AND kabupaten = ?",
      [kabupaten]
    );
    if (existingAdmin) {
      throw fail(
        400,
        `Kabupaten ${kabupaten} sudah memiliki 1 Administrator Wilayah (${existingAdmin.name} - @${existingAdmin.username}). Sesuai ketentuan sistem, hanya diperbolehkan 1 administrator per kabupaten.`
      );
    }
  }

  const [[dup]] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
  if (dup) throw fail(409, "Username sudah dipakai");

  await db.query(
    "INSERT INTO users (name, username, password, role, provinsi, kabupaten) VALUES (?, ?, ?, ?, ?, ?)",
    [name, username, await bcrypt.hash(password, 10), role, provinsi, kabupaten]
  );
  ok(res, true);
}));

app.put("/api/users/:id", auth, userManagementOnly, wrap(async (req, res) => {
  const targetId = +req.params.id;
  const [[targetUser]] = await db.query("SELECT * FROM users WHERE id = ?", [targetId]);
  if (!targetUser) throw fail(404, "Pengguna tidak ditemukan");

  const { name, username } = clean(req.body);
  if (!name || !username) throw fail(400, "Nama dan username wajib diisi");

  let role = req.body.role || targetUser.role;
  let provinsi = req.body.provinsi !== undefined ? clean(req.body.provinsi) : targetUser.provinsi;
  let kabupaten = req.body.kabupaten !== undefined ? clean(req.body.kabupaten) : targetUser.kabupaten;

  if (!isSuperAdmin(req.user)) {
    if (targetUser.kabupaten !== req.user.kabupaten) {
      throw fail(403, "Anda tidak dapat mengubah pengguna di luar wilayah kabupaten Anda");
    }
    // Admin Wilayah cannot promote to superadmin or admin
    role = "user";
    provinsi = req.user.provinsi;
    kabupaten = req.user.kabupaten;
  }

  if (role === "superadmin") {
    provinsi = null;
    kabupaten = null;
  } else if (!kabupaten) {
    throw fail(400, "Kabupaten/Kota wajib diisi untuk Administrator Wilayah atau Staff Pengguna");
  }

  // Constraint: Maximum 1 Administrator per Kabupaten
  if (role === "admin" && kabupaten) {
    const [[existingAdmin]] = await db.query(
      "SELECT id, name, username FROM users WHERE role = 'admin' AND kabupaten = ? AND id <> ?",
      [kabupaten, targetId]
    );
    if (existingAdmin) {
      throw fail(
        400,
        `Kabupaten ${kabupaten} sudah memiliki 1 Administrator Wilayah (${existingAdmin.name} - @${existingAdmin.username}). Sesuai ketentuan sistem, hanya diperbolehkan 1 administrator per kabupaten.`
      );
    }
  }

  const [[dup]] = await db.query("SELECT id FROM users WHERE username = ? AND id <> ?", [username, targetId]);
  if (dup) throw fail(409, "Username sudah dipakai");

  await db.query(
    "UPDATE users SET name=?, username=?, role=?, provinsi=?, kabupaten=? WHERE id=?",
    [name, username, role, provinsi, kabupaten, targetId]
  );

  if (req.body.password) {
    if (req.body.password.length < 6) throw fail(400, "Password minimal 6 karakter");
    await db.query("UPDATE users SET password=? WHERE id=?", [await bcrypt.hash(req.body.password, 10), targetId]);
  }
  ok(res, true);
}));

app.delete("/api/users/:id", auth, userManagementOnly, wrap(async (req, res) => {
  const targetId = +req.params.id;
  if (targetId === req.user.id) throw fail(400, "Tidak dapat menghapus akun sendiri");

  const [[targetUser]] = await db.query("SELECT * FROM users WHERE id = ?", [targetId]);
  if (!targetUser) throw fail(404, "Pengguna tidak ditemukan");

  if (!isSuperAdmin(req.user)) {
    if (targetUser.kabupaten !== req.user.kabupaten || targetUser.role !== "user") {
      throw fail(403, "Anda hanya dapat menghapus staff pengguna di wilayah kabupaten Anda");
    }
  }

  await db.query("DELETE FROM users WHERE id = ?", [targetId]);
  ok(res, true);
}));

/* ---------- dashboard & map with wilayah scoping ---------- */
app.get("/api/dashboard", auth, wrap(async (req, res) => {
  let sw = "", pw = "", args = [];
  if (!isSuperAdmin(req.user) && req.user.kabupaten) {
    sw = "WHERE kabupaten = ?";
    pw = "WHERE kabupaten = ?";
    args = [req.user.kabupaten];
  } else if (req.query.kabupaten) {
    sw = "WHERE kabupaten = ?";
    pw = "WHERE kabupaten = ?";
    args = [req.query.kabupaten];
  }

  const [s] = await db.query(`SELECT tahun, COUNT(*) total FROM sengketa ${sw} GROUP BY tahun`, args);
  const [p] = await db.query(`SELECT tahun, COUNT(*) total FROM perkara ${pw} GROUP BY tahun`, args);
  const years = [...new Set([...s, ...p].map((r) => r.tahun))].sort((a, b) => b - a);

  ok(res, {
    scope: !isSuperAdmin(req.user) ? req.user.kabupaten : req.query.kabupaten || "Semua Wilayah",
    totals: {
      sengketa: s.reduce((a, r) => a + r.total, 0),
      perkara: p.reduce((a, r) => a + r.total, 0),
    },
    chart: [...years].reverse().map((tahun) => ({
      tahun: String(tahun),
      sengketa: s.find((r) => r.tahun === tahun)?.total || 0,
      perkara: p.find((r) => r.tahun === tahun)?.total || 0,
    })),
    years: years.map((tahun) => ({
      tahun,
      sengketa: s.find((r) => r.tahun === tahun)?.total || 0,
      perkara: p.find((r) => r.tahun === tahun)?.total || 0,
    })),
  });
}));

app.get("/api/map", auth, wrap(async (req, res) => {
  let sw = "WHERE lat IS NOT NULL", pw = "WHERE lat IS NOT NULL", args = [];
  if (!isSuperAdmin(req.user) && req.user.kabupaten) {
    sw += " AND kabupaten = ?";
    pw += " AND kabupaten = ?";
    args = [req.user.kabupaten];
  } else if (req.query.kabupaten) {
    sw += " AND kabupaten = ?";
    pw += " AND kabupaten = ?";
    args = [req.query.kabupaten];
  }

  const [s] = await db.query(
    `SELECT id,'sengketa' AS type,tahun,no_registrasi AS nomor,pengadu,teradu,dusun,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,klasifikasi,tipologi,status FROM sengketa ${sw}`,
    args
  );
  const [p] = await db.query(
    `SELECT id,'perkara' AS type,tahun,no_perkara AS nomor,penggugat,tergugat,turut_tergugat,dusun,desa,kecamatan,kabupaten,provinsi,alamat,lat,lng,pengadilan,status,pemenang FROM perkara ${pw}`,
    args
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

/* ---------- sengketa & perkara resources ---------- */
const LOC = ["dusun", "desa", "kecamatan", "kabupaten", "provinsi", "alamat", "lat", "lng"];
const RESOURCES = {
  sengketa: {
    json: ["pengadu", "teradu", "dokumen"],
    num: "no_registrasi",
    cols: ["tahun", "no_registrasi", "pengadu", "teradu", ...LOC, "akar_masalah", "pokok_masalah", "tipologi", "klasifikasi", "bentuk_penanganan", "status", "dokumen"],
    search: ["no_registrasi", "pengadu", "teradu", "desa", "kecamatan", "kabupaten", "provinsi"],
    filters: ["tahun", "klasifikasi", "status", "tipologi"],
  },
  perkara: {
    json: ["penggugat", "tergugat", "turut_tergugat", "dokumen"],
    num: "no_perkara",
    cols: ["tahun", "no_perkara", "pengadilan", "penggugat", "tergugat", "turut_tergugat", ...LOC, "status", "tingkat_pertama_no", "tingkat_pertama_amar", "banding_no", "banding_amar", "kasasi_no", "kasasi_amar", "pk_no", "pk_amar", "eksekusi_no", "pemenang", "dokumen"],
    search: ["no_perkara", "penggugat", "tergugat", "turut_tergugat", "desa", "kecamatan", "kabupaten", "provinsi"],
    filters: ["tahun", "status", "pengadilan"],
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
  const values = (body, files, user) => {
    const data = clean(body);
    let existingDocs = data.dokumen || [];
    if (typeof existingDocs === "string") {
      try { existingDocs = JSON.parse(existingDocs); } catch { existingDocs = []; }
    }
    data.dokumen = [...(Array.isArray(existingDocs) ? existingDocs : []), ...files.map((f) => ({ name: f.originalname, url: `/uploads/${f.filename}` }))];
    if (!data.tahun || !data[cfg.num]) throw fail(400, "Tahun dan nomor wajib diisi");

    // Strictly enforce wilayah scoping for Admin Wilayah
    if (!isSuperAdmin(user) && user.kabupaten) {
      data.kabupaten = user.kabupaten;
      if (user.provinsi) data.provinsi = user.provinsi;
    }

    if (!data.kabupaten) throw fail(400, "Kabupaten/Kota lokasi berkas wajib diisi");

    return cfg.cols.map((c) => cfg.json.includes(c) ? JSON.stringify(data[c] ?? []) : data[c] === "" || data[c] === undefined ? null : data[c]);
  };

  const parse = (req) => { try { return JSON.parse(req.body.data || "{}"); } catch { throw fail(400, "Data tidak valid"); } };

  app.get(base, auth, wrap((req, res) =>
    paged(req, res, {
      table: name,
      search: cfg.search,
      filters: cfg.filters,
      sorts: ["id", "tahun", cfg.num, "status", "kabupaten", "created_at"],
      json: cfg.json,
    })
  ));

  app.get(`${base}/years`, auth, wrap(async (req, res) => {
    let q = `SELECT tahun, COUNT(*) total FROM ${name}`;
    const args = [];
    if (!isSuperAdmin(req.user) && req.user.kabupaten) {
      q += ` WHERE kabupaten = ?`;
      args.push(req.user.kabupaten);
    } else if (req.query.kabupaten) {
      q += ` WHERE kabupaten = ?`;
      args.push(req.query.kabupaten);
    }
    q += ` GROUP BY tahun ORDER BY tahun DESC`;
    const [rows] = await db.query(q, args);
    ok(res, rows);
  }));

  app.get(`${base}/export-data`, auth, wrap(async (req, res) => {
    const where = [], args = [];
    if (!isSuperAdmin(req.user) && req.user.kabupaten) {
      where.push("kabupaten = ?");
      args.push(req.user.kabupaten);
    } else if (req.query.kabupaten) {
      where.push("kabupaten = ?");
      args.push(req.query.kabupaten);
    }
    if (req.query.tahun) {
      where.push("tahun = ?");
      args.push(+req.query.tahun);
    }
    const w = where.length ? "WHERE " + where.join(" AND ") : "";
    const [rows] = await db.query(`SELECT * FROM ${name} ${w} ORDER BY tahun DESC, id DESC LIMIT 10000`, args);
    const parsed = rows.map((r) => {
      const item = { ...r };
      cfg.json.forEach((col) => {
        if (typeof item[col] === "string") {
          try { item[col] = JSON.parse(item[col]); } catch { item[col] = []; }
        }
      });
      return item;
    });
    ok(res, parsed);
  }));

  app.post(`${base}/bulk-import`, auth, canEditOnly, wrap(async (req, res) => {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) throw fail(400, "Tidak ada data yang dikirim untuk diimpor");

    let count = 0;
    for (const item of items) {
      const data = clean(item);
      if (!data.tahun || !data[cfg.num]) continue;

      if (!isSuperAdmin(req.user) && req.user.kabupaten) {
        data.kabupaten = req.user.kabupaten;
        if (req.user.provinsi) data.provinsi = req.user.provinsi;
      }
      if (!data.kabupaten) continue;

      cfg.json.forEach((col) => {
        if (col === "dokumen") {
          data[col] = Array.isArray(data[col]) ? data[col] : [];
        } else if (typeof data[col] === "string") {
          try {
            data[col] = JSON.parse(data[col]);
          } catch {
            data[col] = [{ nama: data[col], jenis: "Perorangan" }];
          }
        } else if (!Array.isArray(data[col])) {
          data[col] = [];
        }
      });

      const alamat = [data.dusun, data.desa, data.kecamatan, data.kabupaten, data.provinsi].filter(Boolean).join(", ");
      data.alamat = data.alamat || alamat;

      const v = cfg.cols.map((c) =>
        cfg.json.includes(c) ? JSON.stringify(data[c] ?? []) : data[c] === "" || data[c] === undefined ? null : data[c]
      );

      await db.query(`INSERT INTO ${name} (${cfg.cols.join(",")}) VALUES (${cfg.cols.map(() => "?").join(",")})`, v);
      count++;
    }

    ok(res, { count });
  }));

  app.get(`${base}/:id`, auth, wrap(async (req, res) => {
    const [[row]] = await db.query(`SELECT * FROM ${name} WHERE id = ?`, [req.params.id]);
    if (!row) throw fail(404, "Data tidak ditemukan");

    // Scoping check
    if (!isSuperAdmin(req.user) && req.user.kabupaten && row.kabupaten !== req.user.kabupaten) {
      throw fail(403, "Anda tidak memiliki izin untuk melihat berkas di luar wilayah kabupaten Anda");
    }

    const item = { ...row };
    cfg.json.forEach((col) => {
      if (typeof item[col] === "string") {
        try { item[col] = JSON.parse(item[col]); } catch { item[col] = []; }
      }
    });
    ok(res, item);
  }));

  app.post(base, auth, canEditOnly, upload.array("files", 10), wrap(async (req, res) => {
    const v = values(parse(req), req.files || [], req.user);
    await db.query(`INSERT INTO ${name} (${cfg.cols.join(",")}) VALUES (${cfg.cols.map(() => "?").join(",")})`, v);
    ok(res, true);
  }));

  app.put(`${base}/:id`, auth, canEditOnly, upload.array("files", 10), wrap(async (req, res) => {
    const [[existing]] = await db.query(`SELECT id, kabupaten FROM ${name} WHERE id = ?`, [req.params.id]);
    if (!existing) throw fail(404, "Data tidak ditemukan");

    // Wilayah scoping check
    if (!isSuperAdmin(req.user) && req.user.kabupaten && existing.kabupaten !== req.user.kabupaten) {
      throw fail(403, "Anda tidak berhak mengubah berkas di luar wilayah kabupaten Anda");
    }

    const v = values(parse(req), req.files || [], req.user);
    await db.query(`UPDATE ${name} SET ${cfg.cols.map((c) => `${c}=?`).join(",")} WHERE id=?`, [...v, req.params.id]);
    ok(res, true);
  }));

  app.delete(`${base}/:id`, auth, canEditOnly, wrap(async (req, res) => {
    const [[existing]] = await db.query(`SELECT id, kabupaten FROM ${name} WHERE id = ?`, [req.params.id]);
    if (!existing) throw fail(404, "Data tidak ditemukan");

    if (!isSuperAdmin(req.user) && req.user.kabupaten && existing.kabupaten !== req.user.kabupaten) {
      throw fail(403, "Anda tidak berhak menghapus berkas di luar wilayah kabupaten Anda");
    }

    await db.query(`DELETE FROM ${name} WHERE id = ?`, [req.params.id]);
    ok(res, true);
  }));
});

app.use((err, req, res, next) => res.status(err.status || 400).json({ success: false, message: err.message || "Permintaan tidak valid" }));

/* ---------- startup & auto-migration ---------- */
(async () => {
  try {
    const setup = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
    await setup.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4;`);
    await setup.end();
  } catch (err) {
    console.warn("DB setup check:", err.message);
  }

  // Ensure tables and columns exist
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('superadmin','admin','user') NOT NULL DEFAULT 'user',
        provinsi VARCHAR(100) NULL,
        kabupaten VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (kabupaten),
        INDEX (role)
      );
    `);
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('superadmin','admin','user') NOT NULL DEFAULT 'user';");
  } catch (e) {
    console.warn("Table users setup:", e.message);
  }

  const [[{ n }]] = await db.query("SELECT COUNT(*) n FROM users");
  if (!n) {
    await db.query(
      "INSERT INTO users (name,username,password,role) VALUES (?,?,?,'superadmin')",
      ["Administrator Pusat", ADMIN_USER, await bcrypt.hash(ADMIN_PASS, 10)]
    );
    console.log(`Superadmin dibuat: ${ADMIN_USER}`);
  }

  app.listen(PORT, () => console.log(`KASTA API berjalan di http://localhost:${PORT}`));
})();
