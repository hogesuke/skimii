CREATE DATABASE IF NOT EXISTS skimii;

USE skimii;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  provider_id BIGINT NOT NULL,
  provider_name VARCHAR(32),
  raw_name VARCHAR(32),
  name VARCHAR(32),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  bookmark_threshold INT,
  hotentry_days INT,
  later_days INT,
  dashboard_count INT,
  sort INT, -- 0: 新着(recent) 1: 人気(popular)
  visible_marked INT, -- 0: 表示しない 1: 表示する
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tags (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) UNIQUE,
  official CHAR(1), -- 0: ユーザ 1: 公式
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tags_users (
  user_id INT,
  tag_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tag_id)
);

CREATE TABLE IF NOT EXISTS entries (
  id INT NOT NULL AUTO_INCREMENT,
  url VARCHAR(1024) NOT NULL,
  title VARCHAR(256),
  description VARCHAR(512),
  thumbnail_url VARCHAR(1024),
  favicon_url VARCHAR(1024),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS checks (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  entry_id INT,
  hotentry_date DATE,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS laters (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  entry_id INT,
  hotentry_date DATE,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
