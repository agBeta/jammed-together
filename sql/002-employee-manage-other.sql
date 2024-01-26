-- What are the names of employees and their titles who manage other employees?

SELECT firstname, lastname, title
    FROM employee
    WHERE employee_id IN (
        SELECT manager_id FROM employee 
            WHERE manager_id IS NOT NULL 
    ) 
;