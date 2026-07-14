package sop_po.controller.ticket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.model.NonBrandData;
import sop_po.service.NonBrandService;

import java.util.List;

@RestController
@SecurityRequirement(name = "Bearer Authentication")
@RequestMapping("/api/nonbrand")
public class NonBrandController {

    @Autowired
    private NonBrandService nonBrandService;

    @PostMapping
    public ResponseEntity<?> addNonBrand(@RequestBody NonBrandData nonBrandData) {
        return nonBrandService.addNonBrand(nonBrandData);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNonBrand(@PathVariable String id, @RequestBody NonBrandData nonBrandData) {
        return nonBrandService.updateNonBrand(id, nonBrandData);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNonBrandById(@PathVariable String id) {
        return nonBrandService.getNonBrandById(id);
    }

    @GetMapping
    public ResponseEntity<List<NonBrandData>> getAllNonBrands() {
        return nonBrandService.getAllNonBrands();
    }

    @GetMapping("/divisions")
    public ResponseEntity<List<String>> getDivisions() {
        return nonBrandService.getDivisions();
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getDepartmentsByDivision(@RequestParam String division) {
        return nonBrandService.getDepartmentsByDivision(division);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<NonBrandData>> getNonBrandsByFilters(
            @RequestParam(required = false) String division,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String fundcenter) {
        return nonBrandService.getNonBrandsByFilters(division, department, location, channel, fundcenter);
    }
}