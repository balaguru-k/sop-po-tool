package sop_po.serviceImpl;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Objects;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mongodb.client.result.UpdateResult;

import jakarta.validation.Valid;
import sop_po.controller.user.UserPasswordForgot;
import sop_po.jwt.JwtUtils;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.TicketStage;
import sop_po.model.user.SwitchRole;
import sop_po.model.user.User;
import sop_po.repository.RequestRepository;
import sop_po.repository.UserRepository;
import sop_po.request.LoginRequest;
import sop_po.request.SignupRequest;
import sop_po.response.ApiResponse;
import sop_po.response.UserDto;
import sop_po.security.service.UserDetailsImpl;
import sop_po.service.MailServiceAsync;
import sop_po.service.MailTemplateService;
import sop_po.service.UserService;

@Service
public class UserServiceImpl implements UserService {
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtUtils jwtUtils;
	@Autowired
	PasswordEncoder encoder;

	@Autowired
	private MailTemplateService mailTemplateService;

	@Autowired
	private MailServiceAsync mailServiceAsync;

	@Autowired
	private MongoTemplate mongoTemplate;

	@Autowired
	private RequestRepository requestRepository;

	@Value("${path.getPath}")
	private String getPath;

	@Value("${path.fileBasePath}")
	private String fileBasePath;

	private static final Logger logger = LoggerFactory.getLogger(UserDetailsImpl.class);

	@Override
	public ResponseEntity<?> signUp(SignupRequest request, MultipartFile file) throws IOException {
		try {
			ResponseEntity<?> validationError = validateSignupRequest(request);
			if (validationError != null) return validationError;

			boolean isUpdate = request.getId() != null && userRepository.existsById(request.getId());
			User user;

			if (isUpdate) {
				user = userRepository.findById(request.getId()).orElseThrow();
				ResponseEntity<?> duplicateError = checkDuplicatesForUpdate(request, user);
				if (duplicateError != null) return duplicateError;
			} else {
				ResponseEntity<?> duplicateError = checkDuplicatesForCreate(request);
				if (duplicateError != null) return duplicateError;
				user = new User();
				user.setCreated_At(Calendar.getInstance().getTime());
			}

			handleProfilePicture(user, file);
			applyUserFields(user, request);
			userRepository.save(user);

			return ResponseEntity.ok(new ApiResponse(true, isUpdate ? "User updated successfully" : "User created successfully", user));

		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(new ApiResponse(false, "Error processing the file: " + e.getMessage(), null));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(new ApiResponse(false, "An error occurred: " + e.getMessage(), null));
		}
	}

	private ResponseEntity<?> validateSignupRequest(SignupRequest request) {
		Map<String, String> errors = new HashMap<>();
		if (request.getEmail() == null || request.getEmail().trim().isEmpty())
			errors.put("email", "Email is required");
		if (request.getUserName() == null || request.getUserName().trim().isEmpty())
			errors.put("username", "Username is required");
		if (request.getEmpId() == null || request.getEmpId().trim().isEmpty())
			errors.put("empId", "Employee ID is required");
		if (request.getRoles() == null || request.getRoles().isEmpty())
			errors.put("roles", "Roles are required");
		if (!errors.isEmpty())
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Validation failed", errors));
		return null;
	}

	private ResponseEntity<?> checkDuplicatesForUpdate(SignupRequest request, User existingUser) {
		if (!existingUser.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail()))
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Email already exists", null));
		if (!request.getEmpId().equals(existingUser.getEmpId()) && userRepository.existsByEmpId(request.getEmpId()))
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Employee ID already exists", null));
		return null;
	}

	private ResponseEntity<?> checkDuplicatesForCreate(SignupRequest request) {
		if (userRepository.existsByEmail(request.getEmail()))
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Email already exists", null));
		if (userRepository.existsByEmpId(request.getEmpId()))
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Employee ID already exists", null));
		return null;
	}

	private void handleProfilePicture(User user, MultipartFile file) throws IOException {
		if (file != null && !file.isEmpty()) {
			String formattedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
			String fileName = formattedTime + "_" + file.getOriginalFilename();
			Path path = Paths.get(fileBasePath, fileName);
			Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
			user.setProfilePicture(getPath + fileName);
		}
	}

	private void applyUserFields(User user, SignupRequest request) {
		user.setEmail(request.getEmail());
		user.setEmpId(request.getEmpId());
		user.setUsername(request.getUserName());
		user.setRoles(request.getRoles());
		user.setBudgetLimit(request.getBudgetLimit());
		user.setMttp(request.getMttp());
		user.setType(request.getType());
		user.setIsDelete(false);
		user.setUpdated_At(Calendar.getInstance().getTime());
		if (request.getPassword() != null && !request.getPassword().isEmpty()) {
			user.setPassword(request.getPassword(), encoder);
		}
	}

	@Override
	public ResponseEntity<ApiResponse> signIn(LoginRequest user) throws UsernameNotFoundException {
		try {

			Authentication authentication = authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));
			// // Further processing after successful authentication
			SecurityContextHolder.getContext().setAuthentication(authentication);

			UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

			Map<String, Object> userDataMap = Map.of("email", userDetails.getEmail(), "name", userDetails.getUsername(),
					"id", userDetails.getId(), "picture", userDetails.getProfilePicture(), "role",
					userDetails.getRoles());

			String jwt = jwtUtils.generateJwtToken(authentication, userDataMap);
			// String jwt = jwtUtils.generateJwtToken( user,userDataMap);
			// Get token expiration time

			Map<String, Object> userToken = Map.of("token", jwt);

			return ResponseEntity.ok().body(new ApiResponse(true, "User login successful", userToken));
		} catch (AuthenticationException e) {

			logger.error("Authentication failed: {}", e.getMessage());
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(new ApiResponse(false, "Invalid credentials", e.getMessage()));
		} catch (Exception e) {

			logger.error("Error during login", e);
			return ResponseEntity.badRequest().body(new ApiResponse(false, "Error during login", e.getMessage()));
		}
	}

	public static String getUserId() {
		String userid;
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		if (authentication != null && authentication.isAuthenticated()) {
			userid = userDetails.getId();
			System.out.println("userid" + userid);
		} else {
			userid = null;
		}
		return userid;

	}

	@Override
	public ResponseEntity<ApiResponse> getAllUsers() {
		List<User> users = userRepository.findAll();
		List<UserDto> userDtos = users.stream().map(UserDto::fromUser).collect(Collectors.toList());

		return ResponseEntity.ok().body(new ApiResponse(true, "fetch successfully", userDtos));

	}

	@Override
	public ResponseEntity<ApiResponse> getPOR() {
		List<User> users = userRepository.findAll();
		List<UserDto> userDtos = users.stream()
				.filter(x -> Objects.nonNull(x.getRoles()) && x.getRoles().contains("Po_release"))
				.map(UserDto::fromUser)
				.collect(Collectors.toList());

		return ResponseEntity.ok().body(new ApiResponse(true, "Fetched successfully", userDtos));
	}

	@Override
	public User getUserById(String id) {
		Optional<User> user = userRepository.findById(id);
		if (user.isEmpty()) {
			return null;
		}
		return user.get();
	}

	@Override
	public ResponseEntity<?> switchRole(SwitchRole switchRole) {
		String token = switchRole.getToken();
		String newRole = switchRole.getRole();

		try {
			Map<String, Object> userDetails = jwtUtils.decodeToken(token);
			userDetails.put("activeRole", newRole);
			String email = (String) userDetails.get("email");
			String newToken = jwtUtils.generateTokenFromUsernamefromMap(email, userDetails);
			Map<String, Object> responseMap = new HashMap<>();
			responseMap.put("accessToken", newToken);
			responseMap.put("userDetails", userDetails);

			return ResponseEntity.ok(new ApiResponse(true, "Role switched successfully", responseMap));

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(new ApiResponse(false, e.getMessage(), null));
		}
	}

	@Override
	public void sendForgotPasswordLink(String email) {

		User user = userRepository.findByEmail(email).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found with email: " + email));
		String token = jwtUtils.generateJWTTokenForResetPassword(email);
		String content = mailTemplateService.sendForgotPasswordLink(user.getUsername(), email, token);
		mailServiceAsync.sendMail(content, email, "Reset Password", null);
		userRepository.updateResetValue(email, mongoTemplate);
	}

	@Override
	public void resetPassword(@Valid UserPasswordForgot userRequest) {

		Map<String, Object> decodedData = jwtUtils.decodeJWTTokenForResetPassword(userRequest.getToken());
		String email = (String) decodedData.get("email");
		User user = userRepository.findByEmail(email).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found with email: " + email));
		if (user.getExpiryDate().isAfter(LocalDateTime.now())) {
			UpdateResult result = userRepository.updatePasswordByEmailForgotPassword(email,
					encoder.encode(userRequest.getPassword()), mongoTemplate);
			if (result.getMatchedCount() == 0) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link invalid");
			}
		} else {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link expired");
		}
	}

	@Override
	public ResponseEntity<?> changePassword(String mail, String password) {

		User user = userRepository.findByEmail(mail).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User Not Found with email: " + mail));
		if (user.getPassword() != null && !user.getPassword().isEmpty()) {
			user.setPassword(password, encoder);
			userRepository.save(user);
			return ResponseEntity.ok("Password changed successfully");
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not found or password is empty");
		}
	}

	@Override
	public ResponseEntity<?> getBAUsers(Authentication authentication) {

		return ResponseEntity.ok(userRepository.findBAUsers(TicketStage.Business_Approver.toString()));
	}

	@Override
	public ResponseEntity<?> getMttpBAUsers() {

		return ResponseEntity.ok(userRepository.findMttpBAUsers(TicketStage.Business_Approver.toString(), true));
	}

	@Override
	public ResponseEntity<?> getNextStageUsers(String stage, String ticketType, String status, String ticketId) {

		String userId = null;
		if (ticketId != null) {
			Request_table request_table = requestRepository.findById(ticketId)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
			userId = request_table.getCreatedBy();
		}

		List<User> users = new ArrayList<>();
		if (ticketType.equalsIgnoreCase("Brand")) {
			if (stage.equalsIgnoreCase(TicketStage.PO_Screening.toString())) {
				users = userRepository.findNextStageUsers(TicketStage.Budget_Team, TicketStage.Po_maker, mongoTemplate);
			} else if (stage.equalsIgnoreCase(TicketStage.Po_maker.toString()) && status != null
					&& status.equalsIgnoreCase(Estatus.Reject.toString())) {
				users = userRepository.findNextStageUsers(TicketStage.Budget_Team, TicketStage.Po_maker, mongoTemplate);
			} else if (stage.equalsIgnoreCase(TicketStage.Po_maker.toString())) {
				users = userRepository.findNextStageUsers(TicketStage.Po_checker, TicketStage.Po_release,
						mongoTemplate);
			}
		} else if (ticketType.equalsIgnoreCase("NonBrand") && status.equalsIgnoreCase(Estatus.Reject.toString())) {
			// Get Budget_Team users
			users = userRepository.findAllByRoles(TicketStage.Budget_Team, mongoTemplate);
			if (userId != null) {
				Optional<User> specificUser = userRepository.findById(userId);
				if (specificUser.isPresent() && !users.contains(specificUser.get())) {
					users.add(specificUser.get());
				}
			}
		}
		return ResponseEntity.ok(users);
	}

}
