package sop_po.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import sop_po.entity.Vendor;
import sop_po.model.NonBrandData;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.SapComparisonResult;
import sop_po.repository.SapOrderRepository;
import sop_po.repository.SapRepository;
import sop_po.repository.VendorRepository;
import sop_po.repository.SopSapFinancialRepository;
import sop_po.repository.FundcenterRepository;
import sop_po.repository.NonBrandRepository;
import sop_po.repository.RequestRepository;
import sop_po.repository.SapFundRepository;
import sop_po.response.PaginatedResponse;
import sop_po.response.SapResponse;
import sop_po.service.SapService;
import sop_po.entity.BrandEntity;
import sop_po.entity.FundEntity;
import sop_po.entity.Order;
import sop_po.entity.Sap;
import sop_po.entity.SopSapFinancial;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.io.BufferedWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.Base64;
import java.util.logging.Logger;

@Service
public class SapServiceImpl implements SapService {

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private MongoTemplate mongoTemplate;

	@Autowired
	private VendorRepository vendorRepository;

	@Autowired
	private SapOrderRepository sapOrderRepository;

	@Autowired
	private SopSapFinancialRepository sopSapFinancialRepository;

	@Autowired
	private SapFundRepository sapFundRepository;

	@Autowired
	private FundcenterRepository fundcenterRepository;

	@Autowired
	private NonBrandRepository nonBrandRepository;

	@Autowired
	private SapRepository sapRepository;

	@Autowired
	private RequestRepository requestRepository;

	private static final String SAPUSER = "SAP_API_01";
	private static final String SAPSECRET = "Cavin@01";
	private static final String PROGRESS_FILE = "progress_file.txt";
	private static final Logger logger = Logger.getLogger(SapServiceImpl.class.getName());

	private static final String ORDER_PROGRESS_FILE = "progress_file2.txt";
	private static final String FINANCIAL_PROGRESS_FILE = "progress_file3.txt";

	@Value("${sap.api.balance-url}")
	private String sapBalanceUrl;

	@Value("${sap.api.vendor-url}")
	private String sapVendorUrl;

	@Value("${sap.api.order-url}")
	private String sapOrderUrl;

	@Value("${sap.api.financial-url}")
	private String sapFinancialUrl;

	@Value("${sap.api.fundcenter-url}")
	private String sapFundcenterUrl;

	@Value("${sap.api.pofile-url}")
	private String sapPoFileUrl;

	@Scheduled(cron = "0 0 */2 * * ?")
	public void scheduledFetchDataAndInsertSap() {
		fetchDataAndInsertSap("Z006");
		// fetchDataAndInsertSap("Z007");
	}

	@Override
	public ResponseEntity<SapResponse> fetchDataAndInsertSap(String accountGroup) {
		if (accountGroup == null || accountGroup.isBlank()) accountGroup = "Z006";
		try {
			String url = sapVendorUrl;
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			String auth = SAPUSER + ":" + SAPSECRET;
			byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
			String authHeader = "Basic " + new String(encodedAuth);
			headers.set("Authorization", authHeader);
			String fromDate = "01.01.2019";
			// LocalDate toDate = LocalDate.now().minusDays(1);
			LocalDate toDate = LocalDate.now();

			DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
			String toDateString = toDate.format(dateFormatter);
			String requestBody = String.format(
					"[{\"vendor_code\":\"*\",\"Account_group\":\"%s\",\"Purchase_org\":\"HP01\",\"crdat\":\"%s,%s\"}]",
					accountGroup, fromDate, toDateString);
 			HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
			if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				throw new Exception("Unauthorized access - check your credentials");
			}

			String responseBody = response.getBody();
			if (responseBody == null) {
				throw new Exception("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode successNode = root.path("Success");
			JsonNode dataNode = root.path("Data");

			if (dataNode != null && dataNode.isArray()) {
				Set<String> processedVendorCodes = loadProgress();

				for (JsonNode vendorNode : dataNode) {
					try {
						Vendor vendor = new Vendor();
						vendor.setVendorCode(vendorNode.get("vendor_code").asText());
						vendor.setVendorName(vendorNode.get("vendorName").asText());
						vendor.setLocation(vendorNode.get("location").asText());
						vendor.setRegion(vendorNode.get("Region").asText());
						vendor.setGstNo(vendorNode.get("GST No.").asText(""));
						vendor.setPlant(vendorNode.get("Plant").asText(""));
						vendor.setPaymentTerm(vendorNode.get("Payment Term").asText(""));
						vendor.setCurrency(vendorNode.get("Currency").asText(""));
						vendor.setPhoneNo(vendorNode.get("Phone No.").asText(""));
						vendor.setMailId(vendorNode.get("Mail ID").asText(""));
						vendor.setCorpAddr(vendorNode.get("Corp. Addr").asText(""));
						vendor.setVendorAddr(vendorNode.get("Vendor Addr").asText(""));
						vendor.setMsme(vendorNode.get("MSME").asText(""));
						vendor.setAccountNumber(vendorNode.get("Bank Account Number").asText(""));
						vendor.setStatus(vendorNode.get("Status").asText(""));

						boolean vendorExists = vendorRepository.existsByVendorCode(vendor.getVendorCode());
						if (vendorExists) {
							Vendor existingVendor = vendorRepository.findByVendorCode(vendor.getVendorCode());
							existingVendor.setVendorName(vendor.getVendorName());
							existingVendor.setLocation(vendor.getLocation());
							existingVendor.setRegion(vendor.getRegion());
							existingVendor.setGstNo(vendor.getGstNo());
							existingVendor.setPlant(vendor.getPlant());
							existingVendor.setPaymentTerm(vendor.getPaymentTerm());
							existingVendor.setCurrency(vendor.getCurrency());
							existingVendor.setPhoneNo(vendor.getPhoneNo());
							existingVendor.setMailId(vendor.getMailId());
							existingVendor.setCorpAddr(vendor.getCorpAddr());
							existingVendor.setVendorAddr(vendor.getVendorAddr());
							existingVendor.setMsme(vendor.getMsme());
							existingVendor.setCountry(vendor.getCountry());
							existingVendor.setAccountNumber(vendor.getAccountNumber());
							existingVendor.setStatus(vendor.getStatus());
							vendorRepository.save(existingVendor);
						} else {
							vendorRepository.save(vendor);
						}

						processedVendorCodes.add(vendor.getVendorCode());
						saveProgress(processedVendorCodes);
					} catch (Exception e) {
						logger.severe("Error processing vendor code: " + vendorNode.get("vendor_code").asText());
						e.printStackTrace();
					}
				}
			} else {
				logger.severe("Data node is null or not an array. Data node content: " + dataNode);
				throw new Exception("Data node is null or not an array");
			}

			SapResponse responsebdy = new SapResponse();
			responsebdy.setAssetsCount(dataNode.size());
			responsebdy.setMessage("Data fetched and inserted successfully");
			return ResponseEntity.ok(responsebdy);
		} catch (Exception e) {
			SapResponse response = new SapResponse();
			response.setMessage("Failed to fetch and insert data: " + e.getMessage());
			logger.severe("Error: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	private Set<String> loadProgress() {
		try {
			if (!Files.exists(Paths.get(PROGRESS_FILE))) {
				return new HashSet<>();
			}
			return new HashSet<>(Files.readAllLines(Paths.get(PROGRESS_FILE)));
		} catch (IOException e) {
			e.printStackTrace();
			return new HashSet<>();
		}
	}

	private void saveProgress(Set<String> processedVendorCodes) {
		try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(PROGRESS_FILE))) {
			for (String vendorCode : processedVendorCodes) {
				writer.write(vendorCode);
				writer.newLine();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public ResponseEntity<List<Vendor>> getAllVendors() {
		List<Vendor> vendors = vendorRepository.findAll();
		return ResponseEntity.ok(vendors);
	}

	@Override
	public ResponseEntity<Vendor> getVendorByVendorCode(String vendorCode) {
		Vendor vendor = vendorRepository.findByVendorCode(vendorCode);
		if (vendor != null) {
			return ResponseEntity.ok(vendor);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	@Override
	public ResponseEntity<SapResponse> getSapOrderInfo() {
		try {
			String url = sapOrderUrl;
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			String auth = SAPUSER + ":" + SAPSECRET;
			byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
			String authHeader = "Basic " + new String(encodedAuth);
			headers.set("Authorization", authHeader);
			String requestBody = "[{\"Inter_order\":\"*\",\"Order_type\":\"*\",\"Created_on\":\"01.01.2022,02.02.2022\"}]";
			HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
			if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				throw new Exception("Unauthorized access - check your credentials");
			}

			String responseBody = response.getBody();
			if (responseBody == null) {
				throw new Exception("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode successNode = root.path("Success");
			JsonNode dataNode = root.path("Data");

			if (dataNode != null && dataNode.isArray()) {
				Set<String> processedOrderNumbers = loadProgressForOrders();

				for (JsonNode orderNode : dataNode) {
					try {
						Order order = new Order();
						order.setOrderNumber(orderNode.get("Order Number").asText());
						order.setOrderType(orderNode.get("Order Type").asText());
						order.setCreatedOn(orderNode.get("Created On").asText());
						order.setDescription(orderNode.get("Description").asText());
						order.setBusinessArea(orderNode.get("Business Area").asText(""));
						order.setControllingArea(orderNode.get("Controlling Area").asText(""));
						order.setDistributionChannel(orderNode.get("Distribution Channel").asText(""));
						order.setBrand(orderNode.get("Brand").asText(""));
						order.setBrandCategory(orderNode.get("Brand Category").asText(""));
						order.setZone(orderNode.get("Zone").asText(""));

						boolean orderExists = sapOrderRepository.existsByOrderNumber(order.getOrderNumber());
						if (orderExists) {
							Order existingOrder = sapOrderRepository.findByOrderNumber(order.getOrderNumber());
							existingOrder.setOrderType(order.getOrderType());
							existingOrder.setCreatedOn(order.getCreatedOn());
							existingOrder.setDescription(order.getDescription());
							existingOrder.setBusinessArea(order.getBusinessArea());
							existingOrder.setControllingArea(order.getControllingArea());
							existingOrder.setDistributionChannel(order.getDistributionChannel());
							existingOrder.setBrand(order.getBrand());
							existingOrder.setBrandCategory(order.getBrandCategory());
							existingOrder.setZone(order.getZone());
							sapOrderRepository.save(existingOrder);
						} else {
							sapOrderRepository.save(order);
						}

						processedOrderNumbers.add(order.getOrderNumber());
						saveProgressForOrders(processedOrderNumbers);
					} catch (Exception e) {
						logger.severe("Error processing order number: " + orderNode.get("Order Number").asText());
						e.printStackTrace();
					}
				}
			} else {
				logger.severe("Data node is null or not an array. Data node content: " + dataNode);
				throw new Exception("Data node is null or not an array");
			}

			SapResponse responsebdy = new SapResponse();
			responsebdy.setAssetsCount(dataNode.size());
			responsebdy.setMessage("Data fetched and inserted successfully");
			return ResponseEntity.ok(responsebdy);
		} catch (Exception e) {
			SapResponse response = new SapResponse();
			response.setMessage("Failed to fetch and insert data: " + e.getMessage());
			logger.severe("Error: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	private Set<String> loadProgressForOrders() {
		try {
			if (!Files.exists(Paths.get(ORDER_PROGRESS_FILE))) {
				return new HashSet<>();
			}
			return new HashSet<>(Files.readAllLines(Paths.get(ORDER_PROGRESS_FILE)));
		} catch (IOException e) {
			e.printStackTrace();
			return new HashSet<>();
		}
	}

	private void saveProgressForOrders(Set<String> processedOrderNumbers) {
		try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(ORDER_PROGRESS_FILE))) {
			for (String orderNumber : processedOrderNumbers) {
				writer.write(orderNumber);
				writer.newLine();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public ResponseEntity<List<Order>> getAllOrders() {
		List<Order> orders = sapOrderRepository.findAll();
		return ResponseEntity.ok(orders);
	}

	@Override
	public ResponseEntity<Order> getOrderCodeInfo(String orderCode) {
		Order order = sapOrderRepository.findByOrderNumber(orderCode);
		if (order != null) {
			return ResponseEntity.ok(order);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	@Override
	public ResponseEntity<SapResponse> getFinancialData() {
		try {
			String url = sapFinancialUrl;
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			String auth = SAPUSER + ":" + SAPSECRET;
			byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
			String authHeader = "Basic " + new String(encodedAuth);
			headers.set("Authorization", authHeader);
			String requestBody = "[{\"fund_center\":\"CC00TNPA\",\"commitment_item\":\"113002\",\"fiscal_year\":\"2018\",\"period\":\"016\"}]";
			HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

			if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				throw new Exception("Unauthorized access - check your credentials");
			}

			String responseBody = response.getBody();
			if (responseBody == null) {
				throw new Exception("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode successNode = root.path("Success");
			JsonNode dataNode = root.path("Data");

			if (dataNode != null && dataNode.isArray()) {
				Set<String> processedOrderNumbers = loadProgressForFinancialData();

				for (JsonNode dataItem : dataNode) {
					try {
						SopSapFinancial financial = new SopSapFinancial();
						financial.setTotalTC(dataItem.get("Total TC").asText());
						financial.setValueType(dataItem.get("Value Type").asDouble());

						boolean financialExists = sopSapFinancialRepository.existsByTotalTC(financial.getTotalTC());
						if (financialExists) {
							SopSapFinancial existingFinancial = sopSapFinancialRepository
									.findByTotalTC(financial.getTotalTC());
							existingFinancial.setValueType(financial.getValueType());
							sopSapFinancialRepository.save(existingFinancial);
						} else {
							sopSapFinancialRepository.save(financial);
						}

						processedOrderNumbers.add(financial.getTotalTC());
						saveProgressForFinancialData(processedOrderNumbers);
					} catch (Exception e) {
						logger.severe("Error processing data item: " + dataItem);
						e.printStackTrace();
					}
				}
			} else {
				logger.severe("Data node is null or not an array. Data node content: " + dataNode);
				throw new Exception("Data node is null or not an array");
			}

			SapResponse responsebdy = new SapResponse();
			responsebdy.setAssetsCount(dataNode.size());
			responsebdy.setMessage("Data fetched and processed successfully");
			return ResponseEntity.ok(responsebdy);
		} catch (Exception e) {
			SapResponse response = new SapResponse();
			response.setMessage("Failed to fetch and process data: " + e.getMessage());
			logger.severe("Error: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	private Set<String> loadProgressForFinancialData() {
		try {
			if (!Files.exists(Paths.get(FINANCIAL_PROGRESS_FILE))) {
				return new HashSet<>();
			}
			return new HashSet<>(Files.readAllLines(Paths.get(FINANCIAL_PROGRESS_FILE)));
		} catch (IOException e) {
			e.printStackTrace();
			return new HashSet<>();
		}
	}

	private void saveProgressForFinancialData(Set<String> processedFinancialData) {
		try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(FINANCIAL_PROGRESS_FILE))) {
			for (String financialItem : processedFinancialData) {
				writer.write(financialItem);
				writer.newLine();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public ResponseEntity<List<SopSapFinancial>> getAllFinancialData() {
		List<SopSapFinancial> financialData = sopSapFinancialRepository.findAll();
		return ResponseEntity.ok(financialData);
	}

	@Override
	public ResponseEntity<SopSapFinancial> getFinancialDataByTotalTC(String totalTC) {
		SopSapFinancial financial = sopSapFinancialRepository.findByTotalTC(totalTC);
		if (financial != null) {
			return ResponseEntity.ok(financial);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	@Override
	public ResponseEntity<SapResponse> getFundCenterData() {
		try {
			String url = sapFundcenterUrl;
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			String auth = SAPUSER + ":" + SAPSECRET;
			byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
			String authHeader = "Basic " + new String(encodedAuth);
			headers.set("Authorization", authHeader);

			// Log the authorization header
			logger.info("Authorization Header: " + authHeader);

			// Updated request body
			String requestBody = "[{\"change_Date\":\"01.04.2018,01.04.2020\"}]";
			HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

			// Log the request
			logger.info("Request URL: " + url);
			logger.info("Request Body: " + requestBody);
			logger.info("Request Headers: " + headers);

			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

			// Log the response
			logger.info("Response Status Code: " + response.getStatusCode());
			logger.info("Response Body: " + response.getBody());

			if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
				throw new Exception("Unauthorized access - check your credentials");
			}

			String responseBody = response.getBody();
			if (responseBody == null) {
				throw new Exception("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode dataNode = root.path("Data");

			if (dataNode != null && dataNode.isArray()) {
				Set<String> processedFundCenters = loadProgressForFundData();

				for (JsonNode dataItem : dataNode) {
					try {
						FundEntity fund = new FundEntity();
						fund.setFundCenter(dataItem.get("Fund_center").asText());
						fund.setErfDate(dataItem.get("ERFDAT").asText());
						fund.setAenDate(dataItem.get("AENDAT").asText());

						boolean fundExists = sapFundRepository.existsByFundCenter(fund.getFundCenter());
						if (fundExists) {
							FundEntity existingFund = sapFundRepository.findByFundCenter(fund.getFundCenter());
							existingFund.setErfDate(fund.getErfDate());
							existingFund.setAenDate(fund.getAenDate());
							sapFundRepository.save(existingFund);
						} else {
							sapFundRepository.save(fund);
						}

						processedFundCenters.add(fund.getFundCenter());
						saveProgressForFundData(processedFundCenters);
					} catch (Exception e) {
						logger.severe("Error processing data item: " + dataItem);
						e.printStackTrace();
					}
				}
			} else {
				logger.severe("Data node is null or not an array. Data node content: " + dataNode);
				throw new Exception("Data node is null or not an array");
			}

			SapResponse responsebdy = new SapResponse();
			responsebdy.setAssetsCount(dataNode.size());
			responsebdy.setMessage("Data fetched and processed successfully");
			return ResponseEntity.ok(responsebdy);
		} catch (Exception e) {
			SapResponse response = new SapResponse();
			response.setMessage("Failed to fetch and process data: " + e.getMessage());
			logger.severe("Error: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	private Set<String> loadProgressForFundData() {
		try {
			if (!Files.exists(Paths.get(FINANCIAL_PROGRESS_FILE))) {
				return new HashSet<>();
			}
			return new HashSet<>(Files.readAllLines(Paths.get(FINANCIAL_PROGRESS_FILE)));
		} catch (IOException e) {
			e.printStackTrace();
			return new HashSet<>();
		}
	}

	private void saveProgressForFundData(Set<String> processedFundData) {
		try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(FINANCIAL_PROGRESS_FILE))) {
			for (String fundItem : processedFundData) {
				writer.write(fundItem);
				writer.newLine();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public ResponseEntity<List<FundEntity>> getAllFundData() {
		List<FundEntity> fundData = sapFundRepository.findAll();
		return ResponseEntity.ok(fundData);
	}

	@Override
	public ResponseEntity<FundEntity> getFundDataByFundCenter(String fundCenter) {
		FundEntity fund = sapFundRepository.findByFundCenter(fundCenter);
		if (fund != null) {
			return ResponseEntity.ok(fund);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	public SapComparisonResult compareTicketWithSapBalance(String fundCenter, String commitmentItem, String fiscalYear,
			String period, double ticketTotalValue) throws Exception {

		String url = sapBalanceUrl;
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		String auth = SAPUSER + ":" + SAPSECRET;
		byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
		String authHeader = "Basic " + new String(encodedAuth);
		headers.set("Authorization", authHeader);

		String requestBody = String.format(
				"[{\"fund_center\":\"%s\",\"commitment_item\":\"%s\",\"fiscal_year\":\"%s\",\"period\":\"%s\"}]",
				fundCenter, commitmentItem, fiscalYear, period);

		HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
		SapComparisonResult result = new SapComparisonResult();

		try {
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
			String responseBody = response.getBody();

			if (responseBody == null) {
				throw new RuntimeException("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode balanceNode = root.path("Balance");

			double sapBalance = balanceNode.asDouble();
			result.setMatches(ticketTotalValue <= sapBalance);
			return result;

		} catch (HttpClientErrorException.Unauthorized e) {
			logger.severe("Unauthorized access - Invalid credentials: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
					"Invalid SAP credentials. Please check your username and password.");
		} catch (HttpClientErrorException.BadRequest e) {
			logger.severe("Bad request to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error: Invalid request parameters sent to SAP.");
		} catch (HttpClientErrorException.Forbidden e) {
			logger.severe("Access denied to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Error: Access denied. You don't have permission to access this resource.");
		} catch (HttpClientErrorException.NotFound e) {
			logger.severe("SAP endpoint not found: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
					"Error: SAP endpoint not found. Verify the API URL.");
		} catch (HttpServerErrorException.InternalServerError e) {
			logger.severe("SAP internal server error: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Error: SAP encountered an internal error. Please try again later.");
		} catch (HttpClientErrorException | HttpServerErrorException e) {
			logger.severe("SAP request failed: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Error: SAP request failed with status: " + e.getStatusCode());
		} catch (RestClientException e) {
			logger.severe("Network error while connecting to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Error: Unable to connect to SAP. Please check your network.");
		} catch (Exception e) {
			logger.severe("Unexpected error fetching data from SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error: " + e.getMessage());
		}
	}

	@Override
	public ResponseEntity<Vendor> getVendorDetailsByCOde(String vendorCode) {
		Vendor vendor = vendorRepository.findByVendorCode(vendorCode);
		if (vendor != null) {
			return ResponseEntity.ok(vendor);
		} else {
			return ResponseEntity.notFound().build();
		}
	}

	// @Override
	// public ResponseEntity<PaginatedResponse<Object>> getBrandOrNonBrandDetails(
	// String brandOrNonBrand, String brand, String division, String region, String
	// channel, String location, String department) {

	// PaginatedResponse<Object> response = new PaginatedResponse<>();
	// List<Object> data = new ArrayList<>();

	// if ("Brand".equalsIgnoreCase(brandOrNonBrand)) {
	// if (brand == null && division == null && region == null && channel == null) {
	// data.addAll(fundcenterRepository.findAll());
	// } else if (brand != null && division == null && region == null && channel ==
	// null) {
	// data.addAll(fundcenterRepository.findByBrand(brand));
	// } else if (brand != null && division != null && region == null && channel ==
	// null) {
	// data.addAll(fundcenterRepository.findByBrandAndDivision(brand, division));
	// } else if (brand != null && division != null && region != null && channel ==
	// null) {
	// data.addAll(fundcenterRepository.findByBrandAndDivisionAndRegion(brand,
	// division, region));
	// } else if (brand != null && division != null && region != null && channel !=
	// null) {
	// data.addAll(fundcenterRepository.findByBrandAndDivisionAndRegionAndChannel(brand,
	// division, region, channel));
	// }
	// } else if ("NonBrand".equalsIgnoreCase(brandOrNonBrand)) {
	// if (division == null && location == null && department == null) {
	// data.addAll(nonBrandRepository.findAll());
	// } else if (division != null && department == null && location == null) {
	// data.addAll(nonBrandRepository.findByDivision(division));
	// } else if (division != null && department != null && location == null) {
	// data.addAll(nonBrandRepository.findByDivisionAndDepartment(division,
	// department));
	// } else if (division != null && department != null && location != null) {
	// data.addAll(nonBrandRepository.findByDivisionAndDepartmentAndLocation(division,
	// department, location));
	// }
	// }

	// response.setData(data);
	// response.setTotalCount(data.size());
	// return ResponseEntity.ok(response);
	// }

	@Override
	public ResponseEntity<PaginatedResponse<BrandEntity>> getDivisionDetails(String division, String brand,
			String region, String channel, String brandSubCategory, String fundcenter) {

		List<BrandEntity> brandData = new ArrayList<>();

		// if (division == null && brand == null && brandSubCategory == null && region
		// == null && channel == null && fundcenter == null) {
		// brandData = fundcenterRepository.findAll();
		// } else if (division != null && brand == null && brandSubCategory == null &&
		// region == null && channel == null && fundcenter == null) {
		// brandData = fundcenterRepository.findByDivision(division);
		// } else if (division != null && brand != null && brandSubCategory == null &&
		// region == null && channel == null && fundcenter == null) {
		// brandData = fundcenterRepository.findByDivisionAndBrand(division, brand);
		// } else if (division != null && brand != null && brandSubCategory != null &&
		// region == null && channel == null
		// && fundcenter == null) {
		// brandData =
		// fundcenterRepository.findByDivisionAndBrandAndBrandSubCategory(division,
		// brand,
		// brandSubCategory);
		// } else if (division != null && brand != null && brandSubCategory != null &&
		// region != null && channel == null
		// && fundcenter == null) {
		// brandData =
		// fundcenterRepository.findByDivisionAndBrandAndBrandSubCategoryAndRegion(division,
		// brand,
		// brandSubCategory, region);

		// } else if (division != null && brand != null && brandSubCategory != null &&
		// region != null && channel != null
		// && fundcenter == null) {
		// brandData =
		// fundcenterRepository.findByDivisionAndBrandAndBrandSubCategoryAndRegionAndChannel(division,
		// brand, brandSubCategory, region, channel);

		// } else if (division != null && brand != null && brandSubCategory != null &&
		// region != null && channel != null
		// && fundcenter != null) {
		// brandData =
		// fundcenterRepository.findByDivisionAndBrandAndBrandSubCategoryAndRegionAndChannelAndFundcenter(
		// division, brand, brandSubCategory, region, channel, fundcenter);
		// }

		if (division == null && brand == null && region == null && channel == null && brandSubCategory == null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findAll();

		} else if (division != null && brand == null && region == null && channel == null && brandSubCategory == null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findByDivision(division);

		} else if (division != null && brand != null && region == null && channel == null && brandSubCategory == null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findByDivisionAndBrand(division, brand);

		} else if (division != null && brand != null && region != null && channel == null && brandSubCategory == null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findByDivisionAndBrandAndRegion(division, brand, region);

		} else if (division != null && brand != null && region != null && channel != null && brandSubCategory == null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findByDivisionAndBrandAndRegionAndChannel(division, brand, region,
					channel);

		} else if (division != null && brand != null && region != null && channel != null && brandSubCategory != null
				&& fundcenter == null) {
			brandData = fundcenterRepository.findByDivisionAndBrandAndRegionAndChannelAndBrandSubCategory(
					division, brand, region, channel, brandSubCategory);

		} else if (division != null && brand != null && region != null && channel != null && brandSubCategory != null
				&& fundcenter != null) {
			brandData = fundcenterRepository.findByDivisionAndBrandAndRegionAndChannelAndBrandSubCategoryAndFundcenter(
					division, brand, region, channel, brandSubCategory, fundcenter);
		}

		PaginatedResponse<BrandEntity> response = new PaginatedResponse<>();
		response.setData(brandData);
		response.setTotalCount(brandData.size());
		return ResponseEntity.ok(response);

	}

	@Override
	public ResponseEntity<PaginatedResponse<BrandEntity>> getBrandDetails(String brand, String division, String region,
			String channel, String fundcenter) {

		List<BrandEntity> brandData = new ArrayList<>();

		if (brand == null && division == null && region == null && channel == null && fundcenter == null) {
			brandData = fundcenterRepository.findAll();
		} else if (brand != null && division == null && region == null && channel == null && fundcenter == null) {
			brandData = fundcenterRepository.findByBrand(brand);
		} else if (brand != null && division != null && region == null && channel == null && fundcenter == null) {
			brandData = fundcenterRepository.findByBrandAndDivision(brand, division);
		} else if (brand != null && division != null && region != null && channel == null && fundcenter == null) {
			brandData = fundcenterRepository.findByBrandAndDivisionAndRegion(brand, division, region);
		} else if (brand != null && division != null && region != null && channel != null && fundcenter == null) {
			brandData = fundcenterRepository.findByBrandAndDivisionAndRegionAndChannel(brand, division, region,
					channel);
		} else if (brand != null && division != null && region != null && channel != null && fundcenter != null) {
			brandData = fundcenterRepository.findByBrandAndDivisionAndRegionAndChannelAndFundcenter(brand, division,
					region, channel, fundcenter);
		}
		PaginatedResponse<BrandEntity> response = new PaginatedResponse<>();
		response.setData(brandData);
		response.setTotalCount(brandData.size());
		return ResponseEntity.ok(response);
	}

	@Override
	public double fetchSapBalance(String fundCenter, String commitmentItem, String fiscalYear, String month)
			throws Exception {
		int adjustedFiscalYear = Integer.parseInt(fiscalYear);
		if (month.equalsIgnoreCase("january") || month.equalsIgnoreCase("february")
				|| month.equalsIgnoreCase("march")) {
			adjustedFiscalYear--;
		}
		String period = calculatePeriod(month, Integer.parseInt(fiscalYear));
		String url = sapBalanceUrl;
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		String auth = SAPUSER + ":" + SAPSECRET;
		byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes());
		String authHeader = "Basic " + new String(encodedAuth);
		headers.set("Authorization", authHeader);

		String requestBody = String.format(
				"[{\"fund_center\":\"%s\",\"commitment_item\":\"%s\",\"fiscal_year\":\"%s\",\"period\":\"%s\"}]",
				fundCenter, commitmentItem, adjustedFiscalYear, period);

		HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

		try {
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
			String responseBody = response.getBody();

			if (responseBody == null) {
				throw new RuntimeException("Response body is null");
			}

			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(responseBody);
			JsonNode balanceNode = root.path("Balance");

			return balanceNode.asDouble();

		} catch (HttpClientErrorException.Unauthorized e) {
			logger.severe("Unauthorized access - Invalid credentials: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid SAP credentials.");
		} catch (HttpClientErrorException.BadRequest e) {
			logger.severe("Bad request to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request parameters sent to SAP.");
		} catch (HttpClientErrorException.Forbidden e) {
			logger.severe("Access denied to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Error: Access denied. You don't have permission to access this resource.");
		} catch (HttpClientErrorException.NotFound e) {
			logger.severe("SAP endpoint not found: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Error: SAP endpoint not found.");
		} catch (HttpServerErrorException.InternalServerError e) {
			logger.severe("SAP internal server error: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Error: SAP encountered an internal error. Please try again later.");
		} catch (HttpClientErrorException | HttpServerErrorException e) {
			logger.severe("SAP request failed: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server error");
		} catch (RestClientException e) {
			logger.severe("Network error while connecting to SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
					"Error: Unable to connect to SAP. Please check your network.");
		} catch (Exception e) {
			logger.severe("Unexpected error fetching data from SAP: " + e.getMessage());
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error: " + e.getMessage());
		}
	}

	private String calculatePeriod(String month, int year) {
		String[] monthNames = {
				"april", "may", "june", "july", "august", "september",
				"october", "november", "december", "january", "february", "march"
		};

		int monthIndex = -1;
		for (int j = 0; j < monthNames.length; j++) {
			if (monthNames[j].equalsIgnoreCase(month)) {
				monthIndex = j;
				break;
			}
		}

		if (monthIndex == -1) {
			throw new IllegalArgumentException("Invalid month: " + month);
		}

		int periodYear = year;
		int periodNumber;

		if (monthIndex >= 0 && monthIndex <= 8) {

			periodNumber = monthIndex + 1;
		} else if (monthIndex >= 9 && monthIndex <= 11) {
			periodNumber = monthIndex + 1;
		} else {
			throw new IllegalArgumentException("Invalid month: " + month);
		}

		return "1," + periodNumber;
	}

	@Override
	public ResponseEntity<PaginatedResponse<NonBrandData>> getNonBrandDetails(String brandType, String division,
			String department, String location, String channel, String fundcenter) {

		List<NonBrandData> brandData = new ArrayList<>();

		if (brandType != null && division == null && department == null && location == null && fundcenter == null) {
			brandData = nonBrandRepository.findAll();
		} else if (brandType != null && division != null && department == null && location == null
				&& channel == null && fundcenter == null) {
			brandData = nonBrandRepository.findByDivision(division);
		} else if (brandType != null && division != null && department != null && location == null
				&& channel == null && fundcenter == null) {
			brandData = nonBrandRepository.findByDivisionAndDepartment(division, department);
		} else if (brandType != null && division != null && department != null && location != null
				&& channel == null && fundcenter == null) {
			brandData = nonBrandRepository.findByDivisionAndDepartmentAndLocation(division, department, location);
		}else if (brandType != null && division != null && department != null && location != null
				&& channel != null && fundcenter == null) {
			brandData = nonBrandRepository.findByDivisionAndDepartmentAndLocationAndChannel(division, department,
					location, channel);
		} else if (brandType != null && division != null && department != null && location != null
				&& channel != null && fundcenter != null) {
			brandData = nonBrandRepository.findByDivisionAndDepartmentAndLocationAndChannelAndFundcenter(division, department,
					location, channel, fundcenter);
		}
		PaginatedResponse<NonBrandData> response = new PaginatedResponse<>();
		response.setData(brandData);
		response.setTotalCount(brandData.size());
		return ResponseEntity.ok(response);
	}

	@Override
	public ResponseEntity<?> getVendorList(String vendorName, String location, String gstNo) {
		List<Vendor> vendors = new ArrayList<>();

		if (vendorName == null && location == null && gstNo == null) {
			vendors = vendorRepository.findAll();
		} else if (vendorName != null && location == null && gstNo == null) {
			vendors = vendorRepository.findByVendorName(vendorName);
		} else if (vendorName != null && location != null && gstNo == null) {
			vendors = vendorRepository.findByVendorNameAndLocation(vendorName, location);
		} else if (vendorName != null && location != null && gstNo != null) {
			vendors = vendorRepository.findByVendorNameAndLocationAndGstNo(vendorName, location, gstNo);
		}
		PaginatedResponse<Vendor> response = new PaginatedResponse<>();
		response.setData(vendors);
		response.setTotalCount(vendors.size());
		return ResponseEntity.ok(response);
	}

	@Override
	public ResponseEntity<PaginatedResponse<Vendor>> getVendorsPaginated(int page, int size, String search, String sortBy, String sortDir) {
		Query query = new Query();

		if (search != null && !search.isBlank()) {
			Criteria searchCriteria = new Criteria().orOperator(
					Criteria.where("vendorName").regex(search, "i"),
					Criteria.where("vendorCode").regex(search, "i"),
					Criteria.where("location").regex(search, "i"),
					Criteria.where("gstNo").regex(search, "i"),
					Criteria.where("mailId").regex(search, "i"),
					Criteria.where("currency").regex(search, "i"),
					Criteria.where("status").regex(search, "i")
			);
			query.addCriteria(searchCriteria);
		}

		String field = (sortBy != null && !sortBy.isBlank()) ? sortBy : "vendorName";
		Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
		query.with(Sort.by(direction, field));

		long totalCount = mongoTemplate.count(query, Vendor.class);
		query.skip((long) page * size).limit(size);
		List<Vendor> vendors = mongoTemplate.find(query, Vendor.class);

		return ResponseEntity.ok(new PaginatedResponse<>(vendors, totalCount));
	}

	@Override
	public Sap saveSap(Sap sapDetails) {

		return sapRepository.save(sapDetails);
	}

	@Override
	public List<Sap> getSapDetails() {

		return sapRepository.findAll();
	}

	@Override
	public byte[] getPoFileAsExcel(String id, List<String> poNums) throws Exception {

		Request_table request = requestRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
		String initiator = request.getUsername();

		String authHeader = "Basic " + new String(Base64.getEncoder().encode((SAPUSER + ":" + SAPSECRET).getBytes()));
		ObjectMapper mapper = new ObjectMapper();

		List<String> headers = new ArrayList<>();
		List<JsonNode> allRows = new ArrayList<>();

		for (String poNum : poNums) {
			try {
				HttpHeaders httpHeaders = new HttpHeaders();
				httpHeaders.setContentType(MediaType.APPLICATION_JSON);
				httpHeaders.set("Authorization", authHeader);

				String requestBody = String.format("[{\"po_num\":\"%s\"}]", poNum);
				HttpEntity<String> entity = new HttpEntity<>(requestBody, httpHeaders);

				ResponseEntity<String> response = restTemplate.exchange(sapPoFileUrl, HttpMethod.POST, entity,
						String.class);
				String responseBody = response.getBody();
				if (responseBody == null)
					continue;

				JsonNode root = mapper.readTree(responseBody);
				JsonNode dataNode = root.isArray() ? root : root.path("Data");

				if (!dataNode.isArray() || dataNode.size() == 0)
					continue;

				if (headers.isEmpty()) {
					Iterator<Map.Entry<String, JsonNode>> fields = dataNode.get(0).fields();
					while (fields.hasNext())
						headers.add(fields.next().getKey());
				}

				for (JsonNode row : dataNode)
					allRows.add(row);

			} catch (Exception e) {
				logger.severe("Error fetching PO: " + poNum + " - " + e.getMessage());
			}
		}

		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Sheet sheet = workbook.createSheet("PO Data");

			XSSFCellStyle headerStyle = (XSSFCellStyle) workbook.createCellStyle();
			Font font = workbook.createFont();
			font.setBold(true);
			headerStyle.setFont(font);
			byte[] rgb = new byte[]{(byte) 255, (byte) 230, (byte) 153};
			headerStyle.setFillForegroundColor(new XSSFColor(rgb, null));
			headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

			Row headerRow = sheet.createRow(0);
			for (int i = 0; i < headers.size(); i++) {
				Cell cell = headerRow.createCell(i);
				cell.setCellValue(headers.get(i));
				cell.setCellStyle(headerStyle);
			}
			Cell initiatorHeader = headerRow.createCell(headers.size());
			initiatorHeader.setCellValue("Initiator");
			initiatorHeader.setCellStyle(headerStyle);

			int rowIdx = 1;
			for (JsonNode item : allRows) {
				Row row = sheet.createRow(rowIdx++);
				for (int i = 0; i < headers.size(); i++) {
					row.createCell(i).setCellValue(item.path(headers.get(i)).asText(""));
				}
				row.createCell(headers.size()).setCellValue(initiator);
			}

			workbook.write(out);
			return out.toByteArray();
		}
	}
}
