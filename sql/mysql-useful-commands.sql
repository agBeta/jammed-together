
SHOW CREATE TABLE;
SHOW TABLE STATUS;
SHOW INDEX;

-- Based on https://dev.mysql.com/doc/refman/8.0/en/explain.html

SET @@explain_format=TREE;
SELECT @@explain_format;
EXPLAIN SELECT Name FROM country WHERE code LIKE 'A%';

-- alternatively
EXPLAIN FORMAT=JSON SELECT Name FROM country WHERE code LIKE 'A%';



--- to clear mysql client terminal
\! clear


-- 1 to N in mysql
WITH RECURSIVE cte AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM cte WHERE n < 10
)
SELECT n FROM cte


--
SELECT ... 
FROM ... 
WHERE EXISTS (SELECT * FROM ...)