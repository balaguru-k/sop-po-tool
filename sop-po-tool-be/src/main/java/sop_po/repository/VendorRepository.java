package sop_po.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import sop_po.entity.Vendor;

public interface VendorRepository extends MongoRepository<Vendor, String> {

    boolean existsByVendorCode(String vendorCode);

    Vendor findByVendorCode(String vendorCode);

    List<Vendor> findByVendorName(String vendorName);

    List<Vendor> findByVendorNameAndLocation(String vendorName, String vendorLocation);

    List<Vendor> findByVendorNameAndLocationAndGstNo(String vendorName, String vendorLocation, String gstNo);
}
