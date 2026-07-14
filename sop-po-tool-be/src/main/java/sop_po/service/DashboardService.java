package sop_po.service;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

public interface DashboardService {

    ResponseEntity<?> ticketsTat(LocalDate startDate, LocalDate endDate, boolean myself, String type, Authentication authentication);
        
    ResponseEntity<?> getDashboardStats(boolean myself, Authentication authentication, String startDate, String endDate, String division, String vendorName, String ticketType);

}
