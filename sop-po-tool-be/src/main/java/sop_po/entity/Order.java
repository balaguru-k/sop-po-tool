package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "sop_sap_orders_info")
public class Order {
    @Id
    private String id;
    private String orderNumber; 
    private String orderType;
    private String createdOn;
    private String description;
    private String businessArea;
    private String controllingArea;
    private String distributionChannel;
    private String brand;
    private String brandCategory;
    private String zone;
}
