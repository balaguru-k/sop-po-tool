package sop_po.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import sop_po.service.ClosedEmailService;

@Service
public class ClosedEmailServiceImpl implements ClosedEmailService {
    @Autowired
    private JavaMailSender javaMailSender;

    // @Value("${spring.mail.username}") private String sender;

    @Override
    public String sendSimpleMail(String recipient) {

        try {
            // Creating a simple mail message
            SimpleMailMessage mailMessage = new SimpleMailMessage();

            // Setting up necessary details
            mailMessage.setFrom("vignesh.n@hepl.com");
            mailMessage.setTo(recipient);
            mailMessage.setText("Hi" + recipient);
            mailMessage.setSubject("Test Mail");

            // Sending the mail
            javaMailSender.send(mailMessage);
            return "Mail Sent Successfully...";
        } catch (Exception e) {
            return "Error:" + e.getMessage();
        }
        // TODO Auto-generated method stub

    }

}
