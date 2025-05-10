import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
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
import { Home, Mic, Square, Trash2, MessageSquare } from "lucide-react";

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  transcript: string;
  response: string;
  audioUrl: string | null;
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

function logAudioBlobInfo(blob: Blob): void {
  const bytes: number = blob.size;
  const kbps: number = 128; // bitrate in kilobits/sec
  const bytesPerSecond: number = (kbps * 1000) / 8;

  const formatBytes = (b: number): string => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  const estimatedDuration: string = (bytes / bytesPerSecond).toFixed(2);

  console.log("🎙️ Audio input Info:");
  console.log("- Blob size:", formatBytes(bytes));
  console.log("- Estimated duration:", estimatedDuration, "seconds");
}

function logAudioFormatInfo(audioBuffer: ArrayBuffer): void {
  const audioSizeKB = (audioBuffer.byteLength / 1024).toFixed(2);

  console.log("🔊 Speech Data Generated");
  console.log(`Size: ${audioSizeKB} KB`);
}

export default function Voice() {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    transcript: "",
    response: "",
    audioUrl: null,
  });

  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [audioUrls, setAudioUrls] = useState<AudioPlayer>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const availableSTTModels = [
    "whisper-large-v3-turbo",
    "distil-whisper-large-v3-en",
    "whisper-large-v3",
  ];
  const availableLLMModels = [
    "gemma2-9b-it",
    "llama3-8b-8192",
    "llama-3.1-8b-instant",
  ];
  const availableVoices = ["Arista-PlayAI", "Celeste-PlayAI", "Gail-PlayAI"];

  const { toast } = useToast();

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

  // Handle audio URL creation and cleanup
  const getOrCreateAudioUrl = useCallback(
    (message: AudioMessage): string => {
      const timestamp = message.timestamp.getTime().toString();

      if (audioUrls[timestamp]) {
        return audioUrls[timestamp];
      }

      try {
        const blob = base64toBlob(message.audioData);
        const url = URL.createObjectURL(blob);
        setAudioUrls((prev) => ({ ...prev, [timestamp]: url }));
        return url;
      } catch (error) {
        console.error("Error creating audio URL:", error);
        return "";
      }
    },
    [base64toBlob, audioUrls]
  );

  // Cleanup audio URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioUrls).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error revoking URL:", error);
        }
      });
    };
  }, []);

  // Update audio URLs when messages change
  useEffect(() => {
    messages.forEach((msg) => {
      getOrCreateAudioUrl(msg);
    });
  }, [messages, getOrCreateAudioUrl]);

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

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const startRecording = async () => {
    console.log("Starting recording...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try different audio formats in order of preference
      const mimeTypes = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];

      const supportedType = mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      if (!supportedType) {
        throw new Error(
          `No supported audio format found. Tried: ${mimeTypes.join(", ")}`
        );
      }
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
        console.log("Audio recording stopped. Processing...");
        logAudioBlobInfo(audioBlob);

        try {
          // Step 1: Convert speech to text - STT
          const formData = new FormData();
          formData.append(
            "file",
            audioBlob,
            `recording.${supportedType.split("/")[1]}`
          );
          formData.append("model", availableSTTModels[1]);

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
          console.log("Transcription result:", transcript);

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
                model: availableLLMModels[1],
                temperature: 0.7,
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a knowledgeable and helpful medical assistant called 'Vigil AI'. Provide accurate, helpful information while being clear that you are not a replacement for professional medical advice.",
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
          console.log(
            `🧠 LLM responded in: ${llmData.usage.total_time.toFixed(
              3
            )} seconds`
          );

          // Step 3: Convert response to speech - TTS
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
          logAudioFormatInfo(audioBuffer);

          // Update state with all results
          setState({
            isRecording: false,
            isProcessing: false,
            isPlaying: false,
            transcript,
            response,
            audioUrl: null,
          });

          // Create message and update state
          const newMessage: AudioMessage = {
            transcript,
            response,
            audioData,
            timestamp,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Create temporary URL for immediate playback
          const blob = base64toBlob(audioData);
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);

          // Clean up URL after playback
          audio.onended = () => URL.revokeObjectURL(url);
          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
            URL.revokeObjectURL(url);
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
            isPlaying: false,
          }));
        }
      };

      // Start is now called above with the timeslice parameter
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
    if (mediaRecorder.current && state.isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="container mx-auto h-screen p-2">
      <Card className="flex h-[96vh] flex-col relative bg-gradient-to-b from-background to-muted/30">
        <div className="border-b p-4 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Voice Assistant
            </h1>
            <p className="text-sm text-muted-foreground">
              Ask questions, get instant voice responses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-8 py-4 max-w-2xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Start a Conversation
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Press and hold the microphone button to start speaking.
                    Release when you're done.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="space-y-3 animate-in fade-in-50">
                  <div className="bg-muted/50 p-4 rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Mic className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Your Message</p>
                    </div>
                    <p className="text-sm">{msg.transcript}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">
                        Assistant's Response
                      </p>
                    </div>
                    <p className="text-sm mb-3">{msg.response}</p>
                    <div className="bg-background/80 rounded-lg p-2 border">
                      <audio
                        key={msg.timestamp.getTime()}
                        src={getOrCreateAudioUrl(msg)}
                        controls
                        className="w-full h-8"
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
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={messages.length === 0}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-5 w-5" />
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
              <div className="flex-1 flex justify-center">
                <Button
                  size="lg"
                  variant={state.isRecording ? "destructive" : "default"}
                  onClick={state.isRecording ? stopRecording : startRecording}
                  disabled={state.isProcessing || state.isPlaying}
                  className={`h-16 w-16 rounded-full transition-all duration-200 ${
                    state.isRecording
                      ? "shadow-lg shadow-destructive/20"
                      : state.isProcessing
                      ? "opacity-50"
                      : "hover:shadow-lg hover:shadow-primary/20"
                  }`}
                >
                  {state.isRecording ? (
                    <Square className="h-6 w-6 animate-pulse" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>
              <div className="w-10 h-10" /> {/* Spacer for alignment */}
            </div>

            {state.isProcessing && (
              <div className="text-center mt-4 animate-in fade-in-0 slide-in-from-bottom-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border text-sm text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Processing your request...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
