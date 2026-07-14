package sop_po.repository.mttpticket;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.model.mttp.MttpHistory;

public interface MttpHistoryRepo extends MongoRepository<MttpHistory, String> {

}
