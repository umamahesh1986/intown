import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore, NotificationItem } from '../store/notificationStore';

interface Props {
  iconSize?: number;
  iconColor?: string;
  buttonStyle?: any;
}

const timeAgo = (ts: number) => {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

export const NotificationBell: React.FC<Props> = ({
  iconSize = 22,
  iconColor = '#333',
  buttonStyle,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useNotificationStore((s) => s.items);
  const hydrate = useNotificationStore((s) => s.hydrate);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const unread = items.filter((n) => !n.read).length;

  const handleTap = (n: NotificationItem) => {
    markRead(n.id);
    setOpen(false);
    // Route to my-orders / merchant-orders with tab + highlight
    router.push({
      pathname: n.targetRoute,
      params: { tab: n.targetTab, highlightId: n.pickup_id },
    });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.iconBtn, buttonStyle]}
        onPress={() => setOpen(true)}
        testID="notification-bell-btn"
      >
        <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />
        {unread > 0 && (
          <View style={styles.badge} testID="notification-badge">
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              <View style={styles.headerActions}>
                {items.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={markAllRead}
                      testID="notif-mark-all-read"
                      style={styles.headerActionBtn}
                    >
                      <Text style={styles.headerActionText}>Mark all read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clear} testID="notif-clear-all" style={styles.headerActionBtn}>
                      <Text style={[styles.headerActionText, { color: '#D32F2F' }]}>Clear</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={() => setOpen(false)} testID="notif-close">
                  <Ionicons name="close" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.empty} testID="notif-empty">
                <Ionicons name="notifications-off-outline" size={40} color="#CCC" />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubText}>
                  We'll let you know when you place an order or when a new one comes in.
                </Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, !item.read && styles.itemUnread]}
                    onPress={() => handleTap(item)}
                    testID={`notif-item-${item.id}`}
                  >
                    <View style={styles.itemIconWrap}>
                      <Ionicons
                        name={
                          item.kind === 'ORDER_RECEIVED_MERCHANT'
                            ? 'storefront'
                            : item.kind === 'ORDER_PICKED_UP_MERCHANT'
                              ? 'hand-left-outline'
                              : item.kind === 'ORDER_STATUS_CUSTOMER'
                                ? 'time-outline'
                                : 'bag-check-outline'
                        }
                        size={18}
                        color="#FF8A00"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={styles.itemTime}>{timeAgo(item.timestamp)}</Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#D32F2F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 72 : 88,
    paddingHorizontal: 12,
  },
  panel: {
    alignSelf: 'flex-end',
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } as any
      : { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActionBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  headerActionText: { fontSize: 11, fontWeight: '700', color: '#FF8A00' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#666', marginTop: 10 },
  emptySubText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  itemUnread: { backgroundColor: '#FFF9F0' },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  itemBody: { fontSize: 12, color: '#555', lineHeight: 16 },
  itemTime: { fontSize: 10, color: '#999', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF8A00', alignSelf: 'center' },
  sep: { height: 1, backgroundColor: '#F5F5F5' },
});

export default NotificationBell;
