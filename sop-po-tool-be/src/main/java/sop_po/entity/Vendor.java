package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sop_sap_vendors")
public class Vendor {
    @Id
    private String id;
    private String vendorCode;
    private String vendorName;
    private String location;
    private String region;
    private String gstNo;
    private String plant;
    private String paymentTerm;
    private String currency;
    private String phoneNo;
    private String mailId;
    private String corpAddr;
    private String vendorAddr;
    private String msme;
    private String country;
	private String accountNumber;
    private String status;
  
}
