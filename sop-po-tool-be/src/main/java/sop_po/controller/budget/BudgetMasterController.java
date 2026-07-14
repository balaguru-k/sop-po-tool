package sop_po.controller.budget;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import sop_po.model.budget.BudgetRange;
import sop_po.model.ticket_request.TicketStage;
import sop_po.response.BudgetRangeWithUsersDTO;
import sop_po.service.BudgetMasterService;

@RestController
@RequestMapping("/budget")
public class BudgetMasterController {

    @Autowired
    private BudgetMasterService service;

    @PostMapping()
    public ResponseEntity<BudgetRange> createOrUpdateWithUsers(@RequestBody BudgetRange request) {
        BudgetRange saved = service.saveOrUpdateWithUsers(request);
        HttpStatus status = (request.getId() == null) ? HttpStatus.CREATED : HttpStatus.OK;
        return new ResponseEntity<>(saved, status);
    }

    @DeleteMapping("/{budgetRangeId}/users/{userId}")
    public ResponseEntity<Map<String, String>> removeUserFromBudgetRange(@PathVariable String budgetRangeId,
            @PathVariable String userId) {
        service.removeUserFromBudgetRange(budgetRangeId, userId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User with ID " + userId + " removed from budget range " + budgetRangeId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BudgetRangeWithUsersDTO>> getAllBudgetRanges() {
        List<BudgetRangeWithUsersDTO> ranges = service.getAllBudgetRanges(TicketStage.Business_Approver.toString());
        return ResponseEntity.ok(ranges);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetRangeWithUsersDTO> getBudgetRangeById(@PathVariable String id) {
        BudgetRangeWithUsersDTO range = service.getBudgetRangeById(id);
        return ResponseEntity.ok(range);
    }

    @GetMapping("/by-limit-ba")
    public ResponseEntity<BudgetRangeWithUsersDTO> getBudgetRangeByLimit(@RequestParam Long limit,
            @RequestParam(required = false) String glCode, @RequestParam(required = false) String type) {
        BudgetRangeWithUsersDTO budgetRange = service.getBudgetRangeByLimit(limit, glCode, type);
        return ResponseEntity.ok(budgetRange);
    }

    @GetMapping("/validate-user")
    public ResponseEntity<Map<String, String>> validateUser(
            @RequestParam(required = false) Long limit,
            @RequestParam(required = false) String userId, @RequestParam(required = false) String glCode) {

        Map<String, String> response = new HashMap<>();

        if (limit != null && userId != null && glCode == null) {
            service.validateUserInBudgetRange(limit, userId);
            response.put("message", "User is within budget range");
        } else if (userId != null && glCode != null) {
            boolean customApprover = service.validateUserInBudgetRangeByGLCode(userId, glCode, limit);
            response.put("message", customApprover ? "User is not eligible" : "User is eligible");
        } else if (userId != null) {
            boolean isPresent = service.userIsPresent(userId);
            response.put("message", isPresent ? "User is eligible" : "User is not eligible");
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User ID is required");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/po-approver")
    public ResponseEntity<BudgetRange> createOrUpdatePOApprover(@RequestBody BudgetRange request) {
        BudgetRange saved = service.createOrUpdatePOApprover(request);
        HttpStatus status = (request.getId() == null) ? HttpStatus.CREATED : HttpStatus.OK;
        return new ResponseEntity<>(saved, status);
    }

    @GetMapping("/po-approver-by-budget")
    public ResponseEntity<BudgetRangeWithUsersDTO> getPoApproverByBudget(@RequestParam String ticketType,
            @RequestParam(required = false) Long amount) {
        BudgetRangeWithUsersDTO budgetRange = service.getPoApproverByBudget(ticketType, amount);
        return ResponseEntity.ok(budgetRange);
    }

    @GetMapping("/all-po-approvers")
    public ResponseEntity<List<BudgetRangeWithUsersDTO>> getAllBudgetRangesForPoApprover() {
        List<BudgetRangeWithUsersDTO> ranges = service.getAllBudgetRanges(TicketStage.Po_release.toString());
        return ResponseEntity.ok(ranges);
    }

}