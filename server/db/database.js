import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'dividanselo.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id         TEXT PRIMARY KEY,
    room_id    TEXT NOT NULL,
    user_id    TEXT,
    name       TEXT NOT NULL,
    color      TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY,
    room_id     TEXT NOT NULL,
    description TEXT NOT NULL,
    amount      REAL NOT NULL,
    payer_id    TEXT NOT NULL,
    icon        TEXT NOT NULL,
    date        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    FOREIGN KEY (room_id)  REFERENCES rooms(id)        ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES participants(id)
  );

  CREATE TABLE IF NOT EXISTS expense_participants (
    expense_id     TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    PRIMARY KEY (expense_id, participant_id),
    FOREIGN KEY (expense_id)     REFERENCES expenses(id)     ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
  );
`);

export default db;
