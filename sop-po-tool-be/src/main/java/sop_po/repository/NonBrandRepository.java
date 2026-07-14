package sop_po.repository;

import sop_po.model.NonBrandData;
import java.util.List;

import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.mongodb.core.MongoTemplate;

@Repository
public interface NonBrandRepository extends MongoRepository<NonBrandData, String> {

        List<NonBrandData> findByDivision(String division);

        List<NonBrandData> findByDivisionAndDepartment(String division, String department);

        List<NonBrandData> findByDivisionAndDepartmentAndLocation(String division, String department, String location);

        @Aggregation(pipeline = {
                        "{ $project: { division: 1 } }" // Project only the division field
        })
        List<String> findDistinctDivisions();

        default List<String> findDivisionsOrDepartments(String division, MongoTemplate mongoTemplate) {
                org.springframework.data.mongodb.core.aggregation.Aggregation aggregation;

                if (division == null) {
                        aggregation = org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(
                                        org.springframework.data.mongodb.core.aggregation.Aggregation.group("division"),
                                        org.springframework.data.mongodb.core.aggregation.Aggregation
                                                        .project("division"));
                } else {
                        // If division is provided, return distinct departments for that division
                        aggregation = org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(
                                        org.springframework.data.mongodb.core.aggregation.Aggregation
                                                        .match(Criteria.where("division").is(division)), // Match based
                                                                                                         // on division
                                        org.springframework.data.mongodb.core.aggregation.Aggregation
                                                        .group("department"), // Group by
                                                                              // department
                                        org.springframework.data.mongodb.core.aggregation.Aggregation
                                                        .project("department")
                                                        .andExclude("_id") // Project department and exclude _id
                        );
                }

                // Execute the aggregation and return the results
                AggregationResults<String> result = mongoTemplate.aggregate(aggregation, "nonbranddata", String.class);
                return result.getMappedResults();
        }

        List<NonBrandData> findByDivisionAndDepartmentAndLocationAndChannelAndFundcenter(String division, String department,
                        String location, String channel, String fundcenter);

        List<NonBrandData> findByDivisionAndDepartmentAndLocationAndChannel(String division, String department,
                        String location, String channel);

        List<NonBrandData> findByDivisionAndDepartmentAndLocationAndChannelAndFundcenterAndCostcenter(String division,
                        String department, String location, String channel, String fundcenter, String costcenter);
}
