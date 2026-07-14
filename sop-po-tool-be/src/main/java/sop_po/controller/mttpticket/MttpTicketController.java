package sop_po.controller.mttpticket;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import sop_po.model.mttp.MttpTicket;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;
import sop_po.request.mttpticket.MttpTicketDto;
import sop_po.response.GenericResponse;
import sop_po.service.mttpticket.MttpTicketService;

@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/mttp-ticket")
public class MttpTicketController {

    private final MttpTicketService mttpTicketService;

    public MttpTicketController(MttpTicketService mttpTicketService) {
        this.mttpTicketService = mttpTicketService;
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public GenericResponse<MttpTicket> createMttpTicket(@Valid @ModelAttribute MttpTicketDto mttpTicketDto,
            Authentication authentication) {

        MttpTicket ticket = mttpTicketService.createMttpTicket(mttpTicketDto, authentication);
        return GenericResponse.success("Mttp Ticket Created Successfully", ticket);

    }

    @GetMapping("/by-stage")
    public GenericResponse<List<MttpTicket>> getByStage(@RequestParam TicketStage stage,
            @RequestParam(required = false) Estatus status, Authentication authentication) {

        return GenericResponse.success(mttpTicketService.getByStage(stage, status, authentication));

    }

    @PostMapping(value = "/approver-ticket/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public GenericResponse<MttpTicket> getApproverTickets(@PathVariable String id, @RequestParam Estatus status,
            @RequestParam(required = false) String docNumber,
            @RequestParam(required = false) List<String> poNumber,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) Boolean isRelated,
            @RequestParam(required = false) String poApproverId,
            @RequestParam(required = false) List<MultipartFile> file,
            @RequestParam(required = false) List<String> deletedFile,
            Authentication authentication) {

        MttpTicket ticket = mttpTicketService.getApproverTickets(id, status, docNumber, poNumber, remarks,
                isRelated, poApproverId, file, deletedFile, authentication);
        if (Estatus.Approved.equals(status)) {
            return GenericResponse.success("Ticket Approved Successfully", ticket);
        } else if (Estatus.Reject.equals(status)) {
            return GenericResponse.success("Ticket Rejected Successfully", ticket);
        }
        else if (Estatus.Hold.equals(status)) {
            return GenericResponse.success("Ticket Hold Successfully", ticket);
        }
        else if (Estatus.Retrieve.equals(status)) {
            return GenericResponse.success("Ticket Retrieved Successfully", ticket);
        }
        return GenericResponse.failure("Invalid status provided");
    }

    @PostMapping(value = "/update-po-copy/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GenericResponse<String> updatePoCopy(@PathVariable String id, @RequestParam Estatus status,
            @RequestParam(required = false) List<MultipartFile> poCopy,
            @RequestParam(required = false) String remarks,
            Authentication authentication) {

        mttpTicketService.updatePoCopy(id, status, poCopy, remarks, authentication);
        if (Estatus.Approved.equals(status)) {
            return GenericResponse.success("PO Copy Updated Successfully");
        } else if (Estatus.Reject.equals(status)) {
            return GenericResponse.success("Ticket Rejected Successfully");
        }
        return GenericResponse.success("Ticket Approved Successfully");
    }

    @PutMapping("/update-delete-status/{id}")
    public GenericResponse<String> updateDeleteStatus(@PathVariable String id, boolean isDeleted,
            Authentication authentication) {

        mttpTicketService.updateDeleteStatus(id, isDeleted, authentication);
        return GenericResponse.success("Ticket Deleted Successfully");
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public GenericResponse<MttpTicket> updateMttpTicket(@PathVariable String id,
            @Valid @ModelAttribute MttpTicketDto mttpTicketDto,
            Authentication authentication) {

        MttpTicket ticket = mttpTicketService.updateMttpTicket(id, mttpTicketDto, authentication);
        return GenericResponse.success("Mttp Ticket Updated Successfully", ticket);
    }

    @PostMapping(value = "/draft", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public GenericResponse<String> createMttpDraftTicket(@Valid @ModelAttribute MttpTicketDto mttpTicketDto,
            Authentication authentication) {

        mttpTicketService.createMttpDraftTicket(mttpTicketDto, authentication);
        return GenericResponse.success("Mttp Draft Ticket Created Successfully");

    }

    @GetMapping("/all-draft")
    public GenericResponse<List<MttpTicket>> getAllDraftTickets(Authentication authentication) {

        return GenericResponse.success(mttpTicketService.getAllDraftTickets(authentication));

    }

    @GetMapping("/get-all-completed-ticket")
    public GenericResponse<List<MttpTicket>> getAllCompletedickets(String stage, Authentication authentication) {

        return GenericResponse.success(mttpTicketService.getAllCompletedickets(stage, authentication));

    }

    @GetMapping("/rejected-tickets")
    public GenericResponse<List<MttpTicket>> getRejectedTickets(String stage, Authentication authentication) {

        return GenericResponse.success(mttpTicketService.getRejectedTickets(stage, authentication));
    }

    @GetMapping("/completed")
    public GenericResponse<List<MttpTicket>> fetchCompletedTickets(Authentication authentication) {

        return GenericResponse.success(mttpTicketService.fetchCompletedTickets(authentication));

    }

}
