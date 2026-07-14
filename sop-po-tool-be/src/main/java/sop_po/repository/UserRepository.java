package sop_po.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.mongodb.client.result.UpdateResult;

import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

	Optional<User> findByUsername(String username);

	Boolean existsByUsername(String username);

	Boolean existsByEmail(String email);

	Optional<User> findByEmail(String email);

	Optional<User> findById(String id); // or ObjectId if MongoDB is used

	User findByRoles(TicketStage nextStage);

	User findByRolesAndType(TicketStage nextStage, String type);

	// @Query("{ 'roles' : ?0 }")
	// List<User> findAllByRoles(TicketStage nextStage);

	@Query("{ 'roles' : ?0 }")
	User findByGuestRoles(String string);

	default List<User> findAllByRoles(TicketStage nextStage, MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("roles").in(nextStage));
		return mongoTemplate.find(query, User.class);
	}

	default List<User> findByRolesAndType(TicketStage role, String type, MongoTemplate mongoTemplate) {
		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("roles").in(role).and("type").in(type));
		return mongoTemplate.find(query, User.class);
	}

	default void updateResetValue(String email, MongoTemplate mongoTemplate) {
		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("email").is(email));
		Update update = new Update();
		update.set("isforgot", true);
		update.set("expiryDate", LocalDateTime.now().plusMinutes(10));
		mongoTemplate.updateFirst(query, update, User.class);
	}

	default UpdateResult updatePasswordByEmailForgotPassword(String email, String password,
			MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("email").is(email));
		Update update = new Update();
		update.set("password", password);
		update.set("isforgot", false);
		return mongoTemplate.updateFirst(query, update, User.class);
	}

	default User findByUsernameAndRole(String username, TicketStage poRelease, MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("username").is(username).and("roles").is(poRelease));
		return mongoTemplate.findOne(query, User.class);
	}

	@Query("{ 'roles' : ?0 }")
	List<User> findBAUsers(String role);

	@Query("{ 'roles': { $in: [?0] }, 'mttp': ?1 }")
	List<User> findMttpBAUsers(String string, boolean mttp);

	default List<User> findNextStageUsers(TicketStage stage1, TicketStage stage2, MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("roles").in(stage1, stage2));
		return mongoTemplate.find(query, User.class);
	}

	default List<User> findNextStageNonBrandUsers(TicketStage budgetTeam, String userId, MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
		query.addCriteria(Criteria.where("roles").in(budgetTeam.name()).and("_id").is(new ObjectId(userId)));
		return mongoTemplate.find(query, User.class);

	}

	boolean existsByEmpId(String empId);
}
