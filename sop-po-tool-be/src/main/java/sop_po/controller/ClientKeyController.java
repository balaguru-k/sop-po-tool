package sop_po.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sop_po.model.ClientKey;
import sop_po.service.ClientKeyService;

@RestController
@RequestMapping("/api/client-keys")
public class ClientKeyController {
    
    @Autowired
    private ClientKeyService clientKeyService;
    
    @PostMapping
    public ResponseEntity<ClientKey> createClientKey(@RequestBody ClientKey clientKey) {
        ClientKey savedKey = clientKeyService.saveClientKey(clientKey);
        return ResponseEntity.ok(savedKey);
    }
    
    @GetMapping
    public ResponseEntity<List<ClientKey>> getAllClientKeys() {
        List<ClientKey> clientKeys = clientKeyService.getAllClientKeys();
        return ResponseEntity.ok(clientKeys);
    }
}