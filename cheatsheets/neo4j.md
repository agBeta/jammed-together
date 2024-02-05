# Neo4j

## via Docker

Based on [neo4j official docs](https://neo4j.com/docs/operations-manual/current/docker/introduction/):

```bash
docker run \
    --name our-neo4j \
    --restart always \
    --publish=7474:7474 --publish=7687:7687 \
    --env NEO4J_AUTH=neo4j/your_password \
    --volume=$HOME/neo4j/data:/data \
    --volume=$HOME/neo4j/logs:/logs \
    --volume=$HOME/neo4j/conf:/conf \
    neo4j:5.16.0
```
Then run in a separate terminal:
```bash
docker exec -it our-neo4j cypher-shell
```
**Notes**:
- The folders that you want to mount must **exist before** starting Docker, otherwise, Neo4j fails to start due to permissions errors.  

- you can disable authentication by specifying NEO4J_AUTH to none: `--env NEO4J_AUTH=none`  

- If you have mounted a /data volume containing an **existing** database, setting NEO4J_AUTH will have no effect because that database already has authentication configured. The Neo4j Docker service will start, but you will need a username and password already associated with the database to log in.

- You can try out your Neo4j container by opening http://localhost:7474/ (the Neo4j’s Browser interface) in a web browser. By default, Neo4j requires authentication and prompts you to log in with a username/password of `neo4j/neo4j` at the first connection. You are then prompted to set a new password.

- The `--restart always` option sets the Neo4j container (and Neo4j) to restart automatically whenever the Docker daemon is restarted. If you no longer want to have the container auto-start on machine boot, you can disable this setting using the flag no, for example, `docker update --restart=no <containerID>`. See [docker official docs](https://docs.docker.com/config/containers/start-containers-automatically/).

- configuration: To make arbitrary modifications to the Neo4j configuration, provide the container with a /conf volume. **Note**, the configuration files in the /conf volume override the files provided by the image. So if you want to change one value in a file, you **must** ensure that the rest of the file is complete and correct. Environment variables passed to the container by Docker override the values in configuration files in /conf volume.

</br>

### offline
Docker provides the docker `save` command for downloading an image into a .tar package so that it can be used offline, or transferred to a machine without internet access. This is an example command to save the neo4j:5.16.0 image to a .tar file:  
`docker save -o neo4j-5.16.0.tar neo4j:5.16.0`

To load a docker image from a .tar file created by docker save, use the docker load command. For example:  
`docker load --input neo4j-5.16.0.tar`

</br>

----

## Basic commands

For syntax rules and naming conventions see [official recommendation docs](https://neo4j.com/docs/cypher-manual/4.1/syntax/naming/).

### Database
(Based on [managing multiple databases docs](https://neo4j.com/developer/manage-multiple-databases/))   
To add a database to our instance, we can use the following commands. **BUT** the Community Edition of Neo4j supports running a *single* database at a time. The Community version does **not** include the capability to assign roles and permissions to users.
```bash
:USE <db_name>;
SHOW DATABASES;
CREATE DATABASE movieGraph;
```
You may also take a look at [loading Northwind database](https://neo4j.com/developer/manage-multiple-databases/#load-northwind-data), which contains `LOAD CSV WITH HEADERS`.


### Nodes and Relationships
First few examples are from [Brian Holt's Neo4j](https://btholt.github.io/complete-intro-to-databases/neo4j). Others are from neo4j official docs.

```bash
# adding a person
CREATE (p:Person { name: "Michael Cera", born: 1988 } );

# query
MATCH (p { name: "Michael Cera" }) RETURN p;
# ... or
MATCH (p:Person) RETURN p;


# adding a movie (different from Person label)
CREATE (m:Movie {title: 'Scott Pilgrim vs the World', released: 2010, tagline: 'An epic of epic epicness.' }) RETURN m;
...

# adding a relationship
MATCH (Michael:Person),(ScottVsWorld:Movie)
WHERE Michael.name = "Michael Cera" AND ScottVsWorld.title = "Scott Pilgrim vs the World"
CREATE (Michael)-[relationship:ACTED_IN {roles:["Scott Pilgrim"]}]->(ScottVsWorld)
RETURN relationship;
```
  
**Important Note:** According to [neo4j docs](https://neo4j.com/docs/cypher-manual/current/queries/concepts/#core-concepts-relationships), that while nodes can have several labels, relationships can **only** have one type.

</br>

What if we wanted to find every person who acted in the same movie as Aubrey (in this case everyone we've added so far.)? Solution:
```bash
MATCH (p:Person)-[:ACTED_IN]->(Movie)<-[:ACTED_IN]-(q:Person)
WHERE p.name = "Aubrey Plaza" AND q.name <> "Aubrey Plaza"
RETURN q.name;
```

</br>

```bash
MATCH (:Person {name: 'Anna'})-[r:KNOWS WHERE r.since < 2020]->(friend:Person)
RETURN count(r) As numberOfFriends
```

</br>

This deletes all outgoing ACTED_IN relationships from the Person node Laurence Fishburne, without deleting the node (copied from [delete docs](https://neo4j.com/docs/cypher-manual/current/clauses/delete/#delete-relationships-only)).
```bash
MATCH (n:Person {name: 'Laurence Fishburne'})-[r:ACTED_IN]->()
DELETE r
```
To delete all nodes and relationships:  
`MATCH (n) DETACH DELETE n;`

</br>

update a relationship or node:
```bash
MATCH (c:Company {name:"Quera"})
SET c.location="Tehran"
RETURN c
```

</br>

Merge command (from Quera course):
```bash
MERGE (p:Person {name:"Matin"})
ON MATCH  SET p.searched_at = datetime() # if already exists
ON CREATE SET p.created_at = datetime()  # if it doesn't exist
SET p.updated_at = timestamp()           # do this in any case
```

</br>

#### more complex queries
(Based on [patterns docs](https://neo4j.com/docs/cypher-manual/current/patterns/concepts/))  
This example uses a quantified relationship to find all paths up to 5 hops away, traversing only relationships of type KNOWS from the start node Anna to other older Person nodes.

```bash
MATCH (n:Person {name: 'Anna'})-[:KNOWS]-{1,5}(friend:Person WHERE n.born < friend.born)
RETURN DISTINCT friend.name AS olderConnections
```

</br>

## Node.js
See [official docs](https://neo4j.com/developer/javascript/).

### 1) Using `neo4j-driver`
```javascript
const neo4j = require('neo4j-driver')
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
const session = driver.session()
const personName = 'Alice'

try {
  const result = await session.run(
    'CREATE (a:Person {name: $name}) RETURN a',
    { name: personName }
  )
  const singleRecord = result.records[0]
  const node = singleRecord.get(0)

  console.log(node.properties.name)
} finally {
  await session.close()
}

// on application exit:
await driver.close()
```

### 2) Using the HTTP-Endpoint directly
You can use something as simple as the `request` node-module to send queries to and receive responses from Neo4j. The endpoint protocol and formats are explained in detail in the [Neo4j Manual](https://neo4j.com/docs/http-api/current/). It enables you do to much more, e.g. sending many statements per request or keeping transactions open across multiple requests. **Note**: The HTTP API is currently **not** available on Neo4j Aura.