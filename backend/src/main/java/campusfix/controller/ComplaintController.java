
package campusfix.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import campusfix.entity.Complaint;
import campusfix.repository.ComplaintRepository;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(
    origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    }
)
public class ComplaintController {

    private final ComplaintRepository complaintRepository;

    private final Path uploadDirectory =
            Paths.get("uploads").toAbsolutePath().normalize();

    public ComplaintController(
            ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    // CREATE COMPLAINT WITH PHOTO
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createComplaint(
            @RequestParam String title,
            @RequestParam String category,
            @RequestParam String description,
            @RequestParam String location,
            @RequestParam String studentEmail,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) MultipartFile image) {

        try {
            Complaint complaint = new Complaint();

            complaint.setTitle(title);
            complaint.setCategory(category);
            complaint.setDescription(description);
            complaint.setLocation(location);
            complaint.setStudentEmail(studentEmail);
            complaint.setStatus("Pending");

            complaint.setPriority(
                    priority == null || priority.isBlank()
                            ? "Medium" : priority
            );

            if (image != null && !image.isEmpty()) {

                if (image.getSize() > 5 * 1024 * 1024) {
                    return ResponseEntity.badRequest()
                            .body("Image must be 5 MB or smaller");
                }

                String contentType = image.getContentType();

                String extension;

                if ("image/jpeg".equalsIgnoreCase(contentType)) {
                    extension = ".jpg";
                } else if ("image/png".equalsIgnoreCase(contentType)) {
                    extension = ".png";
                } else {
                    return ResponseEntity.badRequest()
                            .body("Only JPG, JPEG and PNG images are allowed");
                }

                // Verify that the uploaded file is a real image.
                try (var input = image.getInputStream()) {
                    if (javax.imageio.ImageIO.read(input) == null) {
                        return ResponseEntity.badRequest()
                                .body("Invalid image file");
                    }
                }

                Files.createDirectories(uploadDirectory);

                String fileName = UUID.randomUUID() + extension;

                Path filePath = uploadDirectory.resolve(fileName)
                        .normalize();

                if (!filePath.startsWith(uploadDirectory)) {
                    return ResponseEntity.badRequest()
                            .body("Invalid file path");
                }

                image.transferTo(filePath);

                complaint.setImagePath("/uploads/" + fileName);
            }

            Complaint savedComplaint =
                    complaintRepository.save(complaint);

            return ResponseEntity.ok(savedComplaint);

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Unable to upload image");
        }
    }

    // GET ALL COMPLAINTS
    @GetMapping
    public ResponseEntity<?> getAllComplaints() {
        return ResponseEntity.ok(complaintRepository.findAll());
    }

    // GET COMPLAINTS BY STUDENT EMAIL
    @GetMapping("/student/{studentEmail}")
    public ResponseEntity<?> getComplaintsByStudentEmail(
            @PathVariable String studentEmail) {

        return ResponseEntity.ok(
                complaintRepository.findByStudentEmail(studentEmail)
        );
    }

    // UPDATE STATUS
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return complaintRepository.findById(id)
                .map(complaint -> {
                    complaint.setStatus(status);
                    return ResponseEntity.ok(
                            complaintRepository.save(complaint)
                    );
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // UPDATE PRIORITY
    @PutMapping("/{id}/priority")
    public ResponseEntity<?> updatePriority(
            @PathVariable Long id,
            @RequestParam String priority) {

        return complaintRepository.findById(id)
                .map(complaint -> {
                    complaint.setPriority(priority);
                    return ResponseEntity.ok(
                            complaintRepository.save(complaint)
                    );
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DELETE COMPLAINT
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComplaint(
            @PathVariable Long id) {

        if (!complaintRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        complaintRepository.deleteById(id);

        return ResponseEntity.ok("Complaint deleted successfully");
    }
}
