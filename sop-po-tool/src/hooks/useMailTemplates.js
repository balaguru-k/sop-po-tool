import { useState, useEffect } from 'react';
import axios from 'axios';
import { BaseUrl } from '../App';

export const useMailTemplates = (shouldFetch = false) => {
  const [mailTemplates, setMailTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMailTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BaseUrl}api/manual-mail`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setMailTemplates(response.data);
    } catch (err) {
      setError(err);
      console.error('Error fetching mail templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchMailTemplates();
    }
  }, [shouldFetch]);

  return { mailTemplates, loading, error, refetch: fetchMailTemplates };
};
