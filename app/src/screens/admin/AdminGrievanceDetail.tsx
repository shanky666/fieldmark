import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../constants/colors';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import GrievanceBubble from '../../components/GrievanceBubble';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type AdminGrievanceDetailRouteProp = RouteProp<AdminStackParamList, 'AdminGrievanceDetail'>;
type AdminGrievanceDetailNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminGrievanceDetail'>;

interface AdminGrievanceDetailProps {
  route: AdminGrievanceDetailRouteProp;
  navigation: AdminGrievanceDetailNavigationProp;
}

export default function AdminGrievanceDetail({ route, navigation }: AdminGrievanceDetailProps) {
  const { threadId, employeeName } = route.params;
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [otherParty, setOtherParty] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get(`/api/grievances/${threadId}/messages/`);
      const msgList = res.data;
      setMessages(msgList);
      
      if (msgList.length > 0) {
        setIsResolved(msgList[0].is_resolved);
        const party = msgList[0].sender === userProfile?.id ? msgList[0].recipient_detail : msgList[0].sender_detail;
        setOtherParty(party);
      }

      await apiClient.patch(`/api/grievances/${threadId}/read/`);
    } catch (e) {
      console.error("Failed to load message thread history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [threadId]);

  const handleSend = async () => {
    if (!replyText.trim()) return;

    setSending(true);
    const textToSend = replyText;
    setReplyText('');

    try {
      await apiClient.post(`/api/grievances/${threadId}/reply/`, {
        message: textToSend
      });
      await fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (e) {
      console.error("Failed to send reply", e);
      setReplyText(textToSend); 
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    try {
      await apiClient.patch(`/api/grievances/${threadId}/resolve/`);
      setIsResolved(true);
      fetchMessages();
    } catch (e) {
      console.error("Failed to resolve thread", e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelf = item.sender === userProfile?.id;
    return (
      <GrievanceBubble
        message={item.message}
        attachmentUrl={item.attachment_url}
        isRead={item.is_read}
        isSelf={isSelf}
        timestamp={item.created_at}
        senderName={item.sender_detail?.name || 'User'}
      />
    );
  };

  const canResolve = !isResolved;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{employeeName}</Text>
            <Text style={styles.headerSubtitle}>
              {isResolved ? "Thread Resolved" : "Thread Open"}
            </Text>
          </View>
          {canResolve ? (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Text style={styles.resolveBtnText}>Resolve</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 60 }} />}
        </View>

        {otherParty && (
          <View style={styles.partyDetailsBox}>
            <Text style={styles.partyDetailText}>Employee Name: {otherParty.name}</Text>
            <Text style={styles.partyDetailText}>Employee ID: {otherParty.employee_id || 'N/A'}</Text>
            <Text style={styles.partyDetailText}>Zone: {otherParty.zone_detail?.name || 'N/A'}</Text>
            {otherParty.supervisor_name && (
              <Text style={styles.partyDetailText}>Supervisor: {otherParty.supervisor_name}</Text>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages in this thread.</Text>
          }
        />
      )}

      {!isResolved ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your response (Admin)..."
            placeholderTextColor={COLORS.lightText}
            value={replyText}
            onChangeText={setReplyText}
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
            disabled={sending || !replyText.trim()}
            onPress={handleSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendBtnText}>➔</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resolvedFooter}>
          <Text style={styles.resolvedFooterText}>
            This conversation is marked resolved.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0faf0',
    paddingTop: 44,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyDetailsBox: {
    marginTop: 8,
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 8,
  },
  partyDetailText: {
    fontSize: 12,
    color: COLORS.darkText,
    marginBottom: 2,
  },
  backBtn: {
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.darkText,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.lightText,
    marginTop: 2,
  },
  resolveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  resolveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageList: {
    paddingVertical: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.lightGray,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#a8dba8',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resolvedFooter: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  resolvedFooterText: {
    color: COLORS.lightText,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.lightText,
    fontSize: 13,
    marginTop: 40,
  },
});
