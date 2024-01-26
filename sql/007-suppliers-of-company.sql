--  List the company names of suppliers who supply products to 'X Inc' company.


SELECT company_name
FROM supplier
WHERE supplier_id IN
(
    -- suppliers who supply products that ...
    SELECT supplier_id
    FROM product
    WHERE product_id IN 
    (
        -- ... products that exist in ...
        SELECT product_id
        FROM order_detail
        WHERE order_id IN
        (
            -- ... orders from 'X Inc' company
            SELECT order_id 
            FROM marketorder
            WHERE customer_id = (SELECT customer_id FROM customer WHERE company_name = 'X Inc')
        )
    )
);