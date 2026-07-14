package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.model.ticket_request.Brand;
@Repository
public interface BrandRepository extends MongoRepository<Brand, String>{
//    List<BrandbaseData> findByDivision(String division);
}
