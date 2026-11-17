
package campusfix.dto;

public record StudentResponse(
        Long id,
        String fullName,
        String rollNo,
        String email,
        String department,
        String role,
        String profilePhotoPath
) {
}
