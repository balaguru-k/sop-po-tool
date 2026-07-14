package sop_po.service;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import sop_po.controller.user.UserPasswordForgot;
import sop_po.model.user.SwitchRole;
import sop_po.model.user.User;
import sop_po.request.LoginRequest;
import sop_po.request.SignupRequest;
import sop_po.response.ApiResponse;

@Service
public interface UserService {
	public ResponseEntity<?> signUp (SignupRequest Request,MultipartFile file)throws IOException;
	
	public ResponseEntity<ApiResponse> signIn( LoginRequest user) ;
	
	public ResponseEntity<ApiResponse> getAllUsers() ;
	
	 public ResponseEntity<ApiResponse> getPOR() ;
	 
	 public User getUserById(String id) ;

	public ResponseEntity<?> switchRole(SwitchRole switchRole);

    void  sendForgotPasswordLink(String email);

    public void resetPassword(@Valid UserPasswordForgot user);

    public ResponseEntity<?> changePassword(String mail, String password);

    public ResponseEntity<?> getBAUsers(Authentication authentication);

    public ResponseEntity<?> getMttpBAUsers();

    public ResponseEntity<?> getNextStageUsers(String stage, String ticketType, String status, String ticketId);
}
