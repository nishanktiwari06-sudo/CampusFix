
package campusfix.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import campusfix.entity.PasswordResetOtp;
import campusfix.entity.Student;
import campusfix.repository.PasswordResetOtpRepository;
import campusfix.repository.StudentRepository;

@Service
public class PasswordResetService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordResetOtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${campusfix.otp.expiry-minutes:5}")
    private int expiryMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendOtp(String email) {

        email = email.trim().toLowerCase();

        // Check whether student exists
        Student student = studentRepository.findByEmail(email)
                .orElse(null);

        // Do not reveal whether email exists
        if (student == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        PasswordResetOtp existingOtp = otpRepository
                .findByEmail(email)
                .orElse(null);

        // 60-second resend cooldown
        if (existingOtp != null &&
                existingOtp.getLastSentAt() != null &&
                existingOtp.getLastSentAt().isAfter(now.minusSeconds(60))) {
            return;
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));

        PasswordResetOtp resetOtp = existingOtp != null
                ? existingOtp
                : new PasswordResetOtp();

        resetOtp.setEmail(email);
        resetOtp.setOtpHash(passwordEncoder.encode(otp));
        resetOtp.setExpiresAt(now.plusMinutes(expiryMinutes));
        resetOtp.setLastSentAt(now);
        resetOtp.setAttempts(0);

        otpRepository.save(resetOtp);

        // Send OTP through Gmail
        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public boolean verifyOtpAndResetPassword(
            String email, String otp, String newPassword) {

        email = email.trim().toLowerCase();

        PasswordResetOtp resetOtp = otpRepository
                .findByEmail(email)
                .orElse(null);

        if (resetOtp == null) {
            return false;
        }

        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(resetOtp);
            return false;
        }

        // Maximum 5 incorrect attempts
        if (resetOtp.getAttempts() >= 5) {
            otpRepository.delete(resetOtp);
            return false;
        }

        if (!passwordEncoder.matches(otp, resetOtp.getOtpHash())) {
            resetOtp.setAttempts(resetOtp.getAttempts() + 1);
            otpRepository.save(resetOtp);
            return false;
        }

        Student student = studentRepository.findByEmail(email)
                .orElse(null);

        if (student == null) {
            otpRepository.delete(resetOtp);
            return false;
        }

        student.setPassword(passwordEncoder.encode(newPassword));

        studentRepository.save(student);

        // OTP can only be used once
        otpRepository.delete(resetOtp);

        return true;
    }
}
