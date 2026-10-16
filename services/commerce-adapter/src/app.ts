import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createOrderPlacedEvent,
  createSampleEvent,
  type PlatformEvent,
} from "./event.js";

const orderSchema = z.object({
  orderId: z.string().trim().min(1).max(100),
  customerId: z.string().trim().min(1).max(100),
  totalAmount: z.number().positive().finite(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
  correlationId: z.string().trim().min(3).max(100),
}).strict();

export interface AppOptions {
  coreApiUrl?: string;
  fetchImpl?: typeof fetch;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false });
  const coreApiUrl =
    options.coreApiUrl ??
    process.env.CORE_API_URL ??
    "http://localhost:8080/api/events";
  const fetchImpl = options.fetchImpl ?? fetch;

  const publish = async (event: PlatformEvent) => {
    const response = await fetchImpl(coreApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      throw new Error(`Core API returned HTTP ${response.status}`);
    }
  };

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/orders", async (request, reply) => {
    const parsed = orderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_order",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const event = createOrderPlacedEvent(parsed.data);
    try {
      await publish(event);
      return reply.status(202).send(event);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: "core_api_unavailable" });
    }
  });

  app.post("/sample", async (request, reply) => {
    const event = createSampleEvent();
    try {
      await publish(event);
      return reply.status(202).send(event);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: "core_api_unavailable" });
    }
  });

  return app;
}
