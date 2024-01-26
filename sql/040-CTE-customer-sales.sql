--  List of customer company names and ids with their total order amounts 
--  (i.e.total sales) in descending order.

SELECT 
    C.company_name,
    C.customer_id,
    SUM(OD.unit_price * OD.quantity) AS total_sale
FROM
    order_detail AS OD
INNER JOIN
    marketorder AS MO ON OD.order_id = MO.order_id
INNER JOIN
    customer AS C ON C.customer_id = MO.customer_id
GROUP BY 
    C.company_name, C.customer_id
ORDER BY total_sale DESC;
;


--- with CTE

WITH customer_sale AS (
    SELECT 
        C.company_name,
        C.customer_id,
        SUM(OD.unit_price * OD.quantity) AS total_sale
    FROM
        order_detail AS OD
    INNER JOIN  marketorder AS MO ON OD.order_id = MO.order_id
    INNER JOIN  customer AS C     ON C.customer_id = MO.customer_id
    GROUP BY C.company_name, C.customer_id
)
SELECT 
    company_name, customer_id, total_sale
FROM customer_sale
ORDER BY total_sale DESC;
