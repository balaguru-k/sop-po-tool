package sop_po.serviceImpl.mttpticket;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PoMakerFileServiceImpl implements FilePathService {

    private final Path poMakerFileLocation;

    public PoMakerFileServiceImpl(StorageProperties properties) {
        this.poMakerFileLocation =  Paths.get(properties.getLocation()).resolve(properties.getPoMakerFile());
    }

    @Override
    public Path getDestinationPath() {
        return this.poMakerFileLocation;
    }

}
