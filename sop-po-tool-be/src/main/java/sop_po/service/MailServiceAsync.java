package sop_po.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import sop_po.model.ticket_request.AttachmentWrapper;

@Service
public class MailServiceAsync {

    @Autowired
    private MailService mailService;
    
    @Async
    public void sendMail(String emailContent, String recipientEmail, String subject, List<String> ccMail) {
        try {
            mailService.sendMailByTemplate(emailContent, recipientEmail, subject, ccMail);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Async
    public void sendMailWithAttachments(String emailContent, String recipientEmail, String subject,  List<AttachmentWrapper> attachments, List<String> ccMail) {
        try {
            mailService.sendMailByTemplateWithAttachments(emailContent, recipientEmail, subject, attachments, ccMail);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
}
