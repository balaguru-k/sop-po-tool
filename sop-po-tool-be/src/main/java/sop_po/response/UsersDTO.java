package sop_po.response;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsersDTO {

    private String id;
    
    private String empId;
	
	private String username;
		
	private String email;

    private String password;
		
    private List<String> roles;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    private long budgetLimit;

}
