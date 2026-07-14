package sop_po.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import sop_po.entity.Districts;
import sop_po.repository.DistrictsRepository;
import sop_po.service.DistrictsService;

@Service
public class DistrictsServiceImpl implements DistrictsService {

    @Autowired
    private DistrictsRepository districtsRepository;

    @Override
    public Districts saveDistricts(Districts district) {

        Districts name = new Districts();
        name.setRegion(district.getRegion());
        name.setDistricts(district.getDistricts());
        return districtsRepository.save(name);
    }

    @Override
    public Districts getAllDistricts(String region) {
        return districtsRepository.findByRegion(region);
    }

}
