import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface StatusBannerProps {
  message?: string | null;
  tone?: "error" | "info";
}

export function StatusBanner({ message, tone = "info" }: StatusBannerProps) {
  if (!message) return null;
  return (
    <View style={[styles.container, tone === "error" ? styles.error : styles.info]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm
  },
  error: {
    backgroundColor: "#ffebee",
    borderColor: colors.red,
    borderWidth: 1
  },
  info: {
    backgroundColor: "#e3f2fd",
    borderColor: colors.blue,
    borderWidth: 1
  },
  text: {
    color: colors.grayDark
  }
});
