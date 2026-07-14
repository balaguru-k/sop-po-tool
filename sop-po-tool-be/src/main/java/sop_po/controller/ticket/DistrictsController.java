package sop_po.controller.ticket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.entity.Districts;
import sop_po.service.DistrictsService;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/district")
public class DistrictsController {

    @Autowired
    private DistrictsService districtService;

    @PostMapping
    public Districts createDistrict(@RequestBody Districts district) {

        return districtService.saveDistricts(district);
    }

    @GetMapping()
    public Districts getAllDistricts(@RequestParam String region) {
        return districtService.getAllDistricts(region);
    }

}
