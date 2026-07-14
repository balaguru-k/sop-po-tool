package sop_po.request.mttpticket;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MttpTicketDto {

    private List<MultipartFile> poFile;
    private List<MultipartFile> mailAttachment;
    private String approverId;
    private String remarks;
    private String roiDescription;
    private List<String> carbonCopyMailIds;
    private List<String> deletedPoFile;
    private List<String> deletedmailAttachment;

}
