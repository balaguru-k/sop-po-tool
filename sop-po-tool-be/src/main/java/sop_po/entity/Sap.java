package sop_po.entity;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sap")
public class Sap {

    private String url;
    private String type;
    private String userName;
    private String password;
    
}
