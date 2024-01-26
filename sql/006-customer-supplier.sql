--  What are the names (i.e. company name) of customers who have placed orders
--  for products that are supplied by suppliers who live in the same city as 
--  supplier with id 5?

SELECT company_name
FROM customer
WHERE customer_id IN
(
    -- customers who have place orders for ...
    SELECT customer_id
    FROM marketorder
    WHERE order_id IN
    (
        -- ... orders for products that ...
        SELECT order_id
        FROM order_detail
        WHERE product_id IN
        (
            -- ... products that are supplied by ...
            SELECT product_id
            FROM product
            WHERE supplier_id IN
            (
                -- ... suppliers who live in the same city as supplier with id 5
                SELECT supplier_id 
                FROM supplier 
                WHERE city = 
                    (
                        SELECT city FROM supplier WHERE supplier_id = 5
                    )
            )
        )
    )
)
;