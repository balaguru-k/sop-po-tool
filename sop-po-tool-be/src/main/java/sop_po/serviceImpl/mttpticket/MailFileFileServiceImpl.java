package sop_po.serviceImpl.mttpticket;

import java.nio.file.Path;

import org.springframework.stereotype.Component;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FilePathService;

@Component
public class MailFileFileServiceImpl implements FilePathService {

    private final Path mailFileLocation;

    public MailFileFileServiceImpl(StorageProperties properties) {
        this.mailFileLocation = Path.of(properties.getLocation()).resolve(properties.getMailFiles());
    }

    @Override
    public Path getDestinationPath() {
        return this.mailFileLocation;
    }

}
