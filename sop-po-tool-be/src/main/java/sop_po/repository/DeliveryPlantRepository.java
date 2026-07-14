package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.entity.DeliveryPlant;

@Repository
public interface DeliveryPlantRepository extends MongoRepository<DeliveryPlant, String> {
}