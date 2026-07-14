package sop_po.serviceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PoApproverFileServiceImpl implements FilePathService{

    private final Path poApproverFileLocation;
    
    public PoApproverFileServiceImpl(StorageProperties properties) {
        this.poApproverFileLocation = Paths.get(properties.getLocation()).resolve(properties.getPoApproverFile());
    }

    @Override
    public Path getDestinationPath() {
        return this.poApproverFileLocation;
    }

}
