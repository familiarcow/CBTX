import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ReactConfetti from "react-confetti";
import { useToast } from "@/hooks/use-toast";

interface TrackProps {
  thorchainTxId: string;
  swapCountdown: number | null;
}

interface SwapStageStatus {
  inbound_observed?: {
    started?: boolean;
    pre_confirmation_count?: number;
    final_count?: number;
    completed?: boolean;
  };
  inbound_confirmation_counted?: {
    remaining_confirmation_seconds?: number;
    completed?: boolean;
  };
  inbound_finalised?: {
    completed?: boolean;
  };
  swap_status?: {
    pending?: boolean;
  };
  swap_finalised?: {
    completed?: boolean;
  };
  outbound_signed?: {
    completed?: boolean;
  };
}

export function Track({ thorchainTxId, swapCountdown }: TrackProps) {
  const [swapStages, setSwapStages] = useState<SwapStageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionTriggeredRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Update container size on resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, []);

  // Start and manage the timer
  useEffect(() => {
    // Start timer when component mounts and we have a txId
    if (thorchainTxId && !timerStarted && !isCompleted) {
      setTimerStarted(true);
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    // Clean up timer when swap completes or component unmounts
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [thorchainTxId, timerStarted, isCompleted]);

  // Stop timer when swap completes
  useEffect(() => {
    if (isCompleted && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isCompleted]);

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format elapsed time in a human-readable format
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  };

  // Handle swap completion effects
  const triggerCompletionEffects = () => {
    if (completionTriggeredRef.current) return;
    
    // Show confetti
    setShowConfetti(true);
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Failed to play completion sound:", err);
      });
    }
    
    // Show toast notification with elapsed time
    toast({
      title: "Swap Complete",
      description: `Your swap has been successfully completed in ${formatElapsedTime(elapsedTime)}!`,
    });
    
    completionTriggeredRef.current = true;
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
      
      const data = await response.json();
      
      // Create a new status object that intelligently handles missing fields
      // If a field doesn't exist in the API response, we'll set it to undefined
      // This way we can safely check if it exists before accessing its properties
      const validData: SwapStageStatus = {};
      
      // Only add stages that exist in the response
      if (data?.inbound_observed) {
        validData.inbound_observed = {
          started: data.inbound_observed.started,
          pre_confirmation_count: data.inbound_observed.pre_confirmation_count ?? 0,
          final_count: data.inbound_observed.final_count ?? 0,
          completed: !!data.inbound_observed.completed
        };
      }
      
      if (data?.inbound_confirmation_counted) {
        validData.inbound_confirmation_counted = {
          remaining_confirmation_seconds: data.inbound_confirmation_counted.remaining_confirmation_seconds ?? 0,
          completed: !!data.inbound_confirmation_counted.completed
        };
      }
      
      if (data?.inbound_finalised) {
        validData.inbound_finalised = {
          completed: !!data.inbound_finalised.completed
        };
      }
      
      if (data?.swap_status) {
        validData.swap_status = {
          pending: !!data.swap_status.pending
        };
      }
      
      if (data?.swap_finalised) {
        validData.swap_finalised = {
          completed: !!data.swap_finalised.completed
        };
      }
      
      if (data?.outbound_signed) {
        validData.outbound_signed = {
          completed: !!data.outbound_signed.completed
        };
      }
      
      // We now set swap stages with our safely constructed object
      setSwapStages(validData);
      
      // Check if the last status in the response is outbound_signed and it's completed
      const isFullyCompleted = data?.outbound_signed?.completed === true;
      
      if (isFullyCompleted) {
        setIsCompleted(true);
        // Trigger completion effects
        triggerCompletionEffects();
      }
    } catch (err) {
      setError((err as Error).message || "Failed to fetch swap status");
      console.error("Error fetching swap status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize audio element
  useEffect(() => {
    // Sound file is in the public/sounds directory
    const soundPath = "/sounds/coin.mp3";  // Public directory is automatically served at root
    
    // Create and set up the audio element
    const audio = new Audio(soundPath);
    audio.addEventListener('error', (e) => {
      console.error(`Audio failed to load from ${soundPath}:`, e);
    });
    
    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

  // Determine current step message based on the available data
  const getCurrentStepMessage = (): string => {
    if (!swapStages) return "Initializing...";
    
    // Check in reverse order to find the last stage that exists in the response
    if (swapStages.outbound_signed?.completed === true) {
      return "Swap completed successfully";
    } else if (swapStages.outbound_signed) {
      return "Swap completed. Signing outbound transaction";
    } else if (swapStages.swap_finalised?.completed === true) {
      return "Swap completed. Preparing outbound transaction";
    } else if (swapStages.swap_finalised) {
      return "Swap in progress";
    } else if (swapStages.inbound_finalised?.completed === true) {
      return "Inbound finalized. Preparing swap";
    } else if (swapStages.inbound_confirmation_counted?.completed === true) {
      return "Confirmations received. Finalizing inbound transaction";
    } else if (swapStages.inbound_observed?.completed === true) {
      return "Transaction observed. Awaiting confirmations";
    } else if (swapStages.inbound_observed?.started === false) {
      return "Waiting for transaction to be observed...";
    } else {
      return "Initializing swap...";
    }
  };

  // Check if swap is fully completed - look directly for outbound_signed.completed
  const isSwapFullyCompleted = swapStages?.outbound_signed?.completed === true;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mt-6 relative"
    >
      <Card className="border border-gray-100 shadow-lg rounded-2xl overflow-hidden bg-white relative z-10">
        <CardHeader>
          <CardTitle>Transaction Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {isSwapFullyCompleted ? (
              <div className="flex flex-col items-center space-y-4 py-4 relative">
                {showConfetti && containerSize.width > 0 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <ReactConfetti
                      width={containerSize.width}
                      height={containerSize.height}
                      recycle={false}
                      numberOfPieces={150}
                      gravity={0.1}
                      colors={['#F2A900', '#0052FF', '#6FCF97', '#BB6BD9', '#F2C94C']}
                      confettiSource={{
                        x: 0,
                        y: 0,
                        w: containerSize.width,
                        h: containerSize.height
                      }}
                    />
                  </div>
                )}
                <div className="bg-green-100 p-3 rounded-full z-10 relative">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 z-10 relative">Swap Completed</h3>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full z-10 relative"
                >
                  <a 
                    href={`https://runescan.io/tx/${thorchainTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#0052FF] to-[#0066FF] hover:from-[#0066FF] hover:to-[#0052FF] text-white font-semibold rounded-xl shadow-md transition-all duration-300"
                  >
                    View
                    <ArrowUpRight className="h-5 w-5" />
                  </a>
                </motion.div>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-600 font-medium">Transaction ID</span>
                    <code className="font-mono text-sm bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 break-all">
                      {thorchainTxId}
                    </code>
                  </div>
                  
                  {swapCountdown !== null && swapCountdown > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-gray-600 font-medium">Estimated Completion</span>
                      <div className="flex items-center gap-2 text-gray-800 font-semibold">
                        <span>{formatTime(swapCountdown)}</span>
                      </div>
                    </div>
                  )}

                  {/* Swap Stage Progress */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">Swap Progress</span>
                      {timerStarted && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatElapsedTime(elapsedTime)}</span>
                        </div>
                      )}
                    </div>
                    
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
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                            <motion.div
                              animate={{ rotate: isCompleted ? 0 : 360 }}
                              transition={{ 
                                repeat: isCompleted ? 0 : Infinity, 
                                duration: 2, 
                                ease: "linear"
                              }}
                              className={isCompleted ? "hidden" : ""}
                            >
                              <Loader2 className="h-4 w-4 text-yellow-500" />
                            </motion.div>
                            <span className="font-medium">{getCurrentStepMessage()}</span>
                          </div>
                          
                          <div className="space-y-3.5">
                            {swapStages.inbound_observed && (
                              <SwapStageItem 
                                label="Inbound Observed" 
                                isCompleted={!!swapStages.inbound_observed.completed}
                                isStarted={swapStages.inbound_observed.started !== false}
                                isActive={!swapStages.inbound_observed.completed && swapStages.inbound_observed.started !== false}
                              />
                            )}
                            {swapStages.inbound_confirmation_counted && (
                              <SwapStageItem 
                                label="Confirmation Counts" 
                                isCompleted={!!swapStages.inbound_confirmation_counted.completed}
                                isActive={!swapStages.inbound_confirmation_counted.completed && swapStages.inbound_observed?.completed === true}
                              />
                            )}
                            {swapStages.inbound_finalised && (
                              <SwapStageItem 
                                label="Inbound Finalized" 
                                isCompleted={!!swapStages.inbound_finalised.completed}
                                isActive={!swapStages.inbound_finalised.completed && swapStages.inbound_confirmation_counted?.completed === true}
                              />
                            )}
                            {swapStages.swap_finalised && (
                              <SwapStageItem 
                                label="Swap Finalized" 
                                isCompleted={!!swapStages.swap_finalised.completed}
                                isActive={!swapStages.swap_finalised.completed && swapStages.inbound_finalised?.completed === true}
                              />
                            )}
                            {swapStages.outbound_signed && (
                              <SwapStageItem 
                                label="Outbound Signed" 
                                isCompleted={!!swapStages.outbound_signed.completed}
                                isActive={!swapStages.outbound_signed.completed && swapStages.swap_finalised?.completed === true}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isSwapFullyCompleted && (
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
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper component for swap stages
function SwapStageItem({ 
  label, 
  isCompleted, 
  isStarted = true, 
  isActive = false 
}: { 
  label: string; 
  isCompleted: boolean; 
  isStarted?: boolean; 
  isActive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${isActive ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{label}</span>
      <div className={`flex items-center ${isCompleted ? 'text-green-500' : isActive ? 'text-yellow-500' : isStarted ? 'text-yellow-400' : 'text-gray-400'}`}>
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              ease: "easeInOut"
            }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-yellow-400 bg-yellow-100"></div>
          </motion.div>
        ) : (
          <div className={`h-4 w-4 rounded-full border-2 ${isStarted ? 'border-yellow-300' : 'border-gray-300'}`}></div>
        )}
      </div>
    </div>
  );
} 