package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.entity.Sap;

public interface SapRepository extends MongoRepository<Sap, String>{
    
}
