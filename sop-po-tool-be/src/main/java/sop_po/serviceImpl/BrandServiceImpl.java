package sop_po.serviceImpl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import sop_po.entity.BrandEntity;
import sop_po.repository.BrandRepo;
import sop_po.service.BrandService;

@Service
public class BrandServiceImpl implements BrandService {

    @Autowired
    private BrandRepo brandRepo;

    @Override
    public ResponseEntity<?> addBrand(BrandEntity brand) {

        List<BrandEntity> existingBrands = brandRepo.findByDivisionAndRegionAndBrand(brand.getDivision(),
                brand.getRegion(), brand.getBrand());

        boolean isDuplicate = existingBrands.stream()
                .anyMatch(existing -> existing.getChannel().equals(brand.getChannel()) &&
                        existing.getInternalorder().equals(brand.getInternalorder()) &&
                        existing.getFundcenter().equals(brand.getFundcenter()));

        if (isDuplicate) {
            return ResponseEntity.status(409).body("Brand details already exist.");
        }

        return ResponseEntity.ok(brandRepo.save(brand));
    }

    @Override
    public ResponseEntity<?> updateBrand(String id, BrandEntity brand) {
        BrandEntity existingBrand = brandRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Brand not found"));

        existingBrand.setDivision(brand.getDivision());
        existingBrand.setBrand(brand.getBrand());
        existingBrand.setBrandSubCategory(brand.getBrandSubCategory());
        existingBrand.setRegion(brand.getRegion());
        existingBrand.setChannel(brand.getChannel());
        existingBrand.setInternalorder(brand.getInternalorder());
        existingBrand.setFundcenter(brand.getFundcenter());

        BrandEntity updatedBrand = brandRepo.save(existingBrand);
        return ResponseEntity.ok(updatedBrand);
    }

    @Override
    public ResponseEntity<?> getBrandById(String id) {

        return ResponseEntity.ok(brandRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Brand not found")));
    }
  
}
