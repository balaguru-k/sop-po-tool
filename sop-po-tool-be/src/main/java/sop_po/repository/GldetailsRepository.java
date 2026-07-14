package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import sop_po.entity.GlEntity;

import java.util.List;

public interface GldetailsRepository extends MongoRepository<GlEntity, String> {

	@Query("{ 'gldescription' : ?0 }")
	List<GlEntity> findCmmtitemByGldescription(String gldescription);

	GlEntity findByGlacct(String glCode);

}
