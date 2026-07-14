package sop_po.model;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;
@Document(collection = "ckpllocation")
@Getter
@Setter
public class CkplLocation {
	
    private String searchTermPlantSearchTerm;
 
    
    
}
