-- 北京物资学院校园指南 · v1.7 迁移：建筑别称
-- MySQL 8.4 / utf8mb4
-- 幂等：可重复执行

SET NAMES utf8mb4;

/* 每栋楼自己的别称（多个），搜索时一起匹配 */
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS aliases JSON NULL AFTER sub;
