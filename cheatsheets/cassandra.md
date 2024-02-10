# Cassandra

## Basics

(Based on DataStax youtube course: Introduction to Cassandra for Developers)  
Also take a look at [Cassandra quick start guide](https://cassandra.apache.org/_/quickstart.html). It's simple and quick.  
Also this is the link to [Datastax cassandra github repository](https://github.com/datastaxdevs/workshop-intro-to-cassandra).

```sql
CREATE TABLE killervideo.users_by_city (
    city  text,
    last_name text,
    first_name text,
    address text,
    email text,
    PRIMARY KEY ((city), last_name, first_name, email)
);

DESC KEYSPACES;
USE killervideo;
DESC tables;
```

Now, let's create another table. `commentid DESC` means show most recent comments first. Later on, when we read the data out we don't need ORDER BY and **don't need to pay the cost of ordering** since it's actually been saved in-order on disk. So it's all optimized for read performance at scale.

```sql
CREATE TABLe IF NOT EXISTS comments_by_video (
    videoid    uuid,
    commentid  timeuuid, -- creation_date and commentid combined together
    userid     uuid,
    comment    text,     -- actual payload
    PRIMARY KEY ((videoid), commentid)
) WITH CLUSTERING ORDER BY (commentid DESC);
```

Checkout more about `timeuuid` functions in [Datastax cql reference](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/timeuuid_functions_r.html) and [cassandra docs](https://cassandra.apache.org/doc/4.1/cassandra/cql/cql_singlefile.html#timeuuidFun).



</br>

## Partitioning

- Store together what you retrieve together (like video example).
- Avoid big partitions (like country example). It's recommended not to exceed one hundred thousand per partition.
- Avoid unbounded partitions (like sensor example).
- Avoid hot partitions. (can we?)

```sql
-- good (ordering + uniqueness)
PRIMARY KEY ((city), last_name, first_name, email)


-- bad
PRIMARY KEY ((video_id), comment_id)
-- good
-- created_at is a clustering column so cassandra is going to naturally sort
PRIMARY KEY ((video_id), created_at, comment_id)


-- bad (big partitions for some countries like India.)
PRIMARY KEY((country), user_id)


-- bad (unbounded)
PRIMARY KEY((sensor_id), reported_at)
-- good (bucketing)
PRIMARY KEY ((sensor_id, month_year), reported_at)
```
