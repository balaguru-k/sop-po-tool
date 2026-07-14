package sop_po.serviceImpl;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.stereotype.Service;

import sop_po.entity.BrandEntity;
import sop_po.entity.CkplLocationEntity;
import sop_po.entity.GlEntity;
import sop_po.model.BrandbaseData;
import sop_po.model.NonBrandData;
import sop_po.model.Gldetails;
import sop_po.repository.CkplLocationRepository;
import sop_po.repository.DepartmentRepository;
import sop_po.repository.FundcenterRepository;
import sop_po.repository.GldetailsRepository;
import sop_po.repository.NonBrandRepository;
import sop_po.service.DepartmentService;

@Service
public class FetchDataIBasicDetailsmpl implements DepartmentService {

	private static final Logger logger = LoggerFactory.getLogger(FetchDataIBasicDetailsmpl.class);

	@Autowired
	private MongoTemplate mongoTemplate;

	@Autowired
	private FundcenterRepository fundcenterRepository;

	@Autowired
	private GldetailsRepository gldetailsRepository;

	@Autowired
	private CkplLocationRepository ckpllocationRepository;

	public FetchDataIBasicDetailsmpl(DepartmentRepository departmentRepository, NonBrandRepository nonBrandRepository) {
		// this.departmentRepository = departmentRepository;
		// this.nonBrandRepository = nonBrandRepository;
	}

	@Override
	public NonBrandData[] getNonBrandDepartmentsByBrandType() {
		try {
			Aggregation aggregation = Aggregation.newAggregation(Aggregation.group().addToSet("division").as("division")
					.addToSet("location").as("location").addToSet("department").as("department").addToSet("costcenter")
					.as("costcenter").addToSet("fundcenter").as("fundcenter"));

			AggregationResults<NonBrandData> results = mongoTemplate.aggregate(aggregation, "nonbranddata",
					NonBrandData.class);
			List<NonBrandData> mappedResults = results.getMappedResults();

			if (mappedResults.isEmpty()) {
				logger.debug("Aggregation returned no results.");
			} else {
				logger.debug("Aggregation results: {}", mappedResults);
			}

			return mappedResults.toArray(new NonBrandData[0]);
		} catch (Exception e) {
			logger.error("An unexpected error occurred while fetching non-brand departments: ", e);
			return new NonBrandData[0]; // Return an empty array or handle error as needed
		}
	}

	@Override
	public BrandbaseData[] getDepartmentsByBrandType() {
		try {
			Aggregation aggregation = Aggregation.newAggregation(Aggregation.group().addToSet("division").as("division")
					.addToSet("brand").as("brand").addToSet("region").as("region").addToSet("channel").as("channel")
					.addToSet("iodescription").as("iodescription").addToSet("internalorder").as("internalorder")
					.addToSet("fundcenter").as("fundcenter"));

			AggregationResults<BrandbaseData> results = mongoTemplate.aggregate(aggregation, "brandbasedata",
					BrandbaseData.class);

			List<BrandbaseData> mappedResults = results.getMappedResults();

			if (mappedResults.isEmpty()) {
				logger.debug("Aggregation returned no results.");
			} else {
				logger.debug("Aggregation results: {}", mappedResults);
			}

			return mappedResults.toArray(new BrandbaseData[0]);
		} catch (Exception e) {
			logger.error("An unexpected error occurred while fetching non-brand departments: ", e);
			return new BrandbaseData[0];
		}
	}

	@Override
	public List<String> getAllCkplLocation() {
		try {
			Aggregation aggregation = Aggregation.newAggregation(
					Aggregation.project()
							.andExpression(
									"concat(ifNull(searchTerm, ''), ' - ', ifNull(plantSearchTerm, ''))")
							.as("searchTermPlantSearchTerm"));

			AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "ckpllocation", Document.class);

			List<String> mappedResults = results.getMappedResults().stream()
					.map(doc -> doc.getString("searchTermPlantSearchTerm"))
					.collect(Collectors.toList());

			if (mappedResults.isEmpty()) {
				logger.debug("Aggregation returned no results.");
			} else {
				logger.debug("Aggregation results: {}", mappedResults);
			}

			return mappedResults;
		} catch (Exception e) {
			logger.error("An unexpected error occurred while fetching CKPL locations: ", e);
			return Collections.emptyList();
		}
	}

	@Override
	public List<CkplLocationEntity> getLocationsByRegion(String region) {
		return ckpllocationRepository.findByRegion(region);
	}

	@Override
	public Gldetails[] getAllGlDetails() {
		try {
			Aggregation aggregation = Aggregation.newAggregation(Aggregation.group().addToSet("glacct").as("glacct")
					.addToSet("gldescription").as("gldescription").addToSet("cmmtitem").as("cmmtitem")
					.addToSet("cmmititmdescription").as("cmmititmdescription"));

			AggregationResults<Gldetails> results = mongoTemplate.aggregate(aggregation, "gldetails", Gldetails.class);

			List<Gldetails> mappedResults = results.getMappedResults();
			if (mappedResults.isEmpty()) {
				logger.debug("Aggregation returned no results.");
			} else {
				logger.debug("Aggregation results: {}", mappedResults);
			}

			return mappedResults.toArray(new Gldetails[0]);
		} catch (Exception e) {
			logger.error("An unexpected error occurred while fetching GL Details: ", e);
			return new Gldetails[0];
		}
	}

	@Override
	public List<BrandEntity> getFundcenter(String brandName) {
		return fundcenterRepository.findFundcentersByBrand(brandName);
	}

	@Override
	public List<GlEntity> getCmmtitem(String Gldescription) {
		return gldetailsRepository.findCmmtitemByGldescription(Gldescription);
	}
}
