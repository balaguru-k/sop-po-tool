package sop_po.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.model.user.ERole;
import sop_po.model.user.Role;

public interface RoleRepository extends MongoRepository<Role, String> {
	Optional<Role> findByName(ERole name);

}
