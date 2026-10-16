import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../src/app.js";
import { createSampleEvent } from "../src/event.js";

const adapters = new Set<ReturnType<typeof buildApp>>();

afterEach(async () => {
  await Promise.all([...adapters].map((app) => app.close()));
  adapters.clear();
});

describe("commerce adapter", () => {
  it("reports health", async () => {
    const app = buildApp();
    adapters.add(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("validates order commands before publishing", async () => {
    const fetchImpl = vi.fn();
    const app = buildApp({ fetchImpl });
    adapters.add(app);

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        orderId: "",
        customerId: "customer-1",
        totalAmount: -1,
        currency: "US",
        correlationId: "x",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("publishes a valid commerce.order-placed event", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const app = buildApp({
      coreApiUrl: "http://core.test/events",
      fetchImpl,
    });
    adapters.add(app);

    const response = await app.inject({
      method: "POST",
      url: "/orders",
      payload: {
        orderId: "order-1",
        customerId: "customer-1",
        totalAmount: 25.5,
        currency: "usd",
        correlationId: "checkout-123",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://core.test/events",
      expect.objectContaining({ method: "POST" }),
    );
    expect(response.json()).toMatchObject({
      schemaVersion: "1.0.0",
      eventType: "commerce.order-placed",
      sourcePlatform: "commerce",
      data: { currency: "USD" },
    });
  });

  it("creates a deterministic sample that matches the shared contract", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.resolve(
      here,
      "../../../contracts/platform-lifecycle-event.v1.schema.json",
    );
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    const ajv = new Ajv2020({ strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const first = createSampleEvent();
    const second = createSampleEvent();

    expect(second).toEqual(first);
    expect(validate(first), JSON.stringify(validate.errors)).toBe(true);
  });
});
