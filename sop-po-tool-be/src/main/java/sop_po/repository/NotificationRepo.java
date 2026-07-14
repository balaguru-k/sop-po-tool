package sop_po.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.model.Notifications;

public interface NotificationRepo extends MongoRepository<Notifications, String> {

    List<Notifications> findAllByRole(String role, Sort sort);

    List<Notifications> findAllByRoleAndTicketType(String role, String ticketType, Sort sort);

    void deleteAllByRole(String role);

    List<Notifications> findAllByUserid(String userid, Sort sort);

    void deleteAllByUserid(String id);

    List<Notifications> findAllByUseridAndTicketType(String id, String ticketType, Sort sort);

}
