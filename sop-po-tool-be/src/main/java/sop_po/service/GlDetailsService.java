package sop_po.service;

import org.springframework.http.ResponseEntity;

import sop_po.request.GlDto;

public interface GlDetailsService {

    ResponseEntity<?> getAllGlDetails(String type);

    ResponseEntity<?> addGlDetails(GlDto glDto);

    ResponseEntity<?> updateGlDetails(String id, GlDto glDto);

}
