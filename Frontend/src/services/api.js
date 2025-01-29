import axios from "axios";

const API_BASE_URL = "http://localhost:5003/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const register = (userData) => api.post("/auth/register", userData);
export const login = (credentials) => api.post("/auth/login", credentials);

// Animal endpoints
export const getAllAnimals = () => api.get("/animals/get/all");
export const getAnimalById = (id) => api.get(`/animals/get/${id}`);
export const addAnimal = (animalData) =>
  api.post("/animals/add-animal", animalData);
export const updateAnimal = (id, animalData) =>
  api.patch(`/animals/${id}/update`, animalData);
export const deleteAnimal = (id) => api.delete(`/animals/found/${id}`);

// Image endpoints
export const uploadImage = (animalId, formData) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  return api.post(`/images/${animalId}/upload`, formData, config);
};
export const getImages = (animalId) => api.get(`/images/${animalId}/get-all`);
export const deleteImage = (imageId) => api.delete(`/images/delete/${imageId}`);

export default api;
