/* CityCare API Request handler - Backend API config ready */

const CityCareAPI = {
  baseURL: "http://localhost:5000/api", // Base URL template for future integration

  get: async function(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}/${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`API Get call failed: ${e}`);
      return null;
    }
  },

  post: async function(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`API Post call failed: ${e}`);
      return null;
    }
  }
};
