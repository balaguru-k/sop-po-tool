package sop_po.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sop_po.model.ClientKey;
import sop_po.repository.ClientKeyRepository;

@Service
public class ClientKeyService {

    @Autowired
    private ClientKeyRepository clientKeyRepository;

    public boolean validateClientKeyForEndpoint(String keyValue, String endpoint) {
        Optional<ClientKey> clientKey = clientKeyRepository.findByKeyValueAndIsActive(keyValue, true);
        if (clientKey.isPresent()) {
            List<String> allowedEndpoints = clientKey.get().getAllowedEndpoints();
            return allowedEndpoints.contains(endpoint) || allowedEndpoints.contains("*");
        }
        return false;
    }

    public ClientKey saveClientKey(ClientKey clientKey) {
        return clientKeyRepository.save(clientKey);
    }

    public List<ClientKey> getAllClientKeys() {
        return clientKeyRepository.findAll();
    }
}