package syncqubits.ai.skc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import syncqubits.ai.skc.dto.quote.QuoteRequestDto;
import syncqubits.ai.skc.dto.quote.QuoteResponse;
import syncqubits.ai.skc.entity.Client;
import syncqubits.ai.skc.entity.QuoteRequest;
import syncqubits.ai.skc.repository.ClientRepository;
import syncqubits.ai.skc.repository.QuoteRequestRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuoteService {

    private final ClientRepository clientRepository;
    private final QuoteRequestRepository quoteRequestRepository;
    private final SystemLogService systemLogService;

    @Transactional
    public QuoteResponse submitQuote(QuoteRequestDto dto) {
        log.info("Processing quote request for email: {}", dto.getEmail());

        // Find or create client
        Client client = clientRepository.findByEmail(dto.getEmail())
                .orElseGet(() -> {
                    Client newClient = Client.builder()
                            .name(dto.getName())
                            .email(dto.getEmail())
                            .phone(dto.getPhone())
                            .source("quote_request")
                            .status(Client.ClientStatus.LEAD)
                            .build();
                    return clientRepository.save(newClient);
                });

        // Create quote request
        QuoteRequest quoteRequest = QuoteRequest.builder()
                .client(client)
                .eventType(dto.getEventType())
                .eventDate(dto.getEventDate())
                .guests(dto.getGuests())
                .venue(dto.getVenue())
                .budget(dto.getBudget())
                .message(dto.getMessage())
                .status(QuoteRequest.QuoteStatus.PENDING)
                .build();

        quoteRequest = quoteRequestRepository.save(quoteRequest);

        // Log the quote request
        systemLogService.logQuote(
                "submitted",
                "success",
                quoteRequest.getId(),
                Map.of(
                        "clientEmail", dto.getEmail(),
                        "eventType", dto.getEventType(),
                        "guests", dto.getGuests()
                )
        );

        log.info("Quote request created with ID: {}", quoteRequest.getId());

        return QuoteResponse.builder()
                .id(quoteRequest.getId())
                .status(quoteRequest.getStatus().name().toLowerCase())
                .createdAt(quoteRequest.getCreatedAt())
                .message("Thank you. Our team will reply within 24 hours.")
                .build();
    }
}
