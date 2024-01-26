--  What are the names (i.e. description) of territories that are assigned to employee
--  with id 5?

SELECT territory_description
    FROM territory
    WHERE territory_id IN 
        (
            SELECT territory_id 
                FROM employee_territory
                WHERE employee_id = 5
        )
;