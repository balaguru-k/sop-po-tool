package sop_po.model.ticket_request;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sop_po.model.user.User;

@Document(collection = "Request_table")
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Request_table {
	  
		  @Id
		    private String id;
			private String reqNo;
			private String reqName;
		    private String vendorName;
		    private String vendorLocation;
		    private String businessApprover;
		    private String ApproverUsername;
			private String type;
		    private String ckplLocation;
		    private String vendorCode;
		    private String gstNo;
		    private String currency;
		    private Egst gstType;
		    private String paymentTerm; 
		    private Epo poType;
		    private long totalBaseValue;
		    private List<String> attachment;
		    private List<String> budgetFile;
		    private List<String> poApproverFile;
		    private String remark;
		    @DBRef
		    private List<Brand> brand;
		    private TicketStage stage;
		    private String vendorMailId;	
		    private List<String> poNumber;
		    private List<String> poCopyAttachment;
		    private Date createdAt;
		    private Date updatedAt;
		    private String createdBy;
		    private String updatedBy;
		    private Boolean isDeleted;
		    @DBRef		
		    private List<History> historyList;
		    private String budgetDetails;
		    private String Reason;
		    private String docNum;
		    private String poApprover;
			private String poApproverId;
		    private String AttachPoCopyNo;
		    private Boolean isRelated;
		    private String IoOrCostCentrePo;
			private Boolean matches;
			private String username;
		    private String createdDate;
			private Estatus status;
			private String accountNumber;
			private boolean selfApprove;
			private String advance;
			private String roiDescription;
			private List<User> copyMailIds;
			private Boolean approvalType;
			private List<String> preApprovedFiles;
			private Map<String, Object> changedFields;
			
    		public List<History> getHistoryList() {
		        return historyList;
		    }

		    public void addHistory(History history) {
		        if (historyList == null) {
		            historyList = new ArrayList<>();
		        }
		        historyList.add(history);
		    }

			public String getFundCenterData() {
				if (brand != null && !brand.isEmpty()) {
					return brand.get(0).getFundCentre();
				}
				return null;
			}
		
			public String getCommitmentItem() {
				if (brand != null && !brand.isEmpty()) {
					return brand.get(0).getCommitmentItem();
				}
				return null;
			}

			public String getBrandOrNonBrand() {
				if (brand != null && !brand.isEmpty()) {
					return brand.get(0).getBrandOrNonBrand();
				}
				return null;
			}
		

			 public String getUsername() {
			        return username;
			    }

			    public void setUsername(String username) {
			        this.username = username;
			    }
			    
			    public String getCreatedDate() {
			        return createdDate;
			    }

			    public void setCreatedDate(String createdDate) {
			        this.createdDate = createdDate;
			    }

			    public Date getCreatedAt() {
			        return createdAt;
			    }

			    public void setCreatedAt(Date createdAt) {
			        this.createdAt = createdAt;
			        SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-YYYY");
			        this.createdDate = dateFormat.format(createdAt);
			    }
			    private String formattedCreatedAt;
			    public String getFormattedCreatedAt() {
			        return formattedCreatedAt;
			    }
			    public void setFormattedCreatedAt(String formattedCreatedAt) {
			        this.formattedCreatedAt = formattedCreatedAt;
			    }

}
