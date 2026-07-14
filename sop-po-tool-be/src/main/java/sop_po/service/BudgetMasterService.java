package sop_po.service;

import java.util.List;

import sop_po.model.budget.BudgetRange;
import sop_po.response.BudgetRangeWithUsersDTO;

public interface BudgetMasterService {

    public BudgetRange saveOrUpdateWithUsers(BudgetRange req);

    public void removeUserFromBudgetRange(String budgetRangeId, String userId);

    public List<BudgetRangeWithUsersDTO> getAllBudgetRanges(String role);

    public BudgetRangeWithUsersDTO getBudgetRangeById(String id);

    public BudgetRangeWithUsersDTO getBudgetRangeByLimit(Long limit, String glCode, String type);

    public void validateUserInBudgetRange(Long limit, String userId);

    public boolean userIsPresent(String id);

    public boolean validateUserInBudgetRangeByGLCode(String userId, String glCode, Long limit);

    public BudgetRange createOrUpdatePOApprover(BudgetRange request);

    public BudgetRangeWithUsersDTO getPoApproverByBudget(String ticketType, Long amount);

}
