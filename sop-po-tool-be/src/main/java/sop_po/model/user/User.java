package sop_po.model.user;


import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "users")
public class User {
	@Id
	private String id;
    
	private String empId;
	
	private String username;
	
	private String password;
	
	private String profilePicture;
	
	private String email;
	
	private Boolean isDelete;
	
    private List<String> roles ;

	private Date created_At;
	
	private Date updated_At;

	private boolean isforgot;

	private LocalDateTime expiryDate;

	private long budgetLimit;

	private Boolean mttp;

	private List<String> type;

	public void setPassword(String password, PasswordEncoder passwordEncoder) {
        this.password = passwordEncoder.encode(password);
    }


}
