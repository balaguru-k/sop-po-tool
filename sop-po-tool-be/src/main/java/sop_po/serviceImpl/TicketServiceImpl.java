package sop_po.serviceImpl;

import java.io.ByteArrayOutputStream;

import java.io.IOException;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.Year;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.bson.types.ObjectId;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;
import sop_po.entity.FileType;
import sop_po.entity.GlEntity;
import sop_po.entity.Vendor;
import sop_po.exception.NotFoundException;
import sop_po.jwt.JwtUtils;
import sop_po.model.EBrief;
import sop_po.model.Notifications;
import sop_po.model.budget.BudgetRange;
import sop_po.model.ticket_request.AttachmentWrapper;
import sop_po.model.ticket_request.Brand;
import sop_po.model.ticket_request.Egst;
import sop_po.model.ticket_request.Epo;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.History;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.User;
import sop_po.repository.BrandRepository;
import sop_po.repository.BudgetMasterRepository;
import sop_po.repository.EBriefRepository;
import sop_po.repository.GldetailsRepository;
import sop_po.repository.HistoryRepository;
import sop_po.repository.NotificationRepo;
import sop_po.repository.RequestRepository;
import sop_po.repository.UserRepository;
import sop_po.repository.VendorRepository;
import sop_po.request.Branddto;
import sop_po.request.CreateTicket;
import sop_po.response.ApiResponse;
import sop_po.response.EbriefTicketDto;
import sop_po.security.service.UserDetailsImpl;
import sop_po.service.FileService;
import sop_po.service.MailServiceAsync;
import sop_po.service.MailTemplateService;
import sop_po.service.TicketService;
import sop_po.service.TopicSubscriptionService;

@Service
@Slf4j
public class TicketServiceImpl implements TicketService {

	private static final Logger logger = LoggerFactory.getLogger(TicketServiceImpl.class);
	@Autowired
	private RequestRepository requestRepository;

	@Autowired
	private BrandRepository brandRepository;

	@Autowired
	private HistoryRepository historyRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;
	@Autowired
	private TopicSubscriptionService topicSubscriptionService;
	@Autowired
	private NotificationRepo notificationRepo;

	@Autowired
	private MongoTemplate mongoTemplate;

	@Autowired
	private MailTemplateService mailTemplateService;

	@Autowired
	private MailServiceAsync mailServiceAsync;

	@Autowired
	private FileService fileService;

	@Autowired
	private BudgetMasterRepository budgetRepository;

	@Autowired
	private GldetailsRepository gldetailsRepository;

	@Autowired
	private JwtUtils jwtUtils;

	@Autowired
	private EBriefRepository ebriefRepo;

	@Autowired
	private VendorRepository vendorRepo;

	@Value("${path.getPath}")
	private String getPath;

	@Value("${path.fileBasePath}")
	private String fileBasePath;

	@Value("${basic-auth.username}")
	private String basicAuthUsername;

	@Value("${basic-auth.password}")
	private String basicAuthPassword;

	private Map<String, String> validateBrandDto(Branddto brandDto, boolean isHemasVendor) {
		Map<String, String> validationErrors = new HashMap<>();

		// Skip validation for nonBrand Hema's vendor
		if (brandDto.getBrandOrNonBrand().equalsIgnoreCase("NonBrand") && isHemasVendor) {
			return validationErrors;
		}

		if (brandDto.getBrandOrNonBrand().equalsIgnoreCase("Brand")) {
			if (isInvalid(brandDto.getChannel())) {
				validationErrors.put("channel", "Channel is missing or invalid.");
			}
			if (isInvalid(brandDto.getRegion())) {
				validationErrors.put("region", "Region is missing or invalid.");
			}
			if (isInvalid(brandDto.getDivision())) {
				validationErrors.put("division", "Division is missing or invalid.");
			}
		} else if (brandDto.getBrandOrNonBrand().equalsIgnoreCase("NonBrand")) {
			if (!isHemasVendor) {
				if (isInvalid(brandDto.getDepartment())) {
					validationErrors.put("department", "Department is missing or invalid.");
				}
				if (isInvalid(brandDto.getLocation())) {
					validationErrors.put("location", "Location (Plant Code) is missing or invalid.");
				}
			}
		}

		if (!isHemasVendor || !brandDto.getBrandOrNonBrand().equalsIgnoreCase("NonBrand")) {
			if (isInvalid(brandDto.getDivision())) {
				validationErrors.put("division", "Division is missing or invalid.");
			}
		}
		if ("605105".equals(brandDto.getGlCode())) {
			if (brandDto.getMaterialPo() == null) {
				validationErrors.put("materialPo", "Material PO is required when GL code is 605105.");
			} else if (Boolean.TRUE.equals(brandDto.getMaterialPo())) {
				if (isInvalid(brandDto.getMaterialCode())) {
					validationErrors.put("materialCode", "Material Code is required");
				}
				if (isInvalid(brandDto.getDeliveryPlant())) {
					validationErrors.put("deliveryPlant", "Delivery Plant is required");
				}
			}
		}
		return validationErrors;
	}

	private Map<String, String> validateCreateTicket(CreateTicket ticket) {
		Map<String, String> validationError = new HashMap<>();

		long totalBaseValue = parseTotalBaseValue(ticket.getTotalBaseValue());
		if (totalBaseValue < 0) {
			validationError.put("totalBaseValue", "Value is invalid.");
		}

		boolean isBusinessApproverMissing = ticket.getBusinessApprover() == null
				|| ticket.getBusinessApprover().isEmpty();

		// Check if it's HEMA'S vendor with approvalType true
		boolean isHemasWithApprovalTrue = isNonBrandHemasVendor(ticket);

		boolean isCmdOfficeWithApprovalTrue = Boolean.TRUE.equals(ticket.getApprovalType())
				&& ticket.getBrand() != null && ticket.getBrand().stream()
						.anyMatch(b -> "NonBrand".equalsIgnoreCase(b.getBrandOrNonBrand())
								&& "102 CMD Office".equalsIgnoreCase(b.getDepartment()));

		if (isBusinessApproverMissing && !(ticket.isSelfApprove() && totalBaseValue <= 50000)
				&& !isHemasWithApprovalTrue && !isCmdOfficeWithApprovalTrue) {
			validationError.put("businessApprover", "Business Approver is missing.");
		}

		return validationError;
	}

	@Override
	public ResponseEntity<?> createTicket(CreateTicket newTicket, List<MultipartFile> attachments, Estatus status,
			Authentication authentication, String type) {
		Request_table requestTable = new Request_table();
		String data = null;
		Date currentDate = new Date();

		validateVendor(newTicket.getVendorCode());

		Map<String, String> validationError = validateCreateTicket(newTicket);
		Map<String, String> allValidationErrors = new HashMap<>(validationError);

		String id = jwtUtils.getUserId();
		String username = jwtUtils.getUserName();

		List<Brand> brands = new ArrayList<>();
		long totalBaseValue = 0L;

		String firstGlCode = null;
		boolean isGlCodeMismatch = false;

		boolean isHemasVendor = isNonBrandHemasVendor(newTicket);

		if (newTicket.getBrand() != null) {

			for (int i = 0; i < newTicket.getBrand().size(); i++) {
				Branddto brandDto = newTicket.getBrand().get(i);
				totalBaseValue += Optional.ofNullable(brandDto.getValue()).orElse(0L).longValue();
				Map<String, String> brandValidationErrors = validateBrandDto(brandDto, isHemasVendor);

				if (!brandValidationErrors.isEmpty()) {
					for (Map.Entry<String, String> entry : brandValidationErrors.entrySet()) {
						allValidationErrors.put("brand[" + i + "]." + entry.getKey(), entry.getValue());
					}
				}
				if (brandValidationErrors.isEmpty()) {
					Brand brand = createBrandFromDto(brandDto);
					brands.add(brand);

					String currentGlCode = brandDto.getGlCode();
					if (firstGlCode == null) {
						firstGlCode = currentGlCode;
					} else if (currentGlCode != null && !currentGlCode.equals(firstGlCode)) {
						isGlCodeMismatch = true;
					}
				}
			}
			if (isGlCodeMismatch) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"All brands must have the same GL code.");
			}
			// checkEbriefDuplicate(newTicket.getBrand(), null);
			if (newTicket.getBrand().size() == 1) {
				totalBaseValue = Optional.ofNullable(newTicket.getBrand().get(0).getValue()).orElse(0L).longValue();
			}
		} else {
			allValidationErrors.put("brandOrNonBrand", "Brand list is missing.");
		}

		boolean isNonBrandTicket = brands.stream()
				.anyMatch(brand -> "NonBrand".equalsIgnoreCase(brand.getBrandOrNonBrand()) ||
						"Non-Brand".equalsIgnoreCase(brand.getBrandOrNonBrand()));

		if (isNonBrandTicket) {
			if (isHemasVendor) {
				// For HEMA'S vendor, get totalBaseValue from newTicket and set in request_table
				totalBaseValue = parseTotalBaseValue(newTicket.getTotalBaseValue());

				if (newTicket.getApprovalType() == null) {
					allValidationErrors.put("approvalType",
							"ApprovalType is required for HEMA'S ENTERPRISES PRIVATE LIMITED.");
				} else if (Boolean.TRUE.equals(newTicket.getApprovalType())) {
					if (newTicket.getPreApprovedFiles() == null || newTicket.getPreApprovedFiles().isEmpty()) {
						allValidationErrors.put("preApprovedFile",
								"PreApproved file is required when approvalType is true.");
					} else {
						for (MultipartFile file : newTicket.getPreApprovedFiles()) {
							String fileName = file.getOriginalFilename();
							if (fileName == null || !fileName.toLowerCase().endsWith(".eml")) {
								allValidationErrors.put("preApprovedFile", "PreApproved file must be in .eml format.");
								break;
							}
						}
					}
				} else if (Boolean.FALSE.equals(newTicket.getApprovalType())) {
					if (newTicket.getBusinessApprover() == null || newTicket.getBusinessApprover().isEmpty()) {
						allValidationErrors.put("businessApprover",
								"Business Approver is required when approvalType is false.");
					}
				}
			} else {
				boolean isCmdOfficeApproved = Boolean.TRUE.equals(newTicket.getApprovalType())
						&& newTicket.getBrand().stream()
								.anyMatch(b -> "102 CMD Office".equalsIgnoreCase(b.getDepartment()));
				if (!isCmdOfficeApproved
						&& (newTicket.getBusinessApprover() == null || newTicket.getBusinessApprover().isEmpty())) {
					allValidationErrors.put("businessApprover", "Business Approver is required for nonBrand tickets.");
				}
			}
		}

		if (!allValidationErrors.isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("validationErrors", allValidationErrors));
		}
		String reqNo = generatereqNo();

		List<Brand> savedBrands = saveBrandDetails(brands);
		String selfApprover = saveRequestTable(requestTable, savedBrands, reqNo, totalBaseValue, id, firstGlCode,
				newTicket.getApprovalType(), isHemasVendor);
		// Set totalBaseValue in request_table for HEMA'S vendor
		if (isNonBrandTicket && isHemasVendor) {
			requestTable.setTotalBaseValue(totalBaseValue);
		}
		setupTicketDetails(requestTable, newTicket, totalBaseValue, username, currentDate, data);
		List<User> copyMailIds = new ArrayList<>();
		if (newTicket.getCopyMailIds() != null) {
			for (String mailId : newTicket.getCopyMailIds()) {
				User user = userRepository.findById(mailId)
						.orElseThrow(() -> new NotFoundException("User not found with id: " + mailId));
				copyMailIds.add(user);
			}
		}
		requestTable.setCopyMailIds(copyMailIds);

		sop_po.model.user.User businessApprover = null;
		String approverUsername = null;
		if (newTicket.getBusinessApprover() != null) {
			// Only check budget range for brand tickets
			if (!isNonBrandTicket) {
				BudgetRange budgetRange = budgetRepository.findByUserIdsAndValueInRange(
						newTicket.getBusinessApprover(),
						totalBaseValue, mongoTemplate);

				if (budgetRange == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Selected Business Approver not eligible for your total Base value");
				}
			}
			businessApprover = userRepository.findById(newTicket.getBusinessApprover())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
							"Business Approver not found"));
			approverUsername = businessApprover.getUsername();
			requestTable.setBusinessApprover(newTicket.getBusinessApprover());
			requestTable.setApproverUsername(approverUsername);
		}
		createAndSaveHistory(requestTable, username, status);

		List<String> attachmentPath = new ArrayList<>();
		if (attachments != null) {
			try {
				for (MultipartFile file : attachments) {
					String fileName = fileService.uploadFile(file, FileType.ATTACHMENTS);
					attachmentPath.add(fileName);
				}
				requestTable.setAttachment(attachmentPath);
			} catch (IOException e) {
				return ResponseEntity.status(500).body("Error storing attachments");
			}
		}

		if (isNonBrandTicket) {
			requestTable.setApprovalType(newTicket.getApprovalType());
			if (Boolean.TRUE.equals(newTicket.getApprovalType()) &&
					newTicket.getPreApprovedFiles() != null && !newTicket.getPreApprovedFiles().isEmpty()) {
				List<String> preapprovedFilePath = new ArrayList<>();
				try {
					for (MultipartFile file : newTicket.getPreApprovedFiles()) {
						String fileName = fileService.uploadFile(file, FileType.PREAPPROVED_FILE);
						preapprovedFilePath.add(fileName);
					}
					requestTable.setPreApprovedFiles(preapprovedFilePath);
				} catch (IOException e) {
					return ResponseEntity.status(500).body("Error storing preapproved files");
				}
			}
		}
		requestTable.setCreatedAt(currentDate);
		requestTable.setCreatedBy(id);
		requestTable.setUpdatedAt(currentDate);
		requestTable.setUpdatedBy(id);
		requestTable.setType(type);
		requestTable.setIsDeleted(false);
		requestTable = requestRepository.save(requestTable);
		sendNotificationsAndEmails(requestTable, selfApprover, copyMailIds, businessApprover, approverUsername, reqNo,
				status);
		return ResponseEntity.ok("Ticket created successfully");
	}

	private Brand createBrandFromDto(Branddto brandDto) {
		Brand brand = new Brand();

		if (brandDto.getActivityStartDate() != null) {
			LocalDate localStartDate = brandDto.getActivityStartDate().toInstant()
					.atZone(ZoneId.systemDefault())
					.toLocalDate();
			Date utcStartDate = Date.from(localStartDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
			brand.setActivityStartDate(utcStartDate);
		}

		if (brandDto.getActivityEndDate() != null) {
			LocalDate localEndDate = brandDto.getActivityEndDate().toInstant()
					.atZone(ZoneId.systemDefault())
					.toLocalDate();
			Date utcEndDate = Date.from(localEndDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
			brand.setActivityEndDate(utcEndDate);
		}

		brand.setBrandOrNonBrand(brandDto.getBrandOrNonBrand());
		brand.setChannel(brandDto.getChannel());
		brand.setCommitmentItem(brandDto.getCommitmentItem());
		brand.setDepartment(brandDto.getDepartment());
		brand.setLocation(brandDto.getLocation());
		brand.setDivision(brandDto.getDivision());
		brand.setMaterialGroup(brandDto.getMaterialGroup());
		brand.setNatureOfExpenses(brandDto.getNatureOfExpenses());
		brand.setRegion(brandDto.getRegion());
		brand.setPoDescription(brandDto.getPoDescription());
		brand.setValue(brandDto.getValue());
		brand.setInternalorder(brandDto.getInternalorder());
		brand.setCostcenter(brandDto.getCostcenter());
		brand.setFundCentre(brandDto.getFundCentre());
		brand.setGlCode(brandDto.getGlCode());
		brand.setGlDescription(brandDto.getGlDescription());
		brand.setDetailsBrand(brandDto.getDetailsBrand());
		brand.setIoOrCostCentreNumber(brandDto.getIoOrCostCentreNumber());
		brand.setIoOrCostCentrePo(brandDto.getIoOrCostCentrePo());
		brand.setYear(brandDto.getYear());
		brand.setCkplLocation(brandDto.getCkplLocation());
		brand.setGstType(brandDto.getGstType());
		brand.setMaterialPo(brandDto.getMaterialPo());
		if (brandDto.getMaterialCode() != null && !brandDto.getMaterialCode().trim().isEmpty()) {
			brand.setMaterialCode(brandDto.getMaterialCode());
			if (brandDto.getDeliveryPlant() == null || brandDto.getDeliveryPlant().trim().isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery Plant is required");
			}
			brand.setDeliveryPlant(brandDto.getDeliveryPlant());
		}
		brand.setMonth(brandDto.getMonth());
		brand.setDistrict(brandDto.getDistrict());
		brand.setBrandSubCategory(brandDto.getBrandSubCategory());
		brand.setSacHsnCode(brandDto.getSacHsnCode());
		brand.setIsDelete(false);
		if (brandDto.getEbriefId() != 0) {
			EBrief eBrief = ebriefRepo.findByActivityId(brandDto.getEbriefId()).orElse(null);
			brand.setEBrief(eBrief);
		} else {
			brand.setEBrief(null);
		}
		return brand;
	}

	private void setupTicketDetails(Request_table requestTable, CreateTicket newTicket, long totalBaseValue,
			String username, Date currentDate, String data) {

		requestTable.setBusinessApprover(Optional.ofNullable(newTicket.getBusinessApprover()).orElse(data));
		requestTable.setCurrency(Optional.ofNullable(newTicket.getCurrency()).orElse(data));
		requestTable.setGstNo(Optional.ofNullable(newTicket.getGstNo()).orElse(data));
		requestTable.setTotalBaseValue(totalBaseValue);
		requestTable.setPaymentTerm(Optional.ofNullable(newTicket.getPaymentTerm()).orElse(data));
		requestTable.setPoType(Optional.ofNullable(newTicket.getPoType()).orElse(Epo.Monthly_PO));
		requestTable.setVendorCode(newTicket.getVendorCode());
		requestTable.setAccountNumber(newTicket.getAccountNumber());
		requestTable.setVendorLocation(newTicket.getVendorLocation());
		requestTable.setVendorName(Optional.ofNullable(newTicket.getVendorName()).orElse(data));
		requestTable.setVendorMailId(Optional.ofNullable(newTicket.getVendorMailId()).orElse(data));
		requestTable.setCreatedBy(UserServiceImpl.getUserId());
		requestTable.setCreatedAt(currentDate);
		requestTable.setUpdatedAt(currentDate);
		requestTable.setUsername(username);
		requestTable.setStatus(Estatus.Ticket_Created);
		requestTable.setSelfApprove(newTicket.isSelfApprove());
		requestTable.setAdvance(newTicket.getAdvance());
		requestTable.setRoiDescription(newTicket.getRoiDescription());
		requestTable.setApprovalType(newTicket.getApprovalType());
		requestTable.setCkplLocation(newTicket.getCkplLocation());
	}

	private void createAndSaveHistory(Request_table requestTable, String username, Estatus status) {
		LocalDateTime currentDateNow = LocalDateTime.now();
		History history = new History();
		history.setIsDelete(false);
		history.setName(TicketStage.Requestor);
		history.setUsername(username);
		history.setStatus(status);
		history.setDate(currentDateNow);
		requestTable.addHistory(history);
		historyRepository.save(history);
	}

	private ResponseEntity<?> sendNotificationsAndEmails(Request_table requestTable, String selfApprover,
			List<User> copyMailIds, sop_po.model.user.User businessApprover, String approverUsername, String reqNo,
			Estatus status) {
		if (selfApprover.equals("true") || selfApprover.equals("preapproved")) {
			sendNotification(requestTable.getStage(), requestTable);
		} else {
			sendNotification(TicketStage.Business_Approver, requestTable);
		}

		List<String> ccMailIds = new ArrayList<>();
		for (User user : copyMailIds) {
			ccMailIds.add(user.getEmail());
		}
		ccMailIds.add("ashok.m@cavinkare.com");

		try {
			if (selfApprover.equals("true") || selfApprover.equals("preapproved")) {
				List<sop_po.model.user.User> users = userRepository.findByRolesAndType(requestTable.getStage(),
						requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);
				for (sop_po.model.user.User user : users) {
					String emailContent = mailTemplateService.approveMailTemplate(user.getUsername(),
							TicketStage.Requestor.toString(), requestTable,
							"A new ticket has been created with a total base value of ",
							"ticket submit by Requestor");
					mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
				}
			} else {
				String emailContent = mailTemplateService.approveMailTemplate(approverUsername,
						TicketStage.Requestor.toString(), requestTable,
						"A new ticket has been created with a total base value of ",
						"ticket submit by Requestor");
				mailServiceAsync.sendMail(emailContent, businessApprover.getEmail(), "Marketing Budget Request", null);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(200).body("Mail send failed");
		}

		if (isBrandTicket(requestTable)) {
			sop_po.model.user.User user = userRepository.findByUsername("Misha H").orElseThrow(
					() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
			try {
				String emailContent = mailTemplateService.guestMailTemplate(user.getUsername(),
						TicketStage.Requestor.toString(), requestTable,
						"A new ticket has been created with a total base value of ",
						requestTable.getStage().toString(), status.toString());
				mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", ccMailIds);
			} catch (Exception e) {
				e.printStackTrace();
				return ResponseEntity.status(200).body("Mail send failed");
			}
		}
		return null;
	}

	private List<Brand> saveBrandDetails(List<Brand> brands) {
		return brandRepository.saveAll(brands);
	}

	private String saveRequestTable(Request_table requestTable, List<Brand> brands, String reqNo, long totalBaseValue,
			String userId, String glCode, Boolean approvalType, boolean isHemasVendor) {
		requestTable.setBrand(brands);
		requestTable.setReqNo(reqNo);

		boolean isNonBrandTicket = brands.stream()
				.anyMatch(brand -> "NonBrand".equalsIgnoreCase(brand.getBrandOrNonBrand()) ||
						"Non-Brand".equalsIgnoreCase(brand.getBrandOrNonBrand()));

		if (isNonBrandTicket) {
			boolean hasCmdOfficeDept = brands.stream()
					.anyMatch(brand -> "102 CMD Office".equalsIgnoreCase(brand.getDepartment()));
			if (Boolean.TRUE.equals(approvalType) && hasCmdOfficeDept) {
				requestTable.setStage(TicketStage.Po_maker);
				return "preapproved";
			} else if (Boolean.TRUE.equals(approvalType) && isHemasVendor) {
				requestTable.setStage(TicketStage.Po_maker);
				return "preapproved";
			} else {
				requestTable.setStage(TicketStage.Business_Approver);
				return "false";
			}
		}

		String selfApprover = validateUserBudget(totalBaseValue, userId, glCode);
		if (selfApprover.equals("false")) {
			requestTable.setStage(TicketStage.Business_Approver);
		} else if (selfApprover.equals("true")) {
			requestTable.setStage(TicketStage.PO_Screening);
		} else {
			requestTable.setStage(TicketStage.Business_Approver);
		}
		return selfApprover;
	}

	@Override
	public ResponseEntity<?> createTicketDraft(CreateTicket newTicket, List<MultipartFile> attachments,
			Estatus status, String type, Authentication authentication) {

		String id = jwtUtils.getUserId();
		String username = jwtUtils.getUserName();
		Request_table requestTable = new Request_table();
		Date currentDate = new Date();
		List<Brand> brands = new ArrayList<>();
		long totalBaseValue = 0L;

		if (newTicket.getBrand() != null) {
			for (Branddto brandDto : newTicket.getBrand()) {
				totalBaseValue += Optional.ofNullable(brandDto.getValue()).orElse(0L);

				Brand brand = new Brand();
				if (brandDto.getActivityStartDate() != null) {
					LocalDate localStartDate = brandDto.getActivityStartDate().toInstant()
							.atZone(ZoneId.systemDefault())
							.toLocalDate();
					Date utcStartDate = Date.from(localStartDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
					brand.setActivityStartDate(utcStartDate);
				}
				if (brandDto.getActivityEndDate() != null) {
					LocalDate localEndDate = brandDto.getActivityEndDate().toInstant()
							.atZone(ZoneId.systemDefault())
							.toLocalDate();
					Date utcEndDate = Date.from(localEndDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
					brand.setActivityEndDate(utcEndDate);
				}

				brand.setBrandOrNonBrand(brandDto.getBrandOrNonBrand());
				brand.setChannel(brandDto.getChannel());
				brand.setCommitmentItem(brandDto.getCommitmentItem());
				brand.setDepartment(brandDto.getDepartment());
				brand.setLocation(brandDto.getLocation());
				brand.setDivision(brandDto.getDivision());
				brand.setMaterialGroup(brandDto.getMaterialGroup());
				brand.setNatureOfExpenses(brandDto.getNatureOfExpenses());
				brand.setRegion(brandDto.getRegion());
				brand.setValue(brandDto.getValue());
				brand.setPoDescription(brandDto.getPoDescription());
				brand.setCkplLocation(brandDto.getCkplLocation());
				brand.setGstType(brandDto.getGstType());
				brand.setMaterialPo(brandDto.getMaterialPo());
				if (brandDto.getMaterialCode() != null) {
					brand.setMaterialCode(brandDto.getMaterialCode());
					brand.setDeliveryPlant(brandDto.getDeliveryPlant());
				}
				brand.setCostcenter(brandDto.getCostcenter());
				brand.setFundCentre(brandDto.getFundCentre());
				brand.setInternalorder(brandDto.getInternalorder());
				brand.setGlCode(brandDto.getGlCode());
				brand.setGlDescription(brandDto.getGlDescription());
				brand.setDetailsBrand(brandDto.getDetailsBrand());
				brand.setIoOrCostCentreNumber(brandDto.getIoOrCostCentreNumber());
				brand.setIoOrCostCentrePo(brandDto.getIoOrCostCentrePo());
				brand.setYear(brandDto.getYear());
				brand.setMonth(brandDto.getMonth());
				brand.setDistrict(brandDto.getDistrict());
				brand.setBrandSubCategory(brandDto.getBrandSubCategory());
				brand.setSacHsnCode(brandDto.getSacHsnCode());
				brand.setIsDelete(false);
				if (brandDto.getEbriefId() != 0) {
					EBrief eBrief = ebriefRepo.findByActivityId(brandDto.getEbriefId()).orElse(null);
					brand.setEBrief(eBrief);
				} else {
					brand.setEBrief(null);
				}
				brands.add(brand);
			}
		}

		String reqNo = generatereqNo();
		requestTable.setReqNo(reqNo);
		requestTable.setBrand(brands);
		requestTable.setStage(TicketStage.Requestor);
		requestTable.setTotalBaseValue(totalBaseValue);
		requestTable.setCurrency(newTicket.getCurrency());
		requestTable.setGstNo(
				(newTicket.getGstNo() == null || newTicket.getGstNo().trim().isEmpty()) ? null : newTicket.getGstNo());
		requestTable.setBusinessApprover(newTicket.getBusinessApprover());
		requestTable.setPaymentTerm(newTicket.getPaymentTerm());
		requestTable.setPoType(newTicket.getPoType());
		requestTable.setVendorCode(newTicket.getVendorCode());
		requestTable.setAccountNumber(newTicket.getAccountNumber());
		requestTable.setVendorLocation(newTicket.getVendorLocation());
		requestTable.setVendorName(newTicket.getVendorName());
		requestTable.setVendorMailId(newTicket.getVendorMailId());
		requestTable.setUsername(username);
		requestTable.setCreatedBy(id);
		requestTable.setCreatedAt(currentDate);
		requestTable.setType(type);
		requestTable.setUpdatedAt(currentDate);
		requestTable.setStatus(status);
		requestTable.setAdvance(newTicket.getAdvance());
		requestTable.setRoiDescription(newTicket.getRoiDescription());
		requestTable.setIsDeleted(false);
		requestTable.setAccountNumber(newTicket.getAccountNumber());

		List<User> copyMailIds = new ArrayList<>();
		if (newTicket.getCopyMailIds() != null) {
			for (String mailId : newTicket.getCopyMailIds()) {
				User user = userRepository.findById(mailId)
						.orElseThrow(() -> new NotFoundException("User not found with id: " + mailId));
				copyMailIds.add(user);
			}
		}
		requestTable.setCopyMailIds(copyMailIds);
		String businessApproverId = requestTable.getBusinessApprover();
		String approverUsername = null;
		if (businessApproverId != null) {
			try {
				sop_po.model.user.User businessApprover = userRepository.findById(businessApproverId)
						.orElseThrow(() -> new Exception("Business Approver not found"));
				approverUsername = businessApprover.getUsername();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		requestTable.setApproverUsername(approverUsername);
		requestTable.setStatus(status);
		LocalDateTime currentDateNow = LocalDateTime.now();

		History history = new History();
		history.setIsDelete(false);
		history.setName(TicketStage.Requestor);
		history.setStatus(status);
		history.setDate(currentDateNow);
		requestTable.addHistory(history);

		// Save entities
		brandRepository.saveAll(brands);
		historyRepository.save(history);

		List<String> attachmentPath = new ArrayList<>();
		if (attachments != null) {
			try {
				for (MultipartFile file : attachments) {
					String fileName = fileService.uploadFile(file, FileType.ATTACHMENTS);
					attachmentPath.add(fileName);
				}
				requestTable.setAttachment(attachmentPath);
			} catch (IOException e) {
				return ResponseEntity.status(500).body("Error storing attachments");
			}
		}
		log.info("ticket draft Req No : " + reqNo + " " + LocalDateTime.now());
		requestRepository.save(requestTable);
		return ResponseEntity.ok("Draft ticket created successfully");
	}

	private boolean isInvalid(String field) {
		return field == null || field.trim().isEmpty();
	}

	// private boolean isInvalidValue(Long value) {
	// return value == null || value <= 0;
	// }

	// private boolean isValidEmail(String email) {
	// String emailRegex =
	// "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
	// return email != null && email.matches(emailRegex);
	// }
	private long parseTotalBaseValue(String totalBaseValueString) {
		if (totalBaseValueString == null || totalBaseValueString.trim().isEmpty()) {
			return 0L;
		}
		try {
			return Long.parseLong(totalBaseValueString);
		} catch (NumberFormatException e) {
			System.err.println("Error parsing total base value: " + e.getMessage());
			return 0L;
		}
	}

	public List<String> storeAttachment(List<MultipartFile> attachmentFiles, String subFolder) throws IOException {

		String basePath = "src/main/resources/static/assets/uploads";
		Path directoryPath = Paths.get(basePath, subFolder);
		Files.createDirectories(directoryPath);

		List<String> fileNames = new ArrayList<>();
		if (attachmentFiles != null) {
			for (MultipartFile file : attachmentFiles) {
				if (file != null && !file.isEmpty()) {
					String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
					String extension = "";
					int dotIndex = originalFilename.lastIndexOf('.');
					if (dotIndex > 0 && dotIndex < originalFilename.length() - 1) {
						extension = originalFilename.substring(dotIndex);
					}
					String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
					String newFilename = originalFilename.replace(extension, "") + "_" + timestamp + extension;
					Path filePath = directoryPath.resolve(newFilename);

					try (OutputStream outputStream = Files.newOutputStream(filePath)) {
						outputStream.write(file.getBytes());
						fileNames.add(newFilename);
					} catch (IOException e) {
						throw new IOException("Failed to store file " + originalFilename, e);
					}
				}
			}
		}

		return fileNames;
	}

	private String generatereqNo() {
		LocalDate today = LocalDate.now();
		String datePart = today.format(DateTimeFormatter.ofPattern("MMdd-yyyy"));
		String dateKey = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

		// Retry mechanism to handle race conditions
		int maxRetries = 5;
		for (int attempt = 0; attempt < maxRetries; attempt++) {
			try {
				String reqNo = generateUniqueReqNo(dateKey, datePart, today);
				if (reqNo != null && !isDuplicateReqNo(reqNo)) {
					return reqNo;
				}
				// If duplicate found, retry
				logger.warn("Duplicate reqNo detected: {}, retrying... (attempt {})", reqNo, attempt + 1);
			} catch (Exception e) {
				logger.warn("Error generating reqNo on attempt {}: {}", attempt + 1, e.getMessage());
			}

			// Small delay before retry to reduce contention
			try {
				Thread.sleep(10 + (attempt * 5)); // Progressive backoff
			} catch (InterruptedException ie) {
				Thread.currentThread().interrupt();
				break;
			}
		}

		// Fallback: generate with timestamp if all retries failed
		logger.error("Failed to generate unique reqNo after {} attempts, using timestamp fallback", maxRetries);
		return generateFallbackReqNo(datePart);
	}

	private String generateUniqueReqNo(String dateKey, String datePart, LocalDate today) {
		Query query = new Query(Criteria.where("_id").is("seq_" + dateKey));

		// Try to increment existing counter first
		Update incrementUpdate = new Update().inc("sequence", 1);
		FindAndModifyOptions incrementOptions = new FindAndModifyOptions()
				.returnNew(true)
				.upsert(false);

		Document counterDoc = mongoTemplate.findAndModify(query, incrementUpdate, incrementOptions, Document.class,
				"counters");

		// If counter doesn't exist, initialize it atomically
		if (counterDoc == null) {
			counterDoc = initializeCounter(query, dateKey, today, datePart);
		}

		if (counterDoc != null) {
			int sequence = ((Number) counterDoc.get("sequence")).intValue();
			return String.format("PO-%03d-%s", sequence, datePart);
		}

		return null;
	}

	private Document initializeCounter(Query query, String dateKey, LocalDate today, String datePart) {
		// Get the maximum sequence from existing requests
		int maxSequence = getMaxSequenceFromDB(today, datePart);

		// Use upsert with setOnInsert to handle race conditions
		Update initUpdate = new Update()
				.setOnInsert("sequence", maxSequence + 1)
				.setOnInsert("date", dateKey)
				.setOnInsert("createdAt", new Date());

		FindAndModifyOptions initOptions = new FindAndModifyOptions()
				.upsert(true)
				.returnNew(true);

		Document result = mongoTemplate.findAndModify(query, initUpdate, initOptions, Document.class, "counters");

		// If another thread created the counter, try incrementing again
		if (result != null && ((Number) result.get("sequence")).intValue() != maxSequence + 1) {
			Update incrementUpdate = new Update().inc("sequence", 1);
			FindAndModifyOptions incrementOptions = new FindAndModifyOptions().returnNew(true);
			result = mongoTemplate.findAndModify(query, incrementUpdate, incrementOptions, Document.class, "counters");
		}

		return result;
	}

	private boolean isDuplicateReqNo(String reqNo) {
		Query duplicateCheck = new Query(Criteria.where("reqNo").is(reqNo));
		return mongoTemplate.exists(duplicateCheck, Request_table.class);
	}

	private String generateFallbackReqNo(String datePart) {
		// Use current timestamp in milliseconds as unique identifier
		long timestamp = System.currentTimeMillis();
		String timestampStr = String.valueOf(timestamp).substring(8); // Last 5 digits
		return String.format("PO-T%s-%s", timestampStr, datePart);
	}

	private int getMaxSequenceFromDB(LocalDate today, String datePart) {
		// Use timezone-aware date conversion
		Date startOfDay = Date.from(today.atStartOfDay(ZoneId.systemDefault()).toInstant());
		Date endOfDay = Date.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

		// Create regex pattern that matches the exact format
		String escapedDatePart = datePart.replace("-", "\\-");
		String regexPattern = "^PO-\\d{3}-" + escapedDatePart + "$";

		// Use aggregation pipeline for better performance and accuracy
		Aggregation aggregation = Aggregation.newAggregation(
				// Match documents created today with correct reqNo pattern
				Aggregation.match(Criteria.where("createdAt")
						.gte(startOfDay).lt(endOfDay)
						.and("reqNo").regex(regexPattern)),

				// Project only the sequence number from reqNo, handling both normal and
				// fallback formats
				Aggregation.project()
						.andExpression(
								"cond(" +
										"regexMatch(reqNo, '^PO-T'), " + // Check if it's fallback format
										"0, " + // If fallback, use 0
										"toInt(arrayElemAt(split(reqNo, '-'), 1))" + // Otherwise extract sequence
										")")
						.as("sequenceNum"),

				// Group to find maximum sequence
				Aggregation.group().max("sequenceNum").as("maxSequence"));

		try {
			List<Document> results = mongoTemplate.aggregate(aggregation, "Request_table", Document.class)
					.getMappedResults();

			if (!results.isEmpty() && results.get(0).get("maxSequence") != null) {
				int maxSeq = ((Number) results.get(0).get("maxSequence")).intValue();
				logger.debug("Found max sequence: {} for date: {}", maxSeq, datePart);
				return maxSeq;
			}
		} catch (Exception e) {
			// Fallback to original method if aggregation fails
			logger.warn("Aggregation failed, falling back to manual parsing: {}", e.getMessage());
			return getMaxSequenceFallback(startOfDay, endOfDay, datePart);
		}

		logger.debug("No existing sequences found for date: {}", datePart);
		return 0;
	}

	private int getMaxSequenceFallback(Date startOfDay, Date endOfDay, String datePart) {
		Query requestQuery = new Query(Criteria.where("createdAt")
				.gte(startOfDay).lt(endOfDay)
				.and("reqNo").regex("^PO-\\d{3}-" + datePart.replace("-", "\\-") + "$"));

		// Only fetch reqNo field for better performance
		requestQuery.fields().include("reqNo");

		List<Request_table> todaysRequests = mongoTemplate.find(requestQuery, Request_table.class);

		int maxSequence = 0;
		for (Request_table request : todaysRequests) {
			if (request.getReqNo() != null) {
				try {
					String[] parts = request.getReqNo().split("-");
					if (parts.length >= 2) {
						int currentSequence = Integer.parseInt(parts[1]);
						maxSequence = Math.max(maxSequence, currentSequence);
					}
				} catch (NumberFormatException e) {
					// Skip invalid format
					logger.debug("Invalid reqNo format: {}", request.getReqNo());
				}
			}
		}
		return maxSequence;
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllTickets() {
		List<Request_table> requestTables = mongoTemplate.find(
				new Query(Criteria.where("isDeleted").ne(true)), Request_table.class);
		List<Request_table> requestTablesdata = new ArrayList<>();

		for (Request_table filteredRequestor : requestTables) {

			if (filteredRequestor.getHistoryList().stream()
					.anyMatch(history -> "Requestor".equals(history.getName().toString())
							&& "Approved".equals(history.getStatus().toString()))) {
				requestTablesdata.add(filteredRequestor);
			}
		}
		if (requestTablesdata.isEmpty()) {
			return ResponseEntity.noContent().build();
		} else {
			return ResponseEntity.ok(requestTablesdata);
		}
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllCompletedTicketsByStage(String stage, String ticketType,
			String sortDirection,
			Authentication authentication) {

		String id = jwtUtils.getUserId();
		String role = jwtUtils.getActiveRole();

		List<Request_table> requestTablesdata = requestRepository.findCompletedTicketsByStage(stage, ticketType, id,
				role, mongoTemplate);

		return requestTablesdata.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(requestTablesdata);
	}

	@Override
	public ResponseEntity<?> approveTicket(String ticketId, Estatus approvalStatus, String remarks,
			String stage, Authentication authentication) {

		String activeRole = jwtUtils.getActiveRole();
		if (approvalStatus != Estatus.Approved && (remarks == null || remarks.trim().isEmpty())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are required");
		}

		Request_table requestTable = requestRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Ticket not found with ID: " + ticketId));
		if (!activeRole.toString().equalsIgnoreCase(requestTable.getStage().toString())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Access denied for this stage");
		}
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		TicketStage currentStage = requestTable.getStage();
		boolean matches = Boolean.TRUE.equals(requestTable.getMatches());
		boolean isRelated = currentStage == TicketStage.Po_checker && Boolean.TRUE.equals(requestTable.getIsRelated());
		String hasBrand = requestTable.getBrand().isEmpty() ? null
				: requestTable.getBrand().get(0).getBrandOrNonBrand();

		TicketStage dragStage = "Brand".equalsIgnoreCase(hasBrand) ? dragStage(requestTable, approvalStatus, stage)
				: null;

		TicketStage nextStage = (dragStage != null) ? dragStage
				: getNextStage(currentStage, approvalStatus, hasBrand, matches,
						isRelated, requestTable.getTotalBaseValue(), requestTable.getHistoryList(), requestTable);

		if (nextStage == null) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Invalid transition from stage: " + currentStage);
		}

		updateTicketAndHistory(requestTable, currentStage, nextStage, approvalStatus, remarks,
				userDetails);

		sendNotification(nextStage, requestTable);
		try {
			boolean emailSent = sendEmailBasedOnStatus(requestTable, currentStage, nextStage, approvalStatus, remarks);
			if (!emailSent) {
				return ResponseEntity.ok("Ticket processed but email failed");
			}
		} catch (Exception e) {
			return ResponseEntity.ok("Ticket processed but email failed: " + e.getMessage());
		}

		return ResponseEntity.ok("Ticket " + (approvalStatus == Estatus.Approved ? "approved" : "denied")
				+ " and moved to the next stage: " + nextStage);
	}

	private void updateTicketAndHistory(Request_table requestTable, TicketStage currentStage, TicketStage nextStage,
			Estatus approvalStatus, String remarks, UserDetailsImpl userDetails) {
		LocalDateTime now = LocalDateTime.now();

		History history = new History();
		history.setIsDelete(false);
		history.setName(currentStage);
		history.setUsername(userDetails.getUsername());
		history.setStatus(approvalStatus);
		history.setRemarks(remarks);
		history.setDate(now);

		requestTable.setStage(nextStage);
		requestTable.addHistory(history);
		requestTable.setStatus(approvalStatus);
		requestTable.setUpdatedAt(new Date());
		requestTable.setUpdatedBy(userDetails.getId());

		historyRepository.save(history);
		requestRepository.save(requestTable);
	}

	private boolean sendEmailBasedOnStatus(Request_table requestTable, TicketStage currentStage, TicketStage nextStage,
			Estatus approvalStatus, String remarks) throws Exception {
		if (approvalStatus == Estatus.Approved) {
			if (currentStage == TicketStage.Po_checker && requestTable.getPoApprover() != null) {
				return sendPoCheckerEmail(requestTable, currentStage, approvalStatus, remarks, nextStage);
			} else if (currentStage != TicketStage.Po_checker) {
				return sendApprovalEmail(requestTable, currentStage, approvalStatus, remarks, nextStage);
			}
		} else {
			return sendRejectEmail(requestTable, currentStage, approvalStatus, remarks, nextStage);
		}
		return true;
	}

	private boolean sendApprovalEmail(Request_table requestTable, TicketStage currentStage, Estatus approvalStatus,
			String remarks, TicketStage nextStage) throws Exception {
		try {
			if (nextStage == TicketStage.Budget_Team) {
				String emailContent = mailTemplateService.approveMailTemplate(
						"Budget Team",
						currentStage.toString(), requestTable,
						"A new ticket has been created with a total base value of ",
						remarks);
				mailServiceAsync.sendMail(emailContent, "foh_budget@hepl.com", "Marketing Budget Request", null);
			} else {
				List<sop_po.model.user.User> users = userRepository.findByRolesAndType(nextStage,
						requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);
				for (sop_po.model.user.User user : users) {
					String emailContent = mailTemplateService.approveMailTemplate(
							user.getUsername(),
							currentStage.toString(), requestTable,
							"A new ticket has been created with a total base value of ",
							remarks);

					mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
				}
			}
			return true;
		} catch (Exception e) {
			throw new RuntimeException("Email sending failed: " + e.getMessage());
		}
	}

	private boolean sendPoCheckerEmail(Request_table requestTable, TicketStage currentStage, Estatus approvalStatus,
			String remarks, TicketStage nextStage) throws Exception {
		try {
			if (nextStage.equals(TicketStage.Po_release)) {
				User poApprover = userRepository.findById(requestTable.getPoApproverId())
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
				List<String> ccEmail = new ArrayList<>();
				if ("Ranjith".equalsIgnoreCase(poApprover.getUsername())) {
					ccEmail.add("hganesh@cavinkare.com");
				}

				try {
					String emailContent = mailTemplateService.approveMailTemplate(
							poApprover.getUsername(),
							currentStage.toString(), requestTable,
							"A new ticket has been created with a total base value of ",
							remarks);

					mailServiceAsync.sendMail(emailContent, poApprover.getEmail(), "Marketing Budget Request", ccEmail);
				} catch (Exception e) {
					System.err.println("Failed to send email to " + poApprover.getEmail() + ": " + e.getMessage());
				}

			} else {
				List<User> users = userRepository.findByRolesAndType(nextStage,
						requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);

				for (User user : users) {
					try {
						String emailContent = mailTemplateService.approveMailTemplate(
								user.getUsername(),
								currentStage.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								remarks);

						mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
					} catch (Exception e) {
						System.err.println("Failed to send email to " + user.getEmail() + ": " + e.getMessage());
					}
				}
			}

			return true;
		} catch (Exception e) {
			throw new RuntimeException("Email sending failed: " + e.getMessage());
		}
	}

	private boolean sendRejectEmail(Request_table requestTable, TicketStage currentStage, Estatus approvalStatus,
			String remarks, TicketStage nextStage) throws Exception {
		try {
			if (nextStage.equals(TicketStage.Requestor)) {
				User requestor = userRepository.findById(requestTable.getCreatedBy())
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

				String emailContent = mailTemplateService.rejectMailTemplate(
						requestor.getUsername(),
						currentStage.toString(), requestTable,
						"A ticket has been rejected with a total base value of ",
						remarks);

				mailServiceAsync.sendMail(emailContent, requestor.getEmail(), "Marketing Budget Request", null);
				return true;
			}

			List<sop_po.model.user.User> users = userRepository.findByRolesAndType(nextStage,
					requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);
			for (sop_po.model.user.User user : users) {
				String emailContent = mailTemplateService.rejectMailTemplate(
						user.getUsername(),
						currentStage.toString(), requestTable,
						"A new ticket has been created with a total base value of ",
						remarks);

				mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
			}
			return true;
		} catch (Exception e) {
			throw new RuntimeException("Email sending failed: " + e.getMessage());
		}
	}

	private TicketStage getNextStage(TicketStage currentStage, Estatus approvalStatus, String brandOrNonBrand,
			Boolean matches, boolean IsRelated, long totalBaseValue, List<History> histories,
			Request_table requestTable) {
		switch (currentStage) {
			case Business_Approver:
				if (approvalStatus == Estatus.Approved) {
					return "NonBrand".equals(brandOrNonBrand) ? TicketStage.Po_maker : TicketStage.PO_Screening;
				} else {
					return TicketStage.Requestor;
				}
			case PO_Screening:
				boolean revertToPoMaker = false;
				boolean revertToBudgetReleaseTeam = false;
				if (approvalStatus == Estatus.Approved && histories != null && !histories.isEmpty()) {
					History lastHistory = histories.get(histories.size() - 1);
					if (lastHistory.getStatus() == Estatus.Reject && lastHistory.getName() == TicketStage.Po_maker) {
						revertToPoMaker = true;
					}
					if (lastHistory.getStatus() == Estatus.Reject
							&& lastHistory.getName() == TicketStage.Budget_release_team) {
						revertToBudgetReleaseTeam = true;
					}
					if (revertToBudgetReleaseTeam) {
						return TicketStage.Budget_release_team;
					}
				}
				if (revertToPoMaker) {
					return TicketStage.Po_maker;
				}
				if ("NonBrand".equals(brandOrNonBrand) && matches == false && approvalStatus == Estatus.Approved) {
					return TicketStage.Po_maker;
				} else if (approvalStatus == Estatus.Reject) {
					return TicketStage.Requestor;
				}
				return "Brand".equals(brandOrNonBrand) ? TicketStage.Budget_Team : TicketStage.Po_maker;
			case Po_release:
				return TicketStage.Po_maker;
			case Po_maker:
				return TicketStage.Po_checker;
			case Po_checker:
				if (approvalStatus == Estatus.Reject) {
					return TicketStage.Po_maker;
				}
				if (approvalStatus == Estatus.Approved) {
					Boolean related = requestTable.getIsRelated();
					if (Boolean.TRUE.equals(related)) {
						return TicketStage.Po_release;
					} else {
						return TicketStage.Po_maker;
					}
				}
				return TicketStage.Completed;
			default:
				return null;
		}
	}

	private TicketStage dragStage(Request_table requestTable, Estatus status, String stage) {

		if (stage == null || stage.trim().isEmpty()) {
			return null;
		}

		TicketStage dragStage = null;
		User user = userRepository.findById(stage).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with ID: " + stage));
		List<History> histories = requestTable.getHistoryList();
		History lasHistory = histories.get(histories.size() - 1);
		TicketStage currentstage = requestTable.getStage();

		boolean isNonBrand = isNonBrandTicket(requestTable);
		if (isNonBrand && currentstage.equals(TicketStage.Po_maker) &&
				requestTable.getStatus().equals(Estatus.Reject)) {
			History budgetTeamHistory = null;
			for (int i = histories.size() - 1; i >= 0; i--) {
				History history = histories.get(i);
				if (history.getName() == TicketStage.Budget_Team) {
					budgetTeamHistory = history;
					break;
				}
			}

			if (budgetTeamHistory != null && budgetTeamHistory.getStatus() == Estatus.Approved) {
				if (user.getRoles().contains(TicketStage.Budget_Team.toString())) {
					return TicketStage.Budget_Team;
				} else if (user.getRoles().contains(TicketStage.Requestor.toString())) {
					return TicketStage.Requestor;
				}
			}
			return null;
		}

		// Existing Brand ticket logic
		if (user.getRoles().contains(TicketStage.Po_maker.toString())) {
			if (currentstage.equals(TicketStage.PO_Screening) &&
					requestTable.getStatus().equals(Estatus.Reject) &&
					requestTable.getDocNum() != null &&
					status.equals(Estatus.Approved) &&
					lasHistory.getName().equals(TicketStage.Budget_Team)) {

				dragStage = TicketStage.Po_maker;
			}
		}
		if (user.getRoles().contains(TicketStage.PO_Screening.toString())) {
			if (currentstage.equals(TicketStage.Po_maker) &&
					requestTable.getStatus().equals(Estatus.Approved) &&
					status.equals(Estatus.Reject) &&
					(lasHistory.getName().equals(TicketStage.Budget_Team) ||
							lasHistory.getName().equals(TicketStage.PO_Screening))) {

				dragStage = TicketStage.PO_Screening;
			} else if (currentstage.equals(TicketStage.Po_maker) &&
					requestTable.getStatus().equals(Estatus.Reject) &&
					status.equals(Estatus.Reject) &&
					(lasHistory.getName().equals(TicketStage.Po_checker) ||
							lasHistory.getName().equals(TicketStage.Po_release))) {

				dragStage = TicketStage.PO_Screening;
			}
		} else if (user.getRoles().contains(TicketStage.Budget_Team.toString())) {
			if (currentstage.equals(TicketStage.Po_maker) &&
					requestTable.getStatus().equals(Estatus.Approved) &&
					status.equals(Estatus.Reject) &&
					(lasHistory.getName().equals(TicketStage.Budget_Team) ||
							lasHistory.getName().equals(TicketStage.PO_Screening))) {

				dragStage = TicketStage.Budget_Team;
			} else if (currentstage.equals(TicketStage.Po_maker) &&
					requestTable.getStatus().equals(Estatus.Reject) &&
					status.equals(Estatus.Reject) &&
					(lasHistory.getName().equals(TicketStage.Po_checker) ||
							lasHistory.getName().equals(TicketStage.Po_release))) {

				dragStage = TicketStage.Budget_Team;
			}
		} else if ((user.getRoles().contains(TicketStage.Po_checker.toString()))
				|| (user.getRoles().contains(TicketStage.Po_release.toString()))) {
			if (currentstage.equals(TicketStage.Po_maker) &&
					requestTable.getStatus().equals(Estatus.Reject) &&
					status.equals(Estatus.Approved) &&
					(lasHistory.getName().equals(TicketStage.Po_checker) ||
							lasHistory.getName().equals(TicketStage.Po_release))) {

				if (user.getRoles().contains(TicketStage.Po_checker.toString())) {
					dragStage = TicketStage.Po_checker;
				} else if (user.getRoles().contains(TicketStage.Po_release.toString())) {
					dragStage = TicketStage.Po_release;
				}
			}
		}

		return dragStage;
	}

	private void sendNotification(TicketStage nextStage, Request_table requestTable) {

		switch (nextStage) {

			case Requestor: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Requestor")) {
					messagingTemplate.convertAndSend("/topic/Requestor", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Business_Approver: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/requestTable")) {
					messagingTemplate.convertAndSend("/topic/requestTable", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case PO_Screening: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/PO_Screening")) {
					messagingTemplate.convertAndSend("/topic/PO_Screening", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Po_release: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Po_release")) {
					messagingTemplate.convertAndSend("/topic/Po_release", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Po_maker: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Po_maker")) {
					messagingTemplate.convertAndSend("/topic/Po_maker", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Po_checker: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Po_checker")) {
					messagingTemplate.convertAndSend("/topic/Po_checker", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Budget_Team: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Budget_Team")) {
					messagingTemplate.convertAndSend("/topic/Budget_Team", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Business_head: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Division_head")) {
					messagingTemplate.convertAndSend("/topic/Division_head", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
			case Budget_release_team: {
				if (topicSubscriptionService.isTopicSubscribed("/topic/Budget_release_team")) {
					messagingTemplate.convertAndSend("/topic/Budget_release_team", requestTable);
					storeOnLineNotifications(nextStage, requestTable);
					break;
				} else {
					storeOffLineNotifications(nextStage, requestTable);
					break;
				}
			}
		}
	}

	public void storeOffLineNotifications(TicketStage nextStage, Request_table requestTable) {
		String ticketType = getTicketType(requestTable);
		Notifications notification = new Notifications();
		notification.setTicketId(requestTable.getId());
		notification.setMessage(requestTable.getReqNo());
		notification.setRole(nextStage.toString());
		notification.setTicketType(ticketType);
		notification.setIsRead(false);
		notification.setIsText(false);

		if (nextStage == TicketStage.Requestor) {
			notification.setUserid(requestTable.getCreatedBy());
		} else if (nextStage == TicketStage.Business_Approver) {
			notification.setUserid(requestTable.getBusinessApprover());
		} else if (nextStage == TicketStage.Po_release) {
			notification.setUserid(requestTable.getPoApproverId());
		}

		notificationRepo.save(notification);
	}

	public void storeOnLineNotifications(TicketStage nextStage, Request_table requestTable) {
		String ticketType = getTicketType(requestTable);
		Notifications notification = new Notifications();
		notification.setTicketId(requestTable.getId());
		notification.setMessage(requestTable.getReqNo());
		notification.setRole(nextStage.toString());
		notification.setTicketType(ticketType);
		notification.setIsRead(false);
		notification.setIsText(false);

		if (nextStage == TicketStage.Requestor) {
			notification.setUserid(requestTable.getCreatedBy());
		} else if (nextStage == TicketStage.Business_Approver) {
			notification.setUserid(requestTable.getBusinessApprover());
		} else if (nextStage == TicketStage.Po_release) {
			notification.setUserid(requestTable.getPoApproverId());
		}

		notificationRepo.save(notification);
	}

	private String getTicketType(Request_table requestTable) {
		if (requestTable.getBrand() != null && !requestTable.getBrand().isEmpty()) {
			String brandOrNonBrand = requestTable.getBrand().get(0).getBrandOrNonBrand();
			return "NonBrand".equalsIgnoreCase(brandOrNonBrand) ? "NonBrand" : "Brand";
		}
		return "Brand";
	}

	@Override
	public ResponseEntity<?> approveTicketByBudgetTeam(String ticketId, Estatus approvalStatus, String docNum,
			String remarks, Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String id = userDetails.getId();
		String username = userDetails.getUsername();
		String activeRole = jwtUtils.getActiveRole();
		Request_table requestTable = requestRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Ticket not found with ID: " + ticketId));
		if (!activeRole.toString().equalsIgnoreCase(requestTable.getStage().toString())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Access denied for this stage");
		}
		TicketStage currentStage = requestTable.getStage();
		TicketStage nextStage = getNextStageforBT(currentStage, approvalStatus, requestTable);

		if (nextStage == null) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Invalid transition from stage: " + currentStage);
		}

		if (approvalStatus != Estatus.Approved && (remarks == null || remarks.trim().isEmpty())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks is required.");
		}
		if (approvalStatus == Estatus.Approved && (docNum == null || docNum.trim().isEmpty())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document number is required.");
		}

		LocalDateTime currentDateNow = LocalDateTime.now();
		requestTable.setStage(nextStage);
		requestTable.setDocNum(docNum);
		requestTable.setStatus(approvalStatus);
		requestTable.setUpdatedAt(new Date());
		requestTable.setUpdatedBy(userDetails.getId());

		History history = new History();
		history.setIsDelete(false);
		history.setName(currentStage);
		history.setUsername(username);
		history.setStatus(approvalStatus);
		history.setRemarks(remarks);
		history.setDate(currentDateNow);
		requestTable.addHistory(history);

		historyRepository.save(history);
		requestRepository.save(requestTable);

		sendNotification(nextStage, requestTable);

		sendEmails(requestTable, currentStage, nextStage, approvalStatus, remarks);

		return ResponseEntity.ok("Ticket " + (approvalStatus == Estatus.Approved ? "approved" : "denied")
				+ " and moved to the next stage: " + nextStage);
	}

	private void sendEmails(Request_table requestTable, TicketStage currentStage,
			TicketStage nextStage, Estatus approvalStatus, String remarks) {
		try {
			List<sop_po.model.user.User> users = userRepository.findByRolesAndType(nextStage,
					requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);
			boolean isApproved = approvalStatus == Estatus.Approved;

			for (sop_po.model.user.User user : users) {
				String emailContent = isApproved
						? mailTemplateService.approveMailTemplate(user.getUsername(),
								currentStage.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								remarks)
						: mailTemplateService.rejectMailTemplate(user.getUsername(),
								currentStage.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								remarks);
				mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	private TicketStage getNextStageforBT(TicketStage currentStage, Estatus approvalStatus,
			Request_table requestTable) {

		switch (currentStage) {
			case Budget_Team:
				if (isNonBrandTicket(requestTable)) {
					return TicketStage.Po_maker;
				}
				if (approvalStatus == Estatus.Approved) {
					return TicketStage.Po_maker;
				} else if (approvalStatus == Estatus.Reject) {
					return TicketStage.PO_Screening;
				}
			default:
				return null;
		}
	}

	@Override
	public ResponseEntity<?> approveTicketByDivisionHead(String ticketId, Estatus approvalStatus,
			String remarks, Authentication authentication) {

		Optional<Request_table> optionalRequestTable = requestRepository.findById(ticketId);
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String username = userDetails.getUsername();

		if (approvalStatus.equals(Estatus.Reject)) {
			if (remarks == null || remarks.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks is required");
			}
		}

		if (optionalRequestTable.isPresent()) {
			Request_table requestTable = optionalRequestTable.get();
			TicketStage currentStage = requestTable.getStage();
			TicketStage nextStage = getNextStageforDivisionHead(currentStage, approvalStatus);

			LocalDateTime currentDateNow = LocalDateTime.now();
			Date currentDate = new Date();
			if (nextStage != null) {
				// Brand brand =
				// brandRepository.findById(requestTable.getBrand().getBrandid()).orElse(null);
				requestTable.setStage(nextStage);
				History history = new History();
				history.setIsDelete(false);
				history.setName(currentStage);
				history.setUsername(username);
				history.setStatus(approvalStatus);
				history.setRemarks(remarks);
				history.setDate(currentDateNow);
				requestTable.addHistory(history);

				historyRepository.save(history);
				// brandRepository.save(brand);
				requestTable.setStatus(approvalStatus);
				requestTable.setUpdatedAt(currentDate);
				requestTable.setUpdatedBy(userDetails.getId());
				requestRepository.save(requestTable);

				if (approvalStatus == Estatus.Approved) {
					sendNotification(nextStage, requestTable);
				}
				if (approvalStatus == Estatus.Reject) {
					sendNotification(nextStage, requestTable);
				}
				List<sop_po.model.user.User> users = userRepository.findAllByRoles(nextStage, mongoTemplate);
				sop_po.model.user.User guest = userRepository.findByUsername("Misha H").orElseThrow(
						() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
				try {
					if (approvalStatus == Estatus.Approved) {
						for (sop_po.model.user.User user : users) {
							String emailContent = mailTemplateService.approveMailTemplate(
									user.getUsername(), currentStage.toString(), requestTable,
									"A new ticket has been created with a total base value of ",
									remarks);
							mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
						}
						String emailContent = mailTemplateService.guestMailTemplate(
								guest.getUsername(),
								TicketStage.Requestor.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								TicketStage.Business_head.toString(), approvalStatus.toString());

						mailServiceAsync.sendMail(emailContent, guest.getEmail(), "Marketing Budget Request",
								null);
					} else {
						for (sop_po.model.user.User user : users) {
							String emailContent = mailTemplateService.rejectMailTemplate(
									user.getUsername(), currentStage.toString(), requestTable,
									"A new ticket has been created with a total base value of ",
									remarks);
							mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
						}
					}
				} catch (Exception e) {
					e.printStackTrace();
					return ResponseEntity.status(200)
							.body("Mail send failed");
				}

				return ResponseEntity.ok("Ticket " + (approvalStatus == Estatus.Approved ? "approved" : "denied")
						+ " and moved to the next stage: " + nextStage);
			} else {
				return ResponseEntity.status(500).body("Invalid transition from stage: " + currentStage);
			}
		} else {
			return ResponseEntity.status(404).body("Ticket not found with ID: " + ticketId);
		}
	}

	private TicketStage getNextStageforDivisionHead(TicketStage currentStage, Estatus approvalStatus) {
		switch (currentStage) {
			case Business_head:
				if (approvalStatus == Estatus.Reject) {
					return TicketStage.Budget_Team;
				}
				return TicketStage.Budget_release_team;
			case Budget_release_team:
				if (approvalStatus == Estatus.Reject) {
					return TicketStage.PO_Screening;
				}
				return TicketStage.Po_maker;
			default:
				return null;
		}
	}

	public ResponseEntity<List<Request_table>> getAllByRequestorStage() {
		ResponseEntity<List<Request_table>> responseEntity = getAllTickets();
		List<Request_table> filteredRequestor = responseEntity.getBody().stream().filter(ticket -> {
			TicketStage stage = ticket.getStage();
			boolean isRequestor = TicketStage.Requestor.equals(stage);
			return isRequestor;
		}).collect(Collectors.toList());
		logger.info("Number of tickets after filtering: {}", responseEntity.getBody().size());
		logger.info("Number of tickets after filtering: {}", filteredRequestor.size());

		return ResponseEntity.ok(filteredRequestor);
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllByBaApproverStage(String id, String ticketType) {
		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		List<Request_table> tickets;
		if (ticketType != null && !ticketType.isEmpty()) {
			Aggregation aggregation = Aggregation.newAggregation(
					Aggregation.match(Criteria.where("isDeleted").ne(true)),
					Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
					Aggregation.match(Criteria.where("stage").is(TicketStage.Business_Approver)
							.and("businessApprover").is(id)
							.and("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")));
			tickets = mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
		} else {
			tickets = requestRepository.findByStageAndBusinessApprover("Business_Approver", id);
		}

		List<Request_table> filteredRequestor = tickets.stream()
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));
					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.sorted(Comparator
						.<Request_table, Boolean>comparing(
								ticket -> !"reject".equalsIgnoreCase(ticket.getStatus().toString()))
						.thenComparing(Comparator.comparing(Request_table::getUpdatedAt,
								Comparator.nullsLast(Comparator.reverseOrder()))))
				.collect(Collectors.toList());

		return ResponseEntity.ok(filteredRequestor);
	}

	public ResponseEntity<List<Request_table>> getAllByPoScreeningStage(String ticektType) {
		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");
		List<Request_table> tickets = requestRepository.findByStage(TicketStage.PO_Screening.toString());

		List<Request_table> result = tickets.stream()
				.filter(ticket -> ticektType == null || ticektType.isEmpty() ||
						ticektType.equalsIgnoreCase(ticket.getBrandOrNonBrand()))
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));
					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.sorted(Comparator
						.<Request_table, Boolean>comparing(
								ticket -> !"reject".equalsIgnoreCase(ticket.getStatus().toString()))
						.thenComparing(Comparator.comparing(Request_table::getUpdatedAt,
								Comparator.nullsLast(Comparator.reverseOrder()))))
				.collect(Collectors.toList());
		return ResponseEntity.ok(result);
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllByBRTStage() {
		// Get all tickets
		ResponseEntity<List<Request_table>> responseEntity = getAllTickets();
		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		// Filter tickets by the Budget Release Team stage
		List<Request_table> filteredRequestor = responseEntity.getBody().stream()
				.filter(ticket -> {
					TicketStage stage = ticket.getStage();
					return TicketStage.Budget_release_team.equals(stage);
				})
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));

					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.sorted(Comparator
						.<Request_table, Boolean>comparing(
								ticket -> !"reject".equalsIgnoreCase(ticket.getStatus().toString()))
						.thenComparing(Comparator.comparing(Request_table::getUpdatedAt,
								Comparator.nullsLast(Comparator.reverseOrder()))))
				.collect(Collectors.toList());
		return ResponseEntity.ok(filteredRequestor);
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllByCommonStage(String stageName, String ticketType, String search,
			String status,
			String sortDirection, Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String id = userDetails.getId();

		Criteria criteria;

		if (TicketStage.Requestor.toString().equals(stageName)) {
			criteria = Criteria.where("createdBy").is(id).and("status").ne(Estatus.Completed).and("isDeleted").ne(true);
		} else {
			criteria = Criteria.where("stage").is(stageName).and("isDeleted").ne(true);
			if (TicketStage.Business_Approver.toString().equals(stageName)) {
				criteria = criteria.and("businessApprover").is(id);
			} else if (TicketStage.Po_release.toString().equals(stageName)) {
				criteria = criteria.and("poApproverId").is(id);
			}
		}

		List<Request_table> tickets;
		if (ticketType != null && !ticketType.isEmpty()) {
			Aggregation aggregation = Aggregation.newAggregation(
					Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
					Aggregation
							.match(Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")),
					Aggregation.match(criteria));
			tickets = mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
		} else {
			tickets = mongoTemplate.find(new Query(criteria), Request_table.class);
		}

		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		List<Request_table> filteredRequestor = tickets.stream()
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));
					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.collect(Collectors.toList());

		if (status != null && !status.isEmpty()) {
			filteredRequestor = filteredRequestor.stream()
					.filter(ticket -> ticket.getStatus() != null &&
							status.trim().equalsIgnoreCase(ticket.getStatus().toString().trim()))
					.collect(Collectors.toList());
		}

		if ("Po_maker".equalsIgnoreCase(stageName)) {
			filteredRequestor = filteredRequestor.stream()
					.filter(ticket -> ticket.getStatus() != null &&
							(ticket.getStatus().toString().equalsIgnoreCase(Estatus.Approved.toString()) ||
									ticket.getStatus().toString().equalsIgnoreCase(Estatus.Ticket_Created.toString()) ||
									ticket.getStatus().toString().equalsIgnoreCase(Estatus.Submit.toString()) ||
									ticket.getStatus().toString().equalsIgnoreCase(Estatus.Reject.toString())))
					.collect(Collectors.toList());
		}

		List<Request_table> searchResults = filteredRequestor.stream()
				.filter(ticket -> {
					String searchTerm = search != null ? search.toLowerCase() : "";
					return searchTerm.isEmpty()
							|| (ticket.getReqNo() != null && ticket.getReqNo().toLowerCase().contains(searchTerm))
							|| (ticket.getVendorName() != null
									&& ticket.getVendorName().toLowerCase().contains(searchTerm))
							|| (ticket.getUsername() != null && ticket.getUsername().toLowerCase().contains(searchTerm))
							|| (ticket.getVendorCode() != null
									&& ticket.getVendorCode().toLowerCase().contains(searchTerm))
							|| (ticket.getStage() != null
									&& ticket.getStage().toString().toLowerCase().contains(searchTerm))
							|| (ticket.getFormattedCreatedAt() != null
									&& ticket.getFormattedCreatedAt().toLowerCase().contains(searchTerm))
							|| (String.valueOf(ticket.getTotalBaseValue()).contains(searchTerm));
				})
				.sorted(Comparator
						.<Request_table, Boolean>comparing(
								ticket -> !"reject".equalsIgnoreCase(ticket.getStatus().toString()))
						.thenComparing(Comparator.comparing(Request_table::getUpdatedAt,
								Comparator.nullsLast(Comparator.reverseOrder()))))
				.collect(Collectors.toList());

		return ResponseEntity.ok(searchResults);
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllByBudgetteamStage(String ticketType) {
		List<Request_table> tickets = requestRepository.findByStage(TicketStage.Budget_Team.toString());
		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		List<Request_table> filteredRequestor = tickets.stream()
				.filter(ticket -> ticket.getStatus() != Estatus.Hold)
				.filter(ticket -> ticketType == null || ticketType.isEmpty() ||
						ticketType.equalsIgnoreCase(ticket.getBrandOrNonBrand()))
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));

					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.sorted(Comparator
						.<Request_table, Boolean>comparing(
								ticket -> !"reject".equalsIgnoreCase(ticket.getStatus().toString()))
						.thenComparing(Comparator.comparing(Request_table::getUpdatedAt,
								Comparator.nullsLast(Comparator.reverseOrder()))))
				.collect(Collectors.toList());

		return ResponseEntity.ok(filteredRequestor);
	}

	public ResponseEntity<?> getTicketById(String id) {
		try {
			Request_table requestTable = requestRepository.findById(id)
					.orElseThrow(() -> new Exception("Ticket not found for ID: " + id));
			return ResponseEntity.ok().body(new ApiResponse(true, "Fetched Successfully", requestTable));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(new ApiResponse(false, "An error occurred while fetching the ticket", null));
		}
	}

	@Override
	public ResponseEntity<List<Request_table>> getAllByDHStage() {
		ResponseEntity<List<Request_table>> responseEntity = getAllTickets();
		List<Request_table> filteredRequestor = responseEntity.getBody().stream().filter(ticket -> {
			TicketStage stage = ticket.getStage();
			boolean isBudgetTeamStage = TicketStage.Business_head.equals(stage);
			return isBudgetTeamStage;
		})
				.sorted(Comparator.comparing(Request_table::getCreatedAt,
						Comparator.nullsLast(Comparator.reverseOrder())))
				.collect(Collectors.toList());

		logger.info("Number of tickets before filtering: {}", responseEntity.getBody().size());
		logger.info("Number of tickets after filtering: {}", filteredRequestor.size());

		return ResponseEntity.ok(filteredRequestor);
	}

	@Override
	public ResponseEntity<?> approveTicketByBRT(String ticketId, Estatus approvalStatus, String docnum,
			String remarks, Authentication authentication) {
		Optional<Request_table> optionalRequestTable = requestRepository.findById(ticketId);
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String username = userDetails.getUsername();
		if (approvalStatus.equals(Estatus.Reject)) {
			if (remarks == null || remarks.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks is required");
			}
		}
		if (approvalStatus.equals(Estatus.Approved)) {
			if (docnum == null || docnum.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document Number is required");
			}
		}
		if (optionalRequestTable.isPresent()) {
			Request_table requestTable = optionalRequestTable.get();
			TicketStage currentStage = requestTable.getStage();
			TicketStage nextStage = getNextStageforDivisionHead(currentStage, approvalStatus);

			LocalDateTime currentDateNow = LocalDateTime.now();
			Date currentDate = new Date();
			if (nextStage != null) {
				// Brand brand =
				// brandRepository.findById(requestTable.getBrand().getBrandid()).orElse(null);
				requestTable.setStage(nextStage);
				History history = new History();
				history.setIsDelete(false);
				history.setName(currentStage);
				history.setUsername(username);
				history.setStatus(approvalStatus);
				history.setRemarks(remarks);
				history.setDate(currentDateNow);
				requestTable.addHistory(history);
				requestTable.setDocNum(docnum);

				historyRepository.save(history);
				requestTable.setStatus(approvalStatus);
				requestTable.setUpdatedAt(currentDate);
				requestTable.setUpdatedBy(userDetails.getId());
				requestRepository.save(requestTable);

				if (approvalStatus == Estatus.Approved) {
					sendNotification(nextStage, requestTable);
				}
				if (approvalStatus == Estatus.Reject) {
					sendNotification(nextStage, requestTable);
				}
				List<sop_po.model.user.User> users = userRepository.findAllByRoles(nextStage, mongoTemplate);
				try {
					if (approvalStatus == Estatus.Approved) {
						for (sop_po.model.user.User user : users) {
							String emailContent = mailTemplateService.approveMailTemplate(
									user.getUsername(), currentStage.toString(), requestTable,
									"A new ticket has been created with a total base value of ",
									remarks);
							mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
						}

					} else {
						for (sop_po.model.user.User user : users) {
							String emailContent = mailTemplateService.rejectMailTemplate(
									user.getUsername(), currentStage.toString(), requestTable,
									"A new ticket has been created with a total base value of ",
									remarks);
							mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
						}
					}
				} catch (Exception e) {
					e.printStackTrace();
					return ResponseEntity.status(200)
							.body("Mail send failed");

				}

				return ResponseEntity.ok("Ticket " + (approvalStatus == Estatus.Approved ? "approved" : "denied")
						+ " and moved to the next stage: " + nextStage);
			} else {
				return ResponseEntity.status(500).body("Invalid transition from stage: " + currentStage);
			}
		} else {
			return ResponseEntity.status(404).body("Ticket not found with ID: " + ticketId);
		}
	}

	@Override
	public ResponseEntity<?> approveTicketByPOM(String ticketId, Estatus approvalStatus,
			String budgetDetails, String userId, List<String> ponumber, Boolean isRelated,
			String remarks, String stage, List<MultipartFile> budgetFile,
			List<MultipartFile> poApproverFile, List<String> deletedPoApproverFiles,
			List<String> deletedBudgetFiles, Authentication authentication) {

		String activeRole = jwtUtils.getActiveRole();
		Request_table requestTable = requestRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Ticket not found with ID: " + ticketId));
		if (!activeRole.toString().equalsIgnoreCase(requestTable.getStage().toString())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Access denied for this stage");
		}
		validatePOMRequest(approvalStatus, ponumber, remarks, requestTable, budgetDetails, isRelated, poApproverFile,
				userId);
		checkDuplicatePoNumbers(ponumber, ticketId, approvalStatus);

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		TicketStage currentStage = requestTable.getStage();

		if (isNonBrandTicket(requestTable) && approvalStatus == Estatus.Approved) {
			handleNonBrandApproval(requestTable, budgetDetails, ponumber, budgetFile, deletedBudgetFiles);
			handlePoApproverFiles(requestTable, poApproverFile, deletedPoApproverFiles, isRelated, budgetDetails);
		}

		if (approvalStatus == Estatus.Approved) {
			POMApproverInfo approverInfo = determinePoMakerApprover(requestTable.getTotalBaseValue(), userId,
					isRelated, requestTable, budgetDetails);
			requestTable.setPoApproverId(approverInfo.userId);
			requestTable.setPoApprover(approverInfo.username);
			requestTable.setIsRelated(approverInfo.isRelated);
		}

		TicketStage dragStage = dragStage(requestTable, approvalStatus, stage);
		TicketStage nextStage = (dragStage != null) ? dragStage
				: getNextStageforPOM(currentStage, approvalStatus, Boolean.TRUE.equals(requestTable.getMatches()),
						requestTable.getBrandOrNonBrand(), requestTable.getHistoryList(), requestTable.getStatus(),
						requestTable);

		if (nextStage == null) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(new ApiResponse(false, "Invalid transition from stage: " + currentStage, null));
		}

		updatePOMTicket(requestTable, nextStage, approvalStatus, ponumber, remarks, userDetails);
		sendPOMNotifications(requestTable, nextStage, approvalStatus, currentStage, remarks);

		return ResponseEntity.ok(new ApiResponse(true,
				"Ticket " + (approvalStatus == Estatus.Approved ? "approved" : "denied")
						+ " and moved to the next stage: " + nextStage,
				null));
	}

	private void validatePOMRequest(Estatus approvalStatus, List<String> ponumber, String remarks,
			Request_table requestTable, String budgetDetails, Boolean isRelated, List<MultipartFile> poApproverFile,
			String userId) {
		if (approvalStatus == Estatus.Approved) {
			boolean isNonBrand = isNonBrandTicket(requestTable);
			boolean isBrand = isBrandTicket(requestTable);
			boolean isHemaVendor = isBrand && "3704453".equals(requestTable.getVendorCode())
					&& "HEMA'S ENTERPRISES PRIVATE LIMITED".equalsIgnoreCase(requestTable.getVendorName());
			if (isHemaVendor) {
				User user = userRepository.findById(userId)
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
								"PO Approver not found"));
			}
			if (isNonBrand) {
				// For nonBrand tickets, PO number is only required when budgetDetails is "yes"
				if ("yes".equalsIgnoreCase(budgetDetails) && (ponumber == null || ponumber.isEmpty())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"PO number is required when budget details is yes.");
				}
			} else {
				// For Brand tickets, PO number is always required
				if (ponumber == null || ponumber.isEmpty()) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PO number is required for approval.");
				}
			}
		}
		if (approvalStatus == Estatus.Reject && (remarks == null || remarks.isEmpty())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks is required");
		}
	}

	private void checkDuplicatePoNumbers(List<String> ponumber, String ticketId, Estatus approvalStatus) {
		if (approvalStatus != Estatus.Approved || ponumber == null)
			return;

		List<Request_table> existingRequests = requestRepository.findByPoNumberIn(ponumber)
				.stream()
				.filter(req -> !req.getId().equals(ticketId))
				.collect(Collectors.toList());

		if (!existingRequests.isEmpty()) {
			String duplicates = existingRequests.stream()
					.flatMap(req -> req.getPoNumber().stream())
					.filter(ponumber::contains)
					.distinct()
					.collect(Collectors.joining(", "));
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"One or more PO numbers already exist: " + duplicates);
		}
	}

	private POMApproverInfo determinePoMakerApprover(long totalValue, String userId, Boolean isRelated,
			Request_table requestTable, String budgetDetails) {
		POMApproverInfo info = new POMApproverInfo();

		boolean isNonBrand = isNonBrandTicket(requestTable);
		boolean isHemaVendor = isNonBrand && "3704453".equals(requestTable.getVendorCode())
				&& "HEMA'S ENTERPRISES PRIVATE LIMITED".equalsIgnoreCase(requestTable.getVendorName());

		// Special logic for nonBrand tickets
		if (isNonBrand) {
			if (isHemaVendor && budgetDetails.equalsIgnoreCase("yes")) {
				// For HEMA vendor, set isRelated to true and require userId
				info.isRelated = true;
				if (userId == null || userId.isEmpty()) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Po Approver is required for HEMA'S ENTERPRISES PRIVATE LIMITED.");
				}
				info.userId = userId;
				info.username = userRepository.findById(userId)
						.map(sop_po.model.user.User::getUsername).orElse(null);
			} else {
				// For non-HEMA vendors, set isRelated to null and userId is not required
				info.isRelated = isRelated;
				info.userId = null;
				info.username = null;
			}
			return info;
		}

		// Brand tickets - always set Ranjith as PO Approver
		sop_po.model.user.User ranjithUser = userRepository.findByUsernameAndRole("Ranjith",
				TicketStage.Po_release, mongoTemplate);
		if (ranjithUser == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"User 'Ranjith' with role 'Po_release' not found.");
		}
		info.userId = ranjithUser.getId();
		info.username = ranjithUser.getUsername();
		info.isRelated = true;

		return info;
	}

	private void updatePOMTicket(Request_table requestTable, TicketStage nextStage,
			Estatus approvalStatus, List<String> ponumber, String remarks, UserDetailsImpl userDetails) {
		TicketStage currentStage = requestTable.getStage();

		requestTable.setStage(nextStage);
		requestTable.setStatus(approvalStatus);
		requestTable.setPoNumber(ponumber);
		requestTable.setUpdatedAt(new Date());
		requestTable.setUpdatedBy(userDetails.getId());

		History history = createHistory(currentStage, userDetails.getUsername(), approvalStatus, remarks);
		requestTable.addHistory(history);

		historyRepository.save(history);
		requestRepository.save(requestTable);
	}

	private History createHistory(TicketStage stage, String username, Estatus status, String remarks) {
		History history = new History();
		history.setIsDelete(false);
		history.setName(stage);
		history.setUsername(username);
		history.setStatus(status);
		history.setRemarks(remarks);
		history.setDate(LocalDateTime.now());
		return history;
	}

	private void sendPOMNotifications(Request_table requestTable, TicketStage nextStage, Estatus approvalStatus,
			TicketStage currentStage, String remarks) {
		sendNotification(nextStage, requestTable);

		try {
			if (approvalStatus == Estatus.Approved && nextStage == TicketStage.Po_release) {
				sendPoReleaseEmail(requestTable, currentStage, remarks);
			} else {
				sendStandardEmails(requestTable, nextStage, currentStage, approvalStatus, remarks);
			}
		} catch (Exception e) {
			e.printStackTrace();
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Mail send failed");
		}
	}

	private void sendPoReleaseEmail(Request_table requestTable, TicketStage currentStage, String remarks) {
		User user = userRepository.findById(requestTable.getPoApproverId()).orElse(null);
		if (user != null) {
			String emailContent = mailTemplateService.approveMailTemplate(
					user.getUsername(), currentStage.toString(), requestTable,
					"A new ticket has been created with a total base value of ",
					remarks);
			mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
		}
	}

	private void sendStandardEmails(Request_table requestTable, TicketStage nextStage, TicketStage currentStage,
			Estatus approvalStatus, String remarks) {
		if (nextStage == TicketStage.Budget_Team) {
			String emailContent = approvalStatus == Estatus.Approved
					? mailTemplateService.approveMailTemplate("Budget Team",
							currentStage.toString(), requestTable,
							"A new ticket has been created with a total base value of ",
							remarks)
					: mailTemplateService.rejectMailTemplate("Budget Team",
							currentStage.toString(), requestTable,
							"A new ticket has been created with a total base value of ",
							remarks);
			mailServiceAsync.sendMail(emailContent, "foh_budget@hepl.com", "Marketing Budget Request", null);
		} else if (approvalStatus == Estatus.Reject && isNonBrandTicket(requestTable)
				&& nextStage == TicketStage.Requestor) {
			User requestor = userRepository.findById(requestTable.getCreatedBy()).orElse(null);
			if (requestor != null) {
				String emailContent = mailTemplateService.rejectMailTemplate(requestor.getUsername(),
						currentStage.toString(), requestTable,
						"A new ticket has been created with a total base value of ",
						remarks);
				mailServiceAsync.sendMail(emailContent, requestor.getEmail(), "Marketing Budget Request", null);
			}
		} else {
			List<User> poUsers = userRepository.findByRolesAndType(nextStage,
					requestTable.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);
			for (sop_po.model.user.User user : poUsers) {
				String emailContent = approvalStatus == Estatus.Approved
						? mailTemplateService.approveMailTemplate(user.getUsername(),
								currentStage.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								remarks)
						: mailTemplateService.rejectMailTemplate(user.getUsername(),
								currentStage.toString(), requestTable,
								"A new ticket has been created with a total base value of ",
								remarks);
				mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
			}
		}
	}

	private static class POMApproverInfo {
		String userId;
		String username;
		Boolean isRelated;
	}

	private boolean isNonBrandTicket(Request_table requestTable) {
		return requestTable.getBrand() != null && !requestTable.getBrand().isEmpty() &&
				"NonBrand".equalsIgnoreCase(requestTable.getBrand().get(0).getBrandOrNonBrand());
	}

	private boolean isBrandTicket(Request_table requestTable) {
		return requestTable.getBrand() != null && !requestTable.getBrand().isEmpty() &&
				"Brand".equalsIgnoreCase(requestTable.getBrand().get(0).getBrandOrNonBrand());
	}

	private void handleNonBrandApproval(Request_table requestTable, String budgetDetails,
			List<String> ponumber, List<MultipartFile> budgetFile, List<String> deletedBudgetFiles) {
		if (budgetDetails == null || budgetDetails.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Budget details is required for nonBrand tickets");
		}

		requestTable.setBudgetDetails(budgetDetails);

		if ("yes".equalsIgnoreCase(budgetDetails)) {
			if (ponumber == null || ponumber.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"PO number is required when budget details is yes");
			}
			requestTable.setPoNumber(ponumber);
		} else if ("no".equalsIgnoreCase(budgetDetails)) {
			int existingFileCount = requestTable.getBudgetFile() != null ? requestTable.getBudgetFile().size() : 0;
			int deleteCount = deletedBudgetFiles != null ? deletedBudgetFiles.size() : 0;
			int newFileCount = budgetFile != null ? budgetFile.size() : 0;
			int finalFileCount = existingFileCount - deleteCount + newFileCount;

			if (finalFileCount == 0) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Budget file is mandatory when budget details is no");
			}

			if (newFileCount > 0 || deleteCount > 0) {
				handleBudgetFileUpload(requestTable, budgetFile, deletedBudgetFiles);
			}
		}
	}

	private void handleBudgetFileUpload(Request_table requestTable, List<MultipartFile> budgetFile,
			List<String> deletedBudgetFiles) {
		try {
			List<String> budgetFilePaths = requestTable.getBudgetFile() != null
					? new ArrayList<>(requestTable.getBudgetFile())
					: new ArrayList<>();

			if (deletedBudgetFiles != null) {
				for (String deletedFile : deletedBudgetFiles) {
					fileService.deleteFile(deletedFile, FileType.BUDGET_FILE);
					budgetFilePaths.remove(deletedFile);
				}
			}

			if (budgetFile != null) {
				for (MultipartFile file : budgetFile) {
					String fileName = fileService.uploadFile(file, FileType.BUDGET_FILE);
					budgetFilePaths.add(fileName);
				}
			}
			requestTable.setBudgetFile(budgetFilePaths);
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Failed to upload budget file: " + e.getMessage());
		}
	}

	private void handlePoApproverFiles(Request_table requestTable, List<MultipartFile> poApproverFile,
			List<String> deletedPoApproverFiles, Boolean isRelated, String budgetDetails) {
		try {
			List<String> filePaths = requestTable.getPoApproverFile() != null
					? new ArrayList<>(requestTable.getPoApproverFile())
					: new ArrayList<>();

			if (deletedPoApproverFiles != null) {
				for (String deletedFile : deletedPoApproverFiles) {
					fileService.deleteFile(deletedFile, FileType.POAPPROVER_FILE);
					filePaths.remove(deletedFile);
				}
			}

			if (poApproverFile != null) {
				for (MultipartFile file : poApproverFile) {
					filePaths.add(fileService.uploadFile(file, FileType.POAPPROVER_FILE));
				}
			}

			boolean isNonBrand = isNonBrandTicket(requestTable);
			boolean isHemaVendor = isNonBrand && "3704453".equals(requestTable.getVendorCode())
					&& "HEMA'S ENTERPRISES PRIVATE LIMITED".equalsIgnoreCase(requestTable.getVendorName());

			if (isHemaVendor && "yes".equalsIgnoreCase(budgetDetails) && filePaths.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"PO Approver file is required for HEMA'S ENTERPRISES nonBrand tickets");
			}

			requestTable.setPoApproverFile(filePaths);
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"Failed to process PO approver files: " + e.getMessage());
		}
	}

	private TicketStage getNextStageforPOM(TicketStage currentStage, Estatus approvalStatus,
			Boolean matches, String BrandOrNonBrand, List<History> histories, Estatus status,
			Request_table requestTable) {

		if (status == Estatus.Reject && approvalStatus == Estatus.Approved) {
			if (histories != null && !histories.isEmpty()) {
				TicketStage lastStage = histories.get(histories.size() - 1).getName();
				if (lastStage == TicketStage.Po_release || lastStage == TicketStage.Po_checker) {
					if ("Brand".equals(BrandOrNonBrand)) {
						return lastStage;
					} else if ("NonBrand".equals(BrandOrNonBrand)) {
						return TicketStage.Po_checker;
					}
				}
			}
		}
		switch (currentStage) {
			case Po_maker:
				if ("NonBrand".equals(BrandOrNonBrand) && approvalStatus == Estatus.Reject && matches == true) {
					return TicketStage.Requestor;
				}
				if ("NonBrand".equals(BrandOrNonBrand) && approvalStatus == Estatus.Reject && matches == false) {
					return TicketStage.Requestor;
				}
				if ("Brand".equals(BrandOrNonBrand) && approvalStatus == Estatus.Reject) {
					return TicketStage.PO_Screening;
				}
				if (approvalStatus == Estatus.Approved) {
					if ("NonBrand".equals(BrandOrNonBrand)) {
						String budgetDetails = requestTable.getBudgetDetails();
						if ("yes".equalsIgnoreCase(budgetDetails)) {
							return TicketStage.Po_checker;
						} else if ("no".equalsIgnoreCase(budgetDetails)) {
							return TicketStage.Budget_Team;
						}
					}
					return TicketStage.Po_checker;
				} else if (approvalStatus == Estatus.Hold) {
					return TicketStage.Po_maker;
				} else {
					return currentStage;
				}
			default:
				return null;
		}
	}

	@Override
	public ResponseEntity<?> updateAttachPoCopyNo(String ticketId, MultipartFile[] attchPoCopyNo,
			Estatus approvalStatus, String remarks, Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String username = userDetails.getUsername();
		LocalDateTime currentDateNow = LocalDateTime.now();
		try {
			Request_table request_table = requestRepository.findById(ticketId)
					.orElseThrow(() -> new NotFoundException("Request_table not found with ID: " + ticketId));
			List<History> historyList = request_table.getHistoryList();
			Date currentDate = new Date();
			String previousStage = "";
			TicketStage currentStage = request_table.getStage();
			if (historyList != null && !historyList.isEmpty()) {
				History lastHistory = historyList.get(historyList.size() - 1);
				previousStage = lastHistory.getName().toString();
			} else if (previousStage.equals(TicketStage.Po_release.name())) {
				request_table.setStage(TicketStage.Completed);
			}
			List<String> fileNames = new ArrayList<>();
			List<AttachmentWrapper> attachmentWrappers = new ArrayList<>();

			if (approvalStatus == Estatus.Completed) {
				if (attchPoCopyNo == null || attchPoCopyNo.length == 0) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PoCopy is Required");
				} else {
					for (MultipartFile file : attchPoCopyNo) {
						if (!file.isEmpty()) {
							String fileName = fileService.uploadFile(file, FileType.POCOPY);
							fileNames.add(fileName);
							attachmentWrappers.add(new AttachmentWrapper(file.getOriginalFilename(), file.getBytes()));

						}
					}
				}
				request_table.setStatus(Estatus.Completed);
				request_table.setStage(TicketStage.Completed);
			}
			boolean isNonBrand = isNonBrandTicket(request_table);
			if (approvalStatus == Estatus.Reject) {
				if (remarks == null || remarks.isEmpty()) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks is Required");
				}
				request_table.setStatus(Estatus.Reject);
				if (isNonBrand) {
					History budgetTeamHistory = null;
					for (int i = historyList.size() - 1; i >= 0; i--) {
						History history = historyList.get(i);
						if (history.getName() == TicketStage.Budget_Team) {
							budgetTeamHistory = history;
							break;
						}
					}
					if (budgetTeamHistory != null && budgetTeamHistory.getStatus() == Estatus.Approved) {
						request_table.setStage(TicketStage.Budget_Team);
					} else {
						request_table.setStage(TicketStage.Requestor);
					}
				} else {
					request_table.setStage(TicketStage.PO_Screening);
				}
			}

			request_table.setPoCopyAttachment(fileNames);
			request_table.setUpdatedAt(currentDate);
			request_table.setUpdatedBy(userDetails.getId());

			History history = new History();
			history.setIsDelete(false);
			history.setName(TicketStage.Po_maker);
			history.setUsername(username);
			history.setStatus(approvalStatus);
			history.setRemarks(remarks);
			history.setDate(currentDateNow);
			request_table.addHistory(history);

			historyRepository.save(history);

			requestRepository.save(request_table);
			List<String> ccMailIds = new ArrayList<>();
			for (User user : request_table.getCopyMailIds()) {
				ccMailIds.add(user.getEmail());
			}
			ccMailIds.add("ashok.m@cavinkare.com");
			List<sop_po.model.user.User> users = userRepository.findAllByRoles(TicketStage.PO_Screening, mongoTemplate);
			try {
				if (approvalStatus == Estatus.Completed) {
					String emailContent = mailTemplateService.poMailTemplate(
							request_table.getVendorName(), request_table,
							"A new ticket has been created with a total base value of ");
					mailServiceAsync.sendMailWithAttachments(emailContent, request_table.getVendorMailId(),
							"New item ordered", attachmentWrappers, null);

					Optional<User> poUsers = userRepository.findById(request_table.getCreatedBy());
					String userEmailContent = mailTemplateService.poMailTemplate(
							poUsers.get().getUsername(), request_table,
							"A new ticket has been created with a total base value of ");
					mailServiceAsync.sendMailWithAttachments(userEmailContent, poUsers.get().getEmail(),
							"Marketing Budget Request", attachmentWrappers, null);

					if (isBrandTicket(request_table)) {
						sop_po.model.user.User guest = userRepository.findByUsername("Misha H").orElseThrow(
								() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
						String guestContent = mailTemplateService.poMailTemplate(
								guest.getUsername(), request_table,
								"A new ticket has been created with a total base value of ");

						mailServiceAsync.sendMailWithAttachments(guestContent, guest.getEmail(), "Marketing Budget Request",
								attachmentWrappers, ccMailIds);
					}
				} else {
					for (sop_po.model.user.User user : users) {
						String emailContent = mailTemplateService.rejectMailTemplate(
								user.getUsername(), currentStage.toString(), request_table,
								"A new ticket has been created with a total base value of ",
								remarks);
						mailServiceAsync.sendMail(emailContent, user.getEmail(), "Marketing Budget Request", null);
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
				return ResponseEntity.status(200)
						.body("Mail send failed");
			}

			return ResponseEntity.ok("AttachPoCopyNo updated successfully for ticket ID: " + ticketId);
		} catch (NotFoundException e) {
			return ResponseEntity.status(404).body("Request_table not found with ID: " + ticketId);
		} catch (IOException e) {
			return ResponseEntity.status(500).body("Error saving attachments for ticket ID: " + ticketId);
		} catch (Exception e) {
			return ResponseEntity.status(500).body("Error updating AttachPoCopyNo for ticket ID: " + ticketId);
		}
	}

	@Override
	public ResponseEntity<List<Brand>> getAllSubBrandByTicketID(String id) {
		Request_table request_table = requestRepository.findById(id).orElseThrow();
		if (request_table != null) {
			List<Brand> filterSubBrand = request_table.getBrand();
			if (filterSubBrand != null) {
				filterSubBrand.forEach(x -> System.out.println(x + "====="));
				return ResponseEntity.ok(filterSubBrand);
			} else {
				System.out.println("SubBrand list is null");
			}
		} else {
			System.out.println("Brand is null");
		}

		return ResponseEntity.notFound().build();
	}

	public ResponseEntity<List<Request_table>> getTicketHistory(String stagename) {
		System.out.println("Requested stagename: " + stagename);

		List<Request_table> request_table = mongoTemplate.find(
				new Query(Criteria.where("isDeleted").ne(true)), Request_table.class);

		List<Request_table> filteredTickets = request_table.stream().filter(ticket -> ticket.getHistoryList().stream()
				// Replace the condition below with your specific matching criteria
				.anyMatch(history -> history.getName().toString().equals(stagename))).collect(Collectors.toList());
		if (filteredTickets.isEmpty()) {

			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		} else {

			return ResponseEntity.ok(filteredTickets);
		}
	}

	public ResponseEntity<List<Request_table>> getAllDraftTickets(String ticketType, String sortDirection,
			Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String id = userDetails.getId();

		Aggregation aggregation;
		if (ticketType != null && !ticketType.isEmpty()) {
			aggregation = Aggregation.newAggregation(
					Aggregation.match(Criteria.where("createdBy").is(id)),
					Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
					Aggregation
							.match(Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")));
		} else {
			aggregation = Aggregation.newAggregation(
					Aggregation.match(Criteria.where("createdBy").is(id)));
		}

		List<Request_table> tickets = mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class)
				.getMappedResults();

		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		List<Request_table> draftTickets = tickets.stream()
				.filter(ticket -> ticket.getHistoryList().stream()
						.anyMatch(history -> "Draft".equalsIgnoreCase(history.getStatus().toString())))
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));

					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate);
					}
				})
				.sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
				.collect(Collectors.toList());

		return ResponseEntity.ok(draftTickets);
	}

	public ResponseEntity<?> updateTicket(CreateTicket newTicket, List<MultipartFile> attachments, Estatus status) {
		Request_table requestTable = new Request_table();
		String data = "null";
		Date currentDate = new Date();

		List<Brand> brands = new ArrayList<>();
		boolean isHemasVendor = isNonBrandHemasVendor(newTicket);

		if (newTicket.getBrand() != null) {

			for (Branddto brandDto : newTicket.getBrand()) {
				Map<String, String> validationErrors = validateBrandDto(brandDto, isHemasVendor);

				if (!validationErrors.isEmpty()) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST)
							.body(Map.of("validationErrors", validationErrors));
				}

				Brand brand = new Brand();
				// brand.setActivityEndDate(currentDate);
				// brand.setActivityStartDate(currentDate);
				LocalDate localStartDate = brandDto.getActivityStartDate().toInstant()
						.atZone(ZoneId.systemDefault())
						.toLocalDate();
				Date utcStartDate = Date.from(localStartDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
				brand.setActivityStartDate(utcStartDate);

				LocalDate localEndDate = brandDto.getActivityEndDate().toInstant()
						.atZone(ZoneId.systemDefault())
						.toLocalDate();
				Date utcEndDate = Date.from(localEndDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
				brand.setActivityEndDate(utcEndDate);

				brand.setBrandOrNonBrand(brandDto.getBrandOrNonBrand());
				brand.setChannel(brandDto.getChannel());
				brand.setCommitmentItem(brandDto.getCommitmentItem());
				brand.setDepartment(brandDto.getDepartment());
				brand.setLocation(brandDto.getLocation());
				brand.setDivision(brandDto.getDivision());
				brand.setMaterialGroup(brandDto.getMaterialGroup());
				brand.setNatureOfExpenses(brandDto.getNatureOfExpenses());
				brand.setRegion(brandDto.getRegion());
				brand.setPoDescription(brandDto.getPoDescription());
				// brand.setValue(brandDto.getValue());
				brand.setFundCentre(brandDto.getFundCentre());
				brand.setGlCode(brandDto.getGlCode());
				brand.setGlDescription(brandDto.getGlDescription());
				brand.setDetailsBrand(brandDto.getDetailsBrand());
				brand.setIoOrCostCentreNumber(brandDto.getIoOrCostCentreNumber());
				brand.setIoOrCostCentrePo(brandDto.getIoOrCostCentrePo());
				brand.setYear(brandDto.getYear());
				brand.setMonth(brandDto.getMonth());
				brand.setIsDelete(false);

				brands.add(brand);
			}
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("validationErrors", Map.of("brand", "Brand list is missing.")));
		}

		brandRepository.saveAll(brands);
		requestTable.setBrand(brands);
		requestTable.setStage(TicketStage.Business_Approver);

		requestTable.setCkplLocation(Optional.ofNullable(newTicket.getCkplLocation()).orElse(data));
		requestTable.setCurrency(Optional.ofNullable(newTicket.getCurrency()).orElse(data));
		requestTable.setGstType(Optional.ofNullable(newTicket.getGstType()).orElse(Egst.No_Gst));
		requestTable.setGstNo(Optional.ofNullable(newTicket.getGstNo()).orElse(data));

		requestTable.setPaymentTerm(Optional.ofNullable(newTicket.getPaymentTerm()).orElse(data));
		requestTable.setPoType(Optional.ofNullable(newTicket.getPoType()).orElse(Epo.Monthly_PO));
		String totalBaseValueString = newTicket.getTotalBaseValue();
		requestTable.setTotalBaseValue(parseTotalBaseValue(totalBaseValueString));

		requestTable.setVendorCode(newTicket.getVendorCode());
		requestTable.setVendorLocation(newTicket.getVendorLocation());
		requestTable.setVendorName(Optional.ofNullable(newTicket.getVendorName()).orElse(data));
		requestTable.setVendorMailId(Optional.ofNullable(newTicket.getVendorMailId()).orElse(data));
		requestTable.setCreatedBy(UserServiceImpl.getUserId());
		requestTable.setCreatedAt(currentDate);
		String businessApproverId = requestTable.getBusinessApprover();
		sop_po.model.user.User businessApprover = null;
		try {
			businessApprover = userRepository.findById(businessApproverId)
					.orElseThrow(() -> new Exception("Business Approver not found"));
		} catch (Exception e) {
			e.printStackTrace();
		}
		String approverUsername = businessApprover.getUsername();
		requestTable.setApproverUsername(approverUsername);

		History history = new History();
		history.setIsDelete(false);
		history.setName(TicketStage.Requestor);
		history.setStatus(status);
		requestTable.addHistory(history);

		historyRepository.save(history);
		requestRepository.save(requestTable);

		try {
			List<String> attachmentPath = storeAttachment(attachments, "attachments");
			requestTable.setAttachment(attachmentPath);
			requestRepository.save(requestTable);
		} catch (IOException e) {
			System.err.println("Error storing attachments: " + e.getMessage());
			return ResponseEntity.status(500).body("Error storing attachments");
		}

		return ResponseEntity.ok("Ticket created successfully");
	}

	@Override
	public ResponseEntity<?> updateTicketData(CreateTicket newTicket,
			List<MultipartFile> attachment, List<String> attachmentsPath,
			String ticketId, Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		validateVendor(newTicket.getVendorCode());

		Request_table requestTable = requestRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		boolean isNonBrandHemas = isNonBrandHemasVendor(newTicket);
		if (isNonBrandHemas && newTicket.getApprovalType() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"ApprovalType is required for nonBrand Hemas vendor");
		}

		// Validate brand fields only if not nonBrand Hema's vendor
		if (newTicket.getBrand() != null && !isNonBrandHemas) {
			for (int i = 0; i < newTicket.getBrand().size(); i++) {
				Branddto brandDto = newTicket.getBrand().get(i);
				Map<String, String> brandValidationErrors = validateBrandDto(brandDto, isNonBrandHemas);
				if (!brandValidationErrors.isEmpty()) {
					Map<String, String> allValidationErrors = new HashMap<>();
					for (Map.Entry<String, String> entry : brandValidationErrors.entrySet()) {
						allValidationErrors.put("brand[" + i + "]." + entry.getKey(), entry.getValue());
					}
					return ResponseEntity.status(HttpStatus.BAD_REQUEST)
							.body(Map.of("validationErrors", allValidationErrors));
				}
			}
		}

		// if (newTicket.getBrand() != null) {
		// 	checkEbriefDuplicate(newTicket.getBrand(), ticketId);
		// }

		// For nonBrand Hema's vendor with approvalType true, always set hasChanges to
		// false
		boolean hasChanges;
		if (isNonBrandHemas && Boolean.TRUE.equals(newTicket.getApprovalType())) {
			hasChanges = false;
		} else {
			hasChanges = detectChanges(requestTable, newTicket);
		}

		Map<String, Object> changedFieldsSnapshot = hasChanges ? collectChangedFields(requestTable, newTicket) : null;

		List<Brand> updatedBrands = processBrands(requestTable, newTicket.getBrand());

		// For nonBrand Hema's vendor, get totalBaseValue from newTicket
		long totalBaseValue;
		if (isNonBrandHemas) {
			totalBaseValue = parseTotalBaseValue(newTicket.getTotalBaseValue());
		} else {
			totalBaseValue = updatedBrands.stream()
					.mapToLong(b -> Optional.ofNullable(b.getValue()).orElse(0L))
					.sum();
		}

		String firstGlCode = updatedBrands.isEmpty() ? null : updatedBrands.get(0).getGlCode();

		requestTable.setBrand(updatedBrands);

		// If nonBrand Hema's vendor with approvalType true, set businessApprover and
		// ApproverUsername to null
		if (isNonBrandHemas && Boolean.TRUE.equals(newTicket.getApprovalType())) {
			requestTable.setBusinessApprover(null);
			requestTable.setApproverUsername(null);
		}

		applyTicketUpdates(requestTable, newTicket, updatedBrands, totalBaseValue, firstGlCode, userId);

		History lastHistory = requestTable.getHistoryList().get(requestTable.getHistoryList().size() - 1);

		boolean isNonBrandTicket = newTicket.getBrand() != null && newTicket.getBrand().stream()
				.anyMatch(b -> "NonBrand".equalsIgnoreCase(b.getBrandOrNonBrand())
						|| "Non-Brand".equalsIgnoreCase(b.getBrandOrNonBrand()));
		String selfApprover = isNonBrandTicket ? "false" : validateUserBudget(totalBaseValue, userId, firstGlCode);

		TicketStage updatedStage = computeStage(newTicket, lastHistory, hasChanges, selfApprover, isNonBrandHemas,
				isNonBrandTicket, requestTable);
		requestTable.setStage(updatedStage);

		updateTicketHistory(requestTable);

		if (changedFieldsSnapshot != null)
			requestTable.setChangedFields(changedFieldsSnapshot);

		handleAttachments(requestTable, attachment, attachmentsPath);
		handlePreApprovedFiles(requestTable, newTicket);

		requestRepository.save(requestTable);

		sendStageNotifications(requestTable, newTicket, selfApprover);

		sendNotification(updatedStage, requestTable);

		return ResponseEntity.ok("Ticket updated successfully");
	}

	private List<Brand> processBrands(Request_table existing, List<Branddto> dtoList) {

		List<Brand> existingBrands = existing.getBrand() == null
				? new ArrayList<>()
				: new ArrayList<>(existing.getBrand());

		List<Brand> finalBrands = new ArrayList<>();

		int existingSize = existingBrands.size();
		int newSize = dtoList.size();

		int min = Math.min(existingSize, newSize);

		for (int i = 0; i < min; i++) {
			Brand oldBrand = existingBrands.get(i);
			Branddto dto = dtoList.get(i);
			updateBrandEntityByIndex(oldBrand, dto);
			finalBrands.add(oldBrand);
		}

		if (newSize > existingSize) {
			for (int i = existingSize; i < newSize; i++) {
				Branddto dto = dtoList.get(i);

				Brand newBrand = convertBrandDtoToBrand(dto);
				newBrand.setBrandid(null);

				newBrand = brandRepository.save(newBrand);

				finalBrands.add(newBrand);
			}
		}

		brandRepository.saveAll(finalBrands);
		return finalBrands;
	}

	private void updateBrandEntityByIndex(Brand brand, Branddto dto) {

		brand.setBrandOrNonBrand(dto.getBrandOrNonBrand());
		brand.setMaterialPo(dto.getMaterialPo());
		if (dto.getMaterialCode() != null && !dto.getMaterialCode().trim().isEmpty()) {
			brand.setMaterialCode(dto.getMaterialCode());
			if (dto.getDeliveryPlant() == null || dto.getDeliveryPlant().trim().isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery Plant is required");
			}
			brand.setDeliveryPlant(dto.getDeliveryPlant());
		} else {
			brand.setMaterialCode(dto.getMaterialCode());
		}
		brand.setDepartment(dto.getDepartment());
		brand.setDivision(dto.getDivision());
		brand.setChannel(dto.getChannel());
		brand.setRegion(dto.getRegion());
		brand.setLocation(dto.getLocation());
		brand.setValue(dto.getValue());
		brand.setMaterialGroup(dto.getMaterialGroup());
		brand.setCommitmentItem(dto.getCommitmentItem());
		brand.setNatureOfExpenses(dto.getNatureOfExpenses());
		brand.setPoDescription(dto.getPoDescription());
		brand.setActivityStartDate(dto.getActivityStartDate());
		brand.setActivityEndDate(dto.getActivityEndDate());
		brand.setCkplLocation(dto.getCkplLocation());
		brand.setGstType(dto.getGstType());
		brand.setYear(dto.getYear());
		brand.setMonth(dto.getMonth());
		brand.setIoOrCostCentrePo(dto.getIoOrCostCentrePo());
		brand.setIoOrCostCentreNumber(dto.getIoOrCostCentreNumber());
		brand.setFundCentre(dto.getFundCentre());
		brand.setGlCode(dto.getGlCode());
		brand.setGlDescription(dto.getGlDescription());
		brand.setIsDelete(false);
		brand.setDetailsBrand(dto.getDetailsBrand());
		brand.setInternalorder(dto.getInternalorder());
		brand.setCostcenter(dto.getCostcenter());
		brand.setDistrict(dto.getDistrict());
		brand.setBrandSubCategory(dto.getBrandSubCategory());
		brand.setSacHsnCode(dto.getSacHsnCode());
		if (dto.getEbriefId() != 0) {
			EBrief eBrief = ebriefRepo.findByActivityId(dto.getEbriefId()).orElse(null);
			brand.setEBrief(eBrief);
		} else {
			brand.setEBrief(null);
		}
	}

	private Brand convertBrandDtoToBrand(Branddto dto) {

		Brand brand = new Brand();

		LocalDate start = dto.getActivityStartDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
		LocalDate end = dto.getActivityEndDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

		brand.setActivityStartDate(Date.from(start.atStartOfDay(ZoneId.of("UTC")).toInstant()));
		brand.setActivityEndDate(Date.from(end.atStartOfDay(ZoneId.of("UTC")).toInstant()));

		brand.setBrandOrNonBrand(dto.getBrandOrNonBrand());
		brand.setChannel(dto.getChannel());
		brand.setCommitmentItem(dto.getCommitmentItem());
		brand.setDepartment(dto.getDepartment());
		brand.setLocation(dto.getLocation());
		brand.setDivision(dto.getDivision());
		brand.setMaterialGroup(dto.getMaterialGroup());
		brand.setNatureOfExpenses(dto.getNatureOfExpenses());
		brand.setRegion(dto.getRegion());
		brand.setPoDescription(dto.getPoDescription());
		brand.setValue(dto.getValue());
		brand.setCkplLocation(dto.getCkplLocation());
		brand.setGstType(dto.getGstType());
		brand.setMaterialPo(dto.getMaterialPo());
		if (dto.getMaterialCode() != null && !dto.getMaterialCode().trim().isEmpty()) {
			brand.setMaterialCode(dto.getMaterialCode());
			if (dto.getDeliveryPlant() == null || dto.getDeliveryPlant().trim().isEmpty()) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery Plant is required");
			}
			brand.setDeliveryPlant(dto.getDeliveryPlant());
		} else {
			brand.setMaterialCode(dto.getMaterialCode());
		}
		brand.setFundCentre(dto.getFundCentre());
		brand.setInternalorder(dto.getInternalorder());
		brand.setCostcenter(dto.getCostcenter());
		brand.setGlCode(dto.getGlCode());
		brand.setGlDescription(dto.getGlDescription());
		brand.setDetailsBrand(dto.getDetailsBrand());
		brand.setIoOrCostCentreNumber(dto.getIoOrCostCentreNumber());
		brand.setIoOrCostCentrePo(dto.getIoOrCostCentrePo());
		brand.setYear(dto.getYear());
		brand.setMonth(dto.getMonth());
		brand.setDistrict(dto.getDistrict());
		brand.setBrandSubCategory(dto.getBrandSubCategory());
		brand.setSacHsnCode(dto.getSacHsnCode());
		brand.setIsDelete(false);
		if (dto.getEbriefId() != 0) {
			EBrief eBrief = ebriefRepo.findByActivityId(dto.getEbriefId()).orElse(null);
			brand.setEBrief(eBrief);
		} else {
			brand.setEBrief(null);
		}

		return brand;
	}

	private boolean detectChanges(Request_table existing, CreateTicket updated) {

		if (!Objects.equals(existing.getBusinessApprover(), updated.getBusinessApprover()))
			return true;

		List<Brand> oldBrands = existing.getBrand();
		List<Branddto> newBrands = updated.getBrand();

		if (oldBrands == null && newBrands == null)
			return false;
		if (oldBrands == null || newBrands == null)
			return true;
		if (oldBrands.size() != newBrands.size())
			return true;

		Map<String, Brand> oldBrandMap = oldBrands.stream()
				.collect(Collectors.toMap(
						b -> b.getBrandid(),
						b -> b));

		for (Branddto nb : newBrands) {

			Brand old = oldBrandMap.get(nb.getBrandid());

			if (old == null)
				return true;

			if (!Objects.equals(old.getBrandOrNonBrand(), nb.getBrandOrNonBrand()))
				return true;
			if (!Objects.equals(old.getMaterialCode(), nb.getMaterialCode()))
				return true;
			if (!Objects.equals(old.getDepartment(), nb.getDepartment()))
				return true;
			if (!Objects.equals(old.getDivision(), nb.getDivision()))
				return true;
			if (!Objects.equals(old.getChannel(), nb.getChannel()))
				return true;
			if (!Objects.equals(old.getRegion(), nb.getRegion()))
				return true;
			if (!Objects.equals(old.getLocation(), nb.getLocation()))
				return true;
			if (!Objects.equals(old.getValue(), nb.getValue()))
				return true;
			if (!Objects.equals(old.getMaterialGroup(), nb.getMaterialGroup()))
				return true;
			if (!Objects.equals(old.getCommitmentItem(), nb.getCommitmentItem()))
				return true;
			if (!Objects.equals(old.getNatureOfExpenses(), nb.getNatureOfExpenses()))
				return true;
			if (!isSameDate(old.getActivityStartDate(), nb.getActivityStartDate()))
				return true;
			if (!isSameDate(old.getActivityEndDate(), nb.getActivityEndDate()))
				return true;
			if (!Objects.equals(old.getCkplLocation(), nb.getCkplLocation()))
				return true;
			if (!Objects.equals(old.getGstType(), nb.getGstType()))
				return true;
			if (!Objects.equals(old.getYear(), nb.getYear()))
				return true;
			if (!Objects.equals(old.getMonth(), nb.getMonth()))
				return true;
			if (!Objects.equals(old.getIoOrCostCentrePo(), nb.getIoOrCostCentrePo()))
				return true;
			if (!Objects.equals(old.getIoOrCostCentreNumber(), nb.getIoOrCostCentreNumber()))
				return true;
			if (!Objects.equals(old.getFundCentre(), nb.getFundCentre()))
				return true;
			if (!Objects.equals(old.getGlCode(), nb.getGlCode()))
				return true;
			if (!Objects.equals(old.getGlDescription(), nb.getGlDescription()))
				return true;
			if (!Objects.equals(old.getDetailsBrand(), nb.getDetailsBrand()))
				return true;
			if (!Objects.equals(old.getInternalorder(), nb.getInternalorder()))
				return true;
			if (!Objects.equals(old.getCostcenter(), nb.getCostcenter()))
				return true;
			if (!Objects.equals(old.getBrandSubCategory(), nb.getBrandSubCategory()))
				return true;

			if (!Objects.equals(old.getDistrict(), nb.getDistrict()))
				return true;
		}

		return false;
	}

	private Map<String, Object> collectChangedFields(Request_table existing, CreateTicket updated) {
		Map<String, Object> changed = new HashMap<>();

		if (!Objects.equals(existing.getBusinessApprover(), updated.getBusinessApprover()))
			changed.put("businessApprover", existing.getBusinessApprover());

		List<Brand> oldBrands = existing.getBrand();
		List<Branddto> newBrands = updated.getBrand();

		if (oldBrands != null && newBrands != null) {
			Map<String, Brand> oldBrandMap = oldBrands.stream()
					.collect(Collectors.toMap(Brand::getBrandid, b -> b));

			for (Branddto nb : newBrands) {
				Brand old = oldBrandMap.get(nb.getBrandid());
				if (old == null)
					continue; // new brand, skip
				String prefix = "brand[" + old.getBrandid() + "]#";

				if (!Objects.equals(old.getBrandOrNonBrand(), nb.getBrandOrNonBrand()))
					changed.put(prefix + "brandOrNonBrand", old.getBrandOrNonBrand());
				if (!Objects.equals(old.getMaterialCode(), nb.getMaterialCode()))
					changed.put(prefix + "materialCode", old.getMaterialCode());
				if (!Objects.equals(old.getDepartment(), nb.getDepartment()))
					changed.put(prefix + "department", old.getDepartment());
				if (!Objects.equals(old.getDivision(), nb.getDivision()))
					changed.put(prefix + "division", old.getDivision());
				if (!Objects.equals(old.getChannel(), nb.getChannel()))
					changed.put(prefix + "channel", old.getChannel());
				if (!Objects.equals(old.getRegion(), nb.getRegion()))
					changed.put(prefix + "region", old.getRegion());
				if (!Objects.equals(old.getLocation(), nb.getLocation()))
					changed.put(prefix + "location", old.getLocation());
				if (!Objects.equals(old.getValue(), nb.getValue()))
					changed.put(prefix + "value", old.getValue());
				if (!Objects.equals(old.getMaterialGroup(), nb.getMaterialGroup()))
					changed.put(prefix + "materialGroup", old.getMaterialGroup());
				if (!Objects.equals(old.getCommitmentItem(), nb.getCommitmentItem()))
					changed.put(prefix + "commitmentItem", old.getCommitmentItem());
				if (!Objects.equals(old.getNatureOfExpenses(), nb.getNatureOfExpenses()))
					changed.put(prefix + "natureOfExpenses", old.getNatureOfExpenses());
				if (!isSameDate(old.getActivityStartDate(), nb.getActivityStartDate()))
					changed.put(prefix + "activityStartDate", old.getActivityStartDate());
				if (!isSameDate(old.getActivityEndDate(), nb.getActivityEndDate()))
					changed.put(prefix + "activityEndDate", old.getActivityEndDate());
				if (!Objects.equals(old.getCkplLocation(), nb.getCkplLocation()))
					changed.put(prefix + "ckplLocation", old.getCkplLocation());
				if (!Objects.equals(old.getGstType(), nb.getGstType()))
					changed.put(prefix + "gstType", old.getGstType());
				if (!Objects.equals(old.getYear(), nb.getYear()))
					changed.put(prefix + "year", old.getYear());
				if (!Objects.equals(old.getMonth(), nb.getMonth()))
					changed.put(prefix + "month", old.getMonth());
				if (!Objects.equals(old.getIoOrCostCentrePo(), nb.getIoOrCostCentrePo()))
					changed.put(prefix + "ioOrCostCentrePo", old.getIoOrCostCentrePo());
				if (!Objects.equals(old.getIoOrCostCentreNumber(), nb.getIoOrCostCentreNumber()))
					changed.put(prefix + "ioOrCostCentreNumber", old.getIoOrCostCentreNumber());
				if (!Objects.equals(old.getFundCentre(), nb.getFundCentre()))
					changed.put(prefix + "fundCentre", old.getFundCentre());
				if (!Objects.equals(old.getGlCode(), nb.getGlCode()))
					changed.put(prefix + "glCode", old.getGlCode());
				if (!Objects.equals(old.getGlDescription(), nb.getGlDescription()))
					changed.put(prefix + "glDescription", old.getGlDescription());
				if (!Objects.equals(old.getDetailsBrand(), nb.getDetailsBrand()))
					changed.put(prefix + "detailsBrand", old.getDetailsBrand());
				if (!Objects.equals(old.getInternalorder(), nb.getInternalorder()))
					changed.put(prefix + "internalorder", old.getInternalorder());
				if (!Objects.equals(old.getCostcenter(), nb.getCostcenter()))
					changed.put(prefix + "costcenter", old.getCostcenter());
				if (!Objects.equals(old.getBrandSubCategory(), nb.getBrandSubCategory()))
					changed.put(prefix + "brandSubCategory", old.getBrandSubCategory());
				if (!Objects.equals(old.getDistrict(), nb.getDistrict()))
					changed.put(prefix + "district", old.getDistrict());
			}
		}

		return changed.isEmpty() ? null : changed;
	}

	private boolean isSameDate(Date date1, Date date2) {
		if (date1 == null && date2 == null)
			return true;
		if (date1 == null || date2 == null)
			return false;

		LocalDate localDate1 = date1.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
		LocalDate localDate2 = date2.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

		return localDate1.equals(localDate2);
	}

	private TicketStage computeStage(
			CreateTicket newTicket,
			History lastHistory,
			boolean hasChanges,
			String selfApprover,
			boolean isNonBrandHemas, boolean isNonBrandTicket,
			Request_table request_table) {

		if (isNonBrandHemas && Boolean.TRUE.equals(newTicket.getApprovalType())) {
			request_table.setBusinessApprover(null);
			request_table.setApproverUsername(null);
			return TicketStage.Po_maker;
		}

		if (isNonBrandTicket && Boolean.TRUE.equals(newTicket.getApprovalType()) &&
				newTicket.getBrand() != null && newTicket.getBrand().stream()
						.anyMatch(b -> "102 CMD Office".equalsIgnoreCase(b.getDepartment()))) {
			request_table.setBusinessApprover(null);
			request_table.setApproverUsername(null);
			return TicketStage.Po_maker;
		}

		// If validateUserBudget returns true, go directly to PO_Screening
		if ("true".equals(selfApprover)) {
			return TicketStage.PO_Screening;
		}

		if (isNonBrandTicket) {
			if (lastHistory.getName() == TicketStage.Po_maker) {
				return hasChanges ? TicketStage.Business_Approver : TicketStage.Po_maker;
			} else if (lastHistory.getName() == TicketStage.Business_Approver) {
				return TicketStage.Business_Approver;
			}
		}

		boolean isRejectPO = lastHistory.getName() == TicketStage.PO_Screening
				&& lastHistory.getStatus() == Estatus.Reject;

		if (isRejectPO) {
			return hasChanges ? TicketStage.Business_Approver : TicketStage.PO_Screening;
		}

		// Default logic for hasChanges false
		if (!hasChanges) {
			return TicketStage.Business_Approver;
		}

		return TicketStage.Business_Approver;
	}

	private void checkEbriefDuplicate(List<Branddto> brandDtos, String excludeTicketId) {
		if (brandDtos == null || brandDtos.isEmpty()) return;
		List<Integer> activityIds = brandDtos.stream()
				.filter(b -> b.getEbriefId() != 0)
				.map(b -> ebriefRepo.findByActivityId((int) b.getEbriefId()).orElse(null))
				.filter(eBrief -> eBrief != null && eBrief.getActivityId() != null)
				.map(EBrief::getActivityId)
				.collect(Collectors.toList());
		if (activityIds.isEmpty()) return;
		List<Brand> brandsWithEbrief = mongoTemplate.find(
				new Query(Criteria.where("eBrief.activityId").in(activityIds)), Brand.class);
		if (brandsWithEbrief.isEmpty()) return;
		List<ObjectId> brandObjectIds = brandsWithEbrief.stream()
				.map(b -> new ObjectId(b.getBrandid()))
				.collect(Collectors.toList());
		String loginUserId = jwtUtils.getUserId();
		Criteria criteria = Criteria.where("brand.$id").in(brandObjectIds).and("createdBy").is(loginUserId);
		if (excludeTicketId != null) {
			criteria = criteria.and("_id").ne(new ObjectId(excludeTicketId));
		}
		if (mongoTemplate.exists(new Query(criteria), Request_table.class)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-Brief already exists");
		}
	}

	private boolean isNonBrandHemasVendor(CreateTicket newTicket) {
		boolean isNonBrand = newTicket.getBrand() != null && newTicket.getBrand().stream()
				.anyMatch(brand -> "NonBrand".equalsIgnoreCase(brand.getBrandOrNonBrand()) ||
						"Non-Brand".equalsIgnoreCase(brand.getBrandOrNonBrand()));
		return isNonBrand && "3704453".equals(newTicket.getVendorCode()) &&
				"HEMA'S ENTERPRISES PRIVATE LIMITED".equalsIgnoreCase(newTicket.getVendorName());
	}

	private void handlePreApprovedFiles(Request_table requestTable, CreateTicket newTicket) {
		List<String> current = requestTable.getPreApprovedFiles();
		if (current == null)
			current = new ArrayList<>();

		// Remove deleted files
		if (newTicket.getDeletedPreApprovedFiles() != null) {
			for (String fileToDelete : newTicket.getDeletedPreApprovedFiles()) {
				try {
					fileService.deleteFile(fileToDelete, FileType.PREAPPROVED_FILE);
					current.remove(fileToDelete);
				} catch (Exception ignored) {
				}
			}
		}

		// Add new files
		if (newTicket.getPreApprovedFiles() != null) {
			for (MultipartFile file : newTicket.getPreApprovedFiles()) {
				try {
					String fileName = fileService.uploadFile(file, FileType.PREAPPROVED_FILE);
					current.add(fileName);
				} catch (Exception ignored) {
				}
			}
		}
		requestTable.setApprovalType(newTicket.getApprovalType());
		requestTable.setPreApprovedFiles(current);
	}

	private void applyTicketUpdates(Request_table requestTable, CreateTicket newTicket,
			List<Brand> brands, long totalBaseValue,
			String firstGlCode, String userId) {

		requestTable.setBrand(brands);
		requestTable.setTotalBaseValue(totalBaseValue);

		if (newTicket.getCurrency() != null)
			requestTable.setCurrency(newTicket.getCurrency());

		requestTable.setGstNo(
				(newTicket.getGstNo() == null || newTicket.getGstNo().isBlank())
						? null
						: newTicket.getGstNo());

		requestTable.setPaymentTerm(newTicket.getPaymentTerm());
		requestTable.setPoType(newTicket.getPoType());
		requestTable.setVendorCode(newTicket.getVendorCode());
		requestTable.setAccountNumber(newTicket.getAccountNumber());
		requestTable.setVendorLocation(newTicket.getVendorLocation());
		requestTable.setVendorName(newTicket.getVendorName());
		requestTable.setVendorMailId(newTicket.getVendorMailId());
		requestTable.setAdvance(newTicket.getAdvance());
		requestTable.setRoiDescription(newTicket.getRoiDescription());
		requestTable.setSelfApprove(newTicket.isSelfApprove());
		if (newTicket.getBusinessApprover() != null) {
			boolean isNonBrandTicket = newTicket.getBrand() != null && newTicket.getBrand().stream()
					.anyMatch(brand -> "NonBrand".equalsIgnoreCase(brand.getBrandOrNonBrand()) ||
							"Non-Brand".equalsIgnoreCase(brand.getBrandOrNonBrand()));

			if (!isNonBrandTicket) {
				BudgetRange budgetRange = budgetRepository.findByUserIdsAndValueInRange(
						newTicket.getBusinessApprover(),
						totalBaseValue, mongoTemplate);

				if (budgetRange == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"Selected Business Approver not eligible for your total Base value");
				}
			}

			User user = userRepository.findById(newTicket.getBusinessApprover())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
			requestTable.setBusinessApprover(newTicket.getBusinessApprover());
			requestTable.setApproverUsername(user.getUsername());
		}
		requestTable.setCkplLocation(newTicket.getCkplLocation());
		// if (totalBaseValue > 500000 && newTicket.getRoiDescription() == null &&
		// !isNonBrandTicket(requestTable)) {
		// throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
		// "ROI description required when base value > 5,00,000");
		// }

		requestTable.setPoNumber(null);
		requestTable.setIsRelated(null);
		requestTable.setDocNum(null);

		List<User> copyUsers = new ArrayList<>();
		if (newTicket.getCopyMailIds() != null) {
			for (String uid : newTicket.getCopyMailIds()) {
				copyUsers.add(userRepository.findById(uid)
						.orElseThrow(() -> new NotFoundException("User not found: " + uid)));
			}
		}
		requestTable.setCopyMailIds(copyUsers);
		requestTable.setUsername(jwtUtils.getUserName());
		requestTable.setUpdatedBy(jwtUtils.getUserId());
		requestTable.setIsDeleted(false);
		requestTable.setStatus(Estatus.Submit);
	}

	private void updateTicketHistory(Request_table requestTable) {

		List<History> list = requestTable.getHistoryList();

		for (History h : list) {
			if (h.getName() == TicketStage.Requestor && h.getStatus() == Estatus.Draft) {
				h.setStatus(Estatus.Approved);
				historyRepository.save(h);
				return;
			}
		}

		History newHistory = new History();
		newHistory.setId(new ObjectId().toHexString());
		newHistory.setName(TicketStage.Requestor);
		newHistory.setStatus(Estatus.Submit);
		newHistory.setDate(LocalDateTime.now());

		requestTable.addHistory(newHistory);
		historyRepository.save(newHistory);
	}

	private void handleAttachments(Request_table requestTable,
			List<MultipartFile> newFiles,
			List<String> attachmentsPath) {

		List<String> current = requestTable.getAttachment();
		if (current == null)
			current = new ArrayList<>();

		if (attachmentsPath != null) {
			List<String> toDelete = current.stream()
					.filter(old -> !attachmentsPath.contains(old))
					.collect(Collectors.toList());

			for (String file : toDelete) {
				try {
					fileService.deleteFile(file, FileType.ATTACHMENTS);
					current.remove(file);
				} catch (Exception ignored) {
				}
			}
		}

		// Add new files
		if (newFiles != null) {
			for (MultipartFile file : newFiles) {
				try {
					String fileName = fileService.uploadFile(file, FileType.ATTACHMENTS);
					current.add(fileName);
				} catch (Exception ignored) {
				}
			}
		}

		requestTable.setAttachment(current);
	}

	private void sendStageNotifications(Request_table request, CreateTicket newTicket, String selfApprover) {

		List<String> ccMailIds = new ArrayList<>();

		List<User> copyMailIds = request.getCopyMailIds();
		if (copyMailIds != null) {
			for (User u : copyMailIds) {
				if (u.getEmail() != null && !u.getEmail().isBlank()) {
					ccMailIds.add(u.getEmail());
				}
			}
		}

		ccMailIds.add("ashok.m@cavinkare.com");
		try {
			List<User> poUsers = userRepository.findByRolesAndType(request.getStage(),
					request.getBrand().get(0).getBrandOrNonBrand(), mongoTemplate);

			if (selfApprover.equals("false") || selfApprover.equals("nextstage")) {
				User approver = userRepository.findById(newTicket.getBusinessApprover())
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

				String mailBody = mailTemplateService.approveMailTemplate(
						approver.getUsername(),
						TicketStage.Requestor.toString(), request,
						"A new ticket has been updated",
						"Ticket updated by Requestor");

				mailServiceAsync.sendMail(mailBody, approver.getEmail(), "Marketing Budget Request", null);

			} else {
				for (User user : poUsers) {
					String mailBody = mailTemplateService.approveMailTemplate(
							user.getUsername(),
							TicketStage.Requestor.toString(), request,
							"A new ticket has been updated",
							"Ticket updated by Requestor");
					mailServiceAsync.sendMail(mailBody, user.getEmail(), "Marketing Budget Request", null);
				}
			}

		} catch (Exception ex) {
			ex.printStackTrace();
		}
		try {

			sop_po.model.user.User user = userRepository.findByUsername("Misha H")
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

			String emailContentForMisha = mailTemplateService.guestMailTemplate(
					user.getUsername(),
					TicketStage.Requestor.toString(), request,
					"A new ticket has been created with a total base value of ",
					request.getStage().toString(),
					Estatus.Approved.toString());

			mailServiceAsync.sendMail(
					emailContentForMisha,
					user.getEmail(),
					"Marketing Budget Request",
					ccMailIds);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public ResponseEntity<List<Request_table>> getPoApproverTicket(String userId) {
		System.out.println("User ID: " + userId);

		List<Request_table> responseEntity = requestRepository.findByPoApproverAndStage(userId);
		SimpleDateFormat dateFormatter = new SimpleDateFormat("dd-MM-yyyy");

		List<Request_table> processedTickets = responseEntity.stream()
				.peek(ticket -> {
					Optional<sop_po.model.user.User> userOptional = userRepository.findById(ticket.getCreatedBy());
					userOptional.ifPresent(user -> ticket.setUsername(user.getUsername()));

					Date createdAt = ticket.getCreatedAt();
					if (createdAt != null) {
						String formattedDate = dateFormatter.format(createdAt);
						ticket.setFormattedCreatedAt(formattedDate); // Assuming `formattedCreatedAt` is a transient
																		// field in `Request_table`
					}
				})
				.collect(Collectors.toList());

		// Return the processed tickets
		return ResponseEntity.ok(processedTickets);
	}

	@Override
	public ResponseEntity<?> deleteAttachments(String ticketId, String attachmentNames) {
		Optional<Request_table> optionalTicket = requestRepository.findById(ticketId);

		if (optionalTicket.isPresent()) {
			Request_table ticket = optionalTicket.get();
			boolean removed = ticket.getAttachment().removeIf(attachment -> attachmentNames.contains(attachment));
			if (removed) {
				requestRepository.save(ticket);
				return ResponseEntity.ok("Attachments deleted successfully.");
			} else {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No matching attachments found to delete.");
			}
		} else {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ticket not found.");
		}
	}

	@Override
	public ResponseEntity<?> processBulkUpload(MultipartFile file) {
		try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
			// Step 1: Process Vendor Data
			Map<Integer, Request_table> vendorMap = processVendorSheet(workbook.getSheetAt(0));

			// Step 2: Process Brand Data
			processBrandSheet(workbook.getSheetAt(1), vendorMap);

			// Save all request tables with their linked brands
			requestRepository.saveAll(vendorMap.values());

			return ResponseEntity.ok("File uploaded successfully");
		} catch (IOException e) {
			throw new RuntimeException("Failed to process the Excel file", e);
		}
	}

	private Map<Integer, Request_table> processVendorSheet(Sheet vendorSheet) {
		Map<Integer, Request_table> vendorMap = new HashMap<>();

		for (Row row : vendorSheet) {
			if (row.getRowNum() == 0)
				continue;

			Request_table request = new Request_table();
			request.setVendorName(getCellValue(row.getCell(1)));
			request.setVendorLocation(getCellValue(row.getCell(2)));
			request.setCkplLocation(getCellValue(row.getCell(3)));
			request.setVendorCode(getCellValue(row.getCell(4)));
			request.setGstNo(getCellValue(row.getCell(5)));
			request.setCurrency(getCellValue(row.getCell(6)));
			request.setGstType(parseEgst(getCellValue(row.getCell(7))));
			request.setPaymentTerm(getCellValue(row.getCell(8)));
			request.setPoType(parseEpo(getCellValue(row.getCell(9))));
			request.setTotalBaseValue(parseLong(getCellValue(row.getCell(10))));
			request.setVendorMailId(getCellValue(row.getCell(11)));
			request.setStage(TicketStage.Business_Approver);
			request.setCreatedAt(new Date());
			request.setUpdatedAt(new Date());
			request.setCreatedBy(UserServiceImpl.getUserId());
			request.setIsDeleted(false);
			int vendorNo = parseInt(getCellValue(row.getCell(0)));
			vendorMap.put(vendorNo, request);
		}

		return vendorMap;
	}

	private void processBrandSheet(Sheet brandSheet, Map<Integer, Request_table> vendorMap) {
		for (Row row : brandSheet) {
			if (row.getRowNum() == 0)
				continue;

			int vendorNo = parseInt(getCellValue(row.getCell(1)));
			Request_table request = vendorMap.get(vendorNo);

			if (request == null) {
				throw new RuntimeException("Vendor not found for vendor.no: " + vendorNo);
			}

			Brand brand = new Brand();
			Year currentYear = Year.now();
			int year = currentYear.getValue();
			Month currentMonth = LocalDate.now().getMonth();
			String monthAbbreviation = currentMonth.getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
			brand.setBrandOrNonBrand(getCellValue(row.getCell(2)));
			brand.setDepartment(getCellValue(row.getCell(3)));
			brand.setDivision(getCellValue(row.getCell(4)));
			brand.setChannel(getCellValue(row.getCell(5)));
			brand.setRegion(getCellValue(row.getCell(6)));
			brand.setLocation(getCellValue(row.getCell(7)));
			brand.setValue(parseLong(getCellValue(row.getCell(8))));
			brand.setNatureOfExpenses(getCellValue(row.getCell(9)));
			brand.setPoDescription(getCellValue(row.getCell(10)));
			brand.setIoOrCostCentrePo(getCellValue(row.getCell(11)));
			brand.setDetailsBrand(getCellValue(row.getCell(12)));
			brand.setFundCentre(getCellValue(row.getCell(13)));
			brand.setCommitmentItem(getCellValue(row.getCell(14)));
			brand.setGlCode(getCellValue(row.getCell(15)));
			brand.setGlDescription(getCellValue(row.getCell(16)));
			brand.setIsDelete(false);
			brand.setActivityStartDate(new Date());
			brand.setActivityEndDate(new Date());
			brand.setYear(year);
			brand.setMonth(monthAbbreviation);

			Brand savedBrand = brandRepository.save(brand);
			if (request.getBrand() == null) {
				request.setBrand(new ArrayList<>());
			}
			request.getBrand().add(savedBrand);
			History history = new History();
			history.setIsDelete(false);
			history.setName(TicketStage.Requestor);
			history.setStatus(Estatus.Approved);
			request.addHistory(history);

			historyRepository.save(history);
		}
	}

	private Epo parseEpo(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		try {
			return Epo.valueOf(value.trim());
		} catch (IllegalArgumentException e) {
			System.err.println("Invalid Epo value: " + value);
			return null;
		}
	}

	private Egst parseEgst(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		try {
			return Egst.valueOf(value.trim());
		} catch (IllegalArgumentException e) {
			System.err.println("Invalid Epo value: " + value);
			return null;
		}
	}

	private String getCellValue(Cell cell) {
		if (cell == null) {
			return null;
		}

		switch (cell.getCellType()) {
			case STRING:
				return cell.getStringCellValue();
			case NUMERIC:
				if (DateUtil.isCellDateFormatted(cell)) {
					return cell.getDateCellValue().toString();
				} else {
					return String.valueOf(cell.getNumericCellValue());
				}
			case BOOLEAN:
				return String.valueOf(cell.getBooleanCellValue());
			default:
				return null;
		}
	}

	private int parseInt(String value) {
		try {
			if (value != null && !value.trim().isEmpty()) {
				if (value.contains(".")) {
					value = value.split("\\.")[0];
				}
				return Integer.parseInt(value.trim());
			}
			throw new RuntimeException("Invalid or empty value for vendor number.");
		} catch (NumberFormatException e) {
			System.err.println("Failed to parse integer from value: " + value);
			throw new RuntimeException("Invalid vendor number format: " + value, e);
		}
	}

	private Long parseLong(String value) {
		try {
			if (value != null && !value.trim().isEmpty()) {
				if (value.contains(".")) {
					value = value.split("\\.")[0];
				}
				return Long.parseLong(value.trim());
				// }
				// return Long.parseLong(value.trim());
			}
			return null;
		} catch (NumberFormatException e) {
			System.err.println("Failed to parse long from value: " + value);
			return null;
		}
	}

	@Override
	public ResponseEntity<List<Map<String, String>>> getBusinessApprover() {
		List<sop_po.model.user.User> allUsers = userRepository.findAll();
		List<Map<String, String>> businessApprovers = new ArrayList<>();

		for (sop_po.model.user.User user : allUsers) {
			if (user.getRoles().contains("Business_Approver")) {
				Map<String, String> approverData = new HashMap<>();
				approverData.put("id", user.getId());
				approverData.put("userName", user.getUsername());
				approverData.put("empId", user.getEmpId());
				approverData.put("email", user.getEmail());
				businessApprovers.add(approverData);
			}
		}

		if (businessApprovers.isEmpty()) {
			return ResponseEntity.noContent().build();
		} else {
			return ResponseEntity.ok(businessApprovers);
		}
	}

	@Override
	public Resource loadAsResource(String filename) throws MalformedURLException {

		String baseDirectory1 = "src/main/resources/static/assets/uploads/pocopyattachments";
		String baseDirectory2 = "src/main/resources/static/assets/uploads/attachments";
		Path filePath1 = Paths.get(baseDirectory1).resolve(filename).normalize();
		if (Files.exists(filePath1) && Files.isReadable(filePath1)) {
			return new UrlResource(filePath1.toUri());
		}

		Path filePath2 = Paths.get(baseDirectory2).resolve(filename).normalize();
		if (Files.exists(filePath2) && Files.isReadable(filePath2)) {
			return new UrlResource(filePath2.toUri());
		}

		throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");

	}

	@Override
	public ResponseEntity<List<Request_table>> ticketSearch(String search) {

		Query query = new Query(Criteria.where("isDeleted").ne(true));
		if (search != null && !search.isEmpty()) {
			query.addCriteria(new Criteria().orOperator(
					Criteria.where("reqNo").regex(search, "i"),
					Criteria.where("vendorName").regex(search, "i"),
					Criteria.where("vendorCode").regex(search, "i"),
					Criteria.where("stage").regex(search, "i"),
					Criteria.where("createdDate").regex(search, "i"),
					Criteria.where("totalBaseValue").regex(search, "i")));
		}
		List<Request_table> matchingTickets = mongoTemplate.find(query, Request_table.class);
		return ResponseEntity.ok(matchingTickets);
	}

	@Override
	public Resource export(LocalDate startDate, LocalDate endDate, String ticketType, String activeTab,
			Authentication authentication) throws IOException {

		String id = jwtUtils.getUserId();
		String userName = jwtUtils.getUserName();
		String activeRole = jwtUtils.getActiveRole();

		if (endDate.isAfter(LocalDate.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be a past or current date.");
		}
		LocalDateTime startDateTime = startDate.atStartOfDay();
		LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		boolean isSpecialUser = Arrays.asList("Misha H", "H Ganesh", "Sakthivel S", "Admin").contains(userName);

		List<Request_table> requests;
		if (isSpecialUser) {
			requests = requestRepository.findByCreatedAtDateAndTicketTypeForSpecialUsers(startDateTime, endDateTime,
					ticketType, Sort.by(Sort.Direction.ASC, "createdAt"), mongoTemplate);
		} else {
			requests = requestRepository.findByCreatedAtDateAndTicketType(startDateTime, endDateTime,
					ticketType, activeTab, activeRole, id, Sort.by(Sort.Direction.ASC, "createdAt"), mongoTemplate);
		}
		if (requests == null || requests.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tickets found for the given date range");
		}
		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("PO Report");
		String[] headers = { "Ticket number",
				"Vendor Name", "Vendor Code", "Vendor Location", "GSt No.", "brandDetails",
				"Vendor Mail ID", "Currency",
				"Payment Terms", "PO Type", "Total Base Amount", "ROI Description", "PO Req Name", "Creation Date",
				"Business Approver", "Rec Date", "Approved date", "Remarks", "PO Screening",
				"Approved date", "Remarks", "Budget Team", "Approved date", "Remarks",
				"PO Maker", "Approved date", "Remarks", "PO Checker", "Approved date", "Remarks",
				"PO Release Approver(HEPL)", "Approved date", "Remarks",
				"Ticket Status", "Pending with Role",
				"Pending Name of the Person", "Pending from When", "Request Creation Date",
				"Rejection Reason", "Rejected By Role",
				"Rejected By Name", "Hold Reason", "PO Number"
		};
		Row headerRow = sheet.createRow(0);
		for (int i = 0; i < headers.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(headers[i]);
			CellStyle style = workbook.createCellStyle();
			Font font = workbook.createFont();
			font.setBold(true);
			style.setFont(font);
			cell.setCellStyle(style);
		}

		int rowIdx = 1;
		for (Request_table request : requests) {
			Row row = sheet.createRow(rowIdx++);

			// Initialize variables
			String baDate = "", baRemarks = "", poScreen = "", poScreenDate = "", poScreenRemarks = "";
			String budgetTeam = "", budgetTeamDate = "", budgetTeamRemarks = "";
			String poMaker = "", poMakerDate = "", poMakerRemarks = "", poChecker = "", poCheckerDate = "",
					poCheckerRemarks = "";
			String poReleaseDate = "", poReleaseRemarks = "";
			String ticketStatus = "", pendingNameOfPerson = "", pendingFromWhen = "", rejectionRemarks = "";
			String rejectionRole = "", rejectedName = "", holdReason = "", brandDetails = "";

			TicketStage currentStage = request.getStage();
			LocalDateTime mostRecentDate = null;
			List<History> historyList = request.getHistoryList();
			if (historyList != null && !historyList.isEmpty()) {
				History lastHistory = historyList.get(historyList.size() - 1);

				if (lastHistory != null) {
					Estatus lastStatus = lastHistory.getStatus();

					switch (lastStatus) {
						case Draft:
							ticketStatus = "Pending";
							break;
						case Approved:
							ticketStatus = "Pending";
							break;
						case Reject:
							ticketStatus = "Rejected";
							break;
						case Hold:
							ticketStatus = "Hold";
							break;
						case Retrieve:
							ticketStatus = "Pending";
							break;
						case Completed:
							ticketStatus = "Completed";
							break;
						default:
							ticketStatus = "Unknown";
					}
					if (!Estatus.Completed.toString().equalsIgnoreCase(lastStatus.toString())) {
						pendingFromWhen = lastHistory.getDate() != null ? lastHistory.getDate().toString() : "N/A";
					}
				}
				for (History history : historyList) {

					if (currentStage != TicketStage.Completed) {
						if (currentStage.equals(TicketStage.Business_Approver)) {
							pendingNameOfPerson = request.getApproverUsername();
						} else if (currentStage.equals(TicketStage.Po_release)) {
							pendingNameOfPerson = request.getPoApprover();
						} else if (currentStage.equals(TicketStage.Requestor)) {
							pendingNameOfPerson = request.getUsername();
						} else {
							User user = userRepository.findByRolesAndType(currentStage, ticketType);
							pendingNameOfPerson = user.getUsername();
						}
					}
					if (Arrays.asList("Approved", "Submit", "Reject", "Hold", "Draft", "Ticket_Created")
							.contains(history.getStatus())) {
						mostRecentDate = history.getDate();
					}
					if ("Reject".equalsIgnoreCase(history.getStatus().toString())) {
						rejectionRemarks = history.getRemarks();
						rejectionRole = history.getName().toString();
						rejectedName = history.getUsername();
					}
					if ("Hold".equalsIgnoreCase(history.getStatus().toString())) {
						holdReason = history.getRemarks();
					}

					switch (history.getName()) {
						case Business_Approver:
							baRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								baDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case PO_Screening:
							poScreen = history.getUsername();
							poScreenRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								poScreenDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case Budget_Team:
							budgetTeam = history.getUsername();
							budgetTeamRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								budgetTeamDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case Po_maker:
							poMaker = history.getUsername();
							poMakerRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								poMakerDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case Po_checker:
							poChecker = history.getUsername();
							poCheckerRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								poCheckerDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case Po_release:
							poReleaseRemarks = history.getRemarks() != null ? history.getRemarks() : "";
							if (history.getStatus() == Estatus.Approved) {
								poReleaseDate = history.getDate() != null ? history.getDate().toString() : "";
							}
							break;
						case Completed:
							ticketStatus = "completed";
							break;
					}
				}
				if (!"Completed".equalsIgnoreCase(ticketStatus) && mostRecentDate == null && lastHistory != null) {
					pendingFromWhen = lastHistory.getDate().toString();
				}
			}
			for (Brand brand : request.getBrand()) {
				brandDetails = brand.getBrandOrNonBrand();
			}

			row.createCell(0).setCellValue(request.getReqNo() != null ? request.getReqNo() : "");
			row.createCell(1).setCellValue(request.getVendorName() != null ? request.getVendorName() : "");
			row.createCell(2).setCellValue(request.getVendorCode() != null ? request.getVendorCode() : "");
			row.createCell(3).setCellValue(request.getVendorLocation() != null ? request.getVendorLocation() : "");
			row.createCell(4).setCellValue(request.getGstNo() != null ? request.getGstNo() : "");
			row.createCell(5).setCellValue(brandDetails);
			row.createCell(6).setCellValue(request.getVendorMailId() != null ? request.getVendorMailId() : "");
			row.createCell(7).setCellValue(request.getCurrency() != null ? request.getCurrency() : "");
			row.createCell(8).setCellValue(request.getPaymentTerm() != null ? request.getPaymentTerm() : "");
			row.createCell(9).setCellValue(request.getPoType() != null ? request.getPoType().toString() : "");
			Long totalBaseValue = request.getTotalBaseValue();
			row.createCell(10).setCellValue(totalBaseValue != null ? String.valueOf(totalBaseValue) : "");
			row.createCell(11).setCellValue(request.getRoiDescription() != null ? request.getRoiDescription() : "");
			row.createCell(12).setCellValue(request.getUsername() != null ? request.getUsername() : "");
			row.createCell(13)
					.setCellValue(request.getCreatedAt() != null ? LocalDateTime
							.ofInstant(request.getCreatedAt().toInstant(), ZoneId.systemDefault()).format(dateFormatter)
							: "");
			row.createCell(14).setCellValue(request.getApproverUsername() != null ? request.getApproverUsername() : "");
			row.createCell(15)
					.setCellValue(request.getCreatedAt() != null ? LocalDateTime
							.ofInstant(request.getCreatedAt().toInstant(), ZoneId.systemDefault()).format(dateFormatter)
							: "");
			row.createCell(16).setCellValue(!baDate.isEmpty() ? LocalDateTime.parse(baDate).format(dateFormatter) : "");
			row.createCell(17).setCellValue(baRemarks);
			row.createCell(18).setCellValue(poScreen);
			row.createCell(19).setCellValue(
					!poScreenDate.isEmpty() ? LocalDateTime.parse(poScreenDate).format(dateFormatter) : "");
			row.createCell(20).setCellValue(poScreenRemarks);
			row.createCell(21).setCellValue(budgetTeam);
			row.createCell(22).setCellValue(
					!budgetTeamDate.isEmpty() ? LocalDateTime.parse(budgetTeamDate).format(dateFormatter) : "");
			row.createCell(23).setCellValue(budgetTeamRemarks);
			row.createCell(24).setCellValue(poMaker);
			row.createCell(25)
					.setCellValue(!poMakerDate.isEmpty() ? LocalDateTime.parse(poMakerDate).format(dateFormatter) : "");
			row.createCell(26).setCellValue(poMakerRemarks);
			row.createCell(27).setCellValue(poChecker);
			row.createCell(28).setCellValue(
					!poCheckerDate.isEmpty() ? LocalDateTime.parse(poCheckerDate).format(dateFormatter) : "");
			row.createCell(29).setCellValue(poCheckerRemarks);
			row.createCell(30).setCellValue(request.getPoApprover() != null ? request.getPoApprover() : "");
			row.createCell(31).setCellValue(
					!poReleaseDate.isEmpty() ? LocalDateTime.parse(poReleaseDate).format(dateFormatter) : "");
			row.createCell(32).setCellValue(poReleaseRemarks);
			row.createCell(33).setCellValue(ticketStatus);
			row.createCell(34).setCellValue(request.getStage() != null ? request.getStage().toString() : "");
			row.createCell(35).setCellValue(pendingNameOfPerson);
			row.createCell(36)
					.setCellValue(pendingFromWhen != null && !pendingFromWhen.isEmpty()
							? LocalDateTime.parse(pendingFromWhen).format(dateFormatter)
							: "");
			row.createCell(37)
					.setCellValue(request.getCreatedAt() != null ? LocalDateTime
							.ofInstant(request.getCreatedAt().toInstant(), ZoneId.systemDefault()).format(dateFormatter)
							: "");
			row.createCell(38).setCellValue(rejectionRemarks);
			row.createCell(39).setCellValue(rejectionRole);
			row.createCell(40).setCellValue(rejectedName);
			row.createCell(41).setCellValue(holdReason);
			row.createCell(42).setCellValue(request.getPoNumber() != null && !request.getPoNumber().isEmpty()
					? String.join(",", request.getPoNumber())
					: "");
		}

		for (int i = 0; i < headers.length; i++) {
			sheet.autoSizeColumn(i);
		}
		exportBrandDetails(workbook, requests);
		// exportPoNumbers(workbook, requests);
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return new ByteArrayResource(outputStream.toByteArray());
	}

	// private void exportPoNumbers(Workbook workbook, List<Request_table> requests)
	// {
	// Sheet sheet = workbook.createSheet("PO Numbers");

	// Row headerRow = sheet.createRow(0);
	// CellStyle style = workbook.createCellStyle();
	// Font font = workbook.createFont();
	// font.setBold(true);
	// style.setFont(font);

	// Cell h0 = headerRow.createCell(0);
	// h0.setCellValue("Ticket Number");
	// h0.setCellStyle(style);

	// Cell h1 = headerRow.createCell(1);
	// h1.setCellValue("PO Number");
	// h1.setCellStyle(style);

	// int rowIdx = 1;
	// for (Request_table request : requests) {
	// List<String> poNumbers = request.getPoNumber();
	// if (poNumbers != null && !poNumbers.isEmpty()) {
	// for (String poNumber : poNumbers) {
	// Row row = sheet.createRow(rowIdx++);
	// row.createCell(0).setCellValue(request.getReqNo() != null ?
	// request.getReqNo() : "");
	// row.createCell(1).setCellValue(poNumber != null ? poNumber : "");
	// }
	// }
	// }

	// sheet.autoSizeColumn(0);
	// sheet.autoSizeColumn(1);
	// }

	@Override
	public Resource fohExport(LocalDate startDate, LocalDate endDate, String ticketType, String activeTab)
			throws IOException {

		String activeRole = jwtUtils.getActiveRole();
		if (endDate.isAfter(LocalDate.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be a past or current date.");
		}
		if (!TicketStage.Budget_Team.toString().equalsIgnoreCase(activeRole)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Export is allowed only for Budget_Team role.");
		}
		LocalDateTime startDateTime = startDate.atStartOfDay();
		LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		List<Request_table> requests = requestRepository.findBudgetTeamExportTickets(startDateTime, endDateTime,
				ticketType, activeTab,
				mongoTemplate);

		if (requests == null || requests.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tickets found for the given date range");
		}

		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("Ticket Export New Headers");

		String[] headers = {
				"Ticket No", "Status", "Recived timeline", "PO initiator", "PO Approver", "Profit centre",
				"Channel", "Internal order", "Fund centre", "Amount", "Currency", "Total Value", "ROI Description",
				"Narration/Activity/Purpose of the request", "GL Account", "GL description", "Brand",
				"Sub category", "Period", "Budget released document no", "PO Created Number",
				"Created date", "Delivery date", "Activity Start and End", "Vendor Code", "Vendor Name",
				"Commitment Item"
		};

		Row headerRow = sheet.createRow(0);
		for (int i = 0; i < headers.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(headers[i]);
			CellStyle style = workbook.createCellStyle();
			Font font = workbook.createFont();
			font.setBold(true);
			style.setFont(font);
			cell.setCellStyle(style);
		}

		int rowIdx = 1;
		for (Request_table request : requests) {
			Row row = sheet.createRow(rowIdx++);

			// Get brand details (assuming first brand for main data)
			Brand firstBrand = (request.getBrand() != null && !request.getBrand().isEmpty())
					? request.getBrand().get(0)
					: null;

			// Calculate status based on the new logic
			String status = calculateNewTicketStatus(request);

			// Calculate total value based on currency with USD conversion
			String totalValue = calculateNewTotalValue(request.getTotalBaseValue(), request.getCurrency());

			// Get period from brand
			String period = (firstBrand != null) ? firstBrand.getMonth() + "-" + firstBrand.getYear() : "-";

			// Get activity dates
			String deliveryDate = (firstBrand != null && firstBrand.getActivityEndDate() != null)
					? LocalDateTime.ofInstant(firstBrand.getActivityEndDate().toInstant(), ZoneId.systemDefault())
							.format(dateFormatter)
					: "-";

			row.createCell(0).setCellValue(request.getReqNo() != null ? request.getReqNo() : "-"); // ticketNo is reqNo
			row.createCell(1).setCellValue(status);
			row.createCell(2).setCellValue(
					request.getCreatedAt() != null
							? LocalDateTime.ofInstant(request.getCreatedAt().toInstant(), ZoneId.systemDefault())
									.format(dateFormatter)
							: "-");
			row.createCell(3).setCellValue(request.getUsername() != null ? request.getUsername() : "-");
			row.createCell(4).setCellValue(request.getApproverUsername() != null ? request.getApproverUsername() : "-");
			row.createCell(5).setCellValue(
					firstBrand != null && firstBrand.getDivision() != null ? firstBrand.getDivision() : "-");
			row.createCell(6).setCellValue(
					firstBrand != null && firstBrand.getChannel() != null ? firstBrand.getChannel() : "-");
			row.createCell(7).setCellValue(
					firstBrand != null && firstBrand.getInternalorder() != null ? firstBrand.getInternalorder() : "-");
			row.createCell(8).setCellValue(
					firstBrand != null && firstBrand.getFundCentre() != null ? firstBrand.getFundCentre() : "-");
			row.createCell(9)
					.setCellValue(request.getTotalBaseValue() > 0 ? String.valueOf(request.getTotalBaseValue()) : "-");
			row.createCell(10).setCellValue(request.getCurrency() != null ? request.getCurrency() : "-");
			row.createCell(11).setCellValue(totalValue);
			row.createCell(12).setCellValue(
					request.getRoiDescription() != null ? request.getRoiDescription() : "-");
			row.createCell(13).setCellValue(
					firstBrand != null && firstBrand.getPoDescription() != null ? firstBrand.getPoDescription() : "-");
			row.createCell(14)
					.setCellValue(firstBrand != null && firstBrand.getGlCode() != null ? firstBrand.getGlCode() : "-");
			row.createCell(15).setCellValue(
					firstBrand != null && firstBrand.getGlDescription() != null ? firstBrand.getGlDescription() : "-");
			row.createCell(16).setCellValue(
					firstBrand != null && firstBrand.getDetailsBrand() != null ? firstBrand.getDetailsBrand() : "-");
			row.createCell(17)
					.setCellValue(firstBrand != null && firstBrand.getBrandSubCategory() != null
							? firstBrand.getBrandSubCategory()
							: "-"); // Sub category
			row.createCell(18).setCellValue(period); // Period
			row.createCell(19).setCellValue(request.getDocNum() != null ? request.getDocNum() : "-"); // Budget released
																										// document no
																										// is docNum
			row.createCell(20)
					.setCellValue(request.getPoNumber() != null && !request.getPoNumber().isEmpty()
							? String.join(",", request.getPoNumber())
							: "-"); // PO Created Number is poNumber
			row.createCell(21).setCellValue(
					request.getCreatedAt() != null
							? LocalDateTime.ofInstant(request.getCreatedAt().toInstant(), ZoneId.systemDefault())
									.format(dateFormatter)
							: "-");
			row.createCell(22).setCellValue(deliveryDate);
			row.createCell(23).setCellValue(deliveryDate);
			row.createCell(24).setCellValue(request.getVendorCode() != null ? request.getVendorCode() : "-");
			row.createCell(25).setCellValue(request.getVendorName() != null ? request.getVendorName() : "-");
			row.createCell(26).setCellValue(request.getCommitmentItem() != null ? request.getCommitmentItem() : "-");
		}

		// Auto-size columns
		for (int i = 0; i < headers.length; i++) {
			sheet.autoSizeColumn(i);
		}

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return new ByteArrayResource(outputStream.toByteArray());
	}

	private String calculateNewTicketStatus(Request_table request) {
		TicketStage currentStage = request.getStage();
		Estatus currentStatus = request.getStatus();
		List<History> historyList = request.getHistoryList();

		// Check if current stage is Budget_Team
		if (currentStage == TicketStage.Budget_Team) {
			if (currentStatus == Estatus.Approved || currentStatus == Estatus.Reject) {
				return "Need to be release";
			} else if (currentStatus == Estatus.Hold) {
				return "Holded";
			}
		}

		// If stage is not Budget_Team, check recent last history of budget team
		if (currentStage != TicketStage.Budget_Team && historyList != null) {
			// Find the most recent Budget_Team history
			History budgetTeamHistory = null;
			for (int i = historyList.size() - 1; i >= 0; i--) {
				History history = historyList.get(i);
				if (history.getName() == TicketStage.Budget_Team) {
					budgetTeamHistory = history;
					break;
				}
			}

			if (budgetTeamHistory != null) {
				if (budgetTeamHistory.getStatus() == Estatus.Approved) {
					return "Completed";
				} else if (budgetTeamHistory.getStatus() == Estatus.Reject) {
					return "Rejected";
				}
			} else {
				// Budget team history not found
				return "Need to be release";
			}
		}

		return "Need to be release";
	}

	private String calculateNewTotalValue(Long amount, String currency) {
		if (amount == null) {
			return "-";
		}

		if ("USD".equalsIgnoreCase(currency)) {
			// 1 USD equals INR conversion (using 83 as example rate)
			double usdToInrRate = 83.0;
			double totalValue = amount * usdToInrRate;
			return String.valueOf((long) totalValue);
		} else if ("INR".equalsIgnoreCase(currency)) {
			// If currency is INR then amount is total value
			return String.valueOf(amount);
		}

		// Default case
		return String.valueOf(amount);
	}

	private void exportBrandDetails(Workbook workbook, List<Request_table> requests) {
		Sheet brandSheet = workbook.createSheet("PO Brand Details");
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

		String[] brandHeaders = {
				"Req No", "Brand", "Profit Center", "Region", "Brand Sub Category",
				"Department", "Location", "Amount", "GL", "Period",
				"PO Description", "Distribution Channel", "GL Description", "Request From",
				"Internal Order", "Fund Centre", "Cost Center", "Commitment Item",
				"Activity Start Date", "Activity End Date", "HSN/SAC", "CKPL Location", "GST Type", "Districts"
		};

		Row brandHeaderRow = brandSheet.createRow(0);
		for (int i = 0; i < brandHeaders.length; i++) {
			Cell cell = brandHeaderRow.createCell(i);
			cell.setCellValue(brandHeaders[i]);

			CellStyle style = workbook.createCellStyle();
			Font font = workbook.createFont();
			font.setBold(true);
			style.setFont(font);
			cell.setCellStyle(style);
		}

		int rowIdx = 1;

		for (Request_table request : requests) {
			List<Brand> brands = request.getBrand();

			if (brands != null && !brands.isEmpty()) {
				for (Brand brand : brands) {
					Row row = brandSheet.createRow(rowIdx++);
					row.createCell(0).setCellValue(request.getReqNo() != null ? request.getReqNo() : "");
					row.createCell(1).setCellValue(brand.getDetailsBrand() != null ? brand.getDetailsBrand() : "");
					row.createCell(2).setCellValue(brand.getDivision() != null ? brand.getDivision() : "");
					row.createCell(3).setCellValue(brand.getRegion() != null ? brand.getRegion() : "");
					row.createCell(4)
							.setCellValue(brand.getBrandSubCategory() != null ? brand.getBrandSubCategory() : "");
					row.createCell(5).setCellValue(brand.getDepartment() != null ? brand.getDepartment() : "");
					row.createCell(6).setCellValue(brand.getLocation() != null ? brand.getLocation() : "");
					Long amount = brand.getValue();
					row.createCell(7).setCellValue(amount != null ? String.valueOf(amount) : "");
					String period = brand.getMonth() + "-" + brand.getYear();
					row.createCell(8).setCellValue(brand.getGlCode() != null ? brand.getGlCode() : "");
					row.createCell(9).setCellValue(period != null ? period : "");
					row.createCell(10).setCellValue(brand.getPoDescription() != null ? brand.getPoDescription() : "");
					row.createCell(11).setCellValue(brand.getChannel() != null ? brand.getChannel() : "");
					row.createCell(12).setCellValue(brand.getGlDescription() != null ? brand.getGlDescription() : "");
					row.createCell(13).setCellValue(request.getUsername() != null ? request.getUsername() : "");
					row.createCell(14).setCellValue(brand.getInternalorder() != null ? brand.getInternalorder() : "");
					row.createCell(15).setCellValue(brand.getFundCentre() != null ? brand.getFundCentre() : "");
					row.createCell(16).setCellValue(brand.getCostcenter() != null ? brand.getCostcenter() : "");
					row.createCell(17).setCellValue(brand.getCommitmentItem() != null ? brand.getCommitmentItem() : "");
					row.createCell(18).setCellValue(brand.getActivityStartDate() != null
							? LocalDateTime.ofInstant(brand.getActivityStartDate().toInstant(), ZoneId.systemDefault())
									.format(dateFormatter)
							: "");
					row.createCell(19).setCellValue(brand.getActivityEndDate() != null
							? LocalDateTime.ofInstant(brand.getActivityEndDate().toInstant(), ZoneId.systemDefault())
									.format(dateFormatter)
							: "");
					row.createCell(20).setCellValue(brand.getSacHsnCode() != null ? brand.getSacHsnCode() : "");
					row.createCell(21).setCellValue(brand.getCkplLocation() != null ? brand.getCkplLocation() : "");
					row.createCell(22).setCellValue(brand.getGstType() != null ? brand.getGstType() : "");
					row.createCell(23).setCellValue(brand.getDistrict() != null && !brand.getDistrict().isEmpty()
							? String.join(",", brand.getDistrict())
							: "");
				}
			}
		}

		for (int i = 0; i < brandHeaders.length; i++) {
			brandSheet.autoSizeColumn(i);
		}
	}

	@Override
	public ResponseEntity<?> getNotification(String role, String ticketType) {
		Sort sort = Sort.by("updatedAt").ascending();
		List<Notifications> notifications = notificationRepo.findAllByRoleAndTicketType(role, ticketType, sort);
		return ResponseEntity.ok(notifications);
	}

	@Override
	public ResponseEntity<?> getnotificationByUserId(String id, String ticketType) {
		Sort sort = Sort.by("updatedAt").ascending();
		List<Notifications> notifications = notificationRepo.findAllByUseridAndTicketType(id, ticketType, sort);

		return ResponseEntity.ok(notifications);
	}

	@Override
	public ResponseEntity<?> updatestatus(String id) {
		Notifications notification = notificationRepo.findById(id)
				.orElseThrow(() -> new RuntimeException("Notification not found"));

		notification.setIsRead(true);
		notification.setIsText(true);
		return ResponseEntity.ok(notificationRepo.save(notification));
	}

	@Override
	public ResponseEntity<?> deletenotificationByUserId(String id) {

		notificationRepo.deleteAllByUserid(id);
		return ResponseEntity.noContent().build();
	}

	@Override
	public ResponseEntity<?> deletenotification(String id) {

		Notifications notification = notificationRepo.findById(id)
				.orElseThrow(() -> new RuntimeException("Notification not found"));
		notificationRepo.delete(notification);
		return ResponseEntity.noContent().build();

	}

	@Override
	public ResponseEntity<?> deletenotificationByRole(String id) {

		notificationRepo.deleteAllByRole(id);
		return ResponseEntity.noContent().build();
	}

	@Override
	public ResponseEntity<?> holdTicket(String ticketId, Estatus status, String remarks, Authentication authentication)
			throws Exception {

		Request_table request = requestRepository.findById(ticketId)
				.orElseThrow(() -> new Exception("Ticket not found"));

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String id = userDetails.getId();
		String username = userDetails.getUsername();

		if (!request.getStage().equals(TicketStage.Po_maker) && !request.getStage().equals(TicketStage.Budget_Team)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid stage: The current stage must be Po_maker or Budget_Team.");
		}

		List<History> historyList = request.getHistoryList();
		if (historyList == null || historyList.isEmpty()) {
			throw new Exception("History list is empty.");
		}
		if (status == Estatus.Hold) {
			History history = new History();
			history.setIsDelete(false);
			history.setName(request.getStage());
			history.setUsername(username);
			history.setStatus(status);
			history.setRemarks(remarks);
			history.setDate(LocalDateTime.now());
			request.addHistory(history);

			historyRepository.save(history);
			request.setStatus(status);
			request.setUpdatedAt(new Date());
			request.setUpdatedBy(id);
			requestRepository.save(request);

			if (request.getStage().equals(TicketStage.Budget_Team) || request.getStage().equals(TicketStage.Po_maker)) {
				Optional<User> userOpt = userRepository.findById(request.getCreatedBy());
				if (userOpt.isPresent()) {
					User user = userOpt.get();
					String mailId = userOpt.get().getEmail();
					if (mailId != null && !mailId.isEmpty()) {
						String emailContent = mailTemplateService.holdMailTemplate(
								user.getUsername(),
								username,
								request,
								remarks);
						mailServiceAsync.sendMail(emailContent, mailId, "Ticket Hold Notification", null);
					}
				}
			}

			return ResponseEntity.ok("Ticket has been successfully placed on hold.");
		} else if (status == Estatus.Retrieve) {
			History history = new History();
			history.setIsDelete(false);
			history.setName(request.getStage());
			history.setUsername(username);
			history.setStatus(status);
			history.setRemarks(remarks);
			history.setDate(LocalDateTime.now());
			request.addHistory(history);

			historyRepository.save(history);
			request.setStatus(Estatus.Approved);
			requestRepository.save(request);

			return ResponseEntity.ok("Ticket has been successfully retrieved.");
		}

		throw new Exception("Invalid status: Status must be either Hold or Retrieve.");
	}

	@Override
	public ResponseEntity<?> getholdTicket(String stage, String ticketType) {
		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(
						Criteria.where("status").is(Estatus.Hold).and("stage").is(stage).and("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")));
		List<Request_table> request = mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class)
				.getMappedResults();
		return ResponseEntity.ok(request);
	}

	@Override
	public ResponseEntity<?> getBuisnessApproverTickets(Authentication authentication) {

		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		List<Request_table> filteredTickets = requestRepository.findByStageAndBusinessApprover("Business_Approver",
				userId);

		return ResponseEntity.ok(filteredTickets);

	}

	@Override
	public ResponseEntity<?> fetchRejectedTickets(String stage, String ticketType) {

		String id = jwtUtils.getUserId();
		List<Request_table> rejectedTickets = requestRepository.findRejectedTicketsForStage(stage, ticketType,
				id, mongoTemplate);
		return rejectedTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(rejectedTickets);
	}

	@Override
	public ResponseEntity<?> getAllPoTickets(String role, int page, int size, String search,
			Authentication authentication) {

		String activeRole = jwtUtils.getActiveRole();
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

		Criteria criteria = new Criteria();
		List<Criteria> filters = new ArrayList<>();
		filters.add(Criteria.where("isDeleted").ne(true));

		// Add role-based filter
		if (activeRole != null && activeRole.equalsIgnoreCase(TicketStage.Delivery_Planner.toString())) {
			filters.add(Criteria.where("brand").elemMatch(Criteria.where("materialCode").ne(null).ne("")));
		}

		// Add search filter
		if (search != null && !search.trim().isEmpty()) {
			filters.add(new Criteria().orOperator(
					Criteria.where("reqNo").regex(search, "i"),
					Criteria.where("vendorName").regex(search, "i"),
					Criteria.where("vendorCode").regex(search, "i"),
					Criteria.where("username").regex(search, "i"),
					Criteria.where("stage").regex(search, "i"),
					Criteria.where("status").regex(search, "i"),
					Criteria.where("totalBaseValue").regex(search, "i")));
		}

		if (!filters.isEmpty()) {
			criteria.andOperator(filters.toArray(new Criteria[0]));
		}

		Query query = new Query(criteria).with(pageable);
		List<Request_table> tickets = mongoTemplate.find(query, Request_table.class);
		long totalElements = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Request_table.class);
		int totalPages = (int) Math.ceil((double) totalElements / size);

		Map<String, Object> response = new HashMap<>();
		response.put("content", tickets);
		response.put("totalElements", totalElements);
		response.put("totalPages", totalPages);
		response.put("currentPage", page);
		response.put("pageSize", size);

		return ResponseEntity.ok(response);
	}

	private String validateUserBudget(long value, String userId, String glcode) {

		GlEntity glEntity = gldetailsRepository.findByGlacct(glcode);
		if (glEntity == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GL code not found");
		}
		if (glEntity.isCustomApprover()) {
			return "false";
		}
		// Optional<BudgetRange> budgetRangeOpt =
		// budgetRepository.findByUserIdsContaining(userId);
		Optional<BudgetRange> budgetRangeOpt = budgetRepository.findFirstByUserIdsContaining(userId);

		if (budgetRangeOpt.isPresent()) {
			BudgetRange budgetRange = budgetRangeOpt.get();
			Long maxBudget = budgetRange.getMax();

			if (maxBudget == 50000) {
				return value <= 50000 ? "true" : "false";
			} else {
				return "nextstage";
			}
		}
		return "nextstage";
	}

	@SuppressWarnings("rawtypes")
	@Override
	public ResponseEntity<?> getAllVendors(String ticketType, Authentication authentication) {
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		String activeRole = jwtUtils.getActiveRole();

		Criteria matchCriteria = Criteria.where("vendorCode").ne(null).and("vendorName").ne(null);

		if ("Requestor".equals(activeRole)) {
			matchCriteria = matchCriteria.and("createdBy").is(userId);
		} else if ("Business_Approver".equals(activeRole)) {
			matchCriteria = matchCriteria.and("businessApprover").is(userId);
		} else if ("Po_release".equals(activeRole)) {
			matchCriteria = matchCriteria.and("poApproverId").is(userId);
		}

		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")),
				Aggregation.match(matchCriteria),
				Aggregation.group("vendorCode").first("vendorName").as("vendorName"),
				Aggregation.project("vendorName").and("_id").as("vendorCode"));
		List<Map> vendors = mongoTemplate.aggregate(aggregation, "Request_table", Map.class).getMappedResults();
		return ResponseEntity.ok(vendors);
	}

	@SuppressWarnings("rawtypes")
	@Override
	public ResponseEntity<?> getAllDivisions(String ticketType, Authentication authentication) {
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		String activeRole = jwtUtils.getActiveRole();

		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.unwind("brandDetails"));
		operations.add(
				Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")));

		Criteria matchCriteria = Criteria.where("brandDetails.division").ne(null);

		if ("Requestor".equals(activeRole)) {
			matchCriteria = matchCriteria.and("createdBy").is(userId);
		} else if ("Business_Approver".equals(activeRole)) {
			matchCriteria = matchCriteria.and("businessApprover").is(userId);
		} else if ("Po_release".equals(activeRole)) {
			matchCriteria = matchCriteria.and("poApproverId").is(userId);
		}

		operations.add(Aggregation.match(matchCriteria));
		operations.add(Aggregation.group("brandDetails.division"));
		operations.add(Aggregation.project().and("_id").as("division"));

		Aggregation aggregation = Aggregation.newAggregation(operations);
		List<Map> divisions = mongoTemplate.aggregate(aggregation, "Request_table", Map.class).getMappedResults();
		return ResponseEntity.ok(divisions);
	}

	@Override
	public ResponseEntity<?> getEbriefTicketData(int page, int size, LocalDate startDate, LocalDate endDate) {

		List<Request_table> allTickets = new ArrayList<>();

		if (startDate != null && endDate != null) {
			allTickets = requestRepository.findByBrandEBriefActivityIdAndActivityDate(startDate, endDate,
					"Completed", mongoTemplate);
		} else {
			allTickets = requestRepository.findByBrandEBriefActivityId("Completed", mongoTemplate);
		}

		if (allTickets == null || allTickets.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tickets for Ebrief id");
		}

		long totalElements = allTickets.size();
		int totalPages = (int) Math.ceil((double) totalElements / size);
		int startIndex = page * size;
		int endIndex = Math.min(startIndex + size, allTickets.size());

		List<Request_table> paginatedTickets = allTickets.subList(startIndex, endIndex);

		List<EbriefTicketDto> limitedData = paginatedTickets.stream()
				.map(ticket -> new sop_po.response.EbriefTicketDto(
						ticket.getReqNo(),
						ticket.getUsername(),
						ticket.getVendorName(),
						ticket.getVendorLocation(),
						ticket.getVendorCode(),
						ticket.getGstNo(),
						ticket.getCurrency(),
						ticket.getPaymentTerm(),
						ticket.getPoType(),
						ticket.getPoNumber(),
						ticket.getApproverUsername(),
						ticket.getDocNum(),
						ticket.getBrand() != null ? ticket.getBrand().stream()
								.map(brand -> new sop_po.response.BrandDto(
										brand.getBrandOrNonBrand(),
										brand.getMaterialCode(),
										brand.getDeliveryPlant(),
										brand.getDetailsBrand(),
										brand.getDivision(),
										brand.getChannel(),
										brand.getRegion(),
										brand.getValue(),
										brand.getCommitmentItem(),
										brand.getNatureOfExpenses(),
										brand.getPoDescription(),
										brand.getActivityStartDate(),
										brand.getActivityEndDate(),
										brand.getCkplLocation(),
										brand.getGstType(),
										brand.getGlCode(),
										brand.getFundCentre(),
										brand.getInternalorder(),
										brand.getDistrict(),
										brand.getBrandSubCategory(),
										brand.getEBrief()))
								.collect(Collectors.toList()) : null))
				.collect(Collectors.toList());

		Map<String, Object> response = new HashMap<>();
		response.put("content", limitedData);
		response.put("totalElements", totalElements);
		response.put("totalPages", totalPages);
		response.put("currentPage", page);
		response.put("pageSize", size);

		return ResponseEntity.ok(response);
	}

	@Override
	public ResponseEntity<?> deleteTicket(String ticketId, String status, Authentication authentication) {
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		Request_table ticket = requestRepository.findById(ticketId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
						"Ticket not found with ID: " + ticketId));

		if (!userId.equals(ticket.getCreatedBy())) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own tickets");
		}

		if ("delete".equalsIgnoreCase(status)) {
			ticket.setIsDeleted(true);
			requestRepository.save(ticket);
			return ResponseEntity.ok("Ticket deleted successfully");
		} else if ("revert".equalsIgnoreCase(status)) {
			ticket.setIsDeleted(false);
			requestRepository.save(ticket);
			return ResponseEntity.ok("Ticket reverted successfully");
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid status. Use 'delete' or 'revert'");
		}
	}

	@Override
	public ResponseEntity<?> getDeletedTickets(Authentication authentication) {
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		String userId = userDetails.getId();

		Query query = new Query(Criteria.where("createdBy").is(userId).and("isDeleted").is(true));
		List<Request_table> deletedTickets = mongoTemplate.find(query, Request_table.class);
		return ResponseEntity.ok(deletedTickets);
	}

	@Override
	public Resource exportCompletedTickets(LocalDate startDate, LocalDate endDate) throws IOException {
		Criteria criteria = Criteria.where("isDeleted").ne(true);

		if (startDate != null && endDate != null) {
			LocalDateTime startDateTime = startDate.atStartOfDay();
			LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);
			criteria = criteria.and("createdAt").gte(startDateTime).lte(endDateTime);
		}

		Query query = new Query(criteria).with(Sort.by(Sort.Direction.ASC, "createdAt"));
		List<Request_table> requests = mongoTemplate.find(query, Request_table.class);

		if (requests == null || requests.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No completed tickets found");
		}

		SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy");

		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("Completed Tickets");

		String[] headers = {
				"Ticket Number", "Vendor Name", "Vendor Code", "Vendor Location", "GST No.",
				"Brand/NonBrand", "Vendor Mail ID", "Currency", "Payment Terms", "PO Type",
				"Total Base Amount", "ROI Description", "PO Req Name", "Creation Date",
				"Business Approver", "Ticket Status", "Current Stage", "Division", "Channel",
				"Region", "Department", "Location", "GL Code", "GL Description",
				"Internal Order", "Cost Center", "Fund Centre", "Commitment Item",
				"Nature of Expenses", "PO Description", "Material Group", "Value",
				"Month", "Year", "Activity Start Date", "Activity End Date",
				"PO Number", "Doc Number"
		};

		Row headerRow = sheet.createRow(0);
		CellStyle headerStyle = workbook.createCellStyle();
		Font font = workbook.createFont();
		font.setBold(true);
		headerStyle.setFont(font);
		for (int i = 0; i < headers.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(headers[i]);
			cell.setCellStyle(headerStyle);
		}

		int rowIdx = 1;
		for (Request_table request : requests) {
			List<Brand> brands = request.getBrand();
			if (brands == null || brands.isEmpty()) {
				Row row = sheet.createRow(rowIdx++);
				writeCompletedTicketRow(row, request, null, sdf);
			} else {
				for (Brand brand : brands) {
					Row row = sheet.createRow(rowIdx++);
					writeCompletedTicketRow(row, request, brand, sdf);
				}
			}
		}

		for (int i = 0; i < headers.length; i++) {
			sheet.autoSizeColumn(i);
		}

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();

		return new ByteArrayResource(outputStream.toByteArray());
	}

	private void writeCompletedTicketRow(Row row, Request_table req, Brand brand, SimpleDateFormat sdf) {
		String poNumbers = req.getPoNumber() != null ? String.join(",", req.getPoNumber()) : "";

		row.createCell(0).setCellValue(req.getReqNo() != null ? req.getReqNo() : "");
		row.createCell(1).setCellValue(req.getVendorName() != null ? req.getVendorName() : "");
		row.createCell(2).setCellValue(req.getVendorCode() != null ? req.getVendorCode() : "");
		row.createCell(3).setCellValue(req.getVendorLocation() != null ? req.getVendorLocation() : "");
		row.createCell(4).setCellValue(req.getGstNo() != null ? req.getGstNo() : "");
		row.createCell(5)
				.setCellValue(brand != null && brand.getBrandOrNonBrand() != null ? brand.getBrandOrNonBrand() : "");
		row.createCell(6).setCellValue(req.getVendorMailId() != null ? req.getVendorMailId() : "");
		row.createCell(7).setCellValue(req.getCurrency() != null ? req.getCurrency() : "");
		row.createCell(8).setCellValue(req.getPaymentTerm() != null ? req.getPaymentTerm() : "");
		row.createCell(9).setCellValue(req.getPoType() != null ? req.getPoType().toString() : "");
		row.createCell(10).setCellValue(String.valueOf(req.getTotalBaseValue()));
		row.createCell(11).setCellValue(req.getRoiDescription() != null ? req.getRoiDescription() : "");
		row.createCell(12).setCellValue(req.getUsername() != null ? req.getUsername() : "");
		row.createCell(13).setCellValue(req.getCreatedAt() != null ? sdf.format(req.getCreatedAt()) : "");
		row.createCell(14).setCellValue(req.getApproverUsername() != null ? req.getApproverUsername() : "");
		row.createCell(15).setCellValue(req.getStatus() != null ? req.getStatus().toString() : "");
		row.createCell(16).setCellValue(req.getStage() != null ? req.getStage().toString() : "");
		row.createCell(17).setCellValue(brand != null && brand.getDivision() != null ? brand.getDivision() : "");
		row.createCell(18).setCellValue(brand != null && brand.getChannel() != null ? brand.getChannel() : "");
		row.createCell(19).setCellValue(brand != null && brand.getRegion() != null ? brand.getRegion() : "");
		row.createCell(20).setCellValue(brand != null && brand.getDepartment() != null ? brand.getDepartment() : "");
		row.createCell(21).setCellValue(brand != null && brand.getLocation() != null ? brand.getLocation() : "");
		row.createCell(22).setCellValue(brand != null && brand.getGlCode() != null ? brand.getGlCode() : "");
		row.createCell(23)
				.setCellValue(brand != null && brand.getGlDescription() != null ? brand.getGlDescription() : "");
		row.createCell(24)
				.setCellValue(brand != null && brand.getInternalorder() != null ? brand.getInternalorder() : "");
		row.createCell(25).setCellValue(brand != null && brand.getCostcenter() != null ? brand.getCostcenter() : "");
		row.createCell(26).setCellValue(brand != null && brand.getFundCentre() != null ? brand.getFundCentre() : "");
		row.createCell(27)
				.setCellValue(brand != null && brand.getCommitmentItem() != null ? brand.getCommitmentItem() : "");
		row.createCell(28)
				.setCellValue(brand != null && brand.getNatureOfExpenses() != null ? brand.getNatureOfExpenses() : "");
		row.createCell(29)
				.setCellValue(brand != null && brand.getPoDescription() != null ? brand.getPoDescription() : "");
		row.createCell(30)
				.setCellValue(brand != null && brand.getMaterialGroup() != null ? brand.getMaterialGroup() : "");
		row.createCell(31).setCellValue(brand != null ? String.valueOf(brand.getValue()) : "");
		row.createCell(32).setCellValue(brand != null && brand.getMonth() != null ? brand.getMonth() : "");
		row.createCell(33).setCellValue(brand != null ? String.valueOf(brand.getYear()) : "");
		row.createCell(34).setCellValue(
				brand != null && brand.getActivityStartDate() != null ? sdf.format(brand.getActivityStartDate()) : "");
		row.createCell(35).setCellValue(
				brand != null && brand.getActivityEndDate() != null ? sdf.format(brand.getActivityEndDate()) : "");
		row.createCell(36).setCellValue(poNumbers);
		row.createCell(37).setCellValue(req.getDocNum() != null ? req.getDocNum() : "");
	}

	@Override
	public ResponseEntity<?> getPoCheckerApprovedTickets(int page, int size, String type, String search) {
		
		List<Request_table> tickets = requestRepository.findTicketsApprovedByPoChecker(page, size, type, search,
				mongoTemplate);
		long totalElements = requestRepository.countTicketsApprovedByPoChecker(type, search, mongoTemplate);
		int totalPages = (int) Math.ceil((double) totalElements / size);

		Map<String, Object> response = new HashMap<>();
		response.put("content", tickets);
		response.put("totalElements", totalElements);
		response.put("totalPages", totalPages);
		response.put("currentPage", page);
		response.put("pageSize", size);

		return ResponseEntity.ok(response);
	}

	@Override
	public Resource brandPoExport(LocalDate startDate, LocalDate endDate, String authorization) throws IOException {
		if (authorization == null || !authorization.startsWith("Basic ")) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}
		String decoded = new String(java.util.Base64.getDecoder().decode(authorization.substring(6)));
		String[] credentials = decoded.split(":", 2);
		if (credentials.length != 2 || !credentials[0].equals(basicAuthUsername) || !credentials[1].equals(basicAuthPassword)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}
		LocalDateTime startDateTime = startDate.atStartOfDay();
		LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);

		List<Request_table> requests = requestRepository.findByTypeWithDateFilter(
				startDateTime, endDateTime, "Brand", mongoTemplate);

		if (requests == null || requests.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No brand tickets found for the given date range");
		}

		Workbook workbook = new XSSFWorkbook();
		Sheet sheet = workbook.createSheet("Brand PO Export");

		Row headerRow = sheet.createRow(0);
		CellStyle style = workbook.createCellStyle();
		Font font = workbook.createFont();
		font.setBold(true);
		style.setFont(font);
		Cell h0 = headerRow.createCell(0);
		h0.setCellValue("PO Number");
		h0.setCellStyle(style);
		Cell h1 = headerRow.createCell(1);
		h1.setCellValue("ROI Description");
		h1.setCellStyle(style);

		int rowIdx = 1;
		for (Request_table request : requests) {
			List<String> poNumbers = request.getPoNumber();
			String roiDesc = request.getRoiDescription() != null ? request.getRoiDescription() : "";
			if (poNumbers != null && !poNumbers.isEmpty()) {
				for (String po : poNumbers) {
					Row row = sheet.createRow(rowIdx++);
					row.createCell(0).setCellValue(po != null ? po : "");
					row.createCell(1).setCellValue(roiDesc);
				}
			}
		}

		sheet.autoSizeColumn(0);
		sheet.autoSizeColumn(1);

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		workbook.write(outputStream);
		workbook.close();
		return new ByteArrayResource(outputStream.toByteArray());
	}

	@Override
	public List<Map<String, String>> brandPoData(LocalDate startDate, LocalDate endDate, String authorization) {

		if (authorization == null || !authorization.startsWith("Basic ")) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}
		String decoded = new String(java.util.Base64.getDecoder().decode(authorization.substring(6)));
		String[] credentials = decoded.split(":", 2);
		if (credentials.length != 2 || !credentials[0].equals(basicAuthUsername) || !credentials[1].equals(basicAuthPassword)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}

		LocalDateTime startDateTime = startDate.atStartOfDay();
		LocalDateTime endDateTime = endDate.atTime(23, 59, 59, 999999999);

		List<Request_table> requests = requestRepository.findByTypeWithDateFilter(
				startDateTime, endDateTime, "Brand", mongoTemplate);

		if (requests == null || requests.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No brand tickets found for the given date range");
		}

		List<Map<String, String>> result = new java.util.ArrayList<>();
		for (Request_table request : requests) {
			List<String> poNumbers = request.getPoNumber();
			String roiDesc = request.getRoiDescription() != null ? request.getRoiDescription() : "";
			if (poNumbers != null && !poNumbers.isEmpty()) {
				for (String po : poNumbers) {
					Map<String, String> row = new java.util.LinkedHashMap<>();
					row.put("poNumber", po != null ? po : "");
					row.put("roiDescription", roiDesc);
					result.add(row);
				}
			}
		}
		return result;
	}


	private void validateVendor(String vendorCode) {
		if (vendorCode == null || vendorCode.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor Code is required");
		}
		Vendor vendor = vendorRepo.findByVendorCode(vendorCode.trim());
		if (vendor == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid Vendor Code: " + vendorCode);
		}
		if (vendor.getStatus() == null || "yes".equalsIgnoreCase(vendor.getStatus())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor is Blocked: " + vendorCode);
		}
	}
}
