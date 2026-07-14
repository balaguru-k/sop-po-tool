import React from 'react'
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
    
const PreLoader = () => {
  const greenIcon = <LoadingOutlined className='loading_class' spin />;
  return (
    <Spin indicator={greenIcon} />)
}

export default PreLoader