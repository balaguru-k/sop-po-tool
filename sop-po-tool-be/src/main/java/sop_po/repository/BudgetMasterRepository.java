package sop_po.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import sop_po.model.budget.BudgetRange;
import sop_po.model.ticket_request.TicketStage;

@Repository
public interface BudgetMasterRepository extends MongoRepository<BudgetRange, String> {

    Optional<BudgetRange> findByMinAndMax(Long min, Long max);

    @Query("{ 'min': { $lte: ?0 }, 'max': { $gte: ?0 }, 'role': ?1 }")
    Optional<BudgetRange> findByLimitWithinRange(Long limit, TicketStage businessApprover);

    Optional<BudgetRange> findByUserIdsContaining(String userId);

    Optional<BudgetRange> findFirstByUserIdsContaining(String userId);

    List<BudgetRange> findAllByUserIdsContaining(String userId);

    // @Query("{ 'userIds': { $in: [?0] }, 'min': { $lt: ?1 }, 'max': { $gte: ?1 } }")
    // BudgetRange findByUserIdsAndValueInRange(String userId, Long totalBaseValue);

    default BudgetRange findByUserIdsAndValueInRange(String userId, Long totalBaseValue, MongoTemplate mongoTemplate) {

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        query.addCriteria(org.springframework.data.mongodb.core.query.Criteria.where("userIds").in(userId)
                .and("min").lte(totalBaseValue)
                .and("max").gte(totalBaseValue));
        return mongoTemplate.findOne(query, BudgetRange.class);

    }

    @Query("{ 'min': { $lte: ?0 }, 'max': { $gte: ?0 }, 'role': ?1 }")
    Optional<BudgetRange> findByMinAndMaxAndRole(Long min, Long max, TicketStage poRelease);

    @Query("{ 'role': ?0 }")
    List<BudgetRange> findByRole(String role);

}
