package sop_po.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Document(collection = "brandbasedata")
@Getter
@Setter
public class BrandbaseData {
    @Id
    private String id;
    private List<String> division;
    private List<String> brand;
    private List<String> region;
    private List<String> channel;
    private List<String> iodescription;
    private List<String> internalorder;
    private List<String> fundcenter;
	 
    
}
