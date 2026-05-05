package syncqubits.ai.skc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import syncqubits.ai.skc.entity.EmailTemplate;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    Optional<EmailTemplate> findByName(String name);

    boolean existsByName(String name);

    Page<EmailTemplate> findByType(EmailTemplate.TemplateType type, Pageable pageable);

    Page<EmailTemplate> findByIsActive(Boolean isActive, Pageable pageable);
}
