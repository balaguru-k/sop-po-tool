package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import sop_po.model.ticket_request.History;

@Repository
public interface HistoryRepository extends MongoRepository<History, String>{

}
