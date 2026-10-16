# Commerce adapter

Small HTTP adapter that validates order commands and posts version 1
`commerce.order-placed` events to `CORE_API_URL`.

```text
GET  /health
POST /orders
POST /sample
```

`CORE_API_URL` defaults to `http://localhost:8080/api/events`; `PORT` defaults to
`3000`. Run `npm run sample` to print the deterministic contract sample.

```bash
npm ci
npm test
npm run build
```
