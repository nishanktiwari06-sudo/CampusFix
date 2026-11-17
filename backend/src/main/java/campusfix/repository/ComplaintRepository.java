
package campusfix.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import campusfix.entity.Complaint;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStudentEmail(String studentEmail);

    List<Complaint> findTop3ByOrderByCreatedAtDesc();
}
