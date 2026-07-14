package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.entity.EmailDetails;

public interface MailRepository extends MongoRepository<EmailDetails, String>{
    
}
