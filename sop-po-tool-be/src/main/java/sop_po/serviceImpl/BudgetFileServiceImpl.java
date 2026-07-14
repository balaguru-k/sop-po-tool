package sop_po.serviceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class BudgetFileServiceImpl implements FilePathService {

     private final Path budgetFileLocation;
    
    public BudgetFileServiceImpl(StorageProperties properties) {
        this.budgetFileLocation = Paths.get(properties.getLocation()).resolve(properties.getBudgetFile());
    }

    @Override
    public Path getDestinationPath() {
        return this.budgetFileLocation;
    }

}
