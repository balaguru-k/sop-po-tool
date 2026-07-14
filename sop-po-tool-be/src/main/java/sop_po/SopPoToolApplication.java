package sop_po;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import sop_po.config.properties.StorageProperties;
import sop_po.service.FileService;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(StorageProperties.class)
public class SopPoToolApplication {

	public static void main(String[] args) {
		SpringApplication.run(SopPoToolApplication.class, args);
	}

	@Bean
	CommandLineRunner init(FileService fileService) {
		return args -> fileService.init();
	}

}
