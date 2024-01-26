--  Find the unit price of the most expensive product in each category.

--  !important
--  correlated subquery (usually leads to bad performance)

SELECT
    category_name, 
    product_name, 
    unit_price
FROM
    product
INNER JOIN
    category AS C USING(category_id)
WHERE unit_price = (
    SELECT MAX(unit_price)
    FROM product
    WHERE product.category_id = C.category_id
);