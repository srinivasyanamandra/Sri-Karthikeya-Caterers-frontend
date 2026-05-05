package syncqubits.ai.skc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import syncqubits.ai.skc.entity.Client;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    Optional<Client> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT c FROM Client c WHERE " +
           "(:q IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:since IS NULL OR c.createdAt >= :since) AND " +
           "(:until IS NULL OR c.createdAt <= :until)")
    Page<Client> searchClients(
        @Param("q") String query,
        @Param("status") Client.ClientStatus status,
        @Param("since") Instant since,
        @Param("until") Instant until,
        Pageable pageable
    );

    long countByStatus(Client.ClientStatus status);
}
