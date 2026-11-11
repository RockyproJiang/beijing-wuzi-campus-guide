-- 北京物资学院校园指南 · 数据库结构
-- MySQL 8.4 / utf8mb4

SET NAMES utf8mb4;
SET time_zone = '+08:00';

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(64)  NOT NULL DEFAULT '管理员',
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(32)  NOT NULL,
  name       VARCHAR(64)  NOT NULL,
  icon       VARCHAR(128) NOT NULL DEFAULT 'fa-solid fa-building',
  bg_color   VARCHAR(16)  NOT NULL DEFAULT '#D8F3DC',
  color      VARCHAR(16)  NOT NULL DEFAULT '#1B4332',
  sort_order INT          NOT NULL DEFAULT 0,
  deleted_at DATETIME     NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_deleted (deleted_at),
  KEY idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS buildings (
  id            VARCHAR(32)  NOT NULL,
  category_id   VARCHAR(32)  NOT NULL,
  name          VARCHAR(128) NOT NULL,
  sub           VARCHAR(255) NOT NULL DEFAULT '',
  intro         TEXT         NULL,
  icon          VARCHAR(128) NOT NULL DEFAULT 'fa-solid fa-building',
  bg_color      VARCHAR(16)  NOT NULL DEFAULT '#D8F3DC',
  color         VARCHAR(16)  NOT NULL DEFAULT '#1B4332',
  map_x         DECIMAL(7,3) NULL,
  map_y         DECIMAL(7,3) NULL,
  map_hidden    TINYINT(1)   NOT NULL DEFAULT 0,
  group_name    VARCHAR(64)  NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  info          JSON         NULL,
  equipment     JSON         NULL,
  floors        JSON         NULL,
  schedule      TEXT         NULL,
  contacts      JSON         NULL,
  surroundings  JSON         NULL,
  timetable     JSON         NULL,
  model_objects JSON         NULL,
  pin_x         DECIMAL(9,2) NULL,
  pin_z         DECIMAL(9,2) NULL,
  regions       JSON         NULL,
  surface_points JSON        NULL,
  deleted_at    DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_buildings_category (category_id),
  KEY idx_buildings_deleted (deleted_at),
  KEY idx_buildings_sort (category_id, sort_order),
  CONSTRAINT fk_buildings_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendar_meta (
  id         TINYINT      NOT NULL DEFAULT 1,
  title      VARCHAR(128) NOT NULL DEFAULT '',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendar_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event      VARCHAR(128) NOT NULL,
  date_label VARCHAR(128) NOT NULL DEFAULT '',
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_calendar_items_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tips (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  content    VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tips_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS search_aliases (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  keyword      VARCHAR(64)  NOT NULL,
  building_ids JSON         NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_alias_keyword (keyword),
  KEY idx_alias_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  k          VARCHAR(64) NOT NULL,
  v          JSON        NULL,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id   INT UNSIGNED    NULL,
  username   VARCHAR(64)     NOT NULL DEFAULT '',
  action     VARCHAR(32)     NOT NULL,
  entity     VARCHAR(32)     NOT NULL DEFAULT '',
  entity_id  VARCHAR(64)     NOT NULL DEFAULT '',
  detail     JSON            NULL,
  ip         VARCHAR(64)     NOT NULL DEFAULT '',
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_entity (entity, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO calendar_meta (id, title) VALUES (1, '')
ON DUPLICATE KEY UPDATE id = id;
