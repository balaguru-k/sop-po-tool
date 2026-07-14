package sop_po.controller.ticket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.entity.BrandEntity;
import sop_po.service.BrandService;

@RestController
@SecurityRequirement(name = "Bearer Authentication")
@RequestMapping("/api/brand")
public class BrandController {

    @Autowired
    private BrandService brandService;

    @PostMapping()
	public ResponseEntity<?> addBrand(@RequestBody BrandEntity brand) {
		return brandService.addBrand(brand);
	}
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBrand(@PathVariable String id, @RequestBody BrandEntity brand) {
        return brandService.updateBrand(id, brand);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBrandById(@PathVariable String id) {
        return brandService.getBrandById(id);
    }

}
