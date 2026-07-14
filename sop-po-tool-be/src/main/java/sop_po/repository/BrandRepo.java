package sop_po.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.entity.BrandEntity;

public interface BrandRepo extends MongoRepository<BrandEntity, String> {

    List<BrandEntity> findByDivisionAndRegionAndBrand(String division, String region, String brand);
    
}
