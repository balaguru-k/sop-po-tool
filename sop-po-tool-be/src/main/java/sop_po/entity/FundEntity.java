package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sop_sap_fund")
public class FundEntity {
    @Id
    private String id;
    private String fundCenter;
    private String erfDate;
    private String aenDate;
}
