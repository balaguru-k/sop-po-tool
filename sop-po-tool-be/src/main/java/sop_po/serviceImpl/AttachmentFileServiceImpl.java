package sop_po.serviceImpl;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class AttachmentFileServiceImpl implements FilePathService {
    
    private final Path attachmentLocation;
    
    public AttachmentFileServiceImpl(StorageProperties properties) {
        this.attachmentLocation = Paths.get(properties.getLocation()).resolve(properties.getAttachments());
    }

    @Override
    public Path getDestinationPath() {
        return this.attachmentLocation;
    }
}
