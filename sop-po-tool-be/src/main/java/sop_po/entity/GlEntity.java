package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "gldetails")
public class GlEntity {
	@Id
	private String id;
	private String glacct;
	private String gldescription;
	private String cmmtitem;
	private String cmmititmdescription;
	private boolean customApprover;
	private String type;
	private boolean ebrief;
}
