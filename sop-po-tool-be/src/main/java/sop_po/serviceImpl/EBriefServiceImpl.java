package sop_po.serviceImpl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import sop_po.entity.GlEntity;
import sop_po.jwt.JwtUtils;
import sop_po.model.EBrief;
import sop_po.model.ticket_request.Brand;
import sop_po.model.ticket_request.Request_table;
import sop_po.repository.EBriefRepository;
import sop_po.repository.GldetailsRepository;
import sop_po.service.EBriefService;

@Service
public class EBriefServiceImpl implements EBriefService {

    @Autowired
    private EBriefRepository eBriefRepository;

    @Autowired
    private GldetailsRepository gldetailsRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ebrief.api.url}")
    private String apiUrl;

    @Value("${ebrief.api.username}")
    private String username;

    @Value("${ebrief.api.password}")
    private String password;

    @Override
    public ResponseEntity<?> fetchAndSaveEBriefs(int page, int limit) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(username, password);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = apiUrl + "?page=" + page + "&limit=" + limit;
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(response.getBody());

                if (rootNode.has("data") && rootNode.get("data").isArray()) {
                    EBrief[] eBriefs = mapper.treeToValue(rootNode.get("data"), EBrief[].class);
                    for (EBrief brief : eBriefs) {
                        if (!eBriefRepository.existsByActivityId(brief.getActivityId())) {
                            eBriefRepository.save(brief);
                        }
                    }
                    return ResponseEntity.ok("Data processed successfully");
                } else {
                    return ResponseEntity.badRequest().body("Invalid response format");
                }
            } else {
                return ResponseEntity.status(response.getStatusCode()).body("Failed to fetch data from external API");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> fetchAndSaveAllEBriefs() {
        try {
            eBriefRepository.deleteAll();

            List<EBrief> allBriefs = new ArrayList<>();
            int page = 1;
            int limit = 100;
            boolean hasMoreData = true;

            while (hasMoreData) {
                HttpHeaders headers = new HttpHeaders();
                headers.setBasicAuth(username, password);
                HttpEntity<String> entity = new HttpEntity<>(headers);

                String url = apiUrl + "?page=" + page + "&limit=" + limit;
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode() == HttpStatus.OK) {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode rootNode = mapper.readTree(response.getBody());

                    if (rootNode.has("data") && rootNode.get("data").isArray()) {
                        JsonNode dataNode = rootNode.get("data");
                        if (dataNode.size() > 0) {
                            EBrief[] eBriefs = mapper.treeToValue(dataNode, EBrief[].class);
                            allBriefs.addAll(Arrays.asList(eBriefs));

                            if (eBriefs.length < limit) {
                                hasMoreData = false;
                            } else {
                                page++;
                            }
                        } else {
                            hasMoreData = false;
                        }
                    } else {
                        hasMoreData = false;
                    }
                } else {
                    return ResponseEntity.status(response.getStatusCode())
                            .body("Failed to fetch data from external API");
                }
            }

            List<EBrief> savedBriefs = eBriefRepository.saveAll(allBriefs);
            return ResponseEntity.ok("Replaced all data. Saved " + savedBriefs.size() + " records");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<?> fetchAllEBrief() {

        return ResponseEntity.ok(eBriefRepository.findAll());
    }

    @Override
    public ResponseEntity<?> fetchEBriefByGlcode(String glCode) {
        List<EBrief> eBriefs = eBriefRepository.findByGlCodePrefix(glCode);
        return ResponseEntity.ok(eBriefs);
    }

    @Override
    public ResponseEntity<?> fetchEBriefByGlcode(String glCode, String ticketId) {
        GlEntity glEntity = gldetailsRepository.findByGlacct(glCode);
        if (glEntity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("GL code not found");
        }
        if (!glEntity.isEbrief()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        String email = jwtUtils.getEmail();
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unable to identify logged-in user");
        }
        List<EBrief> eBriefs = eBriefRepository.findByGlCodePrefixAndEmail(glCode, email);
        if (eBriefs == null || eBriefs.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No E-brief is available for this GL code. Please create one.");
        }
        String userId = jwtUtils.getUserId();
        List<Integer> allActivityIds = eBriefs.stream()
                .map(EBrief::getActivityId)
                .filter(id -> id != null)
                .collect(Collectors.toList());
        List<Brand> usedBrands = mongoTemplate.find(
                new Query(Criteria.where("eBrief.activityId").in(allActivityIds)),
                Brand.class);
        Set<Integer> usedActivityIds = new java.util.HashSet<>();
        if (!usedBrands.isEmpty()) {
            List<ObjectId> brandObjectIds = usedBrands.stream()
                    .map(b -> new ObjectId(b.getBrandid()))
                    .collect(Collectors.toList());
            Criteria criteria = Criteria.where("brand.$id").in(brandObjectIds).and("createdBy").is(userId);
            if (ticketId != null) {
                criteria = criteria.orOperator(Criteria.where("_id").ne(new ObjectId(ticketId)));
            }
            List<Request_table> userTickets = mongoTemplate.find(
                    new Query(criteria),
                    Request_table.class);
            if (!userTickets.isEmpty()) {
                userTickets.forEach(ticket -> ticket.getBrand().forEach(brand -> {
                    if (brand.getEBrief() != null && brand.getEBrief().getActivityId() != null) {
                        usedActivityIds.add(brand.getEBrief().getActivityId());
                    }
                }));
            }
        }
        List<EBrief> availableEBriefs = eBriefs.stream()
                .filter(e -> !usedActivityIds.contains(e.getActivityId()))
                .collect(Collectors.toList());
        if (availableEBriefs.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("All E-briefs for this GL code are used. Please create a new E-brief to continue PO creation.");
        }
        return ResponseEntity.ok(availableEBriefs);
    }
}