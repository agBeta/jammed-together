--  Find the number of orders for each customer with a minimum of 2 orders.

SELECT
    COUNT(MO.order_id) AS cnt_orders,
    customer_id
FROM
    marketorder AS MO
GROUP BY customer_id
HAVING cnt_orders >= 2;
