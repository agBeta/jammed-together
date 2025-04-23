# Mariadb

Some notes: 

- For installation, you may also see 'Nginx Perfect Server' notes.

- Depending on the linux distribution the config file(s) might be located in: `/etc/mysql` or `/etc` (redhat). Also the overrides file for server might be `50-server.cnf` or `server.cnf`.

- An example config file (though **not** necessarily good ^) can be found in [this SO question](https://stackoverflow.com/q/45412537), along with Rich James comments.  
(^): For instance, it does not contain all keys related to performance schema.

</br>


### Using different partition for data

```sh
# stop mariadb service
sudo systemctl stop mariadb

# go to where data & tablespace is stored
cd /var/lib/mysql

# assuming your partition is mounted at /data:
cp -RTp /var/lin/mysql /data/
ls /data/
```

Now we moved (actually copied) our data, we need to modify mariadb configuration.

```sh
cd /etc/my.cnf.d

# [OPTIONAL] create a backup of config file first
sudo cp 50-server.cnf 50-server.cnf.bak 

nano --nowwrap 50-server.cnf
```

Add the following line at the end:
```sh
datadir =    /data
# it is not a good idea to move socket to data directory. so:
socket =    /var/lib/mysql/mysql.sock
```

Now, start mariadb service.

```sh
# assuming partition is mounted on /data
cd /data
ls
# ibdata1 is the system tablespace
```

Let's make sure our innodb stores user-created tables in their own tablespace. Execute `mariadb` (as root user^) to shell into mariadb. Now:

```sql
SHOW VARIABLES LIKE 'innodb_file_per_table%';
-- it should be ON. NEVER turn it off.

SHOW VARIABLES LIKE 'log_bin%';
```

P.S.^: If you do not login to mariadb as **root user**, then `SHOW TABLES;` will NOT show all tables.  
To login as root. First run `sudo su -`. Then run `mariadb`.

</br>

### Connecting

```sh
mysql -h <hostname> -P <port> -u <username> -p<password> <database_name>

mariadb -h <..same as above..>
```

#### Delete Anonymous users

```sql
-- list all users
SELECT User, Host FROM mysql.user;

DELETE FROM mysql.user WHERE user='';
FLUSH PRIVILEGES;
```

> <span style="color: brown;">**WARNING**</span>  
> If you do not delete the anonymous user(s), it will cause problems down the road.


### Create (& Alter) user

You can specify wildcard patterns (using `%` or `*` or subnet mask) for accounts (account = username + hostname).

```sql
CREATE USER IF NOT EXISTS 'user1'@'192.168.0.%'   IDENTIFIED BY 'pass123';
CREATE USER IF NOT EXISTS 'user2'@'*.example.com' IDENTIFIED BY 'pass123';

CREATE OR REPLACE USER 'user3'@'247.150.130.0/255.255.255.0' WITH
    MAX_USER_CONNECTIONS 10
    ...
    MAX_QUERIES_PER_HOUR 200
    IDENTIFIED BY 'pass234';

ALTER USER 'user4'@'1.2.3.4' PASSWORD EXPIRE;
ALTER USER 'user4'@'localhost' TO 'user4'@'10.10.10.120';

DROP USER 'user5';
```

**Side Note**: SHA1-based authentication is not secure as it was in 2001. So you may use [ed25519 plugin](https://mariadb.com/kb/en/authentication-plugin-ed25519/). From a user's perspective, the ed25519 authentication plugin still provides conventional password-based authentication.

The plugin is **not** installed by MariaDB by default. see [installing the plugin](https://mariadb.com/kb/en/authentication-plugin-ed25519/#installing-the-plugin).

```sql
-- approach 1:
CREATE USER username@hostname IDENTIFIED VIA ed25519 USING PASSWORD('secret');


-- if the PASSWORD() function did not work with ed25519 plugin:
-- approach 2:
CREATE FUNCTION ed25519_password RETURNS STRING SONAME "auth_ed25519.so";

SELECT ed25519_password("secret");
-- returns like: ZIgUREUg5PVgQ6LskhXmO+eZLS0nC8be6HPjYWR4YJY

CREATE USER username@hostname IDENTIFIED VIA ed25519 
  USING 'ZIgUREUg5PVgQ6LskhXmO+eZLS0nC8be6HPjYWR4YJY';
```

---

## System Variables

Server System Variables:
- `GLOBAL` vs `SESSION`
- Dynamic vs Static; static variables can only be set in a config (`my.cnf` or `server.cnf`) file. Modifying static variables (i.e. config files) require server restart. 

> <span style="color: brown;">**Important**</span>  
> A Dynamic variable is **NOT persisted** when the server restarts, **even if** it is a Global variable.

Btw, when you set **file path values** in `/etc/my.cnf.d/server.cnf`, do not forget to change **ownership** of the directory if necessary (see below). Otherwise mariadb will encounter 'Access denied' error. 

Open `/etc/my.cnf.d/server.cnf`. \[Create a backup first\]. Add the following lines:

```sh
cd /etc/
...
slow_query_log = 1
slow_query_log_path = /var/log/mariadb/slow-query.log
log_error = /var/log/mariadb/mariadb.log
```

```sh
cd /var/log
mkdir mariadb

# ownership
chown mysql:mysql mariadb

systemctl restart mariadb
```

### Binlog

see also [rotating logs on unix (mariadb)](https://mariadb.com/kb/en/rotating-logs-on-unix-and-linux/).

To activate binary log, you should modify `log_bin` (NOT ~~`%bin_log%` variables~~).

```sql
SHOW VARIABLE LIKE 'log_bin';
SHOW VARIABLE LIKE '%binlog%';
```

Open `/etc/my.cnf.d/server.cnf`. \[Create a backup first\]. Add the following lines:

```sh
# ---------- Binlog ----------
# a unique identifier for the server (especially useful for replication)
server_id =         1
# save binlog on different disk:
log_bin =           /binlog/mariadb-bin.log
max_binlog_size =   200M
# [the course uses:]
# binlog_format =     mixed
# [But Row-based replication is the safest. See below.]
binlog_format   = ROW
expire_logs_days =  7
```

#### Row-based replication is better

Why Mixed replication is less safe than Row-based? Although Mixed-mode is best of both worlds **in theory**, but could possibly get it wrong resulting in either slow performance, or **wrong data** depending on which way it gets it wrong (there are examples of it happening, though in 2014). Recall, recognizing which statements are non-deterministic is non-trivial. (based on [this SO](https://serverfault.com/a/359889))  

Also if your workload does not update 1 million rows with a single statement, there is no reason at all to use statement-based replication and hence no reason to use mixed replication.     
Btw, Oli Sennhauser also uses `binlog_format=ROW` replication in "MariaDB Point-in-Time-Recovery" video.

#### Reading a binglog file

```sh
mariadb-binlog /binlog/mariadb-bin.000001
```

See also 
- [Backup](#backup) section. 
- [`PURGE BINARY LOGS BEFORE ...`](https://mariadb.com/kb/en/using-and-maintaining-the-binary-log/#examples)

</br>

## Benchmarking

You may also checkout [smalldatum](http://smalldatum.blogspot.com/2017/02/using-modern-sysbench-to-compare.html) blogs. First we need to create a user & database for sysbench.

First, you should create the user for sysbench:

```sql
> mariadb

CREATE DATABASE sbtest;

CREATE USER sbtest_user IDENTIFIED BY 'pass123';

-- optional (you can ignore role and directly use GRANT on the user)
CREATE ROLE sysbench_role;

GRANT ALL ON sbtest.* TO sysbench_role;

GRANT ROLE sysbench_role TO 'sbtest_user'@'localhost';

SET DEFAULT ROLE sysbench_role FOR 'sbtest_user';

FLUSH PRIVILEGES; -- don't forget this

SHOW GRANTS FOR sbtest_user;
```

Now let's create a mix of read/write using sysbench. Assuming you already installed sysbench, run the following. Note, there is no sysbench driver for mariadn and we should use mysql driver. 

```sh
sysbench oltp_read_write --table-size=100000 \
    --db-driver=mysql --mysql-host=localhost \
    --mysql-database=sbtest --mysql-user=sbtest_user \
    --mysql-password=pass123 \
    prepare
```

If you encountered 'Access denied' error, this might stem from anonymous user. Check if `mariadb` command works. [Delete anonymous users](#delete-anonymous-users) and then retry the command.

For production grade benchmarking you need a million row table.

```sh
sysbench oltp_read_write --threads=2 --report-interval=10 \n
    --histogram --time=60 --table-size=100000 \n
    --db-driver=mysql --mysql-host=localhost \
    --mysql-database=sbtest --mysql-user=sbtest_user \
    --mysql-password=pass123 \
    run
```

To verify sysbench is putting pressure on mariadb, run `top` command and observe CPU usage of mariadb.

</br>

## Basic Tuning

- [`innodb_log_buffer_size`](https://mariadb.com/kb/en/innodb-system-variables/#innodb_log_buffer_size): Finding the best value for this system variable involves a combination of **monitoring**, **testing** and **understanding your workload**.  
A large log buffer can improve performance especially for transactions that generate a lot of logs.

Open `server.cnf` file. add the following:

```sh
# ------- innodb --------
innodb_log_buffer_size =   32M
```

Save. then restart mariadb server.

Other interesting values to consider for tuning:
- `long_query_time` (in seconds)
- [`thread_cache_size`](https://mariadb.com/kb/en/server-system-variables/#thread_cache_size). Note, If the thread pool is active, thread_cache_size is ignored.

```sql
SHOW VARIABLES LIKE 'thread_cache%';

SHOW STATUS WHERE variable_name LIKE 'threads_connected';
-- number of connected threads. if it too large, you _may_ consider increasing thread_cache_size.
```

- [`tmp_table_size`](https://mariadb.com/kb/en/server-system-variables/#tmp_table_size): Temporary tables are used for storing sorting result and many intermediary operations. You can see if it's necessary to increase by comparing the status variables [`Created_tmp_disk_tables`](https://mariadb.com/kb/en/server-status-variables/#created_tmp_disk_tables) and `Created_tmp_tables` to see how many temporary tables out of the total created, needed to be converted to disk. Often complex `GROUP BY` queries are responsible for exceeding the limit.  
Note, if `max_heap_table_size` is smaller the lower limit will apply.

```sql
SHOW VARIABLES LIKE '%open_file%';

SHOW GLOBAL STATUS LIKE 'open_files';
```

> <span style="color: dodgerblue;">**Note**</span>  
You **should not change** the value of a system variable _just because_ a higher value is better than a lower value. You should first monitor current situation of the database.

The most basic monitoring tool is `SHOW STATUS ...` command.

</br>

## Audit

```sql
SHOW GLOBAL VARIABLES LIKE 'plugin_dir%';

INSTALL SONAME 'server_audit';
```

Better, add the following line:
```sh
plugin_load_add =  server_audit

# ensuring no one can uninstall the plugin while the server is running:
server_audit = force_plus_permanent

server_audit_logging = on
server_audit_events = CONNECT,QUERY,TABLE
server_audit_file_path = /var/log/mariadb/mariadb_audit.log
# in bytes
server_audit_file_rotate_size = 1000000 
server_audit_file_rotations = 5
```

Save. then restart mariadb.

```sql
SHOW GLOBAL VARIABLES LIKE 'server_audit%';
```

- [`server_audit_file_rotate_size`](https://mariadb.com/kb/en/mariadb-audit-plugin-options-and-system-variables/#server_audit_file_rotations)


## Information Schema


Side Note: see also 
- [yannick's blog](https://blog.yannickjaquier.com/mariadb/information-schema-hands-on.html)

It is not performance-intensive, so it is safe to use/query it frequently. There are [over 50 tables in information_schema](https://mariadb.com/kb/en/information-schema-tables/). For example, there is [`tables`](https://mariadb.com/kb/en/information-schema-tables-table/) table which has around 20 columns. also there is [`columns`](https://mariadb.com/kb/en/information-schema-columns-table/) table.


```sql
-- shows all tables of test_db database, along with their details.
SELECT * FROM information_schema.tables 
    WHERE table_schema='test_db';

SELECT * FROM information_schema.USER_PRIVILEGES;

SELECT AUTO_INCREMENT FROM information_schema.tables
    WHERE table_schema='test_db'
    AND TABLE_NAME = 'tbl1'
;
```

_BTW_: `SELECT AUTO_INCREMENT ...` returns the **NEXT** AUTO_INCREMENT value. (though, not sure if it gets updated real-time.)   
Note, [`LAST_INSERT_ID()`](https://mariadb.com/kb/en/auto_increment/#setting-or-changing-the-auto_increment-value) returns  the **last** AUTO_INCREMENT value inserted **by the current session**. So if you have **multiple** tables in a database using AUTO_INCREMENT, you need identify which table is referred to when you query, `SELECT LAST_INSERT_ID();`. (based [this comment](https://mariadb.com/kb/en/last_insert_id/#comment_6903)).

Periodically running the following query (& saving the results) helps you detect schema changes:

```sql
SELECT * FROM information_schema.columns 
    WHERE table_schema = 'test_db';
```

</br>

## Performance Schema

There more metrics you enable in performance schema, the higher impact (decrease) in performance it will have.

Performance schema (unlike information schema) collects real-time data that are not intended for storing for a long time. So if you want to keep these data, you need to **export them** periodically.

```sh
# General Settings
...
performance_schema =    on

```

Save. then restart mariadb. Now:

```sql
SHOW VARIABLES LIKE 'performance_schema';
-- it should be ON

USE performance_schema;
SHOW TABLES;
```

</br>

#### `DIGEST` and `DIGEST_TEXT` 

You will frequently see these columns in performance schema. read more [in mariadb `DIGEST` docs](https://mariadb.com/kb/en/performance-schema-digests/)

#### Some Notable Tables

- [`events_statements_summary_by_digest`](https://mariadb.com/kb/en/performance-schema-events_statements_summary_by_digest-table/)
- [`file_summary_by_instance`](https://mariadb.com/kb/en/performance-schema-file_summary_by_instance-table/): Information about I/O. You can TRUNCATE this table, which will reset all counters to zero.

#### Disabling some metric

There are over 300 tables in performance schema. If it is slowing down your database server, you can disable some of tables using [`setup_instruments`](https://mariadb.com/kb/en/performance-schema-setup_instruments-table/) table.

```sql
-- list enabled
SELECT * FROM performance_schema.setup_instruments 
    WHERE ENABLED = 'yes';

-- disable/enable a table
UPDATE performance_schema.setup_instruments
    SET ENABLED = 'NO'
    WHERE NAME = 'statement/abstract/new_packet';
```

### Use cases

- Identifying slow queries
- Monitoring tables with high I/O wait time
- Detect lock contention: identify transactions that experience long delays due to locks.
- Analyze index usage
- Tracking memory usage by threads
- Connection performance
- Analyze queries that are both repetitive and long-running 

</br>


## Monitoring

There is unfortunately there is no specialized tool for mariadb.  
Alternatives:
- PMM (Percona Monitoring and Management) is a free tool specialized for mysql (**NOT for ~~mariadb~~**). see [percona docs](https://docs.percona.com/percona-monitoring-and-management//3/). 

- Prometheus + Grafana + (node exporter or [mysqld exporter](https://github.com/prometheus/mysqld_exporter) or MaxScale):   
The installation is a bit difficult. Also you have to program (using PromQL) the queries for your metrics. However, if it your centralized monitoring tool, it might be a good option. See also
    - [yannick's blog](https://blog.yannickjaquier.com/mariadb/prometheus-and-grafana-for-mariadb-performance-monitoring.html): detailed step-by-step with code.

Monitoring server **should always** be different from agent (i.e. monitored or client) server.

</br>

## Backup

[MariaBackup](#mariabackup) is the recommended tool.

### Logical Backup & Restore

**Side Note**: TIMESTAMP columns? see [`--tz-utc`](https://mariadb.com/kb/en/mariadb-dump/). `--tz-utc` is enabled by default.  
Without this option, TIMESTAMP columns are dumped and reloaded in the time zones local to the source and destination servers, which can cause the values to change if the servers are in different time zones.

```sh
mariadb-dump --user=root \
    --all-databases \
    --flush-logs \
    --single-transaction \
    --master-data=1 \
    --flush-privileges \
    --quick \
    --triggers \
    --routines \
    --events \
    --hex-blob > /backup/full_dump.sql

# btw, "/backup/full_dump-$(date +"%Y%m%d-%H%M%S").sql" might be a better filename.
```

Btw, Oli Sennhauser (in "MariaDB Point-in-Time-Recovery" video) also uses the same flags. He especially recommends `--master-data=1` and `--single-transaction` flags. 

Now to restore:

```sh
# cd into data directory of your mariadb
cd /data

# stop mariadb
sudo systemctl stop mariadb

# copy the whole data directory (containing current state of database) in another place, before starting the backup procedure. because backup procedure may fail.
cp -a /data/. /backup/data-before-restore/

# remove the whole /data directory
rm -rf *

# restore core databases (mysql, performance_schema, etc)
mariadb-install-db --user=mysql --base=/usr --data=/data

sudo systemctl start mariadb
sudo systemctl status mariadb
# mariadb should be active (running). but with no data.

# restore data
mariadb -u root < /backup/full_dump.sql

# Now, we should perform Point-in-Time-Recovery
# check binary position:
head -n 25 /backup/full_dump.sql
# Find line 'CHANGE MASTER TO MASTER_LOG_FILE ...'
# [🔷] Take note of `MASTER_LOG_POS`. e.g,   389
# [🔷] Take note of `MASTER_LOG_FILE`. e.g,  mariadb-bin.0000018

# assuming you have a separate partition (folder) for binary log (as recommended at the beginning of the course):
ls /binlog
# [🔷] See binlog files. We need to restore only files STARTING FROM mariadb-bin.0000018 and later.

# see notes below.
mariadb-binlog --start-position=389 --disable-log-bin \
    /binlog/mariadb-bin.0000018 \
    /binlog/mariadb-bin.0000019 \
    /binlog/mariadb-bin.0000020 \
    | mariadb --user=root
```

Explanation:
- `cp` command is based on [this SO](https://askubuntu.com/a/86891). The `-a` option is an improved recursive option, that preserves all file attributes and symlinks. The `.` at end of the source path is a **specific cp syntax** that copies all files and folders, including hidden ones. be careful you **don't forget** `/` at the end.

- in this example, there is no need for `--stop-position` (excluded) or [`--stop-datetime`](https://mariadb.com/kb/en/mariadb-binlog-options/) since we did not have a data corruption. But if you have a statement that corrupted the database (bad `DELETE`, etc), you can stop reading the binlog when it reaches the given argument; e.g. `... --stop-datetime='2014-12-25 11:25:56'`. The argument must be a date and time in the **local time zone**.

- Note, mariadb **removes** old binary logs automatically. Be careful to set a realistic value for `expire_logs_days`. If you lose even one of your binary logs, you **will not** be able to perform PiTR.  

- Alternatively, you can use [`--flashback`](https://mariadb.com/kb/en/flashback/). Also watch Oli Sennhauser's video minute 11:05.

</br>

### MariaBackup

It is a physical backup tool. It is forked from Percona XtraBackup. it is optimized for Mariadb and is included with mariadb 10.1.23 and later.

Note, zipping a backup reduces the size about 70%, but unfortunately **unzipping takes a lot of time**.

```sql
GRANT RELOAD, PROCESS, LOCK TABLES, BINLOG MONITOR ON *.* TO 'mariabackup_user'@'localhost';
```

#### Installing

_based on [docs](https://mariadb.com/kb/en/mariabackup-overview/)_

It is not generally possible, or supported, to prepare a backup in a different MariaDB version than the database version at the time when backup was taken. For example, if you backup MariaDB 10.4, **you should use mariabackup version 10.4**, rather than, say, 10.5.

#### Backup

```sh
mariabackup --backup \
    --target-dir=/backup/backup_01/ \
    --user=mariabackup_user \
    --password=12345

# now, prepare
mariabackup --prepare --target-dir=/backup/backup_01/
```

#### Restore

```sh
# why cp? see 'Logical Backup' section
cp -a /data/. /backup/data-before-restore/

rm -rf *

mariabackup --copy-back \
    --target-dir=/backup/backup_01/ 

ls -latr
# files should be restored.

# Don't forget to change ownership:
chown -R mysql:mysql /data/

cd /backup/backup_01/

cat xtrabackup_info
# or xtrabackup_binlog_inf (based on Oli Sennhauser minute 7:30)
# [🔷] Take note of `binlog_pos`

# see 'Logical Backup' section
ls /binlog
mysqlbinlog ... # see 'Logical Backup' section
```

</br>

## SSL

Watch the video or read [the docs](https://mariadb.com/kb/en/securing-connections-for-client-and-server/). you may also see [Certificate creation with OpenSSL](https://mariadb.com/kb/en/certificate-creation-with-openssl/) or [cpanel guide](https://docs.cpanel.net/knowledge-base/security/how-to-configure-mysql-ssl-connections/).  
Do not use ~~One-way-TLS~~; use Two-way-TLS.  

### SSL Overhead ?

Normally SSL has a _neglectable_ effect on the connection speed. But if your application uses lots of very short-lived connections (like, connect, one primary key lookup, disconnect) then the SSL handshake overhead might be very noticeable. Disable SSL or use a connection pool.

(based on [here](https://mariadb.org/mission-impossible-zero-configuration-ssl/))

### 11.4 zero-config SSL

Btw, [Zero-config SSL](https://mariadb.org/mission-impossible-zero-configuration-ssl/) is **NOT the thing** you want.  
Quoting from the blog: 
- The zero-config-ssl lies in the fact that a MariaDB client connecting to a MariaDB server **differs from a general case** of, say, your browser visiting some website.  
- ... MariaDB clients (**NOT** ~~any program~~) can verify the server certificate even if it’s self-signed.

</br>

## Replication

_watch the videos_.  

BTW, the tutor **discourages** setting up a database cluster manually (i.e. without MaxScale). use MaxScale.



</br>

## Max Scale

First off, MaxScale is not free for production use ([BSL license](https://mariadb.com/bsl-faq-mariadb/)). As you can see [pricing](https://mariadb.com/pricing/), MaxScale is only available under 'Enterprise Platform'.

After installing, you should configure master & replica in _maxscale_ config file.

Note: You _don't have to_ install mariadb-server on your MaxScale server.

Note, when using MaxScale you must avoid prepared statements. read more in  [prepared statements](http://mariadb.com/kb/en/mariadb-maxscale-2208-limitations-and-known-issues-within-mariadb-maxscale/#prepared-statements).  

Using transactions is fine. See also [ReadWriteSplit section](#readwritesplit-router) below, for granular details about how MaxScale load balancer works. 

### Concepts

#### What is a [Service](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#service_1) ?

A service is identified like below. The definition of a service alone is **NOT enough** to allow MariaDB MaxScale to forward requests however, the service is merely present to link together the other configuration elements.

```sh
[Test-Service]
type=service
```

A service **abstracts a set of databases** and makes them appear as a single one to the client. Depending on what router (e.g. `readconnroute` or `readwritesplit`) the service uses. (_based on [here](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#service)_)

#### What is [Server](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#server_1) ?

Server sections define the [backend database servers](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#glossary) MaxScale uses. A server may only be monitored by **at most one monitor**; but also take a look [cooperative monitoring](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-monitor/#cooperative-monitoring).
```sh
[MyMariaDBServer1]
type=server
address=127.0.0.1
port=3000
```

#### Oracle Best Practices

As a best practice, the observer should ideally be located at a **third** site or third data center so that the primary, observer, and standby have isolated power, server, storage, and network infrastructure. (_based on [oracle Data Guard best practices](https://docs.oracle.com/en/database/oracle/oracle-database/19/haovw/optimizing-automatic-failover-common-scenarios-minimize-downtime1.html#GUID-6049EDEF-1689-4FCD-B1DC-A8FBF9B9D4F1)_)

btw, there is _'FastStartFailoverThreshold'_ for oracle Data Guard which defines the number of seconds the observer attempts to reconnect to the primary database before initiating a fast-start failover to the target standby database. The recommended value by oracle is 6 to 15 **seconds** if the network is responsive and reliable.


#### Causes of Downtime

There are two types: Unplanned downtime and Planned downtime. read [oracle HA overview](https://docs.oracle.com/en/database/oracle/oracle-database/19/haovw/overview-of-ha.html)

#### How much failover redundancy?

see [this SO](https://serverfault.com/a/574778).

Also from the same thread: 
> The only generic advise I can think of is make sure you have the basics of **everything** covered to a certain level before spending time and money on **one specific point**. Having the most redundant failsafe database layer on the planet doesn't help you when the one public link to your web farm dies. So try not to overly protect one party of the system at the expense of others.

</br>

### Configuration

_based on [configuration docs](http://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/)_.

MaxScale by default reads configuration from the file `/etc/maxscale.cnf`. If the command line argument `--configdir=<path>` is given, maxscale.cnf is searched for in `\<path>` instead.  
(based on [here](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#configuration))

Note [about Sizes](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#sizes): `1Mi` is different from `1m` or `1M`.

Also read note about [`threads`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#threads) **inside docker**.

**NOTE**: It is **highly** recommended to [disable reverse name lookups](https://mariadb.com/kb/en/maxscale-troubleshooting/#systemd-watchdog-kills-maxscale). Otherwise, systemd might kill MaxScale sometimes.

Some other notable directives:

- [`log_throttling`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#log_throttling)

- [`log_dir`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#logdir)

- [`local_address`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#local_address): This can be used for ensuring that MaxScale uses a **particular** interface when connecting to servers, in case the computer MaxScale is running on has multiple interfaces.

- [`session_trace`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#session_trace)

> <span style="color: brown;">**IMPORTANT**</span>  
[Note about **Connection Sharing**](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#details-limitations-and-suggestions-for-connection-sharing): When a connection is pooled and reused, its state is lost. Read more the consequences in the link.

- Be careful when enabling [``log_info``](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#log_info). The log file could pile up millions of lines in a single day if your database(s) is under high traffic.

    ```sh
    [maxscale]
    ...
    log_debug=1
    log_info=1
    ```
    After enabling log_info, you can: 
    ```sh
    tail -f /var/log/maxscale/maxscale.log
    ```

- [`query_classifier_cache_size`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#query_classifier_cache_size): has **an important role** in MaxScale performance. read also [Performance Optimizations](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#performance-optimization).


- [`connection_init_sql_file`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#connection_init_sql_file): might be useful for `TIMESTAMP` and **session timezone**.

- [`connection_metadata`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#connection_metadata): **VERY IMPORTANT** for charset and utf8

You can also use [`@include`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#include_1) to re-use same config.

Other things to consider:
- [TLS Encryption for MaxScale](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#tlsssl-encryption)

- [MaxScale `threads` in runtime](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#threads_1): commands to control threads. e.g. `bin/maxctrl show threads`

</br>

#### Steps 

(_this part is based on course videos_)  
(_you may also see [alejandro's repo](https://github.com/alejandro-du/maxscale-ha-demo/tree/master)_)

- Find `[server1]` section. Replace `address` & `port`. Also add `protocol=MariaDBBackend`.

- Add `[server2]` below `[server1]` (one empty line between the two).
    ```sh
    type=server
    address=10.1.0.20
    port=3306
    protocol=MariaDBBackend
    ```

- Configure replication monitor to track master-replica relations. Find `[MariaDB-Monitor]`. 
    ```sh
    type=monitor
    module=mariadbmon
    servers=server1,server2
    user=monitor # you can also use different users for each server
    password=pass123
    monitor_interval=2s
    ```

- Go to master server (i.e. server1).
    ```sql
    CREATE USER 'monitor'@'%' IDENTIFIED BY 'pass123';

    GRANT 
         REPLICATION CLIENT -- see note 2
        , SUPER
        , RELOAD
        , PROCESS
        , SHOW DATABASES
        , EVENT
    ON *.* 
    TO 'monitor'@'%';


    GRANT CONNECTION ADMIN 
    ON *.* 
    TO 'maxscale_monitor_user'@'maxscalehost'; -- see note 1
    ```
    There may be no need to create the user in replica servers as they will get created automatically.

    **NOTE 1**: based on [Mariadb Monitor Required Grants](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-monitor/#required-grants), it is recommended to also grant `CONNECTION ADMIN` privilege.   
    For mariadb 10.5.9 and later, [`REPLICA MONITOR` grant](https://mariadb.com/kb/en/grant/#replica-monitor) is also required.

    **NOTE 2**: we can use [`BINLOG MONITOR`](https://mariadb.com/kb/en/grant/#binlog-monitor) instead of `REPLICATION CLIENT` from mariadb 10.5.2.

    **NOTE 3**: Apparently there are some other privileges that are not mentioned in the course video. See [alejandro's primary setup](https://github.com/alejandro-du/maxscale-ha-demo/blob/master/mariadb-server/primary/primary.sql)

    <span style="color: blue;">**NOTE 4**</span>: Apparently you must set [`gtid_strict_mode=1`](https://mariadb.com/kb/en/gtid/#gtid_strict_mode) in master mariadb configuration file. (based on [alejandro's primary.cnf](https://github.com/alejandro-du/maxscale-ha-demo/blob/master/mariadb-server/primary/primary.cnf))
    
    </br>

- Find `[Read-Write-Service]`. (_minute 10_).
    ```sh
    [Read-Write-Service]
    type=service
    router=readwritesplit
    servers=server1,
            server2
    user=service_user
    password=secret789
    max_slave_connections=100
    # [see Note 1]
    master_reconnection=true
    master_failure_mode=fail_on_write
    # [Alejandro enabled these. see ReadWriteSplit section]
    transaction_replay=true
    transaction_replay_retry_on_deadlock=true
    transaction_replay_retry_on_mismatch=true
    ```

    This service automatically routes read queries to replica(s) (slaves) and write queries to the master, because of [`readwritesplit` router](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/).  
    **NOTE**, you can change some parameters so that master can also accept reads. Read more in [ReadWriteSplit](#readwritesplit-router) section below.

    As you can see from above, Routers **do not** have sections of their own in the MaxScale configuration file, but are referred to from services. (based on [here](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#router))

    **Note 1**: For `master_reconnection`, [mariadb docs explicitly states](https://mariadb.com/kb/en/mariadb-maxscale-25-readwritesplit/#master_reconnection) the recommended configuration is to use master_reconnection=true and `master_failure_mode=fail_on_write`. Alejandro [maxscale.cnf](https://github.com/alejandro-du/maxscale-ha-demo/blob/master/maxscale-proxy/maxscale.cnf#L31) also uses the same settings.

- Create `service_user` in server1 (master). It should have at least INSERT, UPDATE, DELETE, SELECT privileges.

- Find `[Read-Write-Listener]`. **Note**: it is suggested that `port` be the same 3306 (default of MySQL & Mariadb).
    ```sh
    [Read-Write-Listener]
    type=listener
    service=Read-Write-Service
    protocol=MariaDBClient
    port=3306
    ```

- With the current config, you can comment out these parts:
    - `[Read-Only-Listener]`
    - `[Read-Only-Service]`


Save & exit.


### Firewall

```sh
firewall-cmd --add-port=3306/tcp --permanent 
firewall-cmd --reload

# now restart MaxScale service
systemctl restart maxscale

systemctl status maxscale

maxctrl list servers
# should print server1, server2
# state might be 'Down'
```

If the state is Down, then we need to configure firewalls on server1 and server2 VPS.

Go ssh into the server1.
```sh
# assuming ip address of MaxScale server is 10.1.0.50

sudo firewall-cmd --add-rich-rule='rule family="ipv4" source address="10.1.0.50" port protocol="tcp" port="3306" accept' --permanent

firewall-cmd --reload
```

Do the same for server2 (replica server).

Go ssh back into MaxScale server. **Restart MaxScale**.

```sh
systemctl restart maxscale

maxctrl list servers
# state of server1 should be: Master, Running
```

Btw, if you see "Auth Error" in state column it indicates a problem with User or Privileges.


#### Checking wether MaxScale is really working

On a forth VPS (we call it the _client_ server), install mariadb **client** (NOT ~~mariadb-server~~), or alternatively use nodejs connector. Also create a new user `test_user` in your master server and a `test_db` database (and grant privileges to `test_user` for this database).  
Now, try connecting **to the MaxScale server** (**NOT** ~~any of master or slaves~~) from the client server. For example, assuming the ip of MaxScale server (we can also call it proxy server) is `10.1.0.50` and you have installed mariadb client, you can run:

```sql
> mariadb -h 10.1.0.50 -u test -p
-- password..

SELECT @@hostname;
-- should return hostname of server2 (or any slave server), since our MaxScale config routes READ queries to slave(s).

SHOW DATABASES;
USE test_db;

CREATE TABLE tbl1;
-- Even though, we are in server2, but MaxScale should route this WRITE query to server1 (master).
-- To verify, ssh into server1 (master) and run 'SHOW TABLES'.
```

</br>

### Administration

```sh
maxctrl list services

# list of connections from the clients
maxctrl list sessions

# temporarily remove server2 for maintenance
maxctrl set server server2 maintenance

maxctrl list servers

# bring back server2
maxctrl clear server server2 maintenance
```

#### Stopping & Starting a service
When you stop a service via `maxctrl`, new connections to that service will **NOT** get refused; but will get queued. So the clients will keep waiting. In order to stop a service:
```sh
maxctrl stop server Read-Write-Service

# to start a service again
maxctrl start server <service-name>
```

#### Stopping a monitor

```sh
maxctrl stop monitor <monitor-name>

maxctrl list monitors
```

#### Add/Remove new servers (without reloading MaxScale)

If we were to modify the config file, we had to restart MaxScale (systemctrl) service. Instead, you can:

```sh
maxctrl create server server3 10.0.1.3 3306 --protocol=MariaDBBackend
```

Then just for documentation purpose, add the corresponding directive(s) to `maxscale.conf` file during, say, midnight and reload MaxScale.

#### Modify a server (without reload)

```sh
maxctrl alter server server2 port 3308
```

#### More on server administration

A server can be destroyed only if it is not in use by any service nor any monitors. otherwise, you need to use `--force` flag.

```sh
maxctrl destroy server server3 --force
```

But you can [**drain**](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-maxscale-configuration-guide/#server) a server. Existing connections can continue to be used, but no new connections will be created to the server. It is a very useful command to remove a server from the pool gracefully, without disrupting the clients or ongoing sessions. Typical use cases: maintenance, scaling down, troubleshooting, etc.  

Btw, **a monitor can also turn on draining state** for a server (_without_ using `maxctrl`). 

```sh
maxctrl set server server2 drain

# bring back
maxctrl clear server server2 drain
```

</br>

### GTID-based Replication

Before going into operational commands, you may take a look at these links:
- [Old-way vs GTID-based](https://mariadb.com/kb/en/gtid/#overview)
- [Benefits of GTID-based](https://mariadb.com/kb/en/gtid/#benefits)
- [Domain ID (`gtid_domain_id`) ?](https://mariadb.com/kb/en/gtid/#the-domain-id) mainly designed to handle multi-source replication (e.g. with multi-primary ring topologies).

GTID-based Replication is a concept that can be achieved without MaxScale. Anyway, to use MaxScale to its fullest potential you must have GTID-based replication.

#### Steps 

(_based on the course video._)  
(_apparently similar to [Setting up a New Replica Server (gtid docs)](https://mariadb.com/kb/en/gtid/#setting-up-a-new-replica-server-with-global-transaction-id)_ )

- First, ssh into the **master** server. open mariadb config file `nano --nowrap /etc/my.cnf.d/server.cnf` (the path might differ based on [distro](#mariadb))

```sh
[maraidb]
...
gtid_domain_id = 1
```

BTW, you can even setup multi-source replication (i.e. multi-primary or multi-master replications). In such case, each master server should have its own **unique** `gtid_domain_id`.

- Now, ssh into each of replica (slave) servers (VPS). open mariadb config file.

```sh
[maraidb]
...
gtid_domain_id = 101
```

As noted, GTID Domain id should be unique. Also by convention we use a quite larger for slaves.  

Now, **Restrart all database servers (master & slaves)** using `systemctl` .  
**NOTE**, in production environments (e.g. ongoing replication), you **cannot just stop** a slave. you have to remember the position of binary log and so on. (watch _Chapter 12. Replication videos_)

After restart. ssh into each slave server, and:

```sql
> mariadb

STOP SLAVE;

SHOW SLAVE STATUS\G
```

Find `Using_Gtid`. it should be 'No' yet, which means GTID-based replication is not setup yet. To continue, take note of `Relay_Master_Log_File` (e.g. 'mariadb-bin.0000010') and `Exec_Master_Log_Pos` (e.g. 344).

Now, ssh into the master server.

```sql
> mariadb

SELECT binlog_gtid_pos('mariadb-bin.0000010', 344);
-- should print something like: 0-1-22
```

We this value, we can now complete the setup in slave server(s).  
On each slave server, run thw following.  
BTW, you may see [`gtid_slave_pos`](https://mariadb.com/kb/en/gtid/#gtid_slave_pos).

```sql
SET GLOBAL gtid_slave_pos = '0-1-22';

CHANGE master TO master_use_gtid = slave_pos; 

START SLAVE;

SHOW SLAVE STATUS;
-- 'Using_Gtid' should be 'Slave_Pos' and 'Gtid_IO_Pos' should be '0-1-22' that we specified.
```

</br>

### Switchover

**Note** that the failover (and switchover and rejoin) functionality of The MariaDB Monitor is only supported for **simple topologies**, that is, 1 primary and several replicas AND in conjungtion with GTID-based replication.  (_based on [failover docs](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-automatic-failover-with-mariadb-monitor/)_)

#### Steps

- ssh into the master. Make sure your `monitor` user (or whatever name ) has the following privileges.  

    ```sql
    GRANT READ_ONLY ADMIN ON *.* TO 'monitor'@'%';
    GRANT PROCESS ON *.* TO 'monitor'@'%';

    GRANT SELECT ON mysql.* TO 'monitor'@'%';

    GRANT REPLICATION SLAVE ON *.* TO 'monitor'@'%';

    -- (optional) drop anonymous user(s):
    DROP USER ''@'localhost';
    ```

- If you remember on [Firewall](#firewall) section we added new rule to the firewall of server1 (master). We must do the same for each slave server, because each slave may become the new master (during switchover or failover). 

- To enable automatic rejoin, add `auto_rejoin=true` to the **monitor section** in the configuration file. in the current config we called it `[MariaDB-Monitor]`. When automatic rejoin is enabled, the MariaDB Monitor will attempt to rejoin a failed (or stopped?) primary as a replica, if it re-appears. (based on [docs](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-automatic-failover-with-mariadb-monitor/#rejoin))  
Now restart maxscale. `systemctl restart maxscale`

- Now, in order to perform switchover, execute this command on maxscale server (VPS)

    ```sh
    maxctrl call command mariadbmon switchover MariaDB-Monitor server2
    # it may take a few seconds.

    maxctrl list servers
    ```
To verify, server1 is demoted to be a slave, you can run the following on server1:

```sql
SHOW REPLICA STATUS\G;
```

Alternatively, you can create a new database `switchover_test_db` on server2. Then head back to server1 and query `SHOW DATABASES;`. You should be able to see `switchover_test_db` in server1, proving that server1 is an slave and server2 is promoted to be the new master.

**BTW**: switchover is _hardly useful_. However, there are some occassions that switchover might come handy. For example, 
- you just bought a new VPS with better hardware for a slave and you can switchover the master to be this new VPS.

- \[not in the video\] during **automatic** failover, one of replicas has been promoted to be the master. Now the (previously dead) master re-appears and rejoins as a replica; but it has better hardware. You can switchover to the old master, say, during midnight. (similar to the previous scenario)


</br>

### Failover

The operation details can be found in [docs](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-monitor/#failover).

Preqrequisites: _(minute 5:10)_
- GTID-based Replication
- on all servers, binary log should be on.
- on all servers, relay log should be on.
- `log_slave_updates=1`. based on [Replication and Binlog variables](https://mariadb.com/kb/en/replication-and-binary-log-system-variables/):
    - If set to 0, the **default**, updates on a replica received from a primary during replication are **NOT logged** in the replica's **binary** log. If set to 1, they are. The replica's binary log needs to be enabled for this to have an effect. Set to 1 if you want to daisy-chain the replicas \[OR if it is possible for a slave to get promoted to be a master\].

Do **NOT** (??) execute failover **immediately**. because the slave may not be fully synchronized with the (_just failed_) master, and if you perform failover immediately you may lose some data ( \[**really** ???\] ). The tutor recommends to wait about 5 minutes. Howoever, according to [oracle best practices](#general-best-practices) Oracle recommends about 15 seconds if the network is reliable.

if the situation is not solved yet, perform the failover following these steps. Don't forget, `auto_rejoin` must be **true**.

```sh
# on maxscale VPS
maxctrl list servers

maxctrl call command mariadbmon failover MariaDB-Monitor
# promotes the most appropriate replica (usually the most up-to-date one) to be the new master
# it may take a few seconds

maxctrl list servers
# 'State' of server2 should indicate 'Master, Running'.
```

### Manual Rejoin

_watch the video_.

### Auto Failover

add [`auto_failover=true`](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-monitor/#auto_failover) to maxscale config. Then **restart** maxscale.

```sh
[MariaDB-Monitor]
...
monitor_interval=2s
auto_failover=true
# be careful NOT to set it too low. Otherwise you will have unnecessary failovers due to short network issues.
failcount=60 #  60 * 2s = 120 => after 2 minutes of downtime the automatic failover starts. 
# [2 minutes? see note below]

# optionally we can also turn on automatic rejoin
auto_rejoin=true
```

Notes:

- Two minutes downtime of primary? actually there is no hard rule for setting this value. you may take a look at [oracle best practices](#oracle-best-practices).

</br> 

### ReadWriteSplit router

The following operations are routed to **master** (based on [routing decisions](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/#readwritesplit-routing-decisions)):

- write statements,
- **all statements within an open transaction**; <span style="color:blue;">**(see P.S.1)**</span>
- stored procedure calls
- user-defined function calls
- DDL statements (DROP|CREATE|ALTER TABLE … etc.)
- EXECUTE (prepared) statements that modify the database; BTW, [avoid prepared statements](https://mariadb.com/kb/en/mariadb-maxscale-2208-limitations-and-known-issues-within-mariadb-maxscale/#prepared-statements) when using MaxScale.
- all statements using temporary tables

**Read queries** are routed to the **master** server in the following situations:

- query is executed inside an **open transaction**; <span style="color:blue;">**(see P.S.1)**</span>
- statement includes a stored procedure or an UDF call
- if there are multiple statements inside one query e.g. `INSERT INTO ... ; SELECT LAST_INSERT_ID()`;

<span style="color:blue;">**P.S.1**</span>:  
This default behavior _might be_ to our benefit. Why? because we can have a single master with huge CPU and RAM resources which also accepts read queries. And a single replica with medium resources, merely for disasters (failover) and meaitenance.  
Anyway, if you want to change/tune this behavior you use [Hinfilters](https://mariadb.com/kb/en/mariadb-maxscale-24-hintfilter/).

#### Tuning the router

Some parameters to change the routing behavior: 

- [`max_slave_connections`](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/#max_slave_connections): By tuning this parameter, you can control how dynamic the load balancing is at the cost of extra created connections. read the link.
- [`master_accept_reads`](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/#master_accept_reads): `true` allows the master server to be used for reads. This is a **useful option to enable if** you are using a small number of servers and wish to use the master for reads as well.  
By default, no reads are sent to the master as long as there is a valid slave server available. If no slaves are available, reads are sent to the master regardless of the value of master_accept_reads.

#### Multi-statement queries

A practical example can be given by the following set of SQL commands executed with (default) `autocommit=1`.
```sql
INSERT INTO test.t1 (id) VALUES (1);
SELECT * FROM test.t1 WHERE id = 1;
```
As the statements are not executed inside a transaction, from the load balancers point of view, the latter statement can be routed to a slave server. The problem with this is that if the value that was inserted on the master has not yet replicated to the server where the SELECT statement is being performed, it can appear as if the value we just inserted is not there.

In order to prevent this use: 
- use a transaction (?)
- change [`casual_reads`](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/#causal_reads)
- use [Hintfilters](https://mariadb.com/kb/en/mariadb-maxscale-24-hintfilter/) directly in the query; e.g. `-- maxscale route to slave`

#### Transaction

Make sure you [`transaction_replay`](https://mariadb.com/kb/en/mariadb-maxscale-24-readwritesplit/#transaction_replay). Alejandro also [enabled it](https://github.com/alejandro-du/maxscale-ha-demo/blob/master/maxscale-proxy/maxscale.cnf#L33).

---

</br>

## Other

### Nodejs connector

You can see [mariadb official docs](https://mariadb.com/docs/server/connect/programming-languages/nodejs/promise/connection-pools/#Load_Balancing).


---

### Multiple MaxScale servers

_based on [mariadb blog](https://mariadb.com/resources/blog/using-connector-failover-for-mariadb-maxscale-resiliency/)_  
(_btw, you may see also [alejandro's HA repo](https://github.com/alejandro-du/maxscale-ha-demo)_)

Modern MariaDB application connectors provide simple failover configuration options so **if one MaxScale node goes down**, the application connector will automatically try connecting to another MaxScale node it knows. Combined with [MaxScale’s cooperative locking feature](https://mariadb.com/kb/en/mariadb-maxscale-2402-maxscale-2402-mariadb-monitor/#cooperative-monitoring), your application can continue querying your database cluster uninterrupted when a MaxScale node goes down.

For Node.js you can use:

Using Connector/Node.js

MariaDB’s Connector/Node.js offers Load Balancing functionality via its connection pool cluster feature. To configure this to use simple failover, configure the specify defaultSelector: ‘ORDER’ as part of the pool cluster’s configuration-

```js
const mariadb = require('mariadb');

// Create connection pool cluster
const cluster = mariadb.createPoolCluster({
  defaultSelector: 'ORDER'  
  // meaning: Try pools in order, only trying the next pool if the prior fails
});

// Add first MaxScale node to cluster
cluster.add('mxs1', { 
    host: process.env.MXS1_HOST, // 1
    user: process.env.MXS_USER, 
    password: process.env.MXS_PASS, 
    database: process.env.TEST_DB, 
    connectionLimiit: 100,
});

// Add second MaxScale node to cluster
cluster.add('mxs2', { 
    host: process.env.MXS2_HOST, // 2
    user: process.env.MXS_USER, 
    password: process.env.MXS_PASS, 
    database: process.env.TEST_DB, 
    connectionLimiit: 100
});
```

---

### ColumnStore

a columnar storage engine for interactive, ad hoc analytics at scale. can be deployed in addition to InnoDB to accelerate analytical queries. Though, be careful it needs [massive hardware](https://mariadb.com/kb/en/columnstore-minimum-hardware-specification/).


---

