
package campusfix.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // Forgot Password OTP
    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("CampusFix - Password Reset OTP");

        message.setText(
            "Hello,\n\n" +
            "Your CampusFix password reset OTP is: " + otp + "\n\n" +
            "This OTP is valid for 5 minutes.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "Regards,\nCampusFix Team"
        );

        mailSender.send(message);
    }

    // New Student Registration OTP
    public void sendRegistrationOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("CampusFix - Email Verification OTP");

        message.setText(
            "Hello,\n\n" +
            "Welcome to CampusFix!\n\n" +
            "Your email verification OTP is: " + otp + "\n\n" +
            "This OTP is valid for 5 minutes.\n\n" +
            "Please do not share this OTP with anyone.\n\n" +
            "Regards,\nCampusFix Team"
        );

        mailSender.send(message);
    }
}
