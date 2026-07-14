package sop_po.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import sop_po.entity.BrandEntity;

@Service
public interface BrandService {

    public ResponseEntity<?> addBrand(BrandEntity brand);

    public ResponseEntity<?> updateBrand(String id, BrandEntity brand);

    public ResponseEntity<?> getBrandById(String id);
    
}
