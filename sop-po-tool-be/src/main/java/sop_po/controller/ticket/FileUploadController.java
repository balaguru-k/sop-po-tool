package sop_po.controller.ticket;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/file")
public class FileUploadController {

    @GetMapping("/upload-page")
    public String getUploadPage() {
        return "upload";
    }
}
