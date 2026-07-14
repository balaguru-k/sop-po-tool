package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.entity.Districts;

@Repository
public interface DistrictsRepository extends MongoRepository<Districts, String> {

    Districts findByRegion(String region);

}
