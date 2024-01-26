--  What is total quantity of each product, along with the product name
--  and the company name of its suppliers (recall a product might have
--  many suppliers), in descending order of total?

SELECT 
    SUM(OD.quantity) AS total_quantity,
    P.product_name,
    S.company_name AS supplier_name
FROM
    order_detail AS OD
INNER JOIN
    product AS P
ON  OD.product_id = P.product_id
INNER JOIN
    supplier as S
ON  S.supplier_id = P.supplier_id
GROUP BY
    P.product_name,
    S.company_name
ORDER BY
    total_quantity DESC
;