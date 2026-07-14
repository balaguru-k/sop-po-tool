package sop_po.request;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sop_po.model.ticket_request.Egst;
import sop_po.model.ticket_request.Epo;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateTicket {
	 @JsonProperty(required = false)
	    private String vendorName;

	    @JsonProperty(required = false)
	    private String vendorLocation;

	    @JsonProperty(required = false)
	    private String ckplLocation;

	    @JsonProperty(required = false)
	    private String vendorCode;

	    @JsonProperty(required = false)
	    private String gstNo;

	    @JsonProperty(required = false)
	    private String currency;

	    @JsonProperty(required = false)
	    private Egst gstType;

	    @JsonProperty(required = false)
	    private String paymentTerm;

	    @JsonProperty(required = false)
	    private Epo poType;

	    @JsonProperty(required = false)
	    private String totalBaseValue;

	    @JsonProperty(required = false)
	    private List<Branddto> brand;

	    @JsonProperty(required = false)
	    private String vendorMailId;
	    
	    @JsonProperty(required = false)
	    private String value;
	    
	    @JsonProperty(required = false)
	    private String businessApprover;

		@Schema(accessMode = AccessMode.READ_ONLY)
		private String reqNo;

		private boolean isBudget;

		private boolean selfApprove;

        private String advance;

        private String roiDescription;

		private List<String> copyMailIds;

		private Boolean approvalType;

		private List<MultipartFile> preApprovedFiles;

		private List<String> deletedPreApprovedFiles;

		private String accountNumber;


}
