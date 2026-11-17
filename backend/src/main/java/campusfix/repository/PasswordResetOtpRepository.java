
package campusfix.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import campusfix.entity.PasswordResetOtp;

public interface PasswordResetOtpRepository
        extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findByEmail(String email);

    void deleteByEmail(String email);
}
