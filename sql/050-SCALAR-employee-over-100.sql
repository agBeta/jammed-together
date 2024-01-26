--  Which employees have sold more than $100,000 ?

--  Sometimes, scalar subquery is more efficient than JOIN.

SELECT 
      employee_id
    , firstname
    , lastname
FROM
    employee
WHERE (
    SELECT SUM(unit_price * quantity)
    FROM order_detail AS OD
    INNER JOIN marketorder AS MO ON MO.order_id = OD.order_id
    WHERE MO.employee_id = employee.employee_id
) > 100000
;