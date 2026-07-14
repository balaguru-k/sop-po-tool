package sop_po.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import sop_po.model.NonBrandData;
import sop_po.repository.NonBrandRepository;
import sop_po.service.NonBrandService;

import java.util.List;
import java.util.Optional;

@Service
public class NonBrandServiceImpl implements NonBrandService {

    @Autowired
    private NonBrandRepository nonBrandRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;

     @Override
    public ResponseEntity<?> addNonBrand(NonBrandData nonBrand) {
        List<NonBrandData> existingNonBrands = nonBrandRepository.findByDivisionAndDepartmentAndLocationAndChannelAndFundcenterAndCostcenter(
                nonBrand.getDivision(), nonBrand.getDepartment(), nonBrand.getLocation(), 
                nonBrand.getChannel(), nonBrand.getFundcenter(), nonBrand.getCostcenter());

        if (!existingNonBrands.isEmpty()) {
            return ResponseEntity.status(409).body("NonBrand details already exist.");
        }

        return ResponseEntity.ok(nonBrandRepository.save(nonBrand));
    }

    @Override
    public ResponseEntity<?> updateNonBrand(String id, NonBrandData nonBrand) {
        NonBrandData existingNonBrand = nonBrandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NonBrand not found"));

        existingNonBrand.setDivision(nonBrand.getDivision());
        existingNonBrand.setLocation(nonBrand.getLocation());
        existingNonBrand.setDepartment(nonBrand.getDepartment());
        existingNonBrand.setChannel(nonBrand.getChannel());
        existingNonBrand.setFundcenter(nonBrand.getFundcenter());
        existingNonBrand.setCostcenter(nonBrand.getCostcenter());

        NonBrandData updatedNonBrand = nonBrandRepository.save(existingNonBrand);
        return ResponseEntity.ok(updatedNonBrand);
    }

    @Override
    public ResponseEntity<?> getNonBrandById(String id) {
        try {
            Optional<NonBrandData> nonBrandData = nonBrandRepository.findById(id);
            if (nonBrandData.isPresent()) {
                return ResponseEntity.ok(nonBrandData.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("NonBrand data not found with id: " + id);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching NonBrand data: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<NonBrandData>> getAllNonBrands() {
        try {
            List<NonBrandData> allData = nonBrandRepository.findAll();
            return ResponseEntity.ok(allData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<String>> getDivisions() {
        try {
            List<String> divisions = nonBrandRepository.findDivisionsOrDepartments(null, mongoTemplate);
            return ResponseEntity.ok(divisions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<String>> getDepartmentsByDivision(String division) {
        try {
            List<String> departments = nonBrandRepository.findDivisionsOrDepartments(division, mongoTemplate);
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<List<NonBrandData>> getNonBrandsByFilters(String division, String department, 
            String location, String channel, String fundcenter) {
        try {
            List<NonBrandData> filteredData;
            
            if (channel != null && fundcenter != null) {
                filteredData = nonBrandRepository.findByDivisionAndDepartmentAndLocationAndChannelAndFundcenter(
                        division, department, location, channel, fundcenter);
            } else if (channel != null) {
                filteredData = nonBrandRepository.findByDivisionAndDepartmentAndLocationAndChannel(
                        division, department, location, channel);
            } else if (location != null) {
                filteredData = nonBrandRepository.findByDivisionAndDepartmentAndLocation(
                        division, department, location);
            } else if (department != null) {
                filteredData = nonBrandRepository.findByDivisionAndDepartment(division, department);
            } else {
                filteredData = nonBrandRepository.findByDivision(division);
            }
            
            return ResponseEntity.ok(filteredData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}