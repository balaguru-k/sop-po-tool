package sop_po.service;

import org.springframework.stereotype.Service;

@Service
public interface ClosedEmailService {
	
    String sendSimpleMail(String recipient);
}
