package campusfix.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import campusfix.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRollNo(String rollNo);
}
