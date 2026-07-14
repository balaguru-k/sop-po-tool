package sop_po.repository.mttpticket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.model.mttp.MttpTicket;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.TicketStage;

public interface MttpTicketRepo extends MongoRepository<MttpTicket, String> {

    @org.springframework.data.mongodb.repository.Query(value = "{ 'createdAt': { $gte: ?0, $lt: ?1 } }", sort = "{ 'createdAt': -1 }")
    List<MttpTicket> findLatestReqNo(LocalDateTime startOfDay, LocalDateTime endOfDay, PageRequest of);

    default List<MttpTicket> findByBusinessApproverIdAndStage(String id, TicketStage stage,
            MongoTemplate mongoTemplate) {

        Query query = new Query();
        query.addCriteria(Criteria.where("businessApproverId").is(id)
                .and("stage").is(stage).and("isDelete").is(false));
        return mongoTemplate.find(query, MttpTicket.class);

    }

    default List<MttpTicket> findByPoApproverIdAndStage(String id, TicketStage stage, MongoTemplate mongoTemplate) {

        Query query = new Query();
        query.addCriteria(Criteria.where("poApproverId").is(id)
                .and("stage").is(stage).and("isDelete").is(false));
        return mongoTemplate.find(query, MttpTicket.class);
    }

    default List<MttpTicket> findByStage(TicketStage stage, Estatus status, MongoTemplate mongoTemplate) {

        Query query = new Query();
        Criteria criteria = Criteria.where("stage").is(stage)
                .and("isDelete").is(false);

        if (status != null) {
            criteria = criteria.and("status").is(status);
        } else {
            criteria = criteria.and("status").ne(Estatus.Hold);
        }

        query.addCriteria(criteria);
        return mongoTemplate.find(query, MttpTicket.class);
    }

    default List<MttpTicket> findByCreatedByAndStatusNot(String id, Estatus completed, MongoTemplate mongoTemplate) {

        Query query = new Query();
        query.addCriteria(Criteria.where("createdBy").is(id)
                .and("status").not().in(completed, "Draft").and("isDelete").is(false));
        return mongoTemplate.find(query, MttpTicket.class);
    }

    default List<MttpTicket> findAllDraftTickets(String id, MongoTemplate mongoTemplate) {

        Query query = new Query();
        query.addCriteria(Criteria.where("createdBy").is(id)
                .and("status").is(Estatus.Draft).and("isDelete").is(false));
        return mongoTemplate.find(query, MttpTicket.class);
    }

    default List<MttpTicket> findAllCompletedTickets(String id, MongoTemplate mongoTemplate) {

        Query query = new Query();
        query.addCriteria(Criteria.where("createdBy").is(id)
                .and("status").is(Estatus.Completed).and("isDelete").is(false));
        return mongoTemplate.find(query, MttpTicket.class);
    }
}
