import { randomUUID } from "node:crypto";

export interface OrderCommand {
  orderId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  correlationId: string;
}

export interface PlatformEvent {
  schemaVersion: "1.0.0";
  eventId: string;
  eventType: "commerce.order-placed";
  sourcePlatform: "commerce";
  occurredAt: string;
  correlationId: string;
  subject: {
    type: "order";
    id: string;
    displayName: string;
  };
  status: "pending";
  severity: "info";
  data: {
    amountMinor: number;
    currency: string;
  };
}

export interface EventContext {
  eventId?: string;
  occurredAt?: string;
}

export function createOrderPlacedEvent(
  command: OrderCommand,
  context: EventContext = {},
): PlatformEvent {
  return {
    schemaVersion: "1.0.0",
    eventId: context.eventId ?? randomUUID(),
    eventType: "commerce.order-placed",
    sourcePlatform: "commerce",
    occurredAt: context.occurredAt ?? new Date().toISOString(),
    correlationId: command.correlationId,
    subject: {
      type: "order",
      id: command.orderId,
      displayName: `Order ${command.orderId}`,
    },
    status: "pending",
    severity: "info",
    data: {
      amountMinor: Math.round(command.totalAmount * 100),
      currency: command.currency.toUpperCase(),
    },
  };
}

export const sampleCommand: OrderCommand = {
  orderId: "sample-order-001",
  customerId: "sample-customer-001",
  totalAmount: 49.95,
  currency: "USD",
  correlationId: "sample-commerce-001",
};

export function createSampleEvent(): PlatformEvent {
  return createOrderPlacedEvent(sampleCommand, {
    eventId: "10000000-0000-4000-8000-000000000001",
    occurredAt: "2025-01-01T00:00:00.000Z",
  });
}
