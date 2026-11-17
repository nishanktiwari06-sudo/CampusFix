
package campusfix.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import campusfix.entity.Complaint;
import campusfix.repository.ComplaintRepository;
import campusfix.repository.StudentRepository;

@RestController
@RequestMapping("/api/home")
@CrossOrigin(origins = "*")
public class HomeController {

    private final ComplaintRepository complaintRepository;
    private final StudentRepository studentRepository;

    public HomeController(
            ComplaintRepository complaintRepository,
            StudentRepository studentRepository) {
        this.complaintRepository = complaintRepository;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/statistics")
    public Map<String, Object> getHomeStatistics() {

        List<Complaint> complaints = complaintRepository.findAll();

        long totalComplaints = complaints.size();

        long pendingComplaints = complaints.stream()
                .filter(c -> "Pending".equalsIgnoreCase(c.getStatus()))
                .count();

        long resolvedComplaints = complaints.stream()
                .filter(c -> {
                    String status = c.getStatus();
                    return "Resolved".equalsIgnoreCase(status)
                            || "Fixed".equalsIgnoreCase(status);
                })
                .count();

        long inProgressComplaints = complaints.stream()
                .filter(c -> "In Progress".equalsIgnoreCase(c.getStatus()))
                .count();

        List<Complaint> latestComplaints =
                complaintRepository.findTop3ByOrderByCreatedAtDesc();

        List<Map<String, Object>> latestIssues = latestComplaints.stream()
                .map(c -> {
                    Map<String, Object> issue = new HashMap<>();
                    issue.put("title", c.getTitle());
                    issue.put("category", c.getCategory());
                    issue.put("location", c.getLocation());
                    issue.put("status", c.getStatus());
                    issue.put("createdAt", c.getCreatedAt());
                    return issue;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();

        response.put("totalStudents", studentRepository.count());
        response.put("totalComplaints", totalComplaints);
        response.put("pendingComplaints", pendingComplaints);
        response.put("resolvedComplaints", resolvedComplaints);
        response.put("inProgressComplaints", inProgressComplaints);
        response.put("latestComplaints", latestIssues);

        return response;
    }
}
