--  What are the names (i.e. company name) of suppliers that supply (any) products 
--  of category 'seafood'?

SELECT company_name
FROM supplier
WHERE supplier_id IN 
    (
        SELECT supplier_id
        FROM product
        WHERE category_id IN
        (
            SELECT category_id 
            FROM category
            WHERE category_name = 'seafood'
        )
    )
;