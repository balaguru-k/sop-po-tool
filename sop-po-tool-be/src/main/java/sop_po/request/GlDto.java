package sop_po.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GlDto {

    private String glacct;
	private String gldescription;
	private String cmmtitem;
	private String cmmititmdescription;
	private boolean customApprover;
	private String type;
	private boolean ebrief;

}
