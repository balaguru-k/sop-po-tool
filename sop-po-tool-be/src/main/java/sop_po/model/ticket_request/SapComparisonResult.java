package sop_po.model.ticket_request;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "Request_table")
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SapComparisonResult {
    private String fundCenter;
    private String commitmentItem;
    private String fiscalYear;
    private String period;
    private double ticketTotalValue;
    private double sapBalance;
    private boolean matches;
    private String error;
    // Getters and Setters
}
