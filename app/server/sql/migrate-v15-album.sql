-- 北京物资学院校园指南 · v1.5 迁移：楼体相册
-- MySQL 8.4 / utf8mb4
-- 幂等：可重复执行

SET NAMES utf8mb4;

/* 文件夹：管理员按「建筑 / 楼栋 / 场景」自由建立 */
CREATE TABLE IF NOT EXISTS album_folders (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(64)  NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  sort_order  INT          NOT NULL DEFAULT 0,
  deleted_at  DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_album_folders_deleted (deleted_at),
  KEY idx_album_folders_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* 照片：一张照片可归属一个文件夹，也可直接挂在建筑上 */
CREATE TABLE IF NOT EXISTS album_photos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  folder_id     INT UNSIGNED NULL,
  building_id   VARCHAR(32)  NULL,
  title         VARCHAR(128) NOT NULL DEFAULT '',
  caption       VARCHAR(500) NOT NULL DEFAULT '',
  file_path     VARCHAR(255) NOT NULL,
  thumb_path    VARCHAR(255) NOT NULL DEFAULT '',
  width         INT UNSIGNED NOT NULL DEFAULT 0,
  height        INT UNSIGNED NOT NULL DEFAULT 0,
  size_bytes    INT UNSIGNED NOT NULL DEFAULT 0,
  orig_bytes    INT UNSIGNED NOT NULL DEFAULT 0,
  source        ENUM('admin','wechat','other') NOT NULL DEFAULT 'wechat',
  sort_order    INT          NOT NULL DEFAULT 0,
  deleted_at    DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_album_photos_folder (folder_id),
  KEY idx_album_photos_building (building_id),
  KEY idx_album_photos_deleted (deleted_at),
  KEY idx_album_photos_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* 位置投稿：补充管理员的处理备注，便于「标记已处理后去编辑器改」的流程
   （MySQL 的 ALTER TABLE 不支持 ADD COLUMN IF NOT EXISTS，重复执行会报 1060，
     迁移脚本会忽略这个错误码） */
ALTER TABLE location_submissions ADD COLUMN admin_note VARCHAR(500) NOT NULL DEFAULT '' AFTER status;