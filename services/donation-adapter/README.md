# Donation adapter

Java 21 Spring Boot adapter that validates donation commands and posts version 1
`donation.received` events to `CORE_API_URL`.

```text
GET  /health
POST /donations
```

`CORE_API_URL` defaults to `http://localhost:8080/api/events`; `SERVER_PORT`
defaults to `8080`.

```bash
mvn test
mvn package
```
