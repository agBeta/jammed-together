# Mariadb

## Installation

You can use `su mysql_secure_installation` command. **BUT** ...

**\[BUT\] ...** There is a [security hole in mysql_secure_installation about unix_socket](https://mariadb.com/kb/en/mysql_secure_installation/). Be careful.

> ... having entered 'No' to the question regarding switching to unix socket authentication, I was able to access the MariaDB command prompt by simply typing mysql at the unix command prompt !!

Using unix_socket means that if you are the system root user, you can login as root@locahost **without** a password. It is based on a simple fact that asking the system root for a password (mysql password) adds no extra security — root has full access to all the data files and all process memory anyway.

Two all-powerful accounts are created by default — root and the OS user that owns the data directory, typically mysql. 
read more in [authentication from mariadb 10.4](https://mariadb.com/kb/en/authentication-from-mariadb-10-4/).


```sh
sudo mysql_secure_installation
# say 'n' to unix_socket
```

> <span style="color: dodgerblue;">**Note**</span>  
> After secure installation, you **cannot login** to mariadb using ~~`mysql`~~ or ~~`mariadb`~~ or ~~`mysql -u root -p`~~. You need to use `sudo mysql` (or `sudo mariadb`) and no password will be required. Mariadb is protected by your sudo password.

</br>

## Performance Schema

```sh
cd /etc/mysql/mysql.conf.d
# create a backup
sudo cp 50-server.cnf 50-server.cnf.bak

sudo nano --nowrap 50-server.cnf
```

We mainly edit `[mysqld]` section.  
The performance schema is **disabled by default** for performance reasons ([mariadb docs](https://mariadb.com/kb/en/performance-schema-overview/#activating-the-performance-schema)).

```sh
...
[mysqld]
...
# Performance Schema
performance_schema=ON
performance-schema-instrument='stage/%=ON'
performance-schema-consumer-events-stages-current=ON
performance-schema-consumer-events-stages-history=ON
performance-schema-consumer-events-stages-history-long=ON

..
```

Save. **Restart mariadb** service. `sudo systemctl restart mariadb` 

```sql
SHOW VARIABLES LIKE 'performance_schema';

SHOW VARIABLES LIKE "perf%";
```

See [this blog](https://fromdual.com/mariadb-and-mysql-performance-schema-hints) to learn how to write queries based on performance schema.

Some examples:

#### SELECT, INSERT, UPDATE and DELETE per table

Sometimes it is interesting to know how many SELECT, INSERT, UPDATE or DELETE (DML) statements have been executed against a specific table

```sql
SELECT object_type, object_schema, object_name
     , count_star, count_read, count_write, count_fetch
     , count_insert, count_update, count_delete
  FROM performance_schema.table_io_waits_summary_by_table
  WHERE count_star > 0
  ORDER BY count_star DESC
;
```

#### Top long running queries

```sql

UPDATE performance_schema.setup_consumers SET enabled = 1
    WHERE name = 'events_statements_history_long';

-- For mariadb:

SELECT left(digest_text, 64)
     , ROUND(SUM(timer_end-timer_start)/1000000000, 1) AS tot_exec_ms
     , ROUND(SUM(timer_end-timer_start)/1000000000/COUNT(*), 1) AS avg_exec_ms
     , ROUND(MIN(timer_end-timer_start)/1000000000, 1) AS min_exec_ms
     , ROUND(MAX(timer_end-timer_start)/1000000000, 1) AS max_exec_ms
     , ROUND(SUM(timer_wait)/1000000000, 1) AS tot_wait_ms
     , ROUND(SUM(timer_wait)/1000000000/COUNT(*), 1) AS avg_wait_ms
     , ROUND(MIN(timer_wait)/1000000000, 1) AS min_wait_ms
     , ROUND(MAX(timer_wait)/1000000000, 1) AS max_wait_ms
     , ROUND(SUM(lock_time)/1000000000, 1) AS tot_lock_ms
     , ROUND(SUM(lock_time)/1000000000/COUNT(*), 1) AS avglock_ms
     , ROUND(MIN(lock_time)/1000000000, 1) AS min_lock_ms
     , ROUND(MAX(lock_time)/1000000000, 1) AS max_lock_ms
     , MIN(LEFT(DATE_SUB(NOW(), INTERVAL (isgs.VARIABLE_VALUE - TIMER_START*10e-13) second), 19)) AS first_seen
     , MAX(LEFT(DATE_SUB(NOW(), INTERVAL (isgs.VARIABLE_VALUE - TIMER_START*10e-13) second), 19)) AS last_seen
     , COUNT(*) as cnt
  FROM performance_schema.events_statements_history_long
  JOIN information_schema.global_status AS isgs
  WHERE isgs.variable_name = 'UPTIME'
  GROUP BY LEFT(digest_text,64)
  ORDER BY tot_exec_ms DESC
;

-- For mysql:
-- ...
```

#### Find InnoDB Locks

see the blog.

</br>

btw, you can add bash alias. `nano ~/.bash_aliases`. Then add the following line:

```
...
alias mdbre='sudo systemctl restart mariadb'
```
Note, you must exit the current shell (& re-login) for bash aliases to take effect.


</br>

### Query Cache

In almost all production servers, it is wise to **turn off** the Query cache. Every modification to a table causes purging of all QC entries for that table. (based on [SO: Rich James](https://stackoverflow.com/questions/45412537/should-i-turn-off-query-cache-in-mysql))

It is disabled by default (based on [docs](https://mariadb.com/kb/en/query-cache/)).  

Verify if it is disabled:

```sql
SHOW VARIABLES LIKE 'query_cache%';
-- query_cache_type should be OFF
```

> <span style="color: brown;">**IMPORTANT**</span>  
> You **MUST** set `query_cache_size=0` and `query_cache_type=0` in the config file. Why? because even if `query_cache_type` is set to 0 a buffer of `query_cache_size` bytes is **still allocated**.  
Starting from MariaDB 10.1.7, query_cache_type is **automatically set to ON** if the server is started with the `query_cache_size` set to a non-zero (and non-default) value. This will happen even if `query_cache_type` is explicitly set to OFF in the configuration.  
_(based on [docs](https://mariadb.com/kb/en/server-system-variables/#query_cache_type))_

</br>

### `skip-name-resolve`

_see the video._

### Log files

Default number of days for mariadb is 10 days. This might cause the server run out of disk.

```sql
SHOW VARIABLES LIKE `expire_log%`;

SET GLOBAL expire_logs_days = 3;

-- flush the binary logs
FLUSH BINARY LOGS;
```

Also inside `50-server.cnf`:
```sh
...
expire_logs_days    = 3
```

Now, **restart mariadb**.

</br>

## innodb

`innodb_buffer_pool_size` should be about 80% (Rich James says 70%) of the server RAM.  
[`innodb_log_file_size`](https://mariadb.com/kb/en/innodb-system-variables/#innodb_log_file_size) is the size of [Redo log](https://mariadb.com/kb/en/innodb-redo-log/) files (NOT ~~Undo log~~). It records all modifications of transactions prior to being committed. This allows the database to rollback and prevent data corruption. Set it to 25% of `innodb_buffer_pool_size`.

> <span style="color: brown;">**IMPORTANT**</span>  
> Do NOT change `innodb_log_file_size` **while** mariadb is running. It may corrupt your tables. Fist stop mariadb. Set the new values. Then start mariadb.

### Redo log & Undo log

_(based on [percona](https://www.percona.com/blog/understanding-the-differences-between-innodb-undo-log-and-redo-log/) and [undo log docs](https://mariadb.com/kb/en/innodb-undo-log/))_

#### Undo log

The primary purpose of undo log (also known as _the rollback segment_),  is to support transactional consistency and provide the ability to `ROLLBACK` during a transaction.  
read more in [Undo log implementation details](https://mariadb.com/kb/en/innodb-undo-log/#implementation-details).

#### Redo log

The redo log, also known as the transaction log or InnoDB log, serves a different purpose than the undo log. Its primary function is to ensure durability and aid in crash recovery. Two of its characteristics:

- Redo Log *not only* records the changes made to the database **but also includes** the modifications that are written into the rollback segments.

- **Write-ahead logging (WAL)**: The redo log follows a write-ahead logging approach, meaning that changes are written to the redo log **before** the corresponding data pages are updated. 

```sql
SHOW VARIABLES LIKE '%innodb_buffer%';
SHOW VARIABLES LIKE '%innodb_log%';
```


### [mysqltuner](https://github.com/major/MySQLTuner-perl)

Do NOT apply mysqltuner recommendations & then immediately running mysqltuner again. Run every 60-90 days.

Also see: 
- [Warning note](https://github.com/major/MySQLTuner-perl?tab=readme-ov-file#warning)
- [MysqlTuner Internals](https://github.com/major/MySQLTuner-perl/blob/master/INTERNALS.md)


### Too many open files

```sh
ps aux | grep mysql
cat /proc/54009/limits

cd /etc/systemd/system
ls -l
# Find a directory called 'mariadb.service.d'. If not found, create it.

sudo mkdir mariadb.service.d/
cd mariadb.service.d

sudo nano --nowrap limits.conf
```

Add the following lines:

```sh
[Service]
LimitNOFILE=40000
```

Now, you must restart **BOTH daemon & mariadb service**:
```sh
# force systemd to re-read new configurations:
sudo systemctl daemon-reload

sudo systemctl restart mariadb
```