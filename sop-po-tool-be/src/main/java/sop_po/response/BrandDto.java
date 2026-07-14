package sop_po.response;

import java.util.Date;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sop_po.model.EBrief;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BrandDto {
    private String brandOrNonBrand;
    private String materialCode;
    private String deliveryPlant;
    private String detailsBrand;
    private String division;
    private String channel;
    private String region;
    private long value;
    private String commitmentItem;
    private String natureOfExpenses;
    private String poDescription;
    private Date activityStartDate;
    private Date activityEndDate;
    private String ckplLocation;
    private String gstType;
    private String glCode;
    private String fundCenter;
    private String InternalOrder;
    private List<String> district;
    private String brandSubCategory;
    private EBrief eBrief;

}