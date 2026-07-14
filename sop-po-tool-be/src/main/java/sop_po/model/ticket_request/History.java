package sop_po.model.ticket_request;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Document("History_table")
public class History {
	@Id
	private String id;
	private TicketStage name;
	private String username;
	private Estatus status;
	private String remarks;
	private Boolean isDelete;
	private LocalDateTime date;

}
