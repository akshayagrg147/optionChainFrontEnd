import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const WebSocketContext = createContext();

export const ZerodhaWebSocketProvider = ({ children, tradeData, setTradeData, setRtpValue, setReverseTrade, reverseTrade, rtpValue, spreadSize, setReverseData, reverseTradeDataTransfer, setReverseTradeDataTransfer, isSimulation, setMainData }) => {
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const sendTimeout = useRef(null);
  const [ceData, setCeData] = useState(null);
  const [peData, setPeData] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]); // Store unlimited log history
  const [isSocketReady, setIsSocketReady] = useState(false);
  const lastSentTradesRef = useRef([]); // for checking duplicates
  const sentMessageMapRef = useRef([]); // [{ token, id }]
  const tradeDataRef = useRef(tradeData);
  const reverseTradeDataTransferRef = useRef(reverseTradeDataTransfer);

  // keep ref in sync with state
  useEffect(() => {
    reverseTradeDataTransferRef.current = reverseTradeDataTransfer;
  }, [reverseTradeDataTransfer]);

  // keep ref in sync with state 
  useEffect(() => {
    tradeDataRef.current = tradeData;
  }, [tradeData]);
  const socketUrl = process.env.REACT_APP_ZERODHA_WEB_SOCKET_URL;

  // Helper to log messages
  const logMessage = (direction, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessageHistory((prev) => {
      const newMsg = {
        direction, // 'IN' or 'OUT'
        timestamp,
        type: data.type || (data.message ? 'info' : 'unknown'),
        data,
      };
      // Keep all messages (unlimited as requested)
      return [...prev, newMsg];
    });
  };

  console.log(tradeData, "socketUrl");
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

    // socket.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data);
    //     console.log("📩 WebSocket Data:", data);

    //     // ✅ Check for error from Upstox API
    //     if (data.error) {
    //       console.warn("❌ WebSocket Error Message:", data.error);

    //       // 🔍 Try to extract token or identify which user/token this relates to
    //       const tokenMatch = data.error.match(/access_token=([A-Za-z0-9._-]+)/);
    //       const matchedToken = tokenMatch ? tokenMatch[1] : null;

    //       if (matchedToken) {
    //         const matched = sentMessageMapRef.current.find((entry) => entry.token === matchedToken);
    //         if (matched) {
    //           updateFundsStatus(matched.id, "Failed");
    //         } else {
    //           console.warn("⚠️ Could not find ID for token in sentMessageMapRef");
    //         }
    //       } else {
    //         console.warn("⚠️ Could not extract token from error string.");
    //       }
    //     }

    //     // ✅ Handle success scenario
    //     if (data.message === "Order placed successfully...Waiting for square off") {
    //       setTradeData((prev) =>
    //         prev.map((item) =>
    //           item.status === "Vigilant"
    //             ? {
    //               ...item,
    //               status: "Waiting for Square-Off",
    //               buyInLTP: data?.ltp,
    //               pl: data?.ltp && data?.ltp !== 0
    //                 ? (100 * ((data?.ltp - data?.ltp) / data?.ltp)) // Initially 0% since buy & live are same
    //                 : 0
    //             }
    //             : item
    //         )
    //       );
    //     }
    //     // if (tradeData?.buyInLTP) {
    //     //   setTradeData((prev) =>
    //     //     prev.map((item) => ({
    //     //       ...item,
    //     //       pl: 100 * (data?.ltp - tradeData.buyInLTP) / tradeData.buyInLTP,

    //     //     }))
    //     //   );
    //     // }
    //     if (data?.locked_LTP) {
    //       setTradeData((prev) =>
    //         prev.map((item) => ({
    //           ...item,
    //           ltpLocked: data?.locked_LTP,
    //         }))
    //       );
    //     }
    //     if (data.message === "Token sell") {

    //       setTradeData((prev) =>
    //         prev.map((item) => ({
    //           ...item,
    //           pl: data?.pnl_percent
    //         }))
    //       );
    //     }
    //     if (data.message === " Reverse token ...Order placed successfully...Waiting for square off") {
    //       //  setReverseTrade(true);
    //       console.log(data?.market_value, "data?.market_value");
    //       setRtpValue(data?.market_value)
    //     }

    //     // ✅ Update data states
    //     if (data.type === "CE") setCeData(data);
    //     else if (data.type === "PE") setPeData(data);

    //   } catch (err) {
    //     console.error("❌ Failed to parse socket message:", err, event.data);
    //   }
    // };

    socket.onmessage = (event) => {
      console.log(tradeDataRef.current, "tradeDatatradeData");

      try {
        const data = JSON.parse(event.data);
        console.log("📩 WebSocket Data:", data);
        logMessage('IN', data); // Log incoming message

        // ✅ Check for error from Upstox API
        if (data.error) {
          console.warn("❌ WebSocket Error Message:", data.error);

          if (data.error === "No valid users to process") {
            toast.error(data.error);
            setTradeData((prev) =>
              prev.map((item) => ({
                ...item,
                active: false,
              }))
            );
          }

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
        // ✅ Handle success scenario
        if (data.message == "Order placed successfully...Waiting for square off") {
          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Vigilant" && data.Type === (item.type === "CALL" ? "CE" : "PE")
                ? {
                  ...item,
                  status: "Waiting for Square-Off",
                  buyInLTP: data?.normal_trade_buyLtp,
                  pl: 0 // Initial PnL is 0
                }
                : item
            )
          );
        }

        // Handle Trailing SL Initialization
        if (data.init_SL) {
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              ltpLocked: data?.locked_LTP ?? data?.locked_ltp,
            }))
          );
        }

        // Handle Live P&L and SL Updates
        if (data.pnl_update) {
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              pl: data?.normal_pnl_percentage,
              ltpLocked: data?.locked_ltp ?? data?.locked_LTP ?? item.ltpLocked,
              // Optionally update current LTP if you track it in tradeData
            }))
          );
        }

        // Fallback for just locked_LTP update if not covered by pnl_update (legacy or specific message)
        if (data?.locked_LTP || data?.locked_ltp) {
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              ltpLocked: data?.locked_LTP ?? data?.locked_ltp,
            }))
          );
        }
        if (data.message === "SELL Order placed successfully") {
          // Use Ref to get current value inside closure
          console.log("✅ Routing to Main Data");
          // Main Trade SELL -> Update Main Table ONLY
          // ⚡ USE EXPLICIT MAIN SETTER if available, else fall back to current tradeData setter
          const updateMain = setMainData || setTradeData;

          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Waiting for Square-Off" 
                ? {
                  ...item,
                  status: "Orders Selled",
                  buyInLTP: data?.SELL_LTP,
                  pl: data?.pnl_percentage,
                }
                : item
            )
          );
        }
        // Removed "Token sell" block as it's not sent by backend

        if (data.message === "Reverse Order placed successfully...Waiting for square off") {
          console.log("🔁 Reverse trade started");

          setReverseTradeDataTransfer(true);
          reverseTradeDataTransferRef.current = true; // ⚡ Important

          setReverseData((prev) =>
            prev.map((item) =>
              data.Type === (item.type === "CALL" ? "CE" : "PE")
                ? {
                  ...item,
                  status: "Waiting for Square-Off",
                  buyInLTP: data?.BUY_LTP,
                  ltpLocked: 0,
                  pl: 0,
                }
                : item   // ✅ MUST RETURN item
            )
          );
        }

        console.log(reverseTrade, "reverseTrade");



        if (data.message === "Reverse Trade SELL Order placed successfully") {
          // Use Ref to get current value inside closure
          setReverseData((prev) =>
            prev.map((item) => (
              item.status === "Waiting for Square-Off" ?
              {
                ...item,
                status: "Orders Selled",
                sellLTP: data?.SELL_LTP,   // ✅ Correct field
                pl: data?.pnl_percentage,
              }:item
            ))
          );

          // ✅ Close socket & stop reconnect
          // if (socketRef.current) {
          //   socketRef.current.close();
          //   socketRef.current = null;
          // }
          // if (reconnectTimeout.current) {
          //   clearTimeout(reconnectTimeout.current);
          //   reconnectTimeout.current = null;
          // }
          // setIsSocketReady(false);
        }
        if (data.message == "Trading completed - No reverse trade") {
          // Optional: Update status to 'Completed' or similar if needed
          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Orders Selled"
                ? {
                  ...item,
                  status: "Completed",
                }
                : item
            )
          );

          if (socketRef.current) socketRef.current.close();
          socket.onclose = (event) => {
            console.warn(`🔌 WebSocket closed (code: ${event.code}). Reconnecting...`);
            setIsSocketReady(false);
          };
        }

        // ✅ Update CE / PE data ONLY if strike + type match in tradeData
        const matchedTrade = tradeDataRef.current.find(
          (t) =>
            (t.type === "CALL" && data.type === "CE") ||
            (t.type === "PUT" && data.type === "PE")
        );

        console.log("✅ Updating CE/PE data for:", matchedTrade);

        if (matchedTrade) {
          if (data.type === "CE") setCeData(data);
          else if (data.type === "PE") setPeData(data);

          // example update to tradeData
          setTradeData((prev) =>
            prev.map((item) =>
              item.type === matchedTrade.type
                ? { ...item, ltpLocked: data?.locked_LTP ?? item.ltpLocked }
                : item
            )
          );
        } else {
          console.log("⚠️ Ignored data, no matching strike/type:", data);
        }


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

  // const sendActiveTradeMessages = () => {
  //   if (!isSocketReady || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  //     console.warn("⏳ WebSocket not ready to send data.");
  //     return;
  //   }

  //   const tokenData = JSON.parse(localStorage.getItem("funds")) || [];
  //   const activeTrades = tradeData.filter((trade) => trade.active);
  //   console.log(activeTrades, "tradeData");

  //   // Prevent duplicate sending by comparing last sent trades
  //   const newTradesToSend = tradeData.filter(
  //     (trade) =>
  //       !lastSentTradesRef.current.some(
  //         (t) => t.tradingSymbolCE === trade.tradingSymbolCE && t.tradingSymbolPE === trade.tradingSymbolPE
  //       )
  //   );
  //   console.log(newTradesToSend, "newTradesToSend2");

  //   if (newTradesToSend.length === 0) return;

  //   // Update last sent
  //   lastSentTradesRef.current = activeTrades;

  //   // tokenData.forEach((user) => {
  //   //   newTradesToSend.forEach((trade) => {
  //   //     const message = {
  //   //       instrument_key: trade.instrument || "NSE_INDEX|Nifty 50",
  //   //       expiry_date: trade.dateOfContract || "2025-07-24",
  //   //       access_token: user.token,
  //   //       trading_symbol: trade.tradingSymbolCE || "NIFTY2572425000CE",
  //   //       trading_symbol_2: trade.tradingSymbolPE || "NIFTY2572425000PE",
  //   //       target_market_price_CE: trade.targetMarketCE ?? 0,
  //   //       target_market_price_PE: trade.targetMarketPE ?? 0,
  //   //       step: 0.25,
  //   //       profit_percent: 0.5,
  //   //     };

  //   //     console.log("📤 Sending WebSocket message:", message);
  //   //     socketRef.current.send(JSON.stringify(message));
  //   //   });
  //   // });
  //   tokenData.forEach((user) => {
  //     tradeData.forEach((trade) => {
  //       console.log(newTradesToSend, "newTradesToSend");

  //       const message = {
  //         instrument_key: `NSE_INDEX|${trade.instrument === "NIFTY" ? "Nifty 50" : trade.instrument}`,
  //         expiry_date: trade.dateOfContract || "2025-07-24",
  //         access_token: user.token,
  //         trading_symbol: trade.trading_symbol ? trade.trading_symbol : "",
  //         trading_symbol_2: trade.trading_symbol_2 ? trade.trading_symbol_2 : "",
  //         target_market_price_CE: trade.targetMarketCE ?? 0,
  //         target_market_price_PE: trade.targetMarketPE ?? 0,
  //         step: spreadSize ?? 0.25,
  //         profit_percent:rtpValue ?? 0.5,
  //         quantity: user?.call_quantity + user?.put_quantity,
  //         total_amount: user?.funds,
  //         investable_amount: user?.investable_amount,
  //         lot: user.call_lot,
  //         reverseTrade: reverseTrade ? 'ON' : 'OFF'
  //       };
  //       console.log(message, "message");

  //       try {
  //         console.log("📤 Sending WebSocket message:", message);
  //         // socketRef.current.send(JSON.stringify(message));
  //         sentMessageMapRef.current.push({ token: user.token, id: user.id });
  //       } catch (err) {
  //         console.log(err, 'asd');

  //         // console.error("❌ Failed to send WebSocket message for token:", user.id, err);
  //         updateFundsStatus(user.id, "Failed"); // Update status in localStorage
  //       }
  //     });
  //   });
  // };

  // Connect once on mount

  // const sendActiveTradeMessages = () => {
  //   console.log(isSocketReady, WebSocket.OPEN, "asd");

  //   if (!isSocketReady || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  //     console.warn("⏳ WebSocket not ready to send data.");
  //     return;
  //   }

  //   const tokenData = JSON.parse(localStorage.getItem("zerodha-funds"));
  //   const activeTrades = tradeData.filter((trade) => trade.active);
  //   console.log(activeTrades, "activeTrades");

  //   // Prevent duplicate sending
  //   const newTradesToSend = activeTrades.filter(
  //     (trade) =>
  //       !lastSentTradesRef.current.some(
  //         (t) =>
  //           t.trading_symbol === trade.trading_symbol &&
  //           t.trading_symbol_2 === trade.trading_symbol_2 &&
  //           t.reverseTrade === reverseTrade
  //       )
  //   );
  //   console.log(newTradesToSend, "newTradesToSend");

  //   if (newTradesToSend.length === 0) return;

  //   // Save last sent
  //   lastSentTradesRef.current = activeTrades.map(t => ({
  //     ...t,
  //     reverseTrade
  //   }));


  //   if (tokenData && tokenData.length > 0) {
  //     tokenData.forEach((user, index) => {
  //       // pick the trade based on token index
  //       const trade = newTradesToSend[index] || newTradesToSend[0]; // fallback to first trade if index > available

  //       let ceToken = trade.trading_symbol || "";
  //       let peToken = trade.trading_symbol_2 || "";

  //       // ✅ Special case for CALL leg without PE
  //       if (trade.type === "CALL" && !trade.trading_symbol_2) {
  //         const matchingPut = tradeData.find(
  //           (t) =>
  //             t.instrument === trade.instrument &&
  //             t.dateOfContract === trade.dateOfContract &&
  //             t.type === "PUT"
  //         );
  //         if (matchingPut) {
  //           peToken =
  //             matchingPut.trading_symbol_2 ||
  //             matchingPut.trading_symbol ||
  //             "";
  //         }
  //       }

  //       const message = {
  //         index_name: `${trade.instrument === "NIFTY" ? "NIFTY" : trade.instrument
  //           }`,
  //         // expiry_date: trade.dateOfContract || "2025-07-24",
  //         access_token: user.zerodha_token,
  //         trading_symbol: ceToken,
  //         trading_symbol_2: peToken,
  //         target_market_price_CE: trade?.targetMarketCE ,
  //         target_market_price_PE: trade?.targetMarketPE ,
  //         step: parseFloat(spreadSize) ?? 0.25,
  //         profit_percent: parseFloat(rtpValue) ?? 0.5,
  //         total_amount: parseFloat(user?.funds),
  //         quantityCE: user?.call_quantity,
  //         quantityPE: user?.put_quantity,
  //         investable_amount: parseFloat(user?.investable_amount),
  //         api_key: user?.api_key ?? "",
  //         lot: parseInt(user.call_lot),
  //         reverseTrade: reverseTrade ? "ON" : "OFF",
  //       };

  //       console.log("📤 Sending WebSocket message:", message);

  //       try {
  //         socketRef.current.send(JSON.stringify(message));
  //         sentMessageMapRef.current.push({ token: user.token, id: user.id });
  //       } catch (err) {
  //         console.error("❌ Failed to send WebSocket message:", err);
  //         // updateFundsStatus(user.id, "Failed");
  //       }
  //     });
  //   } else {
  //     console.warn("⚠️ No tokenData found — skipping message send");
  //   }

  // };
  const sendActiveTradeMessages = () => {
    if (
      !isSocketReady ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.warn("⏳ WebSocket not ready to send data.");
      return;
    }

    const tokenData = JSON.parse(localStorage.getItem("zerodha-funds")) || [];
    const activeTrades = tradeData.filter((trade) => trade.active);

    if (!tokenData.length || !activeTrades.length) return;

    // prevent duplicate send
    const newTradesToSend = activeTrades.filter(
      (trade) =>
        !lastSentTradesRef.current.some(
          (t) =>
            t.trading_symbol === trade.trading_symbol &&
            t.trading_symbol_2 === trade.trading_symbol_2 &&
            t.reverseTrade === reverseTrade
        )
    );

    if (!newTradesToSend.length) return;

    // mark as sent
    lastSentTradesRef.current = activeTrades.map((t) => ({
      ...t,
      reverseTrade,
    }));

    const payloadArray = [];

    tokenData.forEach((user, index) => {
      const trade = newTradesToSend[index] || newTradesToSend[0];

      let ceToken = trade.trading_symbol || "";
      let peToken = trade.trading_symbol_2 || "";

      // CALL-only safety
      if (trade.type === "CALL" && !trade.trading_symbol_2) {
        const matchingPut = tradeData.find(
          (t) =>
            t.instrument === trade.instrument &&
            t.dateOfContract === trade.dateOfContract &&
            t.type === "PUT"
        );
        if (matchingPut) {
          peToken =
            matchingPut.trading_symbol_2 ||
            matchingPut.trading_symbol ||
            "";
        }
      }

      payloadArray.push({
        index_name: `${trade.instrument === "NIFTY" ? "NIFTY" : trade.instrument}`,
        // expiry_date: trade.dateOfContract || "2025-07-24",
        access_token: user.zerodha_token,
        trading_symbol: ceToken,
        trading_symbol_2: peToken,
        target_market_price_CE: parseFloat(trade?.targetMarketCE),
        target_market_price_PE: parseFloat(trade?.targetMarketPE),
        step: parseFloat(spreadSize) ?? 0.25,
        profit_percent: parseFloat(rtpValue) ?? 0.5,
        total_amount: parseFloat(user?.funds),
        quantityCE: user?.call_quantity,
        quantityPE: user?.call_quantity,
        investable_amount: parseFloat(user?.investable_amount),
        api_key: user?.api_key ?? "",
        lot: parseInt(user.call_lot),
        reverseTrade: reverseTrade ? "ON" : "OFF",
        is_simulation: isSimulation ? true : false,
      });

      sentMessageMapRef.current.push({
        token: user.zerodha_token,
        id: user.id,
      });
    });



    console.log("📤 Sending WebSocket BULK message:", payloadArray);

    try {
      socketRef.current.send(JSON.stringify(payloadArray));
      logMessage('OUT', payloadArray); // Log outgoing message
    } catch (err) {
      console.error("❌ Failed to send bulk WS message:", err);
    }
  };

  useEffect(() => {
    // reset last sent when reverseTrade changes
    lastSentTradesRef.current = [];
  }, [reverseTrade]);

  useEffect(() => {
    // reset last sent when isSimulation changes
    lastSentTradesRef.current = [];
  }, [isSimulation]);

  // const sendActiveTradeMessages = () => {
  //   if (!isSocketReady || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  //     console.warn("⏳ WebSocket not ready to send data.");
  //     return;
  //   }

  //   const tokenData = JSON.parse(localStorage.getItem("funds")) || [];
  //   const activeTrades = tradeData.filter((trade) => trade.active);

  //   // ✅ Now reverseTrade is stored per trade in lastSentTradesRef
  //   const newTradesToSend = activeTrades.filter(
  //     (trade) =>
  //       !lastSentTradesRef.current.some(
  //         (t) =>
  //           t.trading_symbol === trade.trading_symbol &&
  //           t.trading_symbol_2 === trade.trading_symbol_2 &&
  //           t.reverseTrade === reverseTrade
  //       )
  //   );

  //   if (newTradesToSend.length === 0) return;

  //   // ✅ Save with reverseTrade flag
  //   lastSentTradesRef.current = activeTrades.map(t => ({ ...t, reverseTrade }));

  //   tokenData.forEach((user) => {
  //     newTradesToSend.forEach((trade) => {
  //       const message = {
  //         instrument_key: `NSE_INDEX|${trade.instrument === "NIFTY" ? "Nifty 50" : trade.instrument}`,
  //         expiry_date: trade.dateOfContract || "2025-07-24",
  //         access_token: user.token,
  //         trading_symbol: trade.trading_symbol || "",
  //         trading_symbol_2: trade.trading_symbol_2 || "",
  //         target_market_price_CE: trade.targetMarketCE ?? 0,
  //         target_market_price_PE: trade.targetMarketPE ?? 0,
  //         step: spreadSize ?? 0.25,
  //         profit_percent: rtpValue ?? 0.5,
  //         total_amount: user?.funds,
  //         quantityCE: user?.call_quantity,
  //         quantityPE: user?.put_quantity,
  //         investable_amount: user?.investable_amount,
  //         lot: user.call_lot,
  //         reverseTrade: reverseTrade ? "ON" : "OFF",
  //       };

  //       console.log("📤 Sending WebSocket message:", message);

  //       try {
  //         socketRef.current.send(JSON.stringify(message));
  //         sentMessageMapRef.current.push({ token: user.token, id: user.id });
  //       } catch (err) {
  //         console.error("❌ Failed to send WebSocket message:", err);
  //         updateFundsStatus(user.id, "Failed");
  //       }
  //     });
  //   });
  // };



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

    // ✅ Reset sent history if no trades are active
    if (!tradeData.some((t) => t.active)) {
      lastSentTradesRef.current = [];
    }

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
  }, [tradeData, isSocketReady, reverseTrade, isSimulation]);
  const updateFundsStatus = (id, newStatus) => {
    const funds = JSON.parse(localStorage.getItem("zerodha-funds"));
    const updatedFunds = funds.map((fund) =>
      fund.id === id ? { ...fund, status: newStatus } : fund
    );
    console.log(updatedFunds, "updatedFunds");

    localStorage.setItem("zerodha-funds", JSON.stringify(updatedFunds));
    // This will trigger `storage` event in other tabs
  };

  return (
    <WebSocketContext.Provider value={{ ceData, peData, messageHistory, setMessageHistory }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useZerodhaWebSocket = () => useContext(WebSocketContext);


