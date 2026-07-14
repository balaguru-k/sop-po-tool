package sop_po.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;
import sop_po.request.CreateTicket;

@Service
public interface TicketService {
//	public ResponseEntity<?> createTicket(CreateTicket newTicket, MultipartFile attachment, MultipartFile poCopyAttachment,Estatus status) ;

	public ResponseEntity<List<Request_table>> getAllTickets();

	public ResponseEntity<List<Request_table>> getAllCompletedTicketsByStage(String stage, String ticketType, String sortDirection2, Authentication authentication);

	public ResponseEntity<List<Request_table>> getAllDraftTickets(String ticketType, String sortDirection2, Authentication authentication);

	public ResponseEntity<?> approveTicket(String ticketId, Estatus approvalStatus, String remarks, String stage, Authentication authentication);

	public ResponseEntity<?> getAllByRequestorStage();

	public ResponseEntity<?> getAllByBaApproverStage(String id, String ticketType);

	public ResponseEntity<?> getAllByPoScreeningStage(String ticketType);

	public ResponseEntity<?> getAllByBudgetteamStage(String ticketType);

	public ResponseEntity<?> getAllByDHStage();

	public ResponseEntity<?> getAllByBRTStage();

	public ResponseEntity<?> approveTicketByBudgetTeam(String ticketId, Estatus approvalStatus, String docNum,
			String remarks, Authentication authentication);

	public ResponseEntity<?> getTicketById(String id);

	public ResponseEntity<?> approveTicketByDivisionHead(String ticketId, Estatus approvalStatus, String remarks, Authentication authentication);

	public ResponseEntity<?> approveTicketByBRT(String ticketId, Estatus approvalStatus, String docnum,String remarks, Authentication authentication);

	public ResponseEntity<?> getAllSubBrandByTicketID(String id);

	public ResponseEntity<?> approveTicketByPOM(String ticketId, Estatus approvalStatus, String budgetDetails, String userId, List<String> ponumber,
			Boolean isRelated, String remarks, String stage, List<MultipartFile> budgetFile, 
			List<MultipartFile> poApproverFile, List<String> deletedPoApproverFiles,
			List<String> deletedBudgetFiles, Authentication authentication);

	public ResponseEntity<?> updateAttachPoCopyNo(String ticketId, MultipartFile[] attchPoCopyNo, Estatus approvalStatus, String remarks, Authentication authentication);

	public ResponseEntity<?> getTicketHistory(String stagename);

	public ResponseEntity<?> getAllByCommonStage(String stageName, String ticketType, String search, String status, String sortDirection, Authentication authentication);

	public ResponseEntity<?> createTicket(CreateTicket newTicket, List<MultipartFile> attachment, Estatus status, Authentication authentication, String type);

	public ResponseEntity<?> createTicketDraft(CreateTicket newTicket, List<MultipartFile> attachment, Estatus status, String type, Authentication authentication);

	public ResponseEntity<?> updateTicketData(CreateTicket newTicket, List<MultipartFile> attachment, List<String> attachmentsPath, String ticketId, Authentication authentication);

	public ResponseEntity<?> getPoApproverTicket(String userId);

	public ResponseEntity<?> deleteAttachments(String ticketId, String attachmentNames);

	public ResponseEntity<?> processBulkUpload(MultipartFile file);

	public ResponseEntity<?> getBusinessApprover();

	public Resource loadAsResource(String filename) throws MalformedURLException;

    public ResponseEntity<?> getNotification(String role, String ticketType);

    public ResponseEntity<?> getnotificationByUserId(String id, String ticketType);

	public ResponseEntity<?> updatestatus(String id);

    public ResponseEntity<?> deletenotificationByUserId(String id);

	public ResponseEntity<?> deletenotification(String id);

	public ResponseEntity<?> deletenotificationByRole(String id);

	public ResponseEntity<List<Request_table>> ticketSearch(String search);

	public Resource export(LocalDate startDate, LocalDate endDate, String ticketType, String activeTab, Authentication authentication) throws IOException;

	public Resource fohExport(LocalDate startDate, LocalDate endDate, String ticketType, String activeTab) throws IOException;

    public ResponseEntity<?> holdTicket(String ticketId, Estatus status, String remarks, Authentication authentication) throws Exception;

    public ResponseEntity<?> getholdTicket(String stage, String ticketType);
	
    public ResponseEntity<?> getBuisnessApproverTickets(Authentication authentication);

    public ResponseEntity<?> fetchRejectedTickets(String stage, String ticketType);

    public ResponseEntity<?> getAllPoTickets(String role, int page, int size, String search, Authentication authentication);

    public ResponseEntity<?> getAllVendors(String ticketType, Authentication authentication);

    public ResponseEntity<?> getAllDivisions(String ticketType, Authentication authentication);

    public ResponseEntity<?> getEbriefTicketData(int page, int size, LocalDate startDate, LocalDate endDate);

    public ResponseEntity<?> deleteTicket(String ticketId, String status, Authentication authentication);

    public ResponseEntity<?> getDeletedTickets(Authentication authentication);

    public Resource exportCompletedTickets(LocalDate startDate, LocalDate endDate) throws IOException;

    public ResponseEntity<?> getPoCheckerApprovedTickets(int page, int size, String type, String search);

	public Resource brandPoExport(LocalDate startDate, LocalDate endDate, String authorization) throws IOException;

    public List<Map<String, String>> brandPoData(LocalDate startDate, LocalDate endDate, String authorization);

}
