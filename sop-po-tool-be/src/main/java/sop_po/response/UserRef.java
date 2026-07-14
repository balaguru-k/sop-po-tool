package sop_po.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRef {

    private String id;
    
	private String empId;
	
	private String userName;
	
	private String email;
    
    private String profilePicture;
}
