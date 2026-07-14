package sop_po.service;
import java.util.List;

import org.springframework.stereotype.Service;

import sop_po.entity.BrandEntity;
import sop_po.entity.CkplLocationEntity;
import sop_po.entity.GlEntity;
import sop_po.model.BrandbaseData;
import sop_po.model.Gldetails;
import sop_po.model.NonBrandData;

@Service
public interface DepartmentService {

	 	BrandbaseData[] getDepartmentsByBrandType();
	    NonBrandData[] getNonBrandDepartmentsByBrandType();
	    
		List<String> getAllCkplLocation();

		List<CkplLocationEntity> getLocationsByRegion(String region);

		Gldetails[] getAllGlDetails();
		
		List<BrandEntity> getFundcenter(String brandName);
		List<GlEntity> getCmmtitem(String brandName);
	}


