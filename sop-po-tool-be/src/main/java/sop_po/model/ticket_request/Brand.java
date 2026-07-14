package sop_po.model.ticket_request;


import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.format.annotation.DateTimeFormat;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sop_po.model.EBrief;
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection ="Brand_table" )
public class Brand {
	@Id
	private String brandid;
    private String brandOrNonBrand;
    private String materialCode;
    private String deliveryPlant;
    private String department;
    private String division;
    private String channel;
    private String region;
    private String location;
    private long value;
    private String materialGroup;
    private String commitmentItem;
    private String natureOfExpenses;
    private String poDescription;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date activityStartDate;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private Date activityEndDate;
    private String ckplLocation;
    private String gstType;
    private int year;
    private String month;
    private String ioOrCostCentrePo;
    private String ioOrCostCentreNumber;
    private String fundCentre;
    private String glCode;
    private String glDescription; 
    private Boolean isDelete;
    private String DetailsBrand; 
    private String Internalorder;
    private String costcenter;
    private Boolean matches;
    private List<String> district;
    private String brandSubCategory;
    private EBrief eBrief;
    private Boolean materialPo;
    private String sacHsnCode;
	
}
