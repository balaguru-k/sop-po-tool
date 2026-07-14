import { Button } from 'antd';
import React, { useState } from 'react';
import CustomModal from './CustomModal';  // Import the CustomModal

const SampleHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="container d-flex justify-content-between">
      <div className="a">
        <h6>Request History</h6>
      </div>
      <div className="b-c d-flex g-3">
        <div className="b">
          <Button>bulk upload</Button>
        </div>
        <div className="c">
          <Button onClick={showModal}>Create Request</Button>
        </div>
      </div>

      {/* Pass modal visibility and handlers as props to CustomModal */}
      <CustomModal 
        isModalOpen={isModalOpen} 
        handleOk={handleOk} 
        handleCancel={handleCancel} 
      />
    </div>
  );
}

export default SampleHeader;
