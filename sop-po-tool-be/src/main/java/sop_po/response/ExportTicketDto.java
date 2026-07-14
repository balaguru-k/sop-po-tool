package sop_po.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExportTicketDto {
    private String ticketNo;
    private String status;
    private String receivedTimeline;
    private String poInitiator;
    private String poApprover;
    private String profitCentre;
    private String channel;
    private String internalOrder;
    private String fundCentre;
    private String amount;
    private String currency;
    private String totalValue;
    private String narrationActivityPurpose;
    private String glAccount;
    private String glDescription;
    private String brand;
    private String subCategory;
    private String period;
    private String budgetReleasedDocumentNo;
    private String poCreatedNumber;
    private String createdDate;
    private String deliveryDate;
    private String activityStartAndEnd;
    private String vendor;
    private String vendorName;
}