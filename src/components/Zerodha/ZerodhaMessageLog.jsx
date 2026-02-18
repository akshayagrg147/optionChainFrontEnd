import React, { useEffect, useRef } from 'react';
import { useZerodhaWebSocket } from "../../ZerodhaWebSocketContext";
import { toast } from 'react-toastify';

const ZerodhaMessageLog = () => {
    const { messageHistory, setMessageHistory } = useZerodhaWebSocket();
    const logContainerRef = useRef(null);

    // Auto-scroll to bottom of log
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messageHistory]);
    const getAccountFundsFromStorage = (accountName) => {
        try {
            const stored = localStorage.getItem("zerodha-funds");
            if (!stored) return null;

            const accounts = JSON.parse(stored);

            return accounts.find(
                acc => acc.name?.toLowerCase() === accountName?.toLowerCase()
            );
        } catch (err) {
            console.error("Error reading zerodhaAccounts:", err);
            return null;
        }
    };

    // Helper to format logs for text file
    const formatLogForText = (msg) => {
        const { timestamp, data } = msg;

        if (!data || !data.message) return null;

        const isSell = data.message.includes("SELL");
        const isBuy = data.message.includes("Buy") || data.message.includes("BUY") || data.message.includes('Order placed successfully...Waiting for square off');
        const isReverse = data.message.includes("Reverse");

        if (!isSell && !isBuy && !isReverse) return null;

        const actionText = isSell
            ? "✅ SELL Order Placed"
            : isReverse
                ? "✅ Reverse Buy Order Placed"
                : "✅ Buy Order Placed";

        // ✅ Fetch account fallback data
        const accountData = getAccountFundsFromStorage(data.account_name);
        console.log(accountData, "accountData");

        const totalAmount =
            data.total_amount && data.total_amount !== "N/A"
                ? data.total_amount
                : accountData?.funds || "N/A";

        const investableAmount =
            data.investable_amount && data.investable_amount !== "N/A"
                ? data.investable_amount
                : accountData?.investable_amount || "N/A";

        return `${timestamp},867 | INFO | 
==================== ${data.account_name?.toUpperCase() || "UNKNOWN"} | ${actionText} ====================
Token_Purchase: ${data.token_purchase || data.Token_Purchase || "N/A"}
Trading_Symbol: ${data.trading_symbol || data.Trading_Symbol || "N/A"}
Market Value: ${data.market_value || data.marketValue || "N/A"}
${isSell ? `SELL LTP: ${data.SELL_LTP}` : ""}
${isBuy || isReverse ? `BUY LTP: ${data.BUY_LTP}` : ""}
Quantity: ${data.quantity || data.qty || "N/A"}
Total Amount: ${totalAmount}
Investable Amount: ${investableAmount}
${data.pnl_percentage !== undefined ? `P & L percent: ${data.pnl_percentage}` : ""}
Time: ${timestamp}
------------------------------------------------------------`;
    };



    // Download logs helper
    const downloadLogs = () => {
        if (!messageHistory || messageHistory.length === 0) {
            toast.info("No logs to download");
            return;
        }

        const lines = messageHistory
            .map(formatLogForText)
            .filter(line => line !== null);   // ✅ Only valid order logs

        if (lines.length === 0) {
            toast.info("No Order logs available");
            return;
        }

        const dataStr = lines.join('\n');
        const blob = new Blob([dataStr], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `zerodha_order_logs_${new Date().toISOString()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="mt-6 ml-4 bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Live Trade Data</h3>
                <div className="flex gap-2">
                    <button
                        onClick={downloadLogs}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                    >
                        Download Logs
                    </button>
                    <button
                        onClick={() => setMessageHistory([])}
                        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                        Clear Log
                    </button>
                </div>
            </div>

            <div ref={logContainerRef} className="h-64 overflow-y-auto border rounded bg-gray-50 p-2 font-mono text-xs">
                {messageHistory && messageHistory.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No messages yet...</div>
                ) : (
                    messageHistory && messageHistory.map((msg, idx) => {
                        // Helper to decide content style based on message type
                        const renderContent = (data) => {
                            // 1. Order / Status Messages
                            if (data.message) {
                                return (
                                    <div>
                                        <div className="font-bold text-sm text-gray-800 mb-1">{data.message}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {data.SELL_LTP && <span className="bg-red-100 text-red-800 px-1 rounded">Sell LTP: {data.SELL_LTP}</span>}
                                            {data.BUY_LTP && <span className="bg-green-100 text-green-800 px-1 rounded">Buy LTP: {data.BUY_LTP}</span>}
                                            {data.pnl_percentage && <span className={`px-1 rounded ${data.pnl_percentage >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>PnL: {data.pnl_percentage}%</span>}
                                            {data.account_name && <span className="text-gray-500 bg-gray-200 px-1 rounded">Account: {data.account_name}</span>}
                                        </div>
                                    </div>
                                );
                            }

                            // 2. PnL Updates
                            if (data.pnl_update) {
                                return (
                                    <div>
                                        <div className="font-semibold text-blue-700 mb-1">PnL Update</div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <span>LTP: <span className="font-medium">{data.current_ltp}</span></span>
                                            <span>Spot: <span className="font-medium">{data.spot}</span></span>
                                            <span className={data.pnl_percent >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                PnL: {data.pnl_percent}%
                                            </span>
                                            {data.locked_ltp && <span>Locked: <span className="text-orange-600">{data.locked_ltp}</span></span>}
                                        </div>
                                        {data.account_name && <div className="mt-1 text-gray-400 italic">{data.account_name}</div>}
                                    </div>
                                );
                            }

                            // 3. SL Init
                            if (data.init_SL) {
                                return (
                                    <div>
                                        <div className="font-semibold text-purple-700 mb-1">Trailing SL Initialized</div>
                                        <div>Locked LTP: <span className="font-bold">{data.locked_LTP}</span></div>
                                        <div>Step: {data.step_size}</div>
                                    </div>
                                );
                            }

                            // 4. Market Data (LTP/Quotes)
                            if (data.type && ['BOUGHT_OPTION', 'CE', 'PE', 'SPOT'].includes(data.type)) {
                                const isSpot = data.type === 'SPOT';
                                const isBought = data.type === 'BOUGHT_OPTION';
                                return (
                                    <div>
                                        <div className={`font-semibold mb-1 ${isSpot ? 'text-gray-600' : isBought ? 'text-green-700' : 'text-blue-600'}`}>
                                            {data.type} {data.index_name ? `- ${data.index_name}` : ''}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            <span>LTP: <span className="font-medium">{data.ltp}</span></span>
                                            {data.change !== undefined && (
                                                <span className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    ({data.change.toFixed(2)})
                                                </span>
                                            )}
                                            {!isSpot && data.oi && <span className="text-gray-500">OI: {(data.oi / 100000).toFixed(2)}L</span>}
                                            {data.spot_price && <span className="text-gray-500">Spot: {data.spot_price}</span>}
                                        </div>
                                    </div>
                                );
                            }

                            // 5. Subscription Info
                            if (data.info && data.tokens) {
                                return (
                                    <div>
                                        <div className="font-semibold text-gray-700">{data.info}</div>
                                        <div className="text-xs text-gray-500 mt-1">Tokens: {data.tokens.join(', ')}</div>
                                    </div>
                                )
                            }

                            // Default fallback
                            return <div className="break-all whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</div>;
                        };

                        return (
                            <div key={idx} className={`mb-2 p-2 rounded border-l-4 text-xs ${msg.direction === 'IN' ? 'bg-white border-blue-500 shadow-sm' : 'bg-green-50 border-green-500 shadow-sm'
                                }`}>
                                <div className="flex justify-between text-gray-400 mb-2 border-b pb-1">
                                    <span className={`font-bold uppercase tracking-wider ${msg.direction === 'IN' ? 'text-blue-500' : 'text-green-600'}`}>
                                        {msg.direction === 'IN' ? '⬇️ Received' : '⬆️ Sent'}
                                    </span>
                                    <span>{msg.timestamp}</span>
                                </div>
                                <div className="text-gray-700">
                                    {renderContent(msg.data)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ZerodhaMessageLog;
