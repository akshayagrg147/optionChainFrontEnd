import React, { createContext, useContext, useState } from "react";

const ManualWebSocketContext = createContext();

export const useManualWebSocketData = () => useContext(ManualWebSocketContext);

export const ManualWebSocketProvider = ({ children }) => {
  const [socketData, setSocketData] = useState(null);

  return (
    <ManualWebSocketContext.Provider value={{ socketData, setSocketData }}>
      {children}
    </ManualWebSocketContext.Provider>
  );
};
