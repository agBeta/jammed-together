--  What is total quantity of each product along with its category that
--  was ordered by customers who are located in the same country as the
--  supplier of the product?

--  first, just join a lot, then optimize??

SELECT
    SUM(OD.quantity) as total_quantity,
    Ctg.category_name
FROM
    order_detail AS OD
INNER JOIN product  AS P    ON P.product_id = OD.product_id
INNER JOIN category AS Ctg  ON Ctg.category_id = P.category_id
INNER JOIN supplier AS S    ON S.supplier_id = P.supplier_id
INNER JOIN marketorder AS MO ON OD.order_id = MO.order_id
INNER JOIN customer AS C     ON MO.customer_id = C.customer_id
WHERE 
    S.country = C.country
GROUP BY
    category_name
ORDER BY
    total_quantity
;
