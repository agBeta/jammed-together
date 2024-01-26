--  For each category, find the total sale and average sale per order.


WITH category_sale AS (
    SELECT 
          C.category_name
        , SUM(OD.unit_price * OD.quantity) AS total_sale
    FROM
        category AS C
    INNER JOIN
        product AS P ON P.category_id = C.category_id
    INNER JOIN
        order_detail AS OD ON OD.product_id = P.product_id
    GROUP BY 
        category_name
),

category_order_cnt AS (
    SELECT
          C.category_name
        , COUNT(DISTINCT MO.order_id) AS order_cnt
    FROM
        category AS C
    INNER JOIN
        product AS P ON P.category_id = C.category_id
    INNER JOIN
        order_detail AS OD ON OD.product_id = P.product_id
    INNER JOIN
        marketorder AS MO ON MO.order_id = OD.order_id
    GROUP BY
        category_name
)

SELECT 
      category_sale.total_sale
    , category_sale.category_name
    , category_sale.total_sale / category_order_cnt.order_cnt
FROM
    category_sale
INNER JOIN
    category_order_cnt USING (category_name)
ORDER BY
    total_sale DESC
;