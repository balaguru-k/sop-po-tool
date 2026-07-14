package sop_po.service;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public interface EBriefService {
    
    ResponseEntity<?> fetchAndSaveEBriefs(int page, int limit);

    ResponseEntity<?> fetchAndSaveAllEBriefs();

    ResponseEntity<?> fetchAllEBrief();

    ResponseEntity<?> fetchEBriefByGlcode(String glCode);

    ResponseEntity<?> fetchEBriefByGlcode(String glCode, String ticketId);
}