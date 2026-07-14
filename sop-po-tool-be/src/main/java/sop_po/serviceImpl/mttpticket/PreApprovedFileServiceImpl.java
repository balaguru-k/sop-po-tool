package sop_po.serviceImpl.mttpticket;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PreApprovedFileServiceImpl implements FilePathService {

    private final Path preApprovedFileLocation;

    public PreApprovedFileServiceImpl(StorageProperties properties) {
        this.preApprovedFileLocation =  Paths.get(properties.getLocation()).resolve(properties.getPoFiles());
    }

    @Override
    public Path getDestinationPath() {
        return this.preApprovedFileLocation;
    }

}
