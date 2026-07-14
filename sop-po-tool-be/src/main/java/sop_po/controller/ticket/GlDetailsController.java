package sop_po.controller.ticket;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import sop_po.request.GlDto;
import sop_po.service.GlDetailsService;
import org.springframework.http.ResponseEntity;

@RequestMapping("/api/gldetails")
@RestController
public class GlDetailsController {

    private final GlDetailsService glDetailsService;

    public GlDetailsController(GlDetailsService glDetailsService) {
        this.glDetailsService = glDetailsService;
    }

    @GetMapping("/getAllGlDetails")
    public ResponseEntity<?> getAllGlDetails(@RequestParam String type) {
        return glDetailsService.getAllGlDetails(type);
    }

    @PostMapping()
    public ResponseEntity<?> addGlDetails(@RequestBody GlDto glDto) {
        return glDetailsService.addGlDetails(glDto);
    }

    @PutMapping()
    public ResponseEntity<?> updateGlDetails(@PathVariable String id, @RequestBody GlDto glDto) {
        return glDetailsService.updateGlDetails(id, glDto);
    }

}
