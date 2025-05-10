import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Home, Mic, Square, Trash2 } from "lucide-react";

interface VoiceState {
  mode: "manual" | "realtime";
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  response: string;
  audioUrl: string | null;
  isMuted: boolean;
  isPlaying: boolean;
}

interface VADSettings {
  noiseThreshold: {
    low: { label: "Low Sensitivity"; value: -50 };
    medium: { label: "Medium Sensitivity"; value: -35 };
    high: { label: "High Sensitivity"; value: -20 };
  };
  silenceTimeout: {
    short: { label: "Quick Response"; value: 500 };
    medium: { label: "Normal"; value: 1000 };
    long: { label: "Relaxed"; value: 2000 };
  };
}

interface VADState {
  selectedNoiseThreshold: keyof VADSettings["noiseThreshold"];
  selectedSilenceTimeout: keyof VADSettings["silenceTimeout"];
}

interface AudioMessage {
  transcript: string;
  response: string;
  audioData: string; // base64 audio data
  timestamp: Date;
}

interface AudioPlayer {
  [key: string]: string; // timestamp -> audio URL mapping
}

const STORAGE_KEY = "voice-interaction-history";
const SETTINGS_STORAGE_KEY = "voice-settings";

const VAD_SETTINGS: VADSettings = {
  noiseThreshold: {
    low: { label: "Low Sensitivity", value: -50 },
    medium: { label: "Medium Sensitivity", value: -35 },
    high: { label: "High Sensitivity", value: -20 },
  },
  silenceTimeout: {
    short: { label: "Quick Response", value: 500 },
    medium: { label: "Normal", value: 1000 },
    long: { label: "Relaxed", value: 2000 },
  },
};

export default function Voice() {
  const [state, setState] = useState<VoiceState>({
    mode: "manual",
    isRecording: false,
    isProcessing: false,
    transcript: "",
    response: "",
    audioUrl: null,
    isMuted: false,
    isPlaying: false,
  });

  const minRecordingLength = useRef<number>(500); // Minimum 500ms of audio
  const startTime = useRef<number>(0);

  const [currentDb, setCurrentDb] = useState<number>(-100);
  const [vadSettings, setVadSettings] = useState<VADState>({
    selectedNoiseThreshold: "medium",
    selectedSilenceTimeout: "medium",
  });

  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [audioUrls, setAudioUrls] = useState<AudioPlayer>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setVadSettings(settings);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(vadSettings));
  }, [vadSettings]);

  const detectSilence = useCallback(
    (audioData: Float32Array) => {
      const rms = Math.sqrt(
        audioData.reduce((sum, value) => sum + value * value, 0) /
          audioData.length
      );
      const db = 20 * Math.log10(rms);

      // Update current dB level
      setCurrentDb(db);

      const threshold =
        VAD_SETTINGS.noiseThreshold[vadSettings.selectedNoiseThreshold].value;
      return db < threshold;
    },
    [vadSettings]
  );

  const processAudioChunk = useCallback(() => {
    if (!analyserNode.current || state.isMuted || state.isPlaying) return;

    const dataArray = new Float32Array(analyserNode.current.frequencyBinCount);
    analyserNode.current.getFloatTimeDomainData(dataArray);

    const isSilent = detectSilence(dataArray);

    if (!isSilent && !state.isRecording) {
      // Start recording when voice detected
      startRecording();
    } else if (isSilent && state.isRecording) {
      // Schedule stop after silence timeout
      if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, VAD_SETTINGS.silenceTimeout[vadSettings.selectedSilenceTimeout].value);
    }
  }, [
    state.isRecording,
    state.isMuted,
    state.isPlaying,
    vadSettings,
    detectSilence,
  ]);

  // Setup realtime audio processing
  useEffect(() => {
    if (state.mode === "realtime" && !state.isMuted) {
      let animationFrame: number;

      const setupAudioProcessing = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          audioContext.current = new AudioContext();
          analyserNode.current = audioContext.current.createAnalyser();

          const source = audioContext.current.createMediaStreamSource(stream);
          source.connect(analyserNode.current);

          const process = () => {
            processAudioChunk();
            animationFrame = requestAnimationFrame(process);
          };

          process();
        } catch (error) {
          console.error("Error setting up audio processing:", error);
        }
      };

      setupAudioProcessing();

      return () => {
        cancelAnimationFrame(animationFrame);
        if (audioContext.current) {
          audioContext.current.close();
        }
      };
    }
  }, [state.mode, state.isMuted, processAudioChunk]);

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer) => {
    const binary = new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    );
    return window.btoa(binary);
  }, []);

  // Convert base64 to Blob
  const base64toBlob = useCallback((base64: string): Blob => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "audio/wav" });
  }, []);

  // Create Audio URL
  const createAudioUrl = useCallback(
    (audioData: string): string => {
      const blob = base64toBlob(audioData);
      return URL.createObjectURL(blob);
    },
    [base64toBlob]
  );

  // Initialize audio URLs and handle cleanup
  useEffect(() => {
    // Cleanup old URLs
    Object.values(audioUrls).forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error revoking URL:", error);
      }
    });

    // Create new URLs
    const newUrls: AudioPlayer = {};
    messages.forEach((msg) => {
      if (msg.audioData) {
        try {
          const blob = base64toBlob(msg.audioData);
          newUrls[msg.timestamp.getTime()] = URL.createObjectURL(blob);
        } catch (error) {
          console.error("Error creating URL for message:", error);
        }
      }
    });
    setAudioUrls(newUrls);

    // Cleanup on unmount
    return () => {
      Object.values(newUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error cleaning up URL:", error);
        }
      });
    };
  }, [messages, audioUrls, base64toBlob]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((msg: AudioMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (error) {
        console.error("Error loading voice history:", error);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try different audio formats in order of preference
      const mimeTypes = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];

      const supportedType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      console.log("Supported audio formats:", supportedType);
      if (!supportedType) {
        throw new Error(
          `No supported audio format found. Tried: ${mimeTypes.join(", ")}`
        );
      }

      console.log("Using audio format:", supportedType);
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: supportedType,
        bitsPerSecond: 128000,
      });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      // Request data every 250ms for smoother streaming
      mediaRecorder.current.start(250);

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current);
        setState((prev) => ({ ...prev, isProcessing: true }));

        try {
          // Step 1: Convert speech to text
          const formData = new FormData();
          formData.append(
            "file",
            audioBlob,
            `recording.${supportedType.split("/")[1]}`
          );
          formData.append("model", "whisper-large-v3-turbo");

          const transcribeResponse = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
              },
              body: formData,
            }
          );

          if (!transcribeResponse.ok) {
            const error = await transcribeResponse.json();
            throw new Error(
              `Failed to transcribe audio: ${JSON.stringify(error)}`
            );
          }

          const transcribeData = await transcribeResponse.json();
          const transcript = transcribeData.text;

          // Step 2: Process with LLM
          const llmResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant. Provide clear and concise and short responses.",
                  },
                  { role: "user", content: transcript },
                ],
              }),
            }
          );

          if (!llmResponse.ok) {
            const error = await llmResponse.json();
            throw new Error(
              `Failed to get LLM response: ${JSON.stringify(error)}`
            );
          }

          const llmData = await llmResponse.json();
          const response = llmData.choices[0].message.content;
          const availableVoices = ["Arista-PlayAI", "Gail-PlayAI"];

          // Step 3: Convert response to speech
          const ttsResponse = await fetch(
            "https://api.groq.com/openai/v1/audio/speech",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model: "playai-tts",
                input: response,
                voice: availableVoices[0],
              }),
            }
          );

          if (!ttsResponse.ok) {
            const error = await ttsResponse.json();
            throw new Error(
              `Failed to convert text to speech: ${JSON.stringify(error)}`
            );
          }

          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioData = arrayBufferToBase64(audioBuffer);
          const timestamp = new Date();

          // Update state with all results
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
            transcript,
            response,
            audioUrl: null,
          }));

          // Create message and update state
          const newMessage: AudioMessage = {
            transcript,
            response,
            audioData,
            timestamp,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Create and configure audio playback
          const blob = base64toBlob(audioData);
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          // Handle audio playback events
          audio.onplay = () =>
            setState((prev) => ({ ...prev, isPlaying: true }));
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setState((prev) => ({ ...prev, isPlaying: false }));
          };

          // Start playback
          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
            URL.revokeObjectURL(url);
            setState((prev) => ({ ...prev, isPlaying: false }));
          });
        } catch (error) {
          console.error(
            "Processing error:",
            error,
            "\nAudio format used:",
            supportedType
          );
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
          }));
        }
      };

      // Start is now called above with the timeslice parameter
      startTime.current = Date.now();
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error("Recording error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to start recording. Please check your microphone permissions.",
      });
    }
  };

  const stopRecording = () => {
    const recordingDuration = Date.now() - startTime.current;

    if (mediaRecorder.current && state.isRecording) {
      if (recordingDuration >= minRecordingLength.current) {
        console.log("Recording duration:", recordingDuration, "ms");
        mediaRecorder.current.stop();
        mediaRecorder.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      } else {
        // Discard too short recordings
        console.log("Recording too short:", recordingDuration, "ms");
        mediaRecorder.current.stop();
        mediaRecorder.current.stream
          .getTracks()
          .forEach((track) => track.stop());
        audioChunks.current = [];
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
        }));
      }
    }

    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }
  };

  // Cleanup when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
      }
      if (mediaRecorder.current && state.isRecording) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [state.mode]);

  // Prevent recording in manual mode while voice detection is active
  useEffect(() => {
    if (state.mode === "manual") {
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
      if (analyserNode.current) {
        analyserNode.current = null;
      }
    }
  }, [state.mode]);

  return (
    <div className="container mx-auto h-screen p-2">
      <Card className="flex h-[94vh] flex-col relative">
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Voice Interaction</h1>
            <p className="text-sm text-muted-foreground">
              Speak naturally and get voice responses
            </p>
          </div>
          <Link
            to="/"
            className="p-2 rounded-md border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            <Home className="h-5 w-5 text-foreground" />
          </Link>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">You said:</p>
                  <p className="text-sm mt-1">{msg.transcript}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium">Response:</p>
                  <p className="text-sm mt-1">{msg.response}</p>
                  <audio
                    key={msg.timestamp.getTime()}
                    src={audioUrls[msg.timestamp.getTime()]}
                    controls
                    className="mt-2 w-full"
                    onPlay={() =>
                      setState((prev) => ({ ...prev, isPlaying: true }))
                    }
                    onPause={() =>
                      setState((prev) => ({ ...prev, isPlaying: false }))
                    }
                    onEnded={() =>
                      setState((prev) => ({ ...prev, isPlaying: false }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t bg-background p-4">
          <div className="flex items-center justify-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute left-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Voice History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your entire voice interaction
                    history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setMessages([]);
                      toast({
                        title: "History cleared",
                        description:
                          "Your voice interaction history has been cleared.",
                      });
                    }}
                  >
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-col gap-4 w-full max-w-md p-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center relative">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        mode: prev.mode === "manual" ? "realtime" : "manual",
                      }))
                    }
                  >
                    Mode: {state.mode === "manual" ? "Manual" : "Realtime"}
                  </Button>
                  {state.mode === "realtime" && (
                    <Button
                      variant={state.isMuted ? "destructive" : "outline"}
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          isMuted: !prev.isMuted,
                        }))
                      }
                    >
                      {state.isMuted ? "Unmute" : "Mute"}
                    </Button>
                  )}
                </div>

                {state.mode === "realtime" && (
                  <div className="flex flex-col gap-2 bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium">
                      Voice Detection Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Current Level:
                          </p>
                          <p className="text-sm font-mono">
                            {currentDb.toFixed(1)} dB
                          </p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-green-500 transition-all duration-100"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, ((currentDb + 100) / 100) * 100)
                              )}%`,
                              backgroundColor:
                                currentDb <
                                VAD_SETTINGS.noiseThreshold[
                                  vadSettings.selectedNoiseThreshold
                                ].value
                                  ? "rgb(239 68 68)" // red-500
                                  : "rgb(34 197 94)", // green-500
                            }}
                          />
                          {/* Threshold line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
                            style={{
                              left: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((VAD_SETTINGS.noiseThreshold[
                                    vadSettings.selectedNoiseThreshold
                                  ].value +
                                    100) /
                                    100) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-100 dB</span>
                          <span className="border-l h-2"></span>
                          <span>0 dB</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Sensitivity:
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {Object.entries(VAD_SETTINGS.noiseThreshold).map(
                          ([key, { label }]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="sensitivity"
                                checked={
                                  vadSettings.selectedNoiseThreshold === key
                                }
                                onChange={() =>
                                  setVadSettings((prev) => ({
                                    ...prev,
                                    selectedNoiseThreshold:
                                      key as keyof VADSettings["noiseThreshold"],
                                  }))
                                }
                                className="rounded-full"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Silence Timeout:
                      </p>
                      <div className="flex flex-col gap-2">
                        {Object.entries(VAD_SETTINGS.silenceTimeout).map(
                          ([key, { label }]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="silence"
                                checked={
                                  vadSettings.selectedSilenceTimeout === key
                                }
                                onChange={() =>
                                  setVadSettings((prev) => ({
                                    ...prev,
                                    selectedSilenceTimeout:
                                      key as keyof VADSettings["silenceTimeout"],
                                  }))
                                }
                                className="rounded-full"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {state.mode === "realtime" &&
                  state.isRecording &&
                  !state.isMuted && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
              </div>

              <Button
                size="lg"
                variant={state.isRecording ? "destructive" : "default"}
                onClick={state.isRecording ? stopRecording : startRecording}
                disabled={state.isProcessing}
                className="h-16 w-16 rounded-full mx-auto"
              >
                {state.isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
          {state.isProcessing && (
            <div className="text-center mt-2">
              <div className="flex space-x-2 justify-center">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Processing...
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
