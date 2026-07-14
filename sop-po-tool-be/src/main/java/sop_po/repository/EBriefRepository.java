package sop_po.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import sop_po.model.EBrief;

@Repository
public interface EBriefRepository extends MongoRepository<EBrief, String> {
    
    boolean existsByActivityId(Integer activityId);

    Optional<EBrief> findByActivityId(long activityId);
    
    List<EBrief> findByCreatedByEmail(String email);

    @Query("{'activityGlCode': {$regex: '^?0-', $options: 'i'}, 'createdBy.email': ?1}")
    List<EBrief> findByGlCodePrefixAndEmail(String glCode, String email);

    @Query("{'activityGlCode': {$regex: '^?0-', $options: 'i'}}")
    List<EBrief> findByGlCodePrefix(String glCode);
}