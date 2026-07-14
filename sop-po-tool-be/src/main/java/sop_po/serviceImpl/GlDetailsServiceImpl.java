package sop_po.serviceImpl;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.mongodb.core.query.Criteria;

import sop_po.entity.GlEntity;
import sop_po.repository.GldetailsRepository;
import sop_po.request.GlDto;
import sop_po.service.GlDetailsService;

@Service
public class GlDetailsServiceImpl implements GlDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(GlDetailsServiceImpl.class);
    private final GldetailsRepository gldetailsRepository;
    private final MongoTemplate mongoTemplate;

    public GlDetailsServiceImpl(GldetailsRepository gldetailsRepository, MongoTemplate mongoTemplate) {
        this.gldetailsRepository = gldetailsRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public ResponseEntity<?> getAllGlDetails(String type) {
        try {
            Aggregation aggregation;
            
            if (type != null && !type.trim().isEmpty()) {
                aggregation = Aggregation.newAggregation(
                    Aggregation.match(Criteria.where("type").is(type)),
                    Aggregation.group()
                        .addToSet("cmmtitem").as("cmmtitem")
                        .addToSet("cmmititmdescription").as("cmmititmdescription")
                        .addToSet("gldescription").as("gldescription")
                        .addToSet("glacct").as("glacct")
                );
            } else {
                aggregation = Aggregation.newAggregation(
                    Aggregation.group()
                        .addToSet("cmmtitem").as("cmmtitem")
                        .addToSet("cmmititmdescription").as("cmmititmdescription")
                        .addToSet("ggldescription").as("gldescription")
                        .addToSet("glacct").as("glacct")
                );
            }
            
            AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, "gldetails", Map.class);
            
            if (!results.getMappedResults().isEmpty()) {
                return ResponseEntity.ok(results.getMappedResults().get(0));
            }
            
            Map<String, List<String>> emptyResult = new HashMap<>();
            emptyResult.put("cmmtitem", Collections.emptyList());
            emptyResult.put("cmmititmdescription", Collections.emptyList());
            emptyResult.put("gldescription", Collections.emptyList());
            emptyResult.put("glacct", Collections.emptyList());
            return ResponseEntity.ok(emptyResult);
            
        } catch (Exception e) {
            logger.error("An unexpected error occurred while fetching GL Details: ", e);
            Map<String, List<String>> errorResult = new HashMap<>();
            errorResult.put("cmmtitem", Collections.emptyList());
            errorResult.put("cmmititmdescription", Collections.emptyList());
            errorResult.put("gldescription", Collections.emptyList());
            errorResult.put("glacct", Collections.emptyList());
            return ResponseEntity.ok(errorResult);
        }
    }

    @Override
    public ResponseEntity<?> addGlDetails(GlDto glDto) {
        
        
        GlEntity glEntity = new GlEntity();
        glEntity.setGlacct(glDto.getGlacct());
        glEntity.setGldescription(glDto.getGldescription());
        glEntity.setCmmtitem(glDto.getCmmtitem());
        glEntity.setCmmititmdescription(glDto.getCmmititmdescription());
        glEntity.setCustomApprover(glDto.isCustomApprover());
        glEntity.setType(glDto.getType());
        glEntity.setEbrief(glDto.isEbrief());
        return ResponseEntity.ok(gldetailsRepository.save(glEntity));
    }

    @Override
    public ResponseEntity<?> updateGlDetails(String id, GlDto glDto) {

        GlEntity existingGlEntity = gldetailsRepository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GL Detail not found"));

        existingGlEntity.setGlacct(glDto.getGlacct());
        existingGlEntity.setGldescription(glDto.getGldescription());
        existingGlEntity.setCmmtitem(glDto.getCmmtitem());
        existingGlEntity.setCmmititmdescription(glDto.getCmmititmdescription());
        existingGlEntity.setCustomApprover(glDto.isCustomApprover());
        existingGlEntity.setType(glDto.getType());
        existingGlEntity.setEbrief(glDto.isEbrief());

        return ResponseEntity.ok(gldetailsRepository.save(existingGlEntity));
    }

}
