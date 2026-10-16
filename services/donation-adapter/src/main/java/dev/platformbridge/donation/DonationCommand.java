package dev.platformbridge.donation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record DonationCommand(
        @NotBlank @Size(max = 100) String donationId,
        @NotBlank @Size(max = 160) String donorName,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{3}$") String currency,
        @NotBlank @Size(min = 3, max = 100) String correlationId) {
}
