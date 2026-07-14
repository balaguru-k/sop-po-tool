package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import sop_po.entity.Order;

public interface SapOrderRepository extends MongoRepository<Order, String> {
    boolean existsByOrderNumber(String orderNumber);
    Order findByOrderNumber(String orderNumber);
}
