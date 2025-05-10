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
  isRecording: boolean;
  isProcessing: boolean;
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

export default function Voice() {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    transcript: "",
    response: "",
    audioUrl: null,
  });

  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [audioUrls, setAudioUrls] = useState<AudioPlayer>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
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
    return new Blob([bytes], { type: 'audio/wav' });
  }, []);

  // Create Audio URL
  const createAudioUrl = useCallback((audioData: string): string => {
    const blob = base64toBlob(audioData);
    return URL.createObjectURL(blob);
  }, [base64toBlob]);

  // Initialize audio URLs and handle cleanup
  useEffect(() => {
    // Cleanup old URLs
    Object.values(audioUrls).forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error revoking URL:', error);
      }
    });

    // Create new URLs
    const newUrls: AudioPlayer = {};
    messages.forEach(msg => {
      if (msg.audioData) {
        try {
          const blob = base64toBlob(msg.audioData);
          newUrls[msg.timestamp.getTime()] = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error creating URL for message:', error);
        }
      }
    });
    setAudioUrls(newUrls);

    // Cleanup on unmount
    return () => {
      Object.values(newUrls).forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error cleaning up URL:', error);
        }
      });
    };
  }, [messages]);

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
          setState({
            isRecording: false,
            isProcessing: false,
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
          
          setMessages(prev => [...prev, newMessage]);
          
          // Create temporary URL for immediate playback
          const blob = base64toBlob(audioData);
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          
          // Clean up URL after playback
          audio.onended = () => URL.revokeObjectURL(url);
          audio.play().catch(error => {
            console.error('Error playing audio:', error);
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
            <Button
              size="lg"
              variant={state.isRecording ? "destructive" : "default"}
              onClick={state.isRecording ? stopRecording : startRecording}
              disabled={state.isProcessing}
              className="h-16 w-16 rounded-full"
            >
              {state.isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
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
