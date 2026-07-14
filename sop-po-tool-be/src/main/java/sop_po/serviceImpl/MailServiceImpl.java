package sop_po.serviceImpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import sop_po.entity.EmailDetails;
import sop_po.model.ticket_request.AttachmentWrapper;
import sop_po.service.MailService;

// @Document
@Service
@Component
public class MailServiceImpl implements MailService {

    @Autowired
    private JavaMailSender emailSender;

    @Override
    public boolean sendEmail(EmailDetails emailDetails, String template) {

        final MimeMessage mimeMessage = emailSender.createMimeMessage();
        try {
            final MimeMessageHelper message = new MimeMessageHelper(mimeMessage, true, "UTF-8"); // true = multipart
            message.setSubject(emailDetails.getSubject());
            message.setFrom("no-reply@cavinkare.com");

            for (String to : emailDetails.getTo()) {
                message.addTo(to);
            }
            if (emailDetails.getCc() != null) {
                for (String cc : emailDetails.getCc()) {
                    message.addCc(cc);
                }
            }

            if (emailDetails.getBcc() != null) {
                for (String bcc : emailDetails.getBcc()) {
                    message.addBcc(bcc);
                }
            }
            message.setText(template, true);

            message.addInline("heplLogo", new ClassPathResource("static/images/hepl-logo-1.png"));
            message.addInline("twitterImage", new ClassPathResource("static/images/twitter.png"));
            message.addInline("facebookImage", new ClassPathResource("static/images/facebook.png"));
            message.addInline("linkedinImage", new ClassPathResource("static/images/linkedin.png"));
            message.addInline("font", new ClassPathResource("static/fonts/Product Sans Regular.ttf"));
            message.addInline("backgroundImage", new ClassPathResource("static/images/logo.png"));

            emailSender.send(mimeMessage);
            return true;

        } catch (Exception e) {
            System.err.println("An error occurred while sending the email.");
            e.printStackTrace();
            return false;
        }
    }

    @Override
    public void sendMailByTemplate(String content, String recepient, String subject, List<String> ccMail)
            throws MessagingException {

        final MimeMessage mimeMessage = emailSender.createMimeMessage();
        final MimeMessageHelper message = new MimeMessageHelper(mimeMessage, true, "UTF-8"); // true = multipart
        message.setSubject(subject);
        message.setFrom("no-reply@cavinkare.com");
        message.setTo(recepient);
        if (ccMail != null) {
            for (String cc : ccMail)
                message.addCc(cc);
        }

        message.setText(content, true);

        message.addInline("heplLogo", new ClassPathResource("static/images/hepl-logo.png"));
        message.addInline("ckplLogo", new ClassPathResource("static/images/ckpl-logo.jpg"));
        emailSender.send(mimeMessage);
    }

    @Override
    public void sendMailByTemplateWithAttachments(String content, String recepient, String subject,
            List<AttachmentWrapper> attachments, List<String> ccMail) throws MessagingException {
        final MimeMessage mimeMessage = emailSender.createMimeMessage();
        final MimeMessageHelper message = new MimeMessageHelper(mimeMessage, true, "UTF-8"); // true = multipart
        message.setSubject(subject);
        message.setFrom("no-reply@cavinkare.com");
        message.setTo(recepient);
        if (ccMail != null) {
            for (String cc : ccMail)
                message.addCc(cc);
        }

        message.setText(content, true);

        message.addInline("heplLogo", new ClassPathResource("static/images/hepl-logo.png"));
        if (attachments != null) {
            for (AttachmentWrapper attachment : attachments) {
                message.addAttachment(attachment.getFileName(), new ByteArrayResource(attachment.getContent()));
            }
        }
        emailSender.send(mimeMessage);
    }
}
