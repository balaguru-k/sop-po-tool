package sop_po.controller.ticket;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.service.DashboardService;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/dashboard")
@SecurityRequirement(name = "Bearer Authentication")
public class DashBoardController {

    private final DashboardService dashboardService;

    public DashBoardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/tat")
    public ResponseEntity<?> ticketsTat(@RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "false") boolean myself, 
            @RequestParam String type, Authentication authentication) {
        return dashboardService.ticketsTat(startDate, endDate, myself, type, authentication);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats(@RequestParam(required = false, defaultValue = "false") boolean myself,
            Authentication authentication,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String division,
            @RequestParam(required = false) String vendorCode,
            @RequestParam(required = false) String ticketType) {
        return dashboardService.getDashboardStats(myself, authentication, startDate, endDate, division, vendorCode,
                ticketType);
    }

}
