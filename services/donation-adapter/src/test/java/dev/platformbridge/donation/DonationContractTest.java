package dev.platformbridge.donation;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.InputFormat;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class DonationContractTest {
    private static final Instant OCCURRED_AT = Instant.parse("2025-01-01T00:00:00Z");
    private static final UUID EVENT_ID = UUID.fromString("20000000-0000-4000-8000-000000000001");

    @Test
    void eventMatchesSharedVersionOneSchema() throws Exception {
        Path schemaPath = findSharedSchema();
        String schemaJson = Files.readString(schemaPath);
        JsonSchema schema = JsonSchemaFactory
                .getInstance(SpecVersion.VersionFlag.V202012)
                .getSchema(schemaJson);
        DonationEventFactory factory = new DonationEventFactory(
                Clock.fixed(OCCURRED_AT, ZoneOffset.UTC),
                () -> EVENT_ID);
        PlatformEvent event = factory.create(new DonationCommand(
                "donation-1",
                "Example Donor",
                new BigDecimal("20.50"),
                "usd",
                "campaign-123"));
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        JsonNode eventJson = objectMapper.valueToTree(event);

        Set<ValidationMessage> errors = schema.validate(
                eventJson.toString(),
                InputFormat.JSON);

        assertThat(errors).isEmpty();
    }

    private static Path findSharedSchema() {
        Path current = Path.of("").toAbsolutePath();
        while (current != null) {
            Path candidate = current.resolve("contracts")
                    .resolve("platform-lifecycle-event.v1.schema.json");
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
            current = current.getParent();
        }
        throw new IllegalStateException("Shared platform event schema was not found");
    }
}
