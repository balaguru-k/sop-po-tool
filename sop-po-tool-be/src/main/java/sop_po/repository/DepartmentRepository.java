package sop_po.repository;

import sop_po.model.BrandbaseData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
	public interface DepartmentRepository extends MongoRepository<BrandbaseData, String> {
//    		    List<BrandbaseData> findByDivision(String division);
	}
