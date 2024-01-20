-- 
CREATE DATABASE jammed_db;
--
CREATE USER IF NOT EXISTS 
    jammed_user@localhost 
    IDENTIFIED BY 'pass_1402_WoRD^_Fo-rCurrEnT^Policy' ;
-- 
GRANT ALL PRIVILEGES ON jammed_db.* TO 'jammed_user'@'localhost' ;
-- 
FLUSH PRIVILEGES;
-- 
USE jammed_db;

-- 
CREATE TABLE seat_tbl (
    id          INT PRIMARY KEY, 
    reserved_by INT NULL
) 
ENGINE=InnoDB;

--
CREATE TABLE action_tbl (
    id          INT PRIMARY KEY,
    user_id     INT NULL,
    seat_id     INT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    CONSTRAINT fk_seat_id FOREIGN KEY (seat_id) REFERENCES seat_tbl(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) 
ENGINE=InnoDB;

--
ALTER TABLE action_tbl MODIFY 
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;