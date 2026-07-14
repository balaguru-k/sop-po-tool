package sop_po.model;

import java.util.List;

import org.springframework.data.annotation.Id;

import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
public class Gldetails {
	@Id
    private String id;
    private List<String> cmmititmdescription;
    private List<String> cmmtitem;
    private List<String> gldescription;
    private List<String> glacct;
}
