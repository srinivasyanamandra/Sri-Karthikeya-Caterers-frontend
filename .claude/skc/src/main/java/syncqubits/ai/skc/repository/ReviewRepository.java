package syncqubits.ai.skc.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import syncqubits.ai.skc.entity.Review;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Review r WHERE r.token = :token AND r.type = 'INVITATION' AND r.usedAt IS NULL AND r.expiresAt > :now")
    Optional<Review> findValidInvitationByTokenForUpdate(@Param("token") String token, @Param("now") Instant now);

    Optional<Review> findByToken(String token);

    @Query("SELECT r FROM Review r WHERE r.type = 'REVIEW' AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:minRating IS NULL OR r.overallRating >= :minRating)")
    Page<Review> searchReviews(
        @Param("status") Review.ReviewStatus status,
        @Param("minRating") Short minRating,
        Pageable pageable
    );

    @Query("SELECT r FROM Review r WHERE r.type = 'REVIEW' AND r.isPublic = true AND " +
           "(:minRating IS NULL OR r.overallRating >= :minRating)")
    Page<Review> findPublicReviews(@Param("minRating") Short minRating, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.type = 'REVIEW' AND r.isFeatured = true")
    Page<Review> findFeaturedReviews(Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.type = 'INVITATION'")
    Page<Review> findAllInvitations(Pageable pageable);

    long countByTypeAndStatus(Review.ReviewType type, Review.ReviewStatus status);
}
