import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

export type OrderTimelineStep = {
  label: string;
  description: string;
  date?: string;
  completed: boolean;
  current?: boolean;
};

type OrderTimelineProps = {
  steps: OrderTimelineStep[];
};

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const tone = step.current ? '#A85A38' : step.completed ? '#5C6B4E' : '#C8C4BA';

        return (
          <View key={step.label} style={styles.stepRow}>
            <View style={styles.markerColumn}>
              <View style={[styles.marker, { borderColor: tone }, step.completed && { backgroundColor: tone }]}>
                {step.completed ? (
                  <Ionicons name={step.current ? 'bus' : 'checkmark'} size={step.current ? 14 : 17} color="#FFFFFF" />
                ) : null}
              </View>
              {!isLast && <View style={[styles.connector, { backgroundColor: step.completed ? '#AEB9A6' : '#DDD8CD' }]} />}
            </View>
            <View style={[styles.stepContent, !isLast && styles.stepContentSpacing]}>
              <Text style={[styles.stepLabel, step.completed && styles.completedLabel]}>{step.label}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
              {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { marginTop: 4 },
  stepRow: { flexDirection: 'row', minHeight: 72 },
  markerColumn: { alignItems: 'center', width: 30 },
  marker: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  connector: { flex: 1, marginVertical: 5, width: 2 },
  stepContent: { flex: 1, paddingLeft: 13 },
  stepContentSpacing: { paddingBottom: 10 },
  stepLabel: { color: '#78716C', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  completedLabel: { color: '#273847' },
  stepDescription: { color: '#78716C', fontSize: 12, lineHeight: 17, marginTop: 2 },
  stepDate: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
});