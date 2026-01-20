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
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const pendingOrdersRef = useRef(new Map()); // Track pending orders by account ID

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

    // Auto-resolve symbol when dependent fields change
    useEffect(() => {
        if (symbolData.instrument && symbolData.expiry && symbolData.strike && symbolData.option_type) {
            resolveTradingSymbol();
        }
    }, [symbolData.instrument, symbolData.expiry, symbolData.strike, symbolData.option_type]);

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
                    handleWebSocketMessage(data);
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

    const handleWebSocketMessage = (data) => {
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

    const resolveTradingSymbol = async () => {
        try {
            const payload = {
                name: symbolData.instrument === 'Nifty Bank' ? 'BANKNIFTY' : symbolData.instrument,
                expiry: symbolData.expiry,
                option_type: symbolData.option_type,
                strike: parseFloat(symbolData.strike)
            };

            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}api/get-tradingsymbol/`, payload);

            if (response.data && response.data.tradingsymbol) {
                setResolvedSymbol(response.data.tradingsymbol);
            } else {
                setResolvedSymbol('');
            }
        } catch (error) {
            console.error("Symbol resolution failed:", error);
            setResolvedSymbol('');
        }
    };

    const fetchLTP = async (symbol) => {
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
    };

    // Extracted order placement logic - reusable for both quick buttons and form submit
    const placeOrderForTransactionType = async (transactionType) => {
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
    };

    // Quick action handlers
    const handleQuickBuy = async (e) => {
        e?.preventDefault();
        await placeOrderForTransactionType('BUY');
    };

    const handleQuickSell = async (e) => {
        e?.preventDefault();
        await placeOrderForTransactionType('SELL');
    };

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
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleQuickBuy}
                                        disabled={loading || wsStatus !== 'connected'}
                                        className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                                            loading || wsStatus !== 'connected'
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95'
                                        }`}
                                    >
                                        {loading ? '⏳' : '🔼'} QUICK BUY
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleQuickSell}
                                        disabled={loading || wsStatus !== 'connected'}
                                        className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                                            loading || wsStatus !== 'connected'
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-red-500 hover:bg-red-600 hover:shadow-red-300 active:scale-95'
                                        }`}
                                    >
                                        {loading ? '⏳' : '🔽'} QUICK SELL
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <span className="text-sm text-red-500 italic text-center block">
                                Symbol not resolved. Please check inputs.
                            </span>
                        )}
                    </div>
                </div>

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
