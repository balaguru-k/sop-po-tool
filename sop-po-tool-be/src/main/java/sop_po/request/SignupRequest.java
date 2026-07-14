package sop_po.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SignupRequest {
    
    private String id;
    
	private String empId;
	
	private String userName;
	
	private String email;
	
	private String password;
		
    private List<String> roles ;

	private long budgetLimit;

	private Boolean mttp;

	private List<String> type;

}
