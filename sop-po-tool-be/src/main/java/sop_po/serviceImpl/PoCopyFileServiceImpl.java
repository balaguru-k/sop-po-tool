package sop_po.serviceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PoCopyFileServiceImpl implements FilePathService {
    
    private final Path poCopyLocation;
    
    public PoCopyFileServiceImpl(StorageProperties properties) {
        this.poCopyLocation = Paths.get(properties.getLocation()).resolve(properties.getPoCopy());
    }

    @Override
    public Path getDestinationPath() {
        return this.poCopyLocation;
    }
}
