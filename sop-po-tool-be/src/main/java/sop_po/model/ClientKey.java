package sop_po.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "client_keys")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ClientKey {

    @Id
    @Schema(accessMode = Schema.AccessMode.READ_ONLY)
    private String id;
    private String keyValue;
    private String description;
    private List<String> allowedEndpoints;
    private Boolean isActive;
}