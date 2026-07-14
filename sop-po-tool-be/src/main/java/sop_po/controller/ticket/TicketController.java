package sop_po.controller.ticket;

import java.io.IOException;
import java.util.List;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.entity.FileType;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;
import sop_po.request.ChunkResponseDto;
import sop_po.request.CreateTicket;
import sop_po.request.MergeRequestDto;
import sop_po.service.ClientKeyService;
import sop_po.service.ClosedEmailService;
import sop_po.service.FileService;
import sop_po.service.TicketService;

@CrossOrigin
@RestController
@RequestMapping("/api/ticket")
@SecurityRequirement(name = "Bearer Authentication")
public class TicketController {

	@Autowired
	private TicketService ticketService;

	@Autowired
	private ClosedEmailService emailService;

	@Autowired
	private FileService fileService;

	@Autowired
	private ClientKeyService clientKeyService;

	@PostMapping(value = "/create-ticket", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
	public ResponseEntity<?> createTicket(CreateTicket newTicket,
			@RequestParam(value = "attachment", required = false) List<MultipartFile> attachment,
			@RequestParam(value = "type", required = false) String type,
			@RequestParam(value = "status") Estatus status, Authentication authentication) {
		return ticketService.createTicket(newTicket, attachment, status, authentication, type);
	}

	@PostMapping(value = "/create-ticket-draft", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
	public ResponseEntity<?> createTicketDraft(CreateTicket newTicket,
			@RequestParam(value = "attachment", required = false) List<MultipartFile> attachment,
			@RequestParam(value = "type", required = false) String type,
			@RequestParam(value = "status") Estatus status, Authentication authentication) {
		return ticketService.createTicketDraft(newTicket, attachment, status, type, authentication);
	}

	@GetMapping("/getTicketById/{id}")
	public ResponseEntity<?> getTicketById(@PathVariable String id) {
		return ticketService.getTicketById(id);
	}

	@GetMapping("/get-tickets")
	public ResponseEntity<?> getAllTickets() {
		return ticketService.getAllTickets();

	}

	@GetMapping("/getAllComplticketsByStage/{stage}")
	public ResponseEntity<List<Request_table>> getAllCompletedTicketsByStage(@PathVariable String stage,
			@RequestParam String ticketType, @RequestParam(required = false, defaultValue = "asc") String sortDirection,
			Authentication authentication) {
		return ticketService.getAllCompletedTicketsByStage(stage, ticketType, sortDirection, authentication);
	}

	@GetMapping("/get-draft")
	public ResponseEntity<?> getAllDraftTickets(@RequestParam String ticketType,
			@RequestParam(required = false, defaultValue = "asc") String sortDirection, Authentication authentication) {
		return ticketService.getAllDraftTickets(ticketType, sortDirection, authentication);
	}

	@PostMapping("ticket-approve")
	public ResponseEntity<?> approveTicket(@RequestParam String ticketId, @RequestParam Estatus approvalStatus,
			@RequestParam(required = false) String remarks,
			@RequestParam(required = false) String stage, Authentication authentication) {
		return ticketService.approveTicket(ticketId, approvalStatus, remarks, stage, authentication);
	}

	@GetMapping("/get_notifications/{role}")
	public ResponseEntity<?> getnotification(@PathVariable String role, @RequestParam String ticketType) {
		System.out.println(role);
		return ticketService.getNotification(role, ticketType);
	}

	@GetMapping("/get_notificationsById/{id}")
	public ResponseEntity<?> getnotificationByUserId(@PathVariable String id, @RequestParam String ticketType) {
		System.out.println(id);
		return ticketService.getnotificationByUserId(id, ticketType);
	}

	@PutMapping("/update_notification/{id}")
	public ResponseEntity<?> updateNotification(@PathVariable String id) {
		return ticketService.updatestatus(id);
	}

	@DeleteMapping("/deleteall_notificationsByuserId/{userId}")
	public ResponseEntity<?> deleteNotificationByUserId(@PathVariable String userId) {
		System.out.println(userId);
		return ticketService.deletenotificationByUserId(userId);
	}

	@DeleteMapping("/delete_notification/{id}")
	public ResponseEntity<?> deleteNotification(@PathVariable String id) {
		System.out.println(id);
		return ticketService.deletenotification(id);
	}

	@DeleteMapping("/deleteall_notificationsByrole/{role}")
	public ResponseEntity<?> deleteNotificationByRole(@PathVariable String role) {
		System.out.println(role);
		return ticketService.deletenotificationByRole(role);
	}

	@GetMapping("/get-all-req-ticket")
	public ResponseEntity<?> getAllByRequestorStage() {
		return ticketService.getAllByRequestorStage();
	}

	@GetMapping("/get-all-ba-approve-ticket/{id}")
	public ResponseEntity<?> getAllByBaApproverStage(@PathVariable String id, @RequestParam String ticketType) {
		return ticketService.getAllByBaApproverStage(id, ticketType);
	}

	@GetMapping("/get-all-po-screening-ticket")
	public ResponseEntity<?> getAllByPoScreeningStage(@RequestParam String ticketType) {
		return ticketService.getAllByPoScreeningStage(ticketType);
	}

	@GetMapping("/get-all-budget-team-ticket")
	public ResponseEntity<?> getAllByBudgetteamStage(@RequestParam String ticketType) {
		return ticketService.getAllByBudgetteamStage(ticketType);
	}

	@PostMapping("/approveByBT")
	public ResponseEntity<?> approveTicketByBudgetTeam(
			@RequestParam String ticketId,
			@RequestParam Estatus approvalStatus,
			@RequestParam(required = false) String docNum,
			@RequestParam(required = false) String remarks,
			Authentication authentication) {
		return ticketService.approveTicketByBudgetTeam(ticketId, approvalStatus, docNum, remarks, authentication);
	}

	@PostMapping("/approveByDH")
	public ResponseEntity<?> approveTicketByDivisionHead(@RequestParam String ticketId,
			@RequestParam Estatus approvalStatus,
			@RequestParam(required = false) String remarks, Authentication authentication) {
		return ticketService.approveTicketByDivisionHead(ticketId, approvalStatus, remarks, authentication);
	}

	@GetMapping("/get-all-DH-ticket")
	public ResponseEntity<?> getAllByDHStage() {
		return ticketService.getAllByDHStage();
	}

	@GetMapping("/get-all-BRT-ticket")
	public ResponseEntity<?> getAllByBRTStage() {
		return ticketService.getAllByBRTStage();
	}

	@PostMapping("/approveByBRT")
	public ResponseEntity<?> approveTicketByBRT(@RequestParam String ticketId,
			@RequestParam Estatus approvalStatus,
			@RequestParam(required = false) String docnum,
			@RequestParam(required = false) String remarks, Authentication authentication) {
		return ticketService.approveTicketByBRT(ticketId, approvalStatus, docnum, remarks, authentication);
	}

	@GetMapping("/get-AllSubBrand-TicketById/{id}")
	public ResponseEntity<?> getAllSubBrandByTicketID(@PathVariable String id) {
		return ticketService.getAllSubBrandByTicketID(id);
	}

	@PostMapping(value = "/approveByPOM", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
	public ResponseEntity<?> approveTicketByPOM(@RequestParam String ticketId,
			@RequestParam Estatus approvalStatus,
			@RequestParam(required = false) String budgetDetails,
			@RequestParam(required = false) String userId,
			@RequestParam(required = false) List<String> ponumber,
			@RequestParam(required = false) Boolean isRelated,
			@RequestParam(required = false) String remarks,
			@RequestParam(required = false) String stage,
			@RequestParam(required = false) List<MultipartFile> budgetFile,
			@RequestParam(required = false) List<MultipartFile> poApproverFile,
			@RequestParam(required = false) List<String> deletedPoApproverFiles,
			@RequestParam(required = false) List<String> deletedBudgetFiles,
			Authentication authentication) {
		return ticketService.approveTicketByPOM(ticketId, approvalStatus, budgetDetails, userId, ponumber, isRelated,
				remarks, stage, budgetFile, poApproverFile, deletedPoApproverFiles, deletedBudgetFiles, authentication);
	}

	@PutMapping("/updateAttachPoCopyNo")
	public ResponseEntity<?> updateAttachPoCopyNo(
			@RequestParam String ticketId,
			@RequestParam(required = false) MultipartFile[] attchPoCopyNo,
			@RequestParam Estatus approvalStatus, @RequestParam(required = false) String remarks,
			Authentication authentication) {

		return ticketService.updateAttachPoCopyNo(ticketId, attchPoCopyNo, approvalStatus, remarks, authentication);
	}

	@GetMapping("/getTicketHistory")
	public ResponseEntity<?> getTicketHistory(@RequestParam String stagename) {

		return ticketService.getTicketHistory(stagename);
	}

	@SuppressWarnings("unchecked")
	@GetMapping("/getAllByCommonStage/{stageName}")
	public ResponseEntity<List<Request_table>> getAllByCommonStage(@PathVariable String stageName,
			@RequestParam String ticketType,
			@RequestParam(required = false) String search,
			@RequestParam(required = false) String status,
			@RequestParam(required = false, defaultValue = "asc") String sortDirection, Authentication authentication) {
		return (ResponseEntity<List<Request_table>>) ticketService.getAllByCommonStage(stageName, ticketType, search,
				status,
				sortDirection, authentication);
	}

	@PostMapping("/sendMail")
	public String sendMail(@RequestParam String recipient) {
		String status = emailService.sendSimpleMail(recipient);
		return status;
	}

	@PutMapping(value = "/update-ticket", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
	public ResponseEntity<?> updateTicketData(
			@ModelAttribute CreateTicket newTicket,
			@RequestParam(value = "attachment", required = false) List<MultipartFile> attachment,
			@RequestParam(required = false) List<String> attachmentsPath,
			@RequestParam String ticketId, Authentication authentication) {

		return ticketService.updateTicketData(newTicket, attachment, attachmentsPath, ticketId, authentication);
	}

	@GetMapping("/getPoApproverTicket/{userId}")
	public ResponseEntity<?> getPoApproverTicket(@PathVariable String userId) {
		return ticketService.getPoApproverTicket(userId);
	}

	@DeleteMapping("/delete-attachments/{ticketId}")
	public ResponseEntity<?> deleteAttachments(@PathVariable String ticketId, @RequestParam String attachmentNames) {
		return ticketService.deleteAttachments(ticketId, attachmentNames);
	}

	@PostMapping("/bulk-upload")
	public ResponseEntity<?> handleBulkUpload(@RequestParam("file") MultipartFile file) {
		return ticketService.processBulkUpload(file);
	}

	@GetMapping("/getBusinessApprover")
	public ResponseEntity<?> getBusinessApprover() {
		return ticketService.getBusinessApprover();

	}

	@GetMapping("/file-download/{filename}")
	public ResponseEntity<byte[]> serveFile(@PathVariable("filename") String filename) throws IOException {

		Resource file = null;
		file = fileService.loadAsResource(filename, FileType.ATTACHMENTS);
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.POCOPY);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.POFILE);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.PO_SCREENING_FILE);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.PO_MAKER_FILE);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.MAIL_ATTACHMENT);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.BUDGET_FILE);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.PREAPPROVED_FILE);
		}
		if (file == null) {
			file = fileService.loadAsResource(filename, FileType.POAPPROVER_FILE);
		}
		if (file == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
		}

		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
				.body(file.getContentAsByteArray());
	}

	@GetMapping("/ticket-search")
	public ResponseEntity<List<Request_table>> ticketSearch(@RequestParam(required = false) String search) {
		return ticketService.ticketSearch(search);
	}

	@GetMapping(value = "/export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
	public ResponseEntity<Resource> export(@RequestParam(required = false) LocalDate startDate,
			@RequestParam(required = false) LocalDate endDate,
			@RequestParam(required = true) String ticketType,
			@RequestParam(required = true) String activeTab,
			Authentication authentication) throws IOException {
		Resource file = ticketService.export(startDate, endDate, ticketType, activeTab, authentication);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tickets.xlsx\"")
				.body(file);
	}

	@GetMapping(value = "/brand-po-data")
	public ResponseEntity<?> brandPoData(@RequestParam LocalDate startDate,
			@RequestParam LocalDate endDate,
			@RequestHeader(value = "Authorization", required = false) String authorization) {
		return ResponseEntity.ok(ticketService.brandPoData(startDate, endDate, authorization));
	}

	@GetMapping(value = "/foh-export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
	public ResponseEntity<Resource> fohExport(@RequestParam(required = false) LocalDate startDate,
			@RequestParam(required = false) LocalDate endDate, @RequestParam(required = false) String ticketType,
			@RequestParam(required = false) String activeTab) throws IOException {
		Resource file = ticketService.fohExport(startDate, endDate, ticketType, activeTab);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"tickets-new-format.xlsx\"")
				.body(file);
	}

	@GetMapping(value = "/brand-po-export", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
	public ResponseEntity<Resource> brandPoExport(@RequestParam LocalDate startDate,
			@RequestParam LocalDate endDate,
			@RequestHeader(value = "Authorization", required = false) String authorization) throws IOException {
		Resource file = ticketService.brandPoExport(startDate, endDate, authorization);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"brand-po-export.xlsx\"")
				.body(file);
	}

	@PutMapping("/hold")
	public ResponseEntity<?> holdTicket(@RequestParam String ticketId, @RequestParam Estatus status,
			@RequestParam(required = false) String remarks, Authentication authentication) throws Exception {
		return ticketService.holdTicket(ticketId, status, remarks, authentication);
	}

	@GetMapping("/hold-ticket")
	public ResponseEntity<?> getholdTicket(@RequestParam String stage, @RequestParam String ticketType)
			throws Exception {
		return ticketService.getholdTicket(stage, ticketType);
	}

	@GetMapping("/buisnessApproverTickets")
	public ResponseEntity<?> getBuisnessApproverTickets(Authentication authentication) {
		return ticketService.getBuisnessApproverTickets(authentication);
	}

	@GetMapping("/rejected-tickets")
	public ResponseEntity<?> fetchRejectedTickets(@RequestParam String stage, @RequestParam String ticketType) {
		return ticketService.fetchRejectedTickets(stage, ticketType);
	}

	@GetMapping("/all-po-ticket")
	public ResponseEntity<?> getAllPoTickets(@RequestParam(required = false) String role,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String search,
			Authentication authentication) {
		return ticketService.getAllPoTickets(role, page, size, search, authentication);
	}

	@PostMapping("/upload-chunk")
	public ResponseEntity<ChunkResponseDto> uploadChunk(
			@RequestParam("chunk") MultipartFile chunk,
			@RequestParam("chunkIndex") int chunkIndex,
			@RequestParam("fileName") String fileName,
			@RequestParam("totalChunks") int totalChunks) throws IOException {
		boolean isLastChunk = chunkIndex == totalChunks - 1;
		String chunkId = fileService.saveChunk(chunk, chunkIndex, fileName);
		return ResponseEntity.ok(new ChunkResponseDto(chunkId, chunkIndex, isLastChunk));
	}

	@PostMapping("/merge-chunks")
	public ResponseEntity<String> mergeChunks(@RequestBody MergeRequestDto mergeRequest) {
		String filePath = fileService.mergeChunks(
				mergeRequest.getFileName(),
				mergeRequest.getTotalChunks(), mergeRequest.getDistinationFileLocation());
		return ResponseEntity.ok(filePath);
	}

	@GetMapping("/upload-page")
	public String getUploadPage() {
		return "upload";
	}

	@GetMapping("/vendors")
	public ResponseEntity<?> getAllVendors(@RequestParam String ticketType, Authentication authentication) {
		return ticketService.getAllVendors(ticketType, authentication);
	}

	@GetMapping("/divisions")
	public ResponseEntity<?> getAllDivisions(@RequestParam String ticketType, Authentication authentication) {
		return ticketService.getAllDivisions(ticketType, authentication);
	}

	@GetMapping("/ebrief")
	private ResponseEntity<?> getEbriefTicketData(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) LocalDate startDate,
			@RequestParam(required = false) LocalDate endDate,
			@RequestHeader("Client-Key") String clientKey) {
		if (!clientKeyService.validateClientKeyForEndpoint(clientKey, "/api/ticket/ebrief")) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid client key or unauthorized endpoint");
		}
		return ticketService.getEbriefTicketData(page, size, startDate, endDate);
	}

	@DeleteMapping("/delete-ticket/{ticketId}")
	public ResponseEntity<?> deleteTicket(@PathVariable String ticketId, @RequestParam String status,
			Authentication authentication) {
		return ticketService.deleteTicket(ticketId, status, authentication);
	}

	@GetMapping("/deleted-tickets")
	public ResponseEntity<?> getDeletedTickets(Authentication authentication) {
		return ticketService.getDeletedTickets(authentication);
	}

	@GetMapping(value = "/export-completed", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
	public ResponseEntity<Resource> exportCompletedTickets(
			@RequestParam(required = false) LocalDate startDate,
			@RequestParam(required = false) LocalDate endDate) throws IOException {
		Resource file = ticketService.exportCompletedTickets(startDate, endDate);
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"completed-tickets.xlsx\"")
				.body(file);
	}

	@GetMapping("/po-checker-approved-tickets")
	public ResponseEntity<?> getPoCheckerApprovedTickets(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam String type,
			@RequestParam(required = false) String search,
			Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated())
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		return ticketService.getPoCheckerApprovedTickets(page, size, type, search);
	}

}
