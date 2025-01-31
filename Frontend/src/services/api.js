import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Animal endpoints with updated file handling
export const getAllAnimals = () => api.get("/animals/get/all");
export const getAnimalById = (id) => api.get(`/animals/get/${id}`);

export const addAnimal = (animalData) => {
  const formData = new FormData();

  // Add all regular fields except 'breed'
  Object.keys(animalData).forEach((key) => {
    if (key !== "assets" && key !== "breed") {
      // Removed 'breed'
      if (key === "animalName") {
        formData.append("animalName", animalData[key]);
      } else {
        formData.append(key, animalData[key]);
      }
    }
  });

  // Add files
  if (animalData.assets) {
    animalData.assets.forEach((file) => {
      formData.append("assets", file);
    });
  }

  return api.post("/animals/add-animal", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateAnimal = (id, animalData) => {
  const formData = new FormData();

  // Add all regular fields except 'breed'
  Object.keys(animalData).forEach((key) => {
    if (key !== "assets" && key !== "breed") {
      // Removed 'breed'
      if (key === "animalName") {
        formData.append("animalName", animalData[key]);
      } else {
        formData.append(key, animalData[key]);
      }
    }
  });

  // Add files
  if (animalData.assets) {
    animalData.assets.forEach((file) => {
      formData.append("assets", file);
    });
  }

  return api.patch(`/animals/${id}/update`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteAnimal = (id) => api.delete(`/animals/found/${id}`);

export default api;
