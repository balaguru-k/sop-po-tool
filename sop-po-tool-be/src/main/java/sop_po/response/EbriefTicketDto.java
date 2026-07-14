package sop_po.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import sop_po.model.ticket_request.Epo;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EbriefTicketDto {
    private String reqNo;
    private String username;
    private String vendorName;
    private String vendorLocation;
    private String vendorCode;
    private String gstNo;
    private String currency;
    private String paymentTerm;
    private Epo poType;
    private List<String> poNumber;
    private String approverUsername;
    private String docNum;
    private List<BrandDto> brand;
}