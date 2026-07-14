package sop_po.model;

import java.util.Date;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
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
	private Long id;

	private String userName;
	

	private String password;
	

	private String profilePicture;
	

	private String email;
	

	private Boolean isDelete;
	

    private String roles ;

	private Date created_At;
	
	private Date updated_At;


}
