package sop_po.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.model.ManualMail;
import sop_po.service.ManualMailService;

@RestController
@RequestMapping("/api/manual-mail")
@SecurityRequirement(name = "Bearer Authentication")
public class ManualMailController {

    @Autowired
    private ManualMailService manualMailService;

    @PostMapping
    public ResponseEntity<?> createManualMail(@RequestBody ManualMail manualMail) {
        return manualMailService.createManualMail(manualMail);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateManualMail(@PathVariable String id, @RequestBody ManualMail manualMail) {
        return manualMailService.updateManualMail(id, manualMail);
    }

    @GetMapping
    public ResponseEntity<List<ManualMail>> getAllManualMails() {
        return manualMailService.getAllManualMails();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getManualMailById(@PathVariable String id) {
        return manualMailService.getManualMailById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteManualMail(@PathVariable String id) {
        return manualMailService.deleteManualMail(id);
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<?> sendManualMail(@PathVariable String id, 
                                          @RequestParam(value = "attachments", required = false) MultipartFile[] attachments) {
        return manualMailService.sendManualMail(id, attachments);
    }
}