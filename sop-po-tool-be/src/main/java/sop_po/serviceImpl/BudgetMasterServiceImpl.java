package sop_po.serviceImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import sop_po.entity.GlEntity;
import sop_po.jwt.JwtUtils;
import sop_po.model.budget.BudgetRange;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;
import sop_po.repository.BudgetMasterRepository;
import sop_po.repository.GldetailsRepository;
import sop_po.repository.UserRepository;
import sop_po.response.BudgetRangeWithUsersDTO;
import sop_po.response.UserRef;
import sop_po.service.BudgetMasterService;

@Service
public class BudgetMasterServiceImpl implements BudgetMasterService {

    @Autowired
    private BudgetMasterRepository repository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GldetailsRepository gldetailsRepository;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public BudgetRange saveOrUpdateWithUsers(BudgetRange req) {
        BudgetRange range;

        if (req.getId() != null && !req.getId().isEmpty()) {
            range = repository.findById(req.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Budget range with id " + req.getId() + " not found"));
        } else {
            repository.findByMinAndMaxAndRole(req.getMin(), req.getMax(), TicketStage.Business_Approver)
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Budget range " + req.getMin() + "–" + req.getMax() + " already exists");
                    });

            range = new BudgetRange();
        }

        range.setMin(req.getMin());
        range.setMax(req.getMax());
        range.setRole(TicketStage.Business_Approver);
        range.setUserIds(req.getUserIds() != null ? new ArrayList<>(req.getUserIds()) : new ArrayList<>());
        return repository.save(range);
    }

    public void removeUserFromBudgetRange(String budgetRangeId, String userId) {
        BudgetRange range = repository.findById(budgetRangeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Budget range with id " + budgetRangeId + " not found"));

        if (range.getUserIds() != null && range.getUserIds().remove(userId)) {
            repository.save(range);
        }
    }

    public List<BudgetRangeWithUsersDTO> getAllBudgetRanges(String role) {
        List<BudgetRange> ranges = repository.findByRole(role);

        return ranges.stream().map(range -> {
            List<User> users = userRepository.findAllById(range.getUserIds());

            List<UserRef> userRefs = users.stream()
                    .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                            user.getProfilePicture()))
                    .collect(Collectors.toList());

            return new BudgetRangeWithUsersDTO(range.getId(), range.getMin(), range.getMax(), userRefs);
        }).collect(Collectors.toList());
    }

    public BudgetRangeWithUsersDTO getBudgetRangeById(String id) {
        BudgetRange range = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Budget range with id " + id + " not found"));

        List<User> users = userRepository.findAllById(range.getUserIds());

        List<UserRef> userRefs = users.stream()
                .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                        user.getProfilePicture()))
                .collect(Collectors.toList());

        return new BudgetRangeWithUsersDTO(range.getId(), range.getMin(), range.getMax(), userRefs);
    }

    @Override
    public BudgetRangeWithUsersDTO getBudgetRangeByLimit(Long limit, String glCode, String type) {

        if ("nonBrand".equalsIgnoreCase(type)) {
            List<User> fullUsers = userRepository.findByRolesAndType(TicketStage.Business_Approver, type, mongoTemplate);
            if (fullUsers.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No Business Approvers found");
            }
            List<UserRef> userRefs = fullUsers.stream()
                    .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                            user.getProfilePicture()))
                    .collect(Collectors.toList());
            return new BudgetRangeWithUsersDTO(null, null, null, userRefs);
        }

        Long effectiveLimit = limit;
        if (glCode != null && !glCode.isEmpty()) {
            GlEntity glEntity = gldetailsRepository.findByGlacct(glCode);
            if (glEntity == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "GL Code " + glCode + " not found");
            }
            if (glEntity.isCustomApprover()) {
                effectiveLimit = 400001L;
            }
        }

        BudgetRange range = repository.findByLimitWithinRange(effectiveLimit, TicketStage.Business_Approver)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No budget range found for limit "));

        List<User> fullUsers = userRepository.findAllById(range.getUserIds());

        List<UserRef> userRefs = fullUsers.stream()
                .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                        user.getProfilePicture()))
                .collect(Collectors.toList());

        return new BudgetRangeWithUsersDTO(range.getId(), range.getMin(), range.getMax(), userRefs);
    }

    public void validateUserInBudgetRange(Long limit, String userId) {
        BudgetRange range = repository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "No budget range configured"));

        boolean userAllowed = range.getUserIds().contains(userId);
        boolean withinBudget = limit <= range.getMax();

        if (!userAllowed || !withinBudget) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your budget is exceeded or you are not eligible");
        }
    }

    public boolean userIsPresent(String id) {
        BudgetRange range = repository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "No budget range configured"));

        return range.getUserIds().contains(id);
    }

    @Override
    public boolean validateUserInBudgetRangeByGLCode(String userId, String glCode, Long limit) {

        GlEntity glEntity = gldetailsRepository.findByGlacct(glCode);
        if (glEntity == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "GL Code " + glCode + " not found");
        }
        if (glEntity.isCustomApprover()) {
            return glEntity.isCustomApprover();
        } else {
            BudgetRange range = repository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "No budget range configured"));

            boolean userAllowed = range.getUserIds().contains(userId);
            boolean withinBudget = limit <= range.getMax();

            return !(userAllowed && withinBudget);

        }
    }

    @Override
    public BudgetRange createOrUpdatePOApprover(BudgetRange request) {
        BudgetRange range;

        if (request.getId() != null && !request.getId().isEmpty()) {
            range = repository.findById(request.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Budget range with id " + request.getId() + " not found"));
        } else {
            repository.findByMinAndMaxAndRole(request.getMin(), request.getMax(), TicketStage.Po_release)
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Budget range " + request.getMin() + "–" + request.getMax() + " already exists");
                    });

            range = new BudgetRange();
        }

        range.setMin(request.getMin());
        range.setMax(request.getMax());
        range.setRole(TicketStage.Po_release);
        range.setUserIds(request.getUserIds() != null ? new ArrayList<>(request.getUserIds()) : new ArrayList<>());
        return repository.save(range);
    }

    @Override
    public BudgetRangeWithUsersDTO getPoApproverByBudget(String ticketType, Long amount) {

        if ("nonBrand".equalsIgnoreCase(ticketType)) {
            List<User> fullUsers = userRepository.findAllByRoles(TicketStage.Po_release, mongoTemplate);
            if (fullUsers.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No PO approvers found");
            }
            List<UserRef> userRefs = fullUsers.stream()
                    .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                            user.getProfilePicture()))
                    .collect(Collectors.toList());
            return new BudgetRangeWithUsersDTO(null, null, null, userRefs);
        }
        
        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Amount is Required");
        }
        
        BudgetRange range = repository.findByLimitWithinRange(amount, TicketStage.Po_release)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No budget range found for limit "));

        List<User> fullUsers = userRepository.findAllById(range.getUserIds());

        List<UserRef> userRefs = fullUsers.stream()
                .map(user -> new UserRef(user.getId(), user.getEmpId(), user.getUsername(), user.getEmail(),
                        user.getProfilePicture()))
                .collect(Collectors.toList());

        return new BudgetRangeWithUsersDTO(range.getId(), range.getMin(), range.getMax(), userRefs);
    }

}