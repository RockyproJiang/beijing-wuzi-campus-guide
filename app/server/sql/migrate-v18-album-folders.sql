-- 北京物资学院校园指南 · v1.8 迁移：相册文件夹绑定建筑
-- MySQL 8.4 / utf8mb4
-- 幂等：可重复执行（脚本先查 information_schema）

SET NAMES utf8mb4;

/* 文件夹可以绑定一栋建筑：绑定后就是「这栋楼的默认相册」，
   往这个文件夹里传的照片会自动挂到该建筑上 */
ALTER TABLE album_folders ADD COLUMN building_id VARCHAR(32) NULL AFTER description;
ALTER TABLE album_folders ADD KEY idx_album_folders_building (building_id);

/* 照片排序：同一文件夹内拖动排序用的连续序号，默认按 0 排，后端会重排 */
ALTER TABLE album_photos ADD KEY idx_album_photos_folder_sort (folder_id, sort_order);
