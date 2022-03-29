import axios from "../API";
export const ApiHelperFunction = async (data) => {
  const { urlPath, method, formData } = data;
  var config = {
    method: `${method}`,
    url: `${urlPath}`,
    // headers: {
    //   "Content-Type": "application/json",
    // },
    data: formData,
  };
  let responseData = "";
  await axios(config)
    .then(function (response) {
      responseData = response;
    })
    .catch(function (error) {
      if (error?.response?.status === 401) {
        // toast.error("Unauthorized");
        clearLocalStorage();
        clearSessionStorage();
        window.location.reload();
      } else {
      // toast.error(error.message);
      }
    });
  return responseData;
};

export const getStorage = (sKey) => 
{
   if(localStorage.getItem("remember_me") === "true"){
      return localStorage.getItem(sKey)
   }else{
      return sessionStorage.getItem(sKey);
   } 
}
 

export const setLocaleStorage = (sKey, data) =>
  localStorage.setItem(sKey, data);

export const removeStorage = (sKey) => localStorage.setItem(sKey);

export const clearLocalStorage = (sKey) => localStorage.removeItem(sKey);

export const setSessionStorage = (sKey, data) =>
  sessionStorage.setItem(sKey, data);

export const clearSessionStorage = (sKey) => sessionStorage.removeItem(sKey);
