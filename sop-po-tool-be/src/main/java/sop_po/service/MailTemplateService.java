package sop_po.service;

import java.util.List;

import org.springframework.stereotype.Service;

import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;

@Service
public interface MailTemplateService {

        public String getComposeMailTemplate(String content);

        public String userIntimationTemplate(String userName, String password);

        public String approveMailTemplate(String recipient, String requestBy, Request_table request, String content,
                        String remarks);

        public String holdMailTemplate(String recipient, String requestBy,  Request_table request, String remarks);

        public String rejectMailTemplate(String recipient, String requestBy,  Request_table request, String content,
                        String remarks);

        public String guestMailTemplate(String recipient, String requestBy,  Request_table request, String content,
                        String stage, String remarks);

        public String poMailTemplate(String recipient, Request_table request, String content);

        public String sendForgotPasswordLink(String recepient, String email, String token);

        public String guestPoMailTemplate(String reqNo, String recipient, String poNumber, String content,
                        String Vendor,
                        long poValue);

        public String MttpMailTemplate(String reqNo, String username, String requestBy, Estatus status, String remarks);

        public String holdIntimationTemplate(String recipient, Request_table request, String stage);

        public String manualEmailTemplate(String content, List<String> ccEmails);
}
