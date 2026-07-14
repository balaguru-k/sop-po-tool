package sop_po.controller.ticket;

import sop_po.entity.BrandEntity;
import sop_po.entity.CkplLocationEntity;
import sop_po.entity.FundEntity;
import sop_po.entity.GlEntity;
import sop_po.entity.Order;
import sop_po.entity.Sap;
import sop_po.entity.SopSapFinancial;
import sop_po.entity.Vendor;
import sop_po.model.BrandbaseData;
import sop_po.model.Gldetails;
import sop_po.model.NonBrandData;
import sop_po.service.DepartmentService;
import sop_po.service.SapService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

import org.springframework.web.bind.annotation.RequestBody;

import sop_po.response.PaginatedResponse;

@CrossOrigin
@RestController
@RequestMapping("/api/sap")
public class SapController {
	@Autowired
	private SapService sapService;
	private final DepartmentService departmentService;

	public SapController(DepartmentService departmentService) {
		this.departmentService = departmentService;
	}

	@PostMapping("/getVendorSapData")
	public ResponseEntity<?> fetchDataAndInsertSap(@RequestParam(required = false) String accountGroup) {
		return sapService.fetchDataAndInsertSap(accountGroup);
	}

	@GetMapping("/getAllVendorsList")
	public ResponseEntity<List<Vendor>> getAllVendors() {
		return sapService.getAllVendors();
	}

	@GetMapping("/getVendorByVendorCode/{vendorCode}")
	public ResponseEntity<Vendor> getVendorByVendorCode(@PathVariable String vendorCode) {
		return sapService.getVendorByVendorCode(vendorCode);
	}

	/* Order infromation */
	@PostMapping("/getSapOrderInfo")
	public ResponseEntity<?> getSapOrderInfo() {
		return sapService.getSapOrderInfo();
	}

	@GetMapping("/getAllOrders")
	public ResponseEntity<List<Order>> getAllOrders() {
		return sapService.getAllOrders();
	}

	@GetMapping("/getOrderCodeInfo/{vendorCode}")
	public ResponseEntity<Order> getOrderCodeInfo(@PathVariable String vendorCode) {
		return sapService.getOrderCodeInfo(vendorCode);
	}

	/* Financial infromation */
	@PostMapping("/getFinancialData")
	public ResponseEntity<?> getFinancialData() {
		return sapService.getFinancialData();
	}

	@GetMapping("/getAllFinancialData")
	public ResponseEntity<List<SopSapFinancial>> getAllFinancialData() {
		return sapService.getAllFinancialData();
	}

	@GetMapping("/getFinancialDataByTotalTC/{totalTC}")
	public ResponseEntity<SopSapFinancial> getFinancialDataByTotalTC(@PathVariable String totalTC) {
		return sapService.getFinancialDataByTotalTC(totalTC);
	}

	/* Fund-Center data */
	@PostMapping("/getFundCenterData")
	public ResponseEntity<?> getFundCenterData() {
		return sapService.getFundCenterData();
	}

	@GetMapping("/getAllFundData")
	public ResponseEntity<List<FundEntity>> getAllFundData() {
		return sapService.getAllFundData();
	}

	@GetMapping("/getFundDataByFundCenter/{fundCenter}")
	public ResponseEntity<FundEntity> getFundDataByFundCenter(@PathVariable String fundCenter) {
		return sapService.getFundDataByFundCenter(fundCenter);
	}

	@GetMapping("/getDepartments/{brandType}")
	public ResponseEntity<?> getDepartmentsByBrandType(@PathVariable String brandType) {
		try {
			if ("NonBrand".equalsIgnoreCase(brandType)) {
				NonBrandData[] groupedNonBrandDepartments = departmentService.getNonBrandDepartmentsByBrandType();
				if (groupedNonBrandDepartments != null && groupedNonBrandDepartments.length > 0) {
					return ResponseEntity.ok(groupedNonBrandDepartments);
				}
			} else {
				BrandbaseData[] groupedBrandDepartments = departmentService.getDepartmentsByBrandType();
				if (groupedBrandDepartments != null && groupedBrandDepartments.length > 0) {
					return ResponseEntity.ok(groupedBrandDepartments);
				}
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error processing request: " + e.getMessage());
		}
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/getAllCkplLocation")
	public List<String> getAllCkplLocation() {
		try {
			return departmentService.getAllCkplLocation();
		} catch (Exception e) {
			return Collections.emptyList();
		}
	}

	@GetMapping("/by-region")
	public ResponseEntity<?> getLocationsByRegion(@RequestParam String region) {
		List<CkplLocationEntity> regions = departmentService.getLocationsByRegion(region);
		if (!regions.isEmpty()) {
			return ResponseEntity.ok(regions);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/getAllGlDetails")
	public Gldetails[] getAllGlDetails() {
		try {
			return departmentService.getAllGlDetails();
		} catch (Exception e) {
			return new Gldetails[0];
		}
	}

	@GetMapping("/getFundcenter/{brandName}")
	public ResponseEntity<List<BrandEntity>> getFundcenter(@PathVariable String brandName) {
		List<BrandEntity> fundcenters = departmentService.getFundcenter(brandName);
		return new ResponseEntity<>(fundcenters, HttpStatus.OK);
	}

	@GetMapping("/Gldescription")
	public ResponseEntity<List<GlEntity>> getCommitmentData(@RequestParam String Gldescription) {
		List<GlEntity> gldescription = departmentService.getCmmtitem(Gldescription);
		return new ResponseEntity<>(gldescription, HttpStatus.OK);
	}

	@GetMapping("/getVendor/{vendorCode}")
	public ResponseEntity<Vendor> getVendorDetailsByCode(@PathVariable String vendorCode) {
		return sapService.getVendorDetailsByCOde(vendorCode);
	}

	@GetMapping("/getBrandData")
	public ResponseEntity<?> getBrandDetails(@RequestParam(required = false) String brand,
			@RequestParam(required = false) String division,
			@RequestParam(required = false) String region, @RequestParam(required = false) String channel,
			@RequestParam(required = false) String fundcenter) {
		return sapService.getBrandDetails(brand, division, region, channel, fundcenter);
	}

	@GetMapping("/getDivisionData")
	public ResponseEntity<?> getDivisionDetails(@RequestParam(required = false) String division,
			@RequestParam(required = false) String brand,
			@RequestParam(required = false) String region,
			@RequestParam(required = false) String channel, @RequestParam(required = false) String brandSubCategory,
			@RequestParam(required = false) String fundcenter) {

		return sapService.getDivisionDetails(division, brand, region, channel, brandSubCategory, fundcenter);
	}

	@GetMapping("/balance")
	public ResponseEntity<Double> getSapBalance(
			@RequestParam String fundCenter,
			@RequestParam String commitmentItem,
			@RequestParam String fiscalYear,
			@RequestParam String month) throws Exception {

		double balance = sapService.fetchSapBalance(fundCenter, commitmentItem, fiscalYear, month);
		return ResponseEntity.ok(balance);
	}

	@GetMapping("/getNonBrandData")
	public ResponseEntity<?> getNonBrandDetails(@RequestParam(required = false) String brandType,
			@RequestParam(required = false) String division,
			@RequestParam(required = false) String department, @RequestParam(required = false) String location,
			@RequestParam(required = false) String channel, @RequestParam(required = false) String fundcenter) {
		return sapService.getNonBrandDetails(brandType, division, department, location, channel, fundcenter);
	}

	@GetMapping("/getVendorList")
	public ResponseEntity<?> getVendorList(@RequestParam(required = false) String vendorName,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) String gstNo) {
		return sapService.getVendorList(vendorName, location, gstNo);
	}

	@GetMapping("/getVendors")
	public ResponseEntity<PaginatedResponse<Vendor>> getVendorsPaginated(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) String search,
			@RequestParam(defaultValue = "vendorName") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDir) {
		return sapService.getVendorsPaginated(page, size, search, sortBy, sortDir);
	}

	@PostMapping("/sapdetails")
	public Sap saveSap(@RequestBody Sap sapDetails) {

		return sapService.saveSap(sapDetails);
	}

	@GetMapping("/getSapDetails")
	public List<Sap> getSapDetails() {
		return sapService.getSapDetails();
	}

	@GetMapping("/getPoFile/{id}")
	public ResponseEntity<byte[]> getPoFile(@PathVariable String id, @RequestParam List<String> poNums) {
		try {
			byte[] excelBytes = sapService.getPoFileAsExcel(id, poNums);
			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=PO_Details.xlsx")
					.contentType(MediaType
							.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
					.body(excelBytes);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}
