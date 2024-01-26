--  List the names of all products supplied by a specific company, say 'X Inc'.

SELECT
    P.product_name
FROM 
    product AS P
INNER JOIN 
    supplier AS S USING(supplier_id) 
WHERE
    S.company_name = 'X Inc';


-- alternatively
SELECT 
    P.product_name
FROM product AS P
INNER JOIN 
(
    SELECT supplier_id 
    FROM supplier
    WHERE company_name = 'X Inc'
) AS X_Inc
ON 
    X_Inc.supplier_id = P.supplier_id
;