package sop_po.entity;

public enum FileType {

	BIN("BinFileServiceImpl"),
    ATTACHMENTS("AttachmentFileServiceImpl"),
    POCOPY("PoCopyFileServiceImpl"),
	CHUNK("ChunkFileServiceImpl"),
	POFILE("PoFileServiceImpl"),
	MAIL_ATTACHMENT("MailFileFileServiceImpl"),
	PO_SCREENING_FILE("PoScreeningFileServiceImpl"),
	PO_MAKER_FILE("PoMakerFileServiceImpl"),
	BUDGET_FILE("BudgetFileServiceImpl"),
	PREAPPROVED_FILE("PreApprovedFileServiceImpl"),
	POAPPROVER_FILE("PoApproverFileServiceImpl");

    public final String label;

	private FileType(String label) {
		this.label = label;
	}
    
}
