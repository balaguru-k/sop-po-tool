package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "brandbasedata")
public class BrandEntity {
	 @Id
	 @Schema(accessMode = AccessMode.READ_ONLY)
	    private String id;
	    private String division;
	    private String brand;
		private String brandSubCategory;				
	    private String region;
	    private String channel;
	    private String internalorder;
	    private String fundcenter;
}
