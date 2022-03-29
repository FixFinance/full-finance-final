import axios from "axios";
import { getStorage } from "../helpers/apiHelper";
export const baseURL = "https://fullfinance.xyz/"; //development

export const imagePath = baseURL;
export const course_storagePath = baseURL + "/storage/";
let axiosInstance = axios.create({
  baseURL,
});
axiosInstance.interceptors.request.use(
  function (config) {
    const token = getStorage("Demo");
    if (token !== null) {
      // config.headers["x-access-token"] = `${token}`;
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  function (err) {
    return Promise.reject(err);
  }
);
export default axiosInstance;
