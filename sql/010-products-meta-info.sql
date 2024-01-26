--  Question 1:
--  Find the product name, unit price and supplier name (i.e. company name) for all
--  products.

SELECT 
    P.product_name, 
    P.unit_price,
    S.company_name  AS supplier_name
FROM
    product AS P 
INNER JOIN
    supplier AS S
ON P.supplier_id = S.supplier_id;

-- Alternatively, in the last line, you could write: USING(supplier_id)


-----------------------------------------
--  Question 2:
--  List product name, supplier (company) name, and category name for all products
--  in the database.


SELECT
    P.product_name,
    S.company_name AS supplier_name,
    C.category_name
FROM
    product AS P
INNER JOIN
    supplier AS S
USING (supplier_id)
INNER JOIN
    category AS C
USING (category_id);
