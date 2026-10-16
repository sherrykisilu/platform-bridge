package dev.platformbridge.donation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class DonationPublisher {
    private final RestClient restClient;
    private final String coreApiUrl;

    public DonationPublisher(
            RestClient.Builder restClientBuilder,
            @Value("${core.api.url}") String coreApiUrl) {
        this.restClient = restClientBuilder.build();
        this.coreApiUrl = coreApiUrl;
    }

    public void publish(PlatformEvent event) {
        restClient.post()
                .uri(coreApiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(event)
                .retrieve()
                .toBodilessEntity();
    }
}
