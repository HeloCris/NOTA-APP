import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const orders = [
  { id: '105', date: '22 set. 2026', item: 'Eclat No. 04 e mais 1 item', total: 'R$ 358,00', status: 'Enviado', icon: 'bus-outline' as const, statusColor: '#A85A38', statusBackground: '#F7E8E1' },
  { id: '98', date: '17 set. 2026', item: 'Vetiver Serein', total: 'R$ 189,00', status: 'Entregue', icon: 'checkmark-circle-outline' as const, statusColor: '#4C663F', statusBackground: '#EDF2E9' },
];

export default function OrdersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Voltar" style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#273847" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Pedidos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>ACOMPANHAMENTO</Text>
          <Text style={styles.heading}>Suas compras, do jeito que você gosta de acompanhar.</Text>
        </View>

        {orders.map((order) => (
          <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.75} onPress={() => router.push(`/(shop)/orders/${order.id}` as any)}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                <Text style={styles.date}>{order.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: order.statusBackground }]}>
                <Ionicons name={order.icon} size={14} color={order.statusColor} />
                <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.item}>{order.item}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.total}>{order.total}</Text>
              <View style={styles.detailsAction}><Text style={styles.detailsText}>Ver detalhes</Text><Ionicons name="chevron-forward" size={16} color="#4A6072" /></View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F4F1EA', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', height: 58, justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  headerSpacer: { width: 40 },
  title: { color: '#273847', fontSize: 17, fontWeight: '800' },
  content: { paddingBottom: 36, paddingHorizontal: 20 },
  intro: { paddingBottom: 22, paddingTop: 14 },
  eyebrow: { color: '#A85A38', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 },
  heading: { color: '#273847', fontSize: 24, fontWeight: '800', letterSpacing: 0, lineHeight: 31, maxWidth: 340 },
  orderCard: { backgroundColor: '#FFFFFF', borderColor: '#E8E3D8', borderRadius: 12, borderWidth: 1, marginBottom: 13, padding: 17, shadowColor: '#273847', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { color: '#273847', fontSize: 15, fontWeight: '800' },
  date: { color: '#9A9488', fontSize: 12, marginTop: 4 },
  statusBadge: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { backgroundColor: '#EEEAE1', height: 1, marginVertical: 15 },
  item: { color: '#57534E', fontSize: 13 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 },
  total: { color: '#273847', fontSize: 14, fontWeight: '800' },
  detailsAction: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  detailsText: { color: '#4A6072', fontSize: 12, fontWeight: '700' },
});