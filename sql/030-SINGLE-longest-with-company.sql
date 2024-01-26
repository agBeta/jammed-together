--  Find the name of employee who has been with company the longest.

SELECT 
    firstname, lastname
FROM 
    employee
WHERE hire_date = (SELECT MIN(hire_date) FROM employee);