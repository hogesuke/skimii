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
  name NVARCHAR(32),
  official CHAR(1), -- 0: ユーザ 1: 公式
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users_fields (
  user_id INT,
  field_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, field_id)
);

CREATE TABLE IF NOT EXISTS checks (
  id INT NOT NULL AUTO_INCREMENT,
  url NVARCHAR(1024) NOT NULL,
  title NVARCHAR(512),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users_checks (
  user_id INT,
  check_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, check_id)
);

CREATE TABLE IF NOT EXISTS laters (
  id INT NOT NULL AUTO_INCREMENT,
  url NVARCHAR(1024) NOT NULL,
  title NVARCHAR(512),
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users_laters (
  user_id INT,
  laters_id INT,
  created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, laters_id)
);
