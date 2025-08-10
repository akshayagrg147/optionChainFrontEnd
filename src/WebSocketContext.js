
// import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// const WebSocketContext = createContext();

// export const WebSocketProvider = ({ children, tradeData, setTradeData }) => {
//   const socketRef = useRef(null);
//   const reconnectTimeout = useRef(null);
//   const [ceData, setCeData] = useState(null);
//   const [peData, setPeData] = useState(null);
//   const [activeData, setActiveData] = useState(false);
//   const [changeData,setChangeData] = useState(tradeData)
//   const connectWebSocket = () => {

//     const socketUrl = process.env.REACT_APP_WEB_SOCKET_URL;

//     if (!socketUrl) {
//       console.error("❌ WebSocket URL not defined");
//       return;
//     }

//     console.log("🔗 Connecting to Market WebSocket...");
//     const socket = new WebSocket(socketUrl);
//     socketRef.current = socket;

//     socket.onopen = () => {
//       console.log("✅ WebSocket market connected");

//       // Read and parse all tokens from localStorage
//       const tokenData = JSON.parse(localStorage.getItem("funds")) || [];

//       tokenData.forEach((user) => {
//         changeData.forEach((trade) => {
//           console.log(trade, "tokenData");
//           // if (!trade.active) return;

//           const message = {
//             instrument_key: trade.instrument || "NSE_INDEX|Nifty 50",
//             expiry_date: trade.dateOfContract || "2025-07-24",
//             access_token: user.token,
//             trading_symbol: trade.tradingSymbolCE || "NIFTY2572425000CE",
//             trading_symbol_2: trade.tradingSymbolPE || "NIFTY2572425000PE",
//             target_market_price_CE: trade.targetMarketCE ?? 0,
//             target_market_price_PE: trade.targetMarketPE ?? 0,
//             step: 0.25,
//             profit_percent: 0.5,
//           };


//           console.log("📩 WebSocket message:", message);
//           // socket.send(JSON.stringify(message));
//         });
//       });

//       if (reconnectTimeout.current) {
//         clearTimeout(reconnectTimeout.current);
//         reconnectTimeout.current = null;
//       }
//     };

//     socket.onmessage = (event) => {
//       console.log("📩 Raw WebSocket message:", event.data);
//       try {
//         const data = JSON.parse(event.data);
//         console.log("✅ Parsed data:", data);
//         setTradeData((prevData) =>
//           prevData.map((item) => ({
//             ...item,
//             strike: "Vigilant"
//           }))
//         );
//         if (data.message === "Order placed successfully...Waiting for square off") {
//           console.log("🟢 Updating status to Vigilant");

//           // Update status where it was previously 'Inactive'
//           setTradeData((prevData) =>
//             prevData.map((item) =>
//               item.status === "Vigilant" ? { ...item, status: "Waiting for Square-Off" } : item
//             )
//           );
//         }
//         if (data.type === "CE") setCeData(data);
//         else if (data.type === "PE") setPeData(data);
//       } catch (err) {
//         console.error("❌ JSON parse error:", err);
//       }
//     };

//     socket.onerror = (error) => {
//       console.error("❌ WebSocket error:", error.message || error);
//     };

//     socket.onclose = (event) => {
//       console.warn(`🔌 WebSocket closed (code: ${event.code}). Reconnecting in 5s...`);
//       if (!reconnectTimeout.current) {
//         reconnectTimeout.current = setTimeout(() => {
//           connectWebSocket();
//         }, 5000);
//       }
//     };
//   };

//   useEffect(() => {
//     // Check if any trade is active


//     if (activeData) {
//       setTradeData((prevData) =>
//         prevData.map((item) =>
//           item.status === "Inactive" ? { ...item, status: "Vigilant" } : item
//         )
//       );

//       connectWebSocket();
//     }

//     return () => {
//       if (socketRef.current) socketRef.current.close();
//       if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
//     };
//   }, [activeData]); // ✅ empty dependency array: runs once on mount

//   useEffect(() => {
//     const hasActiveTrade = tradeData.some((trade) => trade.active == true);

//     if (hasActiveTrade) {
//       setActiveData(true)
//       setTradeData((prevData) =>
//         prevData.map((item) =>
//           item.status === "Inactive" ? { ...item, status: "Vigilant" } : item
//         )
//       );
//       setChangeData((prevData) =>
//         prevData.map((item) =>
//           item.status === "Inactive" ? { ...item, status: "Vigilant" } : item
//         )
//       );
//     }
//   }, [tradeData])


//   return (
//     <WebSocketContext.Provider value={{ ceData, peData }}>
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// export const useWebSocket = () => useContext(WebSocketContext);
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, tradeData, setTradeData,setRtpValue,setReverseTrade,reverseTrade }) => {
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const sendTimeout = useRef(null);
  const [ceData, setCeData] = useState(null);
  const [peData, setPeData] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const lastSentTradesRef = useRef([]); // for checking duplicates
  const sentMessageMapRef = useRef([]); // [{ token, id }]

  const socketUrl = process.env.REACT_APP_WEB_SOCKET_URL;

  const connectWebSocket = () => {
    if (!socketUrl) {
      console.error("❌ WebSocket URL not defined");
      return;
    }

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsSocketReady(true);
    };

    // socket.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data);
    //     console.log("📩 WebSocket Data:", data);

    //     if (data.message == "Order placed successfully....Waiting for square off") {
    //       setTradeData((prev) =>
    //         prev.map((item) =>
    //           item.status === "Vigilant" ? { ...item, status: "Waiting for Square-Off" } : item
    //         )
    //       );
    //     }

    //     if (data.type === "CE") setCeData(data);
    //     else if (data.type === "PE") setPeData(data);
    //   } catch (err) {
    //     console.log(err,"asf");

    //     console.error("❌ Failed to parse socket message", err);
    //   }
    // };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WebSocket Data:", data);

        // ✅ Check for error from Upstox API
        if (data.error) {
          console.warn("❌ WebSocket Error Message:", data.error);

          // 🔍 Try to extract token or identify which user/token this relates to
          const tokenMatch = data.error.match(/access_token=([A-Za-z0-9._-]+)/);
          const matchedToken = tokenMatch ? tokenMatch[1] : null;

          if (matchedToken) {
            const matched = sentMessageMapRef.current.find((entry) => entry.token === matchedToken);
            if (matched) {
              updateFundsStatus(matched.id, "Failed");
            } else {
              console.warn("⚠️ Could not find ID for token in sentMessageMapRef");
            }
          } else {
            console.warn("⚠️ Could not extract token from error string.");
          }
        }

        // ✅ Handle success scenario
        if (data.message === "Order placed successfully...Waiting for square off") {
          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Vigilant" ? { ...item, status: "Waiting for Square-Off" } : item
            )
          );
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              ltpLocked: data?.ltp
            }))
          );

        }
        if (data.message === "Token sell") {
          
            setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              pl: data?.pnl_percent
            }))
          );
        }
        if (data.message === " Reverse token ...Order placed successfully...Waiting for square off") {
          //  setReverseTrade(true);
           console.log(data?.market_value,"data?.market_value");
           setRtpValue(data?.market_value)
        }

        // ✅ Update data states
        if (data.type === "CE") setCeData(data);
        else if (data.type === "PE") setPeData(data);

      } catch (err) {
        console.error("❌ Failed to parse socket message:", err, event.data);
      }
    };


    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error.message || error);
    };

    socket.onclose = (event) => {
      console.warn(`🔌 WebSocket closed (code: ${event.code}). Reconnecting...`);
      setIsSocketReady(false);
      reconnectTimeout.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
  };

  const sendActiveTradeMessages = () => {
    if (!isSocketReady || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("⏳ WebSocket not ready to send data.");
      return;
    }

    const tokenData = JSON.parse(localStorage.getItem("funds")) || [];
    const activeTrades = tradeData.filter((trade) => trade.active);

    // Prevent duplicate sending by comparing last sent trades
    const newTradesToSend = activeTrades.filter(
      (trade) =>
        !lastSentTradesRef.current.some(
          (t) => t.tradingSymbolCE === trade.tradingSymbolCE && t.tradingSymbolPE === trade.tradingSymbolPE
        )
    );

    if (newTradesToSend.length === 0) return;

    // Update last sent
    lastSentTradesRef.current = activeTrades;

    // tokenData.forEach((user) => {
    //   newTradesToSend.forEach((trade) => {
    //     const message = {
    //       instrument_key: trade.instrument || "NSE_INDEX|Nifty 50",
    //       expiry_date: trade.dateOfContract || "2025-07-24",
    //       access_token: user.token,
    //       trading_symbol: trade.tradingSymbolCE || "NIFTY2572425000CE",
    //       trading_symbol_2: trade.tradingSymbolPE || "NIFTY2572425000PE",
    //       target_market_price_CE: trade.targetMarketCE ?? 0,
    //       target_market_price_PE: trade.targetMarketPE ?? 0,
    //       step: 0.25,
    //       profit_percent: 0.5,
    //     };

    //     console.log("📤 Sending WebSocket message:", message);
    //     socketRef.current.send(JSON.stringify(message));
    //   });
    // });
    tokenData.forEach((user) => {
      newTradesToSend.forEach((trade) => {
        const message = {
          instrument_key: "NSE_INDEX|Nifty 50",
          expiry_date: trade.dateOfContract || "2025-07-24",
          access_token: user.token,
          trading_symbol: trade.trading_symbol || "NIFTY2572425000CE",
          trading_symbol_2: trade.trading_symbol || "NIFTY2572425000PE",
          target_market_price_CE: trade.targetMarketCE ?? 0,
          target_market_price_PE: trade.targetMarketPE ?? 0,
          step: 0.25,
          profit_percent: 0.5,
          quantity: 75,
          total_amount:10000,
          investable_amount:10000,
          lot:10,
          reverseTrade:reverseTrade ? 'ON' : 'OFF'
        };

        try {
          console.log("📤 Sending WebSocket message:", message);
          socketRef.current.send(JSON.stringify(message));
          sentMessageMapRef.current.push({ token: user.token, id: user.id });
        } catch (err) {
          console.log(err, 'asd');

          // console.error("❌ Failed to send WebSocket message for token:", user.id, err);
          updateFundsStatus(user.id, "Failed"); // Update status in localStorage
        }
      });
    });
  };

  // Connect once on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (sendTimeout.current) clearTimeout(sendTimeout.current);
    };
  }, []);

  // Debounced tradeData watcher
  useEffect(() => {
    if (!isSocketReady) return;

    const hasActive = tradeData.some((t) => t.active && t.status === "Inactive");
    if (hasActive) {
      setTradeData((prev) =>
        prev.map((item) =>
          item.active && item.status === "Inactive"
            ? { ...item, status: "Vigilant" }
            : item
        )
      );
    }

    if (sendTimeout.current) clearTimeout(sendTimeout.current);
    sendTimeout.current = setTimeout(() => {
      sendActiveTradeMessages();
    }, 10); // debounce delay
  }, [tradeData, isSocketReady]);
  const updateFundsStatus = (id, newStatus) => {
    console.log(id, "id");

    const funds = JSON.parse(localStorage.getItem("funds")) || [];
    const updatedFunds = funds.map((fund) =>
      fund.id === id ? { ...fund, status: newStatus } : fund
    );
    console.log(updatedFunds, "updatedFunds"); -

      localStorage.setItem("funds", JSON.stringify(updatedFunds));
    // This will trigger `storage` event in other tabs
  };
  return (
    <WebSocketContext.Provider value={{ ceData, peData }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);


