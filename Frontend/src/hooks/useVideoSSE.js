import { useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';

/**
 * Real-time video status updates using Server-Sent Events (SSE)
 * @param {Array} products - Array of product objects from dashboard
 * @param {Function} onStatusUpdate - Callback: (productId, statusData) => void
 * @returns {Object} - { isConnected: boolean, generatingCount: number, disconnect: function }
 */
export function useVideoSSE(products, onStatusUpdate) {
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    // Filter products that are currently generating videos
    const generatingProducts = products.filter(
        p => p.videoStatus === 'generating'
    );

    // Create comma-separated list of product IDs
    const generatingIds = generatingProducts.map(p => p._id).join(',');

    //Connect to SSE endpoint
    const connect = useCallback(() => {
        
        if (!generatingIds) {
            console.log('[SSE] No videos generating, not connecting');
            return;
        }

        
        if (eventSourceRef.current?.readyState === EventSource.OPEN) {
            console.log('[SSE] Already connected');
            return;
        }

        console.log(`[SSE] 🔌 Connecting for ${generatingProducts.length} product(s)...`);

        
        const url = getApiUrl(`/api/products/video-status/stream?productIds=${generatingIds}`);
        const eventSource = new EventSource(url);

        
        eventSource.onopen = () => {
            console.log('[SSE] ✅ Connected to real-time updates');
            reconnectAttemptsRef.current = 0; 
        };

        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[SSE] 📨 Received:', data.type);

                if (data.type === 'status') {
                    // Video status update received
                    console.log(`[SSE] Status update for ${data.products.length} product(s)`);

                    // Update each product's status
                    data.products.forEach(update => {
                        onStatusUpdate(update.productId, {
                            videoStatus: update.videoStatus,
                            videoUrl: update.videoUrl,
                            generatedAt: update.generatedAt
                        });
                    });

                } else if (data.type === 'complete') {
                    
                    console.log('[SSE] ✅ Stream complete:', data.reason);
                    disconnect();

                } else if (data.type === 'connected') {
                    // Initial connection confirmation
                    console.log('[SSE] 🎯 Tracking products:', data.productIds);
                }

            } catch (error) {
                console.error('[SSE] ❌ Parse error:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[SSE] ❌ Connection error:', error);

            eventSource.close();

            const maxAttempts = 5;
            const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

            if (reconnectAttemptsRef.current < maxAttempts && generatingIds) {
                reconnectAttemptsRef.current++;
                console.log(`[SSE] 🔄 Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxAttempts})...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, backoffDelay);
            } else {
                console.log('[SSE] 🛑 Max reconnection attempts reached');
            }
        };

        eventSourceRef.current = eventSource;
    }, [generatingIds, generatingProducts.length, onStatusUpdate]);

    //Disconnect from SSE
    const disconnect = useCallback(() => {
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            console.log('[SSE] 🔌 Disconnecting...');
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    /**
     * Auto-connect when products start generating
     * Auto-disconnect when no products are generating
     */
    useEffect(() => {
        if (generatingIds) {
            connect();
        } else {
            disconnect();
        }

        // Cleanup on component unmount
        return () => {
            disconnect();
        };
    }, [generatingIds, connect, disconnect]);

    return {
        isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
        generatingCount: generatingProducts.length,
        disconnect
    };
}