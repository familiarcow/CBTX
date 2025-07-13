import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, CheckCircle2, Clock, Loader2, Copy } from "lucide-react";
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

// Array of stages in order of progression
const STAGES_ORDER = [
  'inbound_observed',
  'inbound_confirmation_counted',
  'inbound_finalised',
  'swap_finalised',
  'outbound_signed'
];

export function Track({ thorchainTxId, swapCountdown }: TrackProps) {
  const [swapStages, setSwapStages] = useState<SwapStageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionTriggeredRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const swapStartTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Fetch node count on component mount
  useEffect(() => {
    const fetchNodeCount = async () => {
      try {
        const response = await fetch("https://midgard.ninerealms.com/v2/network");
        if (!response.ok) {
          throw new Error("Failed to fetch node count");
        }
        const data = await response.json();
        if (data && data.activeNodeCount) {
          setNodeCount(parseInt(data.activeNodeCount, 10));
        }
      } catch (err) {
        console.error("Error fetching node count:", err);
      }
    };
    
    fetchNodeCount();
  }, []);

  // Calculate needed confirmations (2/3 of node count, rounded up)
  const getNeededConfirmations = (): number => {
    if (nodeCount === 0) return 0;
    return Math.ceil((2/3) * nodeCount);
  };

  // Initialize swap start time only once
  useEffect(() => {
    // Only set the start time once when component first mounts
    if (swapStartTimeRef.current === 0 && thorchainTxId) {
      swapStartTimeRef.current = Date.now();
    }
  }, [thorchainTxId]);

  // Handle the timer independently of the main component rerenders
  useEffect(() => {
    // If the component remounts or updates after completion, don't restart the timer
    if (isCompleted || !thorchainTxId) return;
    
    // Don't start timer if swapStartTimeRef is not set
    if (swapStartTimeRef.current === 0) return;
    
    // Clear any existing interval to prevent duplicates
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Create a timer that updates elapsed time every second
    const updateElapsedTime = () => {
      const currentElapsed = Math.floor((Date.now() - swapStartTimeRef.current) / 1000);
      setElapsedTime(currentElapsed);
    };
    
    // Update immediately for the first time
    updateElapsedTime();
    
    // Then set up interval for subsequent updates
    timerIntervalRef.current = setInterval(updateElapsedTime, 1000);
    setTimerStarted(true);
    
    // Clean up on unmount or when swap completes
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [thorchainTxId, isCompleted]);

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

  // Update stage status when changes occur
  const updateStageStatus = (newStages: SwapStageStatus) => {
    let currentStageName: string | null = null;

    // Step 5 - Check outbound_signed first - this is the last stage
    if (newStages.outbound_signed) {
      if (newStages.outbound_signed?.completed === false) {
        currentStageName = 'outbound_signed';
      }
    }

    // Step 4 - Check swap_finalised
    if (newStages.swap_finalised) {
      if (!newStages.outbound_signed && newStages.swap_finalised?.completed === true) {
        currentStageName = 'swap_finalised';
      } else if (newStages.swap_finalised?.completed === false) {
        currentStageName = 'swap_finalised';
      }
    }

    // Step 3 - Check inbound_finalised
    if (newStages.inbound_finalised) {
      if (!newStages.swap_finalised && newStages.inbound_finalised?.completed === true) {
        currentStageName = 'inbound_finalised';
      } else if (newStages.inbound_finalised?.completed === false) {
        currentStageName = 'inbound_finalised';
      }
    }

    // Step 2 - Check inbound_confirmation_counted
    if (newStages.inbound_confirmation_counted) {
      if (!newStages.inbound_finalised && newStages.inbound_confirmation_counted?.completed === true) {
        currentStageName = 'inbound_confirmation_counted';
      } else if (newStages.inbound_confirmation_counted?.completed === false) {
        currentStageName = 'inbound_confirmation_counted';
      }
    }

    // Step 1 - Check inbound_observed first (this is the first stage)
    if (newStages.inbound_observed) {
      if (!newStages.inbound_confirmation_counted && newStages.inbound_observed?.completed === true) {
        currentStageName = 'inbound_observed';
      } else if (newStages.inbound_observed?.completed === false || newStages.inbound_observed?.started === false) {
        currentStageName = 'inbound_observed';
      }
    }

    setCurrentStage(currentStageName);
  };

  // Helper function to check if a stage is completed
  const isStageCompleted = (stageName: string): boolean => {
    if (!swapStages) return false;
    
    switch (stageName) {
      case 'inbound_observed':
        return !!swapStages.inbound_observed?.completed;
      case 'inbound_confirmation_counted':
        return !!swapStages.inbound_confirmation_counted?.completed;
      case 'inbound_finalised':
        return !!swapStages.inbound_finalised?.completed;
      case 'swap_finalised':
        return !!swapStages.swap_finalised?.completed;
      case 'outbound_signed':
        return !!swapStages.outbound_signed?.completed;
      default:
        return false;
    }
  };

  // Fetch swap status from thorchain API with fallback support
  const fetchSwapStatus = async () => {
    if (!thorchainTxId || isCompleted) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let response: Response;
      let data: any;
      
      // Try primary endpoint first (liquify - more frequent updates)
      try {
        response = await fetch(`https://thornode.thorchain.liquify.com/thorchain/tx/stages/${thorchainTxId}`);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`Liquify endpoint failed with status ${response.status}`);
        }
      } catch (err) {
        console.warn("Primary endpoint (liquify) failed, trying fallback:", err);
        
        // Try fallback endpoint (ninerealms - more reliable)
        response = await fetch(`https://thornode.ninerealms.com/thorchain/tx/stages/${thorchainTxId}`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}: Failed to fetch swap status from both endpoints`);
        }
        data = await response.json();
      }
      
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
      
      // Update stage status before updating the stages
      updateStageStatus(validData);
      
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
    
    // Set up interval to fetch every 6.5 seconds
    const intervalId = setInterval(() => {
      fetchSwapStatus();
    }, 6500);
    
    // Clean up interval on unmount or when swap completes
    return () => clearInterval(intervalId);
  }, [thorchainTxId, isCompleted]);

  // Determine current step message based on the available data
  const getCurrentStepMessage = (): string => {
    if (!swapStages) return "Initializing...";
    
    // Check stages in the correct sequence order
    if (swapStages.outbound_signed?.completed === true) {
      return "Swap completed successfully";
    } else if (swapStages.outbound_signed) {
      // Include additional properties if available
      const scheduledHeight = (swapStages.outbound_signed as any)?.scheduled_outbound_height;
      const blocksSince = (swapStages.outbound_signed as any)?.blocks_since_scheduled;
      
      if (scheduledHeight && blocksSince !== undefined) {
        return `Waiting for outbound transaction. (${blocksSince} blocks since scheduled)`;
      }
      return "Swap completed. Processing outbound transaction";
    } else if (swapStages.swap_finalised?.completed === true) {
      return "Swap completed. Preparing outbound transaction";
    } else if (swapStages.swap_finalised) {
      return "Finalizing swap";
    } else if (swapStages.inbound_finalised?.completed === true) {
      return "Inbound finalized. Preparing swap";
    } else if (swapStages.inbound_finalised) {
      return "Finalizing inbound transaction";
    } else if (swapStages.inbound_confirmation_counted?.completed === true) {
      return "Confirmations received. Preparing inbound finalization";
    } else if (swapStages.inbound_confirmation_counted) {
      const remainingSeconds = swapStages.inbound_confirmation_counted.remaining_confirmation_seconds;
      if (remainingSeconds !== undefined && remainingSeconds > 0) {
        return `Waiting for confirmations (${remainingSeconds}s remaining)`;
      }
      return "Counting confirmations";
    } else if (swapStages.inbound_observed?.completed === true) {
      return "Transaction observed. Awaiting confirmations";
    } else if (swapStages.inbound_observed?.started === true) {
      const observationCount = swapStages.inbound_observed.final_count;
      const neededCount = getNeededConfirmations();
      
      if (observationCount !== undefined && neededCount > 0) {
        return `Observing transaction (${observationCount}/${neededCount} confirmations)`;
      }
      return "Observing transaction";
    } else if (swapStages.inbound_observed?.started === false) {
      return "Waiting for transaction to be observed";
    } else {
      return "Initializing swap...";
    }
  };

  // Helper function to get the label for a stage
  const getStageLabel = (stageName: string): string => {
    switch (stageName) {
      case 'inbound_observed':
        return "Inbound Observed";
      case 'inbound_confirmation_counted':
        return "Confirmation Counts";
      case 'inbound_finalised':
        return "Inbound Finalized";
      case 'swap_finalised':
        return "Swap Finalized";
      case 'outbound_signed':
        return "Outbound Signed";
      default:
        return "Processing";
    }
  };

  // Find the current active stage index
  const getActiveStageIndex = (): number => {
    if (!currentStage) return -1;
    return STAGES_ORDER.indexOf(currentStage);
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
                <div className="flex items-center gap-1 text-gray-600 z-10 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Completed in {formatElapsedTime(elapsedTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 z-10 mb-4">
                  <div className="font-mono text-xs bg-gray-100 px-3 py-1.5 rounded-lg truncate max-w-full overflow-hidden">
                    {thorchainTxId}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(thorchainTxId);
                      toast({
                        title: "Copied",
                        description: "Transaction ID copied to clipboard",
                      });
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                    aria-label="Copy transaction ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full z-10 relative"
                >
                  <a 
                    href={`https://thorchain.net/tx/${thorchainTxId}`}
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
                    <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <code className="font-mono text-sm text-gray-800 truncate flex-1 overflow-hidden">
                        {thorchainTxId}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(thorchainTxId);
                          toast({
                            title: "Copied",
                            description: "Transaction ID copied to clipboard",
                          });
                        }}
                        className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                        aria-label="Copy transaction ID"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-600 font-medium">Elapsed Time</span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-800 font-semibold">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>{formatElapsedTime(elapsedTime)}</span>
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
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#F2A900] to-[#F4B721] hover:from-[#F4B721] hover:to-[#F2A900] text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-300"
                        >
                          Track Swap
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </motion.div>
                    </div>
                  </div>

                  {/* Swap Stage Progress */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-medium">Swap Progress</span>
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
                            {/* Only display completed stages */}
                            {STAGES_ORDER.map((stage, index) => {
                              // Only show stages that are completed
                              if (isStageCompleted(stage)) {
                                return (
                                  <SwapStageItem
                                    key={stage}
                                    label={getStageLabel(stage)}
                                    isCompleted={true}
                                    isActive={false}
                                    isStarted={true}
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
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
      <div className="flex items-center gap-2">
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
    </div>
  );
} 