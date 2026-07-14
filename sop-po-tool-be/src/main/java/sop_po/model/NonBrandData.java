package sop_po.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Document(collection = "nonbranddata")
@Getter
@Setter
public class NonBrandData {
	
	@Id
    private String id;
    private String division;
    private String location;
    private String department;
    private String channel;
    private String fundcenter;
    private String costcenter;

}
