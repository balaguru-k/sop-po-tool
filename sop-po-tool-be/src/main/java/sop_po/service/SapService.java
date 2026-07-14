package sop_po.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.util.List;

import sop_po.entity.FundEntity;
import sop_po.entity.Order;
import sop_po.entity.Sap;
import sop_po.entity.SopSapFinancial;
import sop_po.entity.Vendor;
import sop_po.response.PaginatedResponse;
import sop_po.response.SapResponse;

@Service
public interface SapService {
	ResponseEntity<SapResponse> fetchDataAndInsertSap(String accountGroup);

	ResponseEntity<List<Vendor>> getAllVendors();

	ResponseEntity<Vendor> getVendorByVendorCode(String vendorCode);

	ResponseEntity<SapResponse> getSapOrderInfo();

	ResponseEntity<List<Order>> getAllOrders();

	ResponseEntity<Order> getOrderCodeInfo(String orderCode);

	ResponseEntity<SapResponse> getFinancialData();

	ResponseEntity<List<SopSapFinancial>> getAllFinancialData();

	ResponseEntity<SopSapFinancial> getFinancialDataByTotalTC(String totalTC);

	ResponseEntity<SapResponse> getFundCenterData();

	ResponseEntity<List<FundEntity>> getAllFundData();

	ResponseEntity<FundEntity> getFundDataByFundCenter(String fundCenter);

	ResponseEntity<Vendor> getVendorDetailsByCOde(String vendorCode);

	ResponseEntity<?> getBrandDetails(String brand, String division, String region, String channel, String fundcenter);

	ResponseEntity<?> getDivisionDetails(String division, String brand, String region, String channel,
			String BrandSubCategory, String fundcenter);

	double fetchSapBalance(String fundCenter, String commitmentItem, String fiscalYear, String month) throws Exception;

	ResponseEntity<?> getNonBrandDetails(String brandType, String division, String department, String location,
			String channel, String fundcenter);

	ResponseEntity<?> getVendorList(String vendorName, String location, String gstNo);

	Sap saveSap(Sap sapDetails);

	List<Sap> getSapDetails();

	byte[] getPoFileAsExcel(String id, List<String> poNums) throws Exception;

	ResponseEntity<PaginatedResponse<Vendor>> getVendorsPaginated(int page, int size, String search, String sortBy, String sortDir);

}