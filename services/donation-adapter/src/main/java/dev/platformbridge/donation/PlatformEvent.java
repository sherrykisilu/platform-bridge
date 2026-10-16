package dev.platformbridge.donation;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.Instant;
import java.util.Map;

public record PlatformEvent(
        String schemaVersion,
        String eventId,
        String eventType,
        String sourcePlatform,
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant occurredAt,
        String correlationId,
        Subject subject,
        String status,
        String severity,
        Map<String, Object> data) {

    public record Subject(String type, String id, String displayName) {
    }
}
