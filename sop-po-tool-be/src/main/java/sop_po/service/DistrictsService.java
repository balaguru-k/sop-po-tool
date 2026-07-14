package sop_po.service;

import sop_po.entity.Districts;

public interface DistrictsService {

    Districts saveDistricts(Districts district);

    Districts getAllDistricts(String region);

}
