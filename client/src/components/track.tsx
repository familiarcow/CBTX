import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface TrackProps {
  thorchainTxId: string;
  swapCountdown: number | null;
}

interface SwapStageStatus {
  inbound_observed: {
    pre_confirmation_count: number;
    final_count: number;
    completed: boolean;
  };
  inbound_confirmation_counted: {
    remaining_confirmation_seconds: number;
    completed: boolean;
  };
  inbound_finalised: {
    completed: boolean;
  };
  swap_status: {
    pending: boolean;
  };
  swap_finalised: {
    completed: boolean;
  };
  outbound_signed: {
    completed: boolean;
  };
}

export function Track({ thorchainTxId, swapCountdown }: TrackProps) {
  const [swapStages, setSwapStages] = useState<SwapStageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch swap status from thorchain API
  const fetchSwapStatus = async () => {
    if (!thorchainTxId || isCompleted) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://thornode.ninerealms.com/thorchain/tx/stages/${thorchainTxId}`);
      
      if (!response.ok) {
        throw new Error(`Status ${response.status}: Failed to fetch swap status`);
      }
      
      const data = await response.json() as SwapStageStatus;
      setSwapStages(data);
      
      // Check if swap is fully completed
      if (data.outbound_signed.completed) {
        setIsCompleted(true);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to fetch swap status");
      console.error("Error fetching swap status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start fetching data and set up refresh interval
  useEffect(() => {
    if (!thorchainTxId) return;
    
    // Fetch immediately on mount
    fetchSwapStatus();
    
    // Set up interval to fetch every 6 seconds
    const intervalId = setInterval(() => {
      fetchSwapStatus();
    }, 6000);
    
    // Clean up interval on unmount or when swap completes
    return () => clearInterval(intervalId);
  }, [thorchainTxId, isCompleted]);

  // Determine current step message
  const getCurrentStepMessage = (): string => {
    if (!swapStages) return "Initializing...";
    
    if (!swapStages.inbound_observed.completed) {
      return "Awaiting Observation";
    } else if (!swapStages.inbound_confirmation_counted.completed) {
      return "Awaiting Confirmation Counts";
    } else if (!swapStages.inbound_finalised.completed) {
      return "Awaiting Swap";
    } else if (!swapStages.swap_finalised.completed) {
      return "Swap in progress";
    } else if (!swapStages.outbound_signed.completed) {
      return "Swap completed. Sending outbound";
    } else {
      return "Swap completed successfully";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      <Card className="border border-gray-100 shadow-lg rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <CardTitle className="text-lg font-semibold text-gray-800">Transaction Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-500 font-medium">Transaction ID</span>
                  <code className="font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 break-all">
                    {thorchainTxId}
                  </code>
                </div>
                
                {swapCountdown !== null && swapCountdown > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-500 font-medium">Estimated Completion</span>
                    <div className="flex items-center gap-2 text-gray-800 font-medium">
                      <span>{formatTime(swapCountdown)}</span>
                    </div>
                  </div>
                )}

                {/* Swap Stage Progress */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="text-sm text-gray-500 font-medium">Swap Progress</span>
                  
                  {isLoading && !swapStages && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F2A900]"></div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="text-red-500 text-sm py-2 px-3 bg-red-50 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  {swapStages && (
                    <>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          {getCurrentStepMessage()}
                        </div>
                        
                        <div className="space-y-3">
                          <SwapStageItem 
                            label="Inbound Observed" 
                            isCompleted={swapStages.inbound_observed.completed} 
                          />
                          <SwapStageItem 
                            label="Confirmation Counts" 
                            isCompleted={swapStages.inbound_confirmation_counted.completed} 
                          />
                          <SwapStageItem 
                            label="Inbound Finalized" 
                            isCompleted={swapStages.inbound_finalised.completed} 
                          />
                          <SwapStageItem 
                            label="Swap Finalized" 
                            isCompleted={swapStages.swap_finalised.completed} 
                          />
                          <SwapStageItem 
                            label="Outbound Signed" 
                            isCompleted={swapStages.outbound_signed.completed} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <a 
                href={`https://track.ninerealms.com/${thorchainTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#F2A900] to-[#F4B721] hover:from-[#F4B721] hover:to-[#F2A900] text-white font-semibold rounded-xl shadow-md transition-all duration-300"
              >
                Track Swap
                <ArrowUpRight className="h-5 w-5" />
              </a>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper component for swap stages
function SwapStageItem({ label, isCompleted }: { label: string; isCompleted: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className={`flex items-center ${isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
        )}
      </div>
    </div>
  );
} 