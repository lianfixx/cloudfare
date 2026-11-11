-- Esquema inicial de MILLA ABOGADOS en D1 (SQLite).
-- Adaptado de BACKEND_SPEC.md del repo millabogados.

CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  materia TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','revisada','respondida','archivada')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON consultas (created_at DESC);

CREATE TABLE IF NOT EXISTS citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio TEXT NOT NULL UNIQUE,
  fecha TEXT NOT NULL,           -- AAAA-MM-DD (hora de Ciudad de México)
  hora TEXT NOT NULL,            -- HH:MM
  tipo TEXT NOT NULL,
  abogado TEXT NOT NULL,         -- titular | socio | ambos
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  materia TEXT,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','confirmada','cancelada','atendida')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas (fecha, hora);

-- Un renglón por abogado ocupado. La llave primaria es lo que impide dos citas
-- a la misma hora: la base de datos rechaza el segundo intento aunque lleguen juntos.
CREATE TABLE IF NOT EXISTS cita_bloques (
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  abogado TEXT NOT NULL CHECK (abogado IN ('titular','socio')),
  cita_id INTEGER NOT NULL REFERENCES citas(id),
  PRIMARY KEY (fecha, hora, abogado)
);

-- Enlaces cortos y sus clics por día.
CREATE TABLE IF NOT EXISTS enlaces (
  slug TEXT PRIMARY KEY,
  destino TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS enlace_clics (
  slug TEXT NOT NULL,
  dia TEXT NOT NULL,
  clics INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, dia)
);

-- Límite de intentos por visitante. Se guarda una huella, no la IP.
CREATE TABLE IF NOT EXISTS limites (
  clave TEXT NOT NULL,
  ventana TEXT NOT NULL,
  cuenta INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clave, ventana)
);
