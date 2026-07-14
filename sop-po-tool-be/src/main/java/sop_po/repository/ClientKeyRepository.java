package sop_po.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.model.ClientKey;

@Repository
public interface ClientKeyRepository extends MongoRepository<ClientKey, String> {
    
    Optional<ClientKey> findByKeyValueAndIsActive(String keyValue, Boolean isActive);
}