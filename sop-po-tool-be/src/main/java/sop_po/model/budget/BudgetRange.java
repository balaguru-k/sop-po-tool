package sop_po.model.budget;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sop_po.model.ticket_request.TicketStage;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "budget_master")
public class BudgetRange {
    @Id
    private String id;  
    private Long min;
    private Long max;
    private List<String> userIds;
    @Schema(accessMode = Schema.AccessMode.READ_ONLY)
    private TicketStage role;
}
