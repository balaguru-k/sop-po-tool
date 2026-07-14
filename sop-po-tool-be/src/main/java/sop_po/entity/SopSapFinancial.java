package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sop_sap_financial")
public class SopSapFinancial {
    @Id
    private String id;
    private String totalTC;
    private double valueType;
}
