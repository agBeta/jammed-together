-- What are the company names of customers who live in a city that starts with 'L'?

SELECT company_name 
    FROM customer 
    WHERE city LIKE 'L%';


--- alternatively (though impractical, (maybe?) unless  you want to re-query many times)

SELECT company_name
    FROM customer
    WHERE city IN
        (SELECT city from customer WHERE city LIKE 'L%')
;