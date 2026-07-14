package sop_po.controller.user;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import sop_po.model.user.SwitchRole;
//import sop_po.jwt.JwtUtils;
import sop_po.request.LoginRequest;
import sop_po.request.SignupRequest;
//import sop_po.security.service.UserDetailsImpl;
import sop_po.service.UserService;

@CrossOrigin
@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerUser(
            @RequestParam(value = "upload", required = false) MultipartFile upload,
            @ModelAttribute SignupRequest user) throws IOException {

        return userService.signUp(user, upload);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest)
            throws AuthenticationException {
        return userService.signIn(loginRequest);

    }

    @GetMapping("/allUsers")
    public ResponseEntity<?> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/allPoUsers")
    public ResponseEntity<?> getPOR() {
        return userService.getPOR();
    }

    @PostMapping("/switch-role")
    public ResponseEntity<?> userswitchRole(@RequestBody SwitchRole switchRole) {
        return userService.switchRole(switchRole);
    }

    @GetMapping("/reset-link/{email}")
    public ResponseEntity<?> sendResetLink(@PathVariable String email) throws MessagingException, Exception {

        userService.sendForgotPasswordLink(email);
        return ResponseEntity.ok("Reset link sent to your email address.");
    }

    @PutMapping("/forgot-password")
    public ResponseEntity<?> saveResetPassword(@Valid @RequestBody UserPasswordForgot user) throws Exception {

        userService.resetPassword(user);
        return ResponseEntity.ok("Password changed successfully.");
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestParam String mail, @RequestParam String password)
            throws IOException {
        return userService.changePassword(mail, password);
    }

    @GetMapping("/all-ba-users")
    public ResponseEntity<?> getBAUsers(Authentication authentication) {
        return userService.getBAUsers(authentication);
    }

    @GetMapping("/all-mttp-ba")
    public ResponseEntity<?> getMttpBAUsers() {
        return userService.getMttpBAUsers();
    }

    @GetMapping("/nextstage-users")
    public ResponseEntity<?> getNextStageUsers(@RequestParam String stage,
            @RequestParam String ticketType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String ticketId) {
        return userService.getNextStageUsers(stage, ticketType, status, ticketId);
    }

}
