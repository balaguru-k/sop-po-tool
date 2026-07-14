package sop_po.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.entity.BrandEntity;

import java.util.List;

public interface FundcenterRepository extends MongoRepository<BrandEntity, String> {

        List<BrandEntity> findFundcentersByBrand(String brandName);

        List<BrandEntity> findByBrand(String brand);

        List<BrandEntity> findByBrandAndDivision(String brand, String division);

        List<BrandEntity> findByBrandAndDivisionAndRegion(String brand, String division, String region);

        List<BrandEntity> findByBrandAndDivisionAndRegionAndChannel(String brand, String division, String region,
                        String channel);

        List<BrandEntity> findByBrandAndDivisionAndRegionAndChannelAndFundcenter(String brand, String division,
                        String region, String channel, String fundcenter);

        List<BrandEntity> findByDivision(String division);

        List<BrandEntity> findByDivisionAndBrand(String division, String brand);

        List<BrandEntity> findByDivisionAndBrandAndBrandSubCategory(String division, String brand,
                        String brandSubCategory);

        List<BrandEntity> findByDivisionAndBrandAndBrandSubCategoryAndRegion(
                        String division, String brand, String brandSubCategory, String region);

        List<BrandEntity> findByDivisionAndBrandAndBrandSubCategoryAndRegionAndChannel(
                        String division, String brand, String brandSubCategory, String region, String channel);

        List<BrandEntity> findByDivisionAndBrandAndBrandSubCategoryAndRegionAndChannelAndFundcenter(
                        String division, String brand, String brandSubCategory, String region, String channel,
                        String fundcenter);



        List<BrandEntity> findByDivisionAndBrandAndRegion(String division, String brand, String region);
        List<BrandEntity> findByDivisionAndBrandAndRegionAndChannel(String division, String brand, String region, String channel);

        List<BrandEntity> findByDivisionAndBrandAndRegionAndChannelAndBrandSubCategory(String division, String brand, String region, String channel, String brandSubCategory);

        List<BrandEntity> findByDivisionAndBrandAndRegionAndChannelAndBrandSubCategoryAndFundcenter(String division, String brand, String region, String channel, String brandSubCategory, String fundcenter);


                
}