package syncqubits.ai.skc.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import syncqubits.ai.skc.dto.subscriber.SubscribeRequest;
import syncqubits.ai.skc.dto.subscriber.SubscribeResponse;
import syncqubits.ai.skc.entity.Subscriber;
import syncqubits.ai.skc.exception.ConflictException;
import syncqubits.ai.skc.repository.SubscriberRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriberService {

    private final SubscriberRepository subscriberRepository;

    @Transactional
    public SubscribeResponse subscribe(SubscribeRequest request) {
        log.info("Processing subscription request for email: {}", request.getEmail());

        // Check if already subscribed
        var existing = subscriberRepository.findByEmail(request.getEmail());
        if (existing.isPresent() && existing.get().getIsActive()) {
            throw new ConflictException("Email is already subscribed");
        }

        // If previously unsubscribed, reactivate
        if (existing.isPresent()) {
            Subscriber subscriber = existing.get();
            subscriber.setIsActive(true);
            subscriber.setUnsubscribedAt(null);
            if (request.getName() != null) {
                subscriber.setName(request.getName());
            }
            subscriberRepository.save(subscriber);
            log.info("Reactivated subscription for: {}", request.getEmail());
        } else {
            // Create new subscriber
            Subscriber subscriber = Subscriber.builder()
                    .email(request.getEmail())
                    .name(request.getName())
                    .source("website")
                    .isActive(true)
                    .build();
            subscriberRepository.save(subscriber);
            log.info("New subscription created for: {}", request.getEmail());
        }

        return SubscribeResponse.builder()
                .subscribed(true)
                .email(request.getEmail())
                .build();
    }
}
