import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ReactConfetti from "react-confetti";
import { useToast } from "@/hooks/use-toast";

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionTriggeredRef = useRef(false);
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

  // Format countdown time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    
    // Show toast notification
    toast({
      title: "Swap Complete",
      description: "Your swap has been successfully completed!",
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
      
      const data = await response.json() as SwapStageStatus;
      setSwapStages(data);
      
      // Check if swap is fully completed
      if (data.outbound_signed.completed) {
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
    // Try different paths to find the sound file 
    const possiblePaths = [
      "/client/images/coin.mp3",        // Absolute from root
      "client/images/coin.mp3",         // Relative
      "/images/coin.mp3",               // In public folder
      "../images/coin.mp3",             // One level up
      "../client/images/coin.mp3"       // Another possibility  
    ];
    
    // Try to load the audio from different paths
    const audio = new Audio(possiblePaths[0]);
    audio.addEventListener('error', (e) => {
      console.log(`Audio failed to load from ${possiblePaths[0]}:`, e);
      // Could try other paths here if needed
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

  // Check if swap is fully completed
  const isSwapFullyCompleted = swapStages?.outbound_signed.completed === true;

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
                    <span className="text-sm text-gray-600 font-medium">Swap Progress</span>
                    
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