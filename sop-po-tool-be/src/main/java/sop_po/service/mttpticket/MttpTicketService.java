package sop_po.service.mttpticket;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import sop_po.model.mttp.MttpTicket;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;
import sop_po.request.mttpticket.MttpTicketDto;

public interface MttpTicketService {

        MttpTicket createMttpTicket(@Valid MttpTicketDto mttpTicketDto, Authentication authentication);

        List<MttpTicket> getByStage(TicketStage stage, Estatus status, Authentication authentication);

        MttpTicket getApproverTickets(String id, Estatus status, String docNumber, List<String> poNumber, String remarks,
                        Boolean isRelated,
                        String poApproverId, List<MultipartFile> file, List<String> deletedFile,
                        Authentication authentication);

        void updatePoCopy(String id, Estatus status, List<MultipartFile> poCopy, String remarks,
                        Authentication authentication);

        void updateDeleteStatus(String id, boolean isDeleted, Authentication authentication);

        MttpTicket updateMttpTicket(String id, @Valid MttpTicketDto mttpTicketDto, Authentication authentication);

        void createMttpDraftTicket(@Valid MttpTicketDto mttpTicketDto, Authentication authentication);

        List<MttpTicket> getAllDraftTickets(Authentication authentication);

        List<MttpTicket> getAllCompletedickets(String stage, Authentication authentication);

        List<MttpTicket> getRejectedTickets(String stage, Authentication authentication);

        List<MttpTicket> fetchCompletedTickets(Authentication authentication);

}
