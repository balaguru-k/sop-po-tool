package sop_po.serviceImpl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import sop_po.entity.DeliveryPlant;
import sop_po.repository.DeliveryPlantRepository;
import sop_po.service.DeliveryPlantService;

@Service
public class DeliveryPlantServiceImpl implements DeliveryPlantService {

    @Autowired
    private DeliveryPlantRepository deliveryPlantRepository;

    @Override
    public ResponseEntity<?> createDeliveryPlant(DeliveryPlant deliveryPlant) {
        try {
            if (deliveryPlant.getName() == null || deliveryPlant.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Name is required");
            }
            DeliveryPlant savedPlant = deliveryPlantRepository.save(deliveryPlant);
            return ResponseEntity.ok(savedPlant);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating delivery plant: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> updateDeliveryPlant(String id, DeliveryPlant deliveryPlant) {
        try {
            Optional<DeliveryPlant> existingPlant = deliveryPlantRepository.findById(id);
            if (existingPlant.isPresent()) {
                if (deliveryPlant.getName() == null || deliveryPlant.getName().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Name is required");
                }
                DeliveryPlant plant = existingPlant.get();
                plant.setName(deliveryPlant.getName());
                DeliveryPlant updatedPlant = deliveryPlantRepository.save(plant);
                return ResponseEntity.ok(updatedPlant);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating delivery plant: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<List<DeliveryPlant>> getAllDeliveryPlants() {
        try {
            List<DeliveryPlant> plants = deliveryPlantRepository.findAll();
            return ResponseEntity.ok(plants);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<?> getDeliveryPlantById(String id) {
        try {
            Optional<DeliveryPlant> plant = deliveryPlantRepository.findById(id);
            if (plant.isPresent()) {
                return ResponseEntity.ok(plant.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching delivery plant: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> deleteDeliveryPlant(String id) {
        try {
            if (deliveryPlantRepository.existsById(id)) {
                deliveryPlantRepository.deleteById(id);
                return ResponseEntity.ok("Delivery plant deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting delivery plant: " + e.getMessage());
        }
    }
}