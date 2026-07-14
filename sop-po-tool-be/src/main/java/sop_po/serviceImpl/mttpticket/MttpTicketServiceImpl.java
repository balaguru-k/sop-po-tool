package sop_po.serviceImpl.mttpticket;

import java.util.List;
import java.util.stream.Collectors;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import sop_po.entity.FileType;
import sop_po.model.mttp.MttpHistory;
import sop_po.model.mttp.MttpTicket;
import sop_po.model.ticket_request.AttachmentWrapper;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;
import sop_po.repository.UserRepository;
import sop_po.repository.mttpticket.MttpHistoryRepo;
import sop_po.repository.mttpticket.MttpTicketRepo;
import sop_po.request.mttpticket.MttpTicketDto;
import sop_po.security.service.UserDetailsImpl;
import sop_po.service.FileService;
import sop_po.service.MailServiceAsync;
import sop_po.service.MailTemplateService;
import sop_po.service.mttpticket.MttpTicketService;

@Service
public class MttpTicketServiceImpl implements MttpTicketService {

    private final MttpTicketRepo mttpTicketRepo;
    private final UserRepository userRepo;
    private final FileService fileService;
    private final MongoTemplate mongoTemplate;
    private final MttpHistoryRepo historyRepo;
    private final MailServiceAsync mailServiceAsync;
    private final MailTemplateService mailTemplateService;

    public MttpTicketServiceImpl(MttpTicketRepo mttpTicketRepo, UserRepository userRepo, FileService fileService,
            MongoTemplate mongoTemplate, MttpHistoryRepo historyRepo, MailServiceAsync mailServiceAsync,
            MailTemplateService mailTemplateService) {
        this.mttpTicketRepo = mttpTicketRepo;
        this.userRepo = userRepo;
        this.fileService = fileService;
        this.mongoTemplate = mongoTemplate;
        this.historyRepo = historyRepo;
        this.mailServiceAsync = mailServiceAsync;
        this.mailTemplateService = mailTemplateService;
    }

    @Override
    public MttpTicket createMttpTicket(@Valid MttpTicketDto mttpTicketDto, Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String id = userDetails.getId();
        String userName = userDetails.getUsername();

        User approver = userRepo.findById(mttpTicketDto.getApproverId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (mttpTicketDto.getRoiDescription() == null || mttpTicketDto.getRoiDescription().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROI Description is required");
        }

        List<String> poFiles = new ArrayList<>();
        List<String> mailAttachments = new ArrayList<>();

        if (mttpTicketDto.getPoFile() != null && !mttpTicketDto.getPoFile().isEmpty()) {
            for (MultipartFile file : mttpTicketDto.getPoFile()) {
                String originalName = file.getOriginalFilename();
                if (originalName == null ||
                        !(originalName.toLowerCase().endsWith(".xls")
                                || originalName.toLowerCase().endsWith(".xlsx"))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Invalid PO file format for " + originalName + ". Only .xls or .xlsx files are allowed.");
                }
                try {
                    String fileName = fileService.uploadFile(file, FileType.POFILE);
                    poFiles.add(fileName);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload PO file: " + originalName, e);
                }
            }
        }

        if (mttpTicketDto.getMailAttachment() != null && !mttpTicketDto.getMailAttachment().isEmpty()) {
            for (MultipartFile file : mttpTicketDto.getMailAttachment()) {
                String originalName = file.getOriginalFilename();
                if (originalName == null || !originalName.toLowerCase().endsWith(".eml")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Invalid mail attachment format for " + originalName + ". Only .eml files are allowed.");
                }
                try {
                    String fileName = fileService.uploadFile(file, FileType.MAIL_ATTACHMENT);
                    mailAttachments.add(fileName);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload mail attachment: " + file.getOriginalFilename(), e);
                }
            }
        }
        MttpTicket ticket = new MttpTicket();
        String reqNo = generatereqNo();
        ticket.setReqNo(reqNo);
        ticket.setReqName(userName);
        ticket.setBusinessApproverId(mttpTicketDto.getApproverId());
        ticket.setBusinessApprover(approver.getUsername());
        ticket.setRoiDescription(mttpTicketDto.getRoiDescription());
        ticket.setPoFile(poFiles);
        ticket.setMailAttachment(mailAttachments);
        ticket.setStatus(Estatus.Submitted);
        ticket.setStage(TicketStage.Business_Approver);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setCreatedBy(id);
        ticket.setDelete(false);

        List<User> copyMailIds = new ArrayList<>();
        if (mttpTicketDto.getCarbonCopyMailIds() != null) {
            for (String userId : mttpTicketDto.getCarbonCopyMailIds()) {
                User user = userRepo.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                copyMailIds.add(user);
            }
        }
        ticket.setCarbonCopyMailIds(copyMailIds);

        MttpHistory history = new MttpHistory();
        history.setName(TicketStage.Requestor);
        history.setUsername(userName);
        history.setStatus(Estatus.Submitted);
        history.setDate(LocalDateTime.now());
        history.setRemarks(mttpTicketDto.getRemarks());
        history.setIsDelete(false);
        ticket.addHistory(history);
        historyRepo.save(history);

        ticket = mttpTicketRepo.save(ticket);

        List<String> ccMailIds = new ArrayList<>();
        for (User user : copyMailIds) {
            ccMailIds.add(user.getEmail());
        }
        ccMailIds.add("ashok.m@cavinkare.com");
        String emailContent = mailTemplateService.MttpMailTemplate(reqNo, approver.getUsername(),
                userName, Estatus.Approved,
                "ticket submit by Requestor");
        mailServiceAsync.sendMail(emailContent, approver.getEmail(), "Marketing Budget Request", null);

        User user = userRepo.findByUsername("Misha H").orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

        String Content = mailTemplateService.MttpMailTemplate(reqNo,
                user.getUsername(),
                userName, Estatus.Ticket_Created,
                "A new MTTP ticket has been created");

        mailServiceAsync.sendMail(Content, user.getEmail(), "Marketing Budget Request",
                ccMailIds);
        return ticket;

    }

    private String generatereqNo() {
        LocalDate today = LocalDate.now();
        String datePart = today.format(DateTimeFormatter.ofPattern("MMdd-yyyy"));

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<MttpTicket> latestReqNos = mttpTicketRepo.findLatestReqNo(startOfDay, endOfDay,
                PageRequest.of(0, 1));

        int sequence = 1;
        String latestReqNumber = null;
        if (!latestReqNos.isEmpty()) {
            latestReqNumber = latestReqNos.get(0).getReqNo();
            sequence = Integer.parseInt(latestReqNumber.split("-")[2]) + 1;
        }

        return String.format("MTTP-PO-%03d-%s", sequence, datePart);
    }

    @Override
    public List<MttpTicket> getByStage(TicketStage stage, Estatus status, Authentication authentication) {

        String id = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        List<MttpTicket> tickets = switch (stage) {
            case Business_Approver -> mttpTicketRepo.findByBusinessApproverIdAndStage(id, stage, mongoTemplate);
            case Po_release -> mttpTicketRepo.findByPoApproverIdAndStage(id, stage, mongoTemplate);
            case Requestor ->
                mttpTicketRepo.findByCreatedByAndStatusNot(id, Estatus.Completed, mongoTemplate);
            default -> mttpTicketRepo.findByStage(stage, status, mongoTemplate);
        };
        return tickets.stream()
                .sorted(Comparator
                        .<MttpTicket, Boolean>comparing(ticket -> ticket.getStatus() != Estatus.Reject)
                        .thenComparing(Comparator.comparing(
                                MttpTicket::getUpdatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))))
                .collect(Collectors.toList());
    }

    @Override
    public MttpTicket getApproverTickets(String id, Estatus status, String docNumber, List<String> poNumber,
            String remarks,
            Boolean isRelated,
            String poApproverId, List<MultipartFile> file, List<String> deletedFile, Authentication authentication) {

        String userName = ((UserDetailsImpl) authentication.getPrincipal()).getUsername();

        MttpTicket ticket = mttpTicketRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        TicketStage currentStage = ticket.getStage();

        validateTicketInputs(ticket, currentStage, status, docNumber, poNumber, remarks, file, isRelated, poApproverId);

        if (status == Estatus.Retrieve) {
            ticket.setStatus(status);
            ticket.setUpdatedAt(LocalDateTime.now());
            ticket.setUpdatedBy(id);

            MttpHistory history = new MttpHistory();
            history.setIsDelete(false);
            history.setName(currentStage);
            history.setUsername(userName);
            history.setStatus(status);
            history.setRemarks(remarks);
            history.setDate(LocalDateTime.now());
            ticket.addHistory(history);
            historyRepo.save(history);

            mttpTicketRepo.save(ticket);
            return ticket;
        }

        TicketStage nextStage = getNextStage(currentStage, status, ticket.getIsRelated(), ticket.getHistoryList());

        if ((currentStage.equals(TicketStage.PO_Screening) || currentStage.equals(TicketStage.Po_maker))
                && (file != null || deletedFile != null)) {
            handleFileUpload(ticket, currentStage, file, deletedFile);
        }

        ticket.setStatus(status);
        if (nextStage != null) {
            MttpHistory history = new MttpHistory();
            history.setIsDelete(false);
            history.setName(currentStage);
            history.setUsername(userName);
            history.setStatus(status);
            history.setRemarks(remarks);
            history.setDate(LocalDateTime.now());

            ticket.addHistory(history);
            ticket.setStatus(status);
            if (docNumber != null) {
                ticket.setDocNum(docNumber);
            }
            if (poNumber != null && !poNumber.isEmpty()) {
                ticket.setPoNumber(poNumber);
            }
            if (poApproverId != null) {
                User poApprover = userRepo.findById(poApproverId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                ticket.setPoApprover(poApprover.getUsername());
                ticket.setPoApproverId(poApproverId);
            }
            if (isRelated != null) {
                ticket.setIsRelated(isRelated);
            }
            ticket.setUpdatedAt(LocalDateTime.now());
            ticket.setUpdatedBy(id);
            historyRepo.save(history);

            ticket.setStage(nextStage);
            mttpTicketRepo.save(ticket);
        }
        sendMttpNotification(ticket, status, currentStage, remarks);
        return ticket;
    }

    private void validateTicketInputs(MttpTicket ticket, TicketStage currentStage, Estatus status, String docNumber,
            List<String> poNumber, String remarks, List<MultipartFile> file, Boolean isRelated,
            String poApproverId) {

        if (status.equals(Estatus.Hold)) {
            if (remarks == null || remarks.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are required for hold status");
            }

            if (!(currentStage.equals(TicketStage.Budget_Team) || currentStage.equals(TicketStage.Po_maker))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Hold status is allowed only in Budget_Team or Po_maker stages");
            }
            return;
        }

        if (status.equals(Estatus.Retrieve)) {
            return;
        }

        if (status.equals(Estatus.Reject)) {
            if (remarks == null || remarks.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are required for rejection");
            }
            return;
        }

        if (currentStage.equals(TicketStage.Budget_Team)
                && (docNumber == null || docNumber.trim().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Document number is required for Budget Team stage");
        }

        if (currentStage.equals(TicketStage.Po_maker)
                && (poNumber == null || poNumber.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "PO number is required for PO Maker stage");
        }
        if (currentStage.equals(TicketStage.PO_Screening)) {
            boolean hasExistingFiles = ticket.getPoScreeningFile() != null && !ticket.getPoScreeningFile().isEmpty();
            if (!hasExistingFiles && (file == null || file.isEmpty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File is required for PO Screening stage");
            }
        }

        if (currentStage.equals(TicketStage.Po_maker)) {
            boolean hasExistingFiles = ticket.getPoMakerFile() != null && !ticket.getPoMakerFile().isEmpty();
            if (!hasExistingFiles && (file == null || file.isEmpty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File is required for PO Maker stage");
            }
            if (isRelated == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "isRelated field is required for PO Maker stage");
            }

            if (Boolean.TRUE.equals(isRelated) && (poApproverId == null || poApproverId.trim().isEmpty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "poApproverId is required when isRelated is true for PO Maker stage");
            }
        }
    }

    private TicketStage getNextStage(TicketStage currentStage, Estatus status, Boolean isRelated,
            List<MttpHistory> historyList) {

        if (status == Estatus.Hold) {
            return currentStage;
        }
        switch (currentStage) {
            case Business_Approver:
                if (status == Estatus.Approved) {
                    return TicketStage.PO_Screening;
                } else {
                    return TicketStage.Requestor;
                }
            case PO_Screening:
                if (status == Estatus.Approved) {
                    if (historyList != null && !historyList.isEmpty()) {
                        MttpHistory lastHistory = historyList.get(historyList.size() - 1);

                        if (lastHistory.getName() == TicketStage.Po_maker &&
                                lastHistory.getStatus() == Estatus.Reject) {
                            return TicketStage.Po_maker;
                        }
                    }
                    return TicketStage.Budget_Team;
                } else {
                    return TicketStage.Requestor;
                }
            case Budget_Team:
                if (status == Estatus.Approved) {
                    return TicketStage.Po_maker;
                } else {
                    return TicketStage.PO_Screening;
                }
            case Po_maker:
                if (status == Estatus.Approved) {
                    if (historyList != null && !historyList.isEmpty()) {
                        MttpHistory lastHistory = historyList.get(historyList.size() - 1);
                        if (lastHistory.getStatus() == Estatus.Reject &&
                                (lastHistory.getName() == TicketStage.Po_checker
                                        || lastHistory.getName() == TicketStage.Po_release)) {
                            return lastHistory.getName();
                        }
                    }
                    return TicketStage.Po_checker;
                } else {
                    return TicketStage.PO_Screening;
                }
            case Po_checker:
                if (status == Estatus.Approved) {
                    if (isRelated) {
                        return TicketStage.Po_release;
                    } else {
                        return TicketStage.Po_maker;
                    }
                } else {
                    return TicketStage.Po_maker;
                }
            case Po_release:
                return TicketStage.Po_maker;
            default:
                return null;
        }
    }

    private void handleFileUpload(MttpTicket ticket, TicketStage currentStage, List<MultipartFile> files,
            List<String> deletedFile) {
        try {
            FileType fileType;
            List<String> currentFiles;

            if (currentStage.equals(TicketStage.PO_Screening)) {
                fileType = FileType.PO_SCREENING_FILE;
                currentFiles = ticket.getPoScreeningFile() != null
                        ? new ArrayList<>(ticket.getPoScreeningFile())
                        : new ArrayList<>();
            } else if (currentStage.equals(TicketStage.Po_maker)) {
                fileType = FileType.PO_MAKER_FILE;
                currentFiles = ticket.getPoMakerFile() != null
                        ? new ArrayList<>(ticket.getPoMakerFile())
                        : new ArrayList<>();
            } else {
                return;
            }

            if (deletedFile != null && !deletedFile.isEmpty()) {
                for (String oldFilePath : deletedFile) {
                    try {
                        fileService.deleteFile(oldFilePath, fileType);
                        currentFiles.remove(oldFilePath);
                    } catch (IOException e) {
                        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                "Error deleting file: " + oldFilePath, e);
                    }
                }
            }

            if (files != null && !files.isEmpty()) {
                for (MultipartFile multipartFile : files) {
                    String originalName = multipartFile.getOriginalFilename();
                    if (originalName == null ||
                            !(originalName.toLowerCase().endsWith(".xls")
                                    || originalName.toLowerCase().endsWith(".xlsx"))) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid file format for " + originalName
                                        + ". Only Excel files (.xls, .xlsx) are allowed.");
                    }
                    String fileName = fileService.uploadFile(multipartFile, fileType);
                    currentFiles.add(fileName);
                }
            }

            if (currentStage.equals(TicketStage.PO_Screening)) {
                ticket.setPoScreeningFile(currentFiles);
            } else if (currentStage.equals(TicketStage.Po_maker)) {
                ticket.setPoMakerFile(currentFiles);
            }

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed", e);
        }
    }

    @Override
    public void updatePoCopy(String id, Estatus status, List<MultipartFile> poCopy, String remarks,
            Authentication authentication) {

        String userName = ((UserDetailsImpl) authentication.getPrincipal()).getUsername();

        MttpTicket ticket = mttpTicketRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (status.equals(Estatus.Reject) && (remarks == null || remarks.trim().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are required for rejection");
        }
        List<String> poCopyFiles = new ArrayList<>();
        List<AttachmentWrapper> attachmentWrappers = new ArrayList<>();
        if (poCopy != null) {
            for (MultipartFile file : poCopy) {
                try {
                    String fileName = fileService.uploadFile(file, FileType.POCOPY);
                    poCopyFiles.add(fileName);
                    attachmentWrappers.add(new AttachmentWrapper(file.getOriginalFilename(), file.getBytes()));
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload PO Copy file: " + file.getOriginalFilename(), e);
                }
            }
        }
        MttpHistory history = new MttpHistory();
        history.setIsDelete(false);
        history.setName(ticket.getStage());
        history.setUsername(userName);
        history.setRemarks(remarks);
        history.setDate(LocalDateTime.now());

        if (status == Estatus.Approved) {
            history.setStatus(Estatus.Completed);
            ticket.setStatus(Estatus.Completed);
            ticket.setStage(TicketStage.Completed);
        } else if (status == Estatus.Reject) {
            history.setStatus(Estatus.Reject);
            ticket.setStatus(Estatus.Reject);
            ticket.setStage(TicketStage.PO_Screening);
        } else {
            history.setStatus(status);
            ticket.setStatus(status);
        }

        ticket.addHistory(history);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setPoCopy(poCopyFiles);
        historyRepo.save(history);
        mttpTicketRepo.save(ticket);

        List<String> ccMailIds = new ArrayList<>();
        for (User user : ticket.getCarbonCopyMailIds()) {
            ccMailIds.add(user.getEmail());
        }
        ccMailIds.add("ashok.m@cavinkare.com");
        User user = userRepo.findByUsername("Misha H").orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

        if (status == Estatus.Approved) {
            String content = mailTemplateService.MttpMailTemplate(
                    ticket.getReqNo(), user.getUsername(), userName,
                    Estatus.Ticket_Created, "Ticket Created");

            mailServiceAsync.sendMailWithAttachments(content,
                    user.getEmail(), "Marketing Budget Request",
                    attachmentWrappers, ccMailIds);

            sendMttpNotification(ticket, Estatus.Completed, ticket.getStage(), remarks);
        } else if (status == Estatus.Reject) {
            sendMttpNotification(ticket, Estatus.Reject, ticket.getStage(), remarks);
        }
    }

    @Override
    public void updateDeleteStatus(String id, boolean isDeleted, Authentication authentication) {

        String userName = ((UserDetailsImpl) authentication.getPrincipal()).getUsername();

        MttpTicket ticket = mttpTicketRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
        ticket.setDelete(isDeleted);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedBy(userName);
        mttpTicketRepo.save(ticket);
    }

    @Override
    public MttpTicket updateMttpTicket(String id, @Valid MttpTicketDto mttpTicketDto, Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userId = userDetails.getId();
        String userName = userDetails.getUsername();

        MttpTicket ticket = mttpTicketRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

        if (mttpTicketDto.getRoiDescription() == null || mttpTicketDto.getRoiDescription().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ROI Description is required");
        }

        if (mttpTicketDto.getApproverId() != null &&
                !mttpTicketDto.getApproverId().equals(ticket.getBusinessApproverId())) {
            User approver = userRepo.findById(mttpTicketDto.getApproverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            ticket.setBusinessApproverId(mttpTicketDto.getApproverId());
            ticket.setBusinessApprover(approver.getUsername());
        }

        handleTicketFileUpdate(ticket,
                FileType.POFILE,
                mttpTicketDto.getPoFile(),
                mttpTicketDto.getDeletedPoFile(),
                true);

        handleTicketFileUpdate(ticket,
                FileType.MAIL_ATTACHMENT,
                mttpTicketDto.getMailAttachment(),
                mttpTicketDto.getDeletedmailAttachment(),
                false);

        List<MttpHistory> mttpHistory = ticket.getHistoryList();
        MttpHistory lastHistory = mttpHistory.get(mttpHistory.size() - 1);

        if (lastHistory.getName() == TicketStage.PO_Screening &&
                lastHistory.getStatus() == Estatus.Reject) {
            ticket.setStage(TicketStage.PO_Screening);
        } else {
            ticket.setStage(TicketStage.Business_Approver);
        }
        ticket.setRoiDescription(mttpTicketDto.getRoiDescription());
        ticket.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedBy(userId);
        ticket.setStatus(Estatus.Submitted);

        List<User> copyMailIds = new ArrayList<>();
        if (mttpTicketDto.getCarbonCopyMailIds() != null) {
            for (String ids : mttpTicketDto.getCarbonCopyMailIds()) {
                User user = userRepo.findById(ids)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                copyMailIds.add(user);
            }
        }
        ticket.setCarbonCopyMailIds(copyMailIds);

        MttpHistory history = new MttpHistory();
        history.setName(ticket.getStage());
        history.setUsername(userName);
        history.setStatus(Estatus.Submitted);
        history.setDate(LocalDateTime.now());
        history.setRemarks(mttpTicketDto.getRemarks());
        history.setIsDelete(false);

        ticket.addHistory(history);
        historyRepo.save(history);

        mttpTicketRepo.save(ticket);
        User recipient;
        if (ticket.getStage() == TicketStage.PO_Screening) {
            recipient = userRepo.findByRoles(TicketStage.PO_Screening);
            if (recipient == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
        } else if (ticket.getStage() == TicketStage.Business_Approver) {
            if (ticket.getBusinessApproverId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Business approver ID missing");
            }
            recipient = userRepo.findById(ticket.getBusinessApproverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approver not found"));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid stage for notification");
        }

        String emailContent = mailTemplateService.MttpMailTemplate(ticket.getReqNo(), recipient.getUsername(),
                userName, Estatus.Approved,
                "ticket submit by Requestor");
        mailServiceAsync.sendMail(emailContent, recipient.getEmail(), "Marketing Budget Request", null);
        return ticket;
    }

    private void handleTicketFileUpdate(MttpTicket ticket, FileType fileType, List<MultipartFile> newFiles,
            List<String> deletedFiles, boolean isPoFile) {

        List<String> currentFiles = isPoFile
                ? (ticket.getPoFile() != null ? new ArrayList<>(ticket.getPoFile()) : new ArrayList<>())
                : (ticket.getMailAttachment() != null ? new ArrayList<>(ticket.getMailAttachment())
                        : new ArrayList<>());

        if (deletedFiles != null && !deletedFiles.isEmpty()) {
            for (String filePath : deletedFiles) {
                try {
                    fileService.deleteFile(filePath, fileType);
                    currentFiles.remove(filePath);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to delete file: " + filePath, e);
                }
            }
        }

        if (newFiles != null && !newFiles.isEmpty()) {
            for (MultipartFile multipartFile : newFiles) {
                try {
                    String fileName = fileService.uploadFile(multipartFile, fileType);
                    currentFiles.add(fileName);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload file: " + multipartFile.getOriginalFilename(), e);
                }
            }
        }

        if (isPoFile) {
            ticket.setPoFile(currentFiles);
        } else {
            ticket.setMailAttachment(currentFiles);
        }
    }

    @Override
    public void createMttpDraftTicket(@Valid MttpTicketDto mttpTicketDto, Authentication authentication) {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String id = userDetails.getId();
        String userName = userDetails.getUsername();

        // Ensure at least one field is provided
        boolean hasAnyField = (mttpTicketDto.getPoFile() != null && !mttpTicketDto.getPoFile().isEmpty()) ||
                (mttpTicketDto.getMailAttachment() != null && !mttpTicketDto.getMailAttachment().isEmpty()) ||
                (mttpTicketDto.getApproverId() != null && !mttpTicketDto.getApproverId().isBlank());

        if (!hasAnyField) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least one field (PO file, mail attachment, approver, or remarks) is required to save draft");
        }

        List<String> poFiles = new ArrayList<>();
        List<String> mailAttachments = new ArrayList<>();

        // Upload PO files if provided
        if (mttpTicketDto.getPoFile() != null && !mttpTicketDto.getPoFile().isEmpty()) {
            for (MultipartFile file : mttpTicketDto.getPoFile()) {
                try {
                    String fileName = fileService.uploadFile(file, FileType.POFILE);
                    poFiles.add(fileName);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload PO file: " + file.getOriginalFilename(), e);
                }
            }
        }

        // Upload mail attachments if provided
        if (mttpTicketDto.getMailAttachment() != null && !mttpTicketDto.getMailAttachment().isEmpty()) {
            for (MultipartFile file : mttpTicketDto.getMailAttachment()) {
                try {
                    String fileName = fileService.uploadFile(file, FileType.MAIL_ATTACHMENT);
                    mailAttachments.add(fileName);
                } catch (IOException e) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Failed to upload mail attachment: " + file.getOriginalFilename(), e);
                }
            }
        }

        MttpTicket ticket = new MttpTicket();
        String reqNo = generatereqNo();
        ticket.setReqNo(reqNo);
        ticket.setReqName(userName);
        ticket.setCreatedBy(id);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setPoFile(poFiles);
        ticket.setMailAttachment(mailAttachments);
        ticket.setDelete(false);

        List<User> copyMailIds = new ArrayList<>();
        if (mttpTicketDto.getCarbonCopyMailIds() != null) {
            for (String userId : mttpTicketDto.getCarbonCopyMailIds()) {
                User user = userRepo.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                copyMailIds.add(user);
            }
        }
        ticket.setCarbonCopyMailIds(copyMailIds);

        if (mttpTicketDto.getApproverId() != null && !mttpTicketDto.getApproverId().isBlank()) {
            User approver = userRepo.findById(mttpTicketDto.getApproverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approver not found"));
            ticket.setBusinessApproverId(approver.getId());
            ticket.setBusinessApprover(approver.getUsername());
        }

        ticket.setStatus(Estatus.Draft);
        ticket.setStage(TicketStage.Requestor);

        MttpHistory history = new MttpHistory();
        history.setName(TicketStage.Requestor);
        history.setUsername(userName);
        history.setStatus(Estatus.Draft);
        history.setDate(LocalDateTime.now());
        history.setRemarks(mttpTicketDto.getRemarks());
        history.setIsDelete(false);
        ticket.addHistory(history);
        historyRepo.save(history);

        mttpTicketRepo.save(ticket);
    }

    @Override
    public List<MttpTicket> getAllDraftTickets(Authentication authentication) {

        String id = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        return mttpTicketRepo.findAllDraftTickets(id, mongoTemplate);
    }

    @Override
    public List<MttpTicket> getAllCompletedickets(String stage, Authentication authentication) {

        String id = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        List<MttpTicket> tickets = mttpTicketRepo.findAll();
        List<MttpTicket> completedTickets = new ArrayList<>();

        for (MttpTicket ticket : tickets) {

            List<MttpHistory> historyList = ticket.getHistoryList();
            if (historyList == null || historyList.isEmpty()) {
                continue;
            }

            if ("Requestor".equalsIgnoreCase(stage)) {
                if (!id.equals(ticket.getCreatedBy())) {
                    continue;
                }
                if (ticket.getStage() != TicketStage.Requestor || ticket.getStatus() != Estatus.Completed) {
                    continue;
                }
            } else {
                if (stage.equalsIgnoreCase(ticket.getStage().toString())) {
                    continue;
                }
            }

            boolean lastEntryIsApproval = false;

            for (int i = historyList.size() - 1; i >= 0; i--) {
                MttpHistory history = historyList.get(i);
                if (stage.equalsIgnoreCase(history.getName().toString())) {

                    if ("Requestor".equalsIgnoreCase(stage)) {
                        if ("Draft".equalsIgnoreCase(history.getStatus().toString())) {
                            lastEntryIsApproval = false;
                            break;
                        } else {
                            lastEntryIsApproval = true;
                        }
                    } else {
                        lastEntryIsApproval = (("Approved".equalsIgnoreCase(history.getStatus().toString()))
                                || ("Completed".equalsIgnoreCase(history.getStatus().toString())));
                    }
                    break;
                }
            }

            if (!lastEntryIsApproval) {
                continue;
            }

            userRepo.findById(ticket.getCreatedBy()).ifPresent(user -> ticket.setReqName(user.getUsername()));
            completedTickets.add(ticket);
        }

        completedTickets.sort(Comparator
                .<MttpTicket, Boolean>comparing(ticket -> {
                    boolean isRejected = "Reject".equalsIgnoreCase(String.valueOf(ticket.getStatus()))
                            || (ticket.getHistoryList() != null && !ticket.getHistoryList().isEmpty()
                                    && "Reject".equalsIgnoreCase(String.valueOf(ticket.getHistoryList()
                                            .get(ticket.getHistoryList().size() - 1).getStatus())));
                    return !isRejected;
                })
                .thenComparing(Comparator.comparing(MttpTicket::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder()))));

        return completedTickets;
    }

    @Override
    public List<MttpTicket> getRejectedTickets(String stage, Authentication authentication) {
        List<MttpTicket> allTickets = mttpTicketRepo.findAll();

        List<MttpTicket> rejectedTickets = allTickets.stream()
                .filter(ticket -> {
                    MttpHistory recentHistory = getMostRecentHistory(ticket, stage);

                    if (recentHistory == null
                            || !Estatus.Reject.toString().equalsIgnoreCase(recentHistory.getStatus().toString())) {
                        return false;
                    }
                    if (TicketStage.Po_release.toString().equalsIgnoreCase(stage) && isTicketCompleted(ticket)) {
                        return false;
                    }

                    return true;
                })
                .filter(ticket -> !stage.equalsIgnoreCase(ticket.getStage().toString()))
                .collect(Collectors.toList());

        if (rejectedTickets.isEmpty()) {
            return Collections.emptyList();
        } else {
            return rejectedTickets;
        }
    }

    private MttpHistory getMostRecentHistory(MttpTicket ticket, String stage) {
        if (ticket.getHistoryList() == null || ticket.getHistoryList().isEmpty()) {
            return null;
        }
        return ticket.getHistoryList().stream()
                .filter(history -> stage.equalsIgnoreCase(history.getName().toString()))
                .max(Comparator.comparing(MttpHistory::getDate))
                .orElse(null);
    }

    private boolean isTicketCompleted(MttpTicket ticket) {
        return "Completed".equalsIgnoreCase(ticket.getStatus().toString());
    }

    private void sendMttpNotification(MttpTicket ticket, Estatus status, TicketStage currentStage, String remarks) {

        User user;
        if (status == Estatus.Hold || status == Estatus.Completed || ticket.getStage().equals(TicketStage.Requestor)) {
            user = userRepo.findById(ticket.getCreatedBy())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket creator not found"));
        } else if (ticket.getStage() == TicketStage.Po_release) {
            if (ticket.getPoApproverId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PO Approver ID not found");
            }
            user = userRepo.findById(ticket.getPoApproverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PO Approver not found"));
        } else {
            user = userRepo.findByRoles(ticket.getStage());
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "User not found for role: " + ticket.getStage());
            }
        }
        String emailContent = mailTemplateService.MttpMailTemplate(ticket.getReqNo(), user.getUsername(),
                currentStage.toString(), status, remarks);

        mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request",
                null);
    }

    @Override
    public List<MttpTicket> fetchCompletedTickets(Authentication authentication) {

        String id = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return mttpTicketRepo.findAllCompletedTickets(id, mongoTemplate);
    }

}
