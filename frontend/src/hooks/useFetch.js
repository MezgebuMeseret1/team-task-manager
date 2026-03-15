import { useState, useEffect, useCallback, useRef } from "react";
import API from "../api/api";

/**
 * useFetch - Custom hook for fetching data from an API safely
 * Prevents double requests in React 18 Strict Mode
 */
const useFetch = (endpoint, options = {}, autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Ref to prevent double fetching in dev
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (overrideOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API({
        url: endpoint,
        ...options,
        ...overrideOptions,
      });
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      fetchData();
      hasFetched.current = true; // ensure only fetch once
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;