package sop_po.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import sop_po.service.EBriefService;

@CrossOrigin
@RestController
@RequestMapping("/api/ebrief")
public class EBriefController {

    @Autowired
    private EBriefService eBriefService;

    @GetMapping("/fetch")
    public ResponseEntity<?> fetchEBriefs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eBriefService.fetchAndSaveEBriefs(page, limit);
    }

    @GetMapping("/fetch-all")
    public ResponseEntity<?> fetchAllEBriefs() {
        return eBriefService.fetchAndSaveAllEBriefs();
    }

    @GetMapping()
    public ResponseEntity<?> fetchAllEBrief() {
        return eBriefService.fetchAllEBrief();
    }

    @GetMapping("/get-by-glcode")
    public ResponseEntity<?> fetchEBriefByGlcode(@RequestParam String glCode) {
        return eBriefService.fetchEBriefByGlcode(glCode);
    }

    // @GetMapping("/get-by-glcode")
    // public ResponseEntity<?> fetchEBriefByGlcode(@RequestParam String glCode,
    //         @RequestParam(required = false) String ticketId) {
    //     return eBriefService.fetchEBriefByGlcode(glCode, ticketId);
    // }
}