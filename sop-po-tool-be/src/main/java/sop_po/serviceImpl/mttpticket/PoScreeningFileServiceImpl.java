package sop_po.serviceImpl.mttpticket;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class PoScreeningFileServiceImpl implements FilePathService {

    private final Path poScreenFileLocation;

    public PoScreeningFileServiceImpl(StorageProperties properties) {
        this.poScreenFileLocation =  Paths.get(properties.getLocation()).resolve(properties.getPoScreeningFile());
    }

    @Override
    public Path getDestinationPath() {
        return this.poScreenFileLocation;
    }

}
