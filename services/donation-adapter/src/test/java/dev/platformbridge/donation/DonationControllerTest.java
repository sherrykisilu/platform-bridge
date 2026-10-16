package dev.platformbridge.donation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DonationController.class)
class DonationControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DonationPublisher publisher;

    @Test
    void reportsHealth() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void rejectsInvalidDonation() throws Exception {
        mockMvc.perform(post("/donations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "donationId": "",
                                  "donorName": "Donor",
                                  "amount": 0,
                                  "currency": "US",
                                  "correlationId": "x"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void acceptsDonationAndReturnsEvent() throws Exception {
        doNothing().when(publisher).publish(any());

        mockMvc.perform(post("/donations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "donationId": "donation-1",
                                  "donorName": "Example Donor",
                                  "amount": 20.50,
                                  "currency": "usd",
                                  "correlationId": "campaign-123"
                                }
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.schemaVersion").value("1.0.0"))
                .andExpect(jsonPath("$.eventType").value("donation.received"))
                .andExpect(jsonPath("$.sourcePlatform").value("donation"))
                .andExpect(jsonPath("$.data.currency").value("USD"));

        verify(publisher).publish(any(PlatformEvent.class));
    }
}
