package sop_po.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BudgetRangeWithUsersDTO {
    private String id;
    private Long min;
    private Long max;
    private List<UserRef> users;
}
