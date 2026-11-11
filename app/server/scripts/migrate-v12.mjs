import 'dotenv/config'
import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
})

async function hasColumn(table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [process.env.DB_NAME, table, column]
  )
  return rows.length > 0
}

if (!(await hasColumn('buildings', 'regions'))) {
  await conn.query('ALTER TABLE buildings ADD COLUMN regions JSON NULL AFTER pin_z')
  console.log('[migrate] buildings.regions added')
}
if (!(await hasColumn('buildings', 'surface_points'))) {
  await conn.query('ALTER TABLE buildings ADD COLUMN surface_points JSON NULL AFTER regions')
  console.log('[migrate] buildings.surface_points added')
}

await conn.query(`
  CREATE TABLE IF NOT EXISTS location_submissions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    building_id   VARCHAR(32)  NULL,
    building_name VARCHAR(128) NOT NULL DEFAULT '',
    place_name    VARCHAR(128) NOT NULL DEFAULT '',
    pin_x         DECIMAL(9,2) NULL,
    pin_z         DECIMAL(9,2) NULL,
    type          VARCHAR(32)  NOT NULL DEFAULT 'correction',
    content       TEXT         NOT NULL,
    occurred_at   DATETIME     NULL,
    contact       VARCHAR(128) NOT NULL DEFAULT '',
    status        ENUM('pending','processed','ignored') NOT NULL DEFAULT 'pending',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_submissions_status (status, created_at),
    KEY idx_submissions_building (building_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)
console.log('[migrate] location_submissions ready')

await conn.end()
