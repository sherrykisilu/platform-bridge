package dev.platformbridge.donation;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DonationController {
    private final DonationEventFactory eventFactory = new DonationEventFactory();
    private final DonationPublisher publisher;

    public DonationController(DonationPublisher publisher) {
        this.publisher = publisher;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/donations")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PlatformEvent receive(@Valid @RequestBody DonationCommand command) {
        PlatformEvent event = eventFactory.create(command);
        publisher.publish(event);
        return event;
    }
}
