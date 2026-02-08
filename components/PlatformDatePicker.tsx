import React, { useState, createElement } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface PlatformDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    maximumDate?: Date;
    minimumDate?: Date;
}

export default function PlatformDatePicker({
    value,
    onChange,
    label,
    maximumDate,
    minimumDate
}: PlatformDatePickerProps) {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onNativeDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type === "set" && selectedDate) {
            onChange(selectedDate);
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            {Platform.OS === 'web' ? (
                // Web-specific Date Picker
                <View style={styles.webWrapper}>
                    {createElement('input', {
                        type: 'date',
                        value: value instanceof Date && !isNaN(value.getTime())
                            ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
                            : '',
                        onChange: (e: any) => {
                            if (e.target.value) {
                                // Parse date string as local time (not UTC)
                                const parts = e.target.value.split('-');
                                const d = new Date(
                                    parseInt(parts[0]),
                                    parseInt(parts[1]) - 1,
                                    parseInt(parts[2])
                                );
                                if (!isNaN(d.getTime())) {
                                    onChange(d);
                                }
                            }
                        },
                        min: minimumDate
                            ? `${minimumDate.getFullYear()}-${String(minimumDate.getMonth() + 1).padStart(2, '0')}-${String(minimumDate.getDate()).padStart(2, '0')}`
                            : undefined,
                        max: maximumDate
                            ? `${maximumDate.getFullYear()}-${String(maximumDate.getMonth() + 1).padStart(2, '0')}-${String(maximumDate.getDate()).padStart(2, '0')}`
                            : undefined,
                        style: {
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f8f9fa',
                            fontSize: '15px',
                            color: '#1a1a1a',
                            width: '100%',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontFamily: 'system-ui'
                        }
                    })}
                </View>
            ) : (
                // Native Date Picker
                <>
                    <TouchableOpacity
                        style={styles.nativeBtn}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.nativeBtnText}>
                            {value.toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </Text>
                        <Text>📅</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={value}
                            mode="date"
                            display="default"
                            onChange={onNativeDateChange}
                            maximumDate={maximumDate}
                            minimumDate={minimumDate}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    webWrapper: {
        width: '100%',
    },
    nativeBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    nativeBtnText: {
        fontSize: 15,
        color: "#1a1a1a",
    },
});
