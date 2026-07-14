package sop_po.serviceImpl.mttpticket;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PoFileServiceImpl implements FilePathService {

    private final Path poFileLocation;

    public PoFileServiceImpl(StorageProperties properties) {
        this.poFileLocation =  Paths.get(properties.getLocation()).resolve(properties.getPoFiles());
    }

    @Override
    public Path getDestinationPath() {
        return this.poFileLocation;
    }
}
