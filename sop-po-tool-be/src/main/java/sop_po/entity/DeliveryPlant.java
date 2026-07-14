package sop_po.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "delivery_plants")
public class DeliveryPlant {

    @Id
    @Schema(accessMode = Schema.AccessMode.READ_ONLY)
    private String id;
    private String name;

}
