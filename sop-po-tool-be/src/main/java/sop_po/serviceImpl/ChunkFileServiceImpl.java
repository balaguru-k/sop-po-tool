package sop_po.serviceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;
@Component
public class ChunkFileServiceImpl implements FilePathService {
    private final Path chunkLocation;
    
    public ChunkFileServiceImpl(StorageProperties properties) {
        this.chunkLocation = Paths.get(properties.getLocation()).resolve(properties.getChunk());
    }

    @Override
    public Path getDestinationPath() {
        return this.chunkLocation;
    }

}
