package sop_po.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "e_brief")
public class EBrief {
    
    @Id
    private String id;
    
    @JsonProperty("activity_gl_code")
    private String activityGlCode;
    
    @JsonProperty("activity_id")
    private Integer activityId;

    private String attachment;
    private String brand;
    
    @JsonProperty("created_by")
    private CreatedBy createdBy;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreatedBy {
        private String email;
        private String name;
        
        @JsonProperty("user_id")
        private Integer userId;
    }
}