package sop_po.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.model.ManualMail;

@Repository
public interface ManualMailRepository extends MongoRepository<ManualMail, String> {

    List<ManualMail> findByCreatedBy(String userId);
}