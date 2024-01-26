--  Find the company name of the customer who placed the most recent order.

SELECT 
    company_name
FROM 
    customer
WHERE customer_id = (
    SELECT customer_id
    FROM marketorder
    ORDER BY order_date DESC
    LIMIT 1
);