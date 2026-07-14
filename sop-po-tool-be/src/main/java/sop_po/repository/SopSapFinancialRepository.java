package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import sop_po.entity.SopSapFinancial;

public interface SopSapFinancialRepository extends MongoRepository<SopSapFinancial, String> {
    boolean existsByTotalTC(String totalTC);
    SopSapFinancial findByTotalTC(String totalTC);
}
