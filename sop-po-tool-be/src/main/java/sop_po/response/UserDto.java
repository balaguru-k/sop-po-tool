package sop_po.response;

import java.util.Date;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import sop_po.model.user.User;
@Getter
@Setter
@AllArgsConstructor
public class UserDto {
	
	private String id;
    
	private String empId;
	
	private String userName;
	
	private String profilePicture;
	
	private String email;
	
	private Boolean isDelete;
	
    private List<String> roles ;

	private Date created_At;
	
	private Date updated_At;

	private long budgetLimit;

	private Boolean mttp;

	private List<String> type;
	
	  public static UserDto fromUser(User user) {
          return new UserDto(user.getId(),user.getEmpId(),
        		  user.getUsername(), user.getProfilePicture(),
        		  user.getEmail(),user.getIsDelete(),
        		  user.getRoles(),user.getCreated_At(),
        		  user.getUpdated_At(), user.getBudgetLimit(),
				  user.getMttp(), user.getType());
      }
	  
	  
	


}
