import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const ZerodhaManualTrade = () => {
    const [accounts, setAccounts] = useState([]);

    // Symbol Definition State
    const [symbolData, setSymbolData] = useState({
        instrument: 'NIFTY',
        expiry: '',
        strike: '',
        option_type: 'CE',
        lotSize: 25 // Default for Nifty
    });

    const [resolvedSymbol, setResolvedSymbol] = useState('');

    // Order Form State
    const [formData, setFormData] = useState({
        exchange: 'NFO',
        transaction_type: 'BUY',
        order_type: 'MARKET',
        product: 'MIS',
        price: '',
        trigger_price: '',
        validity: 'DAY',
        variety: 'regular',
        tag: 'manual_trade'
    });

    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [isSimulation, setIsSimulation] = useState(false);

    // WebSocket state
    const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected, connecting, connected, reconnecting
    const [orderResults, setOrderResults] = useState([]); // Track order results
    
    // Keyboard shortcuts state
    const [pressedKeys, setPressedKeys] = useState({
        ctrl: false,
        b: false,
        s: false
    });
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const pendingOrdersRef = useRef(new Map()); // Track pending orders by account ID
    const handleWebSocketMessageRef = useRef(null); // Ref to always have latest handler
    const handleLiveLTPUpdateRef = useRef(null); // Ref to always have latest LTP handler
    
    // Live market data state
    const [liveMarketData, setLiveMarketData] = useState({
        CE: { ltp: null, bought_at: null, quantity: 0, pnl: null, pnl_percent: null },
        PE: { ltp: null, bought_at: null, quantity: 0, pnl: null, pnl_percent: null },
        _lastUpdate: Date.now() // Force React to detect changes
    });
    const ceSymbolRef = useRef(null);
    const peSymbolRef = useRef(null);

    // Construct WebSocket URL from base URL
    const getWebSocketUrl = () => {
        if (process.env.REACT_APP_ZERODHA_MANUAL_WS_URL) {
            return process.env.REACT_APP_ZERODHA_MANUAL_WS_URL;
        }
        
        const baseUrl = process.env.REACT_APP_BASE_URL || 'http://127.0.0.1:8000/';
        // Convert http/https to ws/wss and remove trailing slash
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return `${wsProtocol}://${wsHost}/ws/manual-zerodha-trade/`;
    };
    
    const WS_URL = getWebSocketUrl();

    useEffect(() => {
        // Load accounts from localStorage
        try {
            const storedFunds = localStorage.getItem('zerodha-funds');
            if (storedFunds) {
                const parsed = JSON.parse(storedFunds);
                if (Array.isArray(parsed)) {
                    setAccounts(parsed);
                }
            }
        } catch (error) {
            console.error("Error loading accounts:", error);
            toast.error("Failed to load accounts.");
        }
    }, []);

    // Debug: Log state changes
    useEffect(() => {
        console.log("🔄 liveMarketData state updated:", liveMarketData);
    }, [liveMarketData]);

    // Debounce timer ref for symbol resolution
    const resolveSymbolTimeoutRef = useRef(null);
    // Track last resolved values to prevent duplicate calls
    const lastResolvedRef = useRef({ instrument: '', expiry: '', strike: '', option_type: '' });

    // Define subscribeToMarketData first (used by resolveTradingSymbol)
    const subscribeToMarketData = useCallback(async (currentSymbol, instrumentOverride = null, expiryOverride = null, strikeOverride = null) => {
        if (!accounts.length || wsRef.current?.readyState !== WebSocket.OPEN) {
            console.warn("⚠️ Cannot subscribe to market data: accounts or WebSocket not ready");
            return;
        }

        try {
            const account = accounts[0];
            const instrument = instrumentOverride || (symbolData.instrument === 'Nifty Bank' ? 'BANKNIFTY' : symbolData.instrument);
            const expiry = expiryOverride || symbolData.expiry;
            const strike = strikeOverride ? parseFloat(strikeOverride) : parseFloat(symbolData.strike);

            // Get CE symbol
            const cePayload = {
                name: instrument,
                expiry: expiry,
                option_type: 'CE',
                strike: strike
            };
            const ceResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}api/get-tradingsymbol/`, cePayload);
            const ceSymbol = ceResponse.data?.tradingsymbol;

            // Get PE symbol
            const pePayload = {
                name: instrument,
                expiry: expiry,
                option_type: 'PE',
                strike: strike
            };
            const peResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}api/get-tradingsymbol/`, pePayload);
            const peSymbol = peResponse.data?.tradingsymbol;

            if (ceSymbol || peSymbol) {
                ceSymbolRef.current = ceSymbol;
                peSymbolRef.current = peSymbol;

                // Send subscription message
                const subscribeMessage = {
                    type: 'subscribe_market_data',
                    api_key: account.api_key,
                    access_token: account.zerodha_token,
                    ce_symbol: ceSymbol || null,
                    pe_symbol: peSymbol || null
                };

                wsRef.current.send(JSON.stringify(subscribeMessage));
                console.log("📡 Subscribed to market data:", subscribeMessage);
            }
        } catch (error) {
            console.error("Error subscribing to market data:", error);
        }
    }, [accounts, symbolData.instrument, symbolData.expiry, symbolData.strike]);

    // Define resolveTradingSymbol before useEffect that uses it
    const resolveTradingSymbol = useCallback(async () => {
        // Validate inputs before making API call
        const instrument = symbolData.instrument;
        const expiry = symbolData.expiry;
        const strike = symbolData.strike;
        const option_type = symbolData.option_type;
        
        if (!instrument || !expiry || !strike || !option_type) {
            console.warn("⚠️ Cannot resolve symbol: missing required fields", { instrument, expiry, strike, option_type });
            return;
        }

        try {
            const payload = {
                name: instrument === 'Nifty Bank' ? 'BANKNIFTY' : instrument,
                expiry: expiry,
                option_type: option_type,
                strike: parseFloat(strike)
            };

            console.log("📡 Calling /api/get-tradingsymbol/ with payload:", payload);
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}api/get-tradingsymbol/`, payload);
            console.log("✅ Symbol resolution response:", response.data);

            if (response.data && response.data.tradingsymbol) {
                setResolvedSymbol(response.data.tradingsymbol);
                
                // Subscribe to market data for both CE and PE
                // Use current symbolData values for subscription
                subscribeToMarketData(response.data.tradingsymbol, instrument, expiry, strike);
            } else {
                console.warn("⚠️ No tradingsymbol in response:", response.data);
                setResolvedSymbol('');
            }
        } catch (error) {
            console.error("❌ Symbol resolution failed:", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            setResolvedSymbol('');
        }
    }, [symbolData.instrument, symbolData.expiry, symbolData.strike, symbolData.option_type, subscribeToMarketData]);

    // Auto-resolve symbol when dependent fields change
    useEffect(() => {
        // Clear any pending timeout
        if (resolveSymbolTimeoutRef.current) {
            clearTimeout(resolveSymbolTimeoutRef.current);
            resolveSymbolTimeoutRef.current = null;
        }

        // Check if all required fields are present
        const hasAllFields = symbolData.instrument && symbolData.expiry && symbolData.strike && symbolData.option_type;
        
        // Check if values actually changed
        const valuesChanged = 
            lastResolvedRef.current.instrument !== symbolData.instrument ||
            lastResolvedRef.current.expiry !== symbolData.expiry ||
            lastResolvedRef.current.strike !== symbolData.strike ||
            lastResolvedRef.current.option_type !== symbolData.option_type;
        
        if (hasAllFields && valuesChanged) {
            // Debounce the API call to avoid too many requests
            console.log("🔄 Symbol data changed, scheduling resolution:", symbolData);
            console.log("📊 Previous values:", lastResolvedRef.current);
            
            resolveSymbolTimeoutRef.current = setTimeout(() => {
                // Double-check values haven't changed during debounce
                const currentValues = {
                    instrument: symbolData.instrument,
                    expiry: symbolData.expiry,
                    strike: symbolData.strike,
                    option_type: symbolData.option_type
                };
                
                // Update last resolved values
                lastResolvedRef.current = { ...currentValues };
                
                console.log("📡 Calling resolveTradingSymbol with:", currentValues);
                resolveTradingSymbol();
            }, 300); // 300ms debounce
        } else if (!hasAllFields) {
            // Reset immediately if fields are incomplete
            console.log("⚠️ Incomplete symbol data, resetting");
            setResolvedSymbol('');
            setLiveMarketData({
                CE: { ltp: null, bought_at: null, quantity: 0, pnl: null, pnl_percent: null },
                PE: { ltp: null, bought_at: null, quantity: 0, pnl: null, pnl_percent: null },
                _lastUpdate: Date.now()
            });
            // Reset last resolved values
            lastResolvedRef.current = { instrument: '', expiry: '', strike: '', option_type: '' };
        } else {
            console.log("ℹ️ Symbol data unchanged, skipping API call");
        }

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (resolveSymbolTimeoutRef.current) {
                clearTimeout(resolveSymbolTimeoutRef.current);
                resolveSymbolTimeoutRef.current = null;
            }
        };
    }, [symbolData.instrument, symbolData.expiry, symbolData.strike, symbolData.option_type, resolveTradingSymbol]);

    // WebSocket connection management
    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("✅ WebSocket already connected");
            return;
        }

        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log("⏳ WebSocket connection in progress...");
            return;
        }

        console.log("🔌 Connecting to WebSocket:", WS_URL);
        setWsStatus('connecting');

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("✅ WebSocket connected");
                setWsStatus('connected');
                reconnectAttemptsRef.current = 0;
                
                // Send ping to keep connection alive
                const pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    } else {
                        clearInterval(pingInterval);
                    }
                }, 30000); // Ping every 30 seconds
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Use ref to always call the latest version of handleWebSocketMessage
                    if (handleWebSocketMessageRef.current) {
                        handleWebSocketMessageRef.current(data);
                    }
                } catch (error) {
                    console.error("❌ Error parsing WebSocket message:", error);
                }
            };

            ws.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                setWsStatus('disconnected');
            };

            ws.onclose = (event) => {
                console.warn(`🔌 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
                setWsStatus('disconnected');
                
                // Attempt reconnection if not intentional close
                if (event.code !== 1000 && reconnectAttemptsRef.current < 5) {
                    reconnectAttemptsRef.current += 1;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/5)`);
                    setWsStatus('reconnecting');
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                }
            };
        } catch (error) {
            console.error("❌ WebSocket connection error:", error);
            setWsStatus('disconnected');
            toast.error("Failed to connect to WebSocket");
        }
    }, [WS_URL]);

    const handleLiveLTPUpdate = useCallback((data) => {
        console.log("🔄 handleLiveLTPUpdate called with:", data);
        const { option_type, ltp, bought_at, quantity, pnl, pnl_percent } = data;
        
        if (!option_type || (option_type !== 'CE' && option_type !== 'PE')) {
            console.warn("⚠️ Invalid option_type:", option_type);
            return;
        }
        
        // Use functional update to ensure we have the latest state
        setLiveMarketData(prev => {
            // Get current values for the option type being updated
            const currentData = prev[option_type] || {
                ltp: null,
                bought_at: null,
                quantity: 0,
                pnl: null,
                pnl_percent: null
            };
            
            // Create updated data - always use new values if provided, otherwise keep current
            const updatedOptionData = {
                ltp: (ltp !== null && ltp !== undefined) ? Number(ltp) : currentData.ltp,
                bought_at: (bought_at !== null && bought_at !== undefined) ? Number(bought_at) : currentData.bought_at,
                quantity: (quantity !== null && quantity !== undefined) ? Number(quantity) : currentData.quantity,
                pnl: (pnl !== null && pnl !== undefined) ? Number(pnl) : currentData.pnl,
                pnl_percent: (pnl_percent !== null && pnl_percent !== undefined) ? Number(pnl_percent) : currentData.pnl_percent
            };
            
            // Always create a completely new state object with a new timestamp
            const newState = {
                CE: option_type === 'CE' ? updatedOptionData : { ...prev.CE },
                PE: option_type === 'PE' ? updatedOptionData : { ...prev.PE },
                _lastUpdate: Date.now() // Always change this to force React re-render
            };
            
            console.log("📊 Updated market data state:", JSON.stringify(newState, null, 2));
            console.log("📊 Previous state was:", JSON.stringify(prev, null, 2));
            console.log("📊 Option type:", option_type, "LTP:", ltp);
            console.log("📊 State changed:", JSON.stringify(newState) !== JSON.stringify(prev));
            
            return newState;
        });
    }, []);
    
    // Update ref whenever handleLiveLTPUpdate changes
    useEffect(() => {
        handleLiveLTPUpdateRef.current = handleLiveLTPUpdate;
    }, [handleLiveLTPUpdate]);

    // Update ref whenever handleWebSocketMessage changes
    useEffect(() => {
        handleWebSocketMessageRef.current = (data) => {
            console.log("📩 WebSocket message received:", data);

            switch (data.type) {
                case 'connection':
                    if (data.status === 'connected') {
                        toast.success("WebSocket connected successfully");
                    }
                    break;

                case 'order_status':
                    if (data.status === 'processing') {
                        toast.info(data.message || "Processing order...");
                    }
                    break;

                case 'order_result':
                    handleOrderResult(data);
                    // Update bought_at when order is placed successfully
                    if (data.status === 'success' && data.average_price) {
                        const optionType = data.tradingsymbol?.includes('CE') ? 'CE' : 
                                         data.tradingsymbol?.includes('PE') ? 'PE' : null;
                        if (optionType && data.transaction_type === 'BUY') {
                            setLiveMarketData(prev => ({
                                ...prev,
                                [optionType]: {
                                    ...prev[optionType],
                                    bought_at: data.average_price,
                                    quantity: prev[optionType].quantity + (data.quantity || 0)
                                }
                            }));
                        }
                    }
                    break;

                case 'live_ltp':
                    // Handle live LTP updates
                    console.log("📈 Processing live_ltp message:", data);
                    if (handleLiveLTPUpdateRef.current) {
                        handleLiveLTPUpdateRef.current(data);
                    } else {
                        console.error("⚠️ handleLiveLTPUpdateRef.current is null!");
                    }
                    break;

                case 'market_data_subscribed':
                    toast.success(data.message || "Subscribed to market data");
                    break;

                case 'error':
                    toast.error(data.message || "An error occurred");
                    setLoading(false);
                    break;

                case 'pong':
                    // Heartbeat response, no action needed
                    break;

                default:
                    console.log("Unknown message type:", data.type);
            }
        };
    }, [handleLiveLTPUpdate]);

    const handleOrderResult = (result) => {
        const { status, order_id, tradingsymbol, transaction_type, quantity, average_price, order_status, message, error } = result;

        // Find the account that this order belongs to
        const accountId = Array.from(pendingOrdersRef.current.keys()).find(id => {
            const order = pendingOrdersRef.current.get(id);
            return order && order.tradingsymbol === tradingsymbol;
        });

        if (accountId) {
            pendingOrdersRef.current.delete(accountId);
        }

        // Update order results
        setOrderResults(prev => [...prev, {
            accountId: accountId || 'unknown',
            status,
            order_id,
            tradingsymbol,
            transaction_type,
            quantity,
            average_price,
            order_status,
            message,
            error,
            timestamp: new Date().toISOString()
        }]);

        if (status === 'success') {
            toast.success(
                `✅ Order ${order_id} placed successfully! ${tradingsymbol} ${transaction_type} ${quantity} @ ₹${average_price}`
            );
        } else if (status === 'failed') {
            toast.error(`❌ Order failed: ${error || message}`);
        } else {
            toast.info(`⏳ Order ${order_id} is pending: ${order_status}`);
        }

        // Check if all orders are complete
        if (pendingOrdersRef.current.size === 0) {
            setLoading(false);
        }
    };

    // Connect WebSocket on mount
    useEffect(() => {
        connectWebSocket();

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounting");
            }
        };
    }, [connectWebSocket]);

    const handleSymbolChange = (e) => {
        const { name, value } = e.target;
        setSymbolData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const fetchLTP = useCallback(async (symbol) => {
        if (!accounts.length) return null;
        const account = accounts[0];
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}api/get-quote/`,
                {
                    api_key: account.api_key,
                    access_token: account.zerodha_token,
                    instrument_key: `${formData.exchange}:${symbol}`
                }
            );

            if (response.data && response.data.last_price) {
                return response.data.last_price;
            }
        } catch (error) {
            console.error("Error fetching LTP:", error);
            return null;
        }
        return null;
    }, [accounts, formData.exchange]);

    // Extracted order placement logic - reusable for both quick buttons and form submit
    const placeOrderForTransactionType = useCallback(async (transactionType) => {
        if (accounts.length === 0) {
            toast.error("No active accounts found.");
            return;
        }

        if (!resolvedSymbol) {
            toast.error("Trading Symbol not resolved. Check Expiry/Strike.");
            return;
        }

        // Check WebSocket connection
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            toast.error("WebSocket not connected. Attempting to reconnect...");
            connectWebSocket();
            // Wait a bit for connection
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (wsRef.current?.readyState !== WebSocket.OPEN) {
                toast.error("Failed to connect. Please try again.");
                return;
            }
        }

        setLoading(true);
        setOrderResults([]);
        pendingOrdersRef.current.clear();

        try {
            // 1. Determine execution price for quantity calculation
            let executionPrice = 0;
            if (formData.order_type === 'LIMIT' || formData.order_type === 'SL') {
                executionPrice = parseFloat(formData.price);
            } else {
                const ltp = await fetchLTP(resolvedSymbol);
                if (!ltp) {
                    toast.error("Could not fetch Market Price for Quantity Calculation.");
                    setLoading(false);
                    return;
                }
                executionPrice = ltp;
            }

            if (!executionPrice || executionPrice <= 0) {
                toast.error("Invalid Price for Quantity Calculation.");
                setLoading(false);
                return;
            }

            // 2. Place orders for ALL accounts via WebSocket
            const orderPromises = accounts.map(async (account) => {
                if (!account.api_key || !account.zerodha_token) {
                    return { status: 'failed', id: account.id, reason: 'Missing Creds' };
                }

                const investable = parseFloat(account.investable_amount) || 0;
                const capitalToUse = investable;

                if (capitalToUse < executionPrice) {
                    return { status: 'skipped', id: account.id, reason: 'Insufficient Funds' };
                }

                const rawQty = capitalToUse / executionPrice;
                const lotSize = parseInt(symbolData.lotSize) || 1;
                const multiplier = Math.floor(rawQty / lotSize);
                const quantity = multiplier * lotSize;

                if (quantity <= 0) {
                    return { status: 'skipped', id: account.id, reason: 'Calc Qty 0' };
                }

                // Prepare order message
                const orderMessage = {
                    type: 'order',
                    api_key: account.api_key,
                    access_token: account.zerodha_token,
                    tradingsymbol: resolvedSymbol,
                    exchange: formData.exchange,
                    transaction_type: transactionType, // Use passed parameter
                    order_type: formData.order_type,
                    quantity: quantity,
                    product: formData.product,
                    validity: formData.validity,
                    variety: formData.variety,
                    tag: formData.tag,
                    is_simulation: isSimulation,
                    total_amount: parseFloat(account.funds) || 0,
                    investable_amount: investable
                };

                if (formData.order_type === 'LIMIT' || formData.order_type === 'SL') {
                    orderMessage.price = formData.price;
                }
                if (formData.order_type === 'SL' || formData.order_type === 'SL-M') {
                    orderMessage.trigger_price = formData.trigger_price;
                }

                // Track pending order
                pendingOrdersRef.current.set(account.id, {
                    tradingsymbol: resolvedSymbol,
                    quantity,
                    transaction_type: transactionType
                });

                // Send via WebSocket
                try {
                    wsRef.current.send(JSON.stringify(orderMessage));
                    console.log(`📤 Order sent for account ${account.id}:`, orderMessage);
                } catch (err) {
                    console.error(`❌ Failed to send order for account ${account.id}:`, err);
                    pendingOrdersRef.current.delete(account.id);
                    return { status: 'failed', id: account.id, reason: err.message };
                }

                return { status: 'sent', id: account.id };
            });

            await Promise.all(orderPromises);

            // Set timeout to stop loading if no response after 30 seconds
            setTimeout(() => {
                if (pendingOrdersRef.current.size > 0) {
                    console.warn("⚠️ Some orders did not receive responses");
                    setLoading(false);
                }
            }, 30000);

        } catch (error) {
            console.error("Global Order Error:", error);
            toast.error("Unexpected error placing orders.");
            setLoading(false);
        }
    }, [accounts, resolvedSymbol, formData, symbolData, isSimulation, connectWebSocket, fetchLTP]);

    // Quick action handlers
    const handleQuickBuy = useCallback(async (e) => {
        e?.preventDefault();
        if (loading || wsStatus !== 'connected' || !resolvedSymbol) {
            return;
        }
        await placeOrderForTransactionType('BUY');
    }, [loading, wsStatus, resolvedSymbol, placeOrderForTransactionType]);

    const handleQuickSell = useCallback(async (e) => {
        e?.preventDefault();
        if (loading || wsStatus !== 'connected' || !resolvedSymbol) {
            return;
        }
        await placeOrderForTransactionType('SELL');
    }, [loading, wsStatus, resolvedSymbol, placeOrderForTransactionType]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
            
            // Update pressed keys state
            if (isCtrl) {
                setPressedKeys(prev => ({ ...prev, ctrl: true }));
            }
            if (e.key.toLowerCase() === 'b') {
                setPressedKeys(prev => ({ ...prev, b: true }));
                if (isCtrl) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("⌨️ Ctrl+B pressed - Quick Buy");
                    handleQuickBuy();
                }
            }
            if (e.key.toLowerCase() === 's') {
                setPressedKeys(prev => ({ ...prev, s: true }));
                if (isCtrl) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("⌨️ Ctrl+S pressed - Quick Sell");
                    handleQuickSell();
                }
            }
        };

        const handleKeyUp = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey;
            
            // Update pressed keys state
            if (!isCtrl) {
                setPressedKeys(prev => ({ ...prev, ctrl: false }));
            }
            if (e.key.toLowerCase() === 'b') {
                setPressedKeys(prev => ({ ...prev, b: false }));
            }
            if (e.key.toLowerCase() === 's') {
                setPressedKeys(prev => ({ ...prev, s: false }));
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleQuickBuy, handleQuickSell]);

    // Form submit handler (uses current formData.transaction_type)
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        await placeOrderForTransactionType(formData.transaction_type);
    };

    const getStatusColor = () => {
        switch (wsStatus) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'reconnecting': return 'bg-orange-500';
            default: return 'bg-red-500';
        }
    };

    const getStatusText = () => {
        switch (wsStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            case 'reconnecting': return 'Reconnecting...';
            default: return 'Disconnected';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 w-full max-w-5xl mx-auto mt-6">
            <ToastContainer />
            
            {/* Header with Connection Status */}
            <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-2xl font-bold text-gray-800">Manual Trade (All Accounts)</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                        <span className="text-sm text-gray-600">{getStatusText()}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isSimulation}
                            onChange={(e) => setIsSimulation(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Hybrid Simulator</span>
                    </label>
                    {wsStatus !== 'connected' && (
                        <button
                            onClick={connectWebSocket}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Reconnect
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- Symbol Definition --- */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Instrument</label>
                        <select
                            name="instrument"
                            value={symbolData.instrument}
                            onChange={handleSymbolChange}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="NIFTY">NIFTY</option>
                            <option value="BANKNIFTY">BANKNIFTY</option>
                            <option value="FINNIFTY">FINNIFTY</option>
                            <option value="MIDCPNIFTY">MIDCPNIFTY</option>
                            <option value="SENSEX">SENSEX</option>
                            <option value="BANKEX">BANKEX</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Expiry</label>
                        <input
                            type="date"
                            name="expiry"
                            value={symbolData.expiry}
                            onChange={handleSymbolChange}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Strike</label>
                        <input
                            type="number"
                            name="strike"
                            value={symbolData.strike}
                            onChange={handleSymbolChange}
                            placeholder="e.g. 24000"
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Type</label>
                        <select
                            name="option_type"
                            value={symbolData.option_type}
                            onChange={handleSymbolChange}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="CE">CE</option>
                            <option value="PE">PE</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Lot Size</label>
                        <input
                            type="number"
                            name="lotSize"
                            value={symbolData.lotSize}
                            onChange={handleSymbolChange}
                            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* --- Resolved Symbol Display with Quick Actions --- */}
                <div className="col-span-1 md:col-span-2">
                    <div className={`p-4 rounded-md border-2 ${resolvedSymbol ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        {resolvedSymbol ? (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="text-center md:text-left">
                                    <span className="text-xl font-bold text-green-700 tracking-wider block">
                                        {resolvedSymbol}
                                    </span>
                                    <span className="text-xs text-gray-600 mt-1">
                                        Ready to trade
                                    </span>
                                </div>
                                
                                {/* Quick Action Buttons */}
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            type="button"
                                            onClick={handleQuickBuy}
                                            disabled={loading || wsStatus !== 'connected' || !resolvedSymbol}
                                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg relative ${
                                                loading || wsStatus !== 'connected' || !resolvedSymbol
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : pressedKeys.ctrl && pressedKeys.b
                                                        ? 'bg-blue-800 ring-4 ring-blue-300 scale-105'
                                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95'
                                            }`}
                                        >
                                            {loading ? '⏳' : '🔼'} QUICK BUY
                                            {(pressedKeys.ctrl && pressedKeys.b) && (
                                                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleQuickSell}
                                            disabled={loading || wsStatus !== 'connected' || !resolvedSymbol}
                                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg relative ${
                                                loading || wsStatus !== 'connected' || !resolvedSymbol
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : pressedKeys.ctrl && pressedKeys.s
                                                        ? 'bg-red-700 ring-4 ring-red-300 scale-105'
                                                        : 'bg-red-500 hover:bg-red-600 hover:shadow-red-300 active:scale-95'
                                            }`}
                                        >
                                            {loading ? '⏳' : '🔽'} QUICK SELL
                                            {(pressedKeys.ctrl && pressedKeys.s) && (
                                                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    {/* Keyboard Shortcuts Indicator */}
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                        <span className="font-semibold">Shortcuts:</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className={`px-2 py-1 bg-gray-200 rounded text-xs font-mono ${
                                                pressedKeys.ctrl ? 'bg-yellow-300 ring-2 ring-yellow-400' : ''
                                            }`}>
                                                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                                            </kbd>
                                            <span>+</span>
                                            <kbd className={`px-2 py-1 bg-gray-200 rounded text-xs font-mono ${
                                                pressedKeys.b ? 'bg-blue-300 ring-2 ring-blue-400' : ''
                                            }`}>
                                                B
                                            </kbd>
                                            <span className="text-blue-600 font-semibold">Buy</span>
                                        </div>
                                        <span className="mx-1">|</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className={`px-2 py-1 bg-gray-200 rounded text-xs font-mono ${
                                                pressedKeys.ctrl ? 'bg-yellow-300 ring-2 ring-yellow-400' : ''
                                            }`}>
                                                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                                            </kbd>
                                            <span>+</span>
                                            <kbd className={`px-2 py-1 bg-gray-200 rounded text-xs font-mono ${
                                                pressedKeys.s ? 'bg-red-300 ring-2 ring-red-400' : ''
                                            }`}>
                                                S
                                            </kbd>
                                            <span className="text-red-600 font-semibold">Sell</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-red-500 italic text-center block">
                                Symbol not resolved. Please check inputs.
                            </span>
                        )}
                    </div>
                </div>

                {/* --- Live Market Data Display --- */}
                {((liveMarketData.CE.ltp !== null && liveMarketData.CE.ltp !== undefined) || 
                  (liveMarketData.PE.ltp !== null && liveMarketData.PE.ltp !== undefined)) && (
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="animate-pulse">📊</span>
                                Live Market Data
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CE Option Data */}
                                {(liveMarketData.CE.ltp !== null && liveMarketData.CE.ltp !== undefined) && (
                                    <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-md">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-bold text-blue-700 uppercase">Call Option (CE)</h4>
                                            <span className="text-xs text-gray-500">{ceSymbolRef.current || 'N/A'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">Live LTP:</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    ₹{liveMarketData.CE.ltp?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            {liveMarketData.CE.bought_at !== null && (
                                                <>
                                                    <div className="flex justify-between items-center border-t pt-2">
                                                        <span className="text-xs text-gray-600">Bought At:</span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            ₹{liveMarketData.CE.bought_at?.toFixed(2) || '0.00'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600">Quantity:</span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {liveMarketData.CE.quantity || 0}
                                                        </span>
                                                    </div>
                                                    {liveMarketData.CE.pnl !== null && (
                                                        <div className={`flex justify-between items-center border-t pt-2 ${
                                                            liveMarketData.CE.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            <span className="text-xs font-semibold">Live PNL:</span>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold">
                                                                    {liveMarketData.CE.pnl >= 0 ? '+' : ''}₹{liveMarketData.CE.pnl?.toFixed(2) || '0.00'}
                                                                </div>
                                                                {liveMarketData.CE.pnl_percent !== null && (
                                                                    <div className="text-xs">
                                                                        ({liveMarketData.CE.pnl_percent >= 0 ? '+' : ''}{liveMarketData.CE.pnl_percent?.toFixed(2) || '0.00'}%)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* PE Option Data */}
                                {(liveMarketData.PE.ltp !== null && liveMarketData.PE.ltp !== undefined) && (
                                    <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-md">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-bold text-red-700 uppercase">Put Option (PE)</h4>
                                            <span className="text-xs text-gray-500">{peSymbolRef.current || 'N/A'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-600">Live LTP:</span>
                                                <span className="text-lg font-bold text-red-600">
                                                    ₹{liveMarketData.PE.ltp?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            {liveMarketData.PE.bought_at !== null && (
                                                <>
                                                    <div className="flex justify-between items-center border-t pt-2">
                                                        <span className="text-xs text-gray-600">Bought At:</span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            ₹{liveMarketData.PE.bought_at?.toFixed(2) || '0.00'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600">Quantity:</span>
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            {liveMarketData.PE.quantity || 0}
                                                        </span>
                                                    </div>
                                                    {liveMarketData.PE.pnl !== null && (
                                                        <div className={`flex justify-between items-center border-t pt-2 ${
                                                            liveMarketData.PE.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            <span className="text-xs font-semibold">Live PNL:</span>
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold">
                                                                    {liveMarketData.PE.pnl >= 0 ? '+' : ''}₹{liveMarketData.PE.pnl?.toFixed(2) || '0.00'}
                                                                </div>
                                                                {liveMarketData.PE.pnl_percent !== null && (
                                                                    <div className="text-xs">
                                                                        ({liveMarketData.PE.pnl_percent >= 0 ? '+' : ''}{liveMarketData.PE.pnl_percent?.toFixed(2) || '0.00'}%)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Left Column - Trade Params */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exchange</label>
                        <select
                            name="exchange"
                            value={formData.exchange}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="NFO">NFO</option>
                            <option value="NSE">NSE</option>
                            <option value="BSE">BSE</option>
                            <option value="MCX">MCX</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Type
                            <span className="text-xs text-gray-500 ml-2">(for advanced form)</span>
                        </label>
                        <div className="flex gap-4">
                            <label className={`flex-1 py-2 text-center rounded cursor-pointer border ${formData.transaction_type === 'BUY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="transaction_type"
                                    value="BUY"
                                    checked={formData.transaction_type === 'BUY'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                BUY
                            </label>
                            <label className={`flex-1 py-2 text-center rounded cursor-pointer border ${formData.transaction_type === 'SELL' ? 'bg-red-500 text-white border-red-500' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="transaction_type"
                                    value="SELL"
                                    checked={formData.transaction_type === 'SELL'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                SELL
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column - Order Params */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                        <select
                            name="order_type"
                            value={formData.order_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="MARKET">MARKET</option>
                            <option value="LIMIT">LIMIT</option>
                            <option value="SL">SL (Stop Loss Limit)</option>
                            <option value="SL-M">SL-M (Stop Loss Market)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                            <select
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="MIS">MIS (Intraday)</option>
                                <option value="NRML">NRML (Overnight)</option>
                                <option value="CNC">CNC (Equity Delivery)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
                            <select
                                name="validity"
                                value={formData.validity}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="DAY">DAY</option>
                                <option value="IOC">IOC</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            disabled={formData.order_type === 'MARKET' || formData.order_type === 'SL-M'}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.order_type === 'MARKET' || formData.order_type === 'SL-M' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder={formData.order_type === 'MARKET' ? 'Market Price' : '0.00'}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Price</label>
                        <input
                            type="number"
                            name="trigger_price"
                            value={formData.trigger_price}
                            onChange={handleChange}
                            disabled={formData.order_type !== 'SL' && formData.order_type !== 'SL-M'}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.order_type !== 'SL' && formData.order_type !== 'SL-M' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Advanced Form Submit Button */}
                <div className="col-span-1 md:col-span-2 mt-4">
                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-500 mb-2 text-center">
                            💡 Tip: Use Quick BUY/SELL buttons above for faster trading, or use this form for advanced options
                        </p>
                        <button
                            type="submit"
                            disabled={loading || !resolvedSymbol || wsStatus !== 'connected'}
                            className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-all shadow-md ${
                                loading || !resolvedSymbol || wsStatus !== 'connected' 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : formData.transaction_type === 'BUY' 
                                        ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-300' 
                                        : 'bg-red-500 hover:bg-red-600 hover:shadow-red-300'
                            }`}
                        >
                            {loading ? 'Placing Orders...' :
                                wsStatus !== 'connected' ? 'WebSocket Not Connected' :
                                !resolvedSymbol ? 'Resolve Symbol First' :
                                    `${formData.transaction_type} ${resolvedSymbol} (Advanced Form)`}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            * Calculating qty based on Real-Time Price (for Market Orders) or Limit Price.
                            <br />
                            * Orders placed via WebSocket for faster execution.
                            {isSimulation && <span className="block mt-1 text-orange-600">⚠️ Hybrid Simulator Mode Enabled</span>}
                        </p>
                    </div>
                </div>
            </form>

            {/* Order Results Display */}
            {orderResults.length > 0 && (
                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Recent Orders</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {orderResults.slice(-10).reverse().map((result, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded border ${
                                    result.status === 'success' ? 'bg-green-50 border-green-200' :
                                    result.status === 'failed' ? 'bg-red-50 border-red-200' :
                                    'bg-yellow-50 border-yellow-200'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-semibold">{result.tradingsymbol}</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                            result.status === 'success' ? 'bg-green-200' :
                                            result.status === 'failed' ? 'bg-red-200' :
                                            'bg-yellow-200'
                                        }`}>
                                            {result.status}
                                        </span>
                                    </div>
                                    <div className="text-right text-sm">
                                        {result.average_price && (
                                            <div>₹{result.average_price}</div>
                                        )}
                                        {result.order_id && (
                                            <div className="text-xs text-gray-500">ID: {result.order_id}</div>
                                        )}
                                    </div>
                                </div>
                                {result.message && (
                                    <div className="text-xs text-gray-600 mt-1">{result.message}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZerodhaManualTrade;
