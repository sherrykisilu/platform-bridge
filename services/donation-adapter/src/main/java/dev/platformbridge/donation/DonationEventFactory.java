package dev.platformbridge.donation;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

public class DonationEventFactory {
    private final Clock clock;
    private final Supplier<UUID> uuidSupplier;

    public DonationEventFactory() {
        this(Clock.systemUTC(), UUID::randomUUID);
    }

    DonationEventFactory(Clock clock, Supplier<UUID> uuidSupplier) {
        this.clock = clock;
        this.uuidSupplier = uuidSupplier;
    }

    public PlatformEvent create(DonationCommand command) {
        return new PlatformEvent(
                "1.0.0",
                uuidSupplier.get().toString(),
                "donation.received",
                "donation",
                Instant.now(clock),
                command.correlationId(),
                new PlatformEvent.Subject(
                        "donation",
                        command.donationId(),
                        "Donation " + command.donationId()),
                "processing",
                "info",
                Map.of(
                        "amountMinor", command.amount().movePointRight(2).longValueExact(),
                        "currency", command.currency().toUpperCase()));
    }
}
