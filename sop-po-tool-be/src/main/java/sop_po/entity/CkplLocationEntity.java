package sop_po.entity;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "ckpllocation")
public class CkplLocationEntity {
	 @Id
	private String id;
	private String vendor;
	private String name1;
	private String searchTerm;
    private String plantSearchTerm;
    private String city;
    private String street;
    private String postalcode;
    private String cty;
    private String rg;
	private String taxNumber3;
    private String address;
    private String street2;
    private String street3;
    private List<String> region;
}
