package sop_po.entity;

import org.springframework.data.annotation.Id;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GldetailsEntity {
	@Id
    private String id;
    private String glacct;
    private String gldescription;
    private String cmmtitem;
    private String cmmititmdescription;
    
}
