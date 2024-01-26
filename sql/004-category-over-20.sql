--  What are the names of categories that have products with unit price greater than 20?

SELECT category_name
    FROM category
    WHERE category_id IN 
    (
        SELECT category_id FROM product
            WHERE unit_price > 20.0
    )
;