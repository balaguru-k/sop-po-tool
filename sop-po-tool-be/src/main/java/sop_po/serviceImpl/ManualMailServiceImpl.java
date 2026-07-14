package sop_po.serviceImpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import sop_po.jwt.JwtUtils;
import sop_po.model.ManualMail;
import sop_po.model.ticket_request.AttachmentWrapper;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.History;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;
import sop_po.repository.ManualMailRepository;
import sop_po.repository.RequestRepository;
import sop_po.repository.UserRepository;
import sop_po.service.MailServiceAsync;
import sop_po.service.MailTemplateService;
import sop_po.service.ManualMailService;

@Service
public class ManualMailServiceImpl implements ManualMailService {

    private static final Logger logger = LoggerFactory.getLogger(ManualMailServiceImpl.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ManualMailRepository manualMailRepository;

    @Autowired
    private MailServiceAsync mailServiceAsync;

    @Autowired
    private MailTemplateService mailTemplateService;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public ResponseEntity<?> createManualMail(ManualMail manualMail) {

        String userId = jwtUtils.getUserId();
        try {
            manualMail.setCreatedBy(userId);
            manualMail.setCreatedAt(LocalDateTime.now());
            manualMail.setUpdatedAt(LocalDateTime.now());
            ManualMail savedMail = manualMailRepository.save(manualMail);
            return ResponseEntity.ok(savedMail);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating manual mail: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> updateManualMail(String id, ManualMail manualMail) {
        try {
            Optional<ManualMail> existingMail = manualMailRepository.findById(id);
            if (existingMail.isPresent()) {
                ManualMail mail = existingMail.get();
                mail.setTo(manualMail.getTo());
                mail.setCc(manualMail.getCc());
                mail.setBcc(manualMail.getBcc());
                mail.setSubject(manualMail.getSubject());
                mail.setContent(manualMail.getContent());
                mail.setUpdatedAt(LocalDateTime.now());
                ManualMail updatedMail = manualMailRepository.save(mail);
                return ResponseEntity.ok(updatedMail);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating manual mail: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<ManualMail>> getAllManualMails() {
        try {
            List<ManualMail> mails = manualMailRepository.findByCreatedBy(jwtUtils.getUserId());
            return ResponseEntity.ok(mails);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<?> getManualMailById(String id) {
        try {
            Optional<ManualMail> mail = manualMailRepository.findById(id);
            if (mail.isPresent()) {
                return ResponseEntity.ok(mail.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching manual mail: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> deleteManualMail(String id) {
        try {
            if (manualMailRepository.existsById(id)) {
                manualMailRepository.deleteById(id);
                return ResponseEntity.ok("Manual mail deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting manual mail: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> sendManualMail(String id, MultipartFile[] attachments) {
        try {
            Optional<ManualMail> mailOpt = manualMailRepository.findById(id);
            if (!mailOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ManualMail mail = mailOpt.get();
            
            if (mail.getTo() == null || mail.getTo().isEmpty()) {
                return ResponseEntity.badRequest().body("To field is required");
            }
            
            if (mail.getSubject() == null || mail.getSubject().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Subject is required");
            }
            
            if (mail.getContent() == null || mail.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            List<AttachmentWrapper> attachmentWrappers = null;
            if (attachments != null && attachments.length > 0) {
                attachmentWrappers = new ArrayList<>();
                for (MultipartFile file : attachments) {
                    if (!file.isEmpty()) {
                        attachmentWrappers.add(new AttachmentWrapper(file.getOriginalFilename(), file.getBytes()));
                    }
                }
            }

            String processedContent = mailTemplateService.manualEmailTemplate(mail.getContent(), mail.getCc());

            for (String recipient : mail.getTo()) {
                if (attachmentWrappers != null && !attachmentWrappers.isEmpty()) {
                    mailServiceAsync.sendMailWithAttachments(processedContent, recipient, mail.getSubject(), attachmentWrappers, mail.getCc());
                } else {
                    mailServiceAsync.sendMail(processedContent, recipient, mail.getSubject(), mail.getCc());
                }
            }

            return ResponseEntity.ok("Manual email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send email: " + e.getMessage());
        }
    }

    // @Scheduled(fixedRate = 3600000)
	public void sendHoldTicketIntimation() {
		LocalDateTime threeHoursAgo = LocalDateTime.now().minusHours(3);

		List<Request_table> holdTickets = requestRepository.findAll().stream()
				.filter(ticket -> {
					List<History> historyList = ticket.getHistoryList();
					if (historyList == null || historyList.isEmpty())
						return false;

					History lastHistory = historyList.get(historyList.size() - 1);
					return lastHistory.getStatus() == Estatus.Approved &&
							lastHistory.getDate() != null &&
							lastHistory.getDate().isBefore(threeHoursAgo);
				})
				.collect(Collectors.toList());

		for (Request_table ticket : holdTickets) {
			try {
				TicketStage currentStage = ticket.getStage();
				List<User> stageUsers = new ArrayList<>();

				if (currentStage == TicketStage.Business_Approver) {
					User user = userRepository.findById(ticket.getBusinessApprover())
							.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
									"Business Approver not found"));
					if (user != null)
						stageUsers.add(user);
				} else if (currentStage == TicketStage.Po_release) {
					User user = userRepository.findById(ticket.getPoApproverId())
							.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
									"Po Release Approver not found"));
					;
					if (user != null)
						stageUsers.add(user);
				} else {
					stageUsers = userRepository.findAllByRoles(currentStage, mongoTemplate);
				}

				for (User user : stageUsers) {
					String emailContent = mailTemplateService.holdIntimationTemplate(
							user.getUsername(),
							ticket,
							currentStage.toString());
					mailServiceAsync.sendMail(emailContent, user.getEmail(), "Ticket Hold Intimation", null);
				}
			} catch (Exception e) {
				logger.error("Failed to send hold intimation for ticket: " + ticket.getReqNo(), e);
			}
		}
	}
}