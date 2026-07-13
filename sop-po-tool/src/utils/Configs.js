import axios from 'axios';
axios.defaults.timeout = 25000;

let setIsLoading = function (isLoading) {};


export const setLoaderCallback = function (callback) {
  setIsLoading = callback;
};

axios.interceptors.request.use(
  function (config) {
    setIsLoading(true);
    return config;
  },
  function (error) {
    setIsLoading(false);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  function (response) {
    setIsLoading(false);
    return response;
  },
  function (error) {
    setIsLoading(false);
    
    return Promise.reject(error);
  }
);

export default axios;
