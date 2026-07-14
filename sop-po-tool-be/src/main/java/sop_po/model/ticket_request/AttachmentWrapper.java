package sop_po.model.ticket_request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentWrapper {

    private String fileName;
    private byte[] content;
    
}
