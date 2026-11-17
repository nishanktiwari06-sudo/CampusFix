
package campusfix.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import campusfix.entity.RegistrationOtp;

public interface RegistrationOtpRepository
        extends JpaRepository<RegistrationOtp, Long> {

    Optional<RegistrationOtp> findByEmail(String email);

    void deleteByEmail(String email);
}
