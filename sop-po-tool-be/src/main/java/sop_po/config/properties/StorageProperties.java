package sop_po.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@ConfigurationProperties("storage")
@Getter
@Setter
@Builder
public class StorageProperties {

	@Builder.Default
	private String location = "uploads";
	@Builder.Default
	private String attachments = "attachments";
	@Builder.Default
	private String poCopy = "poCopy";
	@Builder.Default
	private String chunk = "chunk";
	@Builder.Default
	private String poFiles = "poFiles";
	@Builder.Default
	private String mailFiles = "mailFiles";
	@Builder.Default
	private String poScreeningFile = "poScreeningFile";
	@Builder.Default
	private String poMakerFile = "poMakerFile";
	@Builder.Default
	private String budgetFile = "budgetFile";
	@Builder.Default
	private String preApprovedFile = "preApprovedFile";
	@Builder.Default
	private String poApproverFile = "poApproverFile";
}
