--  What is the total quantity of products sold by each category, order in
--  descending order?

SELECT 
    SUM(OD.quantity) AS total_quantity,
    C.category_name
FROM
    order_detail AS OD
INNER JOIN
    product AS P
ON
    OD.product_id = P.product_id
INNER JOIN 
    category AS C
ON 
    C.category_id = P.category_id
GROUP BY
    category_name
ORDER BY
    total_quantity DESC
;
