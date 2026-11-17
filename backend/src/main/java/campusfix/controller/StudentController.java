
package campusfix.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import campusfix.dto.StudentResponse;
import campusfix.entity.Student;
import campusfix.repository.StudentRepository;
import campusfix.service.PasswordResetService;
import campusfix.service.RegistrationOtpService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(
    origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    },
    allowCredentials = "true"
)
public class StudentController {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;
    private final RegistrationOtpService registrationOtpService;

    private static final Path PHOTO_DIRECTORY =
            Path.of("uploads", "student-profiles")
                    .toAbsolutePath()
                    .normalize();

    public StudentController(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetService passwordResetService,
            RegistrationOtpService registrationOtpService) {

        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.registrationOtpService = registrationOtpService;
    }

    // ================= REGISTER: SEND EMAIL OTP =================

    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(
            @RequestBody Student student) {

        if (student.getFullName() == null
                || student.getRollNo() == null
                || student.getEmail() == null
                || student.getPassword() == null) {

            return ResponseEntity.badRequest()
                    .body("All required fields must be filled");
        }

        String fullName = student.getFullName().trim();
        String email = student.getEmail().trim().toLowerCase(Locale.ROOT);
        String rollNo = student.getRollNo().trim();
        String password = student.getPassword();
        String department = student.getDepartment();

        if (fullName.isEmpty() || rollNo.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Name and roll number cannot be empty");
        }

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid email address");
        }

        if (password.length() < 8 || password.length() > 72) {
            return ResponseEntity.badRequest()
                    .body("Password must be 8 to 72 characters");
        }

        if (department != null && department.length() > 100) {
            return ResponseEntity.badRequest()
                    .body("Department cannot exceed 100 characters");
        }

        try {
            registrationOtpService.startRegistration(
                    fullName,
                    rollNo,
                    email,
                    department,
                    password
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Verification OTP sent to your email. Please verify to complete registration."
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            System.err.println("Registration OTP error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to start registration or send OTP right now.");
        }
    }

    // ================= VERIFY REGISTRATION OTP =================

    @PostMapping("/register/verify-otp")
    public ResponseEntity<?> verifyRegistrationOtp(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || email.isBlank()
                || otp == null || otp.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email and OTP are required");
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid email address");
        }

        if (!otp.matches("^\\d{6}$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid 6-digit OTP");
        }

        try {
            Student savedStudent =
                    registrationOtpService.verifyRegistrationOtp(
                            email, otp
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Email verified and registration completed successfully",
                            "student",
                            toStudentResponse(savedStudent)
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            System.err.println(
                    "Registration OTP verification error: "
                            + e.getMessage()
            );

            return ResponseEntity.internalServerError()
                    .body("Unable to verify OTP right now.");
        }
    }

    // ================= RESEND REGISTRATION OTP =================

    @PostMapping("/register/resend-otp")
    public ResponseEntity<?> resendRegistrationOtp(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required");
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid email address");
        }

        try {
            registrationOtpService.resendOtp(email);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "A new verification OTP has been sent"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            System.err.println(
                    "Registration OTP resend error: "
                            + e.getMessage()
            );

            return ResponseEntity.internalServerError()
                    .body("Unable to resend OTP right now.");
        }
    }

    // ================= LOGIN =================

    @PostMapping("/login")
    public ResponseEntity<?> loginStudent(
            @RequestBody Student student,
            HttpSession session) {

        if (student.getEmail() == null
                || student.getPassword() == null) {

            return ResponseEntity.badRequest()
                    .body("Email and password are required");
        }

        String email = student.getEmail().trim().toLowerCase();
        String rawPassword = student.getPassword();

        Optional<Student> existingStudent =
                studentRepository.findByEmail(email);

        if (existingStudent.isEmpty()) {
            return ResponseEntity.status(401)
                    .body("Invalid email or password");
        }

        Student foundStudent = existingStudent.get();
        String storedPassword = foundStudent.getPassword();

        boolean passwordMatches;

        if (storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$")) {

            passwordMatches = passwordEncoder.matches(
                    rawPassword,
                    storedPassword
            );

        } else {
            // Temporary support for old plain-text accounts.
            passwordMatches = storedPassword.equals(rawPassword);

            if (passwordMatches) {
                foundStudent.setPassword(
                        passwordEncoder.encode(rawPassword)
                );

                studentRepository.save(foundStudent);
            }
        }

        if (!passwordMatches) {
            return ResponseEntity.status(401)
                    .body("Invalid email or password");
        }

        // Email verification check
        if (!foundStudent.isEmailVerified()) {
            return ResponseEntity.status(403)
                    .body("Please verify your email before logging in.");
        }

        if (foundStudent.getRole() == null
                || foundStudent.getRole().isBlank()) {

            foundStudent.setRole("STUDENT");
            studentRepository.save(foundStudent);
        }

        session.setAttribute("STUDENT_ID", foundStudent.getId());
        session.setAttribute("STUDENT_EMAIL", foundStudent.getEmail());
        session.setAttribute("STUDENT_ROLE", foundStudent.getRole());

        System.out.println("========== CAMPUSFIX LOGIN ==========");
        System.out.println("LOGIN EMAIL: " + foundStudent.getEmail());
        System.out.println("LOGIN SESSION ID: " + session.getId());
        System.out.println("LOGIN SESSION ROLE: "
                + session.getAttribute("STUDENT_ROLE"));
        System.out.println("=====================================");

        return ResponseEntity.ok(toStudentResponse(foundStudent));
    }

    // ================= GET CURRENT STUDENT PROFILE =================

    @GetMapping("/profile")
    public ResponseEntity<?> getStudentProfile(HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        try {
            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            return ResponseEntity.ok(
                    toStudentResponse(optionalStudent.get())
            );

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid student session.");
        }
    }

    // ================= CHANGE STUDENT PASSWORD =================

    @PutMapping("/change-password")
    public ResponseEntity<?> changeStudentPassword(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        if (currentPassword == null
                || newPassword == null
                || confirmPassword == null) {

            return ResponseEntity.badRequest()
                    .body("All password fields are required.");
        }

        if (currentPassword.isBlank()
                || newPassword.isBlank()
                || confirmPassword.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Password fields cannot be empty.");
        }

        if (newPassword.length() < 8 || newPassword.length() > 72) {
            return ResponseEntity.badRequest()
                    .body("New password must be 8 to 72 characters.");
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest()
                    .body("New password and confirm password do not match.");
        }

        if (currentPassword.equals(newPassword)) {
            return ResponseEntity.badRequest()
                    .body("New password must be different from current password.");
        }

        try {
            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            Student student = optionalStudent.get();
            String storedPassword = student.getPassword();

            boolean passwordMatches;

            if (storedPassword.startsWith("$2a$")
                    || storedPassword.startsWith("$2b$")
                    || storedPassword.startsWith("$2y$")) {

                passwordMatches = passwordEncoder.matches(
                        currentPassword,
                        storedPassword
                );

            } else {
                passwordMatches = storedPassword.equals(currentPassword);
            }

            if (!passwordMatches) {
                return ResponseEntity.badRequest()
                        .body("Current password is incorrect.");
            }

            student.setPassword(passwordEncoder.encode(newPassword));

            studentRepository.save(student);

            return ResponseEntity.ok(
                    Map.of("message", "Password changed successfully.")
            );

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid student session.");

        } catch (Exception e) {
            System.err.println("Password change error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to change password.");
        }
    }

    // ================= UPDATE STUDENT PROFILE =================

    @PutMapping("/profile")
    public ResponseEntity<?> updateStudentProfile(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        try {
            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            Student student = optionalStudent.get();

            String fullName = request.get("fullName");
            String department = request.get("department");

            if (fullName == null || fullName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Full name is required.");
            }

            fullName = fullName.trim();

            if (fullName.length() > 100) {
                return ResponseEntity.badRequest()
                        .body("Full name cannot exceed 100 characters.");
            }

            department = department == null
                    ? ""
                    : department.trim();

            if (department.length() > 100) {
                return ResponseEntity.badRequest()
                        .body("Department cannot exceed 100 characters.");
            }

            student.setFullName(fullName);
            student.setDepartment(department);

            Student updatedStudent =
                    studentRepository.save(student);

            return ResponseEntity.ok(
                    toStudentResponse(updatedStudent)
            );

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid student session.");

        } catch (Exception e) {
            System.err.println("Profile update error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to update student profile.");
        }
    }

    // ================= UPLOAD PROFILE PHOTO =================

    @PostMapping(
        value = "/profile/photo",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestParam("photo") MultipartFile photo,
            HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        if (photo == null || photo.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Please select a photo.");
        }

        if (photo.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body("Photo size cannot exceed 5 MB.");
        }

        try {
            String originalName = photo.getOriginalFilename();

            if (originalName == null || originalName.isBlank()) {
                return ResponseEntity.badRequest()
                        .body("Invalid photo filename.");
            }

            String extension = originalName
                    .substring(originalName.lastIndexOf('.') + 1)
                    .toLowerCase(Locale.ROOT);

            if (!List.of("jpg", "jpeg", "png").contains(extension)) {
                return ResponseEntity.badRequest()
                        .body("Only JPG, JPEG and PNG photos are allowed.");
            }

            String contentType = photo.getContentType();

            boolean validContentType =
                    ("jpg".equals(extension) || "jpeg".equals(extension))
                            ? MediaType.IMAGE_JPEG_VALUE.equals(contentType)
                            : MediaType.IMAGE_PNG_VALUE.equals(contentType);

            if (!validContentType) {
                return ResponseEntity.badRequest()
                        .body("Invalid image file type.");
            }

            // Verify that the uploaded content is a readable image.
            if (ImageIO.read(photo.getInputStream()) == null) {
                return ResponseEntity.badRequest()
                        .body("The uploaded file is not a valid image.");
            }

            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            Student student = optionalStudent.get();

            Files.createDirectories(PHOTO_DIRECTORY);

            String filename = UUID.randomUUID() + "." + extension;

            Path destination = PHOTO_DIRECTORY.resolve(filename)
                    .normalize();

            if (!destination.startsWith(PHOTO_DIRECTORY)) {
                return ResponseEntity.badRequest()
                        .body("Invalid photo path.");
            }

            Files.copy(
                    photo.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String oldPhoto = student.getProfilePhotoPath();

            student.setProfilePhotoPath(filename);

            try {
                Student updatedStudent =
                        studentRepository.save(student);

                // Delete the previous photo after successful database save.
                if (oldPhoto != null && !oldPhoto.isBlank()) {
                    try {
                        Path oldPhotoPath =
                                PHOTO_DIRECTORY.resolve(oldPhoto).normalize();

                        if (oldPhotoPath.startsWith(PHOTO_DIRECTORY)) {
                            Files.deleteIfExists(oldPhotoPath);
                        }

                    } catch (IOException e) {
                        System.err.println(
                                "Old profile photo cleanup failed: "
                                        + e.getMessage()
                        );
                    }
                }

                return ResponseEntity.ok(toStudentResponse(updatedStudent));

            } catch (Exception e) {
                Files.deleteIfExists(destination);
                throw e;
            }

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid student session.");

        } catch (IOException e) {
            System.err.println("Photo upload error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to save profile photo.");

        } catch (Exception e) {
            System.err.println("Photo upload error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Something went wrong while uploading photo.");
        }
    }

    // ================= DISPLAY PROFILE PHOTO =================

    @GetMapping("/profile/photo/{filename}")
    public ResponseEntity<?> getProfilePhoto(
            @PathVariable String filename,
            HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        try {
            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            Student student = optionalStudent.get();

            // A student can only view their own saved profile photo.
            if (!filename.equals(student.getProfilePhotoPath())) {
                return ResponseEntity.status(404)
                        .body("Profile photo not found.");
            }

            if (!filename.matches(
                    "^[a-f0-9-]+\\.(jpg|jpeg|png)$")) {

                return ResponseEntity.badRequest()
                        .body("Invalid photo filename.");
            }

            Path photoPath = PHOTO_DIRECTORY.resolve(filename)
                    .normalize();

            if (!photoPath.startsWith(PHOTO_DIRECTORY)
                    || !Files.exists(photoPath)) {

                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(photoPath.toUri());

            MediaType mediaType = filename.endsWith(".png")
                    ? MediaType.IMAGE_PNG
                    : MediaType.IMAGE_JPEG;

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.noCache())
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + filename + "\""
                    )
                    .body(resource);

        } catch (Exception e) {
            System.err.println("Photo display error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to load profile photo.");
        }
    }

    // ================= DELETE PROFILE PHOTO =================

    @DeleteMapping("/profile/photo")
    public ResponseEntity<?> deleteProfilePhoto(HttpSession session) {

        Object studentId = session.getAttribute("STUDENT_ID");
        Object role = session.getAttribute("STUDENT_ROLE");

        if (studentId == null
                || role == null
                || !"STUDENT".equals(role.toString())) {

            return ResponseEntity.status(401)
                    .body("Please login as a student first.");
        }

        try {
            Long id = Long.valueOf(studentId.toString());

            Optional<Student> optionalStudent =
                    studentRepository.findById(id);

            if (optionalStudent.isEmpty()) {
                return ResponseEntity.status(404)
                        .body("Student not found.");
            }

            Student student = optionalStudent.get();
            String oldPhoto = student.getProfilePhotoPath();

            if (oldPhoto == null || oldPhoto.isBlank()) {
                return ResponseEntity.ok(
                        Map.of("message", "No profile photo to delete.")
                );
            }

            // First remove the photo path from the database.
            student.setProfilePhotoPath(null);
            Student updatedStudent = studentRepository.save(student);

            // Then delete the actual file from the server.
            try {
                if (oldPhoto.matches("^[a-f0-9-]+\\.(jpg|jpeg|png)$")) {

                    Path oldPhotoPath =
                            PHOTO_DIRECTORY.resolve(oldPhoto).normalize();

                    if (oldPhotoPath.startsWith(PHOTO_DIRECTORY)) {
                        Files.deleteIfExists(oldPhotoPath);
                    }
                }

            } catch (IOException e) {
                System.err.println(
                        "Profile photo file cleanup failed: "
                                + e.getMessage()
                );
            }

            return ResponseEntity.ok(
                    toStudentResponse(updatedStudent)
            );

        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body("Invalid student session.");

        } catch (Exception e) {
            System.err.println("Photo delete error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to delete profile photo.");
        }
    }

    // ================= GET ALL STUDENTS =================

    @GetMapping("/all")
    public ResponseEntity<?> getAllStudents(HttpSession session) {

        Object role = session.getAttribute("STUDENT_ROLE");
        Object adminId = session.getAttribute("STUDENT_ID");

        System.out.println("========== STUDENT API CHECK ==========");
        System.out.println("REQUEST SESSION ID: " + session.getId());
        System.out.println("REQUEST SESSION ROLE: " + role);
        System.out.println("REQUEST STUDENT ID: " + adminId);
        System.out.println("=======================================");

        if (adminId == null
                || role == null
                || !"ADMIN".equals(role.toString())) {

            return ResponseEntity.status(403)
                    .body("Access denied. Admin only.");
        }

        List<StudentResponse> students = studentRepository.findAll()
                .stream()
                .map(this::toStudentResponse)
                .toList();

        return ResponseEntity.ok(students);
    }

    // ================= CHECK SESSION =================

    @GetMapping("/session")
    public ResponseEntity<?> checkSession(HttpSession session) {

        Object role = session.getAttribute("STUDENT_ROLE");
        Object id = session.getAttribute("STUDENT_ID");

        System.out.println("========== SESSION DEBUG ==========");
        System.out.println("SESSION ID: " + session.getId());
        System.out.println("SESSION ROLE: " + role);
        System.out.println("SESSION STUDENT ID: " + id);
        System.out.println("===================================");

        if (id == null || role == null) {
            return ResponseEntity.status(401)
                    .body("No active login session");
        }

        return ResponseEntity.ok(
                Map.of(
                        "studentId", id,
                        "role", role
                )
        );
    }

    // ================= LOGOUT =================

    @PostMapping("/logout")
    public ResponseEntity<?> logoutStudent(HttpSession session) {

        System.out.println("LOGOUT SESSION ID: " + session.getId());

        session.invalidate();

        return ResponseEntity.ok("Logged out successfully");
    }

    // ================= SAFE STUDENT RESPONSE =================

    private StudentResponse toStudentResponse(Student student) {

        return new StudentResponse(
                student.getId(),
                student.getFullName(),
                student.getRollNo(),
                student.getEmail(),
                student.getDepartment(),
                student.getRole(),
                student.getProfilePhotoPath()
        );
    }

    // ================= FORGOT PASSWORD: SEND OTP =================

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendPasswordResetOtp(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Email is required.");
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid email address.");
        }

        try {
            passwordResetService.sendOtp(email);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "If this email is registered, an OTP will be sent."
                    )
            );

        } catch (Exception e) {
            System.err.println("OTP sending error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to send OTP right now.");
        }
    }

    // ================= FORGOT PASSWORD: VERIFY OTP AND RESET =================

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otp == null || newPassword == null
                || email.isBlank() || otp.isBlank() || newPassword.isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email, OTP and new password are required.");
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid email address.");
        }

        if (!otp.matches("^\\d{6}$")) {
            return ResponseEntity.badRequest()
                    .body("Enter a valid 6-digit OTP.");
        }

        if (newPassword.length() < 8 || newPassword.length() > 72) {
            return ResponseEntity.badRequest()
                    .body("Password must be 8 to 72 characters.");
        }

        try {
            boolean success =
                    passwordResetService.verifyOtpAndResetPassword(
                            email, otp, newPassword
                    );

            if (!success) {
                return ResponseEntity.badRequest()
                        .body("Invalid or expired OTP.");
            }

            return ResponseEntity.ok(
                    Map.of("message", "Password reset successfully.")
            );

        } catch (Exception e) {
            System.err.println("Password reset error: " + e.getMessage());

            return ResponseEntity.internalServerError()
                    .body("Unable to reset password right now.");
        }
    }
}
