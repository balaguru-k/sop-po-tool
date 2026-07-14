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
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import sop_po.entity.DeliveryPlant;
import sop_po.service.DeliveryPlantService;

@RestController
@RequestMapping("/api/delivery-plant")
@SecurityRequirement(name = "Bearer Authentication")
public class DeliveryPlantController {

    @Autowired
    private DeliveryPlantService deliveryPlantService;

    @PostMapping
    public ResponseEntity<?> createDeliveryPlant(@RequestBody DeliveryPlant deliveryPlant) {
        return deliveryPlantService.createDeliveryPlant(deliveryPlant);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDeliveryPlant(@PathVariable String id, @RequestBody DeliveryPlant deliveryPlant) {
        return deliveryPlantService.updateDeliveryPlant(id, deliveryPlant);
    }

    @GetMapping
    public ResponseEntity<List<DeliveryPlant>> getAllDeliveryPlants() {
        return deliveryPlantService.getAllDeliveryPlants();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeliveryPlantById(@PathVariable String id) {
        return deliveryPlantService.getDeliveryPlantById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDeliveryPlant(@PathVariable String id) {
        return deliveryPlantService.deleteDeliveryPlant(id);
    }
}