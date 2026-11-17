
package campusfix.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import campusfix.entity.RegistrationOtp;
import campusfix.entity.Student;
import campusfix.repository.RegistrationOtpRepository;
import campusfix.repository.StudentRepository;

@Service
public class RegistrationOtpService {

    private final RegistrationOtpRepository otpRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${campusfix.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${campusfix.otp.length:6}")
    private int otpLength;

    public RegistrationOtpService(
            RegistrationOtpRepository otpRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.otpRepository = otpRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // START REGISTRATION
    @Transactional
    public void startRegistration(
            String fullName,
            String rollNo,
            String email,
            String department,
            String password) {

        email = email.trim().toLowerCase();
        rollNo = rollNo.trim();

        if (studentRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email already registered");
        }

        if (studentRepository.existsByRollNo(rollNo)) {
            throw new IllegalArgumentException(
                    "Roll number already registered");
        }

        Optional<RegistrationOtp> existing =
                otpRepository.findByEmail(email);

        RegistrationOtp registrationOtp;

        if (existing.isPresent()) {

            registrationOtp = existing.get();

            if (registrationOtp.getLastSentAt() != null &&
                    registrationOtp.getLastSentAt().isAfter(
                            LocalDateTime.now().minusSeconds(60))) {

                throw new IllegalArgumentException(
                        "Please wait 60 seconds before requesting another OTP");
            }

        } else {

            registrationOtp = new RegistrationOtp();
            registrationOtp.setEmail(email);
        }

        String otp = generateOtp();

        registrationOtp.setFullName(fullName.trim());
        registrationOtp.setRollNo(rollNo);
        registrationOtp.setDepartment(
                department == null ? "" : department.trim());

        registrationOtp.setPasswordHash(
                passwordEncoder.encode(password));

        registrationOtp.setOtpHash(
                passwordEncoder.encode(otp));

        registrationOtp.setExpiresAt(
                LocalDateTime.now().plusMinutes(expiryMinutes));

        registrationOtp.setLastSentAt(LocalDateTime.now());
        registrationOtp.setAttempts(0);

        otpRepository.save(registrationOtp);

        emailService.sendRegistrationOtpEmail(email, otp);
    }

    // VERIFY OTP AND CREATE STUDENT
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public Student verifyRegistrationOtp(String email, String otp) {

        email = email.trim().toLowerCase();

        RegistrationOtp registrationOtp =
                otpRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Registration OTP not found"));

        if (registrationOtp.getExpiresAt().isBefore(
                LocalDateTime.now())) {

            otpRepository.delete(registrationOtp);

            throw new IllegalArgumentException(
                    "OTP expired. Please register again");
        }

        if (registrationOtp.getAttempts() >= 5) {

            otpRepository.delete(registrationOtp);

            throw new IllegalArgumentException(
                    "Maximum OTP attempts exceeded. Please register again");
        }

        if (!passwordEncoder.matches(
                otp, registrationOtp.getOtpHash())) {

            registrationOtp.setAttempts(
                    registrationOtp.getAttempts() + 1);

            otpRepository.save(registrationOtp);

            throw new IllegalArgumentException(
                    "Invalid OTP. Attempts remaining: "
                            + (5 - registrationOtp.getAttempts()));
        }

        if (studentRepository.existsByEmail(email)) {

            otpRepository.delete(registrationOtp);

            throw new IllegalArgumentException(
                    "Email already registered");
        }

        if (studentRepository.existsByRollNo(
                registrationOtp.getRollNo())) {

            otpRepository.delete(registrationOtp);

            throw new IllegalArgumentException(
                    "Roll number already registered");
        }

        Student student = new Student();

        student.setFullName(registrationOtp.getFullName());
        student.setRollNo(registrationOtp.getRollNo());
        student.setEmail(registrationOtp.getEmail());
        student.setDepartment(registrationOtp.getDepartment());

        // Already BCrypt hashed
        student.setPassword(registrationOtp.getPasswordHash());

        student.setRole("STUDENT");
        student.setEmailVerified(true);

        Student savedStudent = studentRepository.save(student);

        otpRepository.delete(registrationOtp);

        return savedStudent;
    }

    // RESEND OTP
    @Transactional
    public void resendOtp(String email) {

        email = email.trim().toLowerCase();

        RegistrationOtp registrationOtp =
                otpRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Registration not found. Please register again"));

        if (registrationOtp.getLastSentAt() != null &&
                registrationOtp.getLastSentAt().isAfter(
                        LocalDateTime.now().minusSeconds(60))) {

            throw new IllegalArgumentException(
                    "Please wait 60 seconds before requesting another OTP");
        }

        String otp = generateOtp();

        registrationOtp.setOtpHash(
                passwordEncoder.encode(otp));

        registrationOtp.setExpiresAt(
                LocalDateTime.now().plusMinutes(expiryMinutes));

        registrationOtp.setLastSentAt(LocalDateTime.now());
        registrationOtp.setAttempts(0);

        otpRepository.save(registrationOtp);

        emailService.sendRegistrationOtpEmail(email, otp);
    }

    // GENERATE SECURE OTP
    private String generateOtp() {

        StringBuilder otp = new StringBuilder();

        for (int i = 0; i < otpLength; i++) {
            otp.append(secureRandom.nextInt(10));
        }

        return otp.toString();
    }
}
