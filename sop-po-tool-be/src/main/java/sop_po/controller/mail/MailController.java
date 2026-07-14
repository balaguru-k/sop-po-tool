package sop_po.controller.mail;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sop_po.entity.EmailDetails;
import sop_po.service.MailService;
import sop_po.service.MailTemplateService;
@RestController
@RequestMapping("/api/mail")
public class MailController {
     @Autowired
    private MailService mailService;
    @Autowired
    private MailTemplateService mailTemplateService;

    @PostMapping(value = "/send-mail", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public String sendMail(@ModelAttribute EmailDetails emailDetails) {
        String template=mailTemplateService.getComposeMailTemplate(emailDetails.getContent());
        mailService.sendEmail(emailDetails,template);
        return "Email sent and details saved successfully";
    }
}
