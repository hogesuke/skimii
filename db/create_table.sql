CREATE DATABASE IF NOT EXISTS testdb;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  provider_id BIGINT NOT NULL,
  provider_name VARCHAR(32),
  raw_name VARCHAR(32),
  name VARCHAR(32),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS fields (
  id INT NOT NULL AUTO_INCREMENT,
  name NVARCHAR(32) UNIQUE,
  official CHAR(1), -- 0: ユーザ 1: 公式
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS fields_users (
  user_id INT,
  field_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, field_id)
);

CREATE TABLE IF NOT EXISTS entries (
  id INT NOT NULL AUTO_INCREMENT,
  url NVARCHAR(1024) NOT NULL,
  title NVARCHAR(512),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS checks (
  user_id INT,
  entry_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entry_id)
);

CREATE TABLE IF NOT EXISTS laters (
  user_id INT,
  entry_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entry_id)
);
