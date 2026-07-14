import { Row, Col, Card, DatePicker, Tooltip } from 'antd'
import '../assets/css/custom-style.css'
import '../assets/css/dashboard.css'
import { BaseUrl } from '../App';
import axios from 'axios';
import { useEffect, useState } from 'react';

const { RangePicker } = DatePicker;

const PoTat = () => {

  const [getTAT,setGetTAT]=useState({})
  const [dateRange, setDateRange] = useState([]);
  const [brandType, setBrandType] = useState('Brand');
  const userRole = localStorage.getItem("role")?.toLowerCase();
  const userEmail = localStorage.getItem("email");
  const userType = JSON.parse(localStorage.getItem("userType") || '[]');
  const adminEmails = ['hganesh@cavinkare.com', 'misha@cavinkare.com' , 'sakthivel.sp@hepl.com'];
  const isSpecialAdmin = adminEmails.includes(userEmail);
  const showToggle = userType.includes("Brand") && userType.includes("NonBrand");

   const fetchPoTAT = async () => {
    try {
      let url = `${BaseUrl}dashboard/tat`;
      const params = [];
      if (dateRange && dateRange.length === 2) {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        params.push(`startDate=${startDate}`);
        params.push(`endDate=${endDate}`);
      }
      params.push(`type=${brandType === 'Brand' ? 'Brand' : 'NonBrand'}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setGetTAT(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const calculateTotalAgeing = (data) => {
    const result = {
      Completed: { '0D': 0, '1D': 0, '2-3D': 0, '4D+': 0 },
      Rejected: { '0D': 0, '1D': 0, '2-3D': 0, '4D+': 0 },
      Hold: { '0D': 0, '1D': 0, '2-3D': 0, '4D+': 0 },
      Pending: { '0D': 0, '1D': 0, '2-3D': 0, '4D+': 0 },
      AverageDays: { Completed: 0, Rejected: 0, Hold: 0, Pending: 0 }
    };

    const sumCounts = (obj) => Object.values(obj || {}).reduce((a, b) => a + b, 0);

    Object.values(data).forEach(team => {
      if (team) {
        ['Completed', 'Rejected', 'Hold', 'Pending'].forEach(status => {
          if (team[status]) {
            ['0D', '1D', '2-3D', '4D+'].forEach(day => {
              result[status][day] += team[status][day] || 0;
            });

            // Weighted average accumulation
            const count = sumCounts(team[status]);
            const avg = team.AverageDays?.[status] || 0;
            result.AverageDays[status] += avg * count;
          }
        });
      }
    });

    // Finalize weighted averages
    ['Completed', 'Rejected', 'Hold', 'Pending'].forEach(status => {
      const totalCount = sumCounts(result[status]);
      result.AverageDays[status] = totalCount > 0 ? result.AverageDays[status] / totalCount : 0;
    });

    return result;
  };

  useEffect(() => {
    fetchPoTAT();
  }, [dateRange, brandType]);

  const tatData = [
    { id: 1, approver: 'BA Ageing', remarks: 'from Request date', role: 'Business_Approver' },
    { id: 2, approver: 'PO Screening', remarks: 'from BA Approval date', role: 'PO_Screening' },
    { id: 3, approver: 'Budget Releasing', remarks: 'from PO Screening approval date', role: 'Budget_Team' },
    { id: 4, approver: 'PO Maker', remarks: 'from Budget Releasing approval date', role: 'Po_maker' },
    { id: 5, approver: 'PO Releasing', remarks: 'from PO Maker approval date', role: 'Po_release' },
    { id: 6, approver: 'QC Checker', remarks: 'from PO Releasing approval date', role: 'Po_checker' },
    { id: 7, approver: 'Overall ageing', remarks: 'from Request date', role: 'Admin' }
  ]

  const filteredTatData = (userRole === "admin" || isSpecialAdmin)
                        ? tatData
                        : tatData.filter(item => item.role.toLowerCase() === userRole);

  const statusConfig = {
    completed: { color: '#4bb543', bg: '#ecfee9ff' },
    hold: { color: '#2196f3', bg: '#e3f2fd' },
    pending: { color: '#ffaa00', bg: '#fff8e1' },
    rejected: { color: '#eb043c', bg: '#ffebee' }
  }

  const dayLabels = ['0D', '1D', '2-3D', '>4D']

  const StatusRow = ({ status, data = {}, average = 0 }) => {
    const items = [
      { label: '0D', value: data['0D'] || 0, span: 4 },
      { label: '1D', value: data['1D'] || 0, span: 4 },
      { label: '2-3D', value: data['2-3D'] || 0, span: 4 },
      { label: '>4D', value: data['4D+'] || 0, span: 4 },
      { label: 'Avg Days', value: Number(average).toFixed(1), span: 8 }
    ];

    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: statusConfig[status].color, marginBottom: '6px' }}>
          {status.toUpperCase()}
        </div>
        <Row gutter={[4, 4]}>
          {items.map((item, i) => (
            <Col span={item.span} key={i}>
              <div style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: '4px',
                background: statusConfig[status].bg,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {item.value}
                <div style={{ fontSize: '9px', color: '#666' }}>{item.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  const shouldShowHold = (role) => {
    return role === 'Po_maker' || role === 'Budget_Team' || role === 'Admin';
  };
  
  return (
    <div className="container-fluid main-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="txt_title">TAT Report</div>
        <div className="d-flex align-items-center gap-3">
          {showToggle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: brandType === 'Brand' ? '#eb043c' : '#666' }}>
                {brandType === 'Brand' ? 'Marketing' : 'M'}
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={brandType === "Non Brand"}
                  onChange={(e) => {
                    const newType = e.target.checked ? "Non Brand" : "Brand";
                    setBrandType(newType);
                  }}
                />
                <span className="toggle-slider" style={{ backgroundColor: statusConfig.rejected.color }}>
                  <span className={`toggle-knob ${brandType === "Brand" ? "left" : "right"}`}></span>
                </span>
              </label>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: brandType === 'Non Brand' ? '#eb043c' : '#666' }}>
                {brandType === 'Non Brand' ? 'Non Marketing' : 'NM'}
              </span>
            </div>
          )}
          <Tooltip title={dateRange && dateRange.length === 2 
            ? `${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`
            : "Filter by Date Range"
          }>
            <RangePicker 
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
            />
          </Tooltip>
        </div>
      </div>
      <div>
        <Row gutter={[24, 24]} justify={filteredTatData.length === 1 ? "center" : "start"}>
          {filteredTatData.map(item => {
            const isAdmin = item.role === 'Admin';
            const roleData = isAdmin ? calculateTotalAgeing(getTAT) : getTAT[item.role] || {};
            
            return (
            <Col 
              xs={24} 
              sm={filteredTatData.length === 1 ? 24 : 12} 
              md={filteredTatData.length === 1 ? 24 : 8} 
              key={item.id}
            >
              <Card className="tat-card" style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0',
                background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                height: '500px',
                position: 'relative'
              }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', color: '#eb043c' }}>
                {item.approver}
              </div>
              
              {filteredTatData.length === 1 ? (
                shouldShowHold(item.role) ? (
                  <Row gutter={[6, 6]}>
                    {Object.keys(statusConfig).map(status => {
                      const statusKey = status.charAt(0).toUpperCase() + status.slice(1);
                      const statusData = roleData[statusKey] || {};
                      const dayValues = ['0D', '1D', '2-3D', '4D+'].map(day => statusData[day] || 0);
                      return (
                        <Col span={12} key={status}>
                          <div style={{
                            textAlign: 'center',
                            padding: '8px',
                            borderRadius: '8px',
                            background: statusConfig[status].bg,
                            minHeight: '120px'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig[status].color, marginBottom: '6px' }}>
                              {status.toUpperCase()}
                            </div>
                            <Row gutter={[4, 4]}>
                              {[
                                { label: '0D', value: statusData['0D'] || 0, span: 4 },
                                { label: '1D', value: statusData['1D'] || 0, span: 4 },
                                { label: '2-3D', value: statusData['2-3D'] || 0, span: 4 },
                                { label: '>4D', value: statusData['4D+'] || 0, span: 4 },
                                { label: 'Avg Days', value: Number(roleData.AverageDays?.[statusKey] || 0).toFixed(1), span: 8 }
                              ].map((item, i) => (
                                <Col span={item.span} key={i}>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.value}</div>
                                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{item.label}</div>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <>
                    {/* Complete - Center */}
                    <Row gutter={[6, 6]} style={{ marginBottom: '6px' }}>
                      <Col span={12} offset={6}>
                        <div style={{
                          textAlign: 'center',
                          padding: '8px',
                          borderRadius: '8px',
                          background: statusConfig.completed.bg,
                          minHeight: '120px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig.completed.color, marginBottom: '6px' }}>
                            COMPLETED
                          </div>
                          <Row gutter={[4, 4]}>
                            {[
                              { label: '0D', value: roleData.Completed?.['0D'] || 0, span: 4 },
                              { label: '1D', value: roleData.Completed?.['1D'] || 0, span: 4 },
                              { label: '2-3D', value: roleData.Completed?.['2-3D'] || 0, span: 4 },
                              { label: '>4D', value: roleData.Completed?.['4D+'] || 0, span: 4 },
                              { label: 'Avg Days', value: Number(roleData.AverageDays?.Completed || 0).toFixed(1), span: 8 }
                            ].map((item, i) => (
                                <Col span={item.span} key={i}>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.value}</div>
                                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{item.label}</div>
                                </Col>
                              ))}
                          </Row>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Pending and Rejected - Bottom Row */}
                    <Row gutter={[6, 6]}>
                      <Col span={12}>
                        <div style={{
                          textAlign: 'center',
                          padding: '8px',
                          borderRadius: '8px',
                          background: statusConfig.pending.bg,
                          minHeight: '120px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig.pending.color, marginBottom: '6px' }}>
                            PENDING
                          </div>
                          <Row gutter={[4, 4]}>
                            {[
                              { label: '0D', value: roleData.Pending?.['0D'] || 0, span: 4 },
                              { label: '1D', value: roleData.Pending?.['1D'] || 0, span: 4 },
                              { label: '2-3D', value: roleData.Pending?.['2-3D'] || 0, span: 4 },
                              { label: '>4D', value: roleData.Pending?.['4D+'] || 0, span: 4 },
                              { label: 'Avg Days', value: Number(roleData.AverageDays?.Pending || 0).toFixed(1), span: 8 }
                            ].map((item, i) => (
                                <Col span={item.span} key={i}>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.value}</div>
                                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{item.label}</div>
                                </Col>
                              ))}
                          </Row>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{
                          textAlign: 'center',
                          padding: '8px',
                          borderRadius: '8px',
                          background: statusConfig.rejected.bg,
                          minHeight: '120px'
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig.rejected.color, marginBottom: '6px' }}>
                            REJECTED
                          </div>
                          <Row gutter={[4, 4]}>
                            {[
                              { label: '0D', value: roleData.Rejected?.['0D'] || 0, span: 4 },
                              { label: '1D', value: roleData.Rejected?.['1D'] || 0, span: 4 },
                              { label: '2-3D', value: roleData.Rejected?.['2-3D'] || 0, span: 4 },
                              { label: '>4D', value: roleData.Rejected?.['4D+'] || 0, span: 4 },
                              { label: 'Avg Days', value: Number(roleData.AverageDays?.Rejected || 0).toFixed(1), span: 8 }
                            ].map((item, i) => (
                                <Col span={item.span} key={i}>
                                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.value}</div>
                                  <div style={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }}>{item.label}</div>
                                </Col>
                              ))}
                          </Row>
                        </div>
                      </Col>
                    </Row>
                  </>
                )
              ) : (
                <>
                  <StatusRow status="completed" data={roleData.Completed || {}} average={roleData.AverageDays?.Completed} />
                  <StatusRow status="hold" data={roleData.Hold || {}} average={roleData.AverageDays?.Hold} />
                  <StatusRow status="pending" data={roleData.Pending || {}} average={roleData.AverageDays?.Pending} />
                  <StatusRow status="rejected" data={roleData.Rejected || {}} average={roleData.AverageDays?.Rejected} />
                </>
              )}
              
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', paddingTop: '12px', borderTop: '1px solid #e9ecef' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>REMARKS</div>
                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{item.remarks}</div>
              </div>
            </Card>
          </Col>
            );
          })}
        </Row>
      </div>
    </div>
  )
}

export default PoTat