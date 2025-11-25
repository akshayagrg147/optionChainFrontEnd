import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext();

export const ZerodhaWebSocketProvider = ({ children, tradeData, setTradeData, setRtpValue, setReverseTrade, reverseTrade, rtpValue, spreadSize, setReverseData, setReverseTradeDataTransfer }) => {
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const sendTimeout = useRef(null);
  const [ceData, setCeData] = useState(null);
  const [peData, setPeData] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const lastSentTradesRef = useRef([]); // for checking duplicates
  const sentMessageMapRef = useRef([]); // [{ token, id }]
  const tradeDataRef = useRef(tradeData);

  // keep ref in sync with state 
  useEffect(() => {
    tradeDataRef.current = tradeData;
  }, [tradeData]);
  const socketUrl = process.env.REACT_APP_ZERODHA_WEB_SOCKET_URL;
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

        // ✅ Check for error from Upstox API
        if (data.error) {
          console.warn("❌ WebSocket Error Message:", data.error);

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
        if (data.message == "Order placed successfully...Waiting for square off") {
          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Vigilant" && data.Type === (item.type === "CALL" ? "CE" : "PE")
                ? {
                  ...item,
                  status: "Waiting for Square-Off",
                  buyInLTP: data?.BUY_LTP,
                  pl: data?.pnl_percentage
                }
                : item
            )
          );
        }

        if (data?.locked_LTP) {
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              ltpLocked: data?.locked_LTP,
            }))
          );
        }

        if (data.message === "Token sell") {
          setTradeData((prev) =>
            prev.map((item) => ({
              ...item,
              pl: data?.pnl_percentage
            }))

          );
        }

        if (data.message === "Reverse Order placed successfully...Waiting for square off") {
          console.log(data?.market_value, "data?.market_value");
          setReverseTradeDataTransfer(true)
          setRtpValue(data?.market_value)
          setReverseData(prev =>
            prev.map(item => ({
              ...item,
              status: "Waiting for Square-Off",
              buyInLTP: data?.BUY_LTP,
              ltpLocked: data?.locked_LTP ?? item.ltpLocked,
              pl: data?.pnl_percent ?? item.pl
            }))
          );
        }
        console.log(reverseTrade, "reverseTrade");

        // if (!reverseTrade) {
        if (data.message === "SELL Order placed successfully") {
          setReverseTradeDataTransfer(false)
          setTradeData((prev) =>
            prev.map((item) =>
              item.status === "Waiting for Square-Off"
                ? {
                  ...item,
                  status: "Orders Selled",
                  buyInLTP: data?.SELL_LTP,
                  pl: data?.pnl_percentage
                }
                : item
            )
          );
          setReverseData(prev =>
            prev.map(item => ({
              ...item,
              status: "Sell Orders",
              buyInLTP: data?.SELL_LTP,
              ltpLocked: data?.locked_LTP ?? item.ltpLocked,
              pl: data?.pnl_percentage
            }))
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
        // }
        if (data.message == "Trading completed - No reverse trade") {
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

  const sendActiveTradeMessages = () => {
    console.log(isSocketReady, WebSocket.OPEN, "asd");

    if (!isSocketReady || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("⏳ WebSocket not ready to send data.");
      return;
    }

    const tokenData = JSON.parse(localStorage.getItem("zerodha-funds"));
    const activeTrades = tradeData.filter((trade) => trade.active);
    console.log(activeTrades, "activeTrades");

    // Prevent duplicate sending
    const newTradesToSend = activeTrades.filter(
      (trade) =>
        !lastSentTradesRef.current.some(
          (t) =>
            t.trading_symbol === trade.trading_symbol &&
            t.trading_symbol_2 === trade.trading_symbol_2 &&
            t.reverseTrade === reverseTrade
        )
    );
    console.log(newTradesToSend, "newTradesToSend");

    if (newTradesToSend.length === 0) return;

    // Save last sent
    lastSentTradesRef.current = activeTrades.map(t => ({
      ...t,
      reverseTrade
    }));

    // tokenData.forEach((user) => {
    //   newTradesToSend.forEach((trade) => {
    //     let ceToken = trade.trading_symbol || "";
    //     let peToken = trade.trading_symbol_2 || "";

    //     // ✅ Special case:
    //     // If this trade is CALL but has no trading_symbol_2,
    //     // look in the full tradeData for a matching PUT leg
    //     if (trade.type === "CALL" && !trade.trading_symbol_2) {
    //       const matchingPut = tradeData.find(
    //         (t) =>
    //           t.instrument === trade.instrument &&
    //           t.dateOfContract === trade.dateOfContract &&
    //           t.type === "PUT"
    //       );
    //       if (matchingPut) {
    //         peToken = matchingPut.trading_symbol_2 || matchingPut.trading_symbol || "";
    //       }
    //     }

    //     const message = {
    //       instrument_key: `NSE_INDEX|${trade.instrument === "NIFTY" ? "Nifty 50" : trade.instrument
    //         }`,
    //       expiry_date: trade.dateOfContract || "2025-07-24",
    //       access_token: user.token,
    //       trading_symbol: ceToken,
    //       trading_symbol_2: peToken,
    //       target_market_price_CE: newTradesToSend?.length > 0 ? newTradesToSend[0]?.targetMarketCE : 0,
    //       target_market_price_PE: newTradesToSend?.length > 0 ? newTradesToSend[1]?.targetMarketPE :  0,
    //       step: parseFloat(spreadSize) ?? parseFloat(0.25),
    //       profit_percent: parseFloat(rtpValue) ?? parseFloat(0.5),
    //       // quantity: user?.call_quantity + user?.put_quantity,
    //       total_amount: user?.funds,
    //       quantityCE: user?.call_quantity,
    //       quantityPE: user?.put_quantity,
    //       investable_amount: parseInt(user?.investable_amount),
    //       lot: parseInt(user.call_lot),
    //       reverseTrade: reverseTrade ? "ON" : "OFF",
    //     };

    //     console.log("📤 Sending WebSocket message:", message);

    //     try {
    //       // socketRef.current.send(JSON.stringify(message));
    //       // sentMessageMapRef.current.push({ token: user.token, id: user.id });
    //     } catch (err) {
    //       console.error("❌ Failed to send WebSocket message:", err);
    //       updateFundsStatus(user.id, "Failed");
    //     }
    //   });
    // });
    if (tokenData && tokenData.length > 0) {
      tokenData.forEach((user, index) => {
        // pick the trade based on token index
        const trade = newTradesToSend[index] || newTradesToSend[0]; // fallback to first trade if index > available

        let ceToken = trade.trading_symbol || "";
        let peToken = trade.trading_symbol_2 || "";

        // ✅ Special case for CALL leg without PE
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

        const message = {
          index_name: `${trade.instrument === "NIFTY" ? "NIFTY" : trade.instrument
            }`,
          // expiry_date: trade.dateOfContract || "2025-07-24",
          access_token: user.zerodha_token,
          trading_symbol: ceToken,
          trading_symbol_2: peToken,
          target_market_price_CE: trade?.targetMarketCE || 0,
          target_market_price_PE: newTradesToSend[1]?.targetMarketPE || 0,
          step: parseFloat(spreadSize) ?? 0.25,
          profit_percent: parseFloat(rtpValue) ?? 0.5,
          total_amount: parseFloat(user?.funds),
          quantityCE: user?.call_quantity,
          quantityPE: user?.put_quantity,
          investable_amount: parseFloat(user?.investable_amount),
          api_key: user?.api_key ?? "",
          lot: parseInt(user.call_lot),
          reverseTrade: reverseTrade ? "ON" : "OFF",
        };

        console.log("📤 Sending WebSocket message:", message);

        try {
          socketRef.current.send(JSON.stringify(message));
          sentMessageMapRef.current.push({ token: user.token, id: user.id });
        } catch (err) {
          console.error("❌ Failed to send WebSocket message:", err);
          updateFundsStatus(user.id, "Failed");
        }
      });
    } else {
      console.warn("⚠️ No tokenData found — skipping message send");
    }

  };

  useEffect(() => {
    // reset last sent when reverseTrade changes
    lastSentTradesRef.current = [];
  }, [reverseTrade]);

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
  }, [tradeData, isSocketReady, reverseTrade]);
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
    <WebSocketContext.Provider value={{ ceData, peData }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useZerodhaWebSocket = () => useContext(WebSocketContext);


