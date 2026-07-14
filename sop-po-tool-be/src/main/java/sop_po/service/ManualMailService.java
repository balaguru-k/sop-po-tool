package sop_po.service;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import sop_po.model.ManualMail;

public interface ManualMailService {
    ResponseEntity<?> createManualMail(ManualMail manualMail);
    ResponseEntity<?> updateManualMail(String id, ManualMail manualMail);
    ResponseEntity<List<ManualMail>> getAllManualMails();
    ResponseEntity<?> getManualMailById(String id);
    ResponseEntity<?> deleteManualMail(String id);
    ResponseEntity<?> sendManualMail(String id, MultipartFile[] attachments);
}