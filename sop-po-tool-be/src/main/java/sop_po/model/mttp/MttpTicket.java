package sop_po.model.mttp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;

@Document(collection = "mttp_ticket")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MttpTicket {

    private String id;
    private String reqNo;
    private String reqName;
    private List<String> poFile;
    private List<String> mailAttachment;
    private String businessApproverId;
    private String businessApprover;
    private List<User> carbonCopyMailIds;
    private String roiDescription;
    private List<String> poScreeningFile;
    private String docNum;
    private List<String> poNumber;
    private List<String> poMakerFile;
    private List<String> poCopy;
    private Estatus status;
    private TicketStage stage;
    @DBRef		
	private List<MttpHistory> historyList;
    private String poApprover;
	private String poApproverId;
    private Boolean isRelated;
    private boolean isDelete;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public List<MttpHistory> getHistoryList() {
		        return historyList;
		    }

		    public void addHistory(MttpHistory history) {
		        if (historyList == null) {
		            historyList = new ArrayList<>();
		        }
		        historyList.add(history);
		    }

}
