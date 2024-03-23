## Concepts

The followings are mostly based on [MySQL glossary](https://dev.mysql.com/doc/refman/8.0/en/glossary.html).

### ACID

An acronym standing for atomicity, consistency, isolation, and durability. These properties are all desirable in a database system, and are all closely tied to the notion of a transaction. The transactional features of InnoDB adhere to the ACID principles.

Transactions are atomic units of work that can be committed or rolled back. When a transaction makes multiple changes to the database, either all the changes succeed when the transaction is committed, or all the changes are undone when the transaction is rolled back.

The database remains in a consistent state at all times — after each commit or rollback, and while transactions are in progress. If related data is being updated across multiple tables, queries see either all old values or all new values, not a mix of old and new values.

Transactions are protected (isolated) from each other while they are in progress; they cannot interfere with each other or see each other's uncommitted data. This isolation is achieved through the locking mechanism. Experienced users can adjust the isolation level, trading off less protection in favor of increased performance and concurrency, when they can be sure that the transactions really do not interfere with each other.

The results of transactions are durable: once a commit operation succeeds, the changes made by that transaction are safe from power failures, system crashes, race conditions, or other potential dangers that many non-database applications are vulnerable to. Durability typically involves writing to disk storage, with a certain amount of redundancy to protect against power failures or software crashes during write operations. (In InnoDB, the doublewrite buffer assists with durability.) 

### checkpoint 

As changes are made to data pages that are cached in the buffer pool, those changes are written to the data files sometime later, a process known as flushing. The **checkpoint** is a record of the latest changes (represented by an LSN value) that have been successfully written to the data files.  

### logical backup

A backup that reproduces table structure and data, without copying the actual data files. For example, the `mysqldump` command produces a logical backup, because its output contains statements such as CREATE TABLE and INSERT that can re-create the data. Contrast with physical backup. A logical backup offers flexibility (for example, you could edit table definitions or insert statements before restoring), but can take substantially longer to restore than a physical backup. 

### buffer pool
buffer:   
A memory or disk area used for temporary storage. Data is buffered in memory so that it can be written to disk efficiently, with a few large I/O operations rather than many small ones. Data is buffered on disk for greater reliability, so that it can be recovered even when a crash or other failure occurs at the worst possible time. The main types of buffers used by InnoDB are the buffer pool, the doublewrite buffer, and the change buffer.  

buffer pool:   
The memory area that holds cached InnoDB data for both tables and indexes. For efficiency of high-volume read operations, the buffer pool is divided into pages that can potentially hold multiple rows. For efficiency of cache management, the buffer pool is implemented as a linked list of pages; data that is rarely used is aged out of the cache, using a variation of the LRU algorithm. On systems with large memory, you can improve concurrency by dividing the buffer pool into multiple buffer pool instances.

Several InnoDB status variables, `INFORMATION_SCHEMA` tables, and `performance_schema` tables help to monitor the internal workings of the buffer pool. Starting in MySQL 5.6, you can avoid a lengthy warmup period after restarting the server, particularly for instances with large buffer pools, by saving the buffer pool state at server shutdown and restoring the buffer pool to the same state at server startup.

### flush

To write changes to the database files, that had been buffered in a memory area or a temporary disk storage area. The InnoDB storage structures that are periodically flushed include the redo log, the undo log, and the buffer pool.

 Flushing can happen because a memory area becomes full and the system needs to free some space, because a commit operation means the changes from a transaction can be finalized, or because a slow shutdown operation means that all outstanding work should be finalized. When it is not critical to flush all the buffered data at once, InnoDB can use a technique called fuzzy checkpointing to flush small batches of pages to spread out the I/O overhead. 

### clustered index

The InnoDB term for a primary key index. InnoDB table storage is organized based on the values of the primary key columns, to speed up queries and sorts involving the primary key columns. For best performance, choose the primary key columns carefully based on the most performance-critical queries. Because modifying the columns of the clustered index is an expensive operation, choose primary columns that are rarely or never updated.

In the Oracle Database product, this type of table is known as an index-organized table. 

### secondary index

A type of InnoDB index that represents a subset of table columns. An InnoDB table can have zero, one, or many secondary indexes. (Contrast with the clustered index, which is required for each InnoDB table, and stores the data for all the table columns.)

A secondary index can be used to satisfy queries that only require values from the indexed columns. For more complex queries, it can be used to identify the relevant rows in the table, which are then retrieved through lookups using the clustered index.

Creating and dropping secondary indexes has traditionally involved significant overhead from copying all the data in the InnoDB table. The _fast index creation_ feature makes both CREATE INDEX and DROP INDEX statements much faster for InnoDB secondary indexes. 

### fast shutdown

The default shutdown procedure for InnoDB, based on the configuration setting innodb_fast_shutdown=1. To save time, certain flush operations are skipped. This type of shutdown is safe during normal usage, because the flush operations are performed during the next startup, using the same mechanism as in crash recovery. In cases where the database is being shut down for an upgrade or downgrade, do a slow shutdown instead to ensure that all relevant changes are applied to the data files during the shutdown. 

### column prefix

When an index is created with a length specification, such as CREATE INDEX idx ON t1 (c1(N)), only the first N characters of the column value are stored in the index. Keeping the index prefix small makes the index compact, and the memory and disk I/O savings help performance. (Although making the index prefix too small can hinder query optimization by making rows with different values appear to the query optimizer to be duplicates.)

For columns containing binary values or long text strings, where sorting is not a major consideration and storing the entire value in the index would waste space, the index automatically uses the first N (typically 768) characters of the value to do lookups and sorts. 

### crash

MySQL uses the term “crash” to refer generally to any unexpected shutdown operation where the server cannot do its normal cleanup. For example, a crash could happen due to a hardware fault on the database server machine or storage device; a power failure; a potential data mismatch that causes the MySQL server to halt; a fast shutdown initiated by the DBA; or many other reasons. The robust, automatic crash recovery for InnoDB tables ensures that data is made consistent when the server is restarted, *without* any extra work for the DBA. 


### data dictionary

Metadata that keeps track of database objects such as tables, indexes, and table columns. For the MySQL data dictionary, introduced in MySQL 8.0, metadata is physically located in InnoDB file-per-table tablespace files in the mysql database directory. For the InnoDB data dictionary, metadata is physically located in the InnoDB system tablespace.

Because the MySQL Enterprise Backup product always backs up the InnoDB system tablespace, all backups include the contents of the InnoDB data dictionary. 

### data files

The files that physically contain table and index data.

The InnoDB system tablespace, which holds the InnoDB data dictionary and is capable of holding data for multiple InnoDB tables, is represented by one or more `.ibdata` data files.

File-per-table tablespaces, which hold data for a single InnoDB table, are represented by a `.ibd` data file.

General tablespaces (introduced in MySQL 5.7.6), which can hold data for multiple InnoDB tables, are also represented by a `.ibd` data file. 

### doublewrite buffer

InnoDB uses a file flush technique called doublewrite. Before writing pages to the data files, InnoDB first writes them to a storage area called the doublewrite buffer. Only after the write and the flush to the doublewrite buffer have completed, does InnoDB write the pages to their proper positions in the data file. If there is an operating system, storage subsystem or mysqld process crash in the middle of a page write, InnoDB can find a good copy of the page from the doublewrite buffer during crash recovery.

Although data is always written twice, the doublewrite buffer does not require twice as much I/O overhead or twice as many I/O operations. Data is written to the buffer itself as a large sequential chunk, with a single fsync() call to the operating system. 

### optimistic

A methodology that guides low-level implementation decisions for a relational database system. The requirements of performance and concurrency in a relational database mean that operations must be started or dispatched quickly. The requirements of consistency and referential integrity mean that any operation could fail: a transaction might be rolled back, a DML operation could violate a constraint, a request for a lock could cause a deadlock, a network error could cause a timeout. An optimistic strategy is one that assumes most requests or attempts succeed, so that relatively little work is done to prepare for the failure case. When this assumption is true, the database does little unnecessary work; when requests do fail, extra work must be done to clean up and undo changes.

InnoDB uses optimistic strategies for operations such as locking and commits. For example, data changed by a transaction can be written to the data files before the commit occurs, making the commit itself very fast, but requiring more work to undo the changes if the transaction is rolled back.

The opposite of an optimistic strategy is a pessimistic one, where a system is optimized to deal with operations that are unreliable and frequently unsuccessful. This methodology is rare in a database system, because so much care goes into choosing reliable hardware, networks, and algorithms. 

### commit

A SQL statement that ends a transaction, making permanent any changes made by the transaction. It is the opposite of rollback, which undoes any changes made in the transaction.

InnoDB uses an optimistic mechanism for commits, so that changes can be written to the data files before the commit actually occurs. This technique makes the commit itself faster, with the tradeoff that more work is required in case of a rollback.

By default, MySQL uses the autocommit setting, which automatically issues a commit following each SQL statement. 

### replica

A database server machine in a replication topology that receives changes from another server (the source) and applies those same changes. Thus it maintains the same contents as the source, although it might lag somewhat behind.

In MySQL, replicas are commonly used in disaster recovery, to take the place of a source that fails. They are also commonly used for testing software upgrades and new settings, to ensure that database configuration changes do not cause problems with performance or reliability.

Replicas typically have high workloads, because they process all the DML (write) operations relayed from the source, as well as user queries. To ensure that replicas can apply changes from the source fast enough, they frequently have fast I/O devices and sufficient CPU and memory to run multiple database instances on the same server. For example, the source might use hard drive storage while the replicas use SSDs.

### replication

The practice of sending changes from a source, to one or more replicas, so that all databases have the same data. This technique has a wide range of uses, such as load-balancing for better scalability, disaster recovery, and testing software upgrades and configuration changes. The changes can be sent between the databases by methods called row-based replication and statement-based replication. 

types of replication:

- **statement-based replication**: A form of replication where SQL statements are sent from the source and replayed on the replica. It requires some care with the setting for the innodb_autoinc_lock_mode option, to avoid potential timing problems with auto-increment locking.  

- **row-based replication**: A form of replication where events are propagated from the source specifying how to change individual rows on the replica. It is safe to use for all settings of the innodb_autoinc_lock_mode option. 

Replication enables data from one MySQL database server (known as a source) to be copied to one or more MySQL database servers (known as replicas). Replication is asynchronous by default; replicas do not need to be connected permanently to receive updates from a source. Depending on the configuration, you can replicate all databases, selected databases, or even selected tables within a database.

Advantages of replication in MySQL include:  

- Scale-out solutions - spreading the load among multiple replicas to improve performance. In this environment, all writes and updates must take place on the source server. Reads, however, may take place on one or more replicas. This model can improve the performance of writes (since the source is dedicated to updates), while dramatically increasing read speed across an increasing number of replicas.
- Data security - because the replica can pause the replication process, it is possible to run backup services on the replica without corrupting the corresponding source data.
- Analytics - live data can be created on the source, while the analysis of the information can take place on the replica without affecting the performance of the source.
- Long-distance data distribution - you can use replication to create a local copy of data for a remote site to use, without permanent access to the source. 



### auto-increment

A property of a table column (specified by the AUTO_INCREMENT keyword) that automatically adds an ascending sequence of values in the column.

It saves work for the developer, not to have to produce new unique values when inserting new rows. It provides useful information for the query optimizer, because the column is known to be not null and with unique values. The values from such a column can be used as lookup keys in various contexts, and because they are auto-generated there is no reason to ever change them; for this reason, primary key columns are often specified as auto-incrementing.

Auto-increment columns can be **problematic** with statement-based replication, because replaying the statements on a replica might not produce the same set of column values as on the source, due to timing issues. When you have an auto-incrementing primary key, you can use statement-based replication only with the setting innodb_autoinc_lock_mode=1. If you have innodb_autoinc_lock_mode=2, which allows higher concurrency for insert operations, use row-based replication rather than statement-based replication. The setting innodb_autoinc_lock_mode=0 should not be used except for compatibility purposes.

Consecutive lock mode (innodb_autoinc_lock_mode=1) is the default setting prior to MySQL 8.0.3. As of MySQL 8.0.3, interleaved lock mode (innodb_autoinc_lock_mode=2) is the default, which reflects the change from statement-based to row-based replication as the default replication type. 

### isolation level
One of the foundations of database processing. Isolation is the I in the acronym ACID; the isolation level is the setting that fine-tunes the balance between performance and reliability, consistency, and reproducibility of results when multiple transactions are making changes and performing queries at the same time.  

From highest amount of consistency and protection to the least, the isolation levels supported by InnoDB are: SERIALIZABLE, REPEATABLE READ, READ COMMITTED, and READ UNCOMMITTED.  

With InnoDB tables, many users can keep the default isolation level (REPEATABLE READ) for all operations. Expert users might choose the READ COMMITTED level as they push the boundaries of scalability with OLTP processing, or during data warehousing operations where minor inconsistencies do not affect the aggregate results of large amounts of data. The levels on the edges (SERIALIZABLE and READ UNCOMMITTED) change the processing behavior to such an extent that they are rarely used.   


### phantom

A row that appears in the result set of a query, but not in the result set of an earlier query. For example, if a query is run twice within a transaction, and in the meantime, another transaction commits after inserting a new row or updating a row so that it matches the WHERE clause of the query.

This occurrence is known as a phantom read. It is harder to guard against than a non-repeatable read, because locking all the rows from the first query result set does not prevent the changes that cause the phantom to appear.

Among different isolation levels, phantom reads are prevented by the serializable read level, and allowed by the repeatable read, consistent read, and read uncommitted levels. 

### non-repeatable read

The situation when a query retrieves data, and a later query within the same transaction retrieves what should be the same data, but the queries return different results (changed by another transaction committing in the meantime).

This kind of operation goes against the ACID principle of database design. Within a transaction, data should be consistent, with predictable and stable relationships.

Among different isolation levels, non-repeatable reads are prevented by the serializable read and repeatable read levels, and allowed by the consistent read, and read uncommitted levels. 

### natural key

An indexed column, typically a primary key, where the values have some real-world significance. Usually **advised against** because:  

- If the value should ever change, there is potentially a lot of index maintenance to re-sort the clustered index and update the copies of the primary key value that are repeated in each secondary index.

- Even seemingly stable values can change in unpredictable ways that are difficult to represent correctly in the database. For example, one country can change into two or several, making the original country code obsolete. Or, rules about unique values might have exceptions. For example, even if taxpayer IDs are intended to be unique to a single person, a database might have to handle records that violate that rule, such as in cases of identity theft. Taxpayer IDs and other sensitive ID numbers also make poor primary keys, because they may need to be secured, encrypted, and otherwise treated differently than other columns. 

Thus, it is typically better to use arbitrary numeric values to form a synthetic key, for example using an auto-increment column. 

### page

A unit representing how much data InnoDB transfers at any one time between disk (the data files) and memory (the buffer pool). A page can contain one or more rows, depending on how much data is in each row. If a row does not fit entirely into a single page, InnoDB sets up additional pointer-style data structures so that the information about the row can be stored in one page.

One way to fit more data in each page is to use compressed row format. For tables that use BLOBs or large text fields, compact row format allows those large columns to be stored separately from the rest of the row, reducing I/O overhead and memory usage for queries that do not reference those columns.

When InnoDB reads or writes sets of pages as a batch to increase I/O throughput, it reads or writes an extent at a time.
All the InnoDB disk data structures within a MySQL instance share the same page size.

### page cleaner

An InnoDB background thread that flushes dirty pages from the buffer pool. Prior to MySQL 5.6, this activity was performed by the master thread. The number of page cleaner threads is controlled by the innodb_page_cleaners configuration option, introduced in MySQL 5.7.4.  

### dirty page

A page in the InnoDB buffer pool that has been updated in memory, where the changes are not yet written (flushed) to the data files. The opposite of a clean page.  

### overflow page

Separately allocated disk pages that hold variable-length columns (such as BLOB and VARCHAR) that are too long to fit on a B-tree page. The associated columns are known as **off-page columns**.  

### `mysql`

The mysql program is the command-line interpreter for the MySQL database. It processes SQL statements, and also MySQL-specific commands such as SHOW TABLES, by passing requests to the mysqld daemon.  

### `mysqld`

mysqld, also known as MySQL Server, is a single multithreaded program that does most of the work in a MySQL installation. It does not spawn additional processes. MySQL Server manages access to the MySQL data directory that contains databases, tables, and other information such as log files and status files.
mysqld runs as a Unix daemon or Windows service, constantly waiting for requests and performing maintenance work in the background. 


### spin

A type of wait operation that continuously tests whether a resource becomes available. This technique is used for resources that are typically held only for brief periods, where it is more efficient to wait in a “busy loop” than to put the thread to sleep and perform a context switch. If the resource does not become available within a short time, the spin loop ceases and another wait technique is used.  

</br>
&nbsp;
</br>


## Locking  
The system of protecting a transaction from seeing or changing data that is being queried or changed by other transactions. The locking strategy must balance reliability and consistency of database operations (the principles of the ACID philosophy) against the performance needed for good concurrency. Fine-tuning the locking strategy often involves choosing an isolation level and ensuring all your database operations are safe and reliable for that isolation level.  


### lock

The high-level notion of an object that controls access to a resource, such as a table, row, or internal data structure, as part of a locking strategy. For intensive performance tuning, you might delve into the actual structures that implement locks, such as mutexes and latches.  

### mutex

Informal abbreviation for “mutex variable”. (Mutex itself is short for “mutual exclusion”.) The low-level object that InnoDB uses to represent and enforce exclusive-access locks to internal in-memory data structures. Once the lock is acquired, any other process, thread, and so on is prevented from acquiring the same lock. Contrast with rw-locks, which InnoDB uses to represent and enforce shared-access locks to internal in-memory data structures. Mutexes and rw-locks are known collectively as latches. 

Definition from [SO](https://stackoverflow.com/questions/34524/what-is-a-mutex):  
When I am having a big heated discussion at work, I use a rubber chicken which I keep in my desk for just such occasions. The person holding the chicken is the only person who is allowed to talk. If you don't hold the chicken you cannot speak. You can only indicate that you want the chicken and wait until you get it before you speak. Once you have finished speaking, you can hand the chicken back to the moderator who will hand it to the next person to speak. This ensures that people do not speak over each other, and also have their own space to talk. Replace Chicken with Mutex and person with thread and you basically have the concept of a mutex.  
The chicken is the mutex. People hoilding the mu.. chicken are competing threads. The Moderator is the OS. When people requests the chicken, they do a lock request. When you call mutex.lock(), your thread stalls in lock() and makes a lock request to the OS. When the OS detects that the mutex was released from a thread, it merely gives it to you, and lock() returns - the mutex is now yours and only yours. Nobody else can steal it, because calling lock() will block him. There is also try_lock() that will block and return true when mutex is yours and immediately false if mutex is in use.

### rw-lock

The low-level object that InnoDB uses to represent and enforce shared-access locks to internal in-memory data structures following certain rules. Contrast with mutexes, which InnoDB uses to represent and enforce exclusive access to internal in-memory data structures. Mutexes and rw-locks are known collectively as latches. rw-lock types include s-locks (shared locks), x-locks (exclusive locks), and sx-locks (shared-exclusive locks). An `s-lock` provides read access to a common resource. An `x-lock` provides write access to a common resource while **not** permitting inconsistent reads by other threads. An `sx-lock` provides write access to a common resource while permitting inconsistent reads by other threads. sx-locks were introduced in MySQL 5.7 to optimize concurrency and improve scalability for read-write workloads. 


### lock mode

A **shared** (S) lock allows a transaction to read a row. Multiple transactions can acquire an S lock on that same row at the same time.

An **exclusive** (X) lock allows a transaction to update or delete a row. No other transaction can acquire any kind of lock on that same row at the same time.

**Intention locks** apply to the table, and are used to indicate what kind of lock the transaction intends to acquire on rows in the table. Different transactions can acquire different kinds of intention locks on the same table, but the first transaction to acquire an intention exclusive (IX) lock on a table prevents other transactions from acquiring any S or X locks on the table. Conversely, the first transaction to acquire an intention shared (IS) lock on a table prevents other transactions from acquiring any X locks on the table. The two-phase process allows the lock requests to be resolved in order, without blocking locks and corresponding operations that are compatible.   

### Locking Read  
A SELECT statement that also performs a locking operation on an InnoDB table. Either `SELECT ... FOR UPDATE` or `SELECT ... LOCK IN SHARE MODE`. It has the potential to produce a deadlock, depending on the isolation level of the transaction. The opposite of a non-locking read. Not allowed for global tables in a read-only transaction.

`SELECT ... FOR SHARE` replaces `SELECT ... LOCK IN SHARE MODE` in MySQL 8.0.1, but `LOCK IN SHARE MODE` remains available for backward compatibility. 

[From innodb locking reads](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html):  
If you query data and then insert or update related data within the same transaction, the regular SELECT statement does not give enough protection. Other transactions can update or delete the same rows you just queried. InnoDB supports two types of locking reads that offer extra safety:  

`SELECT ... FOR SHARE`  

Sets a shared mode lock on any rows that are read. Other sessions can read the rows, but cannot modify them until your transaction commits. If any of these rows were changed by another transaction that has not yet committed, your query waits until that transaction ends and then uses the latest values.  

And...

`SELECT ... FOR UPDATE`

For index records the search encounters, locks the rows and any associated index entries, the same as if you issued an UPDATE statement for those rows. Other transactions are blocked from updating those rows, from doing `SELECT ... FOR SHARE`, or from reading the data in certain transaction isolation levels. Consistent reads ignore any locks set on the records that exist in the read view. (Old versions of a record cannot be locked; they are reconstructed by applying undo logs on an in-memory copy of the record.)

`SELECT ... FOR UPDATE` requires the SELECT privilege and at least one of the DELETE, LOCK TABLES, or UPDATE privileges. 

These clauses are primarily useful when dealing with tree-structured or graph-structured data, either in a single table or split across multiple tables. You traverse edges or tree branches from one place to another, while reserving the right to come back and change any of these “pointer” values.

All locks set by FOR SHARE and FOR UPDATE queries are released when the transaction is committed or rolled back. 

### Locking Read Examples

Suppose that you want to insert a new row into a table child, and make sure that the child row has a parent row in table parent. Your application code can ensure referential integrity throughout this sequence of operations.

First, use a consistent read to query the table PARENT and verify that the parent row exists. Can you safely insert the child row to table CHILD? No, because some other session could delete the parent row in the moment between your SELECT and your INSERT, without you being aware of it.

To avoid this potential issue, perform the SELECT using FOR SHARE:

```sql
SELECT * FROM parent WHERE NAME = 'Jones' FOR SHARE;
```

After the FOR SHARE query returns the parent 'Jones', you can safely add the child record to the CHILD table and commit the transaction. Any transaction that tries to acquire an exclusive lock in the applicable row in the PARENT table waits until you are finished, that is, until the data in all tables is in a consistent state.

For another example, consider an integer counter field in a table CHILD_CODES, used to assign a unique identifier to each child added to table CHILD. Do not use either consistent read or a shared mode read to read the present value of the counter, because two users of the database could see the same value for the counter, and a duplicate-key error occurs if two transactions attempt to add rows with the same identifier to the CHILD table.

Here, FOR SHARE is not a good solution because if two users read the counter at the same time, at least one of them ends up in deadlock when it attempts to update the counter.

To implement reading and incrementing the counter, first perform a locking read of the counter using FOR UPDATE, and then increment the counter. For example:
```sql
SELECT counter_field FROM child_codes FOR UPDATE;
UPDATE child_codes SET counter_field = counter_field + 1;
```
A SELECT ... FOR UPDATE reads the latest available data, setting exclusive locks on each row it reads. Thus, it sets the same locks a searched SQL UPDATE would set on the rows.

The preceding description is merely an example of how SELECT ... FOR UPDATE works. In MySQL, the specific task of generating a unique identifier actually can be accomplished using only a single access to the table:
```sql
UPDATE child_codes SET counter_field = LAST_INSERT_ID(counter_field + 1);
SELECT LAST_INSERT_ID();
```
The SELECT statement merely retrieves the identifier information (specific to the current connection). It does not access any table. 

**NOWAIT / SKIP LOCKED**:  If a row is locked by a transaction, a SELECT ... FOR UPDATE or SELECT ... FOR SHARE transaction that requests the same locked row must wait until the blocking transaction releases the row lock. This behavior prevents transactions from updating or deleting rows that are queried for updates by other transactions. However, waiting for a row lock to be released is not necessary if you want the query to return immediately when a requested row is locked, or if excluding locked rows from the result set is acceptable.

To avoid waiting for other transactions to release row locks, **NOWAIT** and **SKIP LOCKED** options may be used with SELECT ... FOR UPDATE or SELECT ... FOR SHARE locking read statements.  

NOWAIT and SKIP LOCKED only apply to row-level locks.

Statements that use NOWAIT or SKIP LOCKED are unsafe for statement based replication. 


## Consistent Read
A read operation that uses snapshot information to present query results based on a point in time, regardless of changes performed by other transactions running at the same time. If queried data has been changed by another transaction, the original data is reconstructed based on the contents of the undo log. This technique avoids some of the locking issues that can reduce concurrency by forcing transactions to wait for other transactions to finish.  
 
With REPEATABLE READ isolation level, the snapshot is based on the time when the first read operation is performed. With READ COMMITTED isolation level, the snapshot is reset to the time of each consistent read operation.  

Consistent read is the default mode in which InnoDB processes SELECT statements in READ COMMITTED and REPEATABLE READ isolation levels. Because a consistent read does not set any locks on the tables it accesses, other sessions are free to modify those tables while a consistent read is being performed on the table. 

Related...  

### Consistent Non-Blocking Reads (MySQL)

A consistent read means that InnoDB uses multi-versioning to present to a query a snapshot of the database at a point in time. The query sees the changes made by transactions that committed before that point in time, and no changes made by later or uncommitted transactions. The exception to this rule is that the query sees the changes made by earlier statements within the same transaction. This exception causes the following anomaly: If you update some rows in a table, a SELECT sees the latest version of the updated rows, but it might also see older versions of any rows. If other sessions simultaneously update the same table, the anomaly means that you might see the table in a state that never existed in the database.

If the transaction isolation level is REPEATABLE READ (the default level), all consistent reads within the same transaction read the snapshot established by the first such read in that transaction. You can get a fresher snapshot for your queries by committing the current transaction and after that issuing new queries.

With READ COMMITTED isolation level, each consistent read within a transaction sets and reads its own fresh snapshot.

Consistent read is the default mode in which InnoDB processes SELECT statements in READ COMMITTED and REPEATABLE READ isolation levels. A consistent read does not set any locks on the tables it accesses, and therefore other sessions are free to modify those tables at the same time a consistent read is being performed on the table.

Suppose that you are running in the default REPEATABLE READ isolation level. When you issue a consistent read (that is, an ordinary SELECT statement), InnoDB gives your transaction a timepoint according to which your query sees the database. If another transaction deletes a row and commits after your timepoint was assigned, you do not see the row as having been deleted. Inserts and updates are treated similarly. 

**Note**: The snapshot of the database state applies to SELECT statements within a transaction, not necessarily to DML statements. If you insert or modify some rows and then commit that transaction, a DELETE or UPDATE statement issued from another concurrent REPEATABLE READ transaction could affect those just-committed rows, even though the session could not query them. If a transaction does update or delete rows committed by a different transaction, those changes do become visible to the current transaction. For example, you might encounter a situation like the following:

```sql
SELECT COUNT(c1) FROM t1 WHERE c1 = 'xyz';
-- Returns 0: no rows match.
DELETE FROM t1 WHERE c1 = 'xyz';
-- Deletes several rows recently committed by other transaction.

SELECT COUNT(c2) FROM t1 WHERE c2 = 'abc';
-- Returns 0: no rows match.
UPDATE t1 SET c2 = 'cba' WHERE c2 = 'abc';
-- Affects 10 rows: another txn just committed 10 rows with 'abc' values.
SELECT COUNT(c2) FROM t1 WHERE c2 = 'cba';
-- Returns 10: this txn can now see the rows it just updated.
```

You can advance your timepoint by committing your transaction and then doing another SELECT or START TRANSACTION WITH CONSISTENT SNAPSHOT.

This is called **multi-versioned concurrency control**.

In the following example, session A sees the row inserted by B **only when** B has committed the insert and A has committed as well, so that the timepoint is advanced past the commit of B.

```sql
             Session A              Session B

           SET autocommit=0;      SET autocommit=0;
time
|          SELECT * FROM t;
|          empty set
|                                 INSERT INTO t VALUES (1, 2);
|
v          SELECT * FROM t;
           empty set
                                  COMMIT;

           SELECT * FROM t;
           empty set

           COMMIT;

           SELECT * FROM t;
           ---------------------
           |    1    |    2    |
           ---------------------
```

If you want to see the “freshest” state of the database, use either the READ COMMITTED isolation level or a locking read:

```sql
SELECT * FROM t FOR SHARE;
```

With READ COMMITTED isolation level, each consistent read within a transaction sets and reads its own fresh snapshot. With FOR SHARE, a locking read occurs instead: A SELECT blocks until the transaction containing the freshest rows ends (see Section 17.7.2.4, “Locking Reads”).

Consistent read does not work over certain DDL statements:  

- Consistent read does not work over DROP TABLE, because MySQL cannot use a table that has been dropped and InnoDB destroys the table.  

- Consistent read does not work over ALTER TABLE operations that make a temporary copy of the original table and delete the original table when the temporary copy is built. When you reissue a consistent read within a transaction, rows in the new table are not visible because those rows did not exist when the transaction's snapshot was taken. In this case, the transaction returns an error: ER_TABLE_DEF_CHANGED, “Table definition has changed, please retry transaction”.  

The type of read varies for selects in clauses like INSERT INTO ... SELECT, UPDATE ... (SELECT), and CREATE TABLE ... SELECT that do not specify FOR UPDATE or FOR SHARE:  

- By default, InnoDB uses stronger locks for those statements and the SELECT part acts like READ COMMITTED, where each consistent read, even within the same transaction, sets and reads its own fresh snapshot.  

- To perform a nonlocking read in such cases, set the isolation level of the transaction to READ UNCOMMITTED or READ COMMITTED to avoid setting locks on rows read from the selected table. 

## Locking and Foreign keys

According to [MySQL FOREIGN KEY Constraint docs](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html):  
MySQL extends metadata locks, as necessary, to tables that are related by a foreign key constraint. Extending metadata locks prevents conflicting DML and DDL operations from executing concurrently on related tables. This feature also enables updates to foreign key metadata when a parent table is modified. In earlier MySQL releases, foreign key metadata, which is owned by the child table, could not be updated safely.

If a table is locked explicitly with LOCK TABLES, any tables related by a foreign key constraint are opened and locked implicitly. For foreign key checks, a shared read-only lock (LOCK TABLES READ) is taken on related tables. For cascading updates, a shared-nothing write lock (LOCK TABLES WRITE) is taken on related tables that are involved in the operation. 
  
</br>
&nbsp;
</br>

  

</br>
&nbsp;
</br>


## Transactions (MySQL)

`autocommit` setting:  
A setting that causes a commit operation after each SQL statement. This mode is not recommended for working with InnoDB tables with transactions that span several statements. It can help performance for read-only transactions on InnoDB tables, where it minimizes overhead from locking and generation of undo data, especially in MySQL 5.6.4 and up. It is also appropriate for working with MyISAM tables, where transactions are not applicable.  

Based on [innodb docs](https://dev.mysql.com/doc/refman/8.0/en/innodb-autocommit-commit-rollback.html):  
In InnoDB, all user activity occurs inside a transaction. If autocommit mode is enabled, each SQL statement forms a single transaction on its own. By default, MySQL starts the session for each new connection with autocommit enabled, so MySQL does a commit after each SQL statement if that statement did not return an error. If a statement returns an error, the commit or rollback behavior depends on the error. See Section 17.21.5, “InnoDB Error Handling”.

A session that has autocommit enabled can perform a multiple-statement transaction by starting it with an explicit START TRANSACTION or BEGIN statement and ending it with a COMMIT or ROLLBACK statement. See Section 15.3.1, “START TRANSACTION, COMMIT, and ROLLBACK Statements”.

If autocommit mode is disabled within a session with `SET autocommit = 0`, the session always has a transaction open. A COMMIT or ROLLBACK statement ends the current transaction and a new one starts.

If a session that has autocommit disabled ends without explicitly committing the final transaction, MySQL rolls back that transaction.

Some statements implicitly end a transaction, as if you had done a COMMIT before executing the statement. For details, see Section 15.3.3, “Statements That Cause an Implicit Commit”.

A COMMIT means that the changes made in the current transaction are made permanent and become visible to other sessions. A ROLLBACK statement, on the other hand, cancels all modifications made by the current transaction. Both COMMIT and ROLLBACK release all InnoDB locks that were set during the current transaction. 

According to [MySQL docs](https://dev.mysql.com/doc/refman/8.0/en/commit.html):  
```sql
START TRANSACTION;
SELECT @A:=SUM(salary) FROM table1 WHERE type=1;
UPDATE table2 SET summary=@A WHERE type=1;
COMMIT;
```
With START TRANSACTION, `autocommit` remains disabled until you end the transaction with COMMIT or ROLLBACK. The autocommit mode then reverts to its previous state.


## Delete (MySQL)

Based on MySQL glossary, when InnoDB processes a DELETE statement, the rows are immediately marked for deletion and no longer are returned by queries. The storage is reclaimed sometime later, during the periodic garbage collection known as the purge operation. For removing large quantities of data, related operations with their own performance characteristics are TRUNCATE and DROP. 

*Side Note*:  
If the DELETE statement includes an `ORDER BY` clause, rows are deleted in the order specified by the clause. This is useful primarily in conjunction with LIMIT. For example, the following statement finds rows matching the WHERE clause, sorts them by timestamp_column, and deletes the first (oldest) one:
```sql
DELETE FROM somelog WHERE user = 'jcole'
ORDER BY timestamp_column LIMIT 1;
```

Also according to [InnoDB Multi-Versioning](https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html):  

In the InnoDB multi-versioning scheme, a row is not physically removed from the database immediately when you delete it with an SQL statement. InnoDB only physically removes the corresponding row and its index records when it discards the update undo log record written for the deletion. This removal operation is called a purge, and it is quite fast, usually taking the same order of time as the SQL statement that did the deletion.

If you insert and delete rows in smallish batches at about the same rate in the table, the purge thread can start to lag behind and the table can grow bigger and bigger because of all the “dead” rows, making everything disk-bound and very slow. In such cases, throttle new row operations, and allocate more resources to the purge thread by tuning the innodb_max_purge_lag system variable

According to [Rich James delete big blog](https://mysql.rjweb.org/doc.php/deletebig):   
To be ready for a crash, a transactional engine such as InnoDB will record what it is doing to a log file. To make that somewhat less costly, the log file is sequentially written. If the log files you have (there are usually 2) fill up because the delete is really big, then the undo information spills into the actual data blocks, leading to even more I/O.  

The same person in https://stackoverflow.com/a/49703493:   
In InnoDB, a DELETE of any size is transactional. Deleting a million will be slow, mostly because of the need to prepare for a possible ROLLBACK.

Also according to [official docs about delete](https://dev.mysql.com/doc/refman/8.0/en/delete.html) below "InnoDB Tables" section, there is a trick which uses RENAME and doesn't use DELETE at all.


## FOREIGN KEY (MySQL)

[Based on MySQL docs](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)  
`RESTRICT`: Rejects the delete or update operation for the parent table. Specifying RESTRICT (or NO ACTION) is the same as omitting the ON DELETE or ON UPDATE clause.  

`SET NULL`: Delete or update the row from the parent table and set the foreign key column or columns in the child table to NULL. Both `ON DELETE SET NULL` and `ON UPDATE SET NULL` clauses are supported. If you specify a `SET NULL` action, make sure that you have not declared the columns in the child table as `NOT NULL`.   

InnoDB performs cascading operations using a depth-first search algorithm on the records of the index that corresponds to the foreign key constraint. 

Note: Cascaded foreign key actions do **not** activate triggers.


### Dropping Foreign Key Constraints

To determine the foreign key constraint name, use:  
```sql
SHOW CREATE TABLE;
ALTER TABLE child DROP FOREIGN KEY `child_ibfk_1`;
```

</br>

## Charset and Collation (MySQL)

[Planetscale](https://planetscale.com/blog/mysql-charsets-collations#summary):  
A character set can be defined at the column level, the table level, or it can be inherited from the database or server default. The most specific level (column > table > database > server) is used.

Benefits of `utf8mb4_unicode_ci` over `utf8mb4_general_ci`: `utf8mb4_unicode_ci`, which uses the Unicode rules for sorting and comparison, employs a fairly complex algorithm for correct sorting in a wide range of languages and when using a wide range of special characters. (based on [this SO](https://stackoverflow.com/questions/766809/whats-the-difference-between-utf8-general-ci-and-utf8-unicode-ci)).  
Based on tchrist comment: You should never, ever use utf8_general_ci: it simply doesn’t work.  


Also this post is great: https://dev.mysql.com/blog-archive/mysql-8-0-1-accent-and-case-sensitive-collations-for-utf8mb4/.  
In MySQL 8.0.0 we improved our character set support with the addition of new accent and case insensitive (ai_ci) collations.  In MySQL 8.0.1 the corresponding accent and case sensitive collations (as_cs) have also been added, as well as a Japanese collation:
```sql
select collation_name from information_schema.collations 
    where character_set_name='utf8mb4' 
    and collation_name like '%as_cs' 
    order by collation_name;

```


Also take a look at `SET NAMES` statement.   
This statement sets the three session system variables `character_set_client`, `character_set_connection`, and `character_set_results` to the given character set. Setting `character_set_connection` to `charset_name` also sets `collation_connection` to the default collation for `charset_name`. Run 

```sql
set names utf8mb4;
select 'a' < 'A' collate utf8mb4_0900_as_cs;

create table abc (a varchar(20)) character set utf8mb4;
select * from abc order by a collate utf8mb4_0900_as_cs;
```

If you use COLLATE `utf8mb4_bin`, then ORDER BY on text fields becomes case-sensitive (i.e. "XYZ" comes before "abc"). (based on [this SO](https://stackoverflow.com/questions/39463134/how-to-store-emoji-character-in-mysql-database)).

**NOTE:** Even if you create db with `CREATE DATABASE database_name DEFAULT CHARSET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;`, Your connection **also** needs to be utf8mb4 not utf8 for it to work. (based on comment by Henrik Hansen in [this SO](https://stackoverflow.com/a/50264108))

For emails we use case sensitive.
See comment by Matthew James Briggs in [SO about email addresses](https://stackoverflow.com/questions/9807909/are-email-addresses-case-sensitive).

**Important:** Also you **must** be careful about many other things (not related to db). See this answer by Rich James, https://stackoverflow.com/questions/38363566/trouble-with-utf-8-characters-what-i-see-is-not-what-i-stored/38363567#38363567.  
For example: HTML forms should start like `<form accept-charset="UTF-8">`, etc.

**NOTE**: [SO comment by thomas rustter](https://stackoverflow.com/a/3455478), for columns which are an ASCII-limited code only rather than real words (eg hashes, base64, standard country codes, etc), it may be a good idea to use the ascii_bin collation. If you use a utf-8 based collation it will reserve 3 or 4 bytes per character for CHAR columns instead of only 1.


<br/>

## utfmb4

[SO 1](https://stackoverflow.com/a/60310946):    
Also the statement about utf8mb4 taking more bytes is not accurate. Only if your content actually needs multi-byte characters, then those individual characters will take 2, 3, or 4 bytes. More common characters in utf8 still take 1 byte per character. This is the whole point of utf8!

Also from [Planetscale](https://planetscale.com/blog/mysql-charsets-collations#character-sets-in-mysql):    
According to the UTF-8 spec, each character is allowed four bytes, meaning MySQL's utf8 charset was never actually UTF-8 since it only supported three bytes per character. In MySQL 8, utf8mb4 is the default character set and the one you will use most often. utf8 is left for backwards compatibility and should no longer be used.

</br>

## `RANK`

The `RANK()` function assigns a rank to each row within the partition of a result set. The rank of a row is specified by one plus the number of ranks that come before it. The `PARTITION BY` clause divides the result sets into partitions. The RANK() function is performed within partitions and re-initialized when crossing the partition boundary. The `ORDER BY` clause sorts the rows within a partition by one or more columns or expressions. Unlike the ROW_NUMBER() function, the RANK() function does not always return consecutive integers.  

Suppose you have a sample table as follows:

```sql
CREATE TABLE t (
    val INT
);

INSERT INTO t(val)
VALUES(1),(2),(2),(3),(4),(4),(5);

SELECT 
    val,
    RANK() OVER ( ORDER BY val ) my_rank
FROM t;
```

Here is the output:  
![image0021](image0021.png)

The following statement uses the RANK() function to rank the sales employees by sales amount every year:

```sql
CREATE TABLE IF NOT EXISTS sales(
    sales_employee VARCHAR(50) NOT NULL,
    fiscal_year INT NOT NULL,
    sale DECIMAL(14,2) NOT NULL,
    PRIMARY KEY(sales_employee,fiscal_year)
);


SELECT
    sales_employee,
    fiscal_year,
    sale,
    RANK() OVER (PARTITION BY fiscal_year ORDER BY sale DESC) sales_rank
FROM sales;
```

---

## Query

### One

[SO question](https://stackoverflow.com/questions/121387/fetch-the-rows-which-have-the-max-value-for-a-column-for-each-distinct-value-of/121450#121450):  

Table: UserId, Value, Date.
I want to get the UserId, Value for the max(Date) for each UserId. That is, the Value for each UserId that has the latest date.  
How do I do this in SQL? (Preferably Oracle.)


*Answer by Bill Karwin*:  

I see many people use subqueries or else window functions to do this, but I often do this kind of query without subqueries in the following way. It uses plain, standard SQL so it should work in any brand of RDBMS.

```sql
SELECT t1.*
FROM mytable t1
  LEFT OUTER JOIN mytable t2
    ON (t1.UserId = t2.UserId AND t1."Date" < t2."Date")
WHERE t2.UserId IS NULL;
```

In other words: fetch the row from t1 where no other row exists with the same UserId and a greater Date.

(I put the identifier "Date" in delimiters because it's an SQL reserved word.)

In case if t1."Date" = t2."Date", doubling appears. Usually tables has auto_inc(seq) key, e.g. id. To avoid doubling can be used follows:

```sql
SELECT t1.*
FROM mytable t1
  LEFT OUTER JOIN mytable t2
    ON t1.UserId = t2.UserId AND ((t1."Date" < t2."Date") 
         OR (t1."Date" = t2."Date" AND t1.id < t2.id))
WHERE t2.UserId IS NULL;
```

Re comment from @Farhan: Here's a more detailed explanation:  

An outer join attempts to join t1 with t2. By default, all results of t1 are returned, and if there is a match in t2, it is also returned. If there is no match in t2 for a given row of t1, then the query still returns the row of t1, and uses NULL as a placeholder for all of t2's columns. That's just how outer joins work in general.

The trick in this query is to design the join's matching condition such that t2 must match the same userid, and a greater date. The idea being if a row exists in t2 that has a greater date, then the row in t1 it's compared against can't be the greatest date for that userid. But if there is no match -- i.e. if no row exists in t2 with a greater date than the row in t1 -- we know that the row in t1 was the row with the greatest date for the given userid.

In those cases (when there's no match), the columns of t2 will be NULL -- even the columns specified in the join condition. So that's why we use WHERE t2.UserId IS NULL, because we're searching for the cases where no row was found with a greater date for the given userid.

*comments below answer*:   
When applied to a table having 8.8 million rows, this query took almost twice as long as that in the accepted answer.- Derek Mahar   

@Derek: Optimizations depend on the brand and version of RDBMS, as well as presence of appropriate indexes, data types, etc. – Bill Karwin  

On MySQL, this kind of query appears to actually cause it to loop over the result of a Cartesian join between the tables, resulting in O(n^2) time. Using the subquery method instead reduced the query time from 2.0s to 0.003s. YMMV. – Jesse [in 2012]

<br> 

*Answer by David Aldridge (accepted answer)*:  

This will retrieve all rows for which the my_date column value is equal to the maximum value of my_date for that userid. This may retrieve multiple rows for the userid where the maximum date is on multiple rows.

```sql
-- oracle
select userid,
       my_date,
       ...
from
(
select userid,
       my_date,
       ...
       max(my_date) over (partition by userid) max_my_date
from   users
)
where my_date = max_my_date
```

"Analytic functions rock"
Edit: With regard to the first comment ...

"using analytic queries and a self-join defeats the purpose of analytic queries"

There is no self-join in this code. There is instead a predicate placed on the result of the inline view that contains the analytic function -- a very different matter, and completely standard practice.

"The default window in Oracle is from the first row in the partition to the current one"

The windowing clause is only applicable in the presence of the order by clause. With no order by clause, no windowing clause is applied by default and none can be explicitly specified.

MySQL version of Aldridge code based on comments:

```sql
-- This will return the first 5 rows for each group but will also return any
-- additional rows that are tied with the 5th row of the group.
-- (GREATEST-N-PER-GROUP with competition ranking [a.k.a. olympic ranking])
SELECT *
FROM   (
  SELECT t.*,
         RANK() OVER ( PARTITION BY grp ORDER BY value ) AS rnk
  FROM   table_name t
) tmp
WHERE rnk <= 5;
```

<br/>

*Answer by jdhao*:  

```sql
SELECT userid, value
FROM users u1
WHERE date = (
    SELECT MAX(date)
    FROM users u2
    WHERE u1.userid = u2.userid
)
```

+1 because when your datatables are not millions of rows in length anwyays, this is the most easily understood solution. when you have multiple developers of all skill levels modifying the code, understandability is more important then a fraction of a second in performance that is unnoticable. – n00b  

Tested on Apache Derby with 6 million rows: this solution is the fastest if and only if you have the following index defined: "CREATE UNIQUE INDEX MYINDEX on USERS(USERID,DATE desc)", otherwise it's O(n^2) deadly slow. – Unai Vivi  

**Side Note (CREATE UNIQUE INDEX)**:  
Based on [SO](https://stackoverflow.com/questions/10970628/what-is-the-difference-between-create-index-and-create-unique-index):  
CREATE UNIQUE INDEX isn't just an index : it adds the constraint that all records must have a different value for this column or combination of columns. If you try to insert a record whit the same combination, an error will be raised and prevent the insert (or update).
 

</br>

### Three (`HAVING`)

Find the number of orders for each customer with a minimum of 2 orders.

```sql
SELECT
    COUNT(MO.order_id) AS cnt_orders,
    customer_id
FROM
    marketorder AS MO
GROUP BY customer_id
HAVING cnt_orders >= 2;
```

### Four (single)

Find the name of employee who has been with company the longest.

```sql
SELECT 
    firstname, lastname
FROM 
    employee
WHERE hire_date = (SELECT MIN(hire_date) FROM employee);
```

</br> 

Find the company name of the customer who placed the most recent order.

```sql
SELECT 
    company_name
FROM 
    customer
WHERE customer_id = (
    SELECT customer_id
    FROM marketorder
    ORDER BY order_date DESC
    LIMIT 1
);
```


### Five (`CASE`)

The following statement returns the customers and their orders:
```sql
SELECT 
    customerName, 
    COUNT(*) orderCount
FROM
    orders
INNER JOIN customers 
	USING (customerNumber)
GROUP BY customerName
ORDER BY COUNT(*);
```

Now we use the CASE expression in the SELECT clause to return the type of customers based on the number of orders that customers ordered:

```sql
WITH cte AS (
	SELECT 
		customerName, 
		COUNT(*) orderCount
	FROM
		orders
	INNER JOIN customers 
		USING (customerNumber)
	GROUP BY customerName
)
SELECT 
    customerName, 
    orderCount,
    CASE orderCount
		WHEN 1 THEN 'One-time Customer'
        WHEN 2 THEN 'Repeated Customer'
        WHEN 3 THEN 'Frequent Customer'
        ELSE 'Loyal Customer'
	end customerType
FROM
    cte
ORDER BY customerName;
```

### Six (scalar)

Which employees have sold more than $100,000?

*Note*: Sometimes, scalar subquery is **more** efficient than JOIN.

```sql
SELECT 
      employee_id
    , firstname
    , lastname
FROM
    employee
WHERE (
    SELECT SUM(unit_price * quantity)
    FROM order_detail AS OD
    INNER JOIN marketorder AS MO ON MO.order_id = OD.order_id
    WHERE MO.employee_id = employee.employee_id
) > 100000
;
```


## Time in MySQL

### Timezone Variables

Based on [MySQL Time Zone Support](https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html):  
MySQL Server maintains several time zone settings:  

1: The **server system time zone**. When the server starts, it attempts to determine the time zone of the host machine and uses it to set the system_time_zone system variable. To explicitly specify the system time zone for MySQL Server at startup, set the TZ environment variable before you start mysqld.

2: The **server current time zone**. The global time_zone system variable indicates the time zone the server currently is operating in. The initial `time_zone` value is `'SYSTEM'`, which indicates that the server time zone is the same as the system time zone.  

Side note: If set to SYSTEM, every MySQL function call that requires a time zone calculation makes a system library call to determine the current system time zone. This call may be protected by a global mutex, resulting in contention.

The initial global server time zone value can be specified explicitly at startup with the --default-time-zone option on the command line, or you can use the following line in an option file:  `default-time-zone='timezone'`   
If you have the SYSTEM_VARIABLES_ADMIN privilege (or the deprecated SUPER privilege), you can set the global server time zone value at runtime with this statement:   
```sql
SET GLOBAL time_zone = timezone;
```

3: **Per-session time zones**. Each client that connects has its own session time zone setting, given by the session time_zone variable. Initially, the session variable takes its value from the global time_zone variable, but the client can change its own time zone with this statement: 
```sql
SET time_zone = timezone;
```

The **session time zone** setting **affects** display and storage of time values that are zone-sensitive. This includes the values displayed by functions such as `NOW()` or `CURTIME()`, and values stored in and retrieved from `TIMESTAMP` columns. Values for `TIMESTAMP` columns are converted from the session time zone to UTC for storage, and from UTC to the session time zone for retrieval.

The session time zone setting **does not affect** values displayed by functions such as `UTC_TIMESTAMP()` or values in `DATE`, `TIME`, or `DATETIME` columns. **Nor** are values in those data types stored in UTC; the time zone applies for them only when converting from `TIMESTAMP` values. If you want locale-specific arithmetic for `DATE`, `TIME`, or `DATETIME` values, convert them to UTC, perform the arithmetic, and then convert back.  

The current global and session time zone values can be retrieved like this:

```sql
SELECT @@GLOBAL.time_zone, @@SESSION.time_zone;
```

timezone values can be given in several formats, none of which are case-sensitive:

- As the value 'SYSTEM', indicating that the server time zone is the same as the system time zone.

- As a string indicating an offset from UTC of the form [H]H:MM, prefixed with a + or -, such as '+10:00', '-6:00', or '+05:30'. A leading zero can optionally be used for hours values less than 10; MySQL prepends a leading zero when storing and retrieving the value in such cases. MySQL converts '-00:00' or '-0:00' to '+00:00'.  
**Note**: Prior to MySQL 8.0.19, this value had to be in the range '-12:59' to '+13:00', inclusive; beginning with MySQL 8.0.19, the permitted range is '-13:59' to '+14:00', inclusive. 

- As a named time zone, such as 'Europe/Helsinki', 'US/Eastern', 'MET', or 'UTC'. 


### Staying Current with Time Zone Changes

Several tables in the mysql system schema exist to store time zone information (see Section 7.3, “The mysql System Schema”). The MySQL installation procedure creates the time zone tables, but does not load them. To do so manually, use the following instructions.  
Loading the time zone information is **not necessarily** a one-time operation because the information changes occasionally. When such changes occur, applications that use the old rules become out of date and you may find it necessary to reload the time zone tables to keep the information used by your MySQL server current.

When time zone rules change, applications that use the old rules become out of date. To stay current, it is necessary to make sure that your system uses current time zone information is used. For MySQL, there are multiple factors to consider in staying current:  

- The operating system time affects the value that the MySQL server uses for times if its time zone is set to SYSTEM. Make sure that your operating system is using the latest time zone information. For most operating systems, the latest update or service pack prepares your system for the time changes. Check the website for your operating system vendor for an update that addresses the time changes. 

- If you replace the system's `/etc/localtime` time zone file with a version that uses rules differing from those in effect at mysqld startup, restart mysqld so that it uses the updated rules. Otherwise, mysqld might not notice when the system changes its time. 

- If you use named time zones with MySQL, make sure that the time zone tables in the mysql database are up to date.  

  

### `TIMESTAMP` vs `DATETIME`

Read OReilly presentation on this topic first.

Based on [SO by Rich James](https://stackoverflow.com/a/29872238):  
Think of DATETIME as a picture of a clock; think of TIMESTAMP as an instant in time, worldwide. That is, if you connect to the same database, but from a different timezone, a DATETIME will look the the same, but a TIMESTAMP will be adjusted for timezone.  
Both are externally seen as a string, such as '2015-04-25 17:09:01'.  
Since TIMESTAMP is stored as a 32-bit integer (but you don't see that), it is limited to ~1970-2038.  
Since DATETIME is clock time, there will be a missing/extra hour twice a year if you switch to/from daylight savings time.
Yes, you could use UNIX_TIMESTAMP() and have an INT UNSIGNED, but wouldn't it be better to see '2015-...'? (That would be 4 bytes.).  


Finally, The choice between TIMESTAMP or DATETIME is also related to the nature of the event: A video-conference (TIMESTAMP): All attendants should see a reference to an absolute instant of time adjusted to its timezone. But a local task time (DATETIME): I should do this task at 2014/03/31 9:00AM , no matters if that day I'm working in New York or Paris.  

Based on [SO](https://stackoverflow.com/questions/7029127/using-mysqls-timestamp-vs-storing-timestamps-directly):  
You can use datetime function for date comparison, addition, subtraction, range lookup etc, **without** the need to use `FROM_UNIXTIME()` function - it will make it easier to write queries that can use indexes. **BUT** according to the next answer TIMESTAMP has limitation (till 2038), `DATETIME` doesn't but doesn't consider timezone.  

### Auto-update

Based on [docs about timestamp initialization](https://dev.mysql.com/doc/refman/8.0/en/timestamp-initialization.html):  
For any `TIMESTAMP` or `DATETIME` column in a table, you can assign the current timestamp as the default value, the auto-update value, or both:  

- An auto-initialized column is set to the current timestamp for inserted rows that specify no value for the column.

- An auto-updated column is automatically updated to the current timestamp when the value of any other column in the row is changed from its current value. An auto-updated column remains unchanged if all other columns are set to their current values. To prevent an auto-updated column from updating when other columns change, explicitly set it to its current value. To update an auto-updated column even when other columns do not change, explicitly set it to the value it should have (for example, set it to `CURRENT_TIMESTAMP`). 

`TIMESTAMP` or `DATETIME` column definitions can specify the current timestamp for both the default and auto-update values, for one but not the other, or for neither. Different columns can have different combinations of automatic properties. The following rules describe the possibilities:

- With both `DEFAULT CURRENT_TIMESTAMP` and `ON UPDATE CURRENT_TIMESTAMP`, the column has the current timestamp for its default value and is automatically updated to the current timestamp.
```sql
    CREATE TABLE t1 (
      ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      dt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
```

- With a `DEFAULT` clause but **no** `ON UPDATE CURRENT_TIMESTAMP` clause, the column has the given default value and is **not** automatically updated to the current timestamp.  


So in a nutshell based on [this SO](https://stackoverflow.com/a/31692163):  

To make your table/timestamp auto-update:
```sql
ALTER TABLE myTable
CHANGE tcol
       tcol TIMESTAMP NOT NULL
       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```
To make it **not** auto-update:
```aql
ALTER TABLE myTable
CHANGE tcol
       tcol TIMESTAMP NOT NULL
       DEFAULT CURRENT_TIMESTAMP;
```

Also according to [docs about date and time type syntax](https://dev.mysql.com/doc/refman/8.0/en/date-and-time-type-syntax.html):  
If explicit_defaults_for_timestamp is enabled, there is **no** automatic assignment of the `DEFAULT CURRENT_TIMESTAMP` or `ON UPDATE CURRENT_TIMESTAMP` attributes to any TIMESTAMP column. They must be included explicitly in the column definition. Also, any TIMESTAMP not explicitly declared as NOT NULL permits NULL values.


### Time in Event Scheduling

Based on [CREATE EVENT docs](https://dev.mysql.com/doc/refman/8.0/en/create-event.html):  
Times in the ON SCHEDULE clause are interpreted using the current session time_zone value. This becomes the event time zone; that is, the time zone that is used for event scheduling and is in effect within the event as it executes. These times are converted to UTC and stored along with the event time zone internally. This enables event execution to proceed as defined regardless of any subsequent changes to the server time zone or daylight saving time effects. For additional information about representation of event times, see Section 27.4.4, “Event Metadata”.

### node.js driver

According to [mysqljs docs](https://github.com/mysqljs/mysql#connection-options), `timezone` value in connection pool configuarion is the **session timezone**.  

BTW, since we are now deep into this topic, it is worth knowing that there is a `dateStrings` option. See [mysqljs docs](https://github.com/mysqljs/mysql#connection-options).

</br>
&nbsp;
</br>

## Misc

### Don't use email as PK

[SO](https://stackoverflow.com/questions/3804108/use-email-address-as-primary-key):  
And like phone numbers, emails can get re-used. Jsmith@somecompany.com can easily belong to John Smith one year and Julia Smith two years later.  
What if someone wants to change his email address? Are you going to change all the foreign keys too?  

No one seems to have mentioned a possible problem that email addresses could be considered private. If the email address is the primary key, a profile page URL most likely will look something like ..../Users/my@email.com. What if you don't want to expose the user's email address? You'd have to find some other way of identifying the user, possibly by a unique integer value to make URLs like ..../Users/1. Then you'd end up with a unique integer value after all..   


### Next auto increment

[SO](https://stackoverflow.com/questions/6761403/how-to-get-the-next-auto-increment-id-in-mysql):  
I didn't downvote it, but the problem with attempting to use the last auto incrementing value is that it might not be the last one by the time you come to use it - no matter how quickly the SELECT and subsequent INSERT is carried out.  
Note, the question was about the NEXT id not the LAST as you said mentioning `LAST_INSERT_ID()`.


### Table naming convention

[SO](https://stackoverflow.com/a/5841297):  
Reason 2: it is easier come out with singular names, than with plural ones. Objects can have irregular plurals or not plural at all, but will always have a singular one (with few exceptions like News).  

This answer needs more praise. It discusses a bunch of practical reasons that I apply to why I prefer singular names. The alternate discussions about proper language in reference to sets are just philosophical and are obscuring the real point. Singular just works better. – Jason

_Comment by joshperry to another answer in the same thread_:   
I voted down and I'll tell you why, because I disagree. ORM by it's very nature is about mapping. Every ORM tool that I've ever used supports specifying the table name to be used for an entity when it is different from the entity's name. This is important because the whole reason we map to relational databases is so that we can easily make ad-hoc queries and reports with different shapes than our object model. Otherwise we'd all just be using object/document databases by now.


### why `find_code_records_by_email.js`?

This name above is the best choice. First it is better than `find_codes_..` because things can have irregular plurals or not plural at all. Also it is better than `find_code_..` as this one implies as if we are only retrieving code (actually hashed_code) column from the db, but in reality we are retrieving all columns (of matched rows). We are retrieving records not fields.


### UNIQUE column and Composite index

[SO](https://stackoverflow.com/a/9764392):   
A unique key is a special case of index, acting like a regular index with added checking for uniqueness. Using SHOW INDEXES FROM customer you can see your unique keys are in fact B-tree type indexes. A composite index on (email, user_id) is enough, you don't need a separate index on email only - MySQL can use leftmost parts of a composite index. There may be some border cases where the size of an index can slow down your queries, but you should not worry about them until you actually run into them.
As for testing index usage you **should** first fill your table with some data to make optimizer think it's actually worth to use that index.

### Storing Hex data

[SO](https://stackoverflow.com/questions/1712934/storing-hexadecimal-values-as-binary-in-mysql):   
Question: I was thinking about how I'm storing passwords in my database : appropriately salted SHA1 strings in a `CHAR(40)` field. However, since the character data in there is actually just a hex representation of a 160 bit number, I thought it might be better to store it as `BINARY(20)`.
```sql
CREATE TABLE users (
    password BINARY(20)
    /* snip */
);
INSERT INTO users (password) VALUES (UNHEX(SHA1('mypassword'));
```
As I see it, one benefit of this approach is that it halves the size of that field, but I can imagine there's probably some downsides too. What's your opinion?

Answers:   

We used binary for a ton of different ids in our database to save space, since the majority of our data consisted of these ids. Since it doesn't seem like you need to save space (as it's just passwords, not some other huge scale item), I don't see any reason to use binary here.

The biggest problem we ran into was constantly, annoyingly, having binary data show up in the console (everytime you type select * you hear a million beeps), and you have to always do select HEX() or insert UNHEX(), which is a pain.

Lastly, if you mix and match (by mistake) binary and HEX/UNHEX and join on this value, you could match records you never intended to.

MOST IMPORTANT: Unless you are working in an embedded system where each byte counts, don't do it. Having a character representation will allow you better debugging. Plus, every time a developer is working a problem like this I have to wonder why. Every architectural decision like this has trade-offs and this one does not seem like it adds value to your project.



</br>

### TEXT vs VARCHAR

[SO 1](https://stackoverflow.com/a/25301046):   
TEXT:  

- fixed max size of 65535 characters (you cannot limit the max size)
- takes 2 + c bytes of disk space, where c is the length of the stored string.
- cannot be (fully) part of an index. One would need to specify a prefix length.


VARCHAR(M):  

- variable max size of M characters
- M needs to be between 1 and 65535
- takes 1 + c bytes (for M <= 255) or 2 + c (for 256 <= M <= 65535) bytes of disk space where c is the length of the stored string
- can be part of an index


You need to use TEXT when you want to create a table with two maximum-sized string columns, which means both of them may take 65535 characters. You cannot use two varchars with maximum size in a row at the same time because MySQL has limited the maximum row size, which is 65535. But you can use two TEXT in a row because TEXT only contributes 9 to 12 bytes toward the row size limit, TEXT's contents are stored separately from the rest of the row.

[SO Bill Karwin](https://stackoverflow.com/questions/2023481/mysql-large-varchar-vs-text):   
This answer is not correct for InnoDB. Both VARCHAR and BLOB/TEXT are stored inline with other columns if the value on a given row fits in the page size (16KB and each page must hold at least two rows). If the string is too large for that, it overflows to additional pages. See mysqlperformanceblog.com/2010/02/09/blob-storage-in-innodb for a detailed explanation.

The row length limit is 65,535 bytes [ dev.mysql.com/doc/refman/5.0/en/column-count-limit.html ]. If your column is utf8-encoded (not utf8mb4 (?)), that means a 3000-character varchar column can take up to 9000 bytes. – Jan Fabry

</br>

### Storing birth year

[SO David Aldridge](https://stackoverflow.com/questions/611105/mysql-type-for-storing-a-year-smallint-or-varchar-or-date):  
My own experience is with Oracle, which does not have a YEAR data type, but I have always tried to **avoid** using numeric data types for elements *just because* they are comprised only of digits. (So this includes phone numbers, social security numbers, zip codes as well, as additional examples).

My own rule of thumb is to consider what the data is used for. If you will perform mathematical operations on it then store it as a number. If you will perform string functions (eg. "Take the last four characters of the SSN" or "Display the phone number as (XXX) XXX-XXXX") then it's a string.

An additional clue is the requirement to store leading zeroes as part of the number.

Furthermore, and despite being commonly referred to as a phone "number", they frequently contain letters to indicate the presence of an extension number as a suffix. Similarly, a Standard Book Number potentially ended in an "X" as a "check digit".
Since nobody presents phone numbers as a simple list of digits, what's the first programatic step you'd always do when presenting a phone number to a user, or before prepending the required zeroes, or prefixing with the "+" sign in accordance with RFC 2806? And what's the SQL predicate for searching for UK phone numbers with an area code of "01204"? In both cases you need to convert to a string first. If it acts like a string then it is a string, and if it acts like a number then it is a number.

</br>

### Event Scheduling (MySQL)

[SO Question](https://stackoverflow.com/questions/37835714/performance-implications-of-mysql-event-scheduling):  
I've got a use case for creating temporary users on a MySQL database, and then dropping them after 24 hours. I'll be doing this enough that I'd like to automate the process and package it with the user creation script, so that I don't have to keep track of the process.
I've looked around the internet for docs, questions, gossip about the performance implications of MySQL event scheduling, but I haven't found anything discouraging. I've seen another question about the "cost" MySQL scheduled events, but the discussion mostly covers a comparison between scheduling DB tasks using cron vs. using MySQL event scheduling.  

*Answer by bishop in 2016*:  

The cost of the scheduler is irrelevant, compared to the cost of the SQL the scheduler runs. The book High Performance MySQL discusses this:

> Events are initiated by a separate event scheduler thread, because they have nothing to do with connections. They accept no inputs and return no values -- there's no connection for them to get inputs from or return values to.... Similar considerations to those that apply to stored procedures apply to events. First, you are giving the server additional work to do. The event overhead itself is minimal, but the SQL it calls can have a potentially serious impact on performance.

I suspect that, in earlier versions, there was worry that enabling events by default would have an unexpected impact on statement-based replication, which High Performance MySQL also discusses:

> Events can cause the same types of **problems with statement-based replication** that other stored code can cause.

Ultimately, like any database problem, you have to implement the solution in your schema and measure the effects because no two instances are alike and no solution is universal.

*Note*: For **interpretation of time** in the `ON SCHEDULE` clause, read [CREATE EVENT docs](https://dev.mysql.com/doc/refman/8.0/en/create-event.html) or time.md self-documentation.

Also from [another answer by Drew](https://stackoverflow.com/a/38022108):  
And last but not least, when I am writing a new Event, I always add initially in the event statements to log to a log table (with an insert statement and a datetime of now()). That way, I know it fired and that data in a where clause like yours perhaps is not giving me a wrong read on the whole thing. Remember for all practical purposes (except maybe your table you really care about from your question) ... that EvtsLog of mine is your only user interface as an Events programmer and your best friend.
    

</br>

### `ENUM`

Based on [MySQL enum docs](https://dev.mysql.com/doc/refman/5.7/en/enum.html):  
If strict SQL mode is enabled, attempts to insert invalid ENUM values result in an error.

Based on [RolandoMySQLDBA's answer](https://dba.stackexchange.com/questions/312263/are-enums-still-evil-in-mysql-8-0): My only major hangup with ENUMs is the order of values declared for the ENUM type. If you keep adding new values, just don't change the order of the values. Keep appending new values. If you rearrange the order of the values, now the evil emerges. The context of the values can go south very fast.

Do **not** use FK instead of _small set of_ enums. According to the [comment by Dai" in SO](https://stackoverflow.com/a/1434338): 
Often enum values are defined in application code first (e.g. C# enum), whereas if they used a table FK reference then those supposedly static enum entries could be modified at runtime which would be undesirable (and SQL Server doesn't support the concept of immutable tables), finally if you have lots of enums with only a few values then you'll end-up adding lots of tables to your database. Not to mention extra IO reads due to FK constraint-checking when inserting/deleting data, whereas a CHECK CONSTRAINT is much faster and doesn't cause database object spam.

</br>

### Boolean data-type 

[Accroding to spencer7593 comment](https://stackoverflow.com/a/289767):   
`BIT(1)` and `TINYINT(1)` will both use one byte of storage. The bigger issue is that some client libraries don't recognize or appropriately handle returned BIT datatype columns. A TINYINT works better than BIT.  

BOOLEAN is exactly synonym for TINTINY(1) according to MySQL [docs about numeric type syntax](https://dev.mysql.com/doc/refman/8.0/en/numeric-type-syntax.html).
>  However, the values TRUE and FALSE are merely aliases for 1 and 0, respectively, so SELECT IF(2 = TRUE, 'true', 'false'); will give false.

According to [node-mysql2](https://github.com/sidorares/node-mysql2/issues/81):  
It seems boolean typecase is **not** supported by node-mysql driver by default. Although you can write your own typecast as described in that issue (https://github.com/sidorares/node-mysql2/issues/81#issuecomment-1057621826).

