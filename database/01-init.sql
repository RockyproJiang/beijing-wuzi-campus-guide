-- ============================================================
-- 北京物资学院 · 校园指南 v1.5
-- 数据库初始化：建库 + 建应用账号
--
-- 一般不需要手动执行本文件——deploy/deploy.sh 会读取 app/.env 里的
-- DB_NAME / DB_USER / DB_PASSWORD，替换下面的占位符后再执行，
-- 保证「建出来的账号」和「应用连库用的账号」始终一致。
--
-- 手动执行的话先把占位符换掉：
--     sed -e "s/__DB_NAME__/bwz_campus_guide/g" \
--         -e "s/__DB_USER__/bwz_app/g" \
--         -e "s/__DB_PASS__/你的密码/g" 01-init.sql | sudo mysql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `__DB_NAME__`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 应用账号：只授予本库权限
CREATE USER IF NOT EXISTS '__DB_USER__'@'localhost' IDENTIFIED BY '__DB_PASS__';
ALTER USER '__DB_USER__'@'localhost' IDENTIFIED BY '__DB_PASS__';
GRANT ALL PRIVILEGES ON `__DB_NAME__`.* TO '__DB_USER__'@'localhost';

-- 用 127.0.0.1 连库时 MySQL 认的是这个 host
CREATE USER IF NOT EXISTS '__DB_USER__'@'127.0.0.1' IDENTIFIED BY '__DB_PASS__';
ALTER USER '__DB_USER__'@'127.0.0.1' IDENTIFIED BY '__DB_PASS__';
GRANT ALL PRIVILEGES ON `__DB_NAME__`.* TO '__DB_USER__'@'127.0.0.1';

FLUSH PRIVILEGES;

-- 自检：mysql -u __DB_USER__ -p'__DB_PASS__' __DB_NAME__ -e "SHOW TABLES;"
