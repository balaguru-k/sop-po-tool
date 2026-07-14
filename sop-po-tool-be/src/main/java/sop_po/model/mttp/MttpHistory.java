package sop_po.model.mttp;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;

@Document(collection = "mttp_History")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MttpHistory {

    @Id
	private String id;
	private TicketStage name;
	private String username;
	private Estatus status;
	private String remarks;
	private Boolean isDelete;
	private LocalDateTime date;
}
