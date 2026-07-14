package sop_po.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.entity.CkplLocationEntity;

@Repository
public interface CkplLocationRepository extends MongoRepository<CkplLocationEntity, String> {

	List<CkplLocationEntity> findByRegion(String region);

}
