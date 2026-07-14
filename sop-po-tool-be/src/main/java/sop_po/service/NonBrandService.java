package sop_po.service;

import org.springframework.http.ResponseEntity;
import sop_po.model.NonBrandData;
import java.util.List;

public interface NonBrandService {
    
    ResponseEntity<?> addNonBrand(NonBrandData nonBrandData);
    
    ResponseEntity<?> updateNonBrand(String id, NonBrandData nonBrandData);
    
    ResponseEntity<?> getNonBrandById(String id);
    
    ResponseEntity<List<NonBrandData>> getAllNonBrands();
    
    ResponseEntity<List<String>> getDivisions();
    
    ResponseEntity<List<String>> getDepartmentsByDivision(String division);
    
    ResponseEntity<List<NonBrandData>> getNonBrandsByFilters(String division, String department, String location, String channel, String fundcenter);
}