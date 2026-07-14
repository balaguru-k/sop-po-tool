package sop_po.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.ArrayList;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ArrayOperators;
import org.springframework.data.mongodb.core.aggregation.ComparisonOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import sop_po.model.ticket_request.Brand;
import sop_po.model.ticket_request.Estatus;
import sop_po.model.ticket_request.Request_table;
import sop_po.model.ticket_request.TicketStage;

public interface RequestRepository extends MongoRepository<Request_table, String> {
	@Query("{ 'vendorName': 'Prem', 'isDeleted': { $ne: true } }")
	List<Request_table> findDraftTickets();

	@Query("{ 'poApprover': ?0, 'stage': 'Po_release', 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoApproverAndStage(String poApprover);

	@Query(value = "{ 'createdAt': { $gte: ?0, $lt: ?1 }, 'isDeleted': { $ne: true } }", sort = "{ 'createdAt': -1 }")
	List<Request_table> findLatestReqNo(LocalDateTime startOfDay, LocalDateTime endOfDay, Pageable pageable);

	@Query("{ 'poNumber': ?0, 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoNumber(String ponumber);

	@Query(value = "{ 'createdAt': { $gte: ?0, $lte: ?1 }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByCreatedAtDate(LocalDateTime startDate, LocalDateTime endDate, Sort sort);

	@org.springframework.data.mongodb.repository.Aggregation(pipeline = {
			"{ $match: { createdAt: { $gte: ?0, $lte: ?1 }, isDeleted: { $ne: true } } }",
			"{ $match: { poType: ?2 } }",
			"{ $lookup: { " +
					"from: 'History_table', " +
					"localField: 'historyList.$id', " +
					"foreignField: '_id', " +
					"as: 'historyDocs' " +
					"} }",
			"{ $match: { 'historyDocs.username': ?3 } }"
	})
	List<Request_table> findTicketsByDateTypeAndHistoryUsername(
			LocalDateTime startDate,
			LocalDateTime endDate,
			String type,
			String username,
			Sort sort);

	@Query(value = "{ 'status': ?0, 'stage': ?1, 'isDeleted': { $ne: true } }")
	List<Request_table> findByStatusAndStage(Estatus hold, String stage);

	@Query("{ 'stage': ?0, 'businessApprover': ?1, 'isDeleted': { $ne: true } }")
	List<Request_table> findByStageAndBusinessApprover(String stage, String userId);

	@Query("{ 'poNumber': ?0, '_id': { $ne: ?1 }, 'isDeleted': { $ne: true } }")
	Boolean existsByPoNumberAndIdNot(String poNumber, String ticketId);

	@Query("{ 'createdAt' : { $gte: ?0, $lt: ?1 }, 'reqNo' : { $ne: null, $ne: '' }, 'isDeleted': { $ne: true } }")
	List<Request_table> findLatestValidReqNo(LocalDateTime startOfDay, LocalDateTime endOfDay, Pageable pageable);

	@Query("{ 'poNumber': { $in: ?0 }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoNumberIn(List<String> ponumber);

	@Query(value = "{ 'createdAt': { $gte: ?0, $lt: ?1 }, 'reqNo': { $regex: ?2 }, 'isDeleted': { $ne: true } }", sort = "{ 'reqNo': -1 }")
	List<Request_table> findByDateRangeAndReqNoPattern(LocalDateTime startOfDay, LocalDateTime endOfDay,
			String regexPattern, Pageable pageable);

	@Query("{ 'eBrief.activityId': ?0, 'status' : ?1, 'isDeleted': { $ne: true } }")
	List<Request_table> findByEBriefActivityId(Integer activityId, String status);

	default List<Request_table> findTicketsWithMaterialCode(MongoTemplate mongoTemplate) {

		org.springframework.data.mongodb.core.query.Query brandQuery = new org.springframework.data.mongodb.core.query.Query();
		brandQuery.addCriteria(
				Criteria.where("materialCode").exists(true).ne(null).ne(""));

		List<Brand> brands = mongoTemplate.find(brandQuery, Brand.class);

		if (brands.isEmpty())
			return Collections.emptyList();

		List<ObjectId> matchedBrandIds = brands.stream()
				.map(b -> new ObjectId(b.getBrandid()))
				.toList();

		org.springframework.data.mongodb.core.query.Query reqQuery = new org.springframework.data.mongodb.core.query.Query();
		reqQuery.addCriteria(
				Criteria.where("brand.$id").in(matchedBrandIds).and("isDeleted").ne(true));

		return mongoTemplate.find(reqQuery, Request_table.class);
	}

	@Query("{ 'businessApprover': ?0, 'isDeleted': { $ne: true } }")
	List<Request_table> findByBusinessApprover(String userId);

	@Query("{ 'businessApprover': ?0, 'createdAt': { $gte: ?1, $lte: ?2 }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByBusinessApproverAndCreatedAtBetween(String userId, LocalDateTime startDate,
			LocalDateTime endDate);

	@Query("{ 'poApproverId': ?0, 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoApproverId(String userId);

	@Query("{ 'poApproverId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoApproverIdAndCreatedAtBetween(String userId, LocalDateTime startDate,
			LocalDateTime endDate);

	@Query("{ 'createdBy': ?0, 'isDeleted': { $ne: true } }")
	List<Request_table> findByCreatedBy(String userId);

	@Query("{ 'poApproverId': ?0, 'status': { $ne: 'Draft' }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByPoApproverIdAndStatusNotDraft(String userId);

	@Query("{ 'createdBy': ?0, 'status': { $ne: 'Draft' }, 'isDeleted': { $ne: true } }")
	List<Request_table> findByCreatedByAndStatusNotDraft(String userId);

	@Query("{ 'status': { $ne: 'Draft' }, 'isDeleted': { $ne: true } }")
	List<Request_table> findAllByStatusNotDraft();

	@Query("{ 'stage': ?0, 'isDeleted': { $ne: true } }")
	List<Request_table> findByStage(String activeRole);

	default List<Request_table> findRejectedTicketsForStage(
			String stage,
			String ticketType, String id,
			MongoTemplate mongoTemplate) {

		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(
				"Brand".equalsIgnoreCase(ticketType)
						? Criteria.where("brandDetails.brandOrNonBrand").is("Brand")
						: Criteria.where("brandDetails.brandOrNonBrand").is("NonBrand")));

		if (TicketStage.Business_Approver.toString().equalsIgnoreCase(stage)) {
			operations.add(Aggregation.match(Criteria.where("businessApprover").is(id)));
		}
		if (TicketStage.Po_release.toString().equalsIgnoreCase(stage)) {
			operations.add(Aggregation.match(Criteria.where("poApproverId").is(id)));
		}

		operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));
		operations.add(Aggregation.addFields()
				.addField("stageHistory")
				.withValue(ArrayOperators.Filter
						.filter("histories")
						.as("history")
						.by(ComparisonOperators.Eq
								.valueOf("$$history.name")
								.equalToValue(stage)))
				.build());
		operations.add(Aggregation.addFields()
				.addField("lastStageHistory")
				.withValue(ArrayOperators.ArrayElemAt
						.arrayOf("stageHistory")
						.elementAt(-1))
				.build());
		operations.add(Aggregation.match(
				Criteria.where("lastStageHistory.status").is("Reject")
						.and("stage").ne(stage)));
		operations.add(Aggregation.sort(Sort.by(Sort.Direction.DESC, "updatedAt")));
		operations.add(Aggregation.project()
				.andExclude("stageHistory", "lastStageHistory", "brandDetails", "histories"));

		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate
				.aggregate(aggregation, "Request_table", Request_table.class)
				.getMappedResults();
	}

	default List<Request_table> findByTicketTypeAndStatusNotDraft(String ticketType, MongoTemplate mongoTemplate) {
		if (ticketType == null || ticketType.trim().isEmpty()) {
			ticketType = "Brand";
		}

		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(Criteria.where("status").ne("Draft")),
				Aggregation.match(
						"Brand".equalsIgnoreCase(ticketType)
								? Criteria.where("brandDetails.brandOrNonBrand").regex("^Brand$", "i")
								: Criteria.where("brandDetails.brandOrNonBrand").regex("^(NonBrand|Non-Brand)$", "i")),
				Aggregation.project().andExclude("brandDetails"));

		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByBusinessApproverAndStatusNotDraft(String userId, String ticketType,
			MongoTemplate mongoTemplate) {
		if (ticketType == null || ticketType.trim().isEmpty()) {
			ticketType = "Brand";
		}

		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("businessApprover").is(userId).and("status").ne("Draft").and("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(
						"Brand".equalsIgnoreCase(ticketType)
								? Criteria.where("brandDetails.brandOrNonBrand").regex("^Brand$", "i")
								: Criteria.where("brandDetails.brandOrNonBrand").regex("^(NonBrand|Non-Brand)$", "i")),
				Aggregation.project().andExclude("brandDetails"));

		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByPoApproverIdAndStatusNotDraft(String userId, String ticketType,
			MongoTemplate mongoTemplate) {
		if (ticketType == null || ticketType.trim().isEmpty()) {
			ticketType = "Brand";
		}

		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("poApproverId").is(userId).and("status").ne("Draft").and("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(
						"Brand".equalsIgnoreCase(ticketType)
								? Criteria.where("brandDetails.brandOrNonBrand").regex("^Brand$", "i")
								: Criteria.where("brandDetails.brandOrNonBrand").regex("^(NonBrand|Non-Brand)$", "i")),
				Aggregation.project().andExclude("brandDetails"));

		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByCreatedByAndStatusNotDraft(String userId, String ticketType,
			MongoTemplate mongoTemplate) {
		if (ticketType == null || ticketType.trim().isEmpty()) {
			ticketType = "Brand";
		}

		Aggregation aggregation = Aggregation.newAggregation(
				Aggregation.match(Criteria.where("createdBy").is(userId).and("status").ne("Draft").and("isDeleted").ne(true)),
				Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"),
				Aggregation.match(
						"Brand".equalsIgnoreCase(ticketType)
								? Criteria.where("brandDetails.brandOrNonBrand").regex("^Brand$", "i")
								: Criteria.where("brandDetails.brandOrNonBrand").regex("^(NonBrand|Non-Brand)$", "i")),
				Aggregation.project().andExclude("brandDetails"));

		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByCreatedAtDateAndTicketType(LocalDateTime startDate, LocalDateTime endDate,
			String ticketType, String activeTab, String activeRole, String userId, Sort sort,
			MongoTemplate mongoTemplate) {
		String brandPattern = "brand".equalsIgnoreCase(ticketType) ? "^Brand$" : "^(NonBrand|Non-Brand)$";

		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("createdAt").gte(startDate).lte(endDate).and("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));

		// Exclude draft tickets for Requestor role in all tabs except draft
		if ("Requestor".equals(activeRole) && !"draft".equalsIgnoreCase(activeTab)) {
			operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));
			operations.add(Aggregation.addFields().addField("latestRequestorHistory")
					.withValue(ArrayOperators.ArrayElemAt.arrayOf(
							ArrayOperators.Filter.filter("histories").as("h")
									.by(ComparisonOperators.Eq.valueOf("$$h.name").equalToValue("Requestor")))
							.elementAt(-1))
					.build());
			operations.add(Aggregation.match(Criteria.where("latestRequestorHistory.status").ne("Draft")));
		}

		if ("inbox".equalsIgnoreCase(activeTab)) {
			if ("Requestor".equals(activeRole)) {
				operations.add(Aggregation.match(Criteria.where("createdBy").is(userId).and("stage").ne("Completed")
						.and("status").ne("Completed")));
			} else if ("Business_Approver".equals(activeRole)) {
				operations.add(
						Aggregation.match(Criteria.where("stage").is(activeRole).and("businessApprover").is(userId)));
			} else if ("Po_release".equals(activeRole)) {
				operations
						.add(Aggregation.match(Criteria.where("stage").is(activeRole).and("poApproverId").is(userId)));
			} else {
				operations.add(Aggregation.match(Criteria.where("stage").is(activeRole)));
			}
		} else if ("completed".equalsIgnoreCase(activeTab)) {
			operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));

			if (TicketStage.Requestor.toString().equalsIgnoreCase(activeRole)) {
				operations.add(Aggregation.match(Criteria.where("stage").is("Completed").and("createdBy").is(userId)));
			} else if (TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)) {
				operations.add(
						Aggregation.match(Criteria.where("businessApprover").is(userId).and("stage").ne(activeRole)));
				operations.add(Aggregation.addFields().addField("latestBAHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name")
												.equalToValue(TicketStage.Business_Approver.toString())))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(Criteria.where("latestBAHistory.status").is(Estatus.Approved)));
			} else if (TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
				operations
						.add(Aggregation.match(Criteria.where("poApproverId").is(userId).and("stage").ne(activeRole)));
				operations.add(Aggregation.addFields().addField("latestPRHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name")
												.equalToValue(TicketStage.Po_release.toString())))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(Criteria.where("latestPRHistory.status").is(Estatus.Approved)));
			} else {
				operations.add(Aggregation.match(Criteria.where("stage").ne(activeRole)));
				operations.add(Aggregation.addFields().addField("latestRoleHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name").equalToValue(activeRole)))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(new Criteria().orOperator(
						Criteria.where("latestRoleHistory.status").is(Estatus.Approved),
						Criteria.where("latestRoleHistory.status").is(Estatus.Completed))));
			}
		} else if ("rejected".equalsIgnoreCase(activeTab)) {
			if (TicketStage.Requestor.toString().equalsIgnoreCase(activeRole)) {
				operations.add(Aggregation.match(Criteria.where("_id").exists(false)));
			} else {
				operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));

				if (TicketStage.Business_Approver.toString().equalsIgnoreCase(activeRole)) {
					operations.add(Aggregation
							.match(Criteria.where("businessApprover").is(userId).and("stage").ne("Business_Approver")));
					operations.add(Aggregation.addFields().addField("latestBAHistory")
							.withValue(ArrayOperators.ArrayElemAt.arrayOf(
									ArrayOperators.Filter.filter("histories").as("h")
											.by(ComparisonOperators.Eq.valueOf("$$h.name")
													.equalToValue(TicketStage.Business_Approver.toString())))
									.elementAt(-1))
							.build());
					operations.add(Aggregation.match(Criteria.where("latestBAHistory.status").is(Estatus.Reject)));
				} else if (TicketStage.Po_release.toString().equalsIgnoreCase(activeRole)) {
					operations.add(
							Aggregation.match(Criteria.where("poApproverId").is(userId).and("stage").ne("Po_release")));
					operations.add(Aggregation.addFields().addField("latestPRHistory")
							.withValue(ArrayOperators.ArrayElemAt.arrayOf(
									ArrayOperators.Filter.filter("histories").as("h")
											.by(ComparisonOperators.Eq.valueOf("$$h.name")
													.equalToValue(TicketStage.Po_release.toString())))
									.elementAt(-1))
							.build());
					operations.add(Aggregation.match(Criteria.where("latestPRHistory.status").is(Estatus.Reject)));
				} else {
					operations.add(Aggregation.addFields().addField("latestRoleHistory")
							.withValue(ArrayOperators.ArrayElemAt.arrayOf(
									ArrayOperators.Filter.filter("histories").as("h")
											.by(ComparisonOperators.Eq.valueOf("$$h.name").equalToValue(activeRole)))
									.elementAt(-1))
							.build());
					operations.add(Aggregation.match(Criteria.where("latestRoleHistory.status").is(Estatus.Reject)));
				}
			}
		} else if ("hold".equalsIgnoreCase(activeTab)) {
			if ("Requestor".equals(activeRole)) {
				operations.add(Aggregation.match(
						Criteria.where("createdBy").is(userId).and("stage").is("Requestor").and("status").is("Hold")));
			} else if ("Business_Approver".equals(activeRole)) {
				operations.add(Aggregation.match(Criteria.where("businessApprover").is(userId).and("stage")
						.is("Business_Approver").and("status").is("Hold")));
			} else if ("Po_release".equals(activeRole)) {
				operations.add(Aggregation.match(Criteria.where("poApproverId").is(userId).and("stage").is("Po_release")
						.and("status").is("Hold")));
			} else {
				operations.add(Aggregation.match(Criteria.where("stage").is(activeRole).and("status").is("Hold")));
			}
		} else if ("draft".equalsIgnoreCase(activeTab)) {
			if ("Requestor".equals(activeRole)) {
				operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));
				operations.add(Aggregation.match(Criteria.where("createdBy").is(userId).and("stage").is("Requestor")));
				operations.add(Aggregation.addFields().addField("latestRequestorHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name").equalToValue("Requestor")))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(Criteria.where("latestRequestorHistory.status").is("Draft")));
			}
		}

		operations.add(Aggregation.sort(sort));
		operations.add(Aggregation.project().andExclude("brandDetails", "histories", "latestBAHistory",
				"latestPRHistory", "latestRoleHistory", "latestRequestorHistory"));
		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findBudgetTeamExportTickets(LocalDateTime startDate, LocalDateTime endDate,
			String ticketType, String activeTab, MongoTemplate mongoTemplate) {
		String brandPattern = "brand".equalsIgnoreCase(ticketType) ? "^Brand$" : "^(NonBrand|Non-Brand)$";

		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("createdAt").gte(startDate).lte(endDate).and("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));

		switch (activeTab.toLowerCase()) {
			case "inbox":
				operations.add(Aggregation.match(
						Criteria.where("stage").is(TicketStage.Budget_Team.toString())
								.and("status").ne(Estatus.Hold)));
				break;
			case "completed":
				operations.add(Aggregation.match(Criteria.where("stage").ne(TicketStage.Budget_Team.toString())));
				operations.add(Aggregation.addFields().addField("latestBudgetHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name")
												.equalToValue(TicketStage.Budget_Team.toString())))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(Criteria.where("latestBudgetHistory.status").is(Estatus.Approved)));
				break;
			case "rejected":
				operations.add(Aggregation.match(Criteria.where("stage").ne(TicketStage.Budget_Team.toString())));
				operations.add(Aggregation.addFields().addField("latestBudgetHistory")
						.withValue(ArrayOperators.ArrayElemAt.arrayOf(
								ArrayOperators.Filter.filter("histories").as("h")
										.by(ComparisonOperators.Eq.valueOf("$$h.name")
												.equalToValue(TicketStage.Budget_Team.toString())))
								.elementAt(-1))
						.build());
				operations.add(Aggregation.match(Criteria.where("latestBudgetHistory.status").is(Estatus.Reject)));
				break;
			case "hold":
				operations.add(Aggregation.match(
						Criteria.where("stage").is(TicketStage.Budget_Team.toString())
								.and("status").is(Estatus.Hold)));
				break;
		}

		operations.add(Aggregation.sort(Sort.by(Sort.Direction.ASC, "createdAt")));
		operations.add(Aggregation.project().andExclude("brandDetails", "histories", "latestBudgetHistory"));
		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByCreatedAtDateAndTicketTypeForSpecialUsers(LocalDateTime startDate,
			LocalDateTime endDate,
			String ticketType, Sort sort, MongoTemplate mongoTemplate) {
		String brandPattern = "brand".equalsIgnoreCase(ticketType) ? "^Brand$" : "^(NonBrand|Non-Brand)$";

		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("createdAt").gte(startDate).lte(endDate).and("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));

		// Exclude draft tickets: stage = Requestor and status = DRAFT
		operations.add(Aggregation.match(
				new Criteria().norOperator(
						Criteria.where("stage").is(TicketStage.Requestor.toString())
								.and("status").is(Estatus.Draft.toString()))));

		operations.add(Aggregation.sort(sort));
		operations.add(Aggregation.project().andExclude("brandDetails"));
		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByBrandEBriefActivityIdAndActivityDate(
			LocalDate startDate,
			LocalDate endDate,
			String status,
			MongoTemplate mongoTemplate) {

		// Convert LocalDate → Date (UTC)
		Date start = Date.from(startDate.atStartOfDay(ZoneId.of("UTC")).toInstant());
		Date end = Date.from(endDate.atStartOfDay(ZoneId.of("UTC")).toInstant());

		Aggregation aggregation = Aggregation.newAggregation(

				Aggregation.match(Criteria.where("isDeleted").ne(true)),

				// lookup
				Aggregation.lookup(
						"Brand_table",
						"brand.$id",
						"_id",
						"brandDetails"),

				// unwind
				Aggregation.unwind("brandDetails"),

				// match
				Aggregation.match(
						Criteria.where("status").is(status)
								.and("brandDetails.eBrief").exists(true)
								.and("brandDetails.activityStartDate").gte(start)
								.and("brandDetails.activityEndDate").lte(end)),

				// group
				Aggregation.group("_id")
						.first(Aggregation.ROOT).as("requestDetails")
						.push("brandDetails").as("filteredBrands"),

				// addFields
				Aggregation.addFields()
						.addFieldWithValue("requestDetails.brand", "$filteredBrands")
						.build(),

				// replaceRoot
				Aggregation.replaceRoot("requestDetails"),

				// project remove brandDetails
				Aggregation.project().andExclude("brandDetails"));

		System.out.println("MongoDB Query: " + aggregation);

		return mongoTemplate.aggregate(
				aggregation,
				"Request_table",
				Request_table.class).getMappedResults();
	}

	default List<Request_table> findByBrandEBriefActivityId(
			String status,
			MongoTemplate mongoTemplate) {

		Aggregation aggregation = Aggregation.newAggregation(

				Aggregation.match(Criteria.where("isDeleted").ne(true)),

				// lookup
				Aggregation.lookup(
						"Brand_table",
						"brand.$id",
						"_id",
						"brandDetails"),

				// unwind
				Aggregation.unwind("brandDetails"),

				// match
				Aggregation.match(
						Criteria.where("status").is(status)
								.and("brandDetails.eBrief").exists(true)),

				// group
				Aggregation.group("_id")
						.first(Aggregation.ROOT).as("requestDetails")
						.push("brandDetails").as("filteredBrands"),

				// addFields
				Aggregation.addFields()
						.addFieldWithValue("requestDetails.brand", "$filteredBrands")
						.build(),

				// replaceRoot
				Aggregation.replaceRoot("requestDetails"),

				// project remove brandDetails
				Aggregation.project().andExclude("brandDetails"));

		return mongoTemplate.aggregate(
				aggregation,
				"Request_table",
				Request_table.class).getMappedResults();
	}

	default List<Request_table> findCompletedTicketsByStage(String stage, String ticketType, String userId, String role,
			MongoTemplate mongoTemplate) {
		List<AggregationOperation> operations = new ArrayList<>();

		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));

		Criteria matchCriteria = Criteria.where("brandDetails.brandOrNonBrand").regex("^" + ticketType + "$", "i")
				.and("historyList").exists(true).ne(null);

		if (TicketStage.Requestor.toString().equalsIgnoreCase(stage)) {
			matchCriteria = matchCriteria.and("createdBy").is(userId);
		} else {
			matchCriteria = matchCriteria.and("stage").ne(role);
		}

		if (TicketStage.Business_Approver.toString().equalsIgnoreCase(role)) {
			matchCriteria = matchCriteria.and("businessApprover").is(userId);
		} else if (TicketStage.Po_release.toString().equalsIgnoreCase(role)) {
			matchCriteria = matchCriteria.and("poApproverId").is(userId);
		}

		operations.add(Aggregation.match(matchCriteria));
		operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));

		operations.add(Aggregation.addFields()
				.addField("lastStageHistory")
				.withValue(ArrayOperators.ArrayElemAt.arrayOf(
						ArrayOperators.Filter.filter("histories")
								.as("history")
								.by(ComparisonOperators.Eq.valueOf("$$history.name").equalToValue(role)))
						.elementAt(-1))
				.build());

		if (TicketStage.Requestor.toString().equalsIgnoreCase(role)) {
			operations.add(Aggregation.match(
					Criteria.where("lastStageHistory.status").ne("Draft")));
		} else {
			operations.add(Aggregation.match(
					Criteria.where("lastStageHistory.status").in("Approved", "Completed")));
		}

		operations.add(Aggregation.sort(Sort.by(Sort.Direction.DESC, "updatedAt")));
		operations.add(Aggregation.project().andExclude("brandDetails", "histories", "lastStageHistory"));

		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default List<Request_table> findByTypeWithDateFilter(LocalDateTime startDate, LocalDateTime endDate,
			String type, MongoTemplate mongoTemplate) {
		String brandPattern = "Brand".equalsIgnoreCase(type) ? "^Brand$" : "^(NonBrand|Non-Brand)$";
		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		if (startDate != null && endDate != null) {
			operations.add(Aggregation.match(Criteria.where("createdAt").gte(startDate).lte(endDate)));
		}
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		operations.add(Aggregation.project().andExclude("brandDetails"));
		return mongoTemplate.aggregate(Aggregation.newAggregation(operations), "Request_table", Request_table.class)
				.getMappedResults();
	}

	default List<Request_table> findByBusinessApproverAndTypeWithDateFilter(String userId, LocalDateTime startDate,
			LocalDateTime endDate, String type, MongoTemplate mongoTemplate) {
		String brandPattern = "Brand".equalsIgnoreCase(type) ? "^Brand$" : "^(NonBrand|Non-Brand)$";
		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		Criteria match = Criteria.where("businessApprover").is(userId);
		if (startDate != null && endDate != null) {
			match = match.and("createdAt").gte(startDate).lte(endDate);
		}
		operations.add(Aggregation.match(match));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		operations.add(Aggregation.project().andExclude("brandDetails"));
		return mongoTemplate.aggregate(Aggregation.newAggregation(operations), "Request_table", Request_table.class)
				.getMappedResults();
	}

	default List<Request_table> findByPoApproverIdAndTypeWithDateFilter(String userId, LocalDateTime startDate,
			LocalDateTime endDate, String type, MongoTemplate mongoTemplate) {
		String brandPattern = "Brand".equalsIgnoreCase(type) ? "^Brand$" : "^(NonBrand|Non-Brand)$";
		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));
		Criteria match = Criteria.where("poApproverId").is(userId);
		if (startDate != null && endDate != null) {
			match = match.and("createdAt").gte(startDate).lte(endDate);
		}
		operations.add(Aggregation.match(match));
		operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
		operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		operations.add(Aggregation.project().andExclude("brandDetails"));
		return mongoTemplate.aggregate(Aggregation.newAggregation(operations), "Request_table", Request_table.class)
				.getMappedResults();
	}

	default List<Request_table> findTicketsApprovedByPoChecker(int page, int size, String type, String search, MongoTemplate mongoTemplate) {
		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));

		if (search != null && !search.trim().isEmpty()) {
			operations.add(Aggregation.match(new Criteria().orOperator(
					Criteria.where("reqNo").regex(search, "i"),
					Criteria.where("vendorName").regex(search, "i"),
					Criteria.where("vendorCode").regex(search, "i"),
					Criteria.where("username").regex(search, "i"),
					Criteria.where("stage").regex(search, "i"))));
		}

		if (type != null && !type.trim().isEmpty()) {
			String brandPattern = "brand".equalsIgnoreCase(type) ? "^Brand$" : "^(NonBrand|Non-Brand)$";
			operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
			operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		}

		operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));
		operations.add(Aggregation.addFields()
				.addField("lastPoCheckerHistory")
				.withValue(ArrayOperators.ArrayElemAt.arrayOf(
						ArrayOperators.Filter.filter("histories").as("h")
								.by(ComparisonOperators.Eq.valueOf("$$h.name")
										.equalToValue(TicketStage.Po_checker.toString())))
						.elementAt(-1))
				.build());
		operations.add(Aggregation.match(Criteria.where("lastPoCheckerHistory.status").is("Approved")));
		operations.add(Aggregation.sort(Sort.by(Sort.Direction.DESC, "updatedAt")));
		operations.add(Aggregation.skip((long) page * size));
		operations.add(Aggregation.limit(size));
		operations.add(Aggregation.project().andExclude("histories", "lastPoCheckerHistory", "brandDetails"));
		Aggregation aggregation = Aggregation.newAggregation(operations);
		return mongoTemplate.aggregate(aggregation, "Request_table", Request_table.class).getMappedResults();
	}

	default long countTicketsApprovedByPoChecker(String type, String search, MongoTemplate mongoTemplate) {
		List<AggregationOperation> operations = new ArrayList<>();
		operations.add(Aggregation.match(Criteria.where("isDeleted").ne(true)));

		if (search != null && !search.trim().isEmpty()) {
			operations.add(Aggregation.match(new Criteria().orOperator(
					Criteria.where("reqNo").regex(search, "i"),
					Criteria.where("vendorName").regex(search, "i"),
					Criteria.where("vendorCode").regex(search, "i"),
					Criteria.where("username").regex(search, "i"),
					Criteria.where("stage").regex(search, "i"))));
		}

		if (type != null && !type.trim().isEmpty()) {
			String brandPattern = "brand".equalsIgnoreCase(type) ? "^Brand$" : "^(NonBrand|Non-Brand)$";
			operations.add(Aggregation.lookup("Brand_table", "brand.$id", "_id", "brandDetails"));
			operations.add(Aggregation.match(Criteria.where("brandDetails.brandOrNonBrand").regex(brandPattern, "i")));
		}

		operations.add(Aggregation.lookup("History_table", "historyList.$id", "_id", "histories"));
		operations.add(Aggregation.addFields()
				.addField("lastPoCheckerHistory")
				.withValue(ArrayOperators.ArrayElemAt.arrayOf(
						ArrayOperators.Filter.filter("histories").as("h")
								.by(ComparisonOperators.Eq.valueOf("$$h.name")
										.equalToValue(TicketStage.Po_checker.toString())))
						.elementAt(-1))
				.build());
		operations.add(Aggregation.match(Criteria.where("lastPoCheckerHistory.status").is("Approved")));
		operations.add(Aggregation.count().as("total"));
		Aggregation aggregation = Aggregation.newAggregation(operations);
		List<org.bson.Document> results = mongoTemplate.aggregate(aggregation, "Request_table", org.bson.Document.class).getMappedResults();
		return results.isEmpty() ? 0 : ((Number) results.get(0).get("total")).longValue();
	}
}