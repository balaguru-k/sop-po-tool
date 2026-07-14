package sop_po.service;

import java.util.List;

import org.springframework.http.ResponseEntity;

import sop_po.entity.DeliveryPlant;

public interface DeliveryPlantService {
    
    ResponseEntity<?> createDeliveryPlant(DeliveryPlant deliveryPlant);

    ResponseEntity<?> updateDeliveryPlant(String id, DeliveryPlant deliveryPlant);

    ResponseEntity<List<DeliveryPlant>> getAllDeliveryPlants();

    ResponseEntity<?> getDeliveryPlantById(String id);

    ResponseEntity<?> deleteDeliveryPlant(String id);
}