package sop_po.service;

import java.util.List;

import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import sop_po.entity.EmailDetails;
import sop_po.model.ticket_request.AttachmentWrapper;
@Service
public interface MailService {
    
    boolean sendEmail(EmailDetails emailDetails,String template);

    void sendMailByTemplate(String content, String recepient, String subject, List<String> ccMail) throws MessagingException;

    void sendMailByTemplateWithAttachments(String emailContent, String recipientEmail, String subject,
             List<AttachmentWrapper> attachments, List<String> ccMail) throws MessagingException;
}
