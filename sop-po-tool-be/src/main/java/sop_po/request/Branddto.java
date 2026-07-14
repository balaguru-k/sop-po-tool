package sop_po.request;

import java.util.Date;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Branddto {
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
	private String ioOrCostCentrePo; // Consistent with entity field name
	private String ioOrCostCentreNumber; // Consistent with entity field name
	private String fundCentre; // Consistent with entity field name
	private String glCode; // Consistent with entity field name
	private String glDescription; // Consistent with entity field name
	private Boolean isDelete;
	private String detailsBrand;
	private String Internalorder;
	private String costcenter;
	private List<String> district;
	private String brandSubCategory;
	private long ebriefId;
	private Boolean materialPo;
	private String sacHsnCode;
	
}
