package sop_po.serviceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import sop_po.entity.Vendor;
import sop_po.jwt.JwtUtils;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.History;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.TicketStage;
import sop_po.repository.RequestRepository;
import sop_po.repository.VendorRepository;
import sop_po.service.DashboardService;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final RequestRepository requestRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private Map<String, String> locationCountryCache = new HashMap<>();

    public DashboardServiceImpl(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    @Override
    public ResponseEntity<?> ticketsTat(LocalDate startDate, LocalDate endDate, boolean myself,
            String type, Authentication authentication) {

        String activeRole = jwtUtils.getActiveRole();
        String userId = jwtUtils.getUserId();
        String username = jwtUtils.getUserName();

        List<Request_table> tickets;

        boolean isAdmin = "admin".equalsIgnoreCase(activeRole) || "Misha H".equalsIgnoreCase(username)
                || "H Ganesh".equalsIgnoreCase(username);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;

        if ("Sakthivel S".equalsIgnoreCase(username)) {
            if (myself) {
                if (TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)) {
                    tickets = requestRepository.findByBusinessApproverAndTypeWithDateFilter(userId, startDateTime,
                            endDateTime, type, mongoTemplate);
                } else if (TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
                    tickets = requestRepository.findByPoApproverIdAndTypeWithDateFilter(userId, startDateTime,
                            endDateTime, type, mongoTemplate);
                } else {
                    tickets = requestRepository.findByTypeWithDateFilter(startDateTime, endDateTime, type,
                            mongoTemplate);
                }
                return getStageTat(tickets, activeRole);
            } else {
                tickets = requestRepository.findByTypeWithDateFilter(startDateTime, endDateTime, type, mongoTemplate);
                return getAdminTat(tickets);
            }
        } else if (isAdmin) {
            tickets = requestRepository.findByTypeWithDateFilter(startDateTime, endDateTime, type, mongoTemplate);
            return getAdminTat(tickets);
        } else if (TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)) {
            tickets = requestRepository.findByBusinessApproverAndTypeWithDateFilter(userId, startDateTime, endDateTime,
                    type, mongoTemplate);
        } else if (TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
            tickets = requestRepository.findByPoApproverIdAndTypeWithDateFilter(userId, startDateTime, endDateTime,
                    type, mongoTemplate);
        } else {
            tickets = requestRepository.findByTypeWithDateFilter(startDateTime, endDateTime, type, mongoTemplate);
        }
        return getStageTat(tickets, activeRole);
    }

    private ResponseEntity<?> getAdminTat(List<Request_table> tickets) {
        Map<String, Object> allStagesData = new HashMap<>();

        TicketStage[] stages = { TicketStage.Business_Approver, TicketStage.PO_Screening,
                TicketStage.Budget_Team, TicketStage.Po_maker,
                TicketStage.Po_release, TicketStage.Po_checker };

        for (TicketStage stage : stages) {
            allStagesData.put(stage.name(), getStageTatData(tickets, stage.name()));
        }

        return ResponseEntity.ok(allStagesData);
    }

    private ResponseEntity<?> getStageTat(List<Request_table> tickets, String stageName) {
        String activeRole = jwtUtils.getActiveRole();
        String username = jwtUtils.getUserName();
        boolean isAdmin = "admin".equalsIgnoreCase(activeRole) || "Misha H".equalsIgnoreCase(username)
                || "H Ganesh".equalsIgnoreCase(username);

        if (!isAdmin && !TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)
                && !TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
            tickets = filterTicketsByActiveRoleInHistory(tickets, stageName);
        }

        Map<String, Object> response = new HashMap<>();
        response.put(stageName, getStageTatData(tickets, stageName));
        return ResponseEntity.ok(response);
    }

    private List<Request_table> filterTicketsByActiveRoleInHistory(List<Request_table> tickets, String activeRole) {
        TicketStage targetStage;
        try {
            targetStage = TicketStage.valueOf(activeRole);
        } catch (IllegalArgumentException e) {
            return tickets;
        }

        return tickets.stream()
                .filter(ticket -> {
                    List<History> historyList = ticket.getHistoryList();

                    if (historyList != null && !historyList.isEmpty()) {
                        boolean foundInHistory = historyList.stream()
                                .anyMatch(history -> history.getName() == targetStage);
                        if (foundInHistory) {
                            return true;
                        }
                    }

                    return ticket.getStage().equals(targetStage);
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> getStageTatData(List<Request_table> tickets, String stageName) {
        Map<String, Object> stageData = new HashMap<>();

        Map<String, Integer> completed = new HashMap<>();
        Map<String, Integer> pending = new HashMap<>();
        Map<String, Integer> hold = new HashMap<>();
        Map<String, Integer> rejected = new HashMap<>();

        // Initialize aging buckets
        String[] buckets = { "0D", "1D", "2-3D", "4D+" };
        for (String bucket : buckets) {
            completed.put(bucket, 0);
            pending.put(bucket, 0);
            hold.put(bucket, 0);
            rejected.put(bucket, 0);
        }

        long totalCompletedDays = 0;
        int completedCount = 0;
        long totalPendingDays = 0;
        int pendingCount = 0;
        long totalHoldDays = 0;
        int holdCount = 0;
        long totalRejectedDays = 0;
        int rejectedCount = 0;

        for (Request_table ticket : tickets) {
            TicketAnalysis analysis = analyzeTicket(ticket, stageName);
            if (!"None".equals(analysis.category)) {
                String bucket = getAgingBucket(analysis.aging);

                switch (analysis.category) {
                    case "Completed":
                        completed.put(bucket, completed.get(bucket) + 1);
                        totalCompletedDays += analysis.aging;
                        completedCount++;
                        break;
                    case "Pending":
                        pending.put(bucket, pending.get(bucket) + 1);
                        totalPendingDays += analysis.aging;
                        pendingCount++;
                        break;
                    case "Hold":
                        hold.put(bucket, hold.get(bucket) + 1);
                        totalHoldDays += analysis.aging;
                        holdCount++;
                        break;
                    case "Rejected":
                        rejected.put(bucket, rejected.get(bucket) + 1);
                        totalRejectedDays += analysis.aging;
                        rejectedCount++;
                        break;
                }
            }
        }

        stageData.put("Completed", completed);
        stageData.put("Pending", pending);
        stageData.put("Hold", hold);
        stageData.put("Rejected", rejected);

        // Add average days
        Map<String, Double> averageDays = new HashMap<>();
        averageDays.put("Completed", completedCount > 0 ? (double) totalCompletedDays / completedCount : 0.0);
        averageDays.put("Pending", pendingCount > 0 ? (double) totalPendingDays / pendingCount : 0.0);
        averageDays.put("Hold", holdCount > 0 ? (double) totalHoldDays / holdCount : 0.0);
        averageDays.put("Rejected", rejectedCount > 0 ? (double) totalRejectedDays / rejectedCount : 0.0);
        stageData.put("AverageDays", averageDays);

        return stageData;
    }

    private String getAgingBucket(long aging) {
        if (aging == 0)
            return "0D";
        if (aging == 1)
            return "1D";
        if (aging >= 2 && aging <= 3)
            return "2-3D";
        return "4D+";
    }

    private static class TicketAnalysis {
        String category;
        long aging;

        TicketAnalysis(String category, long aging) {
            this.category = category;
            this.aging = aging;
        }
    }

    private TicketAnalysis analyzeTicket(Request_table ticket, String stageName) {
        List<History> historyList = ticket.getHistoryList();
        if (historyList == null || historyList.isEmpty()) {
            return new TicketAnalysis("None", 0);
        }

        TicketStage targetStage;
        try {
            targetStage = TicketStage.valueOf(stageName);
        } catch (IllegalArgumentException e) {
            return new TicketAnalysis("None", 0);
        }

        if (ticket.getStage() == targetStage && ticket.getStatus() != Estatus.Hold) {
            History arrivalFromDifferentStage = null;
            for (int i = historyList.size() - 1; i >= 0; i--) {
                History history = historyList.get(i);
                if (history.getName() != targetStage) {
                    arrivalFromDifferentStage = history;
                    break;
                }
            }

            if (arrivalFromDifferentStage != null) {
                long aging = ChronoUnit.HOURS.between(arrivalFromDifferentStage.getDate(), LocalDateTime.now()) / 24;
                return new TicketAnalysis("Pending", aging);
            }
        }

        // Find most recent action by target stage
        History mostRecentAction = null;
        for (int i = historyList.size() - 1; i >= 0; i--) {
            History history = historyList.get(i);
            if (history.getName() == targetStage) {
                mostRecentAction = history;
                break;
            }
        }

        if (mostRecentAction != null) {
            // Find arrival from different stage by looking backwards from this action
            History arrivalFromDifferentStage = null;
            int actionIndex = historyList.indexOf(mostRecentAction);

            for (int i = actionIndex - 1; i >= 0; i--) {
                History history = historyList.get(i);
                if (history.getName() != targetStage) {
                    arrivalFromDifferentStage = history;
                    break;
                }
            }

            if (arrivalFromDifferentStage != null) {
                long aging = ChronoUnit.HOURS.between(arrivalFromDifferentStage.getDate(), mostRecentAction.getDate())
                        / 24;

                if (mostRecentAction.getStatus() == Estatus.Reject) {
                    return new TicketAnalysis("Rejected", aging);
                } else if (mostRecentAction.getStatus() == Estatus.Approved) {
                    return new TicketAnalysis("Completed", aging);
                } else if (mostRecentAction.getStatus() == Estatus.Completed) {
                    return new TicketAnalysis("Completed", aging);
                }
            }
        }

        // Check for hold aging calculation
        if (ticket.getStatus() == Estatus.Hold) {
            // Find the most recent Hold history for target stage
            for (int i = historyList.size() - 1; i >= 0; i--) {
                History history = historyList.get(i);
                if (history.getName() == targetStage && history.getStatus() == Estatus.Hold) {
                    long aging = ChronoUnit.HOURS.between(history.getDate(), LocalDateTime.now()) / 24;
                    return new TicketAnalysis("Hold", aging);
                }
            }
        }

        // Check if last action was retrieve (ticket moved back to pending after hold)
        History lastHistory = historyList.get(historyList.size() - 1);
        if (lastHistory.getName() == targetStage && lastHistory.getStatus() == Estatus.Retrieve) {
            // Find the previous Hold history for same stage to calculate hold duration
            for (int i = historyList.size() - 2; i >= 0; i--) {
                History history = historyList.get(i);
                if (history.getName() == targetStage && history.getStatus() == Estatus.Hold) {
                    long aging = ChronoUnit.HOURS.between(history.getDate(), lastHistory.getDate()) / 24;
                    return new TicketAnalysis("Hold", aging);
                }
            }
        }

        return new TicketAnalysis("None", 0);
    }

    @Override
    public ResponseEntity<?> getDashboardStats(boolean myself, Authentication authentication, String startDate,
            String endDate,
            String division, String vendorName, String ticketType) {

        String activeRole = jwtUtils.getActiveRole();
        String userId = jwtUtils.getUserId();
        String username = jwtUtils.getUserName();

        List<Request_table> tickets;

        boolean isAdmin = "admin".equals(activeRole) || "Misha H".equals(username) || "H Ganesh".equals(username);

        // Special logic for Sakthivel S
        if ("Sakthivel S".equals(username)) {
            if (myself) {
                // Get data by activeRole
                if ("Business_Approver".equals(activeRole)) {
                    tickets = requestRepository.findByBusinessApproverAndStatusNotDraft(userId, ticketType,
                            mongoTemplate);
                } else if ("Po_release".equals(activeRole)) {
                    tickets = requestRepository.findByPoApproverIdAndStatusNotDraft(userId, ticketType, mongoTemplate);
                } else if ("Requestor".equals(activeRole)) {
                    tickets = requestRepository.findByCreatedByAndStatusNotDraft(userId, ticketType, mongoTemplate);
                } else {
                    tickets = requestRepository.findByTicketTypeAndStatusNotDraft(ticketType, mongoTemplate);
                }
            } else {
                tickets = requestRepository.findByTicketTypeAndStatusNotDraft(ticketType, mongoTemplate);
            }
        } else if (isAdmin) {
            tickets = requestRepository.findByTicketTypeAndStatusNotDraft(ticketType, mongoTemplate);
        } else if (TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)) {
            tickets = requestRepository.findByBusinessApproverAndStatusNotDraft(userId, ticketType, mongoTemplate);
        } else if (TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
            tickets = requestRepository.findByPoApproverIdAndStatusNotDraft(userId, ticketType, mongoTemplate);
        } else if (TicketStage.Requestor.toString().equalsIgnoreCase(activeRole)) {
            tickets = requestRepository.findByCreatedByAndStatusNotDraft(userId, ticketType, mongoTemplate);
        } else {
            tickets = requestRepository.findByTicketTypeAndStatusNotDraft(ticketType, mongoTemplate);
        }

        tickets = applyFilters(tickets, startDate, endDate, division, vendorName, null);

        Map<String, Object> dashboardData = new HashMap<>();

        String roleForStats;
        if ("Sakthivel S".equalsIgnoreCase(username)) {
            roleForStats = myself ? activeRole : "Admin";
        } else {
            roleForStats = isAdmin ? "Admin" : activeRole;
        }

        Map<String, Integer> statusCounts = getStatusCounts(tickets, roleForStats);
        dashboardData.put("statusCounts", statusCounts);

        Map<String, Object> monthWiseCounts = getMonthWiseCounts(tickets, roleForStats);
        dashboardData.put("monthWiseCounts", monthWiseCounts);

        List<Map<String, Object>> topTickets = getTopTicketsByAmount(tickets);
        dashboardData.put("topTickets", topTickets);

        Map<String, Integer> countryCounts = getCountryWiseCounts(tickets);
        dashboardData.put("countryCounts", countryCounts);

        Map<String, Integer> completedTat = getCompletedTat(tickets, roleForStats);
        dashboardData.put("completedTat", completedTat);

        return ResponseEntity.ok(dashboardData);
    }

    private Map<String, Integer> getStatusCounts(List<Request_table> tickets, String activeRole) {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("Completed", 0);
        counts.put("Pending", 0);
        counts.put("Hold", 0);
        counts.put("Rejected", 0);

        TicketStage finalRoleStage = null;
        if (!"Requestor".equals(activeRole) && !"Admin".equals(activeRole)) {
            try {
                finalRoleStage = TicketStage.valueOf(activeRole);
            } catch (IllegalArgumentException e) {
                // Role is not a valid TicketStage
            }
        }

        for (Request_table ticket : tickets) {
            if (finalRoleStage != null) {
                // Check if currently at this stage
                if (ticket.getStage() == finalRoleStage) {
                    if (ticket.getStatus() == Estatus.Hold) {
                        counts.put("Hold", counts.get("Hold") + 1);
                    } else {
                        counts.put("Pending", counts.get("Pending") + 1);
                    }
                    continue;
                }

                // Look for most recent history entry for this role
                History mostRecentRoleHistory = null;
                if (ticket.getHistoryList() != null) {
                    for (int i = ticket.getHistoryList().size() - 1; i >= 0; i--) {
                        History history = ticket.getHistoryList().get(i);
                        if (history.getName() == finalRoleStage) {
                            mostRecentRoleHistory = history;
                            break;
                        }
                    }
                }

                if (mostRecentRoleHistory == null) {
                    continue;
                }

                if (mostRecentRoleHistory.getStatus() == Estatus.Reject) {
                    counts.put("Rejected", counts.get("Rejected") + 1);
                } else if (mostRecentRoleHistory.getStatus() == Estatus.Approved) {
                    counts.put("Completed", counts.get("Completed") + 1);
                } else if (mostRecentRoleHistory.getStatus() == Estatus.Hold) {
                    counts.put("Hold", counts.get("Hold") + 1);
                }
            } else {
                if ("Requestor".equals(activeRole)) {
                    if (ticket.getStatus() == Estatus.Completed) {
                        counts.put("Completed", counts.get("Completed") + 1);
                    } else {
                        counts.put("Pending", counts.get("Pending") + 1);
                    }
                } else {
                    if (ticket.getStatus() == Estatus.Completed) {
                        counts.put("Completed", counts.get("Completed") + 1);
                    } else if (ticket.getStatus().equals(Estatus.Approved) || ticket.getStatus().equals(Estatus.Submit)
                            || ticket.getStatus().equals(Estatus.Ticket_Created)) {
                        counts.put("Pending", counts.get("Pending") + 1);
                    } else if (ticket.getStatus() == Estatus.Hold) {
                        counts.put("Hold", counts.get("Hold") + 1);
                    } else if (ticket.getStatus() == Estatus.Reject) {
                        counts.put("Rejected", counts.get("Rejected") + 1);
                    }
                }
            }
        }

        return counts;
    }

    private Map<String, Object> getMonthWiseCounts(
            List<Request_table> tickets,
            String activeRole) {

        Map<String, Object> monthWiseData = new LinkedHashMap<>();

        String[] months = {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
        };

        // 1️⃣ Initialize all months with 0 values
        for (String month : months) {
            Map<String, Long> initMap = new LinkedHashMap<>();
            initMap.put("count", 0L);
            initMap.put("total", 0L);
            monthWiseData.put(month, initMap);
        }

        // 2️⃣ Update existing data
        for (Request_table ticket : tickets) {
            if (ticket.getCreatedAt() == null)
                continue;

            LocalDateTime createdAt = ticket.getCreatedAt()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime();

            String monthName = months[createdAt.getMonthValue() - 1];

            @SuppressWarnings("unchecked")
            Map<String, Long> monthData = (Map<String, Long>) monthWiseData.get(monthName);

            // Count
            monthData.put("count", monthData.get("count") + 1);

            // Total Base Value
            long baseValue = ticket.getTotalBaseValue();
            monthData.put("total", monthData.get("total") + baseValue);
        }

        return monthWiseData;
    }

    private List<Map<String, Object>> getTopTicketsByAmount(List<Request_table> tickets) {
        return tickets.stream()
                .filter(ticket -> ticket.getTotalBaseValue() > 0)
                .sorted(Comparator.comparing(Request_table::getTotalBaseValue).reversed())
                .limit(5)
                .map(ticket -> {
                    Map<String, Object> ticketInfo = new HashMap<>();
                    ticketInfo.put("reqNo", ticket.getReqNo());
                    ticketInfo.put("totalBaseValue", ticket.getTotalBaseValue());
                    return ticketInfo;
                })
                .collect(Collectors.toList());
    }

    private List<Request_table> applyFilters(List<Request_table> tickets, String startDate, String endDate,
            String division, String vendorCode, String ticketType) {
        return tickets.stream()
                .filter(ticket -> filterByDateRange(ticket, startDate, endDate))
                .filter(ticket -> filterByDivision(ticket, division))
                .filter(ticket -> filterByVendorCode(ticket, vendorCode))
                .collect(Collectors.toList());
    }

    private boolean filterByVendorCode(Request_table ticket, String vendorCode) {
        if (vendorCode == null || vendorCode.trim().isEmpty()) {
            return true;
        }
        return vendorCode.trim()
                .equalsIgnoreCase(
                        ticket.getVendorCode() != null ? ticket.getVendorCode().trim() : "");
    }

    private boolean filterByDateRange(Request_table ticket, String startDate, String endDate) {
        if (!StringUtils.hasText(startDate) && !StringUtils.hasText(endDate)) {
            return true;
        }

        if (ticket.getCreatedAt() == null) {
            return false;
        }

        LocalDate ticketDate = ticket.getCreatedAt().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();

        if (StringUtils.hasText(startDate)) {
            LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
            if (ticketDate.isBefore(start)) {
                return false;
            }
        }

        if (StringUtils.hasText(endDate)) {
            LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
            if (ticketDate.isAfter(end)) {
                return false;
            }
        }

        return true;
    }

    private boolean filterByDivision(Request_table ticket, String division) {
        if (!StringUtils.hasText(division)) {
            return true;
        }

        if (ticket.getBrand() == null || ticket.getBrand().isEmpty()) {
            return false;
        }

        return ticket.getBrand().stream()
                .anyMatch(brand -> division.equals(brand.getDivision()));
    }

    private Map<String, Integer> getCountryWiseCounts(List<Request_table> tickets) {
        Map<String, Integer> countryCounts = new HashMap<>();

        if (locationCountryCache.isEmpty()) {
            buildLocationCountryCache();
        }

        for (Request_table ticket : tickets) {
            String country = getCountryFromCache(ticket.getVendorLocation());
            countryCounts.put(country, countryCounts.getOrDefault(country, 0) + 1);
        }

        return countryCounts;
    }

    private void buildLocationCountryCache() {
        try {
            List<Vendor> vendors = vendorRepository.findAll();
            for (Vendor vendor : vendors) {
                if (StringUtils.hasText(vendor.getLocation()) && StringUtils.hasText(vendor.getCountry())) {
                    locationCountryCache.put(vendor.getLocation(), vendor.getCountry());
                }
            }
        } catch (Exception e) {
            // Log error if needed, but continue with empty cache
        }
    }

    private String getCountryFromCache(String vendorLocation) {
        if (!StringUtils.hasText(vendorLocation)) {
            return "Unknown";
        }

        return locationCountryCache.getOrDefault(vendorLocation, "Unknown");
    }

    private Map<String, Integer> getCompletedTat(List<Request_table> tickets, String activeRole) {
        Map<String, Integer> tatCounts = new HashMap<>();
        tatCounts.put("0D", 0);
        tatCounts.put("1D", 0);
        tatCounts.put("2-3D", 0);
        tatCounts.put("4D+", 0);

        if ("Requestor".equals(activeRole)) {
            for (Request_table ticket : tickets) {
                if (ticket.getCreatedAt() == null) {
                    continue;
                }

                LocalDateTime createdAt = ticket.getCreatedAt().toInstant().atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime();
                long aging;

                if (ticket.getStatus() == Estatus.Completed && ticket.getUpdatedAt() != null) {
                    LocalDateTime updatedAt = ticket.getUpdatedAt().toInstant().atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime();
                    aging = ChronoUnit.HOURS.between(createdAt, updatedAt) / 24;
                } else {
                    aging = ChronoUnit.HOURS.between(createdAt, LocalDateTime.now()) / 24;
                }

                String bucket = getAgingBucket(aging);
                tatCounts.put(bucket, tatCounts.get(bucket) + 1);
            }
            return tatCounts;
        }

        TicketStage roleStage = null;
        try {
            roleStage = TicketStage.valueOf(activeRole);
        } catch (IllegalArgumentException e) {
            return tatCounts;
        }

        for (Request_table ticket : tickets) {
            if (ticket.getHistoryList() == null || ticket.getHistoryList().isEmpty()) {
                continue;
            }

            // Find completed history for this role
            History completedHistory = null;
            History previousHistory = null;

            for (int i = 0; i < ticket.getHistoryList().size(); i++) {
                History history = ticket.getHistoryList().get(i);
                if (history.getName() == roleStage &&
                        (history.getStatus() == Estatus.Approved || history.getStatus() == Estatus.Completed)) {
                    completedHistory = history;
                    if (i > 0) {
                        previousHistory = ticket.getHistoryList().get(i - 1);
                    }
                    break;
                }
            }

            if (completedHistory != null && previousHistory != null &&
                    completedHistory.getDate() != null && previousHistory.getDate() != null) {
                long aging = ChronoUnit.HOURS.between(previousHistory.getDate(), completedHistory.getDate()) / 24;
                String bucket = getAgingBucket(aging);
                tatCounts.put(bucket, tatCounts.get(bucket) + 1);
            }
        }

        return tatCounts;
    }

}
