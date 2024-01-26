--  List category names that have at least 10 products?

SELECT 
    category_name
FROM category
WHERE category_id IN (
    SELECT category_id
    FROM product -- ◀️
    GROUP BY category_id
    HAVING COUNT(product_id) >= 10
);