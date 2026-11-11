-- v19：位置投稿支持「照片投稿」——发图、命名、匿名/署名，管理员审核通过后一键入库到楼体相册
ALTER TABLE location_submissions
  ADD COLUMN author_name VARCHAR(64) NOT NULL DEFAULT '' AFTER contact,
  ADD COLUMN photo_path VARCHAR(255) NOT NULL DEFAULT '' AFTER author_name,
  ADD COLUMN photo_thumb VARCHAR(255) NOT NULL DEFAULT '' AFTER photo_path,
  ADD COLUMN photo_width INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_thumb,
  ADD COLUMN photo_height INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_width,
  ADD COLUMN photo_bytes INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_height,
  ADD COLUMN published_photo_id INT UNSIGNED NULL AFTER photo_bytes;

ALTER TABLE location_submissions
  MODIFY COLUMN type ENUM('photo','correction','supplement','new','closed','moved','other') NOT NULL DEFAULT 'correction';