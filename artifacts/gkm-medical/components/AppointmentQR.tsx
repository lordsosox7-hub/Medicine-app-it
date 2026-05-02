import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface AppointmentQRProps {
  appointmentId: string;
  doctorName?: string;
  specialty?: string;
  date?: string;
  time?: string;
  status?: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  showRef?: boolean;
  refColor?: string;
}

export function AppointmentQR({
  appointmentId,
  doctorName,
  specialty,
  date,
  time,
  status,
  size = 180,
  color = "#000000",
  backgroundColor = "#ffffff",
  showRef = true,
  refColor,
}: AppointmentQRProps) {
  const ref = String(appointmentId).slice(0, 8).toUpperCase();

  const qrValue = JSON.stringify({
    id: appointmentId,
    ref,
    doctor: doctorName ?? "",
    specialty: specialty ?? "",
    date: date ?? "",
    time: time ?? "",
    status: status ?? "",
  });

  return (
    <View style={styles.wrap}>
      <QRCode
        value={qrValue}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        quietZone={10}
      />
      {showRef && (
        <Text
          style={[
            styles.ref,
            { color: refColor ?? color, fontFamily: "IBMPlexSansArabic_700Bold" },
          ]}
        >
          #{ref}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
  },
  ref: {
    fontSize: 14,
    letterSpacing: 2,
    textAlign: "center",
    writingDirection: "ltr",
  },
});
