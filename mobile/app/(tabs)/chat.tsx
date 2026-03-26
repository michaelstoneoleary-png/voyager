import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost, API_BASE, getSessionCookie } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface Message { id: number; role: "user" | "assistant"; content: string; }
interface Conversation { id: number; title: string; }

export default function ChatScreen() {
  const queryClient = useQueryClient();
  const { prompt: deepLinkPrompt } = useLocalSearchParams<{ prompt?: string }>();
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const promptConsumed = useRef(false);

  // Pre-fill input when opened via notification deep link
  useEffect(() => {
    if (deepLinkPrompt && !promptConsumed.current) {
      promptConsumed.current = true;
      setInput(deepLinkPrompt);
    }
  }, [deepLinkPrompt]);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: () => conversationId
      ? apiGet<{ messages: Message[] }>(`/api/conversations/${conversationId}`).then(d => d.messages)
      : Promise.resolve([]),
    enabled: !!conversationId,
  });

  const createConversation = useMutation({
    mutationFn: () => apiPost<Conversation>("/api/conversations", { title: "Mobile chat" }),
    onSuccess: (c) => setConversationId(c.id),
  });

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    let convId = conversationId;
    if (!convId) {
      const c = await createConversation.mutateAsync();
      convId = c.id;
    }

    // Optimistically add user message
    queryClient.setQueryData(["messages", convId], (old: Message[] = []) => [
      ...old,
      { id: Date.now(), role: "user", content: text },
    ]);

    setIsStreaming(true);
    setStreamingText("");

    try {
      const cookie = await getSessionCookie();
      const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({ content: text }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.delta?.text ?? parsed?.text ?? "";
              full += delta;
              setStreamingText(full);
            } catch {}
          }
        }
      }

      queryClient.setQueryData(["messages", convId], (old: Message[] = []) => [
        ...old,
        { id: Date.now() + 1, role: "assistant", content: full },
      ]);
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const allMessages: Message[] = [
    ...messages,
    ...(isStreaming && streamingText
      ? [{ id: -1, role: "assistant" as const, content: streamingText }]
      : []),
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Marco</Text>
        <Text style={styles.subtitle}>Your AI travel advisor</Text>
      </View>

      {allMessages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Ask Marco anything</Text>
          {["What should I pack for Kyoto in April?", "Best restaurants in Lisbon?", "Do I need a visa for Japan?"].map(q => (
            <TouchableOpacity key={q} style={styles.suggestion} onPress={() => { setInput(q); }}>
              <Text style={styles.suggestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={allMessages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                {item.content}
              </Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Marco..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.send, (!input.trim() || isStreaming) && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 22, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  messages: { padding: spacing.md, gap: spacing.sm },
  bubble: { maxWidth: "85%", borderRadius: radius.lg, padding: spacing.md },
  bubbleUser: { backgroundColor: colors.primary, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.surface, alignSelf: "flex-start", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAssistant: { color: colors.text },
  inputRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "flex-end" },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 120 },
  send: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
  empty: { flex: 1, padding: spacing.xl, justifyContent: "center", gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontFamily: typography.serif, fontWeight: "600", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  suggestion: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  suggestionText: { fontSize: 14, color: colors.primary },
});
