-- dialect: MySQL

-- Schema is almost identical to North-wind database.

CREATE DATABASE Market;
CREATE USER IF NOT EXISTS 'playground_user'@'localhost'
    IDENTIFIED BY 'pass_987_WoRD^_FoRCurrEnT^Policy';

GRANT ALL PRIVILEGES ON Market.* TO playground_user@localhost;
FLUSH PRIVILEGES;
USE Market;


---- 🌍
CREATE TABLE region (
    region_id INT NOT NULL,
    region_description VARCHAR(50) NOT NULL,
    PRIMARY KEY (region_id)
) ENGINE=INNODB;


CREATE TABLE territory (
    territory_id  VARCHAR(20) NOT NULL,
    region_id     INT NOT NULL,
    territory_description  VARCHAR(50) NOT NULL,
    PRIMARY KEY (territory_id),
    FOREIGN KEY (region_id) REFERENCES region(region_id)
) ENGINE=INNODB;


CREATE TABLE customer (
    customer_id   INT AUTO_INCREMENT NOT NULL,
    company_name  VARCHAR(40) NOT NULL,
    contact_name  VARCHAR(30) NULL,
    address       VARCHAR(60) NULL,
    city          VARCHAR(15) NULL,
    region        VARCHAR(15) NULL,
    postal_code   VARCHAR(10) NULL,
    country       VARCHAR(15) NULL,
    phone         VARCHAR(24) NULL,
    mobile        VARCHAR(24) NULL,
    PRIMARY KEY (customer_id)
) ENGINE=INNODB;


---- 👷
CREATE TABLE employee (
    employee_id INT AUTO_INCREMENT NOT NULL,
    lastname    VARCHAR(20) NOT NULL,
    firstname   VARCHAR(10) NOT NULL,
    title       VARCHAR(30) NULL,
    birth_date  DATETIME NULL,
    hire_date   DATETIME NULL,
    address     VARCHAR(60) NULL,
    city        VARCHAR(15) NULL,
    region      VARCHAR(15) NULL,
    postal_code VARCHAR(10) NULL,
    country     VARCHAR(15) NULL,
    mobile      VARCHAR(24) NULL,
    manager_id  INT NULL,
    PRIMARY KEY (employee_id)
 ) ENGINE=INNODB;


CREATE TABLE employee_territory (
    employee_id     INT AUTO_INCREMENT NOT NULL,
    territory_id    VARCHAR(20) NOT NULL,
    PRIMARY KEY (employee_id, territory_id),
    FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
    FOREIGN KEY (territory_id) REFERENCES territory (territory_id)
) ENGINE=INNODB;


---- 🚚
CREATE TABLE supplier (
    supplier_id     INT AUTO_INCREMENT NOT NULL,
    company_name    VARCHAR(40) NOT NULL,
    contact_name    VARCHAR(30) NULL,
    contact_title   VARCHAR(30) NULL,
    address         VARCHAR(60) NULL,
    city        VARCHAR(15) NULL,
    region      VARCHAR(15) NULL,
    postal_code VARCHAR(10) NULL,
    country     VARCHAR(15) NULL,
    phone       VARCHAR(24) NULL,
    email       VARCHAR(225) NULL,
    PRIMARY KEY (supplier_id)
) ENGINE=INNODB;


CREATE TABLE category (
    category_id   INT AUTO_INCREMENT NOT NULL, 
    category_name VARCHAR(15) NOT NULL,
    picture       BLOB NULL,
    category_description   TEXT NULL,
    PRIMARY KEY (category_id)
) ENGINE=INNODB;


---- 🎁
CREATE TABLE product (
    product_id      INT AUTO_INCREMENT NOT NULL,
    product_name    VARCHAR(40) NOT NULL,
    supplier_id     INT NULL,
    category_id     INT NULL,
    unit_price      DECIMAL(10, 2) NULL,
    units_in_stock  SMALLINT NULL,
    units_on_order  SMALLINT NULL,
    reorder_level   SMALLINT NULL,
    quantity_per_unit VARCHAR(20) NULL,
    discontinued CHAR(1) NOT NULL,
    PRIMARY KEY (product_id),
    FOREIGN KEY (supplier_id) REFERENCES supplier (supplier_id),
    FOREIGN KEY (category_id) REFERENCES category (category_id)
) ENGINE=INNODB;


-- 🚢
CREATE TABLE shipper (
    shipper_id      INT AUTO_INCREMENT NOT NULL,
    company_name    VARCHAR(40) NOT NULL,
    phone           VARCHAR(44) NULL,
    PRIMARY KEY (shipper_id)
) ENGINE=INNODB;


-- order is a reserved word
CREATE TABLE marketorder (
    order_id    INT AUTO_INCREMENT NOT NULL,
    customer_id INT NOT NULL,
    employee_id INT NULL,
    order_date      DATETIME NULL,
    required_date   DATETIME NULL,
    shipped_date    DATETIME NULL,
    shipper_id      INT NOT NULL,
    freight         DECIMAL(10, 2) NULL,
    ship_name       VARCHAR(40) NULL,
    ship_address    VARCHAR(60) NULL,
    ship_city       VARCHAR(15) NULL,
    ship_region      VARCHAR(15) NULL,
    ship_postal_code VARCHAR(10) NULL,
    ship_country     VARCHAR(15) NULL,
    PRIMARY KEY (order_id, customer_id),
    FOREIGN KEY (shipper_id) REFERENCES shipper (shipper_id),
    FOREIGN KEY (customer_id) REFERENCES customer (customer_id) 
) ENGINE=INNODB;


CREATE TABLE order_detail (
   order_detail_id  INT AUTO_INCREMENT NOT NULL,
   order_id         INT NOT NULL,
   product_id       INT NOT NULL,
   unit_price       DECIMAL(10, 2) NOT NULL,
   quantity         SMALLINT NOT NULL,
   discount         DECIMAL(10, 2) NOT NULL,
   PRIMARY KEY (order_detail_id),
   FOREIGN KEY (order_id) REFERENCES marketorder(order_id),
   FOREIGN KEY (product_id) REFERENCES product (product_id) 
) ENGINE=INNODB;
