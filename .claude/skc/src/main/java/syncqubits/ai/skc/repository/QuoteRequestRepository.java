package syncqubits.ai.skc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import syncqubits.ai.skc.entity.QuoteRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, UUID> {

    @Query("SELECT q FROM QuoteRequest q WHERE " +
           "(:status IS NULL OR q.status = :status) AND " +
           "(:eventType IS NULL OR q.eventType = :eventType) AND " +
           "(:fromDate IS NULL OR q.eventDate >= :fromDate) AND " +
           "(:toDate IS NULL OR q.eventDate <= :toDate)")
    Page<QuoteRequest> searchQuotes(
        @Param("status") QuoteRequest.QuoteStatus status,
        @Param("eventType") String eventType,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );

    long countByStatus(QuoteRequest.QuoteStatus status);

    @Query("SELECT COUNT(q) FROM QuoteRequest q WHERE q.createdAt >= :since")
    long countCreatedSince(@Param("since") Instant since);
}
