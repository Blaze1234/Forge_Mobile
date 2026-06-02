import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { colors, radius, spacing, shadow } from '../theme';

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const content = (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, loading }) {
  const variantStyle = {
    primary: { bg: colors.accent,       text: colors.white,         border: colors.accent },
    default: { bg: colors.white,        text: colors.textSecondary, border: colors.borderMed },
    danger:  { bg: colors.dangerLight,  text: colors.danger,        border: colors.dangerMid },
    ghost:   { bg: 'transparent',       text: colors.textMuted,     border: 'transparent' },
    success: { bg: colors.successLight, text: colors.success,       border: colors.successLight },
  }[variant];

  const sizeStyle = {
    sm: { paddingVertical: 6,  paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 9,  paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 13, paddingHorizontal: 22, fontSize: 16 },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderRadius: radius.md, borderWidth: 1,
        backgroundColor: variantStyle.bg, borderColor: variantStyle.border,
        paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal,
        opacity: disabled ? 0.5 : 1,
      }]}
    >
      {loading ? <ActivityIndicator size="small" color={variantStyle.text} /> : null}
      {icon && !loading ? React.cloneElement(icon, { size: sizeStyle.fontSize + 2, color: variantStyle.text }) : null}
      <Text style={{ fontSize: sizeStyle.fontSize, fontWeight: '500', color: variantStyle.text }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textPlaceholder}
        {...props}
      />
    </View>
  );
}

// ── Select (segmented) ────────────────────────────────────────────────────────
export function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = {
    low:      colors.priorityLow,
    medium:   colors.priorityMedium,
    high:     colors.priorityHigh,
    critical: colors.priorityCritical,
  };
  const s = map[priority] ?? map.medium;
  return (
    <View style={{ backgroundColor: s.bg, borderColor: s.border, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '500', color: s.text, textTransform: 'capitalize' }}>{priority}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'on-hold':       colors.statusOnHold,
    'working-on-it': colors.statusWorking,
    'completed-it':  colors.statusCompleted,
  };
  const labels = { 'on-hold': 'On Hold', 'working-on-it': 'Working', 'completed-it': 'Done' };
  const s = map[status] ?? map['working-on-it'];
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }} />
      <Text style={{ fontSize: 11, fontWeight: '500', color: s.text }}>{labels[status]}</Text>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = colors.accent, height = 4 }) {
  return (
    <View style={{ height, backgroundColor: colors.borderMed, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ height, width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 14, color: colors.textFaint, textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textFaint, letterSpacing: 0.8, textTransform: 'uppercase' }}>{title}</Text>
      {action}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  label: {
    fontSize: 12, fontWeight: '500', color: colors.textMuted, marginBottom: 5,
  },
  input: {
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderMed,
    borderRadius: radius.md, padding: spacing.md, fontSize: 14,
    color: colors.textPrimary,
  },
  segmented: {
    flexDirection: 'row', backgroundColor: colors.bgPage,
    borderRadius: radius.md, padding: 3, borderWidth: 1, borderColor: colors.border,
  },
  segment: {
    flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: radius.sm - 1,
  },
  segmentActive: {
    backgroundColor: colors.white, ...shadow.sm,
  },
  segmentText: { fontSize: 12, fontWeight: '400', color: colors.textFaint },
  segmentTextActive: { fontWeight: '600', color: colors.textPrimary },
});
