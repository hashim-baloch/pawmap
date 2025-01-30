import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  getAllAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
} from "../services/api";

const AnimalContext = createContext();

export const AnimalProvider = ({ children }) => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnimals = async () => {
    try {
      const response = await getAllAnimals();
      if (response.data && Array.isArray(response.data)) {
        setAnimals(response.data);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const createAnimal = async (animalData) => {
    const response = await addAnimal(animalData);
    setAnimals((prev) => [...prev, response.data]);
    return response.data;
  };

  const modifyAnimal = async (id, updates) => {
    const response = await updateAnimal(id, updates);
    setAnimals((prev) =>
      prev.map((animal) =>
        animal._id === id ? { ...animal, ...response.data } : animal
      )
    );
  };

  const removeAnimal = async (id) => {
    await deleteAnimal(id);
    setAnimals((prev) => prev.filter((animal) => animal._id !== id));
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  return (
    <AnimalContext.Provider
      value={{
        animals,
        loading,
        error,
        fetchAnimals,
        createAnimal,
        updateAnimal: modifyAnimal,
        deleteAnimal: removeAnimal,
      }}
    >
      {children}
    </AnimalContext.Provider>
  );
};

AnimalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export const useAnimals = () => useContext(AnimalContext);
