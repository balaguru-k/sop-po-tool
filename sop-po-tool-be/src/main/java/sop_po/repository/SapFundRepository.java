package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import sop_po.entity.FundEntity;

public interface SapFundRepository extends MongoRepository<FundEntity, String> {
    boolean existsByFundCenter(String fundCenter);
    FundEntity findByFundCenter(String fundCenter);
}
