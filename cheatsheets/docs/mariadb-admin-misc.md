see [Rich James](https://serverfault.com/a/1153213) tuning a question for mariadb.

## Linux Deploy

See [Configuring Linux for MariaDB](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/configuring-mariadb/mariadb-performance-advanced-configurations/configuring-linux-for-mariadb).

## Network

see [Configuring MariaDB for Remote Client Access Guide](https://mariadb.com/docs/server/mariadb-quickstart-guides/mariadb-remote-connection-guide). This explains how to set `bind-address` in the config file.

View Existing Remote Users:
```sql
SELECT User, Host FROM mysql.user 
WHERE Host <> 'localhost' AND Host <> '127.0.0.1' AND Host <> '::1';
```

Grant root-like access from a specific LAN subnet:
```sql
GRANT ALL PRIVILEGES ON *.* TO 'root'@'192.168.100.%'
  IDENTIFIED BY 'my-very-strong-password' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

---

## Plugins (e.g MyRocks)

### in Docker

To install **MyRocks** or any plugin in docker, see [this](https://mariadb.org/installing-plugins-in-the-mariadb-docker-library-container/). Alternatively you can build your own image from base mariadb like this ([this issue](https://github.com/MariaDB/mariadb-docker/issues/135#issuecomment-346334001))
  
```sh
FROM mariadb:10.2
RUN apt-get update && apt-get -y install mariadb-plugin-rocksdb && rm -rf /var/cache/apt/lists/*
```

see also [MyRocks Getting Started](https://mariadb.com/docs/server/server-usage/storage-engines/myrocks/getting-started-with-myrocks#installing-with-a-package-manager)

**Don't forget** to install the plugin also, using `INSTALL SONAME 'ha_rocksdb';` or using the following config directive ([mariadb docs](https://mariadb.com/docs/server/server-usage/storage-engines/myrocks/getting-started-with-myrocks#installing-the-plugin)):
```ini
[mariadb]
...
plugin_load_add = ha_rocksdb
```


---

### B-Tree vs Hash

_(based on [mariadb](https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/storage-engine-index-types))_

B-tree** indexes are used for column comparisons using the >, >=, =, >=, < or BETWEEN operators, as well as for LIKE comparisons that begin with a constant. For example, the query `SELECT * FROM Employees WHERE First_Name LIKE 'Maria%'`; _can_ make use of a B-tree index, 

B-tree indexes also permit leftmost prefixing for searching of rows. If the number or rows doesn't change, hash indexes occupy a fixed amount of memory, which is lower than the memory occupied by BTREE indexes.

Hash indexes, in contrast, **can only** be used for **equality comparisons**, so those using the = or <=> operators. They cannot be used for ordering, and provide no information to the optimizer on how many rows exist between two values. Hash indexes do not permit leftmost prefixing - only the whole index can be used.

INNODB permits BTree index **ONLY**.

---

## Index

### Primary Key Index in InnoDB

In InnoDB tables, the primary key is included **as a suffix in all other indexes**. Therefore, keeping the primary key compact (e.g., using an appropriate integer type) is important for performance and storage efficiency. ([docs]((https://mariadb.com/docs/server/mariadb-quickstart-guides/mariadb-indexes-guide#primary-key)))

### Large tables

For very large tables, it's often faster to load data into the table first and **then create indexes**, rather than creating indexes on an empty table and then loading data. ([here](https://mariadb.com/docs/server/mariadb-quickstart-guides/mariadb-indexes-guide#choosing-indexes))


### Conditional Uniqueness with `UNIQUE` on Virtual Columns

You can enforce uniqueness over a subset of rows using unique indexes on virtual columns. This example ensures user_name is unique for 'Active' or 'On-Hold' users, but allows duplicate names for 'Deleted' users:

```sql
CREATE TABLE Table_1 (
  user_name VARCHAR(10),
  status ENUM('Active', 'On-Hold', 'Deleted'),
  del CHAR(0) AS (IF(status IN ('Active', 'On-Hold'), '', NULL)) PERSISTENT,
  UNIQUE(user_name, del)
);
```

---
