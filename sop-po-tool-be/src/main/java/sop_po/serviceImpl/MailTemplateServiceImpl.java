package sop_po.serviceImpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import lombok.extern.slf4j.Slf4j;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.user.User;
import sop_po.repository.UserRepository;
import sop_po.service.MailTemplateService;

@Service
@Slf4j
public class MailTemplateServiceImpl implements MailTemplateService {

    @Value("${com.custom.reset-link}")
    private String resetPasswordLink;

    @Autowired
    private TemplateEngine templateEngine;

    @Autowired
    private UserRepository userRepo;

    @Override
    public String getComposeMailTemplate(String content) {

        Context context = new Context();
        context.setVariable("content", content);
        return templateEngine.process("custom-mail", context);
    }

    @Override
    public String userIntimationTemplate(String userName, String password) {

        Context context = new Context();
        context.setVariable("userName", userName);
        context.setVariable("password", password);
        context.setVariable("changePassword", resetPasswordLink);
        return templateEngine.process("user-notification-mail", context);
    }

    @Override
    public String approveMailTemplate(String recipient, String requestBy, Request_table request,
            String content,
            String remarks) {

        User user = userRepo.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("requestBy", requestBy);
        context.setVariable("approvedBy", user.getUsername());
        context.setVariable("data", request);
        context.setVariable("remarks", remarks);
        context.setVariable("content", content);
        return templateEngine.process("approve-mail", context);
    }

    @Override
    public String holdMailTemplate(String recipient, String requestBy, Request_table request,
            String remarks) {

        User user = userRepo.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("requestBy", requestBy);
        context.setVariable("holdBy", user.getUsername());
        context.setVariable("data", request);
        context.setVariable("remarks", remarks);

        return templateEngine.process("hold-mail", context);
    }

    @Override
    public String rejectMailTemplate(String recipient, String requestBy, Request_table request,
            String content,
            String remarks) {

        User user = userRepo.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("requestBy", requestBy);
        context.setVariable("rejectedBy", user.getUsername());
        context.setVariable("data", request);
        context.setVariable("remarks", remarks);
        context.setVariable("content", content);
        return templateEngine.process("reject-mail", context);

    }

    @Override
    public String poMailTemplate(String recipient, Request_table request, String content) {

        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("data", request);
        context.setVariable("content", content);
        return templateEngine.process("po-mail", context);

    }

    @Override
    public String guestPoMailTemplate(String reqNo, String recipient, String poNumber, String content, String vendor,
            long poValue) {

        Context context = new Context();
        context.setVariable("reqNo", reqNo);
        context.setVariable("recipient", recipient);
        context.setVariable("poNumber", poNumber);
        context.setVariable("vendor", vendor);
        context.setVariable("content", content);
        context.setVariable("poValue", poValue);
        return templateEngine.process("guest-po-mail", context);

    }

    @Override
    public String guestMailTemplate(String recipient, String requestBy, Request_table request,
            String content,
            String stage, String remarks) {

        User user = userRepo.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("requestBy", requestBy);
        context.setVariable("approvedBy", user.getUsername());
        context.setVariable("data", request);
        context.setVariable("stage", stage);
        context.setVariable("remarks", remarks);
        context.setVariable("content", content);
        return templateEngine.process("guest-mail", context);
    }

    @Override
    public String sendForgotPasswordLink(String recepient, String email, String token) {

        Context context = new Context();
        context.setVariable("to", email);
        context.setVariable("recepient", recepient);
        context.setVariable("resetLink", resetPasswordLink + "?token=" + token);
        return templateEngine.process("reset-mail", context);
    }

    @Override
    public String MttpMailTemplate(String reqNo, String recipient, String requestBy, Estatus status, String remarks) {

        Context context = new Context();
        context.setVariable("reqNo", reqNo);
        context.setVariable("recipient", recipient);
        context.setVariable("requestBy", requestBy);
        context.setVariable("remarks", remarks);

        String templateName;
        switch (status) {
            case Approved:
                templateName = "mttp-approve-mail";
                break;
            case Reject:
                templateName = "mttp-reject-mail";
                break;
            case Hold:
                templateName = "mttp-hold-mail";
                break;
            case Completed:
                templateName = "mttp-po-mail";
            default:
                templateName = "mttp-guest-mail";
                break;
        }

        return templateEngine.process(templateName, context);
    }

    @Override
    public String holdIntimationTemplate(String recipient, Request_table request, String stage) {
        Context context = new Context();
        context.setVariable("recipient", recipient);
        context.setVariable("data", request);
        context.setVariable("stage", stage);
        context.setVariable("content", "Ticket has been pending at " + stage + " stage for more than 3 hours");
        return templateEngine.process("hold-intimation-mail", context);
    }

    @Override
    public String manualEmailTemplate(String content, List<String> ccEmails) {
        String logoPath = determineLogo(ccEmails);

        Context context = new Context();
        context.setVariable("content", content);
        context.setVariable("header", "Marketing Po Tool");
        context.setVariable("logoPath", logoPath);
        return templateEngine.process("manual-mail", context);
    }

    private String determineLogo(List<String> ccEmails) {
        if (ccEmails != null) {
            for (String email : ccEmails) {
                if (email.contains("@help.com")) {
                    return "heplLogo"; 
                } else if (email.contains("@cavinkare.com")) {
                    return "ckplLogo";
                }
            }
        }
        return "ckplLogo";
    }

}
