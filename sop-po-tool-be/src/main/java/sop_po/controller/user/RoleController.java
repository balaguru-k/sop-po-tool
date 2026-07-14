package sop_po.controller.user;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sop_po.model.user.ERole;

@RestController
@RequestMapping("/api/roles")
public class RoleController {
    
    @GetMapping
    public ResponseEntity<List<String>> getRoles() {
        List<String> roles = Arrays.stream(ERole.values())
                                   .map(Enum::name)
                                   .collect(Collectors.toList());

        return ResponseEntity.ok(roles);
    }

}
