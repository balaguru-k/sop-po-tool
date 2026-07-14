package sop_po.serviceImpl;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;
import sop_po.entity.FileType;
import sop_po.service.FilePathService;
import sop_po.service.FileService;

@Service
@Slf4j
public class FileServiceImpl implements FileService {

	private final Map<String, FilePathService> filePath;

	public FileServiceImpl(List<FilePathService> filePathList) {
		this.filePath = filePathList.stream()
				.collect(Collectors.toMap(path -> path.getClass().getSimpleName(), Function.identity()));
	}

	@Override
	public void init() {
		log.info("Creating upload directories");
		filePath.values().forEach(path -> {
			try {
				Files.createDirectories(path.getDestinationPath());
			} catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not initialize storage");
			}
		});
	}

	@Override
	public String uploadFile(MultipartFile files, FileType fileType) throws IOException {

		String filename = System.currentTimeMillis() + "-" + files.getOriginalFilename();
		Path destinationFile;

		Path location = filePath.getOrDefault(fileType.label, null).getDestinationPath();
		destinationFile = location.resolve(Paths.get(filename)).normalize().toAbsolutePath();

		if (!destinationFile.getParent().equals(location.toAbsolutePath())) {
			// This is a security check
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "error.badFilePath");
		}
		try (InputStream inputStream = files.getInputStream()) {
			Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
		}
		return filename;
	}

	@Override
	public String uploadFile(byte[] fileByte, FileType fileType, String fileName) throws IOException {
		String filename = System.currentTimeMillis() + "-" + fileName;
		Path destinationFile;

		Path location = filePath.getOrDefault(fileType.label, null).getDestinationPath();
		destinationFile = location.resolve(Paths.get(filename)).normalize().toAbsolutePath();

		if (!destinationFile.getParent().equals(location.toAbsolutePath())) {
			// This is a security check
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "error.badFilePath");
		}
		Files.write(destinationFile, fileByte, StandardOpenOption.CREATE);
		return filename;
	}

	@Override
	public void deleteFile(String filename, FileType fileType) throws IOException {
		log.info("Delete file ... {}", filename);
		Path file = load(filename, fileType);

		Files.delete(file);
	}

	@Override
	public Resource loadAsResource(String filename, FileType fileType) throws MalformedURLException {
		log.info("Downloading file ... {}", filename);
		Path file = load(filename, fileType);

		Resource resource = new UrlResource(file.toUri());
		if (resource.exists() || resource.isReadable()) {
			return resource;
		} else {
			return null;

		}
	}

	@Override
	public void moveToBin(String filename, FileType fileType) throws IOException {
		log.info("Moving file to bin ... {}", filename);
		Path currentfile = load(filename, fileType);
		Path destinationFile = filePath.getOrDefault(FileType.BIN.label, null).getDestinationPath()
				.resolve(Paths.get(filename)).normalize().toAbsolutePath();
		Files.move(currentfile, destinationFile, StandardCopyOption.REPLACE_EXISTING);

	}

	private Path load(String filename, FileType fileType) {
		return filePath.getOrDefault(fileType.label, null).getDestinationPath().resolve(filename);
	}

	public String saveChunk(MultipartFile chunk, int chunkIndex, String fileName) throws IOException {
        
        String fileId = sanitizeFileName(fileName);
        Path chunkDir = load(fileId, FileType.CHUNK);
        
        if (!Files.exists(chunkDir)) {
            Files.createDirectories(chunkDir);
        }

        Path chunkPath = chunkDir.resolve("chunk_" + chunkIndex);
        try (OutputStream outputStream = new FileOutputStream(chunkPath.toFile())) {
            outputStream.write(chunk.getBytes());
        }

        log.info("Chunk {} saved for file: {}", chunkIndex, fileName);
        return fileId;
    }

	public String mergeChunks(String fileName, int totalChunks,FileType fileType) {
        try {
            String fileId = sanitizeFileName(fileName);
			Resource resource = loadAsResource(fileId, fileType.CHUNK);
            Path chunkDir = resource.getFile().toPath();
            Path mergedFilePath = load(fileName, fileType);

            try (OutputStream outputStream = new FileOutputStream(mergedFilePath.toFile())) {
                
                for (int i = 0; i < totalChunks; i++) {
                    Path chunkPath = chunkDir.resolve("chunk_" + i);
                    if (Files.exists(chunkPath)) {
                        byte[] chunkData = Files.readAllBytes(chunkPath);
                        outputStream.write(chunkData);
                        
                        Files.delete(chunkPath);
                    } else {
                        log.error("Chunk {} not found for file: {}", i, fileName);
                        throw new IOException("Chunk " + i + " not found");
                    }
                }
            }

            Files.delete(chunkDir);
            log.info("File merged successfully: {}", mergedFilePath.getFileName());
            
            return mergedFilePath.getFileName().toString();
        } catch (IOException e) {
            log.error("Error merging chunks for file: {}", fileName, e.getMessage());
            throw new RuntimeException("Failed to merge chunks", e);
        }
    }


	private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9.-]", "_");
    }

}
